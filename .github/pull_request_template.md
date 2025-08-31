## Summary

Implement Admin non-product modules (feature/admin-non-product-modules): REST (RBAC+2FA+rate‑limits+audit), Admin UI pages (dark), webhooks, tests, docs, CI.

## Migrations Added
- Prisma schema updates for: RBAC (Role/Permission/Links), AuditLog, SupportTicket, ReturnRequest, LoyaltyPoint, CMSPage, Vendor, MediaAsset, Integration, Setting, Event, BackupJob, ProductVariant.purchasePrice

## Seeds Added
- Admin-only seed (admin user, base roles/permissions, minimal categories; no products)

## Docs Links
- Swagger UI: /docs
- OpenAPI: packages/api/src/openapi.yaml
- Postman: docs/Postman_Collection_Admin.json

## CI Results
- Please attach CI run links/logs here once green.

## How to run locally
```bash
pnpm install
export DATABASE_URL=... DIRECT_URL=... JWT_SECRET=...
pnpm --filter @repo/db db:push && pnpm --filter @repo/db db:seed:admin-only
pnpm build
pnpm --filter @repo/api dev # API at 4000
pnpm --filter admin dev     # Admin app
```

## Checklist
- [ ] All Admin modules implemented per acceptance criteria
- [ ] Migrations apply locally with no errors
- [ ] Seeds run and populate required data (no products)
- [ ] All /api/admin/... endpoints protected (RBAC + optional 2FA) and rate-limited
- [ ] Webhooks handlers with signature verification
- [ ] OpenAPI/Swagger and Postman collection updated
- [ ] CI: migration-run-check, seed-run-check, build, lint, api-tests, e2e-admin-check all green
- [ ] Admin UI tables: filters, search, bulk actions with undo, CSV/PDF export, inline editing
- [ ] Media upload integrated (provider), Settings persisted
- [ ] RBAC roles/permissions finalized, 2FA implemented
- [ ] Audit logs page available and informative
- [ ] README updated with env vars and commands
- [ ] Screenshots/2–3 min video link attached

