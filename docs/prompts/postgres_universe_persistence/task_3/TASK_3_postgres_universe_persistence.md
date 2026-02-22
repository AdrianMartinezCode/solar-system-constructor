# Task 3: Postgres UniverseRepository Adapter

## Objective

Implement the `UniverseRepository` interface backed by PostgreSQL, using the `pg` pool from the Postgres `DbProvider` created in Task 1. All queries use parameterized statements against a `universes` table with a JSONB `state` column.

## Context to Read First

- `apps/api/src/app/ports/universeRepository.ts` — the port interface (from Task 2)
- `apps/api/src/infra/db/postgresProvider.ts` — the Postgres provider with `getPool()` (from Task 1)
- `apps/api/src/infra/persistence/inMemoryUniverseRepository.ts` — reference adapter (from Task 2)
- `apps/api/src/infra/db/types.ts` — `DbProvider` interface

## Constraints

- Do **not** create or modify routes, `app.ts`, or `server.ts`.
- Do **not** modify the `UniverseRepository` interface.
- Do **not** create the actual database table (that is Task 5's SQL init script).
- Use **only** parameterized queries (`$1`, `$2`, etc.) — no string interpolation in SQL.
- Import `Pool` type from `pg` — do not create a new pool; receive it via constructor.

## Steps

1. **Create `apps/api/src/infra/persistence/postgresUniverseRepository.ts`**:
   - Export a factory: `createPostgresUniverseRepository(pool: Pool): UniverseRepository`.
   - The factory captures the `pool` in a closure.

2. **Implement `create(input)`**:
   ```sql
   INSERT INTO universes (name, state)
   VALUES ($1, $2)
   RETURNING id, name, state, created_at, updated_at
   ```
   - `$1` = `input.name`, `$2` = `JSON.stringify(input.state)` (pg auto-handles JSONB from strings/objects).
   - Map the returned row to `PersistedUniverse` (convert `created_at`/`updated_at` to `Date`).

3. **Implement `getById(id)`**:
   ```sql
   SELECT id, name, state, created_at, updated_at
   FROM universes WHERE id = $1
   ```
   - Return `null` if `rows.length === 0`.

4. **Implement `list()`**:
   ```sql
   SELECT id, name, state, created_at, updated_at
   FROM universes ORDER BY created_at DESC
   ```
   - Map all rows to `PersistedUniverse[]`.

5. **Implement `update(id, input)`**:
   - Build a dynamic SET clause based on which fields are present in `input`.
   - Always set `updated_at = NOW()`.
   - Use `RETURNING` to get the updated row.
   - Return `null` if no row was updated.
   - Example approach:
     ```sql
     UPDATE universes
     SET name = COALESCE($2, name),
         state = COALESCE($3, state),
         updated_at = NOW()
     WHERE id = $1
     RETURNING id, name, state, created_at, updated_at
     ```
   - Pass `input.name ?? null` and `input.state ? JSON.stringify(input.state) : null` as parameters.

6. **Implement `delete(id)`**:
   ```sql
   DELETE FROM universes WHERE id = $1
   ```
   - Return `result.rowCount > 0`.

7. **Create a helper function `mapRow(row): PersistedUniverse`** to DRY up the row-to-type mapping:
   ```typescript
   function mapRow(row: any): PersistedUniverse {
     return {
       id: row.id,
       name: row.name,
       state: row.state, // pg auto-parses JSONB to object
       createdAt: new Date(row.created_at),
       updatedAt: new Date(row.updated_at),
     };
   }
   ```

## Files to Create/Update

| Action | Path |
|--------|------|
| Create | `apps/api/src/infra/persistence/postgresUniverseRepository.ts` |

## Acceptance Criteria

- [ ] `createPostgresUniverseRepository(pool)` returns a `UniverseRepository`-compatible object.
- [ ] `create()` inserts a row and returns the complete `PersistedUniverse` with DB-generated `id` and timestamps.
- [ ] `getById()` returns `PersistedUniverse` or `null`.
- [ ] `list()` returns all universes ordered by `created_at DESC`.
- [ ] `update()` patches only provided fields, updates `updated_at`, returns updated record or `null`.
- [ ] `delete()` returns `true` if a row was deleted, `false` otherwise.
- [ ] All queries use parameterized statements (no SQL injection).
- [ ] The `pg.Pool` is received via constructor, not created internally.
- [ ] `npm run build --workspace=apps/api` passes.
- [ ] `npm run typecheck --workspace=apps/api` passes.

## Verification

```bash
cd /home/adr/front-portfolio-interactive/solar-system-constructor
npm run build --workspace=apps/api
npm run typecheck --workspace=apps/api
```

## Notes

- The `state` column in Postgres will be JSONB. The `pg` driver automatically parses JSONB columns into JavaScript objects on read, and accepts objects/strings for JSONB on write. Keep this in mind when mapping rows.
- The `COALESCE` approach for `update()` means `null` values in the input mean "keep the existing value". If a caller explicitly wants to set `name` to empty string, they can pass `""`. This is acceptable for now.
- The actual table creation (`CREATE TABLE universes ...`) happens in Task 5.
- `rowCount` from `pg` can be `null` in some edge cases; use `(result.rowCount ?? 0) > 0` for safety.
