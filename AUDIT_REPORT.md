# Omni-Protocol Phase 1 Audit Report

Date: 2026-05-06  
Scope: server, Prisma/PostgreSQL schema, client routing/auth surface, Cloudinary/media paths, and code hygiene.  
Status: Phase 1 only. No application code has been modified.

## Executive Summary

The project has several production-blocking issues in auth, Prisma schema drift, RBAC, and multi-write data integrity. The most serious risks are:

- `verifyToken` does not read the httpOnly `token` cookie even though login writes it, so cookie-based auth is broken unless `localStorage` still carries a bearer token.
- JWT claims include mutable authorization data (`role`, `clubId`, `email`) and middleware trusts those claims without reloading the user/role from PostgreSQL.
- `/api/admin/login` returns the full admin row, including the hashed password and OTP fields.
- Several routes reference fields that are absent from `schema.prisma` (`payoutStatus`, admin reset-token fields, password-change counters, student bank fields), causing runtime failures.
- Club membership mutation routes allow a `facultyCoordinator` or stale token-bearing user to update or delete memberships across clubs because controller-level ownership checks are missing.
- Event registration and payment verification can oversell seats and corrupt `registeredCount` under concurrency.
- Manual attendance can mark any `participationId` as attended for the wrong event because it does not bind the participation to `eventId`.
- Cloudinary signed upload is too broad and client-accessible, and uploaded assets are public rather than private/authenticated.

Note: I did not find a conventional ticketing system or `Ticket` model in this codebase. The closest state-machine surfaces are `Event.reviewStatus`, `Participation.status`, and `LostFoundItem.status`; findings below treat those as the ticketing/state flows present in the repo.

## Findings

