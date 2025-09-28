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
      'أنت محرّر عربي لبيانات منتج. عدّل فقط الحقول الناقصة/الضعيفة دون اختراع حقول جديدة.',
      '',
      'افعل (DO):',
      '- حسّن الاسم ≤ 60 حرفاً، بلا رموز/ضوضاء، وأبرز الهوية (خليجي/ربطة خصر/تطريز/كريستال) إن وُجدت.',
      '- اكتب وصفاً مهنياً من 2–3 جمل يركّز على الخامة/التشطيب/الراحة/الاستخدام.',
      '- استخرج price_range.low من "قديم" أو "الشمال" عند وجودهما (تجاهل < 80).',
      '- حرّر الوسوم ≤ 6 كلمات دقيقة ذات صلة.',
      '',
      'لا تفعل (DO NOT):',
      '- لا تكرر الاسم أو مفرداته/مرادفاته في الوصف.',
      '- لا تذكر أسعار أو عملات أو مخزون أو ألوان أو مقاسات داخل الوصف.',
      '- لا تنتج نصاً حرّاً خارج JSON، ولا تضف حقولاً غير معرّفة في المخطط.',
      '',
      'مخطط JSON الصارم (حقول اختيارية لكن القيم يجب أن تطابق النوع عند الإرجاع):',
      '{"name": string?, "description": string?, "tags": string[]?, "sizes": string[]?, "price_range": {"low": number, "high": number}? , "notes": string?, "confidence": number?, "reasons": Record<string,string>? }',
      '',
      'مثال إخراج صالح:',
      '{"name":"جلابية خليجية مطرزة بالكريستال مع ربطة خصر","description":"خامة شيفون مبطنة بلمسة مريحة وتشطيب متقن يمنح إطلالة أنيقة مناسبة للاستخدام اليومي والمناسبات. تفاصيل دقيقة تلفت الانتباه مع إحساس خفيف بالحركة.","tags":["جلابية خليجية","تطريز","كريستال","شيفون","مبطن","أكمام طويلة"],"price_range":{"low":4000,"high":12500}}',
      '',
      'أعد JSON فقط، بدون شروح أو أسطر زائدة.'
    ].join('\n')
    const payload = {
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: JSON.stringify(input) }
      ],
      temperature: 0,
      max_tokens: 500
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
    const out = DeepseekOutputSchema.safeParse(parsed)
    if (!out.success) return null
    // Post-sanitize to enforce user rules on description
    const data = { ...out.data }
    if (typeof data.description === 'string' && data.description) {
      const originalName = String(data.name||'').trim()
      const nameTerms = originalName.split(/\s+/).filter(Boolean)
      let desc = data.description
      // remove colors/sizes/prices/currency tokens from description
      desc = desc.replace(/\b(?:أسود|أحمر|أبيض|بنفسجي|أزرق|أخضر|رمادي|بيج|Pink|Red|Black|White|Blue|Green|Purple)\b/gi,'')
                 .replace(/\b(?:XS|S|M|L|XL|XXL|\d{2})\b/g,'')
                 .replace(/(?:سعر|العملة|ريال|﷼|\$|USD|EGP|AED|KWD|QR)[^\.\n]*/gi,'')
      // remove name lexemes from description
      for (const term of nameTerms) {
        if (term.length < 3) continue
        const re = new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}\\b`, 'gi')
        desc = desc.replace(re, '').replace(/\s{2,}/g,' ').trim()
      }
      // normalize punctuation/spaces
      desc = desc.replace(/\s*،\s*/g, '، ').replace(/\s*\.\s*/g, '. ').replace(/\s{2,}/g,' ').replace(/^،\s*/,'').trim()
      data.description = desc
    }
    return data
  } catch { return null } finally { clearTimeout(t) }
}