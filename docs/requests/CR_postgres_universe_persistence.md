# Change Request: Add PostgreSQL Universe Persistence Layer to the API

## Summary

Introduce PostgreSQL as the persistence database for storing universe state, and prepare the API codebase with the required infrastructure: a Postgres `DbProvider`, a `UniverseRepository` port with a Postgres adapter, universe CRUD routes, Docker Compose Postgres service, and an in-memory mock adapter for development/testing without a running DB. This is a **backend-only** change — no frontend modifications, no WebSocket layer, no MCP server integration.

## Context

The backend API (`apps/api`) was scaffolded in CR `backend_monorepo_structure` with an intentionally empty `DbProvider` interface and a `noopProvider`. The `compose.yaml` already has a commented-out PostgreSQL service. The frontend (`apps/web`) has a rich domain model (`UniverseState`, `UniverseCommand`, `applyUniverseCommand`) and currently persists to `localStorage` via a `SystemRepository` port. The next evolution is to store generated universes server-side so that future features (WebSocket real-time sync, MCP-driven mutations) have a durable backend to work against.

This CR covers **only** the DB and adapter plumbing. Moving domain types to a shared package, wiring WebSocket broadcasts, and connecting the MCP server are all **deferred** to later CRs.

## Goals

- Implement a **PostgreSQL `DbProvider`** satisfying the existing `DbProvider` interface (`connect`, `disconnect`, `ping`).
- Define a **`UniverseRepository` port** (interface) on the API side for universe CRUD (create, getById, list, update, delete).
- Implement a **Postgres adapter** for `UniverseRepository` using `pg` (node-postgres) with JSONB storage.
- Implement an **in-memory adapter** for `UniverseRepository` (for local dev/testing without Postgres).
- Expose **REST routes** for universe CRUD (`POST /universes`, `GET /universes`, `GET /universes/:id`, `PUT /universes/:id`, `DELETE /universes/:id`).
- Activate the **Postgres service in `compose.yaml`** and wire the `DB_PROVIDER` / `DATABASE_URL` env vars.
- Provide a simple **SQL init script** for the `universes` table (no migration framework yet).
- Keep all changes inside `apps/api/` and root config files (`compose.yaml`, root `package.json` scripts if needed).

## Non-goals

- Moving or sharing frontend domain types (`UniverseState`, `UniverseCommand`, etc.) into a `packages/` shared library. The API will define its own minimal universe persistence types for now; alignment happens in a later CR.
- Implementing WebSocket broadcasting.
- Implementing the MCP server or any MCP tool integration.
- Modifying any frontend code (`apps/web/`).
- Introducing a migration framework (Knex, Drizzle, Prisma). A raw SQL init script is sufficient at this stage.
- Adding a full test runner or linter to the API.

## Constraints

- Changes are **incremental** — one concern per task, ≤ 5 files per task.
- The API must **still boot and pass `/health`** with `DB_PROVIDER=noop` (backwards compatibility).
- Use **`pg`** (node-postgres) as the Postgres driver — no ORM at this stage.
- PostgreSQL version: **16** (matching the commented-out `compose.yaml` example).
- The `universes` table uses a **JSONB `state` column** for the universe snapshot and a **JSONB `command_log` or separate table** for optional future event sourcing.
- SQL init script should be idempotent (`CREATE TABLE IF NOT EXISTS`).
- Docker Compose changes must not break `docker compose up` for existing services.

## Out of Scope

- Database migrations framework.
- Authentication / authorization on universe routes.
- Command/event-sourcing implementation (the `universe_commands` table is prepared but not actively used beyond schema).
- CI/CD, production deployment.
- Frontend changes of any kind.
- WebSocket or real-time push infrastructure.

## Acceptance Criteria

- [ ] `apps/api/src/infra/db/postgresProvider.ts` exists and implements `DbProvider` (connect, disconnect, ping via `SELECT 1`).
- [ ] `apps/api/src/app/ports/universeRepository.ts` defines a `UniverseRepository` interface with `create`, `getById`, `list`, `update`, `delete` methods.
- [ ] `apps/api/src/infra/persistence/postgresUniverseRepository.ts` implements `UniverseRepository` using `pg` and JSONB.
- [ ] `apps/api/src/infra/persistence/inMemoryUniverseRepository.ts` implements `UniverseRepository` as an in-memory Map (for dev/testing).
- [ ] `apps/api/src/routes/universes.ts` exposes REST CRUD endpoints wired to the repository.
- [ ] `compose.yaml` has an active `db` service running `postgres:16-alpine` with health check.
- [ ] `apps/api/infra/sql/init.sql` contains idempotent DDL for `universes` and `universe_commands` tables.
- [ ] `DB_PROVIDER=noop` still works — API boots, `/health` returns `{ ok: true }`.
- [ ] `DB_PROVIDER=postgres` with a valid `DATABASE_URL` connects, `/health` returns DB status, and universe CRUD routes work.
- [ ] `npm run build` and `npm run typecheck` pass without errors.

## Verification

```bash
# Must pass after all tasks
npm run build
npm run typecheck

# API boots with noop (no Postgres needed)
DB_PROVIDER=noop npm run dev:api
curl http://localhost:3001/health  # { "ok": true, ... }

# Full stack with Postgres via Docker
docker compose up --build
curl http://localhost:3001/health
curl -X POST http://localhost:3001/universes -H 'Content-Type: application/json' -d '{"name":"Test","state":{}}'
curl http://localhost:3001/universes
```