| Severity | File:Line | Issue | Recommendation |
| --- | --- | --- | --- |
| Critical | `server/middleware/auth.js:30-45` | `verifyToken` only checks `Authorization`; it never reads `req.cookies.token`, despite login routes setting an httpOnly cookie. Cookie-only sessions fail auth and the client falls back to `localStorage` bearer tokens. | Read bearer first only if intentionally supported, otherwise read signed httpOnly cookie. Standardize on one transport and remove localStorage token storage. |
| Critical | `server/middleware/auth.js:17-23`, `server/middleware/auth.js:44-45`, `server/middleware/auth.js:53-61` | RBAC trusts `role`, `clubId`, `email`, and `userType` directly from a 7-day JWT. Role revocation, membership removal, blocked users, and club reassignment do not take effect until token expiry. | Keep JWT lean (`sub`, `typ`, `sid`, `iat`, `exp`, optional version). Reload user, role, blocked status, and memberships from PostgreSQL in auth middleware or cache with short TTL and token versioning. |
| Critical | `server/routes/admin.js:35-39` | `/api/admin/login` returns `{ ...admin }`, leaking `password`, `otp`, `otpExpire`, and security flags to the frontend. | Remove this duplicate login route or sanitize with `sanitizeUser`. Never return password hashes or OTP metadata. |
| Critical | `server/routes/auth.js:99-110` | Student registration generates `verificationToken` and expiry but never stores them. Email verification links can never resolve. | Persist `verificationToken` and `verificationTokenExpire` in the create call, or remove the email verification path entirely. |
| Critical | `server/routes/auth.js:180-182` | Student login has an empty `if (!student.isVerified)` block, so unverified users can log in. | Enforce verification with a returned 401, or deliberately remove verification fields and routes. |
| Critical | `server/routes/auth.js:470-473`, `server/routes/auth.js:542-550`, `server/prisma/schema.prisma:9-23` | Admin password reset writes/queries `resetPasswordToken` and `resetPasswordExpire`, but `AdminRole` has no such fields. Admin forgot/reset password will throw Prisma validation errors. | Add reset-token fields to `AdminRole` or remove admin reset support. |
| Critical | `server/routes/auth.js:587-596`, `server/prisma/schema.prisma:9-56` | Password change writes `passwordChangeCount` and `lastPasswordChangeDate`, but neither model defines these fields. Also `user.passwordChangeCount + 1` becomes `NaN` if undefined. | Add fields with defaults or remove rate-limit counter writes and implement a real password-change audit table. |
| Critical | `server/routes/admin.js:144-147`, `server/prisma/schema.prisma:107-142` | Payout completion writes `Event.payoutStatus`, but `Event` has no `payoutStatus` field even though `PayoutStatus` enum exists. Route always fails at runtime. | Add `payoutStatus PayoutStatus @default(PENDING)` to `Event` or remove payout routes. |
| Critical | `server/routes/admin.js:174-183`, `server/prisma/schema.prisma:25-56` | Payout bank-info endpoint reads `student.bankName`, `accountNumber`, etc., but those fields exist on `Club`, not `StudentUser`. Response is always empty/undefined. | Read bank info from the relevant `Club` by membership/clubId, or move bank fields to `StudentUser` if that is the domain model. |
| Critical | `server/routes/clubMembers.js:31-37`, `server/controllers/clubMemberController.js:126-168` | `updateMemberPermissions` has no ownership check. Any `facultyCoordinator` allowed by route middleware can update any membership by ID, including other clubs. | Load membership, verify admin or same-club faculty/head, then update. |
| Critical | `server/routes/clubMembers.js:34-37`, `server/controllers/clubMemberController.js:178-197` | `removeClubMember` has no ownership check. Any allowed role can delete memberships in any club if they know the ID. | Apply the same same-club ownership check before deletion. |
| Critical | `server/controllers/clubMemberController.js:53-57` | `addClubMember` checks `req.user.clubId === clubId` for faculty, but `clubId` in JWT is stale and not revalidated against the database. | For faculty, query `Club` by `facultyCoordinatorId` and `clubId`; for students, query `ClubMembership`. |
| Critical | `server/routes/events.js:330-386` | Admin event creation can set `clubId` from `req.body.clubId` without validation that the club exists or that the admin intentionally selected it. Club users rely on token `clubId`. | Validate `clubId` with `Club.findUnique`; for club users derive permitted clubs from DB membership. |
| Critical | `server/routes/events.js:542-548` | Free registration creates `Participation` and increments `registeredCount` in separate writes outside a transaction. Failures leave counts wrong. | Wrap create and event update in a transaction. |
| Critical | `server/routes/events.js:501-548`, `server/routes/payment.js:115-145` | Duplicate checks and seat availability checks are not protected by unique constraints or serializable transactions. Concurrent registrations can create duplicates/oversell seats. | Add unique indexes for `(eventId, studentId)` and `(eventId, externalEmail)` where applicable; update count and create participation in a transaction using row locking/serializable isolation or count-based capacity checks. |
| Critical | `server/routes/payment.js:124-145` | Paid verification always sets status `REGISTERED` and increments `registeredCount`; it ignores `totalSeats`, waitlist behavior, `registrationDeadline`, and program/year eligibility that `create-order` checked earlier. | Re-load event/student in the verify transaction and re-check eligibility, deadline, duplicate, and capacity before creating participation. |
| Critical | `server/routes/events.js:874-876` | Manual attendance updates `participationId` without ensuring it belongs to `eventId`. A scanner authorized for one event can mark a participation from another event. | Use `updateMany({ where: { id: participationId, eventId } })` or load participation by both fields before updating. |
| Critical | `server/routes/participation.js:20-89` | QR verify route finds by global `qrCode` only, not route event context. Since this route has no event param, any authorized club scanner could mark a participant from any event if they have the code. | Prefer `/events/:id/check-in` style route and always bind `qrCode` to `eventId` plus ownership. |
| Critical | `server/routes/notifications.js:45-66` | A club/faculty sender can send to `REGISTERED_STUDENTS` for any `eventId`; no check that the event belongs to the sender's club. | Load event and verify sender is admin/faculty for that club or has club membership permission. |
| Critical | `server/routes/notifications.js:85-90` | Any `club` or `facultyCoordinator` can broadcast `ALL_STUDENTS`, which is an admin-level blast capability. | Restrict `ALL_STUDENTS` to admin or introduce explicit notification permissions. |
| Critical | `server/routes/lostFound.js:199-215` | Fraud reporting updates the reporter list and blocks the poster in separate writes outside a transaction. Concurrent reports can lose reporters or block based on stale counts. | Use a transaction and/or a normalized `LostFoundReport` uniqueness model. |
| Critical | `server/routes/lostFound.js:267-284` | `report-liar` creates a report and blocks the alleged liar in separate writes. A failure between them leaves inconsistent moderation state. | Wrap both writes in a transaction; verify `liarId` is a real user and not the reporter/item owner. |
| Medium | `server/routes/events.js:515-531` | Waitlisted registrations are created but `Event.waitingListIds` is never updated, while deregistration tries to remove waitlisted IDs. | Either remove `waitingListIds` and query participations by `WAITLISTED`, or update it transactionally. |
| Medium | `server/routes/events.js:737-774` | Deregistering a registered user decrements count but never promotes a waitlisted participant to registered. State machine can strand seats. | Define legal transitions and promotion rules: `REGISTERED -> CANCELLED`, first `WAITLISTED -> REGISTERED` when capacity opens. |
| Medium | `server/routes/events.js:412-430` | Event review state only allows `PUBLISHED` or `REJECTED`; no transition guard prevents re-publishing rejected events or changing already-published events without audit. | Define `DRAFT/PENDING/PUBLISHED/REJECTED` transition table and require review comments on rejection. |
| Medium | `server/controllers/certificateController.js:41-47` | Certificate download requires `paymentStatus: SUCCESS`, so free-event participants whose default payment status changes or external attendees may be blocked unexpectedly. | Base certificate eligibility on attendance and event registration, not payment status alone. |
| Medium | `server/controllers/certificateController.js:73-82` | Certificate image fetch silently draws a rectangle if Cloudinary fetch fails, potentially issuing invalid certificates. | Return a 502/422 with a clear error instead of generating a degraded certificate. |
| Medium | `server/controllers/certificateController.js:131-148` | Certificate template accepts unvalidated coordinates, image dimensions, colors, and Cloudinary URL. Bad input can produce broken PDFs or expensive rendering. | Add Zod validation and restrict image URLs/public IDs to owned Cloudinary assets. |
| Medium | `server/routes/certificates.js:11` | Multer upload for certificate templates has no file size or MIME filter. | Add file size limits and image MIME allowlist, matching or tightening lost-found upload. |
| Medium | `server/utils/cloudinary.js:13-32`, `server/routes/lostFound.js:115-123` | Signed upload route signs only `timestamp` and `folder`, with no eager validation, public ID naming, access mode, max bytes, or format restrictions enforced server-side. | Prefer server-side upload proxy for sensitive assets or include locked params; use Cloudinary upload presets with strict folder/resource rules. |
| Medium | `server/routes/lostFound.js:68-87` | Lost-found item creation and per-day post counter update are separate writes. If the counter update fails, the item exists without consuming quota. | Wrap item creation and counter update in a transaction. |
| Medium | `server/routes/lostFound.js:68-79` | `title`, `description`, `type`, and `whatsapp` are not validated. Missing or malformed data can hit DB errors or expose bad contact data. | Add Zod schema with length constraints, enum mapping, and phone validation. |
| Medium | `server/routes/lostFound.js:223-246` | Claim endpoint returns finder email and WhatsApp immediately to any authenticated user, without rate limit, claim record, or consent workflow. | Store claim requests, notify owner, rate-limit claims, and reveal contact only after approval. |
| Medium | `server/routes/lostFoundAdmin.js:8` | `facultyCoordinator` is allowed into all lost-found admin routes, even though this is not club-scoped and exposes moderation actions globally. | Restrict to `admin` and `lostFoundAdmin` unless faculty has a specific moderation assignment. |
| Medium | `server/routes/lostFoundAdmin.js:41-46` | Force-delete deletes DB records but does not delete the Cloudinary asset referenced by `imagePublicId`. | Delete Cloudinary asset or enqueue cleanup before/after DB deletion with compensating retry. |
| Medium | `server/routes/admin.js:286-345` | Club creation transaction creates a `StudentUser` without `program`, while student registration requires a program. This creates mixed user invariants. | Set a valid program such as `OTHER` or introduce a separate club-service account model. |
| Medium | `server/routes/admin.js:290`, `server/routes/admin.js:377` | Default generated passwords (`${slug}@him0148`, `coordinator123`) are predictable. | Require password setup via one-time invite/reset token. |
| Medium | `server/routes/auth.js:292`, `server/routes/auth.js:636`, `server/routes/auth.js:662` | OTPs use `Math.random()`, which is not cryptographically secure. | Use `crypto.randomInt(100000, 1000000)`. |
| Medium | `server/routes/auth.js:357-411` | 2FA verification is not rate-limited and identifies whether an OTP/email pair is valid across both user tables. | Add per-email/IP OTP attempt limits and generic responses. |
| Medium | `server/routes/auth.js:607-614` | Logout only clears the cookie; bearer tokens returned to the client remain valid until expiry. | Stop returning tokens to the client or maintain token/session revocation by `sid`/token version. |
| Medium | `client/src/App.jsx:60-68`, `server/routes/auth.js:153-160` | Tokens are stored/transmitted in both httpOnly cookie and `localStorage`. This increases XSS blast radius and makes auth behavior inconsistent. | Use only httpOnly secure cookies or only bearer tokens; for browser apps, prefer httpOnly cookie plus CSRF protection. |
| Medium | `client/src/App.jsx:131-151`, `client/src/App.jsx:166-167` | The frontend has no `ProtectedRoute`; admin and club pages are directly routable. Backend protection still matters, but UX and accidental data fetches are weak. | Add route guards based on `/api/users/me` and role-specific redirects. |
| Medium | `server/routes/users.js:55-79` | Profile update passes arbitrary body fields after deleting only a small denylist. Users can set model fields like `isBlocked`, `accessLevel`, OTP fields, verification flags, or timestamps if accepted by Prisma. | Replace denylist with per-role allowlists and schema validation. |
| Medium | `server/routes/events.js:106-118` | Public event listing accepts unbounded `limit`; large values can exhaust memory/DB resources. | Clamp pagination limit, e.g. 1-100, and validate query params. |
| Medium | `server/routes/clubs.js:124-184` | Club update modifies club, social links, media, and sponsors in multiple independent writes outside a transaction. Partial updates can leave mismatched club metadata. | Wrap the full update in `prisma.$transaction`. |
| Medium | `server/routes/clubs.js:129-174` | Club media/sponsor replacement deletes all existing rows before creating replacements; an empty or invalid create can wipe data. | Validate arrays first, then replace transactionally. |
| Medium | `server/routes/notifications.js:221-232` | Mark-all-read performs N sequential updates and can partially complete. | Use a transaction, normalized read table, or raw SQL array update if keeping array storage. |
| Medium | `server/routes/notifications.js:251-258` | Mark single notification read blindly pushes `userId`; repeated calls duplicate IDs in `readBy`. | Check `has` first or use normalized unique `(notificationId, userId)` reads. |
| Medium | `server/prisma/schema.prisma:189-199` | Notifications do not store `targetType`, `eventId`, or intended recipients. `GET /notifications` returns all notifications created after account creation, regardless of target. | Add notification audience tables or fields and query only notifications targeted to the user. |
| Medium | `server/prisma/schema.prisma:144-166` | `Participation` lacks uniqueness on `(eventId, studentId)` and `(eventId, externalEmail)`. Application duplicate checks are race-prone. | Add partial unique indexes or model-level constraints where supported. |
| Medium | `server/prisma/schema.prisma:144-166` | Index exists only on `eventId`; frequent queries by `studentId`, `externalEmail`, `paymentStatus`, and QR lookup need indexes. | Add indexes listed in the PostgreSQL Performance section. |
| Low | `server/routes/events.js:4`, `server/routes/clubs.js:3`, `server/routes/admin.js:5` | `slugify` is imported but unused. | Remove unused imports. |
| Low | `server/routes/lostFound.js:4` | `allowRoles` is imported but unused. | Remove unused import. |
| Low | `server/middleware/role.js:1-3` | File is an empty duplicate placeholder. | Delete or export from `auth.js`; avoid dead files. |
| Low | `server/controllers/clubMemberController.js:1` | Comment `// trigger restart` is noise. | Remove. |
| Low | `server/routes/auth.js:15`, `server/routes/auth.js:166`, and many route header comments | Several comments contain mojibake/garbled box characters, reducing readability. | Replace with clean section comments or remove boilerplate. |
| Low | `client/src/App.jsx:162-165` | `/team` route is declared twice. | Remove duplicate route. |
| Low | `client/src/App.jsx:44` | `ProtectedRoute` is commented out while many protected pages are exposed in routing. | Implement or remove the stale comment. |
| Low | `server/routes/auth.js:280-287` | External registration dynamically imports bcrypt even though bcrypt is already imported. | Use the existing `bcrypt` import. |
| Low | `server/controllers/certificateController.js:63-64` | `participation.student?.name` can be undefined and then `.replace` throws. | Guard missing names and return a 422. |
| Low | `server/routes/events.js:168-181` | Typo `attandanceCounts`. | Rename to `attendanceCounts`. |
| Low | `server/routes/events.js:860` | `type` is required for manual attendance but never used. | Remove it or use it intentionally. |
| Low | `server/routes/admin.js:120`, `server/routes/admin.js:150`, `server/routes/admin.js:185`, etc. | Many catch blocks discard the actual error, making production triage difficult. | Log with request ID/server logger and return sanitized messages. |
| Low | `server/utils/cloudinary.js:13-32` | Upload helper logs raw Cloudinary errors to console and returns raw error messages to clients via callers. | Log structured server-side errors and return sanitized client messages. |

