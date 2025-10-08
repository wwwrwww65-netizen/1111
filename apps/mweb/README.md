# JEEEY Mobile Web Application

## 🆕 آخر التحديثات - Categories Page v2.1.0

### 🔄 التحديث الأخير (v2.1.0) - اليوم:
- ✅ **هيدر جديد** - متطابق مع الصفحة الرئيسية (ثابت وغير شفاف)
- ✅ **إزالة أيقونات emoji** - تصميم أنظف ونص فقط
- ✅ **فصل سلوك التمرير** - scroll مستقل للشريط الجانبي والمحتوى

### ✨ الميزات الرئيسية (v2.0.0):
- ✅ **تبويب "تجميل"** مع 6 فئات فرعية
- ✅ **40+ فئة منظمة هرمياً** (رئيسية + فرعية)
- ✅ **نافذة منبثقة للعروض** - خصم 15%
- ✅ **شريط جانبي محسّن** - 24 عنصر
- ✅ **بانرات ترويجية جذابة** مع gradient effects
- ✅ **نظام تتبع شامل** - 7 دوال تحليلات
- ✅ **رسوم متحركة احترافية** - fadeIn, slideUp, hover effects

**📖 التوثيق الكامل:** [CATEGORIES_README.md](./CATEGORIES_README.md)  
**📝 سجل التغييرات:** [CHANGELOG.md](./CHANGELOG.md)  
**🔄 التحديث الأخير:** [CATEGORIES_UPDATE_V2.1.md](./CATEGORIES_UPDATE_V2.1.md)

**التقييم: 9/10** ⭐⭐⭐⭐⭐ | **الإصدار: v2.1.0** | **متوافق مع الصفحة الرئيسية** ✅

---

## نظرة عامة

**JEEEY** هو تطبيق ويب متجاوب للتجارة الإلكترونية مصمم خصيصاً للهواتف المحمولة. يوفر تجربة تسوق سلسة ومتطورة مع واجهة مستخدم حديثة باللغة العربية.

## 🚀 المميزات الرئيسية

### 🛍️ التجارة الإلكترونية
- **عرض المنتجات**: معرض صور تفاعلي مع إمكانية التكبير
- **سلة التسوق**: إدارة متقدمة للعناصر مع مزامنة مع الخادم
- **قائمة الأمنيات**: حفظ المنتجات المفضلة
- **نظام الطلبات**: تتبع شامل للطلبات من البداية للنهاية
- **الدفع**: دعم متعدد لطرق الدفع (بطاقات، Apple Pay، الدفع عند الاستلام)

### 🎨 التصميم والواجهة
- **تصميم متجاوب**: محسن لجميع أحجام الشاشات
- **واجهة عربية**: دعم كامل للغة العربية مع اتجاه RTL
- **تصميم حديث**: استخدام أحدث تقنيات CSS و Tailwind
- **تجربة سلسة**: انتقالات وحركات متطورة باستخدام GSAP

### 🔧 التقنيات المستخدمة

#### Frontend Framework
- **Vue 3** - إطار عمل JavaScript متقدم
- **TypeScript** - لكتابة كود أكثر أماناً ووضوحاً
- **Vite** - أداة بناء سريعة وحديثة
- **Vue Router** - إدارة التنقل بين الصفحات

#### إدارة الحالة
- **Pinia** - مكتبة إدارة الحالة الرسمية لـ Vue 3
- **Stores منظمة**: 
  - `cart.ts` - إدارة سلة التسوق
  - `user.ts` - معلومات المستخدم
  - `checkout.ts` - عملية الدفع والشحن
  - `wishlist.ts` - قائمة الأمنيات

#### التصميم والأنماط
- **Tailwind CSS** - إطار عمل CSS utility-first
- **CSS Custom Properties** - متغيرات CSS مخصصة
- **GSAP** - مكتبة الرسوم المتحركة المتقدمة
- **Lucide Vue** - مكتبة الأيقونات الحديثة

#### الأدوات والتطوير
- **Playwright** - اختبارات الواجهة الآلية
- **PostCSS** - معالجة CSS
- **Autoprefixer** - إضافة البادئات التلقائية

