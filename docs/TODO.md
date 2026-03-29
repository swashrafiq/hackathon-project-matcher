# Hackathon Project Matcher - Incremental Implementation TODO

This checklist is designed for very small, tangible increments suitable for AI-assisted development.

## Working Rules for AI-Assisted Incremental Delivery
- [ ] Keep each PR/task very small (target: 1 behavior change, ideally <= 120 lines changed).
- [ ] Define a single acceptance check before coding each task (what must be true when done).
- [ ] Add or update tests for every new behavior before marking a task complete.
- [ ] Manually preview the latest development build (`npm run dev`) before commit/PR.
- [ ] Run local checks before commit (`test`, `lint`, `build`), or document why a check was skipped.
- [ ] Include at least one security action per step (input validation, auth rule, safe defaults, or dependency check).
- [ ] Include a documentation update per step (`README.md` and/or relevant file under `docs/`).
- [ ] Use clear branch and commit naming tied to one task only (no mixed-purpose commits).
- [ ] Record API/UI contract changes immediately (request/response shape, validation, error states).
- [ ] Add a rollback note for risky changes (what to revert if deployment fails).
- [ ] Definition of Done for each step: behavior works, tests pass, CI passes, security check done, docs updated.

### Reusable Task Template (copy per step)
- [ ] **Goal:** One-sentence outcome for this task.
- [ ] **Scope:** Files/components/endpoints to change (and explicitly out-of-scope items).
- [ ] **Acceptance Check:** Single observable condition that proves completion.
- [ ] **Implementation:** Smallest possible code change to satisfy acceptance.
- [ ] **Tests:** New/updated unit/integration/E2E checks.
- [ ] **Security:** Validation/auth/safe-default action for this task.
- [ ] **Docs:** README/docs/API update for this task.
- [ ] **Verification:** Run `test`, `lint`, `build` and note results.
- [ ] **Rollback:** Quick revert plan if the change causes regressions.
- [ ] **Done:** CI green, review complete, ready to merge/deploy.

## Execution Board (Steps 1-3)

### Now
- [x] Step 1 - Project initialization + Hello World
  - [x] Create app scaffold and run locally.
  - [x] Replace starter UI with hello message.
  - [x] Add one hello render test.
  - [x] Add `.gitignore`, `.env.example`, and README quick-start.

### Next
- [x] Step 2 - CI setup early
  - [x] Add CI workflow for install/lint/test/build.
  - [x] Add dependency audit in CI.
  - [x] Document CI usage and failure handling.
  - [x] Verify first GitHub Actions run after pushing to remote.

### Later
- [x] Step 3 - Deployable Hello World
  - [x] Configure hosting and first deploy from `main`.
  - [x] Run deployment smoke checks.
  - [x] Document deploy URL and rollback steps.

## Phase 0 - Bootstrap and First Deploy

### Step 1 - Project initialization + Hello World (smallest possible start)
- [x] Initialize Vite React + TypeScript app.
- [x] Confirm app runs locally.
- [x] Replace starter screen with minimal "Hello Hackathon Project Matcher".
- [x] Add a basic test that checks the hello text renders.
- [x] Security: add `.gitignore`, ensure no secrets committed, add `.env.example` placeholder.
- [x] Documentation: add `README.md` quick-start and run/test commands.

#### Step 1 Example Using the Template
- [x] **Goal:** Running app shows "Hello Hackathon Project Matcher" locally and in tests.
- [x] **Scope:** Initialize frontend app files; update main UI component; add one render test; add basic docs.
- [x] **Acceptance Check:** `npm run dev` shows hello text and `npm test` passes with one hello test.
- [x] **Implementation:** Scaffold with Vite React TypeScript and replace starter content only.
- [x] **Tests:** Add one unit/render test that asserts hello text is visible.
- [x] **Security:** Add `.gitignore`, create `.env.example`, and confirm no real secret values exist.
- [x] **Docs:** Add README quick-start (`install`, `dev`, `test`, `build`).
- [x] **Verification:** Run `npm test`, `npm run lint` (if available), and `npm run build`.
- [ ] **Rollback:** Revert Step 1 commit if setup breaks future steps.
- [x] **Done:** Local run works, test passes, docs updated, ready for Step 2.

