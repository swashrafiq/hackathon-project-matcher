# Release Notes - v1.0.0

Release date: 2026-03-29

## Highlights
- Completed MVP delivery for Hackathon Project Matcher across backend and frontend.
- Added participant watchlist flow (watch/unwatch/list) with scoped authorization and tests.
- Added admin-only project completion workflow with status propagation in UI and API enforcement.
- Added security hardening (centralized validation, stricter CORS/request limits, secure headers, dependency audit policy).
- Added observability baseline (structured action logs, error reporting hook, resilient user-facing error states).
- Improved frontend UX with clearer navigation, dedicated create-project page, reusable layout/session components, and accessibility/focus updates.

## Validation for this release
- Local release matrix passed:
  - `npm run lint`
  - `npm run build`
  - `npm run test`
  - `npm run test:e2e`
- Production frontend deployment completed on Vercel:
  - Primary alias: `https://hackaton-delta-weld.vercel.app`
  - Deployment inspector: `https://vercel.com/swashrafiq-6202s-projects/hackaton/Av2Pi8rs9ZeKtu7ESr1tQLpmkqGe`

## Post-deploy checks
- HTTPS enabled (`strict-transport-security` present).
- App shell loads (`index.html`, root container, JS bundle reachable).

## Known limitations
- The deployed frontend bundle currently contains `http://127.0.0.1:8787` as default API base URL.
- Without setting `VITE_API_BASE_URL` to a reachable production backend, live API-driven flows (projects/joins/watches/create/complete) will fail from the public URL.

## Next actions
1. Provision and publish a production backend URL.
2. Set `VITE_API_BASE_URL` in Vercel project environment variables.
3. Redeploy and re-run live smoke checks for full end-to-end production readiness.
