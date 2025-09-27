// Lightweight zero-shot classification wrapper with graceful fallback
// Uses @xenova/transformers if available at runtime; otherwise returns null

type ZSCResult = { label: string; score: number }[];

let zscPipeline: any = null;
let zscLoading: Promise<any> | null = null;

async function getPipeline(): Promise<any|null> {
  if (zscPipeline) return zscPipeline;
  if (zscLoading) return zscLoading;
  try {
    // Dynamic import to avoid build-time requirement
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const transformers = require('@xenova/transformers');
    const model = process.env.ZSC_MODEL || 'Xenova/xlm-roberta-large-xnli';
    zscLoading = transformers.pipeline('zero-shot-classification', model)
      .then((p: any) => { zscPipeline = p; return p; })
      .catch(() => null);
    return await zscLoading;
  } catch {
    return null;
  }
}

export async function classifySentences(text: string, labels: string[]): Promise<Record<string, ZSCResult>|null> {
  try {
    const pipe = await getPipeline();
    if (!pipe) return null;
    const sentences = String(text||'').split(/\n+|[.!؟!]+\s+/).map(s=> s.trim()).filter(Boolean).slice(0, 30);
    const out: Record<string, ZSCResult> = {};
    for (const s of sentences) {
      // @xenova returns single result when single input is passed
      const res = await pipe(s, labels, { multi_label: true });
      if (Array.isArray(res?.labels) && Array.isArray(res?.scores)) {
        res.labels.forEach((lab: string, i: number) => {
          const score = Number(res.scores[i] || 0);
          if (!out[lab]) out[lab] = [] as ZSCResult;
          out[lab].push({ label: s, score });
        });
      }
    }
    // Sort by score desc per label
    for (const lab of Object.keys(out)) out[lab].sort((a, b) => b.score - a.score);
    return out;
  } catch {
    return null;
  }
}

