# Deployment runbook

## Delivery model

- GitHub Actions owns deployment; Vercel Git auto-deployment is disabled so it cannot bypass tests.
- Pull requests and `main` run formatting, linting, type checks, unit tests, a production build, Python tests, and database-backed authentication tests.
- After local gates pass, Actions builds an immutable Vercel preview and runs cloud smoke tests against its URL.
- Pull requests stop after the tested preview. A `main` build continues to the protected production job only after the cloud tests pass.
- Production applies committed Prisma migrations before building and deploying the verified commit.
- Production deployment concurrency is serialised to prevent overlapping releases.

## GitHub configuration

Create `preview` and `production` GitHub environments. Add these repository or environment secrets:

- `DATABASE_URL` — pooled or direct production PostgreSQL connection accepted by Prisma Migrate.
- `VERCEL_TOKEN` — Vercel access token scoped to the account/team that owns the project.
- `VERCEL_ORG_ID` — value from `.vercel/project.json` after linking.
- `VERCEL_PROJECT_ID` — value from `.vercel/project.json` after linking.
- `VERCEL_AUTOMATION_BYPASS_SECRET` — allows the cloud test runner to access protected preview deployments.

Protect `main` and require `Web quality and integration tests`, `Python matching-service tests`, and `Test deployed preview in cloud`. Disable direct force-pushes and require pull requests for subsequent work. Add a required reviewer to the GitHub `production` environment when manual release approval is desired.

## Test layers

1. Vitest verifies isolated TypeScript domain and security behaviour.
2. Pytest verifies scoring, eligibility, and FastAPI contracts.
3. Playwright API integration tests run the application against an isolated PostgreSQL 16 service container and verify candidate/company registration, session exclusivity, logout, login, validation, and role boundaries.
4. Cloud smoke tests run against the deployed Vercel preview and verify health, public rendering, PWA metadata, and cron authorization.

Failed Playwright runs upload reports and traces to the GitHub Actions run for 14 days.

## Vercel environment variables

Configure the following for Production and, where appropriate, Preview:

- `DATABASE_URL`
- `NEXT_PUBLIC_APP_URL`
- `MATCHING_SERVICE_URL`
- `RESEND_API_KEY`
- `EMAIL_FROM`
- `EMAIL_TRANSPORT=resend`
- `RESEND_TEST_RECIPIENT` for non-production testing only
- `CRON_SECRET` with at least 16 random characters

Do not place secrets in `vercel.json`, workflow files, or committed `.env` files.

## Database migrations

Create migrations locally with `pnpm db:migrate`. Production must only run `pnpm db:migrate:deploy`; never run `migrate dev` or `db push` against production. Review destructive SQL before merging.

## Cron operation

The invitation expiry job runs daily at 01:00 UTC, which is compatible with Vercel Hobby limits. Vercel sends `CRON_SECRET` as a bearer token and the route rejects other callers. Upgrade the schedule only after confirming the Vercel plan supports it.

## Rollback

Use Vercel's deployment history to promote the last healthy application deployment. Database migrations require a forward-fix migration; application rollback does not reverse schema changes automatically.
