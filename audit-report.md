## Full Repository Audit Report

Generated: ${DATE}

### Overview
- Monorepo using pnpm + Turborepo
- Apps: `apps/web` (Next.js 14), `apps/admin` (Next.js 14), `apps/mobile` (Expo/React Native)
- Packages: `packages/api` (Express + tRPC), `packages/db` (Prisma + PostgreSQL), `packages/ui` (shared React UI), `packages/eslint-config-custom`, `packages/typescript-config`
- Infra: `infra/dev-docker-compose.yml` (Postgres, Redis, MinIO)
- CI/CD: GitHub Actions workflows in `.github/workflows`

---

### Languages, Frameworks, Tooling
- Node.js: engines >=18 (root `package.json` L24-L26)
- TypeScript 5 (various packages)
- Next.js 14.2.3 (web/admin `package.json`)
- React 18.2.0
- Express 4, tRPC v10
- Prisma 5.14.0, PostgreSQL
- Expo ~51 / React Native 0.74.5 (mobile)
- Tailwind CSS 3.4 (web)
- Turborepo, pnpm, Jest

Dependency manifests discovered:
- Root: `/package.json`
- Web: `/apps/web/package.json`
- Admin: `/apps/admin/package.json`
- Mobile: `/apps/mobile/package.json`
- API: `/packages/api/package.json`
- DB: `/packages/db/package.json`
- UI: `/packages/ui/package.json`

Notable third-party SDKs/Libraries:
- Payments: `stripe`
- Email: `nodemailer`
- Security: `helmet`, `express-rate-limit`, `jsonwebtoken`, `bcryptjs`
- Data: `@prisma/client`
- Frontend: `@tanstack/react-query`, `@trpc/*`, `tailwindcss`

Automated vulnerability scan: Not executed (network/time constraints in this environment). Recommend running: `pnpm audit --prod` and/or `npx snyk test` in CI with org token. No known critical CVEs observed from versions at-a-glance, but verification is required.

---

### Repository Structure Summary
- Root build: `turbo.json` (tasks), `pnpm-workspace.yaml`
- CI/CD: `.github/workflows/*.yml`
- Infra: `infra/dev-docker-compose.yml`
- API entry: `packages/api/src/index.ts` (L21-L80)
- Security middleware: `packages/api/src/middleware/security.ts` (CORS, Helmet, rate-limit)
- Auth middleware: `packages/api/src/middleware/auth.ts` (L6-L9 requires JWT_SECRET)
- Routers (tRPC): `packages/api/src/router.ts`; sub-routers under `packages/api/src/routers/*`
- DB schema: `packages/db/prisma/schema.prisma`
- Web app: `apps/web/src/app/*`
- Admin app: `apps/admin/src/app/*`
- Mobile app: `apps/mobile/*`

---

### Security & Privacy Audit

Findings (critical/high):
1) Admin token in localStorage (XSS-exfiltration risk)
   - File: `apps/admin/src/app/providers.tsx` L18-L21 reads `window.localStorage.getItem("auth_token")`
   - File: `apps/admin/src/app/login/page.tsx` L27 writes `window.localStorage.setItem("auth_token", token)`
   - Risk: Tokens in localStorage are readable by injected scripts (XSS). Prefer HttpOnly cookies.
   - Remediation:
     - Use HttpOnly secure cookies end-to-end; avoid localStorage. In tRPC `httpBatchLink`, send `credentials: 'include'` and rely on cookie set by server.

2) Admin login expects token in response payload but API sets cookie only
   - API login sets cookie (`ctx.res.cookie(...)`) and returns user (no token): `packages/api/src/routers/auth.ts` L103-L109
   - Admin login expects `json?.result?.data?.json?.token`: `apps/admin/src/app/login/page.tsx` L25-L27
   - Result: Admin login will fail to persist auth correctly.
   - Remediation: Rely on Set-Cookie and configure client to include credentials; stop parsing token from response.

3) Cookies not sent from web/admin by default
   - `httpBatchLink` in web/admin providers does not set `credentials: 'include'` so browser will not send cookies cross-origin.
   - Files:
     - Web: `apps/web/src/app/providers.tsx` L17-L21
     - Admin: `apps/admin/src/app/providers.tsx` L14-L23
   - Remediation: Provide a custom fetch in `httpBatchLink` that sets `credentials: 'include'`.

4) Missing Stripe webhook verification endpoint
   - No webhook route found for Stripe events (e.g., payment_intent.succeeded). Payments flow only uses client confirmation.
   - Files: `packages/api/src/routers/payments.ts` (entire file) – no webhook.
   - Risk: Order/payment state can drift; no source-of-truth verification; potential fraud disputes.
   - Remediation: Add `/webhooks/stripe` endpoint using raw body and `stripe.webhooks.constructEvent` with secret.

5) CSRF considerations with cookies
   - Cookies are used for auth (HttpOnly). With `sameSite: 'none'` (auth.ts L10-L16), cross-site requests will include cookie. Without CSRF token, state-changing endpoints may be susceptible if CORS misconfigured.
   - CORS currently restricts origins (security.ts L7-L14) and uses credentials. Ensure production origin is strict and add CSRF token (double-submit or header + SameSite=Lax where feasible).

