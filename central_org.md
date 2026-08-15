# CampusNode: Central Organizer + Secure Event Staff Delegation System

## Objective

Extend the existing CampusNode RBAC and event-management system with two related capabilities:

1. A **Central Organizer** role for college-wide events.
2. A secure **Event Staff / Event Delegate** system that allows the Central Organizer to give specific students limited access to perform operational tasks for a particular event.

CampusNode already has a `SUPER_ADMIN` role.

Do NOT replace, weaken, or modify the existing Super Admin architecture unnecessarily.

The final architecture must follow the principle of **least privilege**.

The most important security requirement is:

> **The Central Organizer must never need to share their credentials with another student.**

Instead, students should use their **own CampusNode accounts** and receive temporary, event-specific permissions.

---

# 1. Final Role Architecture

The system should conceptually work like this:

```text
SUPER_ADMIN
    │
    │ Platform Administration
    ▼
CENTRAL_ORGANIZER
    │
    │ Owns college-wide events
    ▼
CENTRAL EVENT
    │
    ├── Participating Clubs
    │
    └── Event Staff / Delegates
            │
            ├── Attendance Operator
            ├── Registration Operator
            ├── Certificate Operator
            ├── Announcement Operator
            └── Event Manager
```

Existing roles such as:

```text
CLUB_ADMIN
CLUB_PRESIDENT
CLUB_MEMBER
STUDENT
```

must continue working.

---

# 2. Difference Between Super Admin and Central Organizer

This distinction is critical.

## SUPER_ADMIN

Manages the CampusNode platform.

Can:

* Manage users
* Manage roles
* Manage permissions
* Manage clubs
* Manage system settings
* Manage platform configuration
* Assign/create the single Central Organizer
* Perform all existing Super Admin operations

## CENTRAL_ORGANIZER

Manages college-wide student events.

Can:

* Create college-wide events
* Manage own events
* Add participating clubs
* Manage registrations
* Manage attendance
* Manage announcements
* Manage certificates
* View event analytics
* Add/remove Event Staff
* Assign specific event permissions

Cannot:

* Manage CampusNode roles
* Manage global permissions
* Manage system settings
* Manage clubs administratively
* Manage club members
* Create another Central Organizer
* Access Super Admin functionality

---

# 3. Exactly One Central Organizer

There must be **only one Central Organizer account in the entire CampusNode system**.

Enforce this at the backend/database level.

Do not rely only on frontend validation.

Conceptually:

```text
Maximum active CENTRAL_ORGANIZER accounts = 1
```

The system must prevent:

* Creating a second Central Organizer
* Assigning another user as Central Organizer
* Race-condition duplicates
* Self-registration as Central Organizer

Only the existing Super Admin can assign/create the Central Organizer.

---

# 4. Do NOT Share Central Organizer Credentials

This is a strict requirement.

Never design the system around:

```text
Central Organizer
      ↓
shares email/password
      ↓
Student
```

This is insecure because:

* The student receives all Central Organizer permissions.
* The system cannot reliably identify who performed an action.
* The credentials can be reused.
* Passwords may be stored or shared insecurely.
* Removing access becomes difficult.
* Audit logs become unreliable.

Instead:

```text
Central Organizer
      ↓
Adds student as Event Staff
      ↓
Student uses their own CampusNode account
      ↓
CampusNode checks event-specific permission
      ↓
Student receives ONLY the allowed access
```

---

# 5. Introduce Event Staff / Event Delegate

Introduce an event-scoped delegation system.

Call the feature:

**Event Staff**

or

**Event Delegates**

Use whichever terminology fits the existing CampusNode UI best.

This is NOT a global role.

A student remains a normal:

```text
STUDENT
```

but receives temporary permissions for a specific event.

For example:

```text
Rahul
Role: STUDENT

Event:
Freshers Party 2026

Event Staff Permission:
ATTENDANCE_OPERATOR
```

Rahul does NOT become:

```text
CENTRAL_ORGANIZER
```

---

# 6. Event Staff Data Model

Create an appropriate event-staff relationship based on the existing schema.

Conceptually:

```text
EventStaff
    ├── id
    ├── eventId
    ├── userId
    ├── invitedBy
    ├── permissions
    ├── status
    ├── expiresAt
    ├── createdAt
    ├── updatedAt
    └── revokedAt
```

Adapt this to the existing project's ORM/database conventions.

