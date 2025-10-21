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
      '- لا تخمّن، اترك الحقول غير المؤكدة null أو احذفها.',
      '- أعد JSON فقط وفق المخطط التالي دون أي نص إضافي أو تعليقات.',
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
      temperature: 0.2,
      top_p: 0.8,
      max_tokens: 500,
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
    // Sanitize/compose name: ensure type noun present and strip colors/sizes/prices.
    // IMPORTANT: Do NOT invent a default type for gibberish/low-signal text.
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
      if (!hasTypeInName && typeFromText) {
        const base = typeFromText
        const parts: string[] = [base]
        if (base === 'فستان' && longFlag) parts.push('طويل')
        if (embFlag) parts.push('مطرز')
        if (crystalFlag) parts.push('بالكريستال')
        if (base === 'فستان' && occasionFlag) parts.splice(1, 0, 'سهرة')
        name = parts.join(' ').replace(/\s{2,}/g,' ').trim()
      }
      // If no clothing signal was detected and name is empty/too short, drop the name entirely
      if (!name && !typeFromText) {
        delete (data as any).name
      } else if (name) {
        // Do not truncate; caller/endpoints may enforce their own limits
        data.name = name
      }
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
    const systemPrompt = `أنت نظام تحليل منتجات ذكي يعمل مع جميع الأنواع باستراتيجية أسعار متقدمة:

## 🎯 استراتيجية السعر الذكية المتقدمة:

### الأولوية القصوى (يأخذها فوراً):
- "عمله قديم", "ريال قديم", "سعر شمال"

### إذا لم توجد الأسعار الشمالية:
- يأخذ "سعر الشراء" أو "السعر" العادي
- إذا تعددت الأسعار: يأخذ الأول المذكور أو الأدنى
- تجاهل "عمله جديد", "جنوب", "قعيطي" تماماً

## 📝 أمثلة ذكية للأسعار:

### مثال 1 (شمالي صريح):
النص: "عمله قديم 4000 وعمله جديد 12000"
→ السعر: 4000

### مثال 2 (سعر واحد):
النص: "السعر 6000"  
→ السعر: 6000

### مثال 3 (multiple أسعار):
النص: "سعر 5000 وسعر البيع 8000"
→ السعر: 5000

### مثال 4 (أولوية الشراء):
النص: "سعر الشراء 3000 وسعر البيع 7000"
→ السعر: 3000

## 📋 تنسيق الإخراج الثابت (JSON فقط):
{
  "name": "اسم طويل 8-12 كلمة يلخص المنتج",
  "description": "• الخامة: [نوع المواد وجودتها]\\n• الصناعة: [جودة ومصدر التصنيع]\\n• التصميم: [النمط والتفاصيل]\\n• الألوان: [الألوان المذكورة كما هي]\\n• المقاسات: [جميع المقاسات المتاحة]\\n• الميزات: [3-4 مميزات رئيسية]\\n• الاستخدام: [المناسبات والاستخدامات المناسبة]",
  "price": 0,
  "colors": ["الألوان كما هي"],
  "sizes": ["المقاسات"],
  "keywords": ["كلمات", "مفتاحية", "للسيو"]
}

قواعد السعر الصارمة: أعد الحقل price كرقم فقط بالأرقام الإنجليزية (0-9)، واتبِع ترتيب: شمال/قديم → شراء → أول أو الأدنى. تجاهل الوزن تماماً.

## 🚫 قواعد لا يمكن كسرها:
1. الاسم: 8-12 كلمة شاملة (النوع + المواصفات + الاستخدام)
2. الألوان العامة مثل "4 ألوان"، "ألوان متعددة" تبقى كما هي دون تحليل
3. الأرقام: إنجليزية فقط (1,2,3 وليس ١,٢,٣)
4. تجاهل: "وزن", "عمله جديد", "جنوب", "قعيطي"

## 🎪 أمثلة تغطي جميع الأنواع (لضبط الأسلوب):
- ملابس، إلكترونيات، أثاث، تجميل، أدوات منزلية كما في التعليمات

## 🔧 استراتيجية التعامل مع البيانات:
- الألوان العامة تحفظ كما هي
- الألوان المحددة تُقسّم لقائمة
- المقاسات تُستخرج كلها؛ نطاق مثل "مقاس 38 الى 44" يتحول إلى ["38","39","40","41","42","43","44"]
- الكلمات المفتاحية: 6-8 كلمات مركزة للسيو

## ⚠️ تحذير نهائي:
أعد JSON فقط بدون أي نص أو أسطر إضافية خارج JSON!
استخدم الأرقام الإنجليزية فقط!
`; 
    const payload = {
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: JSON.stringify({ text: input.text }) }
      ],
      temperature: 0.2,
      top_p: 0.8,
      max_tokens: 1000,
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
    // Post-process preview: enforce English digits, correct price selection, preserve general color phrases
    try {
      const raw = String(input.text || '')
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
        return val
      }
      // Normalize digits in key fields
      parsed.name = normAll(parsed.name)
      parsed.description = normAll(parsed.description)
      parsed.colors = normAll(parsed.colors)
      parsed.sizes = normAll(parsed.sizes)
      parsed.keywords = normAll(parsed.keywords)

      // Price priority: old/north -> buy -> first/lowest; ignore weights
      const t = normalizeDigits(raw)
      const weightContext = /(وزن|يلبس\s*الى|يلبس\s*إلى|حتى\s*وزن)/i
      const toNum = (s?: string): number | undefined => {
        if (!s) return undefined
        const m = String(s).match(/\d+(?:\.\d+)?/)
        return m ? Number(m[0]) : undefined
      }
      const get = (re: RegExp) => {
        const m = t.match(re)
        return m && toNum(m[1])
      }
      const old = get(/(?:(?:عمل(?:ة|ه)\s*)?(?:قديم|القديم)|ريال\s*قديم|سعر\s*شمال)[^\d]{0,12}(\d+(?:\.\d+)?)/i)
      const north = get(/(?:للشمال|الشمال)[^\d]{0,12}(\d+(?:\.\d+)?)/i)
      const buy = get(/(?:سعر\s*الشراء)[^\d]{0,12}(\d+(?:\.\d+)?)/i)
      const firstAny = get(/\b(?:السعر|سعر)\b[^\d]{0,12}(\d+(?:\.\d+)?)/i)
      const candidates: Array<number|undefined> = [old ?? undefined, north ?? undefined, buy ?? undefined, firstAny ?? undefined]
      let chosen = candidates.find(v => typeof v === 'number') as number | undefined
      if ((chosen === undefined || chosen <= 100) && weightContext.test(t)) {
        // try to find any number > 100 among candidates
        const gt = candidates.find(v => typeof v === 'number' && (v as number) > 100) as number | undefined
        if (gt !== undefined) chosen = gt
      }
      // If multiple prices appear in text and none chosen, pick lowest > 100 as fallback
      if (chosen === undefined) {
        const allNums = Array.from(t.matchAll(/\b(\d+(?:\.\d+)?)\b/g)).map(m => Number(m[1]))
        const plausible = allNums.filter(n => n > 100)
        if (plausible.length) chosen = Math.min(...plausible)
      }
      const parsedNum = typeof parsed.price === 'number' ? parsed.price : toNum(String(parsed.price||''))
      if (typeof chosen === 'number' && (!parsedNum || parsedNum !== chosen)) parsed.price = chosen

      // Colors: prefer general phrases over specific tokens even with trailing adjectives
      const generalColorsRe = /\b(?:(\d+)\s*(?:ألوان|الوان)|أرب(?:ع|عة)\s*(?:ألوان|الوان)|اربعه\s*(?:ألوان|الوان)|ألوان\s*متعدد(?:ة|ه)|ألوان\s*متنوع(?:ة|ه)|عدة\s*(?:ألوان|الوان))\b/i
      const gMatch = t.match(generalColorsRe)
      if (gMatch) {
        let label = gMatch[0]
        const num = gMatch[1] ? Number(gMatch[1]) : (/أرب(?:ع|عة)|اربعه/i.test(label) ? 4 : undefined)
        if (typeof num === 'number') label = `${num} ألوان`
        parsed.colors = [label]
      }

      // Keywords: drop trivial stopwords and very short tokens
      if (Array.isArray(parsed.keywords)) {
        const stop = new Set(['على','نوع','وصل','كل','الى','إلى','ال','من','في','او','أو','مع'])
        parsed.keywords = parsed.keywords
          .map((k: any) => String(k||'').trim())
          .filter((k: string) => k.length >= 3 && !stop.has(k))
          .slice(0, 8)
      }
    } catch {}
    return parsed
  } catch { return null } finally { clearTimeout(t) }
}

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
    // If the model produced no meaningful name (too short or gibberish), prefer null to avoid fake defaults
    if (r && wc >= 4 && !/^(فستان|لانجري|جلابية|عباية)$/i.test(name)) return r
    await new Promise(res=> setTimeout(res, 800))
  }
  return null
}

