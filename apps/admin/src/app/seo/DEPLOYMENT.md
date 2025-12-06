# 🚀 دليل النشر والإنتاج - نظام SEO

## 📋 قائمة التحقق قبل النشر

### 1. قاعدة البيانات
```bash
# تحديث قاعدة البيانات
cd packages/db
pnpm db:push

# أو استخدام migrations للإنتاج
pnpm db:migrate
```

### 2. متغيرات البيئة
تأكد من إعداد المتغيرات التالية:

```env
# Database
DATABASE_URL="postgresql://user:password@host:5432/dbname"

# API
PORT=4000
NODE_ENV=production
JWT_SECRET="your-secret-key"

# SEO (اختياري)
SITE_NAME="اسم موقعك"
SITE_URL="https://yoursite.com"
```

### 3. بناء المشروع
```bash
# في المجلد الرئيسي
pnpm install

# بناء قاعدة البيانات
cd packages/db
pnpm build

# بناء API
cd ../api
pnpm build

# بناء Admin Panel
cd ../../apps/admin
pnpm build
```

### 4. اختبار النظام
```bash
# اختبار API
cd packages/api
pnpm test

# اختبار Admin Panel
cd ../../apps/admin
pnpm test
```

---

## 🌐 النشر على الخادم

### خيار 1: PM2 (موصى به)

#### تثبيت PM2
```bash
npm install -g pm2
```

#### تشغيل API
```bash
cd packages/api
pm2 start dist/index.js --name "seo-api"
```

#### تشغيل Admin Panel
```bash
cd apps/admin
pm2 start npm --name "seo-admin" -- start
```

#### حفظ التكوين
```bash
pm2 save
pm2 startup
```

### خيار 2: Docker

#### Dockerfile للـ API
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY dist ./dist
EXPOSE 4000
CMD ["node", "dist/index.js"]
```

#### Dockerfile للـ Admin
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY .next ./.next
COPY public ./public
EXPOSE 3000
CMD ["npm", "start"]
```

#### docker-compose.yml
```yaml
version: '3.8'
services:
  api:
    build: ./packages/api
    ports:
      - "4000:4000"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - NODE_ENV=production
    restart: always

  admin:
    build: ./apps/admin
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_BASE_URL=http://api:4000
    depends_on:
      - api
    restart: always
```

---

## 🔧 إعداد Nginx

### تكوين Nginx للـ API
```nginx
server {
    listen 80;
    server_name api.yoursite.com;

    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### تكوين Nginx للـ Admin Panel
```nginx
server {
    listen 80;
    server_name admin.yoursite.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### إضافة SSL (Let's Encrypt)
```bash
# تثبيت Certbot
sudo apt install certbot python3-certbot-nginx

# الحصول على شهادة SSL
sudo certbot --nginx -d api.yoursite.com
sudo certbot --nginx -d admin.yoursite.com
```

---

## 📊 المراقبة والصيانة

### 1. مراقبة PM2
```bash
# عرض الحالة
pm2 status

# عرض السجلات
pm2 logs

# إعادة التشغيل
pm2 restart all

# إيقاف
pm2 stop all
```

### 2. مراقبة قاعدة البيانات
```bash
# الاتصال بقاعدة البيانات
psql -U username -d dbname

# فحص حجم الجدول
SELECT pg_size_pretty(pg_total_relation_size('SeoPage'));

# فحص عدد السجلات
SELECT COUNT(*) FROM "SeoPage";
```

### 3. النسخ الاحتياطي
```bash
# نسخ احتياطي لقاعدة البيانات
pg_dump -U username dbname > backup_$(date +%Y%m%d).sql

# استعادة النسخة الاحتياطية
psql -U username dbname < backup_20251204.sql
```

---

## 🔐 الأمان

### 1. تحديث المتغيرات السرية
```bash
# توليد JWT Secret جديد
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 2. تفعيل CORS
في `packages/api/src/index.ts`:
```typescript
app.use(cors({
  origin: ['https://admin.yoursite.com'],
  credentials: true
}));
```

### 3. تفعيل Rate Limiting
```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 دقيقة
  max: 100 // حد أقصى 100 طلب
});

