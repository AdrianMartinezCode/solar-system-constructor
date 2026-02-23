# CR: Shared Universe Domain Package

## Summary

Extract the **universe domain** (entity types + state/commands/reducer/validation) from the web application (`apps/web/`) into a shared package (`packages/domain/`) so that both the **web** and **API** applications can use the same type-safe domain model. The generative domain (`apps/web/src/domain/generation/`) is explicitly **out of scope** for now.

## Motivation

Currently the API's `PersistedUniverse.state` field is typed as `Record<string, unknown>` — a deliberate placeholder that awaits a shared domain package. Sharing the universe domain types and logic will:

- Give the API **compile-time guarantees** that persisted state matches the real `UniverseState` shape.
- Enable future features (command execution on the backend, real-time sync, server-side validation) with zero type-mapping friction.
- Establish the `packages/` workspace pattern for any future shared code.

## Scope

### In scope

| Area | Detail |
|------|--------|
| **Entity types** | `Star`, `PlanetaryRing`, `CometMeta`, `LagrangePointMeta`, `BlackHoleProperties`, `RoguePlanetMeta`, `AsteroidBelt`, `SmallBodyBelt`, `Position`, `Group`, `GroupChild`, `NestingLevel`, `ProtoplanetaryDisk`, `SmallBodyField`, `NebulaRegion` — all from `apps/web/src/types.ts` |
| **Universe domain** | `state.ts` (`UniverseState`, `emptyUniverseState`), `commands.ts` (all command interfaces + `UniverseCommand` union + `DomainEvent`), `applyCommand.ts` (pure reducer + `CommandResult`), `validate.ts` (cycle checks, helpers) |
| **Package infra** | New `packages/domain/` with `package.json`, `tsconfig.json`, barrel exports |
| **Web app adaptation** | Re-wire imports so web continues to compile and run identically |
| **API adaptation** | Replace `Record<string, unknown>` with `UniverseState` across ports, persistence, and routes |

### Out of scope

- Generation domain (`apps/web/src/domain/generation/`).
- UI types (`NestingLevel` in UI context, store types, component props).
- Any behavioral changes to the API endpoints (logic stays the same, only types tighten).
- Test infrastructure (none configured yet).
- Linter configuration.

## Affected areas

| File / Directory | Change type |
|-----------------|-------------|
| `packages/domain/` (new) | Create — new shared package |
| `packages/README.md` | Update — document the new package |
| `tsconfig.json` (root) | Update — add project reference |
| `apps/web/package.json` | Update — add workspace dependency |
| `apps/web/tsconfig.json` | Update — add project reference |
| `apps/web/src/types.ts` | Update — re-export from shared package |
| `apps/web/src/domain/index.ts` | Update — re-export universe domain from shared |
| `apps/web/src/domain/universe/*` | Update — replace with re-exports or remove |
| `apps/api/package.json` | Update — add workspace dependency |
| `apps/api/tsconfig.json` | Update — add project reference |
| `apps/api/src/app/ports/universeRepository.ts` | Update — typed `state` field |
| `apps/api/src/infra/persistence/*` | Update — propagate typed state |
| `apps/api/src/routes/universes.ts` | Update — use typed state in request validation |

## Risks / Open Questions

1. **Web `types.ts` is a monolith** — it contains ALL entity types. We'll extract them all into the package since they form a cohesive type graph (e.g. `Star` references `PlanetaryRing`, `CometMeta`, etc.). The web file becomes a thin re-export shim.
2. **API `moduleResolution`** — API uses `tsconfig.base.json` with `"moduleResolution": "bundler"`. We need to ensure the shared package's exports are resolvable by both Vite (web) and `tsc`/`tsx` (API).
3. **Generation domain imports `../../types`** — After extraction, `apps/web/src/types.ts` will re-export from `@solar/domain`, so generation imports remain unchanged (transparent to generation code).

## Acceptance Criteria (epic-level)

- [ ] `packages/domain/` exists with its own `package.json` (`@solar/domain`) and `tsconfig.json`.
- [ ] All universe entity types compile from `@solar/domain`.
- [ ] Universe domain logic (`applyCommand`, `validate`, `state`, `commands`) compiles from `@solar/domain`.
- [ ] `npm run build:web` passes — web app works identically.
- [ ] `npm run build:api` passes — API compiles with typed `UniverseState`.
- [ ] `npm run typecheck` (root) passes for both apps.
- [ ] `PersistedUniverse.state` is typed as `UniverseState` (not `Record<string, unknown>`).
- [ ] Generation domain in web continues to compile without changes to its source files.
