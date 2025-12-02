-- Suggested indexes for analytics performance
-- Event table
CREATE INDEX IF NOT EXISTS idx_event_createdat ON "Event" ("createdAt");
CREATE INDEX IF NOT EXISTS idx_event_name_createdat ON "Event" (name, "createdAt");
CREATE INDEX IF NOT EXISTS idx_event_session ON "Event" (COALESCE("sessionId", (properties->>'sessionId')));
CREATE INDEX IF NOT EXISTS idx_event_user ON "Event" (COALESCE("userId", (properties->>'userId')));
CREATE INDEX IF NOT EXISTS idx_event_pageurl ON "Event" (COALESCE("pageUrl", (properties->>'pageUrl')));
-- VisitorSession table
CREATE INDEX IF NOT EXISTS idx_vs_firstseen ON "VisitorSession" ("firstSeenAt");
CREATE INDEX IF NOT EXISTS idx_vs_lastseen ON "VisitorSession" ("lastSeenAt");
CREATE INDEX IF NOT EXISTS idx_vs_user ON "VisitorSession" ("userId");


