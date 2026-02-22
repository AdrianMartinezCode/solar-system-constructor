# Task 5 — Add a DB provider “slot” to the API (DB type still TBD)

## Objective

Create the backend code structure that isolates persistence behind a provider interface so we can swap databases later (Postgres/MySQL/SQLite/Mongo/etc.) without rewriting the app. The API must continue to run without any DB configured by default.

## Context to read first

- `docs/plans/PLAN_backend_monorepo_structure.md` (Task 5 section)
- `apps/api/src/app.ts`
- `apps/api/src/server.ts`
- `apps/api/.env.example`

## Constraints

- Do not pick a final database library/ORM in this task unless absolutely necessary.
- The API must boot and serve `/health` with **no DB running** (default provider can be “noop/in-memory”).
- Keep all DB-related wiring under `apps/api/src/infra/db/`.

## Steps

1. Create a minimal DB provider contract:
   - Types for a “DB client/provider” with lifecycle methods (e.g. `connect()`, `disconnect()`, maybe `ping()`).
2. Implement a default `noop` provider that does nothing but satisfies the interface.
3. Add env parsing in `apps/api/src/config/env.ts`:
   - `PORT` default
   - `DB_PROVIDER` default (`noop`)
   - `DATABASE_URL` optional placeholder
4. Wire provider initialization at startup:
   - Either in `src/server.ts` before listening, or in `src/app.ts` during app construction.
   - Ensure provider disconnect on shutdown (best-effort) if you add signal handlers.
5. Add clear TODO comments for future DB implementations (e.g. `postgres`, `sqlite`), but keep actual implementations out of scope unless they are extremely small and non-committal.

## Files to create/update

- **Create**: `apps/api/src/config/env.ts`
- **Create**: `apps/api/src/infra/db/types.ts`
- **Create**: `apps/api/src/infra/db/noopProvider.ts`
- **Create**: `apps/api/src/infra/db/index.ts`
- **Update**: `apps/api/src/server.ts` (wire env + provider lifecycle)

## Acceptance criteria

- [ ] API runs with no DB configured (`DB_PROVIDER` defaults to `noop`).
- [ ] DB-related code lives under `apps/api/src/infra/db/` and does not leak into route handlers.
- [ ] Env variables are centralized in `apps/api/src/config/env.ts`.
- [ ] `/health` remains functional.

## Verification

```bash
npm run dev:api

# in another terminal:
curl http://localhost:3001/health
```

## Notes

- A follow-up change request can decide the database + add real provider implementation + migrations.