app.use('/api/admin/seo', limiter);
```

---

## 📈 تحسين الأداء

### 1. تفعيل Caching
```typescript
// في API
import NodeCache from 'node-cache';
const cache = new NodeCache({ stdTTL: 600 }); // 10 دقائق

app.get('/api/admin/seo/pages', async (req, res) => {
  const cached = cache.get('seo_pages');
  if (cached) return res.json(cached);
  
  const pages = await db.seoPage.findMany();
  cache.set('seo_pages', pages);
  res.json(pages);
});
```

### 2. تحسين قاعدة البيانات
```sql
-- إضافة فهارس
CREATE INDEX IF NOT EXISTS "SeoPage_slug_idx" ON "SeoPage"("slug");
CREATE INDEX IF NOT EXISTS "SeoPage_updated_idx" ON "SeoPage"("updatedAt" DESC);

-- تحليل الجداول
ANALYZE "SeoPage";
```

### 3. ضغط الاستجابات
```typescript
import compression from 'compression';
app.use(compression());
```

---

## 🌍 SEO للموقع نفسه

### 1. إنشاء Sitemap
```typescript
// packages/api/src/routes/sitemap.ts
app.get('/sitemap.xml', async (req, res) => {
  const pages = await db.seoPage.findMany();
  
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${pages.map(page => `
    <url>
      <loc>https://yoursite.com/${page.slug}</loc>
      <lastmod>${page.updatedAt.toISOString()}</lastmod>
      <priority>0.8</priority>
    </url>
  `).join('')}
</urlset>`;

  res.header('Content-Type', 'application/xml');
  res.send(xml);
});
```

### 2. إنشاء robots.txt
```typescript
app.get('/robots.txt', (req, res) => {
  res.type('text/plain');
  res.send(`User-agent: *
Allow: /
Sitemap: https://yoursite.com/sitemap.xml`);
});
```

---

## 📱 التكامل مع Google Search Console

### 1. التحقق من الملكية
أضف في `<head>`:
```html
<meta name="google-site-verification" content="YOUR_CODE" />
```

### 2. إرسال Sitemap
1. اذهب إلى [Google Search Console](https://search.google.com/search-console)
2. أضف موقعك
3. اذهب إلى Sitemaps
4. أضف: `https://yoursite.com/sitemap.xml`

### 3. مراقبة الأداء
- راقب الفهرسة
- راقب الأخطاء
- راقب الكلمات المفتاحية

---

## 🔄 التحديثات

### تحديث النظام
```bash
# سحب آخر التحديثات
git pull origin main

# تحديث الحزم
pnpm install

# تحديث قاعدة البيانات
cd packages/db
pnpm db:push

# إعادة البناء
cd ../api
pnpm build

cd ../../apps/admin
pnpm build

# إعادة تشغيل PM2
pm2 restart all
```

---

## 🆘 استكشاف الأخطاء

### المشكلة: API لا يعمل
```bash
# فحص السجلات
pm2 logs seo-api

# فحص المنفذ
netstat -tulpn | grep 4000

# إعادة التشغيل
pm2 restart seo-api
```

### المشكلة: قاعدة البيانات لا تتصل
```bash
# فحص الاتصال
psql -U username -d dbname -c "SELECT 1"

# فحص متغيرات البيئة
echo $DATABASE_URL
```

### المشكلة: Admin Panel بطيء
```bash
# فحص استخدام الذاكرة
pm2 monit

# زيادة الذاكرة
pm2 restart seo-admin --max-memory-restart 500M
```

---

## 📞 الدعم

### الموارد
- 📖 الوثائق: `README.md`
- 🚀 دليل البدء: `QUICK_START.md`
- 🔧 التكامل: `INTEGRATION.md`

### الأدوات المفيدة
- [PM2 Documentation](https://pm2.keymetrics.io/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

---

**ملاحظة**: استبدل `yoursite.com` بنطاقك الفعلي في جميع الأمثلة.

**آخر تحديث**: ديسمبر 2025  
**الحالة**: ✅ جاهز للإنتاج