## State Machine Notes

### Event Review

Current state: `DRAFT`, `PENDING`, `PUBLISHED`, `REJECTED` exist in schema, but route logic only creates `PENDING` and reviews to `PUBLISHED`/`REJECTED`.

Missing controls:

- No legal transition table.
- No required rejection comment.
- No audit trail of who changed status over time.
- Published events can be edited without resetting to `PENDING`.

Recommended legal transitions:

- `DRAFT -> PENDING`
- `PENDING -> PUBLISHED`
- `PENDING -> REJECTED`
- `REJECTED -> DRAFT` or `REJECTED -> PENDING` after creator changes
- `PUBLISHED -> PENDING` only when material event fields change

### Participation

Current states: `REGISTERED`, `ATTENDED`, `WAITLISTED`, `CANCELLED`.

Missing controls:

- No transition guard prevents `WAITLISTED -> ATTENDED`.
- Deregistration deletes records instead of transitioning to `CANCELLED`, losing audit history.
- Waitlist promotion is missing.
- Paid verification bypasses waitlist logic.

Recommended legal transitions:

- `REGISTERED -> ATTENDED`
- `REGISTERED -> CANCELLED`
- `WAITLISTED -> REGISTERED`
- `WAITLISTED -> CANCELLED`
- No direct `WAITLISTED -> ATTENDED`