## 📁 هيكل المشروع

```
jeeey.mweb/
├── 📄 index.html                 # الصفحة الرئيسية
├── 📄 package.json              # إعدادات المشروع والتبعيات
├── 📄 vite.config.ts            # إعدادات Vite
├── 📄 tailwind.config.js        # إعدادات Tailwind CSS
├── 📄 postcss.config.cjs        # إعدادات PostCSS
├── 📄 playwright.config.ts      # إعدادات الاختبارات
├── 📁 scripts/                  # سكريبتات مساعدة
│   └── 📄 smoke.js              # اختبارات سريعة
├── 📁 tests/                    # ملفات الاختبار
│   └── 📄 smoke.spec.ts         # اختبارات Playwright
├── 📁 src/                      # الكود المصدري
│   ├── 📄 main.ts               # نقطة دخول التطبيق
│   ├── 📄 App.vue               # المكون الرئيسي
│   ├── 📄 styles.css            # الأنماط العامة
│   ├── 📄 tailwind.css          # أنماط Tailwind
│   ├── 📄 tokens.css            # متغيرات التصميم
│   ├── 📄 tracking.ts           # نظام التتبع والتحليلات
│   ├── 📄 routes.generated.ts   # المسارات المولدة تلقائياً
│   ├── 📁 components/           # المكونات القابلة لإعادة الاستخدام
│   │   ├── 📁 account/          # مكونات الحساب
│   │   │   ├── 📄 ActivitySummaryRow.vue
│   │   │   ├── 📄 ClubStatsStrip.vue
│   │   │   ├── 📄 GuestAccount.vue
│   │   │   ├── 📄 OrderStatusRow.vue
│   │   │   ├── 📄 ProfileHeroCard.vue
│   │   │   └── 📄 PromoProductCard.vue
│   │   ├── 📄 AppHeader.vue     # رأس التطبيق
│   │   ├── 📄 AppHeaderAccount.vue
│   │   ├── 📄 BottomNav.vue     # التنقل السفلي
│   │   ├── 📄 BottomSheet.vue   # الورقة السفلية
│   │   ├── 📄 Carousel.vue      # معرض الصور
│   │   ├── 📄 CategoryGrid.vue  # شبكة التصنيفات
│   │   ├── 📄 CategoryPills.vue # حبوب التصنيفات
│   │   ├── 📄 CategoryScroller.vue
│   │   ├── 📄 CategorySidebar.vue
│   │   ├── 📄 CategoryTile.vue
│   │   ├── 📄 ConsentBanner.vue # شريط الموافقة
│   │   ├── 📄 CouponBadge.vue   # شارة الكوبون
│   │   ├── 📄 CurrencySwitcher.vue
│   │   ├── 📄 DailyNewStrip.vue
│   │   ├── 📄 DiscountRow.vue
│   │   ├── 📄 HeaderBar.vue
│   │   ├── 📄 HeaderSearch.vue
│   │   ├── 📄 HeroBanner.vue    # البانر الرئيسي
│   │   ├── 📄 HorizontalProducts.vue
│   │   ├── 📄 Icon.vue          # مكون الأيقونات
│   │   ├── 📄 MembershipCards.vue
│   │   ├── 📄 OrdersStatusBar.vue
│   │   ├── 📄 PriceRow.vue
│   │   ├── 📄 ProductCard.vue   # بطاقة المنتج
│   │   ├── 📄 ProductGrid.vue   # شبكة المنتجات
│   │   ├── 📄 PromoBanners.vue
│   │   ├── 📄 PromoStrip.vue
│   │   ├── 📄 QuickLinksBar.vue
│   │   ├── 📄 RatingStars.vue   # نجوم التقييم
│   │   ├── 📄 RecommendedProducts.vue
│   │   ├── 📄 SectionHeading.vue
│   │   ├── 📄 ServicesGrid.vue
│   │   ├── 📄 SideFilter.vue
│   │   ├── 📄 SkeletonGrid.vue  # هيكل التحميل
│   │   ├── 📄 SortFilterBar.vue
│   │   ├── 📄 SvgBanner.vue
│   │   ├── 📄 TabsBar.vue
│   │   ├── 📄 TopTabs.vue
│   │   ├── 📄 UserInfoCard.vue
│   │   ├── 📄 WalletBar.vue
│   │   ├── 📄 WebPushSubscribe.vue
│   │   └── 📄 WishlistBar.vue
│   ├── 📁 lib/                  # المكتبات المساعدة
│   │   ├── 📄 api.ts            # وظائف API
│   │   ├── 📄 currency.ts       # إدارة العملات
│   │   └── 📄 slug.ts           # معالجة الروابط
│   ├── 📁 pages/                # صفحات التطبيق (814 صفحة)
│   │   ├── 📁 auth/             # صفحات المصادقة
│   │   │   └── 📁 google/
│   │   ├── 📁 c/                # صفحات التصنيفات
│   │   ├── 📄 Home.vue          # الصفحة الرئيسية
│   │   ├── 📄 Categories.vue    # صفحة التصنيفات
│   │   ├── 📄 Account.vue       # صفحة الحساب
│   │   ├── 📄 Product.vue       # صفحة المنتج
│   │   ├── 📄 Checkout.vue      # صفحة الدفع
│   │   ├── 📄 Cart.vue          # صفحة السلة
│   │   ├── 📄 Wishlist.vue      # صفحة الأمنيات
│   │   ├── 📄 Orders.vue        # صفحة الطلبات
│   │   ├── 📄 Search.vue        # صفحة البحث
│   │   └── ... (صفحات أخرى)
│   └── 📁 store/                # إدارة الحالة
│       ├── 📄 cart.ts           # سلة التسوق
│       ├── 📄 user.ts           # بيانات المستخدم
│       ├── 📄 checkout.ts       # عملية الدفع
│       └── 📄 wishlist.ts       # قائمة الأمنيات
└── 📄 TAILWIND_NOTES.md         # ملاحظات Tailwind
```

