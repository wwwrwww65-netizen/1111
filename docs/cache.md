## نظام التخزين المؤقت (Cache)

النطاقات المدعومة: `jeeey.com` (WEB) و `m.jeeey.com` (MWEB).

### الجداول
- CacheRule: `id, name, domain, pattern, targetType, policy, ttlSeconds, autoPurge, perEntryLimitBytes, totalCapBytes, createdBy, createdAt`
- CacheEntry: `key, domain, type, sizeBytes, createdAt, expiresAt, hitCount, ownerId`
- CacheJob: `id, type, payload, status, idempotencyKey, startedAt, finishedAt, createdAt, createdBy, domain`

### نقاط النهاية (جميعها تتطلب Auth token)

- GET `/api/admin/cache/stats` → إحصاءات عامة (الحجم، hit-rate، حالة الوظائف)
- GET `/api/admin/cache/rules?page=&limit=` → قائمة القواعد
- POST `/api/admin/cache/rules`
  - body: `{ name, domain:'WEB'|'MWEB'|'BOTH', pattern, targetType:'Page'|'Tab'|'Category'|'Banner'|'All', policy:'Immediate'|'Wait'|'Delay'|'Pending', ttlSeconds?, autoPurge?, perEntryLimitBytes?, totalCapBytes? }`
- PUT `/api/admin/cache/rules/:id` → تعديل القاعدة
- DELETE `/api/admin/cache/rules/:id` → حذف القاعدة

- GET `/api/admin/cache/entries?domain=&type=&page=&limit=` → قائمة المحتويات
- POST `/api/admin/cache/entries/bulk`
  - body: `{ action:'purge'|'warm'|'delete', keys:[], domain? }` → يرجع `{ job_id, status }`

- POST `/api/admin/cache/purge`
  - body: `{ keys?: string[], tags?: string[], domain?: 'WEB'|'MWEB'|'BOTH' }` → يرجع `{ job_id, status }`
- POST `/api/admin/cache/warm`
  - body: `{ urls: string[], domain: 'WEB'|'MWEB'|'BOTH' }` → يرجع `{ job_id, status }`

- POST `/api/events/product_published`
  - body: `{ product_id: number, domain: 'jeeey.com'|'m.jeeey.com', tags: string[], user_id: string, timestamp?: string }`
  - يعيد `{ job_id, status }` ويضع وظيفتي purge + warm ذات صلة.
  - استخدم header: `Idempotency-Key` لمنع التكرار.

### السياسات
- Immediate: عرض فوري + تنفيذ Purge ثم Warm.
- Wait: الانتظار حتى تنفيذ Purge قبل العرض.
- Delay X hours: الظهور بعد عدد ساعات محدد (1–168). استخدم `ttlSeconds = X*3600`.
- Pending: يتطلب موافقة من المدير (غير مفعّلة افتراضياً — يمكن تفعيلها لاحقاً).

### التدفق
Publish → Event (`/api/events/product_published`) → Queue (CacheJob: product_published) → ينشئ وظيفتي Purge + Warm → Worker ينفّذهما → تحديث CacheEntry/Summary → تُعرض الإحصاءات في صفحة Cache.

### قيود وأمان
- لا يتم تخزين صفحات خاصة بالجلسة أو الحساسة؛ عمليات Warm تستخدم طلبات عامة فقط.
- يجب عدم تطبيق القواعد على السلة، الحساب، نقاط/كوبونات، أو أي صفحات تحتوي بيانات شخصية.
- جميع العمليات تُسجَّل في `AuditLog` عبر `module='cache'`.

### Presets
- TTL: 1h, 2h, 6h, 12h, 24h, 48h.
- Job status: `pending | running | success | failed`.

### ملاحظات
- يدعم النظام `Idempotency-Key` على عمليات Purge/Warm/Event.
- يتوفر Worker داخلي (in-process) يعمل على فترات قصيرة لمعالجة `CacheJob`.


