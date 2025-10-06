export type HfNerEntity = { entity_group?: string; word?: string; score?: number; start?: number; end?: number };

export async function callHfNER(opts: { apiKey: string; model: string; text: string; timeoutMs?: number }): Promise<HfNerEntity[] | null> {
  const { apiKey, model, text, timeoutMs = 12000 } = opts;
  const ctrl = new AbortController();
  const t = setTimeout(()=> ctrl.abort(), timeoutMs);
  try{
    const url = `https://api-inference.huggingface.co/models/${encodeURIComponent(model)}`;
    const r = await fetch(url, {
      method:'POST',
      headers:{ 'authorization': `Bearer ${apiKey}`, 'content-type':'application/json' },
      body: JSON.stringify({ inputs: text, parameters: { aggregation_strategy: 'simple', wait_for_model: true } }),
      signal: ctrl.signal
    });
    if (!r.ok) return null;
    const j: any = await r.json().catch(()=> null);
    if (!Array.isArray(j)) return null;
    return j as HfNerEntity[];
  } finally { clearTimeout(t); }
}
