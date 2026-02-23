# Task 4: Adapt Web App to Consume `@solar/domain`

## Objective

Wire the web application to import universe types and domain logic from `@solar/domain` instead of local files. Convert local files to thin re-export shims so that existing consumers (generation domain, state store, components) continue to work without import path changes.

## Context to Read First

- `packages/domain/src/index.ts` — shared package barrel (from Tasks 2-3).
- `apps/web/package.json` — add workspace dependency.
- `apps/web/tsconfig.json` — add project reference.
- `apps/web/src/types.ts` — will become a re-export shim.
- `apps/web/src/domain/index.ts` — domain barrel to update.
- `apps/web/src/domain/universe/state.ts` — will become a re-export shim.
- `apps/web/src/domain/universe/commands.ts` — will become a re-export shim.
- `apps/web/src/domain/universe/applyCommand.ts` — will become a re-export shim.
- `apps/web/src/domain/universe/validate.ts` — will become a re-export shim.
- `apps/web/src/domain/generation/types.ts` — imports from `../../types` (must still work).
- `apps/web/src/domain/generation/proceduralGenerator.ts` — imports value types from `../../types`.
- `apps/web/src/state/systemStore.ts` — imports from `../domain/universe/*` directly.

## Constraints

- **Do NOT modify** any file under `apps/web/src/domain/generation/` — the generation domain must keep working transparently via the re-export shims.
- **Do NOT modify** consumer files (components, state, utils) — they import from `../../types` or `../domain/...` which will be served by the shims.
- **Do NOT delete** the original universe files — convert them to re-export shims.
- The web app must build and typecheck identically after this task.

## Steps

1. Update `apps/web/package.json`:
   - Add `"@solar/domain": "*"` to `"dependencies"`.

2. Update `apps/web/tsconfig.json`:
   - Add `{ "path": "../../packages/domain" }` to the `"references"` array (create the array if it only has the node config reference).

3. Convert `apps/web/src/types.ts` to a re-export shim:
   - Replace the entire file contents with re-exports from `@solar/domain`:
     ```typescript
     /**
      * Entity types — re-exported from @solar/domain.
      *
      * This file exists as a shim so that existing relative imports
      * throughout the web app continue to work unchanged.
      */
     export type {
       Star, PlanetaryRing, CometMeta, LagrangePointMeta,
       BlackHoleProperties, RoguePlanetMeta, AsteroidBelt,
       SmallBodyBelt, Position, Group, GroupChild, NestingLevel,
       ProtoplanetaryDisk, SmallBodyField, NebulaRegion,
     } from '@solar/domain';
     ```
   - **Important**: Some consumers use `import { Star, ... }` (value-style imports for use in type contexts) — ensure we use `export { ... }` not just `export type { ... }` if any value re-exports are needed. Since all items are pure interfaces/types, `export type` is correct.
   - **Check**: `apps/web/src/domain/generation/proceduralGenerator.ts` imports `Star` etc. as values (non-`type` import). This works with `export type` in `isolatedModules` mode because the consumer file only uses them as types despite the value-style import syntax. If there's a build issue, switch to `export { type Star, type PlanetaryRing, ... }` syntax.

4. Convert `apps/web/src/domain/universe/state.ts` to a re-export shim:
   ```typescript
   export type { UniverseState } from '@solar/domain';
   export { emptyUniverseState } from '@solar/domain';
   ```

5. Convert `apps/web/src/domain/universe/commands.ts` to a re-export shim:
   ```typescript
   export type {
     UniverseCommand, TickCommand, AddStarCommand, UpdateStarCommand,
     RemoveStarCommand, AttachStarCommand, DetachStarCommand,
     AddGroupCommand, UpdateGroupCommand, RemoveGroupCommand,
     AddToGroupCommand, RemoveFromGroupCommand, MoveToGroupCommand,
     SetSmallBodyFieldsCommand, UpdateSmallBodyFieldCommand,
     RemoveSmallBodyFieldCommand, SetProtoplanetaryDisksCommand,
     AddProtoplanetaryDiskCommand, UpdateProtoplanetaryDiskCommand,
     RemoveProtoplanetaryDiskCommand, SetNebulaeCommand,
     UpdateNebulaCommand, RemoveNebulaCommand, UpdateRingCommand,
     RemoveRingCommand, ReplaceSnapshotCommand, DomainEvent,
   } from '@solar/domain';
   ```

6. Convert `apps/web/src/domain/universe/applyCommand.ts` to a re-export shim:
   ```typescript
   export type { CommandResult } from '@solar/domain';
   export { applyUniverseCommand } from '@solar/domain';
   ```

7. Convert `apps/web/src/domain/universe/validate.ts` to a re-export shim:
   ```typescript
   export {
     wouldCreateStarCycle,
     collectDescendants,
     starExists,
     wouldCreateGroupCycle,
   } from '@solar/domain';
   ```

8. Update `apps/web/src/domain/index.ts`:
   - The barrel can now re-export directly from `@solar/domain` for the universe portion:
     ```typescript
     // Universe domain — from shared package
     export type { UniverseState } from '@solar/domain';
     export { emptyUniverseState } from '@solar/domain';
     export type { UniverseCommand, /* ...all command types... */ DomainEvent } from '@solar/domain';
     export type { CommandResult } from '@solar/domain';
     export { applyUniverseCommand } from '@solar/domain';
     export { wouldCreateStarCycle, collectDescendants, starExists, wouldCreateGroupCycle } from '@solar/domain';

     // Generation types (still local)
     export type { GenerationConfig, GeneratedUniverse } from './generation';
     ```
   - Alternatively, keep re-exporting from the local shims (`./universe/...`) for less churn. Either approach is acceptable.

9. Run `npm install` from root to link the workspace dependency.

10. Build and typecheck.

## Files to Create/Update

| File | Action |
|------|--------|
| `apps/web/package.json` | Update |
| `apps/web/tsconfig.json` | Update |
| `apps/web/src/types.ts` | Replace with re-export shim |
| `apps/web/src/domain/index.ts` | Update |
| `apps/web/src/domain/universe/state.ts` | Replace with re-export shim |
| `apps/web/src/domain/universe/commands.ts` | Replace with re-export shim |
| `apps/web/src/domain/universe/applyCommand.ts` | Replace with re-export shim |
| `apps/web/src/domain/universe/validate.ts` | Replace with re-export shim |

## Acceptance Criteria

- [ ] `apps/web/package.json` lists `"@solar/domain": "*"` as a dependency.
- [ ] `apps/web/tsconfig.json` has a project reference to `packages/domain`.
- [ ] `apps/web/src/types.ts` is a re-export shim (no local type definitions).
- [ ] All 4 universe domain files are re-export shims.
- [ ] No files under `apps/web/src/domain/generation/` are modified.
- [ ] No component, state, or utility files are modified.
- [ ] `npm run build:web` passes with zero errors.
- [ ] `npm run typecheck:web` passes with zero errors.
- [ ] The web app runs identically (manual check via `npm run dev:web` if desired).

## Verification

```bash
npm install
npm run build:web
npm run typecheck:web
```

## Notes

- The key insight is that `apps/web/src/types.ts` acts as an import façade. Since generation domain files import from `../../types` (which resolves to `apps/web/src/types.ts`), converting that file to a re-export means generation code works without modification.
- Similarly, `apps/web/src/state/systemStore.ts` imports from `../domain/universe/applyCommand` etc. — the shims make this transparent.
- If Vite has issues resolving `@solar/domain`, check that `apps/web/tsconfig.json` has the project reference and that `npm install` linked the workspace package.