### Lost & Found

Current states: `ACTIVE`, `REUNITED`; fraud is a boolean.

Missing controls:

- No `DELETED`, `UNDER_REVIEW`, or `ARCHIVED` status.
- Fraud reports and user blocking are not transactional.
- Fraud reporting uses both array storage (`reportedBy`) and normalized reports (`LostFoundReport`) inconsistently.

## PostgreSQL/Data Integrity Notes

Foreign keys are mostly present through Prisma relations. The biggest integrity gaps are application-level multi-write consistency and missing uniqueness/indexing.

Suggested indexes:

- `Participation(eventId, studentId)` unique where `studentId IS NOT NULL`.
- `Participation(eventId, externalEmail)` unique where `externalEmail IS NOT NULL`.
- `Participation(studentId, createdAt DESC)` for `/events/user/:userId`.
- `Participation(eventId, paymentStatus)` for payment stats/export.
- `Participation(eventId, status)` for attendance counts and waitlist promotion.
- `Participation(qrCode)` already unique; if QR is always event-scoped, consider `(eventId, qrCode)` instead.
- `Event(clubId, startTime DESC)` for club dashboards.
- `Event(reviewStatus, startTime ASC)` for public feed.
- `Event(createdById, startTime ASC)` for creator views.
- `ClubMembership(studentId)` for role derivation.
- `ClubMembership(clubId, role)` for member/admin screens.
- `LostFoundItem(userId, createdAt DESC)` for my posts.
- `LostFoundItem(status, createdAt DESC)` for active feed.
- `LostFoundItem(isFraud, createdAt DESC)` for admin moderation.
- `LostFoundReport(itemId, reporterId)` unique if normalized reports are retained.
- `Notification(createdAt DESC)`.