Do not blindly create these exact fields if equivalent structures already exist.

The important relationship is:

```text
User
  ↕
Event
  ↕
EventStaff
  ↕
Event-specific permissions
```

---

# 7. Event Staff Is Event-Scoped

This is one of the most important security rules.

If a student is granted:

```text
ATTENDANCE_OPERATOR
```

for:

```text
Freshers Party 2026
```

they must NOT automatically get attendance access to:

* Club Exhibition 2026
* Sports Fest
* Another club's event
* Another Central Organizer event

The permission must be:

```text
User + Event + Permission
```

not merely:

```text
User + Permission
```

---

# 8. Event Staff Permissions

Create granular permissions.

Recommended permissions:

```text
ATTENDANCE_OPERATOR
REGISTRATION_OPERATOR
CERTIFICATE_OPERATOR
ANNOUNCEMENT_OPERATOR
EVENT_ANALYTICS_VIEWER
EVENT_MANAGER
```

Use the existing permission naming convention if CampusNode already has one.

---

# 9. Attendance Operator

This is the primary use case.

An Attendance Operator can:

* Open the assigned event's attendance dashboard
* Scan attendee QR codes
* Mark attendance
* View attendance status
* Search attendees where required
* See basic attendance information
* Use existing online attendance
* Use existing offline attendance if CampusNode supports it
* Synchronize offline attendance using the existing mechanism

They must NOT be able to:

* Edit the event
* Manage clubs
* Manage registrations unless separately authorized
* Generate certificates
* Send announcements
* View unrelated analytics
* Access Central Organizer settings
* Access Super Admin functionality

---

# 10. Registration Operator

A Registration Operator can:

* View event registrations
* Search registrations
* Check registration status
* Perform allowed registration operations

They cannot access attendance unless separately assigned:

```text
REGISTRATION_OPERATOR
+
ATTENDANCE_OPERATOR
```

This allows multiple permissions to be assigned to one student when necessary.

---

# 11. Certificate Operator

A Certificate Operator can use the existing certificate system for the assigned event.

They may:

* View certificate eligibility
* Generate certificates
* Publish certificates
* Perform existing certificate operations

They cannot manage unrelated event functionality.

---

# 12. Announcement Operator

An Announcement Operator can send event-related announcements using the existing notification system.

They cannot:

* Send unrestricted platform-wide notifications
* Modify system notification configuration
* Send announcements for unrelated events

---

# 13. Analytics Viewer

An Analytics Viewer can see analytics for the assigned event.

For example:

```text
Total registrations
Attendance
Attendance percentage
Check-in count
Club participation
Registration breakdown
```

They should not receive unrestricted platform-wide analytics.

---

# 14. Event Manager

For larger events, the Central Organizer may want to delegate broader event management.

Create an optional:

```text
EVENT_MANAGER
```

permission.

This should provide a controlled subset of Central Organizer event functionality.

For example:

* Event details
* Registration configuration
* Participating clubs
* Attendance
* Announcements
* Event analytics

But it must still NOT provide:

* Role management
* User administration
* Super Admin functionality
* Global club administration
* Creation of another Central Organizer

Keep the exact permission set configurable through the existing RBAC architecture.

---

# 15. Email-Based Invitation

The Central Organizer should be able to add Event Staff using the student's **CampusNode account email**.

Example:

```text
Event:
Freshers Party 2026

Add Event Staff

Email:
student@nitj.ac.in

Permissions:
☑ Attendance Operator
☐ Registration Operator
☐ Certificate Operator
☐ Announcement Operator
☐ Analytics Viewer

Expiry:
[ Event End ]
```

The system should look up the user by email.

Do not create duplicate user accounts.

Do not create a separate Event Staff login.

---

# 16. Prefer Existing Users

The preferred flow is:

```text
Central Organizer
      ↓
Enter CampusNode user's email
      ↓
Find existing account
      ↓
Select permissions
      ↓
Set expiry
      ↓
Send invitation/notification
      ↓
Student accepts
      ↓
Event Staff access becomes active
```

If the email does not belong to an existing CampusNode user, follow the project's existing invitation architecture if one exists.

Do not automatically create a privileged account without proper verification.

---

# 17. Invitation Status

Support appropriate states:

```text
PENDING
ACCEPTED
REJECTED
REVOKED
EXPIRED
```

Example:

