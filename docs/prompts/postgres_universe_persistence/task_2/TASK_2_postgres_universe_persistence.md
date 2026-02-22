# Task 2: Define UniverseRepository Port and In-Memory Adapter

## Objective

Define a `UniverseRepository` interface (port) for universe CRUD operations on the API side, along with the `PersistedUniverse` data type. Implement an in-memory adapter backed by a `Map` for local development and future testing without requiring a running database.

## Context to Read First

- `apps/web/src/app/ports/systemRepository.ts` — existing frontend port pattern (reference for style/convention)
- `apps/web/src/domain/universe/state.ts` — `UniverseState` type (reference for understanding what `state` contains; **not** imported by the API)
- `apps/api/src/infra/db/noopProvider.ts` — pattern for adapter implementations
- `apps/api/src/infra/db/types.ts` — example of interface-first design in the API

## Constraints

- Do **not** import anything from `apps/web/`. The API defines its own types.
- Do **not** create any routes or modify `app.ts` / `server.ts`.
- Do **not** depend on `pg` or any database driver in this task.
- The `state` field in `PersistedUniverse` should be typed as `Record<string, unknown>` (generic JSON object). We do **not** replicate the frontend's `UniverseState` type yet — that happens when a shared package is introduced.
- UUID generation: use `crypto.randomUUID()` (Node 19+, available in the project's Node 21 target).

## Steps

1. **Create `apps/api/src/app/ports/universeRepository.ts`**:
   - Define `PersistedUniverse` interface:
     ```
     id: string          // UUID
     name: string        // Human-readable universe name
     state: Record<string, unknown>  // The universe state blob (JSONB-compatible)
     createdAt: Date
     updatedAt: Date
     ```
   - Define `CreateUniverseInput` type: `{ name: string; state: Record<string, unknown> }`.
   - Define `UpdateUniverseInput` type: `{ name?: string; state?: Record<string, unknown> }`.
   - Define `UniverseRepository` interface:
     ```
     create(input: CreateUniverseInput): Promise<PersistedUniverse>
     getById(id: string): Promise<PersistedUniverse | null>
     list(): Promise<PersistedUniverse[]>
     update(id: string, input: UpdateUniverseInput): Promise<PersistedUniverse | null>
     delete(id: string): Promise<boolean>
     ```

2. **Create directory `apps/api/src/infra/persistence/`** (if it doesn't exist).

3. **Create `apps/api/src/infra/persistence/inMemoryUniverseRepository.ts`**:
   - Export a factory: `createInMemoryUniverseRepository(): UniverseRepository`.
   - Internally use `new Map<string, PersistedUniverse>()`.
   - `create()`: Generate UUID via `crypto.randomUUID()`, set `createdAt` and `updatedAt` to `new Date()`, store and return.
   - `getById()`: Look up by key, return the value or `null`.
   - `list()`: Return `Array.from(map.values())` sorted by `createdAt` descending.
   - `update()`: Look up by key, merge the patch fields, update `updatedAt`, store and return. Return `null` if not found.
   - `delete()`: Call `map.delete(id)`, return the boolean result.

## Files to Create/Update

| Action | Path |
|--------|------|
| Create | `apps/api/src/app/ports/universeRepository.ts` |
| Create | `apps/api/src/infra/persistence/inMemoryUniverseRepository.ts` |

## Acceptance Criteria

- [ ] `UniverseRepository` interface is defined with all 5 methods (`create`, `getById`, `list`, `update`, `delete`).
- [ ] `PersistedUniverse`, `CreateUniverseInput`, and `UpdateUniverseInput` types are exported.
- [ ] In-memory adapter implements all 5 methods correctly.
- [ ] `create()` generates a UUID and returns a complete `PersistedUniverse`.
- [ ] `list()` returns universes sorted by `createdAt` descending.
- [ ] `update()` returns `null` for non-existent IDs.
- [ ] `delete()` returns `false` for non-existent IDs.
- [ ] No imports from `apps/web/` or from `pg`.
- [ ] `npm run build --workspace=apps/api` passes.
- [ ] `npm run typecheck --workspace=apps/api` passes.

## Verification

```bash
cd /home/adr/front-portfolio-interactive/solar-system-constructor
npm run build --workspace=apps/api
npm run typecheck --workspace=apps/api
```

## Notes

- The `Record<string, unknown>` type for `state` is intentionally loose. When a shared domain package is introduced later, this will be tightened to the actual `UniverseState` type.
- The in-memory adapter will be used in Task 4 as the default repository when `DB_PROVIDER=noop`.
- `crypto.randomUUID()` is stable in Node 19+. The project targets Node 21 (per Dockerfile).
