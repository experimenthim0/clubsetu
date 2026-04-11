# ClubSetu Backend Security & Production Audit Report

**Date:** May 2024
**Audit Scope:** Entire Backend Codebase
**Auditor:** Jules (Senior Backend Security Engineer)

---

## 1. 🔐 AUTHENTICATION & AUTHORIZATION

### 🔴 High: Broken Object Level Authorization (IDOR) in Registrations
- **File:** `server/routes/events.js`
- **Location:** `GET /:id/registrations`
- **Problem:** Any user with the `club` role can access the registration list for ANY event ID, even if the event belongs to another club.
- **Risk:** Sensitive student PII (emails, roll numbers) can be harvested by any club coordinator.
- **Fix:**
```javascript
// BEFORE returning data:
const event = await prisma.event.findUnique({ where: { id: req.params.id } });
if (!event) return res.status(404).json({ message: "Event not found" });

if (req.user.role !== 'admin' && event.clubId !== req.user.clubId) {
    return res.status(403).json({ message: "Access denied. You can only view registrations for your own club's events." });
}
```

### 🔴 High: Public Exposure of Coordinator Activities
- **File:** `server/routes/events.js`
- **Location:** `GET /club-co/:id`
- **Problem:** This route is public and returns all events created by a specific user ID.
- **Risk:** Allows attackers to map out administrative users and track internal club activities/drafts.
- **Fix:** Add `verifyToken` and `allowRoles('admin')` or restrict to `req.user.userId === req.params.id`.

### 🟡 Medium: Weak JWT Secret & Missing CSRF Protection
- **File:** `server/middleware/auth.js`
- **Problem:** The system relies on cookies (`req.cookies.token`) but does not implement CSRF protection.
- **Risk:** An attacker could trick a logged-in admin into performing actions (like deleting events) via a malicious link.
- **Fix:** Install `csurf` or move to strictly Header-based authorization.

---

## 2. 🛡️ SECURITY VULNERABILITIES

### 🔴 High: Missing Security Headers
- **File:** `server/index.js`
- **Problem:** `helmet.js` is not implemented.
- **Risk:** Vulnerability to Clickjacking, XSS, and MIME-sniffing.
- **Fix:**
```javascript
import helmet from "helmet";
app.use(helmet());
```

### 🔴 High: No Rate Limiting (DoS/Brute Force)
- **File:** `server/index.js`
- **Problem:** Auth and high-resource routes have no request limits.
- **Risk:** Brute-force attacks on passwords and server exhaustion.
- **Fix:**
```bash
npm install express-rate-limit
```
```javascript
import rateLimit from "express-rate-limit";
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10 });
app.use("/api/auth/login", authLimiter);
```

### 🟡 Medium: Potential SSRF in Certificate Generation
- **File:** `server/controllers/certificateController.js`
- **Location:** `downloadCertificate` function
- **Problem:** The server calls `fetch()` on `template.imageUrl` from the database.
- **Risk:** Attackers (Club Heads) could set the URL to internal Render/Neon metadata IPs or local ports to scan the internal network.
- **Fix:**
```javascript
const allowedDomain = "res.cloudinary.com";
const url = new URL(template.imageUrl);
if (url.hostname !== allowedDomain) throw new Error("Untrusted image source");
```

---

## 3. 📦 API & INPUT VALIDATION

### 🔴 High: Lack of Centralized Input Validation
- **File:** All Routes (`server/routes/*.js`)
- **Problem:** Request bodies are used directly without schema verification.
- **Risk:** **Mass Assignment.** A user could register and send `{"role": "admin"}` in a PUT request if not explicitly handled.
- **Fix:** Apply the existing `validate` middleware using Zod/Joi for every POST/PUT route.
```javascript
const eventSchema = z.object({
  body: z.object({
    title: z.string().min(3),
    startTime: z.string().datetime(),
    // ...
  })
});
router.post("/", verifyToken, allowRoles("club"), validate(eventSchema), ...);
```

---

## 4. 🔑 SENSITIVE DATA HANDLING

### 🔴 High: Insecure Dev-Logic Bypass
- **File:** `server/routes/auth.js`
- **Problem:** `const isDevMode = process.env.SKIP_VERIFICATION === "true";`
- **Risk:** If this environment variable is accidentally set on Render, it bypasses all email verification for new accounts.
- **Fix:**
```javascript
const isDevMode = process.env.NODE_ENV !== 'production' && process.env.SKIP_VERIFICATION === 'true';
```

### 🟡 Medium: Exposure of Detailed Bank Info
- **File:** `server/routes/admin.js`
- **Location:** `GET /user-info/:id`
- **Problem:** Returns full account numbers and IFSC codes.
- **Risk:** Over-exposure of PII to admin staff.
- **Fix:** Mask account numbers: `accountNumber.slice(-4).padStart(accountNumber.length, 'X')`.

---

## 5. ⚙️ ERROR HANDLING & LOGGING

### 🟡 Medium: Internal Stack Trace Exposure
- **File:** `server/middleware/errorHandler.js`
- **Problem:** Sends `error.message` directly to the client.
- **Risk:** Reveals table names, file paths, and logic flows.
- **Fix:**
```javascript
res.status(error.statusCode || 500).json({
  success: false,
  message: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : error.message
});
```

---

## 6. 🧱 DATABASE DESIGN & QUERIES

### 🟡 Medium: Inefficient Event Listing Query
- **File:** `server/routes/events.js`
- **Problem:** `GET /` fetches all published events without pagination.
- **Risk:** As the event count grows, the response payload will slow down the application and consume Neon compute units.
- **Fix:** Implement `take` and `skip` (Prisma pagination).

### 🟢 Low: Redundant Indexing
- **File:** `server/prisma/schema.prisma`
- **Observation:** `@@index([clubId])` is defined on both User and Event models. This is good, but ensure `updatedAt` is indexed if sorting by recent changes is common.

---

## 7. 🐳 PRODUCTION READINESS

### 🔴 High: Permissive CORS (Cross-Origin Resource Sharing)
- **File:** `server/utils/corsConfig.js`
- **Problem:** `allowedOrigins` includes multiple local dev ports and broad regex for Vercel previews.
- **Risk:** Potential for CSRF and data leakage from unauthorized domains.
- **Fix:** In production, `allowedOrigins` should strictly match the production URL `https://clubsetu.vercel.app`.

### 🟡 Medium: Missing Docker Production Image
- **Observation:** Only `docker-compose.postgres.yml` exists (for local DB).
- **Risk:** Inconsistent deployment environments.
- **Recommendation:** Create a multi-stage `Dockerfile` for the Node backend to ensure reproducibility on Render or other container platforms.

---

## 📊 Overall Security Score: 4/10

The system is currently "functioning" but not "secure" for a production environment handling financial transactions (Razorpay) and student data.

---

## 🚀 Top 10 Priority Fixes

1.  **Rate Limiting:** Protect Auth routes from brute force.
2.  **Input Validation:** Use Zod/Joi to prevent mass assignment on all PUT/POST routes.
3.  **Security Headers:** Enable `helmet`.
4.  **Fix IDOR:** Secure registration lists in `events.js`.
5.  **Environment Hardening:** Disable `SKIP_VERIFICATION` logic in production.
6.  **Secure Coordinator Routes:** Restrict access to `GET /club-co/:id`.
7.  **CORS Restriction:** Tighten origins for the production environment.
8.  **Error Masking:** Hide stack traces in production responses.
9.  **SSRF Protection:** Validate URLs in `certificateController.js`.
10. **Admin PII Masking:** Mask sensitive bank details in admin dashboard.
