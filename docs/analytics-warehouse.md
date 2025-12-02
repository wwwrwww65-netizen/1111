# Analytics Warehouse Integration (Outline)

## Targets
- BigQuery, ClickHouse, or Postgres replica.

## Data Model
- Raw tables: Event, VisitorSession, Order, OrderItem, User, Product.
- Star schema: fact_events, fact_orders; dims: dim_users, dim_products, dim_dates, dim_channels.

## Ingestion
- Daily/Hourly batch jobs to copy new rows (`createdAt` watermark).
- Optional streaming for realtime dashboards.

## Aggregations
- Materialized views for daily KPIs (see `packages/db/prisma/sql/materialized_analytics.sql`).

## Access
- BI tools (Looker/Metabase/Superset) connect to warehouse.
- Service accounts with read-only permissions; row-level security for multi-tenant.

## Governance
- Data retention policies; PII minimization; audit of data exports.


