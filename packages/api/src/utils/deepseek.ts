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
      '- استنتج سياق الاستخدام من النص: إن ذُكرت سهرة/مناسبات فاذكر المناسبات، إن ذُكر يومي/عملي/كاجوال فاذكر اليومي، وإلا تجنّب العبارات النمطية.',
      '- استخرج price_range.low من "قديم" أو "الشمال" عند وجودهما (تجاهل < 80).',
      '- حرّر الوسوم ≤ 6 كلمات دقيقة ذات صلة.',
      '',
      'لا تفعل (DO NOT):',
      '- لا تكرر الاسم أو مفرداته/مرادفاته في الوصف.',
      '- لا تذكر أسعار أو عملات أو مخزون أو ألوان أو مقاسات داخل الوصف.',
      '- لا تستخدم قوالب مكررة مثل "مناسب للاستخدام اليومي" بلا دلائل من النص.',
      '- لا تنتج نصاً حرّاً خارج JSON، ولا تضف حقولاً غير معرّفة في المخطط.',
      '',
      'مخطط JSON الصارم (حقول اختيارية لكن القيم يجب أن تطابق النوع عند الإرجاع):',
      '{"name": string?, "description": string?, "tags": string[]?, "sizes": string[]?, "price_range": {"low": number, "high": number}? , "notes": string?, "confidence": number?, "reasons": Record<string,string>? }',
      '',
      'مثال إخراج صالح:',
      '{"name":"جلابية خليجية مطرزة بالكريستال مع ربطة خصر","description":"خامة شيفون مبطنة بلمسة مريحة وتشطيب متقن يمنح إطلالة أنيقة. تفاصيل دقيقة تلفت الانتباه مع إحساس خفيف بالحركة.","tags":["جلابية خليجية","تطريز","كريستال","شيفون","مبطن","أكمام طويلة"],"price_range":{"low":4000,"high":12500}}',
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
    // Post-sanitize to enforce user rules on description and name
    const data = { ...out.data }
    const rawText = String((input as any)?.text || '')
    const norm = (s:string)=> String(s||'').normalize('NFKC').replace(/[\u064B-\u065F]/g,'').replace(/\u0640/g,'')
    const has = (re:RegExp)=> re.test(rawText)
    const colorWords = /(أسود|اسود|أبيض|ابيض|أحمر|احمر|أزرق|ازرق|أخضر|اخضر|أصفر|اصفر|بنفسجي|وردي|بيج|رمادي|ذهبي|فضي|ذهبيه|فضيه|Gold|Silver|Black|White|Red|Blue|Green|Purple|Pink|Beige|Gray)/gi
    const sizeTokens = /\b(XXL|XL|L|M|S|XS|\d{2})\b/gi
    const priceTokens = /(سعر|العمله|العملة|ريال|﷼|\$|USD|EGP|AED|KWD|QR)[^\.\n]*/gi
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
        if (/(فستان|فستان\s*طويل|فسان)/i.test(rawText)) return 'فستان'
        if (/(جلابيه|جلابية)/i.test(rawText)) return 'جلابية'
        if (/(عبايه|عباية)/i.test(rawText)) return 'عباية'
        if (/(قميص)/i.test(rawText)) return 'قميص'
        if (/(بلوزه|بلوزة)/i.test(rawText)) return 'بلوزة'
        return ''
      })()
      const hasTypeInName = /(فستان|جلابية|عباية|قميص|بلوزة)/.test(name)
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
    return data
  } catch { return null } finally { clearTimeout(t) }
}