```text
Rahul Sharma
Attendance Operator

Status:
● Active

Expires:
15 August 2026, 11:59 PM
```

If the invitation is revoked:

```text
Status:
Revoked
```

the student must immediately lose access.

---

# 18. Permission Expiry

Event Staff permissions should support an `expiresAt` value.

This is strongly recommended for security.

Example:

```text
Freshers Party
Event Date: 15 August 2026

Attendance Operator:
Start: 15 Aug 2026, 08:00
End:   15 Aug 2026, 14:00
```

After expiry:

```text
Access denied
```

The student should not retain attendance access indefinitely.

If an event is cancelled or ended, follow the configured event-staff lifecycle rules.

---

# 19. Revocation

The Central Organizer must be able to immediately revoke Event Staff access.

Example:

```text
Event Staff

Rahul Sharma
Attendance Operator
[Revoke Access]
```

After revocation:

```text
Student
   ↓
Attempts attendance
   ↓
Backend permission check
   ↓
403 Forbidden
```

Do not rely on frontend UI hiding.

The backend must reject the request.

---

# 20. Student Event Staff Dashboard

When a student has active Event Staff permissions, their normal student dashboard should remain intact.

Add a section such as:

```text
My Event Staff

Freshers Party 2026
Role:
Attendance Operator

[Open Attendance]
```

If they have multiple events:

```text
My Event Staff

Freshers Party 2026
Attendance Operator
[Open]

Club Exhibition 2026
Registration Operator
[Open]
```

Each event must remain isolated.

---

# 21. Special Attendance Interface

Do not give an Attendance Operator the complete Central Organizer dashboard.

Instead:

```text
Student
   ↓
My Event Staff
   ↓
Freshers Party 2026
   ↓
Attendance Operator
   ↓
Attendance Dashboard
```

The interface should primarily show:

```text
Freshers Party 2026

Registered:
1,250

Present:
824

[ Scan QR ]

[ Search Attendee ]

[ Attendance List ]
```

Do not expose:

```text
Edit Event
Manage Clubs
Certificates
Announcements
Super Admin
Roles
Permissions
```

unless those permissions were separately assigned.

---

# 22. Attendance Security

The attendance operator should only be able to mark attendance for the specific assigned event.

For example:

```text
POST /events/:eventId/attendance
```

The backend must verify:

```text
Authenticated user
       ↓
Has ATTENDANCE_OPERATOR
       ↓
Permission is assigned to eventId
       ↓
Permission is active
       ↓
Permission is not expired
       ↓
Event exists
       ↓
Allow attendance operation
```

Never trust an event ID supplied by the frontend without authorization.

A student must not be able to change:

```text
/event/123
```

to:

```text
/event/456
```

and gain access to another event.

---

# 23. QR Attendance Security

Reuse the existing QR architecture.

Do not create a second QR system.

The scanner must:

1. Decode the attendee's QR.
2. Identify the attendee/ticket.
3. Identify the current event.
4. Verify that the ticket belongs to the event.
5. Verify that the scanner user has `ATTENDANCE_OPERATOR` access to that event.
6. Mark attendance using the existing attendance logic.
7. Return the existing success/error response.

The operator's permission must be checked on the server.

---

# 24. Offline Attendance

If CampusNode already supports offline attendance, Event Staff must work with it without weakening security.

When going offline, the application should obtain an authorized event-scoped session/configuration.

The offline scanner must only operate for:

```text
Authorized User
+
Authorized Event
+
Authorized Permission
```

Do not allow a user to manually change the event ID in local storage and gain access to another event.

When synchronization occurs, the backend must validate the user's authorization and event association.

Maintain the existing offline-sync conflict handling.

---

# 25. Audit Logs

This feature should introduce or reuse an audit-log system.

Every important Event Staff action should be traceable.

For example:

```text
Attendance marked

User:
Rahul Sharma
Email:
rahul@nitj.ac.in

Event:
Freshers Party 2026

Action:
ATTENDANCE_MARKED

Time:
15 Aug 2026, 10:42:31

Source:
Offline Scanner
```

Audit events should include, where appropriate:

```text
EVENT_STAFF_INVITED
EVENT_STAFF_ACCEPTED
EVENT_STAFF_REVOKED
EVENT_STAFF_EXPIRED
ATTENDANCE_MARKED
ATTENDANCE_UPDATED
REGISTRATION_UPDATED
CERTIFICATE_GENERATED
ANNOUNCEMENT_SENT
```

