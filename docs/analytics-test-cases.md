## Analytics Test Cases

- KPI Today
  - Load `/analytics` with range Today; KPIs show numeric values.
  - Period-over-period deltas visible for orders and revenue.
  - Error injection (simulate 500): error banner shows with Retry.
- Filter Bar
  - Presets: Today / 7d / 30d / This Month update from/to.
  - Device/channel/country/UTM/page/userSegment propagate to API (checked via network).
- Products Analytics
  - Filtered list updates and shows friendly product name (no IDs).
  - Export CSV link includes applied filters; file downloads.
  - Empty state shows message, not an empty silent table.
- Orders/Revenue Series
  - Chart renders with selected granularity (day/week/month).
  - Export CSV downloads with header and rows.
- Funnels
  - Cards populate; empty shows “لا توجد بيانات”.
  - Error state shows banner and retry.
- Retention (Cohorts)
  - Table rows render weekly cohorts; empty and error states covered.
- Acquisition (UTM)
  - UTM table loads; error state visible on failure.
  - Facebook analytics (if configured) shows ROAS/CPA.
- Realtime
  - Metrics refresh every 5s; error state banner shows on failure.
  - Events table scrolls; device string readable; no raw IDs.
- Vendors / Potential
  - Tables render; names used; no raw IDs; exports not required.
- Sessions Today
  - “تحديث” populates grouped sessions; durations computed.
  - Export CSV downloads with applied rows.
- Permissions / RBAC (spot)
  - Exports are available; ensure only visible to authorized roles (API enforces).
- Responsive + RTL
  - Mobile viewport: grids stack without horizontal scroll.
  - RTL alignment preserved; keyboard navigation works on FilterBar and tables.