### Step 2 - CI setup early (required)
- [x] Add CI workflow (GitHub Actions or equivalent) to run install, build, test, lint.
- [x] Add lint + format scripts.
- [x] Ensure CI runs on pull requests and main branch pushes.
- [x] Security: add dependency audit step (`npm audit` or equivalent policy).
- [x] Documentation: add CI badge and workflow notes in `README.md`.

#### Step 2 Example Using the Template
- [ ] **Goal:** Every push/PR automatically validates code quality and build health.
- [ ] **Scope:** Add CI workflow file, package scripts for lint/test/build, and README CI notes.
- [ ] **Acceptance Check:** A PR run shows successful `install`, `lint`, `test`, and `build` jobs.
- [ ] **Implementation:** Create one simple pipeline first; avoid parallel matrix complexity initially.
- [ ] **Tests:** Verify CI includes existing tests and fails if a test is intentionally broken.
- [ ] **Security:** Add dependency audit command and fail policy for high/critical vulnerabilities (as agreed).
- [ ] **Docs:** Add CI workflow description, badge, and troubleshooting notes to README.
- [ ] **Verification:** Trigger CI from a small docs/code change and confirm all checks pass.
- [ ] **Rollback:** Revert workflow file if CI blocks all merges unexpectedly, then re-add incrementally.
- [ ] **Done:** CI green on PR and `main`, security audit active, docs updated.

### Step 3 - Deployable Hello World (required early deploy)
- [x] Configure hosting target (e.g., Vercel/Netlify/GitHub Pages).
- [x] Add production build command and deploy config.
- [x] Deploy current Hello World successfully.
- [x] Add smoke test checklist for deployed URL (page loads, no console errors).
- [x] Security: enforce HTTPS deployment and remove source maps in production if needed.
- [x] Documentation: add deployment URL and rollback basics.

#### Step 3 Example Using the Template
- [x] **Goal:** A public URL serves the Hello World app from the `main` branch.
- [x] **Scope:** Hosting config, build/deploy settings, and deployment docs only.
- [x] **Acceptance Check:** Live URL loads "Hello Hackathon Project Matcher" and basic smoke checks pass.
- [x] **Implementation:** Use default hosting settings first, then add minimal custom config only if required.
- [x] **Tests:** Add a smoke checklist (manual now, automated later) for load/render/no-console-error.
- [x] **Security:** Confirm HTTPS is enforced and no secrets are exposed in deployment config/logs.
- [x] **Docs:** Add live URL, deploy steps, environment variable policy, and rollback command/process.
- [x] **Verification:** Run one fresh deployment from latest `main` and validate on desktop + mobile width.
- [x] **Rollback:** Re-deploy prior stable commit/tag if release has a blocking issue.
- [x] **Done:** Deployment is reachable, smoke checks pass, and release notes/docs are updated.

## Phase 1 - UI Foundation with Mocked Data

### Step 4 - App shell and layout
- [x] Create base layout: header, main content container, footer.
- [x] Add desktop-first responsive structure.
- [x] Add simple route structure (home, project details placeholder).
- [x] Test: render test for app shell.
- [x] Security: sanitize any dynamic text rendering defaults.
- [x] Documentation: add UI structure section with route map.

### Step 5 - Theme system skeleton (dark + light)
- [x] Add global theme tokens (colors, spacing) for dark and light mode.
- [x] Add visible theme toggle in header.
- [x] Persist selected theme in local storage.
- [x] Test: toggle switches and persists after reload.
- [x] Security: validate local storage reads with safe fallback to default theme.
- [x] Documentation: add theming approach and default behavior.

### Step 6 - Mocked project data model in frontend
- [x] Define TypeScript interfaces for `User` and `Project` (matching PRD).
- [x] Add local mocked dataset with 3-5 projects.
- [x] Create typed data access helper for mocked data.
- [x] Test: type-safe mock load test / helper behavior test.
- [x] Security: enforce strict typing and safe defaults for nullable fields.
- [x] Documentation: add data model snippet and mock data location.

