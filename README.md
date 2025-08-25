# منصة التجارة الإلكترونية - Monorepo

هذا المشروع عبارة عن منصة تجارة إلكترونية كاملة مبنية بأحدث التقنيات.

## هيكل المشروع

- `apps/web`: تطبيق Next.js للويب (واجهة العملاء)
- `apps/mobile`: تطبيق React Native (Expo) للهواتف المحمولة
- `packages/api`: API خلفي باستخدام tRPC/Express.js
- `packages/db`: مخطط Prisma وعميل قاعدة البيانات
- `packages/ui`: مكونات React مشتركة للويب والهاتف المحمول
- `infra`: Docker Compose للتطوير و Terraform للإنتاج

## المتطلبات الأساسية

- Node.js (الإصدار 18 أو أحدث)
- pnpm (الإصدار 8 أو أحدث)
- Docker و Docker Compose

## التثبيت والتشغيل

### 1. استنساخ المشروع

```bash
git clone <repository_url>
cd ecom-platform
git checkout cursor/check-and-install-project-environment-2224
```

### 2. تثبيت التبعيات

```bash
pnpm install
```

### 3. إعداد متغيرات البيئة

```bash
cp .env.example .env
```

ملف `.env` يحتوي على الإعدادات الافتراضية للعمل مع Docker المحلي.

### 4. تشغيل الخدمات المحلية

```bash
# تشغيل Docker daemon (إذا لم يكن يعمل)
sudo dockerd --iptables=false --ip-forward=false &

# تشغيل الخدمات المحلية
sudo docker-compose -f infra/dev-docker-compose.yml up -d
```

### 5. هجرة قاعدة البيانات

```bash
# تطبيق مخطط قاعدة البيانات
pnpm --filter @repo/db db:migrate

# (اختياري) فتح Prisma Studio لتصفح البيانات
pnpm --filter @repo/db db:studio
```

### 6. تشغيل التطبيقات

#### تشغيل جميع التطبيقات معاً:
```bash
pnpm dev
```

#### تشغيل كل تطبيق منفرداً:
```bash
# تشغيل تطبيق الويب
pnpm web

# تشغيل تطبيق الهاتف المحمول
pnpm mobile

# تشغيل API
pnpm api
```

## الخدمات المتاحة

بعد التشغيل، ستكون الخدمات التالية متاحة:

- **تطبيق الويب**: http://localhost:3000
- **API**: http://localhost:4000
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379
- **MinIO Console**: http://localhost:9001
- **Prisma Studio**: http://localhost:5555

## التقنيات المستخدمة

- **Monorepo**: pnpm, Turborepo
- **الويب**: Next.js, React, TypeScript, Tailwind CSS
- **الهاتف المحمول**: React Native, Expo
- **الخلفية**: Express.js, tRPC, TypeScript
- **قاعدة البيانات**: PostgreSQL, Prisma
- **البنية التحتية**: Docker, Redis, MinIO
- **CI/CD**: GitHub Actions

## استكشاف الأخطاء

### مشاكل Docker
إذا واجهت مشاكل مع Docker:
```bash
# تشغيل Docker بدون iptables
sudo dockerd --iptables=false --ip-forward=false &

# التحقق من حالة الحاويات
sudo docker ps
```

### مشاكل قاعدة البيانات
إذا واجهت مشاكل في الاتصال بقاعدة البيانات:
```bash
# إعادة تشغيل خدمة PostgreSQL
sudo docker-compose -f infra/dev-docker-compose.yml restart postgres

# التحقق من الاتصال
psql postgresql://user:password@localhost:5432/ecom_db
```

### مشاكل التبعيات
إذا واجهت مشاكل في التبعيات:
```bash
# حذف node_modules وإعادة التثبيت
rm -rf node_modules
pnpm install
```

## المساهمة

1. انسخ المشروع
2. أنشئ فرع جديد للميزة
3. قم بالتطوير
4. ارفع التغييرات
5. أنشئ Pull Request

## الترخيص

هذا المشروع مرخص تحت رخصة MIT.
