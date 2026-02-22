# Task 1: Install `pg` and Create Postgres DbProvider

## Objective

Add the `pg` (node-postgres) dependency to the API package and implement a `postgresProvider` that satisfies the existing `DbProvider` interface. Register it in the provider factory so `DB_PROVIDER=postgres` activates it. The existing `noop` provider must remain fully functional.

## Context to Read First

- `apps/api/package.json` — current dependencies
- `apps/api/src/infra/db/types.ts` — the `DbProvider` interface
- `apps/api/src/infra/db/noopProvider.ts` — reference implementation (pattern to follow)
- `apps/api/src/infra/db/index.ts` — provider factory (where to register the new provider)
- `apps/api/src/config/env.ts` — `AppEnv` type (where `DB_PROVIDER` and `DATABASE_URL` are read)

## Constraints

- Do **not** create any repository, route, or domain type.
- Do **not** modify `apps/web/` or any other workspace.
- Use the `pg` package (not `pg-pool` separately — `pg` exports `Pool`).
- The Postgres provider must **not** crash if the DB is unreachable at startup — `connect()` should throw a clear error, and `ping()` should return `false`.
- Keep `DB_PROVIDER=noop` working exactly as before.

## Steps

1. **Install dependencies**:
   - Add `pg` to `dependencies` in `apps/api/package.json`.
   - Add `@types/pg` to `devDependencies`.

2. **Create `apps/api/src/infra/db/postgresProvider.ts`**:
   - Export a factory function: `createPostgresProvider(databaseUrl: string): DbProvider`.
   - Inside, create a `pg.Pool` with the connection string.
   - `connect()`: Acquire a client from the pool, run `SELECT 1`, release the client. Log success. If it fails, re-throw with a clear message.
   - `disconnect()`: Call `pool.end()`. Log disconnection.
   - `ping()`: Try `pool.query('SELECT 1')`, return `true` on success, `false` on error. Do **not** throw.
   - Expose a `pool` getter (or return it as part of the provider object) so later tasks can access the pool for repositories. A simple approach: add a `getPool(): Pool` method to the returned object (as an extension beyond `DbProvider`).

3. **Update `apps/api/src/infra/db/index.ts`**:
   - Import `createPostgresProvider`.
   - Add a `case 'postgres':` branch that calls `createPostgresProvider(env.DATABASE_URL!)`. Assert/throw if `DATABASE_URL` is missing.
   - Export a `PostgresDbProvider` type (the return type of `createPostgresProvider`) for downstream use.

4. **Verify the `noop` path still works** — no changes to `noopProvider.ts` or `types.ts`.

## Files to Create/Update

| Action | Path |
|--------|------|
| Update | `apps/api/package.json` |
| Create | `apps/api/src/infra/db/postgresProvider.ts` |
| Update | `apps/api/src/infra/db/index.ts` |

## Acceptance Criteria

- [ ] `apps/api/package.json` lists `pg` in `dependencies` and `@types/pg` in `devDependencies`.
- [ ] `postgresProvider.ts` exports `createPostgresProvider(databaseUrl: string)` returning a `DbProvider`-compatible object.
- [ ] `connect()` runs `SELECT 1` to verify the connection; throws on failure.
- [ ] `disconnect()` calls `pool.end()`.
- [ ] `ping()` returns `true`/`false` without throwing.
- [ ] The provider object exposes a `getPool(): Pool` method for downstream consumers.
- [ ] `createDbProvider(env)` returns the Postgres provider when `env.DB_PROVIDER === 'postgres'`.
- [ ] `createDbProvider(env)` throws if `DB_PROVIDER=postgres` but `DATABASE_URL` is undefined.
- [ ] `DB_PROVIDER=noop` still works unchanged.
- [ ] `npm run build --workspace=apps/api` passes.
- [ ] `npm run typecheck --workspace=apps/api` passes.

## Verification

```bash
cd /home/adr/front-portfolio-interactive/solar-system-constructor
npm install --workspace=apps/api
npm run build --workspace=apps/api
npm run typecheck --workspace=apps/api
```

## Notes

- The `getPool()` method is not part of the `DbProvider` interface. It is an implementation detail of the Postgres provider, exposed via a wider return type (`PostgresDbProvider`). Task 3 will use it to construct the Postgres repository adapter.
- No need to create the actual database or tables yet — that is Task 5.
