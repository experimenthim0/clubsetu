-- Supporting indexes for the highest-volume foreign-key and feed lookups.
CREATE INDEX IF NOT EXISTS "ClubSocialLink_clubId_idx" ON "ClubSocialLink" ("clubId");
CREATE INDEX IF NOT EXISTS "Media_clubId_idx" ON "Media" ("clubId");
CREATE INDEX IF NOT EXISTS "Media_eventId_idx" ON "Media" ("eventId");
CREATE INDEX IF NOT EXISTS "Sponsor_clubId_idx" ON "Sponsor" ("clubId");
CREATE INDEX IF NOT EXISTS "Sponsor_eventId_idx" ON "Sponsor" ("eventId");
CREATE INDEX IF NOT EXISTS "LostFoundReport_itemId_createdAt_idx" ON "LostFoundReport" ("itemId", "createdAt");
CREATE INDEX IF NOT EXISTS "LostFoundReport_reporterId_idx" ON "LostFoundReport" ("reporterId");
CREATE INDEX IF NOT EXISTS "LostFoundReport_liarId_idx" ON "LostFoundReport" ("liarId");
CREATE INDEX IF NOT EXISTS "Notification_eventId_createdAt_idx" ON "Notification" ("eventId", "createdAt");
CREATE INDEX IF NOT EXISTS "Notification_teamId_createdAt_idx" ON "Notification" ("teamId", "createdAt");