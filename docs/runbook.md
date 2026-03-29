# Operational Runbook (MVP)

## Local Startup

```bash
npm install
npm run dev:server
npm run dev
```

- Frontend default: `http://127.0.0.1:5173` (or next open Vite port)
- Backend default: `http://127.0.0.1:8787`

## Health Checks

- API health: `GET /health`
- Core smoke:
  - onboarding (participant create/lookup)
  - project list and details
  - join/switch/leave
  - watch/unwatch
  - create project
  - admin complete project

## Common Failure Modes

- **Frontend shows "Unable to load projects right now."**
  - Backend not running or wrong `VITE_API_BASE_URL`.
- **Join blocked unexpectedly**
  - User already has a main project, project is full, or project is completed.
- **Admin complete rejected**
  - Session user is not admin (`role !== admin`).

## Logs and Error Monitoring

- API writes structured logs through `backend/observability.ts`.
- Errors are emitted via `reportError` with masked PII.
- Review logs for action names:
  - `project_join`, `project_switch`, `project_leave`
  - `project_created`, `project_completed`
  - `project_watched`, `project_unwatched`

## Pre-Release Checks

```bash
npm run lint
npm run test
npm run test:db
npm run test:e2e
npm run build
```
