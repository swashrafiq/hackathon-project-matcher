# Hackathon Project Matcher - Incremental Implementation TODO

This checklist is designed for very small, tangible increments suitable for AI-assisted development.

## Working Rules (apply to every step)
- [ ] Keep each PR/task small (target: 1 behavior change).
- [ ] Add/update tests for each new behavior before marking step done.
- [ ] Add at least one security check in each step (validation, access control, or safe defaults).
- [ ] Update docs in each step (`README.md` and/or `docs/` notes).

## Phase 0 - Bootstrap and First Deploy

### Step 1 - Project initialization + Hello World (smallest possible start)
- [ ] Initialize Vite React + TypeScript app.
- [ ] Confirm app runs locally.
- [ ] Replace starter screen with minimal "Hello Hackathon Project Matcher".
- [ ] Add a basic test that checks the hello text renders.
- [ ] Security: add `.gitignore`, ensure no secrets committed, add `.env.example` placeholder.
- [ ] Documentation: add `README.md` quick-start and run/test commands.

### Step 2 - CI setup early (required)
- [ ] Add CI workflow (GitHub Actions or equivalent) to run install, build, test, lint.
- [ ] Add lint + format scripts.
- [ ] Ensure CI runs on pull requests and main branch pushes.
- [ ] Security: add dependency audit step (`npm audit` or equivalent policy).
- [ ] Documentation: add CI badge and workflow notes in `README.md`.

### Step 3 - Deployable Hello World (required early deploy)
- [ ] Configure hosting target (e.g., Vercel/Netlify/GitHub Pages).
- [ ] Add production build command and deploy config.
- [ ] Deploy current Hello World successfully.
- [ ] Add smoke test checklist for deployed URL (page loads, no console errors).
- [ ] Security: enforce HTTPS deployment and remove source maps in production if needed.
- [ ] Documentation: add deployment URL and rollback basics.

## Phase 1 - UI Foundation with Mocked Data

### Step 4 - App shell and layout
- [ ] Create base layout: header, main content container, footer.
- [ ] Add desktop-first responsive structure.
- [ ] Add simple route structure (home, project details placeholder).
- [ ] Test: render test for app shell.
- [ ] Security: sanitize any dynamic text rendering defaults.
- [ ] Documentation: add UI structure section with route map.

### Step 5 - Theme system skeleton (dark + light)
- [ ] Add global theme tokens (colors, spacing) for dark and light mode.
- [ ] Add visible theme toggle in header.
- [ ] Persist selected theme in local storage.
- [ ] Test: toggle switches and persists after reload.
- [ ] Security: validate local storage reads with safe fallback to default theme.
- [ ] Documentation: add theming approach and default behavior.

### Step 6 - Mocked project data model in frontend
- [ ] Define TypeScript interfaces for `User` and `Project` (matching PRD).
- [ ] Add local mocked dataset with 3-5 projects.
- [ ] Create typed data access helper for mocked data.
- [ ] Test: type-safe mock load test / helper behavior test.
- [ ] Security: enforce strict typing and safe defaults for nullable fields.
- [ ] Documentation: add data model snippet and mock data location.

### Step 7 - Project cards list (mocked)
- [ ] Build project card component (title, short description, member count, status).
- [ ] Render card grid from mocked data.
- [ ] Add loading/empty states.
- [ ] Test: list renders expected number of cards and key fields.
- [ ] Security: escape/sanitize displayed project text.
- [ ] Documentation: add card component props and states.

### Step 8 - Project details page (mocked)
- [ ] Create details view route with full project fields.
- [ ] Support navigation from card to details.
- [ ] Show status badge and member count.
- [ ] Test: details page renders selected mocked project.
- [ ] Security: handle invalid/missing project ID with safe not-found view.
- [ ] Documentation: add details page flow.

### Step 9 - Name + email entry (mocked session only)
- [ ] Build entry form for name and email.
- [ ] Block project actions until entry complete.
- [ ] Store participant session locally (temporary).
- [ ] Test: validation and blocked actions when user is missing.
- [ ] Security: add client-side email format validation and trim/sanitize inputs.
- [ ] Documentation: add onboarding rules and known limitations.

## Phase 2 - Real Backend Basics

### Step 10 - Backend scaffold
- [ ] Add minimal backend service (Node/Express or preferred lightweight stack).
- [ ] Add health endpoint.
- [ ] Connect frontend to backend base URL config.
- [ ] Test: backend health endpoint test + frontend integration smoke test.
- [ ] Security: enable basic security headers/CORS allowlist.
- [ ] Documentation: add architecture diagram and local run instructions.

### Step 11 - Database setup and migrations
- [ ] Add database (SQLite/Postgres) and migration tooling.
- [ ] Create `users` and `projects` tables.
- [ ] Seed initial project records for development.
- [ ] Test: migration + seed test in CI.
- [ ] Security: use parameterized queries/ORM protections.
- [ ] Documentation: add migration commands and schema notes.

### Step 12 - Real read API for project list/details
- [ ] Implement `GET /projects` and `GET /projects/:id`.
- [ ] Replace frontend mocked reads with API calls.
- [ ] Keep loading/error UI states.
- [ ] Test: API contract tests + frontend data-fetch tests.
- [ ] Security: validate route params and limit response fields.
- [ ] Documentation: add endpoint specs.

## Phase 3 - Membership Core Functionality

### Step 13 - Create/lookup participant API
- [ ] Implement participant creation/lookup by name + email.
- [ ] Store role (`participant` default).
- [ ] Wire entry form to backend.
- [ ] Test: create vs existing-user behavior.
- [ ] Security: basic rate limiting on participant creation endpoint.
- [ ] Documentation: add participant lifecycle flow.

