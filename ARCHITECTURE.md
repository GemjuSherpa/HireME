# HireME architecture

HireME follows the Next.js App Router convention while separating business rules from delivery mechanisms.

## Folder responsibilities

- `app/` — routes, route handlers, loading boundaries and route-specific React components. Files here should translate HTTP or UI events into application calls, not contain reusable business rules.
- `components/` — reusable presentation and layout components shared by multiple routes.
- `features/` — business capabilities grouped by domain. Contracts, server-side application services and domain-specific UI belong here when reused across routes.
- `shared/` — domain-neutral infrastructure such as typed HTTP helpers. Shared modules must not import from a feature.
- `lib/` — existing server infrastructure and compatibility entry points. New domain logic should move toward `features/`; framework or vendor adapters can remain here.
- `prisma/` — persistence schema, migrations and deterministic seed data.
- `matching-service/` — independently testable Python ranking service.
- `tests/` and `e2e/` — unit/integration and browser-level behaviour tests.

## Dependency direction

`app → features → shared`

Infrastructure adapters may be injected into feature services. Shared code must not depend on routes or React. React client components must not import Node-only modules.

## Engineering conventions

- TypeScript uses `camelCase` for values/functions, `PascalCase` for components/types, and descriptive verb-first function names.
- Python uses `snake_case` for functions/values and `PascalCase` for classes.
- Public or non-obvious contracts use TSDoc/docstrings describing purpose, parameters, return value and important failures. Comments explain **why**, not syntax.
- API routes validate at the boundary, authorise before mutation, return the shared `{ error, field? }` envelope, and never expose stack traces.
- Client components use typed API helpers, explicit loading/error states and accessible controls.
- Domain services own workflow transitions and audit logging; route handlers remain thin.
- Protected attributes must never be inputs to automated candidate ranking.

## Quality gates

Run `npm run format:check`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run matching:lint`, `npm run matching:test`, and `npm run build` before merging.
