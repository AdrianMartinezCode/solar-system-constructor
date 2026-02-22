# Plan: PostgreSQL Universe Persistence Layer

**CR**: `docs/requests/CR_postgres_universe_persistence.md`

## Summary

Add PostgreSQL as the universe persistence backend for the API. This plan introduces 5 ordered tasks that incrementally build the DB layer: (1) install `pg` and create the Postgres `DbProvider`, (2) define the `UniverseRepository` port and build the in-memory adapter, (3) build the Postgres adapter, (4) wire up REST CRUD routes for universes, and (5) activate Postgres in Docker Compose with an init SQL script. Each task is independently verifiable and keeps the API bootable throughout.

## Repo Snapshot Used

- `apps/api/src/` — current API structure (server.ts, app.ts, config/env.ts, infra/db/, routes/health.ts)
- `apps/api/package.json` — current deps (express, tsx, typescript)
- `apps/api/tsconfig.json` — extends `tsconfig.base.json`
- `compose.yaml` — has commented-out Postgres service
- `apps/web/src/domain/universe/state.ts` — `UniverseState` shape (reference only, not modified)
- `apps/web/src/app/ports/systemRepository.ts` — existing port pattern (reference only)
- `apps/web/src/types.ts` — domain types (reference only, not modified)

## Assumptions

- PostgreSQL 16 is the target version (matches existing compose.yaml comment).
- `pg` (node-postgres) is the driver; no ORM or query builder at this stage.
- The `universes` table stores state as a JSONB column; no schema validation at the DB level.
- The in-memory adapter is for quick local dev and future tests; it is not production-grade.
- The API defines its own minimal types for the persisted universe shape; no shared package yet.
- No migration framework — raw idempotent SQL script for table creation.

## Risks / Unknowns

- **JSONB size**: very large universes (millions of stars) may stress JSONB column performance. Acceptable risk for now; indexing and pagination can follow.
- **No auth on routes**: universe CRUD is wide open. Fine for local dev; auth is a later concern.
- **Type drift**: API-side universe types may diverge from frontend types until a shared package is introduced. Mitigated by keeping the API types minimal and documented.

## Out of Scope

- Frontend modifications, shared `packages/` domain extraction.
- WebSocket / real-time push infrastructure.
- MCP server / tool integration.
- Database migrations framework.
- Authentication / authorization.
- Command event-sourcing implementation (table is prepared but not populated by routes).

---

## Task List (ordered)

### Task 1: Install `pg` and Create Postgres `DbProvider`

**Goal**: Add the `pg` dependency, create a `postgresProvider` implementing the existing `DbProvider` interface, and register it in the provider factory.

**Scope**: Only the DB connection layer. No repository, no routes.

**Dependencies**: None (first task).

**Files to create/update**:
- `apps/api/package.json` (add `pg`, `@types/pg`)
- `apps/api/src/infra/db/postgresProvider.ts` (new)
- `apps/api/src/infra/db/index.ts` (register new provider)

**Acceptance criteria**:
- `postgresProvider.ts` exports `createPostgresProvider(databaseUrl: string): DbProvider`.
- `connect()` creates a `pg.Pool`, runs `SELECT 1` to verify.
- `disconnect()` calls `pool.end()`.
- `ping()` runs `SELECT 1` and returns boolean.
- `createDbProvider(env)` returns the Postgres provider when `DB_PROVIDER=postgres`.
- `DB_PROVIDER=noop` still works unchanged.
- `npm run build` and `npm run typecheck` pass.

**Verification**:
```bash
npm run build --workspace=apps/api
npm run typecheck --workspace=apps/api
```

---

### Task 2: Define `UniverseRepository` Port and In-Memory Adapter

**Goal**: Define the persistence interface for universe CRUD and provide a lightweight in-memory implementation.

**Scope**: Port interface + in-memory adapter. No Postgres wiring, no routes.

**Dependencies**: None (independent of Task 1, but conceptually follows it).

**Files to create/update**:
- `apps/api/src/app/ports/universeRepository.ts` (new)
- `apps/api/src/infra/persistence/inMemoryUniverseRepository.ts` (new)

**Acceptance criteria**:
- `UniverseRepository` interface has methods: `create(input) → PersistedUniverse`, `getById(id) → PersistedUniverse | null`, `list() → PersistedUniverse[]`, `update(id, patch) → PersistedUniverse | null`, `delete(id) → boolean`.
- `PersistedUniverse` type has: `id` (UUID string), `name` (string), `state` (generic JSON-safe object), `createdAt` (Date), `updatedAt` (Date).
- In-memory adapter stores data in a `Map<string, PersistedUniverse>` and passes all contract methods.
- `npm run build` and `npm run typecheck` pass.

