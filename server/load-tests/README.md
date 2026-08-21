# k6 event/backend performance test

The default test is read-only. It measures `/health`, the public event feed,
event detail, and authenticated `/api/events/user/:userId` reads. The server
adds `X-Response-Time`, so k6 latency can be compared with server-side time.

From this directory, with k6 installed:

```powershell
k6 run .\events.js `
  -e BASE_URL=http://localhost:5000 `
  -e AUTH_TOKEN="<jwt>" `
  -e USER_ID="<student-id>" `
  -e EVENT_ID="<event-id>" `
  -e READ_RATE=20 `
  -e DURATION=2m
```

Useful test stages:

```powershell
# quick smoke test
k6 run .\events.js -e BASE_URL=http://localhost:5000 -e DURATION=30s -e READ_RATE=2

# higher concurrency test
k6 run .\events.js -e BASE_URL=https://your-api.example.com -e AUTH_TOKEN="<jwt>" -e USER_ID="<id>" -e READ_RATE=100 -e DURATION=5m -e MAX_VUS=200
```

Writes are deliberately opt-in. Only enable them with a disposable test
account/event because the script creates registrations:

```powershell
k6 run .\events.js -e BASE_URL=http://localhost:5000 -e AUTH_TOKEN="<jwt>" -e EVENT_ID="<test-event-id>" -e ENABLE_WRITES=true -e DURATION=30s -e READ_RATE=1
```

Interpretation: `http_req_duration` is end-to-end latency, while the response
header `X-Response-Time` is application-side latency. A large difference points
to network/proxy/TLS overhead; both being high points to the Node/Prisma/DB
path. Run against a staging database before production.
