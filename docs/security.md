# Security Notes

## Threat Assumptions

- Single-event prototype with authenticated identity represented by participant id from onboarding.
- Attackers may submit malformed payloads, try unauthorized admin actions, or attempt SQL-style injection strings.
- Backend is internet-reachable in deployment and must not trust client-side checks.

## Current Mitigations

- Centralized backend validation (`backend/validation.ts`) for IDs, email, and create-project payload constraints.
- Parameterized SQL statements throughout repositories.
- CORS allowlist and explicit method/header restrictions in API middleware.
- Request body limit (`10kb`) plus Helmet security headers.
- Server-side authorization for admin-only completion endpoint.
- Server-side enforcement for single-main-project, capacity, and completed-project join restrictions.

## Logging and PII

- Structured action logs in `backend/observability.ts`.
- Email values are masked before log output.
- Logs avoid request body dumps and keep only action metadata.

## Dependency Policy and Vulnerability Triage

- Dependencies are managed via `npm` and reviewed through CI `npm run audit:ci`.
- Runtime and dev dependencies should be kept on maintained major versions.
- High/critical vulnerabilities block release until patched, replaced, or explicitly documented with temporary risk acceptance.

## Validation and Access-Control Tests

- API tests include negative paths for:
  - invalid IDs and malformed input
  - non-admin project completion attempts
  - completed-project join rejection
  - watch actions scoped by participant route

Run locally:

```bash
npm run test
npm run test:e2e
```
