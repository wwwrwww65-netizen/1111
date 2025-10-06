export type GptInput = { text: string }
export type GptStrictOut = { analyzed?: any } | null

export async function callGpt35Strict(opts: { apiKey: string; model: string; input: GptInput; timeoutMs?: number }): Promise<GptStrictOut> {
  const { apiKey, model, input, timeoutMs = 60_000 } = opts
  const controller = new AbortController()
  const t = setTimeout(()=> controller.abort(), timeoutMs)
  try {
    const sys = 'أنت مساعد يحلل نصوص المنتجات بالعربية ويُرجع JSON فقط بدون شرح.'
    const user = `حلل النص التالي وأخرج الحقول التالية في JSON فقط:
- name: اسم (8-12 كلمة، يتضمن النوع/المواصفات الرئيسية)
- description: وصف قصير من سطرين
- description_table: مصفوفة صفوف [{ key,label,value,confidence }]
- price_range: { low, high }
- colors: [..]
- sizes: [..]
- keywords: [..]
نص الإدخال:\n${input.text}`
    const body = {
      model,
      messages: [ { role:'system', content: sys }, { role:'user', content: user } ],
      temperature: 0.2,
      response_format: { type: 'json_object' }
    }
    const init: any = {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'authorization': `Bearer ${apiKey}` },
      body: JSON.stringify(body),
      signal: controller.signal
    }
    const r = await fetch('https://api.openai.com/v1/chat/completions', init)
    if (!r.ok) return null
    const j: any = await r.json().catch(()=> null)
    const content = j?.choices?.[0]?.message?.content
    if (!content) return null
    try { return JSON.parse(content) } catch { return { analyzed: { description: content } } }
  } finally { clearTimeout(t) }
}