### Step 14 - Join project API (single main project rule)
- [ ] Implement join endpoint with rule: one main project per user.
- [ ] Return clear error when user already has another main project.
- [ ] Connect Join button to API.
- [ ] Test: successful join + duplicate-main-project rejection.
- [ ] Security: server-side rule enforcement (never client-only).
- [ ] Documentation: add join rule and error codes.

### Step 15 - Enforce project capacity (max 5)
- [ ] Add capacity check to join logic.
- [ ] Return specific "project full" response.
- [ ] Show disabled Join UI when full.
- [ ] Test: capacity boundary test (4->5 allowed, 5->6 blocked).
- [ ] Security: atomic update/transaction to prevent race-condition overfill.
- [ ] Documentation: add capacity behavior.

### Step 16 - Give up current project
- [ ] Implement leave endpoint for current main project.
- [ ] Update member count reliably.
- [ ] Add Give Up action in UI.
- [ ] Test: leave flow updates membership and counter.
- [ ] Security: authorize user can only leave their own membership.
- [ ] Documentation: add leave flow sequence.

### Step 17 - Switch main project
- [ ] Implement switch endpoint (leave old + join new in transaction).
- [ ] Add Switch action UX from current project context.
- [ ] Handle full target project case gracefully.
- [ ] Test: successful switch + rollback on failure.
- [ ] Security: transactional integrity to avoid dual-membership state.
- [ ] Documentation: add switch flow and failure handling.

## Phase 4 - Watchlist + Project Creation

### Step 18 - Watch/unwatch projects
- [ ] Add watch relation model (`user_project_watch`).
- [ ] Implement watch/unwatch endpoints.
- [ ] Add watch toggle on card/details.
- [ ] Test: user can watch multiple projects while holding one main project.
- [ ] Security: enforce user-scoped watch actions.
- [ ] Documentation: add watchlist rules.

### Step 19 - Create project endpoint (public immediate publish)
- [ ] Implement `POST /projects` with required fields (title, description, tech stack, lead name).
- [ ] Auto-assign creator as member and creator's main project.
- [ ] Prevent creator from joining another main project unless switch/give up.
- [ ] Test: create project success + auto-assignment + rule enforcement.
- [ ] Security: validate payload length/content and reject invalid input.
- [ ] Documentation: add project creation API and business rules.

### Step 20 - Create project UI form
- [ ] Build "Create Project" form with required field validation.
- [ ] Show inline errors and submit state.
- [ ] Refresh list/details after create.
- [ ] Test: valid submit and invalid form cases.
- [ ] Security: escape/sanitize user-entered strings before display.
- [ ] Documentation: add form behavior and examples.

## Phase 5 - Admin + Status Management

### Step 21 - Admin bootstrap account
- [ ] Seed one admin user for the single event.
- [ ] Add simple admin recognition in UI/backend.
- [ ] Hide admin controls for non-admin users.
- [ ] Test: role-based visibility tests.
- [ ] Security: enforce admin authorization in backend endpoints.
- [ ] Documentation: add admin setup and access model.

### Step 22 - Mark project completed (admin only)
- [ ] Implement admin endpoint to set project status to completed.
- [ ] Reflect status in cards/details.
- [ ] Block new joins to completed projects.
- [ ] Test: completed project cannot be newly joined.
- [ ] Security: authorize admin-only status changes + audit log entry.
- [ ] Documentation: add status lifecycle and admin actions.

## Phase 6 - Quality, Security Hardening, and Release

### Step 23 - End-to-end core flow tests
- [ ] Add E2E tests: entry -> browse -> details -> join -> switch -> leave -> watch -> create project.
- [ ] Add admin E2E: mark completed and verify join blocked.
- [ ] Run E2E in CI for main branch.
- [ ] Security: include negative-path E2E checks for unauthorized actions.
- [ ] Documentation: add test strategy and how to run locally.

### Step 24 - Security hardening pass
- [ ] Add centralized input validation layer for all endpoints.
- [ ] Add stricter CORS, request size limits, and HTTP security headers.
- [ ] Add dependency pinning/update policy and vulnerability triage process.
- [ ] Test: security-focused tests for validation and access control failures.
- [ ] Security: document threat assumptions and mitigations.
- [ ] Documentation: add `docs/security.md`.

### Step 25 - Observability and reliability basics
- [ ] Add structured logging for key actions (join/switch/leave/create/complete).
- [ ] Add basic error monitoring hook.
- [ ] Add graceful user-facing error messages.
- [ ] Test: simulate API failures and verify resilient UI behavior.
- [ ] Security: avoid logging PII beyond required fields; mask sensitive values.
- [ ] Documentation: add operational runbook basics.

### Step 26 - Release candidate and production deployment
- [ ] Freeze MVP scope against PRD acceptance criteria.
- [ ] Run full CI test matrix and manual smoke tests.
- [ ] Tag release and deploy to production.
- [ ] Test: post-deploy smoke tests on live URL.
- [ ] Security: verify HTTPS, secure headers, and no exposed secrets in build artifacts.
- [ ] Documentation: publish release notes and known limitations.

## MVP Completion Checklist (from PRD)
- [ ] Name + email entry is required before project actions.
- [ ] Project cards + details are available.
- [ ] User can hold exactly one main project at a time.
- [ ] User can switch or give up main project.
- [ ] User can watch multiple projects.
- [ ] User can create project and is auto-joined as creator.
- [ ] Project capacity limit of 5 is enforced.
- [ ] Admin can mark project as completed.
- [ ] Completed projects cannot be newly joined.
- [ ] Dark and light modes are available with toggle.
- [ ] Desktop-first responsive behavior is verified.