Transaction candidates:

- `server/routes/events.js:542-548` registration create + event count increment.
- `server/routes/payment.js:115-145` duplicate check + participation create + count increment + capacity check.
- `server/routes/clubs.js:124-184` club update + social/media/sponsor replacement.
- `server/routes/lostFound.js:68-87` item creation + post counter.
- `server/routes/lostFound.js:199-215` fraud threshold + poster block + reportedBy update.
- `server/routes/lostFound.js:267-284` false-claimer report + user restriction.
- `server/routes/notifications.js:221-232` mark-all-read loop.

## Cloudinary & Media Handling

- Public URLs are stored in `Event.imageUrl`, `Media.url`, `Sponsor.logoUrl`, `LostFoundItem.imageUrl`, and certificate templates. None are private/authenticated.
- `imagePublicId` is stored only for lost-found, but delete paths do not use it for cleanup.
- Signed upload endpoint exposes direct upload capability and is not role/folder constrained beyond a folder param in the signature.
- Server proxy uploads have limited error shaping and no malware/content moderation step.
- Redundant media storage exists: club gallery is stored as `Media` rows but returned as URL arrays; sponsors are stored as rows but club update creates generic `name: "Sponsor"` records from logo URLs only.

Recommended direction:

- Store `publicId`, `resourceType`, `format`, `bytes`, `width`, `height`, and ownership fields; derive URLs when returning API responses.
- Use authenticated/private delivery for certificates or sensitive lost-found images if the content should not be public.
- Delete Cloudinary assets when DB records are deleted, with retry-safe cleanup.