### Step 7 - Project cards list (mocked)
- [x] Build project card component (title, short description, member count, status).
- [x] Render card grid from mocked data.
- [x] Add loading/empty states.
- [x] Test: list renders expected number of cards and key fields.
- [x] Security: escape/sanitize displayed project text.
- [x] Documentation: add card component props and states.

### Step 8 - Project details page (mocked)
- [x] Create details view route with full project fields.
- [x] Support navigation from card to details.
- [x] Show status badge and member count.
- [x] Test: details page renders selected mocked project.
- [x] Security: handle invalid/missing project ID with safe not-found view.
- [x] Documentation: add details page flow.

### Step 9 - Name + email entry (mocked session only)
- [x] Build entry form for name and email.
- [x] Block project actions until entry complete.
- [x] Store participant session locally (temporary).
- [x] Test: validation and blocked actions when user is missing.
- [x] Security: add client-side email format validation and trim/sanitize inputs.
- [x] Documentation: add onboarding rules and known limitations.

## Phase 2 - Real Backend Basics

### Step 10 - Backend scaffold
- [x] Add minimal backend service (Node/Express or preferred lightweight stack).
- [x] Add health endpoint.
- [x] Connect frontend to backend base URL config.
- [x] Test: backend health endpoint test + frontend integration smoke test.
- [x] Security: enable basic security headers/CORS allowlist.
- [x] Documentation: add architecture diagram and local run instructions.

### Step 11 - Database setup and migrations
- [x] Add database (SQLite/Postgres) and migration tooling.
- [x] Create `users` and `projects` tables.
- [x] Seed initial project records for development.
- [x] Test: migration + seed test in CI.
- [x] Security: use parameterized queries/ORM protections.
- [x] Documentation: add migration commands and schema notes.

### Step 12 - Real read API for project list/details
- [x] Implement `GET /projects` and `GET /projects/:id`.
- [x] Replace frontend mocked reads with API calls.
- [x] Keep loading/error UI states.
- [x] Test: API contract tests + frontend data-fetch tests.
- [x] Security: validate route params and limit response fields.
- [x] Documentation: add endpoint specs.

## Phase 3 - Membership Core Functionality

### Step 13 - Create/lookup participant API
- [x] Implement participant creation/lookup by name + email.
- [x] Store role (`participant` default).
- [x] Wire entry form to backend.
- [x] Test: create vs existing-user behavior.
- [x] Security: basic rate limiting on participant creation endpoint.
- [x] Documentation: add participant lifecycle flow.

### Step 14 - Join project API (single main project rule)
- [x] Implement join endpoint with rule: one main project per user.
- [x] Return clear error when user already has another main project.
- [x] Connect Join button to API.
- [x] Test: successful join + duplicate-main-project rejection.
- [x] Security: server-side rule enforcement (never client-only).
- [x] Documentation: add join rule and error codes.

### Step 15 - Enforce project capacity (max 5)
- [x] Add capacity check to join logic.
- [x] Return specific "project full" response.
- [x] Show disabled Join UI when full.
- [x] Test: capacity boundary test (4->5 allowed, 5->6 blocked).
- [x] Security: atomic update/transaction to prevent race-condition overfill.
- [x] Documentation: add capacity behavior.

### Step 16 - Give up current project
- [x] Implement leave endpoint for current main project.
- [x] Update member count reliably.
- [x] Add Give Up action in UI.
- [x] Test: leave flow updates membership and counter.
- [x] Security: authorize user can only leave their own membership.
- [x] Documentation: add leave flow sequence.

### Step 17 - Switch main project
- [x] Implement switch endpoint (leave old + join new in transaction).
- [x] Add Switch action UX from current project context.
- [x] Handle full target project case gracefully.
- [x] Test: successful switch + rollback on failure.
- [x] Security: transactional integrity to avoid dual-membership state.
- [x] Documentation: add switch flow and failure handling.

## Phase 4 - Watchlist + Project Creation

