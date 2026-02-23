# PLAN: Shared Universe Domain Package

**Change Request**: `docs/requests/CR_shared_universe_domain.md`
**Date**: 2026-02-23
**Size**: Medium (5 tasks)
**Type**: Infrastructure / Refactor
**Risk**: Medium — foundational change touching both apps, but no behavioral changes

---

## Summary

Extract universe entity types and domain logic from `apps/web/` into `packages/domain/` (`@solar/domain`), then wire both `apps/web/` and `apps/api/` to consume it. The generative domain remains in the web app.

## Assumptions

1. The root `package.json` already declares `"packages/*"` as a workspace — no npm config changes needed.
2. Both apps use `tsconfig.base.json` with `"moduleResolution": "bundler"` — the shared package can use TypeScript source exports (no pre-compilation step needed for dev; `tsc` build for API dist).
3. All entity types in `apps/web/src/types.ts` belong together (they form a connected type graph via references like `Star → PlanetaryRing`, `Star → CometMeta`, etc.).
4. The `apps/web/src/types.ts` file contains **only** entity types (no React/UI types mixed in).

## Risks / Unknowns

| Risk | Mitigation |
|------|-----------|
| API's `tsx watch` may not resolve workspace package TS sources | Use `exports` field in package.json pointing to `.ts` source; fallback: add a lightweight `tsc --watch` build step |
| Circular dependency if generation types are later extracted | Keeping generation domain in web for now avoids this; future extraction will be a separate CR |
| Large number of import rewrites in web | Web's `types.ts` becomes a re-export shim, so most consumers don't need changes |

## Out of Scope

- Generation domain (`apps/web/src/domain/generation/`).
- Adding tests or a test runner.
- Changing API endpoint behavior.
- Any UI/component changes.

---

## Task List (ordered)

### Task 1: Bootstrap `@solar/domain` Package

**Goal**: Create the `packages/domain/` package skeleton with build tooling and wire it into the monorepo.

**Dependencies**: None (first task).

**Files to create/update**:
- `packages/domain/package.json` (create)
- `packages/domain/tsconfig.json` (create)
- `packages/domain/src/index.ts` (create — empty barrel)
- `tsconfig.json` (root — add project reference)

**Acceptance criteria**:
- `packages/domain/` exists with valid `package.json` (name: `@solar/domain`).
- `tsconfig.json` extends base and compiles.
- Root `tsconfig.json` includes `packages/domain` in project references.
- `npm run build` from root does not regress.

**Verification**: `npx tsc -p packages/domain/tsconfig.json --noEmit`

---

### Task 2: Extract Entity Types to `@solar/domain`

**Goal**: Move all universe entity type interfaces from `apps/web/src/types.ts` into the shared package.

**Dependencies**: Task 1.

**Files to create/update**:
- `packages/domain/src/types.ts` (create — all entity interfaces)
- `packages/domain/src/index.ts` (update — re-export types)

**Acceptance criteria**:
- All entity interfaces (`Star`, `PlanetaryRing`, `CometMeta`, `LagrangePointMeta`, `BlackHoleProperties`, `RoguePlanetMeta`, `AsteroidBelt`, `SmallBodyBelt`, `Position`, `Group`, `GroupChild`, `NestingLevel`, `ProtoplanetaryDisk`, `SmallBodyField`, `NebulaRegion`) exist in `packages/domain/src/types.ts`.
- Package barrel exports all types.
- `npx tsc -p packages/domain/tsconfig.json --noEmit` passes.

**Verification**: `npx tsc -p packages/domain/tsconfig.json --noEmit`

---

### Task 3: Move Universe Domain Logic to `@solar/domain`

**Goal**: Move the four universe domain files (`state.ts`, `commands.ts`, `applyCommand.ts`, `validate.ts`) into the shared package, updating internal imports to use the package-local types.

**Dependencies**: Task 2.

**Files to create/update**:
- `packages/domain/src/universe/state.ts` (create)
- `packages/domain/src/universe/commands.ts` (create)
- `packages/domain/src/universe/applyCommand.ts` (create)
- `packages/domain/src/universe/validate.ts` (create)
- `packages/domain/src/index.ts` (update — re-export universe domain)

**Acceptance criteria**:
- All four universe domain files exist under `packages/domain/src/universe/`.
- Internal imports reference `../types` (package-local), not `../../types` (web-relative).
- All type signatures are identical to the originals.
- `npx tsc -p packages/domain/tsconfig.json --noEmit` passes.

**Verification**: `npx tsc -p packages/domain/tsconfig.json --noEmit`

---

### Task 4: Adapt Web App to Consume `@solar/domain`

**Goal**: Wire the web app to import universe types and domain logic from `@solar/domain` instead of local files, keeping the generation domain working unchanged.

**Dependencies**: Task 3.

**Files to create/update**:
- `apps/web/package.json` (update — add `@solar/domain` dependency)
- `apps/web/tsconfig.json` (update — add project reference)
- `apps/web/src/types.ts` (update — re-export from `@solar/domain`)
- `apps/web/src/domain/index.ts` (update — re-export universe from `@solar/domain`)
- `apps/web/src/domain/universe/state.ts` (update — re-export from `@solar/domain`)
- `apps/web/src/domain/universe/commands.ts` (update — re-export from `@solar/domain`)
- `apps/web/src/domain/universe/applyCommand.ts` (update — re-export from `@solar/domain`)
- `apps/web/src/domain/universe/validate.ts` (update — re-export from `@solar/domain`)

**Acceptance criteria**:
- `apps/web/src/types.ts` re-exports all entity types from `@solar/domain`.
- `apps/web/src/domain/universe/*` files re-export from `@solar/domain` (thin shims).
- `apps/web/src/domain/index.ts` barrel still exports the same public API.
- Generation domain files (`apps/web/src/domain/generation/*`) are **not modified**.
- `npm run build:web` passes.
- `npm run typecheck:web` passes.

**Verification**: `npm run build:web && npm run typecheck:web`

---

### Task 5: Adapt API to Consume `@solar/domain`

**Goal**: Wire the API to import `UniverseState` and entity types from `@solar/domain`, replacing the generic `Record<string, unknown>` typing.

**Dependencies**: Task 3.

**Files to create/update**:
- `apps/api/package.json` (update — add `@solar/domain` dependency)
- `apps/api/tsconfig.json` (update — add project reference)
- `apps/api/src/app/ports/universeRepository.ts` (update — typed `state` field)
- `apps/api/src/infra/persistence/inMemoryUniverseRepository.ts` (update if needed)
- `apps/api/src/infra/persistence/postgresUniverseRepository.ts` (update if needed)
- `apps/api/src/routes/universes.ts` (update — typed state in request handling)

**Acceptance criteria**:
- `PersistedUniverse.state` is typed as `UniverseState` (imported from `@solar/domain`).
- `CreateUniverseInput.state` and `UpdateUniverseInput.state` use `UniverseState`.
- Persistence adapters handle typed state correctly.
- `npm run build:api` passes.
- `npm run typecheck:api` passes.

**Verification**: `npm run build:api && npm run typecheck:api`

---

## Verification (full epic)

After all 5 tasks are complete:

```bash
npm run build        # builds both apps
npm run typecheck    # typechecks both apps
```

Both commands must pass with zero errors.
