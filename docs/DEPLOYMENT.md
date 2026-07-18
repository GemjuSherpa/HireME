# Deployment runbook

## Delivery model

- Pull requests and `main` run both web and Python quality gates in GitHub Actions.
- Vercel Git integration creates preview deployments for pull requests.
- A successful CI run on `main` triggers the protected production workflow.
- Production applies committed Prisma migrations before deploying the verified commit.
- Production deployment concurrency is serialised to prevent overlapping releases.

## GitHub configuration

Create a `production` environment and add these environment secrets:

- `DATABASE_URL` — pooled or direct production PostgreSQL connection accepted by Prisma Migrate.
- `VERCEL_TOKEN` — Vercel access token scoped to the account/team that owns the project.
- `VERCEL_ORG_ID` — value from `.vercel/project.json` after linking.
- `VERCEL_PROJECT_ID` — value from `.vercel/project.json` after linking.

Protect `main` and require the `Web quality gates` and `Python matching service` checks. Disable direct force-pushes and require pull requests for subsequent work.

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