## 🛠️ التثبيت والتشغيل

### المتطلبات
- **Node.js** (الإصدار 16 أو أحدث)
- **npm** أو **pnpm** أو **yarn**

### خطوات التثبيت

1. **استنساخ المشروع**
```bash
git clone <repository-url>
cd jeeey.mweb
```

2. **تثبيت التبعيات**
```bash
npm install
# أو
pnpm install
# أو
yarn install
```

3. **تشغيل خادم التطوير**
```bash
npm run dev
# أو
pnpm dev
# أو
yarn dev
```

4. **بناء المشروع للإنتاج**
```bash
npm run build
# أو
pnpm build
# أو
yarn build
```

5. **معاينة الإنتاج**
```bash
npm run preview
# أو
pnpm preview
# أو
yarn preview
```

## 📱 الصفحات الرئيسية

### 🏠 الصفحة الرئيسية (`Home.vue`)
- **البانر الرئيسي**: عرض العروض والخصومات
- **التصنيفات**: شبكة تفاعلية للفئات
- **المنتجات المميزة**: عروض كبرى وترندات
- **قسم "من أجلك"**: منتجات مخصصة للمستخدم
- **التنقل السفلي**: وصول سريع للأقسام الرئيسية

### 🛍️ صفحة المنتج (`Product.vue`)
- **معرض الصور**: قابل للتمرير مع إمكانية التكبير
- **معلومات المنتج**: السعر، التقييمات، الوصف
- **اختيار المقاس واللون**: واجهة تفاعلية
- **إضافة للسلة**: مع رسوم متحركة
- **المنتجات ذات الصلة**: اقتراحات ذكية

### 🛒 صفحة السلة (`Cart.vue`)
- **عرض العناصر**: مع إمكانية التعديل والحذف
- **حساب الإجمالي**: شامل الضرائب والشحن
- **تطبيق الكوبونات**: نظام خصومات متقدم
- **الانتقال للدفع**: عملية سلسة

