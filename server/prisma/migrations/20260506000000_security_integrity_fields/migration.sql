-- Add fields referenced by authentication, password reset, and payout flows.
ALTER TABLE "AdminRole"
  ADD COLUMN IF NOT EXISTS "resetPasswordExpire" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "resetPasswordToken" TEXT,
  ADD COLUMN IF NOT EXISTS "passwordChangeCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "lastPasswordChangeDate" TIMESTAMP(3);

ALTER TABLE "StudentUser"
  ADD COLUMN IF NOT EXISTS "passwordChangeCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "lastPasswordChangeDate" TIMESTAMP(3);

ALTER TABLE "Event"
  ADD COLUMN IF NOT EXISTS "payoutStatus" "PayoutStatus" NOT NULL DEFAULT 'PENDING';

-- Read-path indexes for event, participation, notification, and lost-found screens.
CREATE INDEX IF NOT EXISTS "Participation_studentId_createdAt_idx" ON "Participation"("studentId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "Participation_eventId_paymentStatus_idx" ON "Participation"("eventId", "paymentStatus");
CREATE INDEX IF NOT EXISTS "Participation_eventId_status_idx" ON "Participation"("eventId", "status");
CREATE INDEX IF NOT EXISTS "Event_clubId_startTime_idx" ON "Event"("clubId", "startTime" DESC);
CREATE INDEX IF NOT EXISTS "Event_reviewStatus_startTime_idx" ON "Event"("reviewStatus", "startTime");
CREATE INDEX IF NOT EXISTS "Event_createdById_startTime_idx" ON "Event"("createdById", "startTime");
CREATE INDEX IF NOT EXISTS "ClubMembership_studentId_idx" ON "ClubMembership"("studentId");
CREATE INDEX IF NOT EXISTS "ClubMembership_clubId_role_idx" ON "ClubMembership"("clubId", "role");
CREATE INDEX IF NOT EXISTS "LostFoundItem_userId_createdAt_idx" ON "LostFoundItem"("userId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "LostFoundItem_status_createdAt_idx" ON "LostFoundItem"("status", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "LostFoundItem_isFraud_createdAt_idx" ON "LostFoundItem"("isFraud", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "Notification_createdAt_idx" ON "Notification"("createdAt" DESC);
