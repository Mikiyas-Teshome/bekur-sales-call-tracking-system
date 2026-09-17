# Backend Implementation Plan

This is the plan for Phase 4 (Persistence, Identity, Authorization) and the transactional slice of Phase 5, derived from the UI already built (every screen, dialog, and fixture under `src/features/*`), `docs/DEVELOPER_BRIEFING.md` §4–§8, and the target information model in `docs/IMPLEMENTATION_PLAN.md`. Where the briefing (single-owner, v1) and the implementation plan (multi-role, Projects, assignments) disagree, the implementation plan wins, because the built UI already matches it — Team, Projects, role-preview, and lead reassignment all assume multiple users and roles exist.

## 1. What the UI already demands of the schema

Reverse-engineered from the fixtures and components, not invented fresh:

| UI surface | Data it needs |
| --- | --- |
| Login (`login-form.tsx`) | Email + password against a real user; role and name for the session. |
| Today dashboard (`today-dashboard.tsx`) | KPI strip (leads assigned, calls made, contact rate, revenue), due/overdue follow-ups, needs-attention counts (never called / overdue / gone quiet), recent calls, pipeline-stage counts. Scope selector (My / Team / All) needs per-user, per-team, and workspace-wide aggregation. |
| Leads list (`leads-workspace.tsx`) | Client rows with campaign, project, stage, assignee, last call date, next follow-up, call count, attention flag. Filter/sort. Bulk selection → reassignment. |
| Client detail (`client-detail.tsx`) | One client, full call history newest-first, assignment history, lead context (campaign/project/stage). |
| Quick Log Call (`quick-log-call.tsx`) | Outcome (enum), outcome note, next pipeline stage, deal value, next follow-up date, against one client. |
| Bulk import (`bulk-import-leads.tsx`) | Parsed phone numbers, duplicate check against normalized phone, campaign to attribute to, creates many clients at once. |
| Team (`team-workspace.tsx`) | User roster with role, status (active/invited/inactive), per-user leads/calls/conversion/revenue, invite flow. |
| Projects (`projects-workspace.tsx`) | Project with status, health, campaign/lead/member counts, target vs. actual revenue, create/archive. |
| Campaigns (`campaigns-workspace.tsx`) | Campaign with platform, project, status, leads/calls/won/spend/revenue/ROAS, create/pause/resume. |
| Reports (`reports-workspace.tsx`) | Revenue trend, pipeline funnel, outcome mix, campaign efficiency table, team leaderboard, activity heatmap — all aggregate queries. |
| Role preview (`role-preview.tsx`) | Real `Role` on the session user; preview only overrides what capability checks return, never the underlying identity. |

## 2. Decisions

