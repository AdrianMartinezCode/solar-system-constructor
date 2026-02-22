# Task 3: Move procedural generator into domain

## Objective

Relocate the core L-system procedural generation engine (`src/utils/procedural-generator.ts`) into `src/domain/generation/proceduralGenerator.ts`. Update its internal imports to reference the topology module at its new domain location. Leave a backward-compatible re-export at the old location.

## Context to read first

- `docs/plans/PLAN_extract_generation_domain.md` (Task 3 section)
- `src/utils/procedural-generator.ts` (lines 1–10: imports, especially topology and prng paths)
- `src/domain/generation/topology/index.ts` (the topology module moved in Task 2)
- `src/utils/generatorBridge.ts` (lines 6–7: imports from `./procedural-generator`)
- `prng.ts` (project-root PRNG module — stays in place)

## Constraints

- **No imports** from React, `@react-three/fiber`, `three`, Zustand, or browser globals.
- The old import path `src/utils/procedural-generator` must still work (thin re-export).
- Do NOT modify the internal generation logic — pure relocation + import path updates.
- The `prng.ts` module stays at the project root; update the import path to `../../../prng` (or the correct relative path from the new location).

## Steps

1. Copy the entire content of `src/utils/procedural-generator.ts` into `src/domain/generation/proceduralGenerator.ts`.
2. Update imports in the new file:
   - Topology: change `import { ... } from './topology'` to `import { ... } from './topology'` (should work since topology is now `src/domain/generation/topology/`).
   - PRNG: change `import { createPRNG, PRNG } from '../../prng'` to the correct relative path from `src/domain/generation/` → `../../../prng`.
   - Types: change `import { ... } from '../types'` to `import { ... } from '../../types'`.
3. Replace `src/utils/procedural-generator.ts` with a thin re-export:
   ```ts
   // Backward-compat re-export — canonical location: src/domain/generation/proceduralGenerator.ts
   export * from '../../domain/generation/proceduralGenerator';
   export type { GeneratorConfig } from '../../domain/generation/proceduralGenerator';
   ```
4. Update `src/domain/generation/index.ts`:
   - Re-export `GeneratorConfig` type.
   - Re-export `generateSolarSystem` and `generateMultipleSystems` functions.

## Files to create/update

- Create:
  - `src/domain/generation/proceduralGenerator.ts`
- Update:
  - `src/utils/procedural-generator.ts` (thin re-export)
  - `src/domain/generation/index.ts` (add re-exports)

## Acceptance criteria

- `proceduralGenerator.ts` lives in `src/domain/generation/` and compiles cleanly.
- It imports topology from `./topology` (domain-local).
- It imports PRNG from `../../../prng` (or correct relative path).
- `GeneratorConfig` type and `generateSolarSystem`/`generateMultipleSystems` are exported from the domain generation barrel.
- `import { generateSolarSystem } from './procedural-generator'` in `src/utils/generatorBridge.ts` still works via re-export.
- No browser/React/Three/Zustand imports.
- `npm run typecheck` passes.
- `npm run build` passes.

## Verification

```bash
npm run typecheck
npm run build
```

## Notes

- This is the largest single file move (~3700 lines). Git may not track it as a rename — ensure the commit message notes `procedural-generator.ts → domain/generation/proceduralGenerator.ts`.
- The `GeneratorConfig` interface is defined inside this file. It's an internal detail but is referenced by the config mapper. After Task 4, the mapper will import it directly from domain.
- Verify the PRNG import path carefully — count the directory levels from `src/domain/generation/proceduralGenerator.ts` up to the project root `prng.ts`.
