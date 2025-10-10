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
    const systemPrompt = `أنت مساعد متخصص في تحليل منتجات الملابس العربية. استخرج بدقة وفق القواعد التالية:

⚙️ القاعدة الصارمة لتحليل نصوص المنتجات:

1. تنظيف النص: احذف جميع الإيموجي والرموز والزخارف والعبارات الترويجية.

2. اسم المنتج: اسم موجز بين 8 إلى 12 كلمة يصف (النوع + الخامة + الميزة الأبرز + الفئة).

3. وصف المنتج: جدول منظم بالخصائص الفنية فقط بدون أسعار أو عروض.

4. السعر: استخرج فقط سعر الشراء بالعملة القديمة (ريال قديم أو شال). تجاهل ريال جديد، جنوبي، سعودي، قعيطي.

5. المقاسات/الألوان/المخزون: استخرج إذا ذكرت بوضوح، وإلا اترك فارغًا.

6. الكلمات المفتاحية: 8-12 كلمة واقعية مرتبطة بمواصفات المنتج.

أعد JSON فقط وفق المخطط التالي:
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
        { role: 'user', content: JSON.stringify(input) }
      ],
      temperature: 0.1,
      top_p: 0.7,
      max_tokens: 800,
      response_format: { type: 'json_object' as const }
    }

    const res = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload),
      signal: ctrl.signal
    })

    if (!res.ok) return null

    const j = await res.json()
    const content = String(j?.choices?.[0]?.message?.content || '')
    
    // استخراج JSON من المحتوى
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return null

    let parsed
    try {
      parsed = JSON.parse(jsonMatch[0])
    } catch {
      return null
    }

    // معالجة السعر - التركيز على العملة القديمة فقط
    const text = input.text
    const oldPriceMatch = text.match(/(?:عمله قديم|ريال قديم|سعر قديم)[^\d]*(\d+[\.,]?\d*)/i)
    const northPriceMatch = text.match(/(?:شال|للشمال|سعر شمال)[^\d]*(\d+[\.,]?\d*)/i)
    
    let price
    if (oldPriceMatch) {
      price = parseFloat(oldPriceMatch[1].replace(/[^\d.]/g, ''))
    } else if (northPriceMatch) {
      price = parseFloat(northPriceMatch[1].replace(/[^\d.]/g, ''))
    }

    if (price && price > 100) {
      parsed.price_range = { low: price, high: price }
    }

    // معالجة المقاسات
    const sizesMatch = text.match(/(?:مقاساته|المقاسات|مقاس)[^\d]*(XXL|XL|L|M|S|XS|[\.\d\-]+)/i)
    if (sizesMatch) {
      parsed.sizes = [sizesMatch[1].trim()]
    }

    // التأكد من عدد الكلمات المفتاحية
    if (parsed.tags && parsed.tags.length > 12) {
      parsed.tags = parsed.tags.slice(0, 12)
    }

    const out = DeepseekOutputSchema.safeParse(parsed)
    return out.success ? out.data : null

  } catch {
    return null
  } finally {
    clearTimeout(t)
  }
}