6) Content Security Policy allows `'unsafe-inline'` styles
   - File: `packages/api/src/middleware/security.ts` L41-L50 (`styleSrc: ["'self'", "'unsafe-inline'"]`).
   - Risk: Inline style XSS vectors remain possible.
   - Remediation: Remove `'unsafe-inline'` and adopt nonces/hashes, or limit inline use.

Other security notes:
- JWT secret required at boot: `packages/api/src/middleware/auth.ts` L6-L9. Ensure not defaulting in production.
- No obvious plaintext secrets committed; CI uses test-only secrets (e.g., `JWT_SECRET: 'test_secret_for_ci_only'` in `.github/workflows/ci-cd.yml` L34). Rotate if ever exposed beyond CI.

Privacy:
- No analytics SDKs present (GA4, Pixel, Mixpanel). If added, document data collection, consent, and DSR flows.

---

### Backend API Audit
- Entry: `packages/api/src/index.ts` sets Helmet, CORS with credentials, rate limiting, cookie parsing. Health endpoints present.
- Auth: `packages/api/src/routers/auth.ts` uses bcrypt (SALT_ROUNDS=12) and HttpOnly cookie. Good baseline.
- Payments: `packages/api/src/routers/payments.ts` integrates Stripe for intents, refunds. No webhook.
- Orders: `packages/api/src/routers/orders.ts` creates orders from cart but does not decrement stock or lock inventory; no transaction.
- Cart: typical CRUD; no stock check on add/update.
- Search: `packages/api/src/routers/search.ts` uses Prisma filters, not full-text; indexes recommended (see DB).
- Admin: `packages/api/src/routers/admin.ts` guarded by `adminMiddleware`; numerous operations for products, categories, orders, users, coupons.

Recommendations:
- Add transactional stock updates (decrement on order/payment) using `prisma.$transaction` with adequate locking/validation.
- Add Stripe webhook for authoritative payment status and idempotency keys.
- Add input rate limits to auth/payment routes (authRateLimit exists but not applied in router – ensure usage).
- Enhance error handling with structured error codes; avoid generic `Error`.

---

### Database & Data Model
Prisma schema: `packages/db/prisma/schema.prisma`

Key models: `User`, `Product`, `ProductVariant`, `Cart`, `Order`, `Payment`, `Review`, `Category`, `Coupon`, `WishlistItem`.

Issues:
- `Address` model has `userId String @unique` (L124). This enforces at most one address per user, conflicting with `User.addresses Address[]` (L58). Decide: single default address vs. multiple addresses. If multiple required, remove `@unique` and add composite unique if needed (e.g., userId + some label).
- Missing indexes used by queries/filters:
  - `Product`: `categoryId`, `createdAt`, `price`, `isActive`, `tags` (GIN), `brand`
  - `Order`: `userId`, `createdAt`, `status`
  - `Payment`: `orderId`, `createdAt`, `status`
  - `Review`: `productId`, `userId`
  - `WishlistItem`: `userId`, `productId`

Suggested Prisma index additions:
```prisma
model Product {
  // ...existing fields
  @@index([categoryId])
  @@index([createdAt])
  @@index([price])
  @@index([isActive])
  // For tags array search, consider a PostgreSQL GIN index via @db and native SQL migration
}

model Order {
  // ...
  @@index([userId])
  @@index([createdAt])
  @@index([status])
}
```

Migrations/Backups:
- Prisma migrations present via scripts, but no backup/restore scripts. Recommend nightly logical backups, point-in-time recovery if using managed Postgres, and a tested restore runbook.

---

### Build & Deployment (CI/CD)
Workflows:
- `.github/workflows/ci-cd.yml`: sets up Postgres service, pushes schema, seeds DB, builds API/Web/Admin, runs tests for UI/API, uploads artifacts. Contains test-only secrets (L34-L39). No deployment provider; staging step is placeholder.
- Android APK workflows (`release-android-apk.yml`, `debug-android-apk.yml`): local prebuild with temporary keystore generation; suitable for CI artifacts, not store release.
- `eas-android-apk.yml`: EAS local build preview with `EXPO_TOKEN` secret.

Docker/K8s:
- `infra/dev-docker-compose.yml`: Postgres/Redis/MinIO for local dev. No app Dockerfiles in repo. For production, create Dockerfiles for API and Next apps or use managed platforms.

