# Admin Modules Acceptance Checklist

- [ ] Inventory
- [ ] Orders
- [ ] Shipping & Fulfillment
- [ ] Payments & Finance
- [ ] Users & RBAC (with 2FA optional)
- [ ] Customer Support (Tickets)
- [ ] Returns & Refunds
- [ ] Promotions & Coupons
- [ ] Loyalty
- [ ] Marketing & CMS
- [ ] Recommendations & Trends (events ingestion)
- [ ] Analytics Dashboard (KPIs)
- [ ] Vendors
- [ ] Media Library
- [ ] Integrations
- [ ] System Settings
- [x] Backups & Exports (Run/List/Restore, retention 30d, schedule)

## CI Checks
- [ ] migration-run-check
- [ ] seed-run-check
- [ ] build, lint
- [x] unit, integration (Backups run→list→restore)
- [ ] e2e-admin-check

## Artifacts
- [ ] Swagger/OpenAPI
- [ ] Postman collection
- [ ] README updated
- [ ] Screenshots/Video (2–3 min)

## Stage Status
- [x] Stage 1: Docs (/docs), CI security scan, Audit logs UI
- [x] Stage 2: API tests (webhooks+admin flow), Postman expansion
- [ ] Stage 3: Bulk actions, PDF export, 2FA endpoints, Media upload provider, inline edits
- [ ] Stage 4: PR preparation, checklist finalize, CI green, reviewers approvals