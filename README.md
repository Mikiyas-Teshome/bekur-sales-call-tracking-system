# Bekur — Sales Call Tracker

A mobile-first sales operations workspace for teams running ad-driven lead generation (Facebook/Instagram → WhatsApp/phone). Reps work a lead list, log call outcomes, and move deals through a pipeline; managers track campaigns, projects, and team performance.

## Stack

- **Framework:** Next.js 16 (App Router, Turbopack, React 19)
- **Database:** PostgreSQL (Neon) via TypeORM
- **Auth:** NextAuth v5 (Credentials provider, JWT sessions) with a fully dynamic role/permission system
- **Email:** Resend + React Email, for invites, password resets, and notification digests
- **Push notifications:** Firebase Cloud Messaging (web push), with per-category user preferences
- **Validation:** Zod v4
- **Styling:** Tailwind CSS v4

## Getting started

```bash
npm install
cp .env.example .env   # fill in the values described below
npm run migration:run  # applies all migrations to your database
npm run db:seed        # creates an admin user and sample data
npm run dev
```

The app runs at [http://localhost:3000](http://localhost:3000). The seed script prints the admin login it creates.

## Environment variables

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Direct Postgres connection — used for migrations |
| `DATABASE_URL_POOLED` | Pooled Postgres connection — used at runtime |
| `AUTH_SECRET` | NextAuth session signing secret |
| `AUTH_URL` | Canonical app URL NextAuth expects (e.g. `http://localhost:3000`) |
| `NEXT_PUBLIC_APP_URL` | Public app URL used to build links in emails |
| `RESEND_API_KEY`, `RESEND_FROM_EMAIL` | Transactional email (invites, password resets, digests) |
| `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` | Firebase Admin SDK (server-side push sending) |
| `NEXT_PUBLIC_FIREBASE_*` | Firebase web app config (client-side push registration) — also duplicated by hand into `public/firebase-messaging-sw.js`, since service workers can't read env vars |
| `CRON_SECRET` | Shared secret that protects the `/api/cron/*` routes |

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` / `npm run start` | Production build / serve |
| `npm run lint` | Lint the codebase |
| `npm run migration:generate -- src/db/migrations/<Name>` | Generate a migration from entity changes |
| `npm run migration:run` | Apply pending migrations |
| `npm run migration:revert` | Roll back the last migration |
| `npm run db:seed` | Seed an admin user and sample data |

## Key features

- **Leads & calls** — lead list with filters, bulk reassignment, call logging, and per-lead history
- **Projects & campaigns** — attribution and spend tracking per acquisition source
- **Dynamic roles & permissions** — admins create roles and control exactly which of ~25 permissions each one has, at `/team/roles`; the built-in Administrator role is protected from lockout
- **Team management** — invite (via email, one-time activation link), change role, manage a member's lead assignments, deactivate
- **Notifications** — push (Firebase) and email (Resend) per category, with a user-facing preference panel and scheduled digests via Vercel Cron
- **Reports** — pipeline, conversion, and team performance views

## Project structure

```
src/
  app/            App Router routes, layouts, and API/cron route handlers
  actions/        Server Actions — validate input, call a service, revalidate
  services/       Business logic and TypeORM queries
  entities/       TypeORM entity definitions
  db/             DataSource setup, migrations, seed script
  features/       Domain UI grouped by capability (leads, team, campaigns, …)
  components/     Shared, domain-agnostic UI (shell, primitives)
  emails/         React Email templates sent via Resend
  lib/            Cross-cutting utilities (auth, permissions, Firebase, etc.)
```


## Deployment

Built for Vercel. `vercel.json` schedules the overdue-follow-ups and weekly-digest cron jobs; both routes require the `CRON_SECRET` header to run.
