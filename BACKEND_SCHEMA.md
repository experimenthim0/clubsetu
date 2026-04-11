# ClubSetu — Backend Database Schema 🗄️

This document outlines the database architecture for ClubSetu, detailng the Mongoose models and their relationships.

---

## 1. User Model (`User.js`)
Stores information for all personas (Students, Club, faculty coordinator Admin, etc.).

| Field | Type | Description |
| :--- | :--- | :--- |
| `name` | String | Full name of the user. |
| `email` | String | Unique institutional email. |
| `password` | String | Hashed password. |
| `role` | String | Enum: `student`, `member`, `club`, `facultyCoordinator`, `admin`, `paymentAdmin`. |
| `clubId` | ObjectId | Reference to `Club` (for club/faculty roles). |
| `phone` | String | Contact number. |
| `rollNo` | String | Student roll number. |
| `branch` | String | Academic branch. |
| `year` | String | Graduation year / Current year. |
| `isVerified` | Boolean | Email verification status. |
| `isTwoStepEnabled`| Boolean | 2FA status. |

---

## 2. Club Model (`Club.js`)
Represents a student society or club.

| Field | Type | Description |
| :--- | :--- | :--- |
| `clubName` | String | Official name of the club. |
| `slug` | String | URL-friendly unique identifier. |
| `description` | String | Detailed club brief / about section. |
| `category` | String | e.g., Technical, Cultural, Sports. |
| `uniqueId` | String | System-generated unique code (e.g., CLUB-XXXX). |
| `clubEmail` | String | Official club contact email. |
| `facultyName` | String | Name of the lead faculty coordinator. |
| `facultyEmail` | String | Email of the faculty coordinator. |
| `socialLinks` | Array | Objects with `platform` (instagram, linkedin, etc.) and `url`. |
| `clubLogo` | String | URL for the club logo. |
| `clubGallery` | Array | List of image URLs for the club gallery. |
| `clubSponsors`| Array | List of sponsor image URLs/names. |
| `bankName` | String | Name of the club's bank. |
| `accountHolderName`| String | Official name on the bank account. |
| `accountNumber`| String | Bank account number. |
| `ifscCode` | String | Bank IFSC code. |
| `upiId` | String | Optional UPI ID for direct transfers. |
| `bankPhone` | String | Phone number linked to the bank account. |
| `facultyCoordinators`| Array | ObjectIds referencing `User` (Faculty role). |
| `studentCoordinators`| Array | List of names of student leads/coordinators. |

---

## 3. Event Model (`Event.js`)
The core entity representing a campus activity.

| Field | Type | Description |
| :--- | :--- | :--- |
| `title` | String | Event name. |
| `slug` | String | Unique URL slug. |
| `description`| String | Detailed event brief. |
| `venue` | String | Location on campus. |
| `startTime` | Date | Event start timestamp. |
| `endTime` | Date | Event end timestamp. |
| `totalSeats` | Number | Maximum allowed registrations. |
| `entryFee` | Number | Fee in INR (set to 0 for free events). |
| `reviewStatus`| String | Enum: `DRAFT`, `PENDING`, `PUBLISHED`, `REJECTED`. |
| `requiredFields`| Object | Toggles for Roll No, Phone, Branch, etc. |
| `customFields` | Array | Definitions for extra questions (Name, Label, Type). |
| `clubId` | ObjectId | Reference to the organizing `Club`. |
| `reviewedBy` | ObjectId | Faculty coordinator who approved the event. |
| `provideCertificate`| Boolean | Whether auto-certificates are enabled. |

---

## 4. Registration Model (`Registration.js`)
Tracks student participation and payments.

| Field | Type | Description |
| :--- | :--- | :--- |
| `eventId` | ObjectId | Reference to the `Event`. |
| `userId` | ObjectId | Reference to the `User`. |
| `status` | String | Enum: `CONFIRMED`, `WAITLISTED`. |
| `paymentId` | String | Razorpay transaction ID. |
| `paymentStatus`| String | Enum: `PENDING`, `SUCCESS`, `FAILED`. |
| `amountPaid` | Number | Final amount paid by the student. |
| `formResponses`| Map | Key-value pairs of student answers to custom fields. |
| `timestamp` | Date | Time of registration. |

---

## 5. Notification Model (`Notification.js`)
Handles broadcasts and targeted alerts.

| Field | Type | Description |
| :--- | :--- | :--- |
| `sender` | ObjectId | Reference to the `User` who sent the alert. |
| `targetType` | String | Enum: `ALL_STUDENTS`, `REGISTERED_STUDENTS`. |
| `eventId` | ObjectId | Optional link to a specific event. |
| `title` | String | Subject of the notification. |
| `message` | String | Content of the message. |
| `readBy` | Array | List of User IDs who have seen the alert. |

---

## 🏗️ Model Relationships

- **Events & Clubs**: Every Event belongs to exactly one Club (`clubId`).
- **Registrations**: A "Many-to-Many" junction between `User` and `Event`.
- **Clubs & Faculty**: A Club can have one or more `facultyCoordinators` (Refs to User).
- **Notifications**: Can be global or scoped to a specific `Event`.

---

## 6. Relational Schema Structure (DBML)

```dbml
Table follows {
  following_user_id integer
  followed_user_id integer
  created_at timestamp
}

Table users {
  id integer [primary key]
  username varchar
  role varchar
  created_at timestamp
}

Table posts {
  id integer [primary key]
  title varchar
  body text [note: 'Content of the post']
  user_id integer [not null]
  status varchar
  created_at timestamp
}

Ref user_posts: posts.user_id > users.id // many-to-one

Ref: users.id < follows.following_user_id

Ref: users.id < follows.followed_user_id

Records users(id, username, role) {
  0, 'Alice', 'admin'
  1, 'Bob', 'moderator'
  2, 'Candice', 'moderator'
  3, 'David', 'member'
}

Records follows(following_user_id, followed_user_id, created_at) {
  1, 0, '2026-01-01'
  3, 2, '2026-02-28'
}

Records posts(id, title, user_id) {
  0, 'Welcome to the forum!', 0
  1, 'Guidelines', 1
  2, 'Hello all!', 3
}
```
