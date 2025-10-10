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

// System Prompt مختصر ومحسن
const OPTIMIZED_SYSTEM_PROMPT = `استخرج من نص المنتج:
- name: اسم المنتج (8-12 كلمة)
- description: وصف المنتج كجدول
- tags: 8-12 كلمة مفتاحية
- sizes: المقاسات
- price_range: السعر القديم فقط

تجاهل: عمله جديد، جنوبي، سعودي، قعيطي
أعد JSON فقط بدون نصوص إضافية.`

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
    // ✅ تنظيف النص مسبقاً لتقليل التوكنس
    const cleanText = input.text
      .replace(/[^\w\s\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF|،\.\-:]/g, '')
      .replace(/(احجزي الآن|لا تفوتي الفرصة|عرض خاص|عرض اليوم|🔥|👑|🌹|💃|👉🏻|👌🏻|💯|🌈|✍🏻|💰)/gi, '')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 1000); // ✅ تحديد طول النص

    const payload = {
      model,
      messages: [
        { role: 'system', content: OPTIMIZED_SYSTEM_PROMPT }, // ✅ نظام مختصر
        { role: 'user', content: cleanText } // ✅ نص نظيف ومختصر
      ],
      temperature: 0.1,
      top_p: 0.7,
      max_tokens: 300, // ✅ تقليل الرد
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

    const j = await
