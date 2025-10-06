# Admin Enhancement Workplan (Branch: hash)

This document tracks the execution plan for enhancing the Admin across 18 areas with fixes, UX improvements, and safety measures. Each section lists scope, tasks, acceptance criteria, risks, and rollout plan.

## 1) Auth & SSO & 2FA
- Scope: login, 2FA enable/verify/disable, SSO (OIDC), cookie->Authorization proxy.
- Tasks:
  - Unify error messages, add lockout banner when `failedLoginAttempts` exceeds policy.
  - Add optional prod rate-limit for auth endpoints (proxy-safe).
  - Improve SSO health-check (issuer/client/redirect) with clear UI status.
- Acceptance:
  - Auth flows pass E2E, rate-limit active on prod, SSO self-test OK.
- Risks: proxy header trust; Mitigation: `trust proxy` correct, staging test.

## 2) Dashboard KPIs & Series
- Scope: KPIs, recent orders/tickets, system health, live drivers.
- Tasks:
  - Persist user filters, add growth deltas (WoW/MoM), lazy-load charts.
  - Improve empty/loading states and CSV export accuracy.
- Acceptance: filters persist per user; no layout shift; chart loads <1.5s.

## 3) Catalog: Products
- Scope: list, bulk delete, create (Analyze/Parse/Generate), media upload, vendors & attributes pickers.
- Tasks:
  - Variant & Inventory editor (sizes/colors/SKU rules), draft/publish states.
  - Product SEO fields; validation for required data; image compression path.
- Acceptance: create/edit with variants; SEO saved; no broken images.

## 4) Catalog: Categories
- Scope: CRUD, image/SEO/slug/translations, reorder, tree view.
- Tasks:
  - Unique slug instant validation; safer deletes; drag-and-drop reorder UX.
  - SEO snippet preview; translations JSON editor with schema hints.
- Acceptance: reorder persists; slug conflicts prevented client-side.

## 5) Catalog: Attributes
- Scope: colors/brands/size-types/sizes.
- Tasks:
  - Guard deletes when in-use; search/filter; consistent toasts.
- Acceptance: in-use checks active; list filters responsive.

## 6) Media Library
- Scope: list/search/upload/edit/delete; alt/dominantColors/checksum.
- Tasks:
  - Multi-upload with progress; client-side crop; WebP/AVIF generation; dedupe.
- Acceptance: large uploads stable; size reduced >30%; dedupe works.

## 7) Orders
- Scope: list/export/create/assign-driver/ship/refund/status transitions; detail page shipments/labels.
- Tasks:
  - Order timeline with internal notes; clearer status progress UI.
- Acceptance: timeline shows all mutations; CSV matches visible filters.

## 8) Logistics
- Scope: pickup/warehouse/delivery tabs, proof (signature/photo), exports, live map.
- Tasks:
  - Retry/offline queue for proof uploads; ETA and clustering on map.
- Acceptance: intermittent network tolerated; proof never lost.

## 9) Drivers/Shipments/Carriers
- Scope: drivers CRUD, ping, ledger/docs; carriers CRUD; shipments list/export.
- Tasks:
  - Expiry reminders for documents; role-based fine-grained permissions.
- Acceptance: reminders visible; role matrix enforced on endpoints/UI.

## 10) Finance
- Scope: PnL, Cashflow, Expenses (CRUD/import), Invoices (schedule/settle), Revenues, Gateways, Suppliers ledger.
- Tasks:
  - Bank reconcile rules; validations; better XLSX exports.
- Acceptance: reconcile matches sample bank statements; exports open cleanly.

## 11) Marketing & Coupons & Analytics
- Scope: campaigns/coupons, performance reports, analytics (realtime/segments/funnels).
- Tasks:
  - Visual coupon rule editor; saved analytics reports; UTM analysis polish.
- Acceptance: rules composable without code; saved views reload reliably.

## 12) Notifications (WhatsApp/Email/SMS-ready)
- Scope: rules/manual/targeted DSL; logs; WA smart send/diagnose.
- Tasks:
  - Visual rules editor; multi-channel abstractions; template preview.
- Acceptance: rule hits visible; strict WA passes; email/sms pluggable.

## 13) Users & RBAC
- Scope: users list/roles/permissions; bulk role assignment.
- Tasks:
  - Audit log per user; advanced filters; CSV/Excel export.
- Acceptance: role assignments audited; exports correct.

## 14) Vendors
- Scope: list/detail (orders/ledger/docs/scorecard/notifications), catalog upload.
- Tasks:
  - Catalog import validator/mapping assistant; progress UI; doc expiry alerts.
- Acceptance: invalid files rejected with guidance; mapping saved.

## 15) Settings & System
- Scope: shipping zones/rates, payment methods, consent, carts, monitoring.
- Tasks:
  - Confirm dangerous ops; pre-change backups; granular permissions.
- Acceptance: protected actions require confirm; change logs recorded.

## 16) Backups
- Scope: run/list/restore/schedule.
- Tasks:
  - Retention UI; notifications; progress; sizes/time columns.
- Acceptance: schedule saved; restore audited; alerts sent.

## 17) Reviews/Tickets/Returns/CMS
- Scope: reviews moderation; tickets (assign/comment/close); returns; CMS pages.
- Tasks:
  - SLA indicators for tickets/returns; WYSIWYG for CMS; filters.
- Acceptance: SLA statuses computed; CMS content sanitized.

## 18) Loyalty/Badges/Subscriptions/Wallet/FX/Affiliate
- Scope: points accounts/log; badges CRUD; subscriptions; wallet; fx; affiliate.
- Tasks:
  - Unified ledgers; payouts; FX screen; dashboards for loyalty/affiliate.
- Acceptance: ledger integrity checks; payouts export; fx conversions reliable.

---

## Cross-cutting (Quality & Safety)
- Tests: unit + integration + E2E (Playwright) added per module.
- Feature flags for risky UI; progressive rollout.
- CI: type-check (gradually enable), lint, build, smoke, and e2e.
- Security: single CORS source in prod, rate-limit sensitive routes, audit logs.

## Rollout Plan
1) Phase 1: Stability/UX (loaders, errors, debounce/abort, CORS/limits) — 1–2 weeks.
2) Phase 2: Data/Flows (variants, timeline, reconcile, rules editor) — 2–3 weeks.
3) Phase 3: Dashboards/Automation (ledgers, reminders, fx, saved reports) — 2–4 weeks.

## Done Definition
- All acceptance criteria met, tests green, CI smokes pass, no P0/P1 regressions, PR reviewed/approved.
