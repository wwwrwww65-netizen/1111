import { z } from 'zod'

export const OpenRouterOutputSchema = z.object({
  name: z.string().min(3).max(60).optional(),
  description: z.string().min(10).max(600).optional(),
  tags: z.array(z.string().min(2)).max(8).optional(),
  sizes: z.array(z.string()).max(24).optional(),
  price_range: z.object({ low: z.number().nonnegative(), high: z.number().nonnegative() }).optional(),
  price: z.number().nonnegative().optional(),
  colors: z.array(z.string()).max(24).optional(),
  description_table: z.array(z.object({ key: z.string(), label: z.string(), value: z.string(), confidence: z.number().optional() })).optional(),
})

export type OpenRouterOutput = z.infer<typeof OpenRouterOutputSchema>

export async function callOpenRouterStrict(opts: {
  apiKey: string
  model: string
  input: { text: string }
  timeoutMs?: number
  referer?: string
  title?: string
}): Promise<OpenRouterOutput | null> {
  const { apiKey, model, input } = opts
  const timeoutMs = Math.min(Math.max(opts.timeoutMs ?? 20000, 3000), 30000)
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const systemPrompt = `أنت نظام تحليل منتجات صارم يُخرج JSON من النص فقط (بدون اختراع).

المطلوب (JSON فقط):
{
  "name": string?,
  "description": string?,
  "description_table": Array<{"key": string, "label": string, "value": string, "confidence"?: number}>?,
  "price": number?,
  "colors": string[]?,
  "sizes": string[]?,
  "keywords": string[]?
}

القواعد:
- المصدر الوحيد هو النص المُدخل. لا تُخمن إن غاب الدليل؛ احذف الحقل.
- name: جملة عربية موجزة (≤ 60 حرفاً) تصف النوع والصفات والاستخدام إن وُجد.
- description: 2-3 جمل جمالية بلا أسعار/مقاسات/ألوان.
- الأرقام بالأرقام الإنجليزية فقط.

«JSON فقط» دون أي سطور إضافية.`

    const payload = {
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: JSON.stringify({ text: input.text }) },
      ],
      temperature: 0.2,
      top_p: 0.8,
      max_tokens: 900,
      response_format: { type: 'json_object' as const },
    }

    const headers: Record<string, string> = {
      'content-type': 'application/json',
      'authorization': `Bearer ${apiKey}`,
    }
    if (opts.referer) headers['HTTP-Referer'] = opts.referer
    if (opts.title) headers['X-Title'] = opts.title

    const res = await (globalThis.fetch as typeof fetch)(
      'https://openrouter.ai/api/v1/chat/completions',
      { method: 'POST', headers, body: JSON.stringify(payload), signal: ctrl.signal }
    )
    if (!res.ok) return null
    const j = await res.json().catch(() => null) as any
    let content = String(j?.choices?.[0]?.message?.content || '')
    const fenceMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/i)
    if (fenceMatch) content = fenceMatch[1]
    const firstBrace = content.indexOf('{')
    const lastBrace = content.lastIndexOf('}')
    const slice = (firstBrace>=0 && lastBrace>firstBrace) ? content.slice(firstBrace, lastBrace+1) : content
    let parsed: any = null
    try { parsed = JSON.parse(slice) } catch { return null }

    // normalize Arabic/Indic digits inside strings
    const normalizeDigits = (s: string): string => {
      if (!s) return s
      const map: Record<string, string> = {
        '٠':'0','١':'1','٢':'2','٣':'3','٤':'4','٥':'5','٦':'6','٧':'7','٨':'8','٩':'9',
        '۰':'0','۱':'1','۲':'2','۳':'3','۴':'4','۵':'5','۶':'6','۷':'7','۸':'8','۹':'9'
      }
      return String(s).replace(/[٠-٩۰-۹]/g, d => map[d] || d)
    }
    const normAll = (val: any): any => {
      if (typeof val === 'string') return normalizeDigits(val)
      if (Array.isArray(val)) return val.map(v => typeof v === 'string' ? normalizeDigits(v) : v)
      if (val && typeof val === 'object') {
        const out: any = {}
        for (const [k,v] of Object.entries(val)) out[k] = normAll(v as any)
        return out
      }
      return val
    }
    const outNorm = normAll(parsed)
    const out = OpenRouterOutputSchema.safeParse(outNorm)
    if (!out.success) return null
    return out.data
  } catch { return null } finally { clearTimeout(t) }
}
