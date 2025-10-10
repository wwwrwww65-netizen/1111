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
    // تنظيف النص أولاً
    const cleanText = input.text
      .replace(/[^\w\s\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF|،\.\-:]/g, ' ') // إزالة الإيموجي والرموز
      .replace(/(احجزي الآن|لا تفوتي الفرصة|عرض خاص|عرض اليوم|🔥|👑|🌹|💃|👉🏻|👌🏻|💯|🌈|✍🏻|💰)/gi, '') // إزالة العبارات الترويجية
      .replace(/\s+/g, ' ')
      .trim()

    const systemPrompt = `أنت مساعد متخصص في تحليل نصوص المنتجات العربية. اتبع هذه القواعد بدقة:

⚙️ القاعدة الصارمة لتحليل نصوص المنتجات:

1. تنظيف النص: احذف جميع الإيموجي والرموز والزخارف والعبارات الترويجية.

2. اسم المنتج: اسم موجز بين 8 إلى 12 كلمة يصف (النوع + الخامة + الميزة الأبرز + الفئة).

3. وصف المنتج: أنشئ جدولاً منظماً بالخصائص الفنية فقط بدون أسعار أو عروض.

4. السعر: استخرج فقط سعر الشراء بالعملة القديمة (ريال قديم أو شال). تجاهل ريال جديد، جنوبي، سعودي، قعيطي.

5. المقاسات/الألوان/المخزون: استخرج إذا ذكرت بوضوح، وإلا اترك فارغًا.

6. الكلمات المفتاحية: 8-12 كلمة واقعية مرتبطة بمواصفات المنتج.

أعد JSON فقط وفق هذا المخطط:
{
  "name": "اسم المنتج",
  "description": "وصف المنتج بالجدول المنظم",
  "tags": ["كلمات", "مفتاحية"],
  "sizes": ["المقاسات"],
  "price_range": {"low": السعر, "high": السعر},
  "notes": "ملاحظات",
  "confidence": الثقة,
  "reasons": {"سبب": "توضيح"}
}`

    const payload = {
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: JSON.stringify({ text: cleanText, original: input.text }) }
      ],
      temperature: 0.1,
      top_p: 0.7,
      max_tokens: 1000,
      response_format: { type: 'json_object' as const }
    }

    const endpoints = [
      'https://api.deepseek.com/v1/chat/completions',
      'https://api.deepseek.ai/v1/chat/completions'
    ]

    let res: Response | null = null
    let lastError: any = null

    for (const url of endpoints) {
      try {
        res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify(payload),
          signal: ctrl.signal
        })
        if (res.ok) break
      } catch (error) {
        lastError = error
        res = null
      }
    }

    if (!res || !res.ok) {
      console.error('API request failed:', lastError)
      return null
    }

    const data = await res.json()
    let content = data.choices?.[0]?.message?.content || ''

    // استخراج JSON من المحتوى
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.error('No JSON found in response')
      return null
    }

    let parsed
    try {
      parsed = JSON.parse(jsonMatch[0])
    } catch (error) {
      console.error('JSON parsing error:', error)
      return null
    }

    // ✅ استخراج السعر القديم يدوياً من النص الأصلي
    const priceMatches = input.text.match(/(عمله قديم|ريال قديم|سعر قديم)[^\d]*(\d+[\d,.]*)/gi)
    if (priceMatches) {
      for (const match of priceMatches) {
        const priceMatch = match.match(/(\d+[\d,.]*)/)
        if (priceMatch) {
          const price = parseFloat(priceMatch[1].replace(/[^\d.]/g, ''))
          if (price > 100) { // تأكد أنه سعر وليس وزن
            parsed.price_range = { low: price, high: price }
            break
          }
        }
      }
    }

    // ✅ استخراج المقاسات يدوياً
    const sizesMatch = input.text.match(/(مقاساته|المقاسات|مقاس)[^\d]*(XXL|XL|L|M|S|XS|[\.\d\-\s]+)/i)
    if (sizesMatch) {
      const sizesText = sizesMatch[2]
      if (sizesText.includes('فري سايز') || sizesText.includes('مقاس واحد')) {
        parsed.sizes = ['فري سايز']
      } else {
        // استخراج المقاسات الفردية
        const individualSizes = sizesText.match(/(XXL|XL|L|M|S|XS|\d+)/gi)
        if (individualSizes) {
          parsed.sizes = individualSizes.map((s: string) => s.trim().toUpperCase())
        }
      }
    }

    // ✅ التأكد من عدد الكلمات المفتاحية
    if (parsed.tags) {
      if (parsed.tags.length > 12) {
        parsed.tags = parsed.tags.slice(0, 12)
      } else if (parsed.tags.length < 8) {
        // إضافة كلمات مفتاحية إضافية إذا كانت أقل من 8
        const additionalTags = [
          'أزياء عربية', 'ملابس تقليدية', 'مناسبات', 'فساتين', 
          'تطريز', 'دانتيل', 'حرير', 'أزياء نسائية'
        ]
        parsed.tags = [...parsed.tags, ...additionalTags].slice(0, 12)
      }
    }

    // ✅ التأكد من جودة الاسم
    if (parsed.name) {
      const wordCount = parsed.name.split(/\s+/).length
      if (wordCount < 8 || wordCount > 12) {
        // إصلاح الاسم ليتناسب مع المتطلبات
        const words = parsed.name.split(/\s+/)
        if (wordCount < 8) {
          // إضافة كلمات وصفية
          const additionalWords = ['شرقية', 'مميزة', 'فاخرة', 'أنيقة', 'مطرزة']
          parsed.name = [...words, ...additionalWords].slice(0, 12).join(' ')
        } else if (wordCount > 12) {
          parsed.name = words.slice(0, 12).join(' ')
        }
      }
    }

    // ✅ إضافة confidence إذا لم تكن موجودة
    if (!parsed.confidence) {
      parsed.confidence = 0.9
    }

    const out = DeepseekOutputSchema.safeParse(parsed)
    if (!out.success) {
      console.error('Schema validation failed:', out.error)
      return null
    }

    return out.data

  } catch (error) {
    console.error('Unexpected error:', error)
    return null
  } finally {
    clearTimeout(t)
  }
}

// دالة مساعدة للاستخراج السريع
export async function analyzeProductText(apiKey: string, text: string): Promise<DeepseekOutput | null> {
  return callDeepseek({
    apiKey,
    model: 'deepseek-chat',
    input: { text, base: null },
    timeoutMs: 15000
  })
}