## Code Hygiene Summary

No confirmed Express "double return" bug was found where `res.send/json/status` is followed by same-path execution after an error response; most guard responses correctly use `return`. However, there are multiple hygiene issues:

- Dead/unused imports: `slugify`, `allowRoles` in some files.
- Empty placeholder file: `server/middleware/role.js`.
- Excessive/garbled boilerplate comments in route files.
- Several business rules live directly in route handlers and should move into services:
  - event registration/capacity logic
  - role/membership authorization
  - notification audience resolution
  - lost-found moderation
  - certificate template validation

## Files Scanned

Primary audit files:

- `server/index.js`
- `server/lib/prisma.js`
- `server/middleware/auth.js`
- `server/middleware/errorHandler.js`
- `server/middleware/role.js`
- `server/middleware/validate.js`
- `server/prisma/schema.prisma`
- `server/routes/admin.js`
- `server/routes/auth.js`
- `server/routes/certificates.js`
- `server/routes/clubMembers.js`
- `server/routes/clubs.js`
- `server/routes/events.js`
- `server/routes/lostFound.js`
- `server/routes/lostFoundAdmin.js`
- `server/routes/notifications.js`
- `server/routes/participation.js`
- `server/routes/payment.js`
- `server/routes/users.js`
- `server/controllers/certificateController.js`
- `server/controllers/clubMemberController.js`
- `server/utils/cloudinary.js`
- `server/utils/corsConfig.js`
- `server/utils/sanitizeUser.js`
- `server/utils/postgresEventSerializer.js`
- `client/src/App.jsx`
- relevant package/config/docs files at repo root, `client`, and `server`

## Phase 2 Gate

Per the requested workflow, implementation is stopped here. Type `PROCEED` to start Phase 3 deep refactor.
