-- Materialized views for daily aggregates (optional)
-- Requires manual refresh: REFRESH MATERIALIZED VIEW CONCURRENTLY mv_event_pageviews_daily;

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_event_pageviews_daily AS
SELECT to_char(date_trunc('day', "createdAt"), 'YYYY-MM-DD') AS day,
       COUNT(*)::bigint AS views
FROM "Event"
WHERE name='page_view'
GROUP BY 1;

CREATE INDEX IF NOT EXISTS idx_mv_ev_pv_day ON mv_event_pageviews_daily (day);

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_visitors_daily AS
SELECT to_char(date_trunc('day', "firstSeenAt"), 'YYYY-MM-DD') AS day,
       COUNT(*)::bigint AS sessions,
       COUNT(DISTINCT COALESCE("userId","anonymousId"))::bigint AS visitors
FROM "VisitorSession"
GROUP BY 1;

CREATE INDEX IF NOT EXISTS idx_mv_visitors_day ON mv_visitors_daily (day);