// Strict DeepSeek preview: returns exactly model JSON (with digit normalization only)
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
  stock?: number
} | null> {
  const { apiKey, model, input } = opts
  const timeoutMs = Math.min(Math.max(opts.timeoutMs ?? 15000, 3000), 20000)
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const systemPrompt = `أنت نظام تحليل منتجات صارم. التزم حرفيًا بالقواعد التالية وأعد JSON فقط:

1) تنظيف النص:
- احذف جميع الإيموجي والرموز والزخارف والعبارات الترويجية/التسويقية (مثل: احجزي الآن، لا تفوتي الفرصة، عرض خاص...).
- اعمل على النص الصافي الذي يصف المنتج فقط.

2) اسم المنتج (name):
- أعد صياغة اسم موجز وواضح من 8 إلى 12 كلمة بالضبط.
- يعبر بدقة عن الهوية: الاسم/النوع + الخامة + الميزة الأبرز + الفئة إن وُجدت.
- بدون رموز أو كلمات تسويقية.

3) وصف المنتج كجدول (description_table):
- أعد جدول تفاصيل من صفوف {label,value} فقط بناءً على ما ورد في النص.
- أمثلة للعناوين المسموحة: النوع، الفئة، الخامة، القَصّة، الموسم، النمط، الياقة، الأكمام، الطول، السماكة، المرونة، البطانة، بلد الصنع، العناية، الموديل، المقاسات (سم)، الإغلاق، المناسبة، العلامة التجارية، محتويات العبوة، الوزن، الألوان، المقاسات.
- إذا ذُكرت المقاسات أو الألوان أو الوزن أو وصف المقاس فأضفها للجدول.
- ممنوع إدراج السعر/التوصيل/العروض أو أي عبارة تسويقية داخل الجدول. يقتصر الجدول على وصف المنتج نفسه فقط.

4) السعر (price):
- استخرج فقط سعر الشراء الصحيح بالعملة القديمة/للشمال (تعابير مثل: قديم، للـشمال، الشمال، عملة قديمة).
- تجاهل تمامًا: ريال جديد، جنوبي، سعودي، قعيطي، وأي عملة/وصف غير مرغوب.

5) المقاسات/الألوان/المخزون:
- استخرج هذه الحقول فقط إذا ذُكرت بوضوح في النص؛ وإلا لا تُرجِعها إطلاقًا (لا رموز ولا شرطات).
- الألوان يجب أن تكون أسماء ألوان صريحة فقط؛ لا تُرجِع عبارات عامة مثل "ألوان متعددة".
- إذا ذُكر "فري سايز" اجعل sizes: ["فري سايز"] فقط، وضع الوزن ضمن صف في description_table عند وجوده.

6) كلمات SEO (keywords):
- أنشئ قائمة 8 إلى 12 كلمة/عبارة واقعية ومرتبطة بمواصفات المنتج، دون رموز أو علامات تجارية غير مذكورة.

تنسيق الإخراج:
- JSON فقط بهذه الحقول: {"name"?, "description"?, "description_table"?, "price"?, "colors"?, "sizes"?, "keywords"?, "stock"?}.
- استخدم الأرقام الإنجليزية داخل الحقول.
- لا تخمّن: إذا غاب الدليل اترك الحقل غير موجود.`
    const payload = {
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: JSON.stringify({ text: input.text }) }
      ],
      temperature: 0.2,
      top_p: 0.8,
      max_tokens: 1000,
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
    // Minimal post: normalize Arabic/Indic digits inside strings only
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
    const out = normAll(parsed)
    if (out && typeof out.price !== 'number' && out.price != null) {
      const m = String(out.price).match(/\d+(?:\.\d+)?/)
      out.price = m ? Number(m[0]) : undefined
      if (out.price == null) delete out.price
    }
    // Enforce colors rule: keep explicit color names (Arabic or English); drop purely general phrases
    try {
      // Recognize a broad set of Arabic and English color tokens (single-line regex literal)
      const colorLex = /(أسود|اسود|أبيض|ابيض|أحمر|احمر|أزرق|ازرق|أخضر|اخضر|أصفر|اصفر|بنفسجي|موف|وردي|بيج|رمادي|رمادي\s*فاتح|رمادي\s*غامق|رصاصي|ذهبي|فضي|كحلي|تركواز|تركوازي|سماوي|زيتي|عنابي|خمري|عسلي|كريمي|أوف\s*-?\s*وايت|اوف\s*-?\s*وايت|Black|White|Red|Blue|Green|Yellow|Brown|Beige|Gray|Grey|Pink|Purple|Navy|Cyan|Teal|Olive|Indigo|Maroon|Gold|Silver|Copper|Off\s*-?\s*White|Light\s*Gray|Dark\s*Gray)/i;
      if (Array.isArray(out.colors)) {
        const explicit = (out.colors as string[])
          .map((c: string) => String(c || '').trim())
          .filter((c: string) => !!c && colorLex.test(c))
        if (explicit.length) {
          out.colors = explicit
        } else {
          // If model returned only general phrases (e.g., "ألوان متعددة"), drop to let caller decide on fallback
          delete (out as any).colors
        }
      }
    } catch {}
    // Normalize sizes: if mentions Free Size with weight, keep sizes as ["فري سايز"] and weight goes to table (model should have done this)
    return out
  } catch { return null } finally { clearTimeout(t) }
}
