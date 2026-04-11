# ClubSetu PostgreSQL Setup

## Current State

The backend is now PostgreSQL-only and uses Prisma for all persistence.

## Required Environment

Set `DATABASE_URL` in `.env`:

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/clubsetu?schema=public
```

## First-Time Setup

```bash
npm run prisma:generate
npx prisma db push
```

## Optional Local Database

If you use Docker locally:

```bash
npm run db:create:postgres
```

## Notes

- The Prisma schema keeps 24-character string ids to preserve API/front-end compatibility.
- Event `customFields`, certificate template config, winners, and registration form responses are stored in PostgreSQL `jsonb`.
- MongoDB and Mongoose runtime code have been removed from the backend.
