## Categories Designer (Removed)

### Status
- **Deprecated**: The categories page manager/designer feature has been retired as of 2025-10-31.
- Related admin routes (`/api/admin/categories/page*`) and storefront route (`/api/categories/page`) now return HTTP `410 Gone`.
- Stored configurations in `Setting` (`categoriesPage:{site}:{mode}`) are purged by migration `20251031_remove_categories_page_settings`.

### Current Behaviour
- Mobile web categories page renders from static defaults plus live catalog data (`/api/categories`).
- Suggestions, sidebar labels, and promo banner fall back to built-in constants defined in `apps/mweb/src/pages/Categories.vue`.
- Admin navigation and design sections no longer expose links to a categories page designer or manager.

### Action Items
- Remove any downstream dependencies that assumed the builder APIs (integrations, automation scripts, QA scenarios).
- Update QA test plans to skip references to the removed workflow.
- If a future configurable categories page is required, design a new spec from scratch without relying on the legacy draft/live model.
