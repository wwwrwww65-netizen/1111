## Responsive Dashboard Wireframes (Textual)

- Overview (Desktop)
  - Row 1: 6 KPI cards (auto-fit, min 180px).
  - Row 2: FilterBar (wrap on small widths).
  - Row 3: UTM summary table (scroll-x if needed).
  - Row 4: Today Sessions table with Export.
  - Row 5: Spark mini-charts row (3 columns).

- Overview (Mobile)
  - KPI cards stack (1 per row).
  - FilterBar fields collapse into 2 rows; presets select first.
  - Tables full-width; avoid horizontal scroll by truncating URLs with ellipsis.

- Realtime
  - Cards: 4 metrics grid; below: FilterBar (compact) and Events list.

- Sales/Orders
  - Header: title + export.
  - FilterBar; chart area 280px height with lazy skeleton.

- Products/Vendors/Potential
  - Header: title + search (products) + export.
  - FilterBar; data table; pagination as needed (future).

RTL Considerations:
- Labels right-aligned; numeric values align visually; ellipsis on LTR URLs.
- Keyboard focus order follows visual order; all controls reachable.