Do not expose sensitive information unnecessarily.

---

# 26. Central Organizer Event Staff Management

On the Central Organizer event page:

```text
Freshers Party 2026

Event Staff

┌─────────────────────────────────────────┐
│ Rahul Sharma                            │
│ Attendance Operator                     │
│ Active                                  │
│ Expires: 15 Aug 2026, 2:00 PM           │
│                         [Revoke]         │
├─────────────────────────────────────────┤
│ Priya Sharma                            │
│ Registration Operator                   │
│ Active                                  │
│ Expires: 15 Aug 2026, 5:00 PM           │
│                         [Revoke]         │
└─────────────────────────────────────────┘

[ + Add Event Staff ]
```

Allow the Central Organizer to:

* Add staff
* Select permissions
* Set expiry
* View status
* Revoke access

Do not allow Central Organizer to modify global roles.

---

# 27. Permission Matrix

Implement the final access model approximately as follows:

| Capability                 | Super Admin | Central Organizer |           Event Manager | Attendance Operator | Registration Operator | Student |
| -------------------------- | ----------: | ----------------: | ----------------------: | ------------------: | --------------------: | ------: |
| Manage users               |           ✓ |                 ✗ |                       ✗ |                   ✗ |                     ✗ |       ✗ |
| Manage roles               |           ✓ |                 ✗ |                       ✗ |                   ✗ |                     ✗ |       ✗ |
| Manage clubs               |           ✓ |                 ✗ |                       ✗ |                   ✗ |                     ✗ |       ✗ |
| Create central event       |           ✓ |                 ✓ |                       ✗ |                   ✗ |                     ✗ |       ✗ |
| Edit assigned event        |           ✓ |                 ✓ |                       ✓ |                   ✗ |                     ✗ |       ✗ |
| Manage participating clubs |           ✓ |                 ✓ |                       ✓ |                   ✗ |                     ✗ |       ✗ |
| Manage registration        |           ✓ |                 ✓ |                       ✓ |                   ✗ |                     ✓ |       ✗ |
| Attendance                 |           ✓ |                 ✓ |                       ✓ |                   ✓ |                     ✗ |       ✗ |
| Certificates               |           ✓ |                 ✓ |                       ✓ |                   ✗ |                     ✗ |       ✗ |
| Announcements              |           ✓ |                 ✓ |                       ✓ |                   ✗ |                     ✗ |       ✗ |
| Event analytics            |           ✓ |                 ✓ |                       ✓ |             Limited |               Limited |       ✗ |
| Add Event Staff            |           ✓ |                 ✓ | According to permission |                   ✗ |                     ✗ |       ✗ |
| Revoke Event Staff         |           ✓ |                 ✓ | According to permission |                   ✗ |                     ✗ |       ✗ |
| Super Admin settings       |           ✓ |                 ✗ |                       ✗ |                   ✗ |                     ✗ |       ✗ |

Use the existing CampusNode permission architecture rather than hard-coding this matrix into unrelated components.

---

# 28. Security Rules

The following are mandatory.

### Rule 1

Never share Central Organizer credentials.

### Rule 2

Event Staff always use their own CampusNode account.

### Rule 3

Event Staff permissions are event-scoped.

### Rule 4

Event Staff permissions expire.

### Rule 5

Central Organizer can revoke access.

### Rule 6

Backend authorization is mandatory.

### Rule 7

Frontend restrictions are only a UX layer.

### Rule 8

Every sensitive Event Staff action should be auditable.

### Rule 9

Event Staff cannot escalate their own permissions.

### Rule 10

Changing:

```text
eventId
userId
role
permission
```

in frontend/API requests must never allow privilege escalation.

---

# 29. Privilege Escalation Protection

Explicitly test attacks such as:

```text
Student → tries to assign ATTENDANCE_OPERATOR to themselves
```

```text
Attendance Operator → tries to access another event
```

```text
Attendance Operator → changes eventId in API request
```

```text
Attendance Operator → sends Central Organizer role in request body
```

```text
Event Staff → attempts to access Super Admin endpoint
```

```text
Event Staff → attempts to add another Event Staff member
```

```text
Expired Staff → attempts attendance
```

```text
Revoked Staff → attempts attendance
```

All must fail server-side.

---

# 30. Existing Club System

Do not confuse:

```text
Club Member
```

with:

```text
Event Staff
```

