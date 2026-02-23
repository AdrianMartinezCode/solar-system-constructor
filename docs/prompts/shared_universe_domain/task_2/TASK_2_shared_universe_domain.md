# Task 2: Extract Entity Types to `@solar/domain`

## Objective

Copy all universe entity type interfaces from `apps/web/src/types.ts` into `packages/domain/src/types.ts` and export them from the package barrel. This establishes the shared type vocabulary that both apps will reference.

## Context to Read First

- `apps/web/src/types.ts` — source of all entity interfaces (the complete file).
- `packages/domain/src/index.ts` — current barrel (empty from Task 1).
- `packages/domain/tsconfig.json` — ensure it compiles.

## Constraints

- **Copy, don't move yet** — `apps/web/src/types.ts` stays untouched in this task. Task 4 will convert it to a re-export shim.
- Do **not** modify any files under `apps/web/` or `apps/api/`.
- Only extract types that are part of the universe entity model. If there are any React/UI-specific types in the file, leave them out.
- The types file must be **self-contained** — no imports from outside the package.

## Steps

1. Create `packages/domain/src/types.ts`:
   - Copy all interfaces and type aliases from `apps/web/src/types.ts`:
     - `Star`
     - `PlanetaryRing`
     - `CometMeta`
     - `LagrangePointMeta`
     - `BlackHoleProperties`
     - `RoguePlanetMeta`
     - `AsteroidBelt`
     - `SmallBodyBelt` (type alias for `AsteroidBelt`)
     - `Position`
     - `Group`
     - `GroupChild`
     - `NestingLevel`
     - `ProtoplanetaryDisk`
     - `SmallBodyField`
     - `NebulaRegion`
   - Preserve all JSDoc comments and field documentation.
   - Ensure no external imports — all types must be self-referencing within this file.

2. Update `packages/domain/src/index.ts`:
   - Re-export all types from `./types`:
     ```typescript
     export type {
       Star, PlanetaryRing, CometMeta, LagrangePointMeta,
       BlackHoleProperties, RoguePlanetMeta, AsteroidBelt,
       SmallBodyBelt, Position, Group, GroupChild, NestingLevel,
       ProtoplanetaryDisk, SmallBodyField, NebulaRegion,
     } from './types';
     ```

3. Verify the package compiles.

## Files to Create/Update

| File | Action |
|------|--------|
| `packages/domain/src/types.ts` | Create |
| `packages/domain/src/index.ts` | Update |

## Acceptance Criteria

- [ ] `packages/domain/src/types.ts` contains all 16 entity type interfaces/aliases listed above.
- [ ] All types are self-contained (no imports from outside the package).
- [ ] All JSDoc comments are preserved from the original.
- [ ] `packages/domain/src/index.ts` re-exports all types.
- [ ] `npx tsc -p packages/domain/tsconfig.json --noEmit` passes with zero errors.
- [ ] No files under `apps/` are modified.

## Verification

```bash
npx tsc -p packages/domain/tsconfig.json --noEmit
```

## Notes

- `NestingLevel` is a simple type alias (`number | 'max'`). Even though it's more of a UI concept, it lives in the same file and is exported alongside the other types. Include it for completeness.
- `SmallBodyBelt` is a type alias for `AsteroidBelt` — preserve this alias.
- The `Star` interface references `PlanetaryRing`, `CometMeta`, `LagrangePointMeta`, `BlackHoleProperties`, `RoguePlanetMeta` — all must be in the same file for self-containment.
