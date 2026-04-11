# ClubSetu API Endpoints Documentation

This document lists all the available API endpoints in the ClubSetu backend for the frontend designer.

**Base URL:** `http://localhost:5000/api` (Development)

---

## Authentication (`/api/auth`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| POST | `/register/student` | Register a new student account | No |
| POST | `/login` | Login user and receive token/cookies | No |
| POST | `/verify-2fa` | Verify 2FA OTP for sensitive roles | No |
| GET | `/verify-email/:token` | Verify student email | No |
| POST | `/forgot-password` | Request password reset link | No |
| POST | `/reset-password/:token` | Reset password using token | No |
| POST | `/change-password` | Change password for logged-in user | Yes |

---

## Events (`/api/club-events`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| GET | `/` | Get all published events | No |
| GET | `/:id` | Get event details (ID or slug) | No* |
| GET | `/club/:clubId` | Get events for a specific club | No |
| GET | `/club-manage/:clubId` | Manage events for assigned club | Club/Faculty |
| GET | `/club-manage/:clubId/export` | Export event data (Excel style) | Club/Faculty |
| GET | `/user/:userId` | Get event registrations for a user | Member/Admin |
| POST | `/` | Create a new event (Sets to PENDING) | Club/Admin |
| PUT | `/:id` | Update event details | Club/Admin |
| DELETE | `/:id` | Delete an event | Club/Admin |
| PUT | `/:id/review` | Approve/Reject an event | Faculty/Admin |
| POST | `/:id/register` | Register for an event (Free) | Member |
| DELETE | `/:id/register` | Deregister from an event | Member |
| GET | `/:id/registrations` | Get list of registered students | Club/Faculty |

*\* Note: Accessing unpublished events requires appropriate permissions. Query by ID or Slug.*

---

## Administration (`/api/admin`)

| Method | Endpoint | Description | Role Required |
| :--- | :--- | :--- | :--- |
| GET | `/dashboard-stats` | Global stats and financial overview | Admin |
| GET | `/clubs-list` | List all clubs with faculty info | Admin |
| POST | `/clubs` | Create new club and its credentials | Admin |
| GET | `/user-info/:id` | Get detailed user & bank information | Admin |
| POST | `/complete-payout/:eventId` | Mark event payout as completed | Admin |
| GET | `/event-data-export` | Export all platform event data | Admin |

---

## Clubs (`/api/clubs`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| GET | `/` | List all registered clubs | No |
| GET | `/:id` | Get club details and published events | No |
| PUT | `/:id` | Update club profile/info | Club/Admin |

---

## Notifications (`/api/notifications`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| GET | `/` | Get notifications for current user | Yes |
| POST | `/` | Send notification to students | Club |
| GET | `/sent` | Get list of sent notifications | Club |
| PUT | `/:id/read` | Mark a notification as read | Yes |
| PUT | `/read-all` | Mark all notifications as read | Yes |

---

## Payment (`/api/payment`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| POST | `/create-order` | Create Razorpay order for paid event | Member |
| POST | `/verify` | Verify payment and confirm registration | Member |
| GET | `/event/:eventId/stats` | View financial stats for an event | Club/Admin |

---

## Certificates (`/api/certificates`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| POST | `/:eventId/template` | Save certificate design template | Club |
| POST | `/upload-template` | Upload background image for template | Club |
| GET | `/:eventId/download` | Generate and download certificate | Member |

---

## User Profile (`/api/users`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| PUT | `/:role/:id` | Update user profile details | Yes (Self) |

---

## Common Request Bodies

### Event Registration (`POST /api/club-events/:id/register`)
```json
{
  "formResponses": {
    "Full Name": "Student Name",
    "College ID": "123456"
  }
}
```

### Event Review (`PUT /api/club-events/:id/review`)
```json
{
  "status": "PUBLISHED" | "REJECTED",
  "comment": "Nice event setup!"
}
```

### Create Club (`POST /api/admin/clubs`)
```json
{
  "clubName": "Robotics Club",
  "facultyName": "Dr. Smith",
  "facultyEmail": "smith@nitj.ac.in",
  "clubEmail": "robotics@nitj.ac.in"
}
```
