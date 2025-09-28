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
      'أنت مساعد متخصص في تحليل منتجات الملابس العربية. استخرج بدقة وفق المطلوب والقيود التالية:',
      '',
      'المطلوب:',
      '1) name: اسم كامل وقوي (نوع المنتج + 2-3 صفات مميزة).',
      '2) description: 2-3 جمل جمالية تركز على الخامة/الجودة/الاستخدام، بدون أسعار/مقاسات/ألوان.',
      '3) price_range: استخرج فقط السعر الشمالي/القديم (مثل: عمله قديم/ريال قديم/سعر شمال). تجاهل تماماً: عمله جديد/ريال جديد/جنوب/قعيطي/عملة جديدة.',
      '4) sizes: جميع المقاسات المذكورة.',
      '5) tags: 4-6 كلمات مناسبة للسيو.',
      '6) (اختياري) notes/confidence.',
      '',
      'القيود الصارمة:',
      '- الاسم يجب أن يكون وصفياً وكاملاً (≤ 60 حرفاً)، بلا رموز/ضوضاء.',
      '- الوصف جمالي بحت؛ ممنوع ذكر الأسعار/المقاسات/الألوان/العملات.',
      '- ركّز على استخراج السعر الشمالي/القديم فقط، وتجاهل أي أسعار أخرى.',
      '- أعد JSON فقط وفق المخطط التالي دون أي نص إضافي.',
      '',
      'مخطط JSON:',
      '{"name": string?, "description": string?, "tags": string[]?, "sizes": string[]?, "price_range": {"low": number, "high": number}? , "notes": string?, "confidence": number?, "reasons": Record<string,string>? }'
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
    // Post-sanitize to enforce user rules on description and name
    const data = { ...out.data }
    const rawText = String((input as any)?.text || '')
    const norm = (s:string)=> String(s||'').normalize('NFKC').replace(/[\u064B-\u065F]/g,'').replace(/\u0640/g,'')
    const has = (re:RegExp)=> re.test(rawText)
    const colorWords = /(أسود|اسود|أبيض|ابيض|أحمر|احمر|أزرق|ازرق|أخضر|اخضر|أصفر|اصفر|بنفسجي|وردي|بيج|رمادي|ذهبي|فضي|ذهبيه|فضيه|Gold|Silver|Black|White|Red|Blue|Green|Purple|Pink|Beige|Gray)/gi
    const sizeTokens = /\b(XXL|XL|L|M|S|XS|\d{2})\b/gi
    const priceTokens = /(سعر|العمله|العملة|ريال|﷼|\$|USD|EGP|AED|KWD|QR)[^\.\n]*/gi
    const weightContext = /(وزن|يلبس\s*الى|يلبس\s*إلى|حتى\s*وزن)/i
    if (typeof data.description === 'string' && data.description) {
      const originalName = String(data.name||'').trim()
      const nameTerms = originalName.split(/\s+/).filter(Boolean)
      let desc = data.description
      // remove colors/sizes/prices/currency tokens from description
      desc = desc.replace(colorWords,'')
                 .replace(sizeTokens,'')
                 .replace(priceTokens,'')
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
    // Sanitize/compose name: ensure type noun present and strip colors/sizes/prices
    if (typeof data.name === 'string') {
      let name = data.name || ''
      name = name.replace(colorWords,'').replace(sizeTokens,'').replace(priceTokens,'').replace(/\s{2,}/g,' ').trim()
      const typeFromText = (()=>{
        if (/(لانجري|لنجري|lingerie)/i.test(rawText)) return 'لانجري'
        if (/(فستان|فستان\s*طويل|فسان)/i.test(rawText)) return 'فستان'
        if (/(جلابيه|جلابية)/i.test(rawText)) return 'جلابية'
        if (/(عبايه|عباية)/i.test(rawText)) return 'عباية'
        if (/(قميص)/i.test(rawText)) return 'قميص'
        if (/(بلوزه|بلوزة)/i.test(rawText)) return 'بلوزة'
        return ''
      })()
      const hasTypeInName = /(فستان|جلابية|عباية|قميص|بلوزة|لانجري)/.test(name)
      const longFlag = /(طويله|طويل)/i.test(rawText)
      const embFlag = /(تطريز|مطرز)/i.test(rawText)
      const crystalFlag = /كريستال|كرستال/i.test(rawText)
      const occasionFlag = /(مناسب\s*للمناسبات|سهرة)/i.test(rawText)
      if (!hasTypeInName) {
        const base = typeFromText || 'فستان'
        const parts: string[] = [base]
        if (base === 'فستان' && longFlag) parts.push('طويل')
        if (embFlag) parts.push('مطرز')
        if (crystalFlag) parts.push('بالكريستال')
        if (base === 'فستان' && occasionFlag) parts.splice(1, 0, 'سهرة')
        name = parts.join(' ').replace(/\s{2,}/g,' ').trim()
      }
      if (!name) name = typeFromText || 'فستان'
      data.name = name.slice(0,60)
    }
    // Derive/fix price_range from raw text: prefer "قديم" > "للشمال" > "سعر البيع"; ignore weight numbers; require > 100
    try {
      const text = rawText
      const num = (s:string)=> Number(String(s).replace(/[٬٫,]/g,'.'))
      const old = text.match(/(?:قديم|القديم)[^\d]{0,12}(\d+[\.,٬٫]?\d*)/i)
      const north = text.match(/(?:للشمال|الشمال)[^\d]{0,12}(\d+[\.,٬٫]?\d*)/i)
      const sale = text.match(/(?:سعر\s*البيع|السعر\s*البيع|السعر)[^\d]{0,12}(\d+[\.,٬٫]?\d*)/i)
      const pick = old?.[1] ? num(old[1]) : (north?.[1] ? num(north[1]) : (sale?.[1] ? num(sale[1]) : undefined))
      const hasWeightNum = weightContext.test(text) && /\b(\d{2,3})\b/.test(text)
      if (data.price_range && typeof data.price_range.low === 'number') {
        const low = Number(data.price_range.low)
        if (!Number.isFinite(low) || low <= 100 || hasWeightNum) {
          delete (data as any).price_range
        }
      }
      if (!data.price_range && pick!==undefined && Number.isFinite(pick) && pick>100) {
        const high = sale?.[1] ? num(sale[1]) : pick
        ;(data as any).price_range = { low: pick, high: Number.isFinite(high)? Number(high): pick }
      }
    } catch {}
    return data
  } catch { return null } finally { clearTimeout(t) }
}

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
    const systemPrompt = [
      'أنت مساعد متخصص في تحليل منتجات الملابس العربية. استخرج بدقة النتيجة وفق التنسيق التالي:',
      '',
      'المطلوب:',
      '1) name: اسم طويل وشامل (8-12 كلمة) يلخص أبرز المواصفات.',
      '2) description: جدول منظم (سطر لكل بند) كالتالي:',
      '   • الخامة: [نوع القماش وجودته]',
      '   • الصناعة: [مكان الصنع ومستوى الجودة]',
      '   • التصميم: [النمط والقطع والإضافات]',
      '   • الألوان: [جميع الألوان المذكورة]',
      '   • المقاسات: [جميع المقاسات المذكورة]',
      '   • الميزات: [أبرز 3 مميزات]',
      '   - [أي حقل إضافي موجود في النص]: [قيمته]',
      '3) price: استخرج فقط السعر الشمالي/القديم (عمله قديم/ريال قديم/سعر شمال/عملة قديمة). تجاهل أي أسعار أخرى.',
      '4) colors: جميع الألوان المحددة.',
      '5) sizes: جميع المقاسات.',
      '6) keywords: 4-6 كلمات سيو.',
      '7) stock (اختياري): إذا وجد رقم واضح للمخزون.',
      '',
      'قيود:',
      '- الاسم طويل ووصفي بلا رموز.',
      '- الوصف جدول (قائمة نقطية)، بلا أسعار/مقاسات/ألوان إلا داخل الجدول.',
      '- السعر: شمالي/قديم فقط.',
      '',
      'أعد JSON فقط بهذه الحقول: {"name":string,"description":string,"price":number?,"colors":string[]?,"sizes":string[]?,"keywords":string[]?,"stock":number?}'
    ].join('\n')
    const payload = {
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: JSON.stringify({ text: input.text }) }
      ],
      temperature: 0,
      max_tokens: 700
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
    try { return JSON.parse(slice) } catch { return null }
  } catch { return null } finally { clearTimeout(t) }
}