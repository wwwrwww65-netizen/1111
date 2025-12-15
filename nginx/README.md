# Nginx Configuration for mweb SSR

## الغرض
هذا الملف يحتوي على إعدادات Nginx لتوجيه روبوتات السوشيال ميديا (Facebook, WhatsApp, Twitter) إلى Backend API للحصول على Server-Side Rendering (SSR) مع Meta Tags كاملة، بينما المستخدمين العاديين يتم توجيههم إلى Next.js للحصول على تجربة تفاعلية.

## الصفحات المدعومة
- `/categories` - صفحة التصنيفات
- `/products` - صفحة المنتجات
- `/cart` - سلة التسوق
- `/search` - صفحة البحث
- `/account` - صفحة الحساب
- `/wishlist` - المفضلة
- `/checkout` - صفحة الدفع

## كيفية التطبيق

### الطريقة الآلية (عبر GitHub Actions):
1. الملف سيتم نسخه تلقائياً إلى `/etc/nginx/snippets/mweb-ssr.conf` عند الـ deployment
2. سيتم تضمينه تلقائياً في ملف `/etc/nginx/sites-available/jeeey.conf`

### الطريقة اليدوية (للاختبار):
```bash
# 1. نسخ الملف إلى السيرفر
scp nginx/mweb-ssr.conf root@72.60.191.144:/etc/nginx/snippets/

# 2. تعديل ملف jeeey.conf لتضمين الملف
ssh root@72.60.191.144
nano /etc/nginx/sites-available/jeeey.conf

# 3. أضف هذا السطر داخل server block الخاص بـ m.jeeey.com
# (بعد السطر 385 تقريباً، قبل location ~ ^/(p|product|c|category)/)
include /etc/nginx/snippets/mweb-ssr.conf;

# 4. اختبر الإعدادات
nginx -t

# 5. إذا كانت الإعدادات صحيحة، أعد تحميل Nginx
systemctl reload nginx
```

## التحقق من عمل SSR

### اختبار من Terminal:
```bash
# اختبار كروبوت Facebook
curl -A "facebookexternalhit/1.1" https://m.jeeey.com/categories | grep -E "(og:|twitter:)" | head -10

# يجب أن ترى Meta Tags مثل:
# <meta property="og:title" content="الفئات | جي jeeey" />
# <meta property="og:description" content="جميع التصنيفات والفئات" />
# <meta property="og:image" content="https://..." />
```

### اختبار من Facebook Debugger:
1. افتح: https://developers.facebook.com/tools/debug/
2. الصق: https://m.jeeey.com/categories
3. اضغط "Scrape Again"
4. يجب أن ترى Preview Card كامل

### اختبار من WhatsApp:
1. افتح WhatsApp
2. الصق الرابط: https://m.jeeey.com/categories
3. انتظر 2-3 ثواني
4. يجب أن ترى Preview Card مع الصورة والعنوان

## الروبوتات المدعومة
- `facebookexternalhit` - Facebook
- `WhatsApp` - WhatsApp
- `Twitterbot` - Twitter
- `LinkedInBot` - LinkedIn
- `TelegramBot` - Telegram
- `Slackbot` - Slack
- `Discordbot` - Discord
- `Google-InspectionTool` - Google Rich Results Test
- `Googlebot` - Google Search
- `bingbot` - Bing Search
- `Baiduspider` - Baidu Search
- `YandexBot` - Yandex Search
- `DuckDuckBot` - DuckDuckGo Search

## ملاحظات مهمة
- المستخدمين العاديين لن يتأثروا - سيحصلون على Next.js كالمعتاد
- فقط الروبوتات ستحصل على SSR من Backend
- هذا يضمن:
  - ✅ Preview Cards جميلة على السوشيال ميديا
  - ✅ SEO محسّن لمحركات البحث
  - ✅ تجربة مستخدم سريعة (Next.js)

## استكشاف الأخطاء

### إذا لم تظهر Meta Tags:
1. تأكد من أن Backend يعمل على port 4000
2. تأكد من أن الصفحة موجودة في قاعدة البيانات (SeoPage)
3. افحص logs: `tail -f /var/log/nginx/error.log`
4. اختبر API مباشرة: `curl http://localhost:4000/api/seo/meta?slug=/categories`

### إذا ظهرت صفحة فارغة:
1. تأكد من أن Next.js يعمل على port 3000
2. افحص logs: `pm2 logs mweb`

## الدعم
للمزيد من المساعدة، راجع:
- `packages/api/src/routers/public-seo.ts` - Backend SSR logic
- `packages/api/src/routers/seo.ts` - Admin Panel SEO management
