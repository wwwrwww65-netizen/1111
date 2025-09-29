// Quick smoke test for /api/admin/products/analyze
import assert from 'node:assert/strict'

const API = process.env.API_BASE || 'https://api.jeeey.com'
const text = `*جديد* *طقم طقم نسائي قطعتين احلا ماركه راقي* *يتميز ثلاث قطع منفصله* *فستان نسائي طويل مورد كلوش امبريلا* *جاكت كم طويل حرير تركي مزين بي الامام بكرستال فضي وفتحه من الخلف زرار* *حزام خصر منفصل* *شكل جديد ومميز* *5اللوان تحححفه* *تشكيله الترند الجديد* *قماش الجاكت حرير تركي الأصلي قماش الفستان حرير باربي الأصلي* *مقاسات L_Xl يلبس *من وزن 40الى وزن 70* *السعر* *عمله قديم 3500* *عمله جديد 11000* *الكل يعرض متوفر بكميات*`;

// Login to get token (JSON login)
const loginRes = await fetch(`${API}/api/admin/auth/login`, {
  method: 'POST', headers: { 'content-type':'application/json' },
  body: JSON.stringify({ email: 'admin@example.com', password: 'admin123', remember: true })
})
if (!loginRes.ok) throw new Error(`login_failed: ${loginRes.status}`)
const loginJson = await loginRes.json().catch(()=> ({}))
const token = loginJson?.token || ''
const authHeader = token ? { Authorization: `Bearer ${token}` } : {}

const r = await fetch(`${API}/api/admin/products/analyze?forceDeepseek=1&deepseekOnly=1`, {
  method: 'POST', headers: { 'content-type':'application/json', ...authHeader }, body: JSON.stringify({ text })
})
if (!r.ok) throw new Error(`analyze_failed: ${r.status}`)
const j = await r.json()
const a = j?.analyzed || {}

assert.ok(j?.analyzed, 'analyze produced no output')
if (process.env.DEEPSEEK_API_KEY) {
  if (!j?.meta || j.meta.deepseekUsed !== true) {
    console.error('DeepSeek meta:', j?.meta)
    throw new Error('deepseek_not_used_when_forced')
  }
}

assert.ok(a?.name?.value, 'name missing')
const TYPE_RE = /(طقم|فستان|جاكيت|جاكت|فنيلة|فنيله|فنائل|جلابية|جلابيه|جلاب|عباية|عبايه)/i
const NAME_TXT = String(a?.name?.value||'')
const DESC_TXT = String(a?.description?.value||'')
if (!TYPE_RE.test(`${NAME_TXT} ${DESC_TXT}`)) {
  console.log('warn: type token not found in name/description:', { name: NAME_TXT, desc: DESC_TXT.slice(0,80) })
}
assert.ok(String(a.name.value).length <= 60, 'name length should be <= 60')
assert.ok(a?.description?.value, 'description missing')
// sizes should be in sizes field, not description
assert.ok(!( /40\s*[–-]?\s*60|40\s*إلى\s*60/.test(a.description.value) ), 'sizes should not be in description')
console.log('price_low debug:', a?.price_range?.value?.low)
assert.ok(
  a?.price_range?.value?.low !== undefined && Number.isFinite(Number(a.price_range.value.low)) && Number(a.price_range.value.low) === 3500,
  'price low should prefer old price 3500'
)

// Validate digits are English (no Arabic/Indic numerals)
const ARABIC_DIGITS = /[\u0660-\u0669\u06F0-\u06F9]/
if (ARABIC_DIGITS.test(JSON.stringify(a))) {
  throw new Error('non_english_digits_detected')
}

// Colors: if a general phrase like "5 الوان/5 ألوان/ألوان متعددة" exists, preserve as-is
const colors = a?.colors?.value || []
if (colors.length) {
  const joined = colors.join(' ')
  const general = /(\b\d+\s*ألوان\b|ألوان\s*متعددة|ألوان\s*متنوعة|عدة\s*ألوان)/i
  const hasGeneralInText = general.test(text)
  if (hasGeneralInText && !general.test(joined)) {
    throw new Error('general_colors_phrase_not_preserved')
  }
}

console.log('analyze smoke OK:', {
  name: a.name.value,
  low: a.price_range.value.low,
  colors: (a.colors?.value||[]).slice(0,3)
})
// التحقق من المقاسات
const sizes = a?.sizes?.value || []
console.log(`📏 المقاسات:`, sizes)
assert.ok(Array.isArray(sizes) && sizes.length > 0, 'يجب أن تكون هناك مقاسات')

// التحقق من الكلمات المفتاحية
const keywords = a?.keywords?.value || []
console.log(`🔑 الكلمات المفتاحية:`, keywords.slice(0, 5))

// التحقق من الأرقام الإنجليزية فقط
if (ARABIC_DIGITS.test(JSON.stringify(a))) {
  throw new Error('non_english_digits_detected')
}

// تقرير مبسط للنجاح
console.log('✅ analyze smoke OK (summary):', {
  name: a.name.value,
  low: a.price_range.value.low,
  colors: (a.colors?.value||[]).slice(0,3),
  sizes: (a.sizes?.value||[]).slice(0,3),
  deepseek_used: j?.meta?.deepseekUsed
})
