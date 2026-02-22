# Task 5: Create generation orchestrator + stats in domain

## Objective

Extract the `generateUniverse()` orchestrator function and the stats computation logic from `src/utils/generatorBridge.ts` into dedicated domain files. This creates the top-level generation API that consumers will use. The bridge file becomes a thin backward-compat re-export.

## Context to read first

- `docs/plans/PLAN_extract_generation_domain.md` (Task 5 section)
- `src/utils/generatorBridge.ts` (the remaining content after Task 4: the `generateUniverse()` function, lines ~1174–1374, and the `getSmallBodyDetailLabel` re-export)
- `src/domain/generation/configMapper.ts` (moved in Task 4: `mapConfigToInternal`)
- `src/domain/generation/proceduralGenerator.ts` (moved in Task 3: `generateSolarSystem`, `generateMultipleSystems`)
- `src/domain/generation/types.ts` (moved in Task 1: `GenerationConfig`, `GeneratedUniverse`)

## Constraints

- **No imports** from React, `@react-three/fiber`, `three`, Zustand, or browser globals.
- The old import path `import { generateUniverse } from '../utils/generatorBridge'` must still work via re-export.
- Do NOT modify the generation behavior — same seed + config must produce identical output.
- Console.log statements in the orchestrator are acceptable for now (they use no browser-only APIs beyond console, which Node.js also provides). Optionally, they can be removed or made conditional.

## Steps

1. **Create `src/domain/generation/stats.ts`**:
   - Extract the stats computation logic from the `generateUniverse()` function in `generatorBridge.ts`.
   - Create a pure function, e.g.:
     ```ts
     export function computeGenerationStats(rawResult: { stars, rootIds, groups, rootGroupIds, belts, smallBodyFields, protoplanetaryDisks, nebulae }): GenerationStats
     ```
   - This function takes the raw generator output and computes all the stat fields (`totalStars`, `totalComets`, `totalBlackHoles`, `totalSmallBodyBelts`, etc.).
   - Define a `GenerationStats` type that captures all the stats fields currently embedded in `GeneratedUniverse`.
2. **Create `src/domain/generation/generateUniverse.ts`**:
   - Move the `generateUniverse(config: GenerationConfig): GeneratedUniverse` function.
   - It should:
     - Import `mapConfigToInternal` from `./configMapper`.
     - Import `generateSolarSystem`, `generateMultipleSystems` from `./proceduralGenerator`.
     - Import `computeGenerationStats` from `./stats`.
     - Call `mapConfigToInternal(config)`, then the generator, then `computeGenerationStats(rawResult)`, and assemble the `GeneratedUniverse` return value.
3. **Update `src/utils/generatorBridge.ts`**:
   - Replace the entire file with thin re-exports:
     ```ts
     // Backward-compat re-export — canonical location: src/domain/generation/
     export { generateUniverse } from '../../domain/generation/generateUniverse';
     export { getSmallBodyDetailLabel } from '../../domain/generation/configMapper';
     ```
4. **Update `src/domain/generation/index.ts`**:
   - Re-export `generateUniverse` from `./generateUniverse`.
   - Re-export `computeGenerationStats`, `GenerationStats` from `./stats`.

## Files to create/update

- Create:
  - `src/domain/generation/generateUniverse.ts`
  - `src/domain/generation/stats.ts`
- Update:
  - `src/utils/generatorBridge.ts` (thin re-export)
  - `src/domain/generation/index.ts` (add re-exports)

## Acceptance criteria

- `generateUniverse(config)` is a pure domain function in `src/domain/generation/generateUniverse.ts`.
- Stats computation is isolated in `src/domain/generation/stats.ts` with a clean function signature.
- `src/utils/generatorBridge.ts` is now a thin re-export file (< 10 lines).
- Domain barrel exports `generateUniverse`, `computeGenerationStats`, `GenerationStats`.
- `import { generateUniverse } from '../utils/generatorBridge'` still works for existing consumers.
- No browser/React/Three/Zustand imports in new domain files.
- `npm run typecheck` passes.
- `npm run build` passes.
- Same seed + config produces identical `GeneratedUniverse` output.

## Verification

```bash
npm run typecheck
npm run build
```

## Notes

- The `generateUniverse` function currently contains `console.log` statements for debugging. These are acceptable in domain code since `console` is available in both browser and Node.js. Optionally, you may replace them with event emissions or remove them entirely — but do NOT change behavior.
- The stats computation is ~150 lines of aggregation logic. Extracting it into `stats.ts` makes it independently testable and reusable.
- The `GeneratedUniverse` type already defined in `types.ts` includes the stats fields. The new `GenerationStats` type can be a subset/pick or a standalone interface — choose whichever is cleaner.