- **ORM**: TypeORM 0.3, `DataSource` + repository pattern (per the briefing), against Neon Postgres. Use `DATABASE_URL_POOLED` from `.env` for the app's runtime pool; `DATABASE_URL` (direct) is reserved for migrations, which shouldn't run through a connection pooler.
- **Auth**: NextAuth (Auth.js v5) with a `Credentials` provider and JWT session strategy (no separate `Session` table — simplest correct option for a single-tenant app; the target ERD's `USER` entity already has everything a JWT needs: id, email, role). Passwords hashed with `bcryptjs`.
- **Validation**: Zod schemas, one per mutation, shared between the Server Action and (where a form has client-side checks already, e.g. the auth forms) the client.
- **`cacheComponents` is turned off** (`next.config.ts`). It's on by default in this Next.js 16 scaffold, but it requires every session-reading Server Component to sit behind a `<Suspense>` boundary or use `"use cache: private"` (see `node_modules/next/dist/docs/.../authentication-with-cache-components.md`). This app is an authenticated internal dashboard, not a public site that benefits from a static shell — the instant-navigation payoff doesn't justify wrapping every page in extra Suspense boundaries right now. Documented here so it isn't silently re-enabled and taken as an oversight.
- **Route protection**: `src/proxy.ts` (the Next 16 name for what used to be `middleware.ts`) does an optimistic cookie-presence check and redirects — per Next's own docs, proxy is "not intended... as a full session management or authorization solution." Every Server Action and data-loading function re-checks the real session and role; the proxy is a UX shortcut, not the boundary (this mirrors what `docs/IMPLEMENTATION_PLAN.md` already says about `proxy.ts` for Phase 4).
- **Picklists**: implemented as Postgres enums (`pipeline_stage`, `call_outcome`, `platform`, `campaign_status`, `project_status`, `user_role`), not the briefing's dynamic `PicklistOption` table. The Settings picklist-management UI was never built and is out of scope here; enums are the honest MVP simplification, swappable later without touching call sites since the app already treats these as closed string unions everywhere (`LeadStage`, `CallOutcome` in the fixtures).
- **Codes** (`CL001`, `C001`, `PRJ001`): Postgres sequences + a `@BeforeInsert` hook, per §4.5 of the briefing.
- **Soft delete**: `deletedAt` on `Call` and `Client` (briefing §5.5, §6.4a); KPI queries always exclude soft-deleted rows.
- **Migrations**: TypeORM CLI migrations, not `synchronize: true` — this is a real, shared Neon database, not a throwaway local Postgres.

## 3. Entities (`src/entities`)

`User`, `Project`, `Campaign`, `Client`, `ClientAssignment`, `Call`, `AuditLog` — fields exactly as specified in the target ERD in `docs/IMPLEMENTATION_PLAN.md`, plus the picklist enums above. One file per entity, no header comments (per `AGENTS.md` / briefing §15 — the reasoning lives here, not inline).

## 4. Auth

- `src/auth.ts` — NextAuth config: `Credentials` provider whose `authorize()` looks up `User` by email, verifies the bcrypt hash, and returns `{ id, email, name, role }`; JWT/session callbacks copy `id` and `role` onto the token and session.
- `src/app/api/auth/[...nextauth]/route.ts` — the NextAuth route handler (`GET`/`POST` from `src/auth.ts`'s handlers).
- `login-form.tsx` calls `signIn("credentials", { email, password, redirect: false })` and routes on success/failure instead of the placeholder `password === "demo"` check.
- Session data replaces the hardcoded `currentUser` in `navigation.ts` and becomes `ownRole` in `RolePreviewProvider` (role preview still layers on top of the real role, unchanged from Phase 3).
- Log-out buttons call NextAuth's `signOut()`.

## 5. Server Actions (`src/actions`, one file per feature, thin — validate then call `src/services`)

- `auth`: none beyond NextAuth itself.
- `clients`: `createClient`, `bulkImportClients`, `reassignClients` (writes `ClientAssignment`, updates `Client.currentAssignedUserId`, in one transaction), `searchClients`.
- `calls`: `logCall` — the one transaction the whole app is built around (briefing §5.2): create `Call`, update `Client.pipelineStage`, in the same transaction.
- `projects`: `createProject`, `archiveProject`.
- `campaigns`: `createCampaign`, `setCampaignStatus`.
- `team`: `inviteUser` (creates a `User` with `active: false` until activated).

## 6. What gets wired to real data in this pass, and what doesn't

Everything below is either fully wired or explicitly still fixture-backed — nothing is left half-wired without saying so.

**Wired to Postgres:** Login/logout, Today dashboard KPIs and lists, Leads list (search/filter/sort over real clients), Client detail (real call + assignment history), Quick Log Call (real transactional write), Bulk import, Lead reassignment, Team roster + invite, Projects list + create, Campaigns list + create/pause/resume.

**Still fixture-backed, explicitly deferred:** Reports (needs the SQL-view layer that is Phase 6's own scope — building it correctly means query-derived, role-scoped, drill-down-backed KPIs, not a quick aggregate bolted on here) and the Settings → Workspace tab (currency/timezone/answered-call-definition has no entity in the target ERD; persisting it means designing a `WorkspaceSettings` singleton that nothing else in the plan calls for yet). Both keep working exactly as they do today on fixture data; nothing regresses.

## 7. Seed

`src/db/seed.ts` creates one `Administrator` user from the account this workspace belongs to, plus one project, one campaign, and a handful of clients/calls so the app isn't an empty shell on first login. Run once by hand (`npx tsx src/db/seed.ts`), not on every boot.
