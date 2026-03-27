# Hackathon Project Matcher

Step 1 scaffold for the Hackathon Project Matcher web app.

[![CI](https://github.com/swashrafiq/hackathon-project-matcher/actions/workflows/ci.yml/badge.svg)](https://github.com/swashrafiq/hackathon-project-matcher/actions/workflows/ci.yml)

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
- Triggered on pushes to `main` and pull requests targeting `main`
- Runs: install, lint, test, build, dependency audit

After you push this repository to GitHub, check the **Actions** tab to confirm the first run passes.

## Environment Variables

- Copy `.env.example` to `.env.local` when adding local variables.
- Do not commit secrets.
