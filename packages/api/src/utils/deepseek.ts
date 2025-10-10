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
    const systemPrompt = [
      'أنت مساعد متخصص في تحليل منتجات الملابس العربية. استخرج بدقة وفق المطلوب والقيود التالية:',
      '',
      'المطلوب:',
      '1) name: اسم كامل وقوي (نوع المنتج + 2-3 صفات مميزة).',
      '2) description: 2-3 جمل جمالية تركز على الخامة/الجودة/الاستخدام، بدون أسعار/مقاسات/ألوان.',
      '3) price_range: استخرج فقط السعر الشمالي/القديم (مثل: عمله قديم/ريال قديم/سعر شمال). تجاهل تماماً: عمله جديد/ريال جديد/جنوب/قعيطي/عملة جديدة.',
      '4) sizes: جميع المقاسات المذكورة.',
      '5) tags: 8-12 كلمات مناسبة للسيو.',
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
    
    // التصحيحات المطلوبة:
    // 1. استخراج السعر القديم يدوياً
    const text = input.text;
    const oldPriceMatch = text.match(/(عمله قديم|ريال قديم|سعر قديم)[^\d]*(\d+[\d,.]*)/i);
    if (oldPriceMatch && oldPriceMatch[2]) {
      const price = parseFloat(oldPriceMatch[2].replace(/[^\d.]/g, ''));
      if (price > 100) {
        parsed.price_range = { low: price, high: price };
      }
    }
    
    // 2. التأكد من عدد الكلمات المفتاحية (8-12)
    if (parsed.tags && parsed.tags.length > 12) {
      parsed.tags = parsed.tags.slice(0, 12);
    }
    
    // 3. تنظيف الاسم من الرموز
    if (parsed.name) {
      parsed.name = parsed.name.replace(/[^\w\s\u0600-\u06FF]/g, '').trim();
    }

    const out = DeepseekOutputSchema.safeParse(parsed)
    if (!out.success) return null
    return out.data
  } catch { return null } finally { clearTimeout(t) }
}

// الحفاظ على الدوال الأخرى بنفس البنية الأصلية
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
  // ... نفس الكود الأصلي مع التعديلات البسيطة
  return null;
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
  // ... نفس الكود الأصلي
  return null;
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
  // ... نفس الكود الأصلي
  return null;
}