### Step 18 - Watch/unwatch projects
- [x] Add watch relation model (`user_project_watch`).
- [x] Implement watch/unwatch endpoints.
- [x] Add watch toggle on card/details.
- [x] Test: user can watch multiple projects while holding one main project.
- [x] Security: enforce user-scoped watch actions.
- [x] Documentation: add watchlist rules.

### Step 19 - Create project endpoint (public immediate publish)
- [x] Implement `POST /projects` with required fields (title, description, tech stack, lead name).
- [x] Auto-assign creator as member and creator's main project.
- [x] Prevent creator from joining another main project unless switch/give up.
- [x] Test: create project success + auto-assignment + rule enforcement.
- [x] Security: validate payload length/content and reject invalid input.
- [x] Documentation: add project creation API and business rules.

### Step 20 - Create project UI form
- [x] Build "Create Project" form with required field validation.
- [x] Show inline errors and submit state.
- [x] Refresh list/details after create.
- [x] Test: valid submit and invalid form cases.
- [x] Security: escape/sanitize user-entered strings before display.
- [x] Documentation: add form behavior and examples.

## Phase 5 - Admin + Status Management

### Step 21 - Admin bootstrap account
- [x] Seed one admin user for the single event.
- [x] Add simple admin recognition in UI/backend.
- [x] Hide admin controls for non-admin users.
- [x] Test: role-based visibility tests.
- [x] Security: enforce admin authorization in backend endpoints.
- [x] Documentation: add admin setup and access model.

### Step 22 - Mark project completed (admin only)
- [x] Implement admin endpoint to set project status to completed.
- [x] Reflect status in cards/details.
- [x] Block new joins to completed projects.
- [x] Test: completed project cannot be newly joined.
- [x] Security: authorize admin-only status changes + audit log entry.
- [x] Documentation: add status lifecycle and admin actions.

## Phase 6 - Quality, Security Hardening, and Release

### Step 23 - End-to-end core flow tests
- [x] Add E2E tests: entry -> browse -> details -> join -> switch -> leave -> watch -> create project.
- [x] Add admin E2E: mark completed and verify join blocked.
- [x] Run E2E in CI for main branch.
- [x] Security: include negative-path E2E checks for unauthorized actions.
- [x] Documentation: add test strategy and how to run locally.

### Step 24 - Security hardening pass
- [x] Add centralized input validation layer for all endpoints.
- [x] Add stricter CORS, request size limits, and HTTP security headers.
- [x] Add dependency pinning/update policy and vulnerability triage process.
- [x] Test: security-focused tests for validation and access control failures.
- [x] Security: document threat assumptions and mitigations.
- [x] Documentation: add `docs/security.md`.

### Step 25 - Observability and reliability basics
- [x] Add structured logging for key actions (join/switch/leave/create/complete).
- [x] Add basic error monitoring hook.
- [x] Add graceful user-facing error messages.
- [x] Test: simulate API failures and verify resilient UI behavior.
- [x] Security: avoid logging PII beyond required fields; mask sensitive values.
- [x] Documentation: add operational runbook basics.

### Step 26 - Release candidate and production deployment
- [x] Freeze MVP scope against PRD acceptance criteria.
- [x] Run full CI test matrix and manual smoke tests.
- [x] Tag release and deploy to production.
- [x] Test: post-deploy smoke tests on live URL.
- [x] Security: verify HTTPS, secure headers, and no exposed secrets in build artifacts.
- [x] Documentation: publish release notes and known limitations.
- [x] Release URL: `https://hackaton-delta-weld.vercel.app`
- [x] Known limitation documented: production frontend requires `VITE_API_BASE_URL` for live backend APIs.

## MVP Completion Checklist (from PRD)
- [x] Name + email entry is required before project actions.
- [x] Project cards + details are available.
- [x] User can hold exactly one main project at a time.
- [x] User can switch or give up main project.
- [x] User can watch multiple projects.
- [x] User can create project and is auto-joined as creator.
- [x] Project capacity limit of 5 is enforced.
- [x] Admin can mark project as completed.
- [x] Completed projects cannot be newly joined.
- [x] Dark and light modes are available with toggle.
- [x] Desktop-first responsive behavior is verified.