### 💳 صفحة الدفع (`Checkout.vue`)
- **إدارة العناوين**: إضافة وتعديل العناوين
- **طرق الشحن**: خيارات متعددة مع الأسعار
- **طرق الدفع**: دعم شامل للدفع
- **تأكيد الطلب**: مراجعة نهائية

### 👤 صفحة الحساب (`Account.vue`)
- **معلومات المستخدم**: عرض البيانات الشخصية
- **نادي JEEEY**: نظام النقاط والمكافآت
- **إحصائيات**: الطلبات والنقاط
- **الخدمات السريعة**: روابط للأقسام المهمة

## 🔧 المكونات الرئيسية

### 🧩 مكونات قابلة لإعادة الاستخدام

#### `ProductCard.vue`
```vue
<template>
  <article class="product-card">
    <!-- صورة المنتج مع العروض -->
    <!-- معلومات المنتج -->
    <!-- أزرار الإجراءات -->
  </article>
</template>
```
- عرض معلومات المنتج بشكل جذاب
- دعم العروض والخصومات
- رسوم متحركة عند الإضافة للسلة
- تكامل مع قائمة الأمنيات

#### `AppHeader.vue`
```vue
<template>
  <header class="app-header">
    <!-- شعار المتجر -->
    <!-- أزرار التنقل -->
    <!-- عداد السلة -->
  </header>
</template>
```
- رأس ثابت مع تأثيرات التمرير
- عداد السلة المحدث تلقائياً
- أزرار سريعة للبحث والمفضلة

#### `BottomNav.vue`
```vue
<template>
  <nav class="bottom-nav">
    <!-- روابط التنقل الرئيسية -->
  </nav>
</template>
```
- تنقل سفلي ثابت
- مؤشر الصفحة النشطة
- عداد السلة

### 🎨 مكونات التصميم

#### `HeroBanner.vue`
- بانر رئيسي قابل للتخصيص
- دعم الصور المتجاوبة
- نصوص وأزرار مخصصة

#### `CategoryGrid.vue`
- شبكة تصنيفات تفاعلية
- تحميل ديناميكي من API
- تصميم متجاوب

## 🔄 إدارة الحالة (Pinia Stores)

### 🛒 سلة التسوق (`cart.ts`)
```typescript
export const useCart = defineStore('cart', {
  state: () => ({
    items: [] as CartItem[],
    loaded: false
  }),
  getters: {
    count: (s) => s.items.reduce((n, i) => n + i.qty, 0),
    total: (s) => s.items.reduce((n, i) => n + i.qty * i.price, 0)
  },
  actions: {
    add(item, qty = 1) { /* إضافة منتج */ },
    remove(id) { /* حذف منتج */ },
    update(id, qty) { /* تحديث الكمية */ },
    syncFromServer() { /* مزامنة مع الخادم */ }
  }
})
```

### 👤 المستخدم (`user.ts`)
```typescript
export const useUser = defineStore('user', {
  state: () => ({
    isLoggedIn: false,
    username: 'jeeey',
    clubLevel: 'S0',
    points: 0,
    orders: 1
  })
})
```

### 💳 الدفع (`checkout.ts`)
```typescript
export const useCheckout = defineStore('checkout', {
  state: () => ({
    address: undefined as Address | undefined,
    shipping: undefined as ShippingMethod | undefined,
    payment: undefined as string | undefined
  })
})
```

### ❤️ قائمة الأمنيات (`wishlist.ts`)
```typescript
export const useWishlist = defineStore('wishlist', {
  state: () => ({
    items: [] as WishItem[],
    loaded: false
  }),
  actions: {
    add(item) { /* إضافة للمفضلة */ },
    remove(id) { /* حذف من المفضلة */ },
    toggle(item) { /* تبديل الحالة */ }
  }
})
```

## 🌐 API والتكامل

### 📡 مكتبة API (`lib/api.ts`)
```typescript
// إعدادات API
export const API_BASE = 'https://api.jeeey.com'

// وظائف HTTP
export async function apiGet<T>(path: string): Promise<T | null>
export async function apiPost<T>(path: string, body?: any): Promise<T | null>

// المصادقة
function getAuthHeader(): Record<string,string>
export function googleLoginUrl(next?: string): string
```