**Verification**:
```bash
npm run build --workspace=apps/api
npm run typecheck --workspace=apps/api
```

---

### Task 3: Postgres `UniverseRepository` Adapter

**Goal**: Implement the `UniverseRepository` interface backed by PostgreSQL using `pg` and JSONB.

**Scope**: Postgres adapter only. No routes, no Docker changes.

**Dependencies**: Task 1 (Postgres provider for pool access), Task 2 (port interface).

**Files to create/update**:
- `apps/api/src/infra/persistence/postgresUniverseRepository.ts` (new)

**Acceptance criteria**:
- Constructor takes a `pg.Pool` instance.
- `create()` inserts into `universes` table, returns the created record with DB-generated UUID and timestamps.
- `getById()` selects by `id`, returns `PersistedUniverse` or `null`.
- `list()` returns all universes ordered by `created_at DESC`.
- `update()` patches `name` and/or `state`, updates `updated_at`, returns the updated record.
- `delete()` deletes by `id`, returns `true` if a row was deleted.
- All queries use parameterized statements (no SQL injection risk).
- `npm run build` and `npm run typecheck` pass.

**Verification**:
```bash
npm run build --workspace=apps/api
npm run typecheck --workspace=apps/api
```

---

### Task 4: Universe CRUD REST Routes

**Goal**: Expose REST endpoints for universe persistence, wired through the repository port.

**Scope**: Routes + app wiring. The routes use the repository interface (DI), not a concrete adapter directly.

**Dependencies**: Task 2 (port interface; in-memory adapter for immediate use).

**Files to create/update**:
- `apps/api/src/routes/universes.ts` (new)
- `apps/api/src/app.ts` (mount universe routes)
- `apps/api/src/server.ts` (pass repository instance to app)
- `apps/api/src/infra/db/index.ts` (or a new factory — wire Postgres adapter when provider is postgres)

**Acceptance criteria**:
- `POST /universes` — creates a universe (body: `{ name, state }`), returns `201` with the created record.
- `GET /universes` — lists all universes, returns `200` with array.
- `GET /universes/:id` — returns `200` with the universe or `404`.
- `PUT /universes/:id` — updates name/state, returns `200` with updated record or `404`.
- `DELETE /universes/:id` — returns `204` on success, `404` if not found.
- Routes accept and return JSON with proper status codes.
- `createApp` receives a `UniverseRepository` instance (dependency injection).
- When `DB_PROVIDER=noop`, the in-memory adapter is used (universe routes still work, data lost on restart).
- When `DB_PROVIDER=postgres`, the Postgres adapter is used.
- `npm run build` and `npm run typecheck` pass.

**Verification**:
```bash
npm run build --workspace=apps/api
npm run typecheck --workspace=apps/api

# Manual smoke test (noop mode)
DB_PROVIDER=noop npm run dev --workspace=apps/api &
curl http://localhost:3001/health
curl -X POST http://localhost:3001/universes -H 'Content-Type: application/json' -d '{"name":"Test Universe","state":{"stars":{}}}'
curl http://localhost:3001/universes
kill %1
```

---

### Task 5: Docker Compose Postgres Service and SQL Init Script

**Goal**: Activate the Postgres container in `compose.yaml`, provide an idempotent SQL init script, and wire the API service environment for `DB_PROVIDER=postgres`.

**Scope**: Docker/infra configuration only. No API code changes.

**Dependencies**: Tasks 1-4 (all code is in place; this task provides the runtime environment).

**Files to create/update**:
- `compose.yaml` (uncomment/configure Postgres service, wire API env vars)
- `apps/api/infra/sql/init.sql` (new — idempotent DDL)
- `docs/guides/LOCAL_DEV_DOCKER.md` (update with Postgres instructions)

**Acceptance criteria**:
- `compose.yaml` defines a `db` service (`postgres:16-alpine`) with health check, volume, and credentials.
- `compose.yaml` API service has `DB_PROVIDER=postgres`, `DATABASE_URL=postgresql://solar:solar@db:5432/solar_system`, and `depends_on: db`.
- `apps/api/infra/sql/init.sql` creates `universes` and `universe_commands` tables (idempotent).
- The Postgres `db` service mounts `init.sql` into the Docker entrypoint init directory.
- `docker compose up --build` starts both API and DB; `/health` reports DB connected.
- Universe CRUD routes work end-to-end through Docker.
- `LOCAL_DEV_DOCKER.md` is updated with relevant Postgres instructions.

**Verification**:
```bash
docker compose up --build -d
sleep 5
curl http://localhost:3001/health
curl -X POST http://localhost:3001/universes -H 'Content-Type: application/json' -d '{"name":"Docker Test","state":{"stars":{},"rootIds":[]}}'
curl http://localhost:3001/universes
docker compose down -v
```
