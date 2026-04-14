# Backend Refactoring Changes

This file documents the major, uncommitted changes introduced to normalize the database schema and split user roles across distinct models and API endpoints.

## 1. Database Schema Refactoring (`server/prisma/schema.prisma`)
The monolithic `User` model was completely replaced by a normalized, role-based architecture.

* **Distinct Identity Models:**
  * Added `AdminRole` (Platform admins, faculty coordinators, payment admins).
  * Added `StudentUser` (College students, club members, club heads).
  * Added `ExternalUser` (External participants from other colleges without roll numbers).
* **Participation Normalization:**
  * Split monolithic Registration into `CollegeEventParticipation` and `ExternalCollegeEventParticipation`.
  * Preserved payment tracking schema (paymentId, orderId, paymentStatus, amountPaid) to ensure existing Razorpay integration works.
* **Club Management Data:**
  * Replaced flat `string` arrays for members with a highly relational `ClubMembership` junction table joining `StudentUser` to `Club`.
  * Segmented social links and media out into `ClubSocialLink` and `ClubMedia`.
* **Polymorphic Relationships:**
  * Updated `Notification` model to support a multi-model sender via `senderAdminId` and `senderStudentId`.
  * Updated `Event` models to accurately track relationships for `createdBy` (StudentUser) and `reviewedBy` (AdminRole).

## 2. Authentication Flow Optimization (`server/routes/auth.js`, `server/middleware/auth.js`)
* **Endpoint Splitting:**
  * Replaced the single legacy `/login` endpoint with three highly specific, role-based login routes:
    * `POST /login/student` (Targets `StudentUser`)
    * `POST /login/admin` (Targets `AdminRole`)
    * `POST /login/external` (Targets `ExternalUser` via OTP flow without passwords)
  * Left the legacy `/login` path as a deprecated proxy redirecting behavior appropriately for backward compatibility during the frontend transition.
* **JWT Updates:** Modified `generateToken` middleware to include the `userType` (`"student"`, `"admin"`, or `"external"`) so controllers can securely route database executions.
* **MFA Integration:** Multi-factor authentication mechanisms were updated to enforce security rules specifically on `AdminRole` schemas or privileged `StudentUser` profiles.

## 3. Server Endpoints & Controllers (`server/routes/*`)
* **`routes/admin.js`:**
  * Removed internal `/login` copy and refactored dashboard stats, export, and complete-payout controllers to query new `CollegeEventParticipation` instead of legacy Registrations.
  * Overhauled `POST /clubs` to transactionally create three relational records on setup: The `Club`, the `StudentUser` as Club Head, and the `AdminRole` as Faculty Coordinator.
* **`routes/events.js` & `routes/payment.js`:**
  * Migrated queries creating and reading `Registration` records to `CollegeEventParticipation` and `ExternalCollegeEventParticipation` depending on `req.user.userType`. 
  * Refactored `getAuthorizedUserFromRequest` and `auth` middleware validations to check against normalized role structures.
* **`routes/users.js`:**
  * Split profile updates to target the distinct user tables based on the JWT `userType`. External users are restricted purely to non-privileged fields mapping to `ExternalUser`.
* **`routes/notifications.js`:**
  * Migrated sender lookups to track `senderAdminId` and `senderStudentId` accurately based on the origin of the broadcast.

## 4. Environment & Dependencies (`package.json`)
* **Dependencies:** Added `@prisma/config` internally to satisfy Prisma 7 standard configurations locally.
* **Configuration:** Transitioned the deprecated `url` property away from `schema.prisma` mapping it externally to stabilize configurations. The legacy `prisma.config.ts` was disabled during the migration to resolve node module compilation conflicts. 

---
**Summary:** `+1241`, `-808` lines changed across 16 files.
