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

## Production Startup (Render Blueprint)

- Config source: `render.yaml`
- Start command: `npm run server:start:prod`
- DB path (free-tier compatible): `/tmp/hackathon.sqlite` (ephemeral)

Required production env:

- `CORS_ORIGINS`: comma-separated frontend origins that may call the API
- `API_HOST=0.0.0.0`
- `API_PORT=10000` (Render default internal port)

Persistence caveat:

- Render free web services do not support attached disks.
- SQLite at `/tmp` resets on restart/redeploy; startup seed repopulates baseline records.

Frontend deployment note:

- Set `VITE_API_BASE_URL` to your live backend URL before frontend build/deploy.

## Common Failure Modes

- **Frontend shows "Unable to load projects right now."**
  - Backend not running, wrong `VITE_API_BASE_URL`, or backend CORS missing frontend origin.
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
