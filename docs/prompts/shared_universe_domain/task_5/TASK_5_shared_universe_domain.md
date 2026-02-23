# Task 5: Adapt API to Consume `@solar/domain`

## Objective

Wire the API application to import `UniverseState` and entity types from `@solar/domain`, replacing the generic `Record<string, unknown>` typing in the universe repository port, persistence adapters, and route handlers. This gives the API compile-time type safety for universe state without changing any runtime behavior.

## Context to Read First

- `packages/domain/src/index.ts` — shared package barrel (what's available).
- `apps/api/package.json` — add workspace dependency.
- `apps/api/tsconfig.json` — add project reference.
- `apps/api/src/app/ports/universeRepository.ts` — the port with `Record<string, unknown>`.
- `apps/api/src/infra/persistence/inMemoryUniverseRepository.ts` — in-memory adapter.
- `apps/api/src/infra/persistence/postgresUniverseRepository.ts` — Postgres adapter.
- `apps/api/src/routes/universes.ts` — route handlers that pass state through.

## Constraints

- **No behavioral changes** — the API endpoints must work identically. Only types are tightened.
- The route handlers currently accept `state` as a generic JSON object from `req.body`. The runtime validation (typeof checks) should remain, but the typed interface should accept `UniverseState`.
- For the Postgres adapter, `state` is stored as JSONB and auto-parsed back to an object by `pg`. The type annotation changes but the runtime serialization (`JSON.stringify`) stays.
- Do **not** add any new endpoints or modify request/response shapes.

## Steps

1. Update `apps/api/package.json`:
   - Add `"@solar/domain": "*"` to `"dependencies"`.

2. Update `apps/api/tsconfig.json`:
   - Add `{ "path": "../../packages/domain" }` to a new `"references"` array.

3. Update `apps/api/src/app/ports/universeRepository.ts`:
   - Add import: `import type { UniverseState } from '@solar/domain';`
   - Change `PersistedUniverse.state` from `Record<string, unknown>` to `UniverseState`.
   - Change `CreateUniverseInput.state` from `Record<string, unknown>` to `UniverseState`.
   - Change `UpdateUniverseInput.state` from `Record<string, unknown>` to `UniverseState`.
   - Update the JSDoc comment on `state` to remove the "Intentionally generic until a shared domain package provides the real type" note.

4. Update `apps/api/src/infra/persistence/postgresUniverseRepository.ts`:
   - The `UniverseRow` interface has `state: Record<string, unknown>` — change to `state: UniverseState`.
   - Add the import for `UniverseState`.
   - The `JSON.stringify(input.state)` call in `create` and `update` methods works the same since `UniverseState` is JSON-serializable.

5. Update `apps/api/src/infra/persistence/inMemoryUniverseRepository.ts`:
   - No type changes needed if it's already typed via the port interface. Verify it compiles.

6. Update `apps/api/src/routes/universes.ts`:
   - The route handlers take `req.body` and extract `state`. Currently the local type annotation is `Record<string, unknown>`.
   - Import `UniverseState` from `@solar/domain`.
   - In the POST handler: after the runtime validation passes, cast/annotate `state` as `UniverseState` when passing to `repo.create()`.
   - In the PUT handler: same treatment for the `state` field in the update input.
   - **Note**: Since `req.body` is `any`, the runtime checks remain the real validation. The type annotation is for downstream type safety.

7. Run `npm install` from root to link the workspace dependency.

8. Build and typecheck.

## Files to Create/Update

| File | Action |
|------|--------|
| `apps/api/package.json` | Update |
| `apps/api/tsconfig.json` | Update |
| `apps/api/src/app/ports/universeRepository.ts` | Update |
| `apps/api/src/infra/persistence/postgresUniverseRepository.ts` | Update |
| `apps/api/src/infra/persistence/inMemoryUniverseRepository.ts` | Verify (may not need changes) |
| `apps/api/src/routes/universes.ts` | Update |

## Acceptance Criteria

- [ ] `apps/api/package.json` lists `"@solar/domain": "*"` as a dependency.
- [ ] `apps/api/tsconfig.json` has a project reference to `packages/domain`.
- [ ] `PersistedUniverse.state` is typed as `UniverseState` (not `Record<string, unknown>`).
- [ ] `CreateUniverseInput.state` is typed as `UniverseState`.
- [ ] `UpdateUniverseInput.state` is typed as `UniverseState`.
- [ ] The Postgres adapter's `UniverseRow.state` is typed as `UniverseState`.
- [ ] All runtime validation in route handlers is preserved unchanged.
- [ ] `npm run build:api` passes with zero errors.
- [ ] `npm run typecheck:api` passes with zero errors.
- [ ] API runtime behavior is unchanged (same request/response shapes).

## Verification

```bash
npm install
npm run build:api
npm run typecheck:api
```

## Notes

- The `state` field comes from `req.body` which is typed as `any` by Express. The runtime `typeof` checks in the route handlers are the real guard. The `UniverseState` type annotation on the port interfaces ensures that once the value passes validation, all downstream code (persistence, response) treats it as properly typed.
- In the future, you may want to add a runtime schema validator (e.g., Zod) that narrows `unknown` → `UniverseState`, but that's out of scope for this task.
- The Postgres adapter stores state as `JSON.stringify(input.state)`. Since `UniverseState` is JSON-serializable by design (no `Date`, no `Map`, no functions), this remains safe.
