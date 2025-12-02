## Admin Analytics Improvements - Changelog

- Added `apps/admin/src/app/lib/http.ts` with `safeFetchJson`, `buildUrl`, and standardized error+retry view.
- Refactored analytics pages to use `safeFetchJson` with `res.ok` checks and clear error states:
  - `analytics/page.tsx` (overview): KPIs with period-over-period deltas; added "Today Sessions" table with export.
  - `analytics/products/page.tsx`: Filters wired to `/api/admin/analytics/products/table`, error handling, filtered CSV export; removed raw IDs from UI.
  - `analytics/orders/page.tsx`: Error handling, filtered CSV export.
  - `analytics/sales/page.tsx`: Error handling, filtered CSV export.
  - `analytics/realtime/page.tsx`: Error handling.
  - `analytics/funnels/page.tsx`, `analytics/retention/page.tsx`, `analytics/acquisition/page.tsx`, `analytics/vendors/page.tsx`, `analytics/potential/page.tsx`, `analytics/users/page.tsx`: Error handling.
  - `system/analytics/page.tsx`: Fixed misuse of `res.ok`; now proper error handling and retry.
- Enhanced `FilterBar`:
  - Date presets: Today, Last 7 days, Last 30 days, This Month.
  - Added `page` and `userSegment` dropdowns.
  - Converted UTM inputs to dropdowns to avoid free-form IDs.
- Exports:
  - Ensured CSV exports include currently applied filters where applicable.
- Tests:
  - Added `apps/admin/tests/analytics-smoke.test.ts` to smoke-check KPI endpoint for today's range.

Notes:
- All analytics calls now route via existing proxy `/api/admin/*`.
- No raw JSON or IDs shown in analytics tables; friendlier labels used.
- Existing charts remain lazy-loaded; skeletons shown during loads.


