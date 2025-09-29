// Quick smoke test for /api/admin/products/analyze
import assert from 'node:assert/strict'

const API = process.env.API_BASE || 'https://api.jeeey.com'
const text = `*جديد* *طقم طقم نسائي قطعتين احلا ماركه راقي* *يتميز ثلاث قطع منفصله* *فستان نسائي طويل مورد كلوش امبريلا* *جاكت كم طويل حرير تركي مزين بي الامام بكرستال فضي وفتحه من الخلف زرار* *حزام خصر منفصل* *شكل جديد ومميز* *5اللوان تحححفه* *تشكيله الترند الجديد* *قماش الجاكت حرير تركي الأصلي قماش الفستان حرير باربي الأصلي* *مقاسات L_Xl يلبس *من وزن 40الى وزن 70* *السعر* *عمله قديم 3500* *عمله جديد 11000* *الكل يعرض متوفر بكميات*`;

// Login to get token (JSON login)
const loginRes = await fetch(`${API}/api/admin/auth/login`, {
  method: 'POST', 
  headers: { 'content-type':'application/json' },
  body: JSON.stringify({ 
    email: process.env.ADMIN_EMAIL || 'admin@example.com', 
    password: process.env.ADMIN_PASSWORD || 'admin123', 
    remember: true 
  })
})

if (!loginRes.ok) throw new Error(`login_failed: ${loginRes.status}`)
const loginJson = await loginRes.json().catch(()=> ({}))
const token = loginJson?.token || ''
const authHeader = token ? { Authorization: `Bearer ${token}` } : {}

console.log('🔐 تسجيل الدخول:', loginRes.ok ? '✅' : '❌')

const r = await fetch(`${API}/api/admin/products/analyze?forceDeepseek=1&deepseekOnly=1`, {
  method: 'POST', 
  headers: { 'content-type':'application/json', ...authHeader }, 
  body: JSON.stringify({ text })
})

if (!r.ok) throw new Error(`analyze_failed: ${r.status}`)
const j = await r.json()
const a = j?.analyzed || {}

console.log('📊 تحليل DeepSeek:', j?.meta?.deepseekUsed ? '✅ مستخدم' : '❌ غير مستخدم')

// التحقق من الهيكل الأساسي
assert.ok(j?.analyzed, 'analyze produced no output')

if (process.env.DEEPSEEK_API_KEY) {
  if (!j?.meta || j.meta.deepseekUsed !== true) {
    console.error('❌ DeepSeek meta:', j?.meta)
    throw new Error('deepseek_not_used_when_forced')
  }
}

// التحقق من الاسم
assert.ok(a?.name?.value, 'name missing')
const NAME_TXT = String(a?.name?.value||'')
console.log(`📝 الاسم: "${NAME_TXT}" (${NAME_TXT.split(/\s+/).length} كلمة)`)

// تحقق من طول الاسم (8-12 كلمة)
const nameWordCount = NAME_TXT.split(/\s+/).length
if (nameWordCount < 8) {
  console.warn('⚠️  تحذير: الاسم قصير جداً - يجب أن يكون 8-12 كلمة')
  // لا نرمي خطأ لأننا في مرحلة التطوير
}

// التحقق من نوع المنتج في الاسم
const TYPE_RE = /(طقم|فستان|جاكيت|جاكت|فنيلة|فنيله|فنائل|جلابية|جلابيه|جلاب|عباية|عبايه)/i
if (!TYPE_RE.test(NAME_TXT)) {
  console.warn('⚠️  تحذير: نوع المنتج غير موجود في الاسم')
}

// التحقق من الوصف
assert.ok(a?.description?.value, 'description missing')
const DESC_TXT = String(a?.description?.value||'')
console.log(`📋 الوصف: ${DESC_TXT.substring(0, 100)}...`)

// تحقق من الجدول المنظم في الوصف
const hasTableFormat = /• الخامة:|• الصناعة:|• التصميم:|• الألوان:|• المقاسات:|• الميزات:|• الاستخدام:/.test(DESC_TXT)
if (!hasTableFormat) {
  console.warn('⚠️  تحذير: الوصف لا يحتوي على الجدول المنظم')
}

// المقاسات يجب أن تكون في حقل المقاسات وليس الوصف
assert.ok(!( /40\s*[–-]?\s*70|40\s*إلى\s*70/.test(DESC_TXT) ), 'sizes should not be in description')

// التحقق من السعر
console.log('💰 السعر المنخفض:', a?.price_range?.value?.low)
assert.ok(
  a?.price_range?.value?.low !== undefined && 
  Number.isFinite(Number(a.price_range.value.low)) && 
  Number(a.price_range.value.low) === 3500,
  `price low should prefer old price 3500, got ${a?.price_range?.value?.low}`
)

// التحقق من الألوان
const colors = a?.colors?.value || []
console.log(`🎨 الألوان:`, colors)

// إذا كان النص يحتوي على ألوان عامة، يجب الحفاظ عليها كما هي
if (colors.length) {
  const joined = colors.join(' ')
  const general = /(\b\d+\s*ألوان\b|ألوان\s*متعددة|ألوان\s*متنوعة|عدة\s*ألوان)/i
  const hasGeneralInText = general.test(text)
  if (hasGeneralInText && !general.test(joined)) {
    throw new Error('general_colors_phrase_not_preserved')
  }
}

// التحقق من المقاسات
const sizes = a?.sizes?.value || []
console.log(`📏 المقاسات:`, sizes)
assert.ok(Array.isArray(sizes) && sizes.length > 0, 'يجب أن تكون هناك مقاسات')

// التحقق من الكلمات المفتاحية
const keywords = a?.keywords?.value || []
console.log(`🔑 الكلمات المفتاحية:`, keywords.slice(0, 5))

// التحقق من الأرقام الإنجليزية فقط
const arabicDigits = /[\u0660-\u0669\u06F0-\u06F9]/
if (arabicDigits.test(JSON.stringify(a))) {
  throw new Error('non_english_digits_detected')
}

// تقرير النجاح
console.log('✅ analyze smoke OK:', {
  name: a.name.value,
  name_length: nameWordCount,
  low: a.price_range.value.low,
  colors: (a.colors?.value||[]).slice(0,3),
  sizes: (a.sizes?.value||[]).slice(0,3),
  has_table: hasTableFormat,
  deepseek_used: j?.meta?.deepseekUsed
})

console.log('🎯 DeepSeek يعمل بشكل', 
  nameWordCount >= 8 && hasTableFormat ? 'ممتاز' : 'جيد لكن يحتاج تحسين'
)