### 🔐 نظام المصادقة
- **Google OAuth**: تسجيل دخول سهل
- **JWT Tokens**: أمان متقدم
- **Session Management**: إدارة الجلسات
- **Cookie Handling**: معالجة ملفات تعريف الارتباط

### 📊 نظام التتبع (`tracking.ts`)
```typescript
export async function injectTracking(): Promise<void> {
  // Google Analytics
  // Facebook Pixel
  // TikTok Pixel
  // Sentry Error Tracking
  // Web Vitals
}
```

## 🎨 التصميم والأنماط

### 🎯 نظام التصميم
```css
:root {
  --primary: #0B5FFF;
  --accent: #F59E0B;
  --danger: #EF4444;
  --success: #16A34A;
  --font: 'Tajawal', system-ui, sans-serif;
  --radius: 12px;
}
```

### 📱 التجاوب
- **Mobile First**: تصميم محسن للهواتف
- **Breakpoints**: نقاط كسر متعددة
- **Touch Friendly**: عناصر سهلة اللمس
- **RTL Support**: دعم كامل للعربية

### 🎭 الرسوم المتحركة
```typescript
// GSAP Animations
gsap.to(element, {
  duration: 0.6,
  ease: 'power1.inOut',
  // خصائص الحركة
})
```

## 🧪 الاختبارات

### 🔍 اختبارات Playwright
```typescript
// tests/smoke.spec.ts
test('Home page loads correctly', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('h1')).toBeVisible()
})
```

### ⚡ اختبارات سريعة
```bash
npm run smoke  # اختبارات سريعة
```

## 🚀 النشر والإنتاج

### 📦 بناء المشروع
```bash
npm run build
```
- **تحسين الكود**: minification و tree-shaking
- **تحسين الصور**: ضغط وتحويل التنسيقات
- **Code Splitting**: تقسيم الكود للتحميل السريع

### 🌐 متغيرات البيئة
```bash
# .env
VITE_API_BASE=https://api.jeeey.com
VITE_GA_MEASUREMENT_ID=GA-XXXXXXXXX
VITE_FB_PIXEL_ID=XXXXXXXXXXXXXXX
```

## 📈 الأداء والتحسين

### ⚡ تحسينات الأداء
- **Lazy Loading**: تحميل كسول للصور
- **Code Splitting**: تقسيم الكود
- **Image Optimization**: تحسين الصور
- **Caching**: تخزين مؤقت ذكي

### 📊 Web Vitals
- **LCP**: Largest Contentful Paint
- **FID**: First Input Delay
- **CLS**: Cumulative Layout Shift
- **INP**: Interaction to Next Paint

## 🔧 التطوير والصيانة

### 📝 سكريبتات مفيدة
```bash
# تطوير
npm run dev

# بناء
npm run build

# معاينة
npm run preview

# اختبارات
npm run smoke

# Figma sync
npm run figma:sync
```

### 🎨 Figma Integration
```bash
npm run figma:tokens    # استخراج الرموز
npm run figma:generate  # توليد المكونات
npm run figma:assets    # مزامنة الأصول
```

## 🤝 المساهمة

### 📋 إرشادات المساهمة
1. **Fork** المشروع
2. إنشاء **branch** جديد للميزة
3. **Commit** التغييرات
4. **Push** إلى الـ branch
5. إنشاء **Pull Request**

### 🐛 الإبلاغ عن الأخطاء
- استخدم نظام Issues في GitHub
- وصف مفصل للمشكلة
- خطوات إعادة إنتاج المشكلة
- معلومات البيئة

## 📄 الترخيص

هذا المشروع مرخص تحت [MIT License](LICENSE).

## 📞 الدعم والاتصال

- **البريد الإلكتروني**: support@jeeey.com
- **الموقع**: https://jeeey.com
- **التوثيق**: https://docs.jeeey.com

---

**تم تطوير هذا المشروع بعناية فائقة ليوفر أفضل تجربة تسوق إلكتروني للمستخدمين العرب. نرحب بجميع المساهمات والاقتراحات لتحسين المشروع!** 🚀
