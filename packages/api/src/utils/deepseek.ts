import { z } from 'zod'

export const DeepseekOutputSchema = z.object({
  name: z.string().min(3).max(60).optional(),
  description: z.string().min(30).max(400).optional(),
  tags: z.array(z.string().min(2)).max(6).optional(),
  sizes: z.array(z.string()).max(20).optional(),
  price_range: z.object({ low: z.number().nonnegative(), high: z.number().nonnegative() }).optional(),
  notes: z.string().optional(),
  confidence: z.number().min(0).max(1).optional(),
  reasons: z.record(z.string()).optional(),
})

export type DeepseekOutput = z.infer<typeof DeepseekOutputSchema>

export async function callDeepseek(opts: {
  apiKey: string
  model: string
  input: { text: string; base: any }
  timeoutMs?: number
}): Promise<DeepseekOutput | null> {
  const { apiKey, model, input } = opts
  const timeoutMs = Math.min(Math.max(opts.timeoutMs ?? 12000, 3000), 20000)
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const systemPrompt = [
      'أنت مصحّح عربي لبيانات منتج. اعد صياغة فقط الحقول الناقصة/الضعيفة بصيغة عربية فصيحة.',
      'قيود صارمة:',
      '- الاسم ≤ 60 حرفاً، بلا ضوضاء/رموز.',
      '- الوصف 3 جمل موجزة، لا تكرر الاسم، لا تذكر أسعار/مقاسات.',
      '- السعر: فضّل "قديم" كتكلفة للـ low، تجاهل الأرقام < 80.',
      '- المقاسات: استنتج فري سايز من مدى الوزن إن وجد.',
      '- الوسوم ≤ 6، بلا تسويق عام.',
      'أعد JSON فقط بالمخطط المحدد.'
    ].join('\n')
    const payload = {
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: JSON.stringify(input) }
      ],
      temperature: 0.2,
      max_tokens: 500
    }
    const res = await (globalThis.fetch as typeof fetch)('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload),
      signal: ctrl.signal
    })
    if (!res.ok) return null
    const j = await res.json().catch(() => null) as any
    const content = j?.choices?.[0]?.message?.content || ''
    let parsed: any = null
    try { parsed = JSON.parse(content) } catch { return null }
    const out = DeepseekOutputSchema.safeParse(parsed)
    return out.success ? out.data : null
  } catch { return null } finally { clearTimeout(t) }
}