# Go Check-in Service — Node.js Integration Guide

> **Status**: DISABLED (Go service is built but not yet wired to Node.js)
> 
> When you're ready to activate the check-in service, follow these steps:

## Step 1: Install the proxy dependency

```bash
cd server
npm install http-proxy-middleware@3
```

## Step 2: Add the proxy import to `server/index.js`

Add this import at the top of the file (after the existing imports):

```javascript
import { createProxyMiddleware } from "http-proxy-middleware";
```

## Step 3: Add the proxy middleware

Add this block **before** the existing `app.use("/api/auth", authRoutes)` line:

```javascript
// ─── Go Microservice Proxy ─────────────────────────────────
// Routes all /api/checkin/* requests to the Go check-in service.
app.use("/api/checkin", createProxyMiddleware({
  target: process.env.CHECKIN_SERVICE_URL || "http://localhost:8080",
  changeOrigin: true,
  ws: true,
  on: {
    error: (err, req, res) => {
      console.error("[Checkin Proxy Error]", err.message);
      if (!res.headersSent) {
        res.status(502).json({ message: "Check-in service unavailable" });
      }
    },
  },
}));
```

## Step 4: Add environment variable

Add to your `.env` file:

```
CHECKIN_SERVICE_URL=http://localhost:8080
```

## Step 5: Start both services

```bash
# Terminal 1: Go service
cd services/checkin-go && go run .

# Terminal 2: Node.js server  
cd server && npm run dev

# Or use Docker:
docker compose up --build
```
