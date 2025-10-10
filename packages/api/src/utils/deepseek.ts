import { z } from 'zod'

export const DeepseekOutputSchema = z.object({
  name: z.string().min(3).max(60).optional(),
  description: z.string().min(30).max(400).optional(),
  tags: z.array(z.string().min(2)).max(12).optional(),
  sizes: z.array(z.string()).max(20).optional(),
  price_range: z.object({ low: z.number().nonnegative(), high: z.number().nonnegative() }).optional(),
  notes: z.string().optional(),
  confidence: z.number().min(0).max(1).optional(),
  reasons: z.record(z.string()).optional(),
})

export type DeepseekOutput = z.infer<typeof DeepseekOutputSchema>

// نظام مختصر جدًا
const SHORT_SYSTEM_PROMPT = `استخرج من نص المنتج التالي:
- name: اسم المنتج (8-12 كلمة)
- description: وصف المنتج كجدول بدون أسعار أو مقاسات أو ألوان
- tags: 8-12 كلمة مفتاحية
- sizes: المقاسات المذكورة
- price_range: السعر القديم فقط (تجاهل أي سعر آخر)

أعد JSON بدون تعليقات.`

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
    // تنظيف النص المدخل
    const cleanText = input.text
      .replace(/[^\w\s\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF|،\.\-:]/g, ' ') // إزالة الرموز
      .replace(/(احجزي الآن|لا تفوتي الفرصة|عرض خاص|عرض اليوم|🔥|👑|🌹|💃|👉🏻|👌🏻|💯|🌈|✍🏻|💰)/gi, '') // إزالة العبارات الترويجية
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 1000); // تحديد الطول

    const payload = {
      model,
      messages: [
        { role: 'system', content: SHORT_SYSTEM_PROMPT },
        { role: 'user', content: cleanText }
      ],
      temperature: 0.2,
      top_p: 0.8,
      max_tokens: 300, // تقليل الحد الأقصى للتوكنات في الرد
      response_format: { type: 'json_object' as const }
    }
    const endpoints = [
      'https://api.deepseek.com/v1/chat/completions',
      'https://api.deepseek.ai/v1/chat/completions',
      'https://api.deepseek.com/chat/completions'
    ]
    let res: Response | null = null
    let lastErr: any = null
    for (const url of endpoints){
      try{
        res = await (globalThis.fetch as typeof fetch)(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload),
      signal: ctrl.signal
    })
        if (res.ok) break
      }catch(e){ lastErr = e; res = null }
    }
    if (!res || !res.ok) return null
    const j = await res.json().catch(() => null) as any
    const rawContent = j?.choices?.[0]?.message?.content || ''
    let content = String(rawContent || '')
    // Attempt to extract JSON if wrapped in code fences or with leading text
    const fenceMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/i)
    if (fenceMatch) content = fenceMatch[1]
    const firstBrace = content.indexOf('{')
    const lastBrace = content.lastIndexOf('}')
    const slice = (firstBrace>=0 && lastBrace>firstBrace) ? content.slice(firstBrace, lastBrace+1) : content
    let parsed: any = null
    try { parsed = JSON.parse(slice) } catch { return null }
    
    // استخراج السعر القديم يدوياً من النص الأصلي
    const text = input.text;
    const oldPriceMatch = text.match(/(عمله قديم|ريال قديم|سعر قديم)[^\d]*(\d+[\d,.]*)/i);
    if (oldPriceMatch && oldPriceMatch[2]) {
      const price = parseFloat(oldPriceMatch[2].replace(/[^\d.]/g, ''));
      if (price > 100) {
        parsed.price_range = { low: price, high: price };
      }
    }
    
    // استخراج المقاسات يدوياً من النص الأصلي
    const sizesMatch = text.match(/(مقاساته|المقاسات|مقاس)[^\d]*(XXL|XL|L|M|S|XS|[\.\d\-\s]+)/i);
    if (sizesMatch && sizesMatch[2]) {
      const sizesText = sizesMatch[2];
      if (sizesText.includes('فري سايز') || sizesText.includes('مقاس واحد')) {
        parsed.sizes = ['فري سايز'];
      } else {
        const individualSizes = sizesText.match(/(XXL|XL|L|M|S|XS|\d+)/gi);
        if (individualSizes) {
          parsed.sizes = individualSizes.map((s: string) => s.trim().toUpperCase());
        }
      }
    }

    // التأكد من عدد الكلمات المفتاحية
    if (parsed.tags && parsed.tags.length > 12) {
      parsed.tags = parsed.tags.slice(0, 12);
    }

    const out = DeepseekOutputSchema.safeParse(parsed)
    if (!out.success) return null
    return out.data
  } catch { return null } finally { clearTimeout(t) }
}

// بالنسبة للدوال الأخرى، سنقوم بتقصير system prompt أيضًا ونظيف النص المدخل.

