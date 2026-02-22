# Task 4: Universe CRUD REST Routes

## Objective

Expose RESTful endpoints for universe persistence (`POST /universes`, `GET /universes`, `GET /universes/:id`, `PUT /universes/:id`, `DELETE /universes/:id`). Wire the routes through dependency injection so they use either the in-memory or Postgres repository based on the `DB_PROVIDER` environment variable.

## Context to Read First

- `apps/api/src/app/ports/universeRepository.ts` — the port interface (from Task 2)
- `apps/api/src/infra/persistence/inMemoryUniverseRepository.ts` — in-memory adapter (from Task 2)
- `apps/api/src/infra/persistence/postgresUniverseRepository.ts` — Postgres adapter (from Task 3)
- `apps/api/src/infra/db/postgresProvider.ts` — Postgres provider with `getPool()` (from Task 1)
- `apps/api/src/infra/db/index.ts` — provider factory
- `apps/api/src/routes/health.ts` — existing route pattern (reference for Express Router style)
- `apps/api/src/app.ts` — Express app creation (where to mount routes)
- `apps/api/src/server.ts` — server bootstrap (where DI happens)
- `apps/api/src/config/env.ts` — `AppEnv` type

## Constraints

- Do **not** modify any files in `apps/web/`.
- Do **not** add authentication or authorization.
- Routes must use the `UniverseRepository` interface, **not** a concrete adapter class.
- Minimal validation: reject missing `name` or `state` on creation; validate `id` is present on URL params.
- Error responses should be JSON `{ error: string }`.
- Keep the route file focused — business logic stays minimal (just call repository methods).

## Steps

1. **Create `apps/api/src/routes/universes.ts`**:
   - Export a factory function: `createUniverseRouter(repo: UniverseRepository): Router`.
   - The function creates an Express `Router` and defines:

   **POST `/universes`**:
   - Read `name` and `state` from `req.body`.
   - Validate that `name` is a non-empty string and `state` is a non-null object. Return `400` if invalid.
   - Call `repo.create({ name, state })`.
   - Return `201` with the created `PersistedUniverse`.

   **GET `/universes`**:
   - Call `repo.list()`.
   - Return `200` with the array.

   **GET `/universes/:id`**:
   - Call `repo.getById(req.params.id)`.
   - Return `200` with the universe, or `404 { error: "Universe not found" }`.

   **PUT `/universes/:id`**:
   - Read `name` and/or `state` from `req.body`.
   - Call `repo.update(req.params.id, { name, state })`.
   - Return `200` with the updated universe, or `404`.

   **DELETE `/universes/:id`**:
   - Call `repo.delete(req.params.id)`.
   - Return `204` (no content) on success, or `404`.

2. **Update `apps/api/src/app.ts`**:
   - Change `createApp` signature to accept a `UniverseRepository` parameter: `createApp(universeRepo: UniverseRepository)`.
   - Import and mount the universe router: `app.use(createUniverseRouter(universeRepo))`.
   - Keep the existing health router mounted.

3. **Update `apps/api/src/server.ts`**:
   - After creating the `db` provider, determine the repository:
     - If `db.name === 'postgres'` (or check `env.DB_PROVIDER`), import `createPostgresUniverseRepository` and create it with the Postgres pool.
     - Otherwise, import `createInMemoryUniverseRepository` and use the in-memory adapter.
   - Pass the repository to `createApp(repo)`.
   - The pool access pattern: if the provider is the Postgres one, access `(db as PostgresDbProvider).getPool()`.

4. **Serialize dates in responses**:
   - `PersistedUniverse` has `Date` objects. Express `res.json()` auto-serializes them to ISO strings. No special handling needed, but be aware of this for consumers.

## Files to Create/Update

| Action | Path |
|--------|------|
| Create | `apps/api/src/routes/universes.ts` |
| Update | `apps/api/src/app.ts` |
| Update | `apps/api/src/server.ts` |

## Acceptance Criteria

- [ ] `POST /universes` with valid body returns `201` and the created universe.
- [ ] `POST /universes` with missing `name` or `state` returns `400`.
- [ ] `GET /universes` returns `200` with an array of universes.
- [ ] `GET /universes/:id` returns `200` with the universe or `404`.
- [ ] `PUT /universes/:id` returns `200` with the updated universe or `404`.
- [ ] `DELETE /universes/:id` returns `204` on success or `404`.
- [ ] All routes use `UniverseRepository` interface (not a concrete adapter).
- [ ] `createApp` accepts a `UniverseRepository` parameter (DI).
- [ ] When `DB_PROVIDER=noop`, the in-memory adapter is used and routes work (data is ephemeral).
- [ ] When `DB_PROVIDER=postgres`, the Postgres adapter is used.
- [ ] `/health` route still works unchanged.
- [ ] `npm run build --workspace=apps/api` passes.
- [ ] `npm run typecheck --workspace=apps/api` passes.

## Verification

```bash
cd /home/adr/front-portfolio-interactive/solar-system-constructor
npm run build --workspace=apps/api
npm run typecheck --workspace=apps/api

# Smoke test with noop (no DB needed)
DB_PROVIDER=noop npx --workspace=apps/api tsx apps/api/src/server.ts &
sleep 2

# Health
curl -s http://localhost:3001/health | jq .

# Create
curl -s -X POST http://localhost:3001/universes \
  -H 'Content-Type: application/json' \
  -d '{"name":"Test Universe","state":{"stars":{},"rootIds":[]}}' | jq .

# List
curl -s http://localhost:3001/universes | jq .

# Get by ID (use ID from create response)
# curl -s http://localhost:3001/universes/<id> | jq .

# Update
# curl -s -X PUT http://localhost:3001/universes/<id> \
#   -H 'Content-Type: application/json' \
#   -d '{"name":"Updated Universe"}' | jq .

# Delete
# curl -s -X DELETE http://localhost:3001/universes/<id> -w "%{http_code}"

kill %1
```

## Notes

- The `createApp` signature change is a minor breaking change to the function API, but since no tests or external consumers exist yet, this is safe.
- The Postgres adapter import in `server.ts` can use a dynamic import or a simple conditional. Prefer static imports with a conditional branch for clarity.
- For `state` type coercion on JSONB writes: the `pg` driver handles `JSON.stringify` internally when the column type is JSONB. Passing a JS object directly also works.
- Error handling in routes: wrap handler bodies in try/catch; on unexpected errors, pass to Express's `next(err)` for the global error handler.
