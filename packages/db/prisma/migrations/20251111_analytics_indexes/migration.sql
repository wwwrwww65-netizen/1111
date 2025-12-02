-- Additional indexes to speed analytics queries
CREATE INDEX IF NOT EXISTS "Event_country_createdAt_idx" ON "Event"("country","createdAt");
CREATE INDEX IF NOT EXISTS "Event_device_createdAt_idx" ON "Event"("device","createdAt");
CREATE INDEX IF NOT EXISTS "Event_referrer_idx" ON "Event"("referrer");
CREATE INDEX IF NOT EXISTS "Event_pageUrl_idx" ON "Event"("pageUrl");
CREATE INDEX IF NOT EXISTS "VisitorSession_firstSeenAt_idx" ON "VisitorSession"("firstSeenAt");

-- Materialized daily rollups (manual REFRESH MATERIALIZED VIEW recommended via cron)
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_event_page_views_daily AS
SELECT date_trunc('day', "createdAt")::date AS day, COUNT(*)::bigint AS views
FROM "Event" WHERE name='page_view'
GROUP BY 1;
CREATE INDEX IF NOT EXISTS mv_event_page_views_daily_day_idx ON mv_event_page_views_daily(day);

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_visitor_sessions_daily AS
SELECT date_trunc('day', "firstSeenAt")::date AS day,
       COUNT(*)::bigint AS sessions,
       COUNT(DISTINCT COALESCE("userId","anonymousId"))::bigint AS visitors
FROM "VisitorSession"
GROUP BY 1;
CREATE INDEX IF NOT EXISTS mv_visitor_sessions_daily_day_idx ON mv_visitor_sessions_daily(day);