Local build instructions (validated):
1) Start infra: `docker-compose -f infra/dev-docker-compose.yml up -d`
2) Install deps: `pnpm install`
3) Set env:
   - `DATABASE_URL`, `DIRECT_URL`
   - `JWT_SECRET`
   - `STRIPE_SECRET_KEY`
   - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`
   - `NEXT_PUBLIC_TRPC_URL` (e.g., http://localhost:4000/trpc)
   - `NEXT_PUBLIC_APP_URL` (e.g., http://localhost:3000)
4) DB push/seed: `pnpm --filter @repo/db db:push && pnpm --filter @repo/db db:seed`
5) Run API: `pnpm --filter @repo/api dev`
6) Run Web/Admin: `pnpm --filter web dev`, `pnpm --filter admin dev`

Release notes:
- Next.js standalone output is used in CI artifacts. Provide production Dockerfiles using that output or deploy to Vercel/Render.

Secrets exposure check:
- No committed `.env*` files found. CI contains test-only secrets; keep restricted to CI context. If any real secrets appear in repo in future, rotate immediately and move to a vault.

---

### Frontend (Web/Admin) UX, SEO, Performance
Web (`apps/web`):
- App Router present, Arabic locale (`layout.tsx` sets `lang="ar"`), basic pages: home, products, cart, categories, checkout, search, account.
- Providers: missing credentials include for cookie auth (see Security #3).
- SEO: No `robots.txt`, `sitemap.xml`, canonical tags, or structured data. `metadataBase` uses localhost (update per env).
- Images: Next `images.remotePatterns` allows Unsplash only. For production, configure your CDN/domain and use Next Image for all product assets.
- Performance: Consider React Query cache strategies, route-level code splitting, dynamic imports for heavy components, and image optimization with WebP/AVIF.

Admin (`apps/admin`):
- Pages directories present (products, orders, users, payments, coupons, inventory, analytics, notifications, settings).
- Authentication wiring issues (see Security #1/#2/#3). Fix before use.

Mobile (`apps/mobile`):
- Expo app with TRPC link using `EXPO_PUBLIC_TRPC_URL`.
- No push notifications, deep links, or app store signing configs in-repo (CI generates temp keystore only). Not app-store ready.

---

### Payments, Orders & Inventory
- Payment intents are created and optionally confirmed. No webhook to reconcile final state.
- Order creation does not lock/decrement stock; cart cleared immediately after order creation.
- Recommend: On successful payment (webhook), decrement inventory in a transaction; handle partial refunds/returns; implement idempotent operations; protect against price tampering by validating server-side totals.

---

### Analytics & Reporting
- No GA4/Pixel/Mixpanel detected. Add consent-managed analytics and track e-commerce events: `view_item`, `add_to_cart`, `begin_checkout`, `purchase`.
- Admin dashboards exist server-side; ensure UI implements reporting (daily sales, top products, conversion rate, AOV).

---

### SEO, Performance, Accessibility
- Add `robots.txt`, `sitemap.xml`, canonical URLs, and JSON-LD product structured data.
- Measure Core Web Vitals (TTFB, LCP, FCP) after deploying staging; optimize images, enable caching headers, and adopt route-level streaming where helpful.
- Accessibility: ensure alt attributes for images, ARIA labels for interactive elements, keyboard navigation, and color contrast compliance.

---

### Testing
Existing:
- API and UI have Jest configs/scripts; web/mobile return placeholder test scripts.

Recommended initial test plan:
- Unit: auth utils, price/discount calc, cart operations, order totals.
- Integration: checkout flow (cart→order→payment intent→webhook), auth flows, coupons, admin CRUD.
- E2E: Cypress/Playwright for web critical paths.
- Load testing: k6/Artillery for `POST /trpc` hot paths (search, cart updates, order create).

---

### Actionable Remediations (Highlights)
1) Switch admin/web auth to HttpOnly cookies; remove localStorage token usage; configure `credentials: 'include'` in tRPC clients.
2) Implement Stripe webhook with signature verification; update payment/order status from webhook events.
3) Add DB indexes and fix `Address.userId @unique` if multiple addresses are intended.
4) Add CSRF protection strategy or tighten SameSite to `lax` where feasible.
5) Harden CSP; remove `'unsafe-inline'` styles and use nonces/hashes.
6) Implement inventory decrement/locking in transactions.
7) Add SEO assets (robots, sitemap, structured data) and analytics with consent.
8) Add production build/deploy docs and Dockerfiles.
9) Expand automated tests (web/mobile), and add vulnerability scanning to CI.
10) Configure image hosting/CDN for product images with Next Image domains.

---

### File/Line Evidence (select)
```packages/api/src/middleware/auth.ts
6: const JWT_SECRET = process.env.JWT_SECRET;
7: if (!JWT_SECRET) {
8:   throw new Error('JWT_SECRET environment variable is not set');
```

```apps/admin/src/app/providers.tsx
18:            if (typeof window === "undefined") return {};
19:            const token = window.localStorage.getItem("auth_token");
20:            return token ? { Authorization: `Bearer ${token}` } : {};
```

```apps/admin/src/app/login/page.tsx
25:              const token = json?.result?.data?.json?.token;
27:              window.localStorage.setItem("auth_token", token);
```

```packages/api/src/middleware/security.ts
41:  app.use(helmet({
45:        styleSrc: ["'self'", "'unsafe-inline'"],
```

```packages/db/prisma/schema.prisma
122: model Address {
124:   userId      String   @unique
```

---

End of report.