A Club Member's permissions come from their club relationship.

An Event Staff member's permissions come from:

```text
Specific Event
+
Specific Delegated Permission
```

A student can be both:

```text
Club Member
+
Event Staff
```

at the same time.

These permission systems must coexist without overriding each other incorrectly.

---

# 31. Example Real-World Flow

### Step 1

Super Admin creates the single:

```text
Central Organizer
```

### Step 2

Central Organizer creates:

```text
Freshers Party 2026
```

### Step 3

Central Organizer adds participating clubs:

```text
Coding Club
Robotics Club
Literary Club
Music Club
```

### Step 4

Central Organizer needs two students to handle attendance.

They add:

```text
rahul@nitj.ac.in
priya@nitj.ac.in
```

with:

```text
ATTENDANCE_OPERATOR
```

### Step 5

Students receive notification.

They log in with their own CampusNode accounts.

### Step 6

Their dashboard shows:

```text
Event Staff

Freshers Party 2026
Attendance Operator

[Open Scanner]
```

### Step 7

They scan attendee QR codes.

### Step 8

Backend verifies:

```text
User
+
Event
+
Permission
+
Expiry
```

### Step 9

Attendance is recorded.

### Step 10

Audit log records who performed the action.

### Step 11

At the configured expiry time, their access automatically stops.

---

# 32. Database and Migration Requirements

Before changing anything:

1. Inspect existing User model.
2. Inspect existing Role model.
3. Inspect existing Permission model.
4. Inspect existing Event model.
5. Inspect Club model.
6. Inspect event ownership.
7. Inspect attendance.
8. Inspect QR ticket system.
9. Inspect offline scanner architecture.
10. Inspect authentication.
11. Inspect authorization middleware.
12. Inspect existing notification system.
13. Inspect audit logs if present.
14. Inspect frontend route protection.

Then design the minimum required schema changes.

Do not duplicate existing models or systems.

Create proper migrations.

Do not delete or corrupt existing data.

---

# 33. Implementation Rules for the AI Code Editor

Do not immediately start modifying files.

First:

```text
PHASE 1
Inspect the existing architecture.
```

Report:

* Current role model
* Current permission model
* User model
* Event model
* Club model
* Event ownership
* Attendance architecture
* QR architecture
* Offline scanner architecture
* Authentication middleware
* Authorization middleware
* Existing route protection
* Existing notification system
* Existing audit system

Then implement the feature.

Do not assume filenames or schemas.

---

# 34. Coding Quality Requirements

During implementation:

* Do not forget imports.
* Do not create undefined variables.
* Do not reference nonexistent models.
* Do not create duplicate APIs.
* Do not create duplicate components.
* Do not break existing exports.
* Do not leave unused imports.
* Do not hard-code user IDs.
* Do not hard-code event IDs.
* Do not hard-code Central Organizer IDs.
* Do not trust client-supplied roles.
* Do not trust client-supplied permissions.
* Do not trust client-supplied user IDs.
* Do not bypass existing authentication.
* Reuse existing utilities.
* Reuse existing components.
* Follow existing project conventions.

---

# 35. Testing

Create tests for:

## Central Organizer

* [ ] Exactly one Central Organizer can exist.
* [ ] Super Admin can assign Central Organizer.
* [ ] Normal users cannot self-assign.
* [ ] Central Organizer cannot access Super Admin APIs.

## Event Staff

* [ ] Student can be invited.
* [ ] Existing user can be identified by email.
* [ ] Invitation can be accepted.
* [ ] Invitation can be rejected.
* [ ] Access can be revoked.
* [ ] Access expires.
* [ ] Multiple permissions can be assigned.
* [ ] Permissions are event-specific.

## Attendance

* [ ] Attendance Operator can scan assigned event.
* [ ] Attendance Operator cannot scan another event.
* [ ] Expired operator cannot scan.
* [ ] Revoked operator cannot scan.
* [ ] QR from another event is rejected.
* [ ] Offline attendance respects event scope.
* [ ] Offline synchronization performs authorization validation.
* [ ] Attendance actions are audited.

## Privilege Escalation

Test direct API manipulation.

For example:

```text
Student
→ sends role=CENTRAL_ORGANIZER
```

must fail.

```text
Attendance Operator
→ changes eventId
```

must fail.

```text
Attendance Operator
→ calls /admin/users
```

must fail.

