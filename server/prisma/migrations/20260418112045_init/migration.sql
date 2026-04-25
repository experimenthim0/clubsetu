-- CreateEnum
CREATE TYPE "AdminRoleType" AS ENUM ('admin', 'facultyCoordinator', 'paymentAdmin');

-- CreateEnum
CREATE TYPE "ClubMemberRole" AS ENUM ('CLUB_HEAD', 'COORDINATOR', 'MEMBER');

-- CreateEnum
CREATE TYPE "EventMode" AS ENUM ('online', 'offline');

-- CreateEnum
CREATE TYPE "ParticipationStatus" AS ENUM ('REGISTERED', 'ATTENDED', 'WAITLISTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED');

-- CreateEnum
CREATE TYPE "PayoutStatus" AS ENUM ('PENDING', 'COMPLETED');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('DRAFT', 'PENDING', 'PUBLISHED', 'REJECTED');

-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('IMAGE', 'VIDEO', 'SPONSOR_LOGO');

-- CreateTable
CREATE TABLE "AdminRole" (
    "id" VARCHAR(24) NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "AdminRoleType" NOT NULL DEFAULT 'admin',
    "isTwoStepEnabled" BOOLEAN NOT NULL DEFAULT false,
    "otp" TEXT,
    "otpExpire" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentUser" (
    "id" VARCHAR(24) NOT NULL,
    "rollNo" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "branch" TEXT,
    "year" TEXT,
    "program" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "isTwoStepEnabled" BOOLEAN NOT NULL DEFAULT false,
    "otp" TEXT,
    "otpExpire" TIMESTAMP(3),
    "verificationToken" TEXT,
    "verificationTokenExpire" TIMESTAMP(3),
    "resetPasswordToken" TEXT,
    "resetPasswordExpire" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Club" (
    "id" VARCHAR(24) NOT NULL,
    "clubName" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "clubLogo" TEXT,
    "category" TEXT,
    "clubEmail" TEXT,
    "facultyName" TEXT,
    "facultyEmail" TEXT,
    "facultyCoordinatorId" VARCHAR(24),
    "bankName" TEXT,
    "accountHolderName" TEXT,
    "accountNumber" TEXT,
    "ifscCode" TEXT,
    "upiId" TEXT,
    "bankPhone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Club_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClubSocialLink" (
    "id" VARCHAR(24) NOT NULL,
    "clubId" VARCHAR(24) NOT NULL,
    "platform" TEXT NOT NULL,
    "url" TEXT NOT NULL,

    CONSTRAINT "ClubSocialLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClubMembership" (
    "id" VARCHAR(24) NOT NULL,
    "clubId" VARCHAR(24) NOT NULL,
    "studentId" VARCHAR(24) NOT NULL,
    "role" "ClubMemberRole" NOT NULL DEFAULT 'MEMBER',
    "canTakeAttendance" BOOLEAN NOT NULL DEFAULT true,
    "canEditEvents" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ClubMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" VARCHAR(24) NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT,
    "venue" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "entryFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "clubId" VARCHAR(24) NOT NULL,
    "createdById" VARCHAR(24) NOT NULL,
    "reviewStatus" "ReviewStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedById" VARCHAR(24),
    "description" TEXT,
    "imageUrl" TEXT,
    "totalSeats" INTEGER NOT NULL DEFAULT 0,
    "registeredCount" INTEGER NOT NULL DEFAULT 0,
    "requiredFields" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "customFields" JSONB,
    "allowedPrograms" TEXT[] DEFAULT ARRAY['BTECH', 'MTECH', 'OTHER']::TEXT[],
    "allowedYears" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "registrationDeadline" TIMESTAMP(3),
    "winners" JSONB,
    "showWinner" BOOLEAN NOT NULL DEFAULT false,
    "provideCertificate" BOOLEAN NOT NULL DEFAULT false,
    "certificateTemplate" JSONB,
    "reviewComment" TEXT,
    "waitingListIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Participation" (
    "id" VARCHAR(24) NOT NULL,
    "eventId" VARCHAR(24) NOT NULL,
    "studentId" VARCHAR(24),
    "externalEmail" TEXT,
    "externalName" TEXT,
    "status" "ParticipationStatus" NOT NULL DEFAULT 'REGISTERED',
    "qrCode" TEXT,
    "attendedAt" TIMESTAMP(3),
    "markedByMemberId" VARCHAR(24),
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'SUCCESS',
    "amountPaid" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "paymentId" TEXT,
    "orderId" TEXT,
    "paymentTimestamp" TIMESTAMP(3),
    "formResponses" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Participation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sponsor" (
    "id" VARCHAR(24) NOT NULL,
    "name" TEXT NOT NULL,
    "logoUrl" TEXT NOT NULL,
    "websiteUrl" TEXT,
    "clubId" VARCHAR(24),
    "eventId" VARCHAR(24),

    CONSTRAINT "Sponsor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Media" (
    "id" VARCHAR(24) NOT NULL,
    "url" TEXT NOT NULL,
    "type" "MediaType" NOT NULL DEFAULT 'IMAGE',
    "clubId" VARCHAR(24),
    "eventId" VARCHAR(24),

    CONSTRAINT "Media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" VARCHAR(24) NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "senderStudentId" VARCHAR(24),
    "senderAdminId" VARCHAR(24),
    "readBy" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AdminRole_email_key" ON "AdminRole"("email");

-- CreateIndex
CREATE UNIQUE INDEX "StudentUser_rollNo_key" ON "StudentUser"("rollNo");

-- CreateIndex
CREATE UNIQUE INDEX "StudentUser_email_key" ON "StudentUser"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Club_clubName_key" ON "Club"("clubName");

-- CreateIndex
CREATE UNIQUE INDEX "Club_slug_key" ON "Club"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "ClubMembership_clubId_studentId_key" ON "ClubMembership"("clubId", "studentId");

-- CreateIndex
CREATE UNIQUE INDEX "Event_slug_key" ON "Event"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Participation_qrCode_key" ON "Participation"("qrCode");

-- CreateIndex
CREATE INDEX "Participation_eventId_idx" ON "Participation"("eventId");

-- AddForeignKey
ALTER TABLE "Club" ADD CONSTRAINT "Club_facultyCoordinatorId_fkey" FOREIGN KEY ("facultyCoordinatorId") REFERENCES "AdminRole"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClubSocialLink" ADD CONSTRAINT "ClubSocialLink_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClubMembership" ADD CONSTRAINT "ClubMembership_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClubMembership" ADD CONSTRAINT "ClubMembership_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "StudentUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "AdminRole"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Participation" ADD CONSTRAINT "Participation_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Participation" ADD CONSTRAINT "Participation_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sponsor" ADD CONSTRAINT "Sponsor_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sponsor" ADD CONSTRAINT "Sponsor_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Media" ADD CONSTRAINT "Media_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Media" ADD CONSTRAINT "Media_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_senderStudentId_fkey" FOREIGN KEY ("senderStudentId") REFERENCES "StudentUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_senderAdminId_fkey" FOREIGN KEY ("senderAdminId") REFERENCES "AdminRole"("id") ON DELETE SET NULL ON UPDATE CASCADE;