export async function callDeepseekPreview(opts: {
  apiKey: string
  model: string
  input: { text: string }
  timeoutMs?: number
}): Promise<{
  name?: string
  description?: string
  price?: number
  colors?: string[]
  sizes?: string[]
  keywords?: string[]
  stock?: number
} | null> {
  const { apiKey, model, input } = opts
  const timeoutMs = Math.min(Math.max(opts.timeoutMs ?? 15000, 3000), 20000)
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    // تنظيف النص
    const cleanText = input.text
      .replace(/[^\w\s\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF|،\.\-:]/g, ' ')
      .replace(/(احجزي الآن|لا تفوتي الفرصة|عرض خاص|عرض اليوم|🔥|👑|🌹|💃|👉🏻|👌🏻|💯|🌈|✍🏻|💰)/gi, '')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 1000);

    const systemPrompt = `استخرج من نص المنتج: name, description, price (القديم فقط), colors, sizes, keywords, stock. أعد JSON.`
    const payload = {
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: cleanText }
      ],
      temperature: 0.2,
      top_p: 0.8,
      max_tokens: 300,
      response_format: { type: 'json_object' as const }
    }
    const endpoints = [
      'https://api.deepseek.com/v1/chat/completions',
      'https://api.deepseek.ai/v1/chat/completions',
      'https://api.deepseek.com/chat/completions'
    ]
    let res: Response | null = null
    for (const url of endpoints) {
      try {
        res = await (globalThis.fetch as typeof fetch)(url, {
          method: 'POST',
          headers: { 'content-type': 'application/json', 'authorization': `Bearer ${apiKey}` },
          body: JSON.stringify(payload),
          signal: ctrl.signal
        })
        if (res.ok) break
      } catch {}
    }
    if (!res || !res.ok) return null
    const j = await res.json().catch(() => null) as any
    let content = String(j?.choices?.[0]?.message?.content || '')
    const fenceMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/i)
    if (fenceMatch) content = fenceMatch[1]
    const firstBrace = content.indexOf('{')
    const lastBrace = content.lastIndexOf('}')
    const slice = (firstBrace>=0 && lastBrace>firstBrace) ? content.slice(firstBrace, lastBrace+1) : content
    let parsed: any = null
    try { parsed = JSON.parse(slice) } catch { return null }
    
    // استخراج السعر يدوياً
    const oldPriceMatch = input.text.match(/(عمله قديم|ريال قديم)[^\d]*(\d+[\d,.]*)/i);
    if (oldPriceMatch && oldPriceMatch[2]) {
      const price = parseFloat(oldPriceMatch[2].replace(/[^\d.]/g, ''));
      if (price > 100) {
        parsed.price = price;
      }
    }
    
    return parsed
  } catch { return null } finally { clearTimeout(t) }
}

// ... وبالمثل for enforceLongNamePreview and callDeepseekPreviewStrict, نطبق نفس التغييرات.

export async function enforceLongNamePreview(opts: {
  apiKey: string
  model: string
  text: string
  attempts?: number
  timeoutMs?: number
}): Promise<{
  name?: string
  description?: string
  price?: number
  colors?: string[]
  sizes?: string[]
  keywords?: string[]
  stock?: number
} | null> {
  const attempts = Math.max(1, Math.min(5, opts.attempts ?? 3))
  for (let i=1;i<=attempts;i++){
    const r = await callDeepseekPreview({ apiKey: opts.apiKey, model: opts.model, input: { text: opts.text }, timeoutMs: opts.timeoutMs })
    const name = String(r?.name||'').trim()
    const wc = name.split(/\s+/).filter(Boolean).length
    if (r && wc >= 4 && !/^(فستان|لانجري|جلابية|عباية)$/i.test(name)) return r
    await new Promise(res=> setTimeout(res, 800))
  }
  return null
}

export async function callDeepseekPreviewStrict(opts: {
  apiKey: string
  model: string
  input: { text: string }
  timeoutMs?: number
}): Promise<{
  name?: string
  description?: string
  description_table?: Array<{ key: string; label: string; value: string; confidence?: number }>
  price?: number
  colors?: string[]
  sizes?: string[]
  keywords?: string[]
} | null> {
  const { apiKey, model, input } = opts
  const timeoutMs = Math.min(Math.max(opts.timeoutMs ?? 15000, 3000), 20000)
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    // تنظيف النص
    const cleanText = input.text
      .replace(/[^\w\s\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF|،\.\-:]/g, ' ')
      .replace(/(احجزي الآن|لا تفوتي الفرصة|عرض خاص|عرض اليوم|🔥|👑|🌹|💃|👉🏻|👌🏻|💯|🌈|✍🏻|💰)/gi, '')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 1000);

    const systemPrompt = `استخرج من نص المنتج: name, description, description_table, price (القديم فقط), colors, sizes, keywords. أعد JSON.`
    const payload = {
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: cleanText }
      ],
      temperature: 0.2,
      top_p: 0.8,
      max_tokens: 300,
      response_format: { type: 'json_object' as const }
    }
    const endpoints = [
      'https://api.deepseek.com/v1/chat/completions',
      'https://api.deepseek.ai/v1/chat/completions',
      'https://api.deepseek.com/chat/completions'
    ]
    let res: Response | null = null
    for (const url of endpoints) {
      try {
        res = await (globalThis.fetch as typeof fetch)(url, {
          method: 'POST',
          headers: { 'content-type': 'application/json', 'authorization': `Bearer ${apiKey}` },
          body: JSON.stringify(payload),
          signal: ctrl.signal
        })
        if (res.ok) break
      } catch {}
    }
    if (!res || !res.ok) return null
    const j = await res.json().catch(() => null) as any
    let content = String(j?.choices?.[0]?.message?.content || '')
    const fenceMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/i)
    if (fenceMatch) content = fenceMatch[1]
    const firstBrace = content.indexOf('{')
    const lastBrace = content.lastIndexOf('}')
    const slice = (firstBrace>=0 && lastBrace>firstBrace) ? content.slice(firstBrace, lastBrace+1) : content
    let parsed: any = null
    try { parsed = JSON.parse(slice) } catch { return null }
    
    // استخراج السعر يدوياً
    const oldPriceMatch = input.text.match(/(عمله قديم|ريال قديم)[^\d]*(\d+[\d,.]*)/i);
    if (oldPriceMatch && oldPriceMatch[2]) {
      const price = parseFloat(oldPriceMatch[2].replace(/[^\d.]/g, ''));
      if (price > 100) {
        parsed.price = price;
      }
    }
    
    return parsed
  } catch { return null } finally { clearTimeout(t) }
}