```text
Expired Operator
→ calls attendance API
```

must fail.

---

# 36. Backward Compatibility

Existing functionality must continue working:

* Student accounts
* Club accounts
* Club events
* Team registration
* Individual registration
* Custom fields
* QR generation
* QR scanning
* Offline scanning
* Attendance synchronization
* Certificates
* Notifications
* Event approval
* Existing Super Admin functionality

Do not rewrite working systems unnecessarily.

---

# 37. Implementation Phases

## Phase 1 — Architecture Audit

Inspect the complete existing architecture.

Do not modify code.

## Phase 2 — Central Organizer RBAC

Add:

```text
CENTRAL_ORGANIZER
```

and required permissions.

Implement the single-account constraint.

## Phase 3 — Central Event Ownership

Allow:

```text
Club-owned Event
```

and:

```text
Central Organizer-owned Event
```

without breaking existing events.

## Phase 4 — Participating Clubs

Implement:

```text
Event ↔ Multiple Clubs
```

for Central Organizer events.

## Phase 5 — Event Staff

Implement:

```text
Event
+
User
+
Permission
+
Expiry
```

delegation.

## Phase 6 — Attendance Delegation

Integrate Event Staff with the existing online/offline attendance and QR scanning system.

## Phase 7 — Other Delegated Permissions

Implement:

* Registration Operator
* Certificate Operator
* Announcement Operator
* Analytics Viewer
* Event Manager

## Phase 8 — Audit Logging

Ensure sensitive Event Staff actions are recorded.

## Phase 9 — Frontend

Implement:

* Central Organizer dashboard
* Event Staff management
* Student Event Staff dashboard
* Attendance Operator interface
* Permission management
* Expiry/revocation UI

## Phase 10 — Security Testing

Perform:

* RBAC testing
* API authorization testing
* Privilege escalation testing
* Event isolation testing
* Expiry testing
* Revocation testing
* Offline attendance testing
* Regression testing

## Phase 11 — Build Verification

Run:

* Database migration
* Backend tests
* Frontend tests
* Lint
* Type checks if available
* Production build

Fix every error before completion.

---

# Final Acceptance Criteria

The implementation is complete only when:

* [ ] Super Admin remains the highest platform-level role.
* [ ] Exactly one Central Organizer exists.
* [ ] Only Super Admin can assign/create the Central Organizer.
* [ ] Central Organizer cannot access Super Admin functionality.
* [ ] Central Organizer can create college-wide events.
* [ ] Multiple clubs can participate in Central Organizer events.
* [ ] Central Organizer can add Event Staff.
* [ ] Event Staff use their own CampusNode accounts.
* [ ] Central Organizer credentials never need to be shared.
* [ ] Event Staff permissions are event-specific.
* [ ] Attendance Operator can only access assigned event attendance.
* [ ] Registration Operator can only access assigned event registration.
* [ ] Certificate Operator can only access assigned event certificates.
* [ ] Announcement Operator can only access assigned event announcements.
* [ ] Analytics Viewer can only access assigned event analytics.
* [ ] Event Manager receives only the configured event permissions.
* [ ] Event Staff permissions can expire.
* [ ] Central Organizer can revoke Event Staff access.
* [ ] Expired/revoked users immediately lose access.
* [ ] Backend authorization prevents privilege escalation.
* [ ] Frontend route protection is implemented.
* [ ] QR attendance remains compatible.
* [ ] Offline attendance remains compatible.
* [ ] Offline synchronization remains secure.
* [ ] Event Staff actions are auditable.
* [ ] Existing Club Member permissions continue working.
* [ ] Existing club events continue working.
* [ ] Existing Super Admin functionality continues working.
* [ ] Database migrations succeed.
* [ ] Backend builds successfully.
* [ ] Frontend builds successfully.
* [ ] All relevant tests pass.
* [ ] No missing imports, undefined references, broken routes, or duplicate implementations remain.

**Do not implement the feature by sharing Central Organizer credentials or by making Event Staff a second administrative role. The correct architecture is:**

```text
SUPER_ADMIN
      ↓
CENTRAL_ORGANIZER
      ↓
COLLEGE-WIDE EVENT
      ↓
EVENT-SCOPED STAFF
      ↓
LIMITED PERMISSIONS
      ↓
OWN CAMPUSNODE ACCOUNT
```

This separation must be enforced by the backend, database, and frontend—not merely by hiding UI elements.
