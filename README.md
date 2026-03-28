# Hackathon Project Matcher

Step 1 scaffold for the Hackathon Project Matcher web app.

[![CI](https://github.com/swashrafiq/hackathon-project-matcher/actions/workflows/ci.yml/badge.svg)](https://github.com/swashrafiq/hackathon-project-matcher/actions/workflows/ci.yml)
[![Deploy](https://github.com/swashrafiq/hackathon-project-matcher/actions/workflows/deploy.yml/badge.svg)](https://github.com/swashrafiq/hackathon-project-matcher/actions/workflows/deploy.yml)

## Quick Start

```bash
npm install
npm run dev
```

Open the local URL shown by Vite to view the app.

## Available Scripts

```bash
npm run dev
npm run test
npm run lint
npm run format
npm run build
npm run audit:ci
npm run preview
```

## CI

- Workflow file: `.github/workflows/ci.yml`
- Triggered on pushes to `dev`/`main` and pull requests targeting `dev`/`main`
- Runs: install, lint, test, build, dependency audit

After you push this repository to GitHub, check the **Actions** tab to confirm the first run passes.

## Branching and Staging Workflow

Use this promotion path to avoid direct changes on `main`:

1. Create a feature branch from `dev` (example: `feature/project-cards`).
2. Open PR: `feature/*` -> `dev` for integration testing/review.
3. After validation on `dev`, open PR: `dev` -> `main` for release.
4. `main` remains the production branch (Deploy workflow runs from `main`).

Suggested commands:

```bash
git checkout dev
git pull
git checkout -b feature/short-task-name
```

## Deployment (GitHub Pages)

- Workflow file: `.github/workflows/deploy.yml`
- Trigger: push to `main` (or manual dispatch)
- Live URL: [https://swashrafiq.github.io/hackathon-project-matcher/](https://swashrafiq.github.io/hackathon-project-matcher/)

### Smoke Checklist

- Deployed page loads successfully over HTTPS.
- "Hello Hackathon Project Matcher" is visible.
- Browser console has no blocking runtime errors.

### Rollback Basics

- Revert the breaking commit on `main` and push again; the deploy workflow publishes the previous stable state.
- Alternative: redeploy a known-good commit by checking it out, cherry-picking as needed, and pushing to `main`.

## UI Structure and Routes

Current shell structure:

- `header`: brand and primary navigation
- `main`: route content area
- `footer`: event context text

Current route map:

- `/` -> Home view (hello and step progress text)
- `/projects/:projectId` -> Project details placeholder view
- `*` -> Not found text fallback

## Environment Variables

- Copy `.env.example` to `.env.local` when adding local variables.
- Do not commit secrets.
