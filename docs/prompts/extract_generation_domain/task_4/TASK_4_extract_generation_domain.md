# Task 4: Move config defaults + config mapper into domain

## Objective

Relocate the generation config defaults (`defaultConfig`, `getPresetConfig`, `generateRandomSeed`) and the entire config mapping layer (all `map*` helper functions and `mapConfigToInternal`) from `src/utils/` into `src/domain/generation/`. These are pure domain logic that translates user-facing configuration into internal generator parameters.

## Context to read first

- `docs/plans/PLAN_extract_generation_domain.md` (Task 4 section)
- `src/utils/generatorConfigDefaults.ts` (full file: defaults + presets)
- `src/utils/generatorBridge.ts` (lines 1–220: imports + `mapConfigToInternal` + all `map*` helpers up to `mapConfigToInternal` return)
- `src/domain/generation/types.ts` (GenerationConfig type — moved in Task 1)
- `src/domain/generation/proceduralGenerator.ts` (GeneratorConfig type — moved in Task 3)

## Constraints

- **No imports** from React, `@react-three/fiber`, `three`, Zustand, or browser globals.
- The old import path `src/utils/generatorConfigDefaults` must still work (thin re-export).
- Do NOT move the `generateUniverse()` orchestrator function or stats computation yet — that's Task 5.
- Do NOT modify any mapping logic — pure relocation.

## Steps

1. **Create `src/domain/generation/configDefaults.ts`**:
   - Copy the entire content of `src/utils/generatorConfigDefaults.ts`.
   - Update the import path: `import type { GenerationConfig } from './types'` (instead of `../types/generationConfig`).
2. **Create `src/domain/generation/configMapper.ts`**:
   - Extract from `src/utils/generatorBridge.ts`:
     - The `SMALL_BODY_DETAIL_SCALES` constant.
     - The `mapConfigToInternal()` function.
     - ALL `map*` helper functions: `mapStarProbabilities`, `mapScaleMode`, `mapGroupCount`, `mapNestingProbability`, `mapEccentricityStyle`, `mapBeltDensityToCounts`, `mapCometFrequencyToCount`, `mapCometOrbitStyle`, `mapCometActivity`, `mapTrojanFrequencyToEnable`, `mapTrojanFrequencyToCountRange`, `mapTrojanRichnessToMassScaleAndVariation`, `mapKuiperDensityToCounts`, `mapKuiperDistanceStyle`, `mapKuiperInclination`, `mapRingProminence`, `mapRoguePlanetConfig`, `mapNebulaConfig`, `mapProtoplanetaryDiskConfig`, `mapBlackHoleConfig`.
     - The `getSmallBodyDetailLabel()` function.
   - Update imports to reference domain-local modules:
     - `import type { GenerationConfig } from './types'`
     - `import type { GeneratorConfig } from './proceduralGenerator'`
   - Export `mapConfigToInternal`, `getSmallBodyDetailLabel`, and `mapBlackHoleConfig` (this was already exported from the bridge).
3. **Update `src/utils/generatorConfigDefaults.ts`**:
   - Replace content with thin re-export:
     ```ts
     // Backward-compat re-export — canonical location: src/domain/generation/configDefaults.ts
     export { defaultConfig, getPresetConfig, generateRandomSeed } from '../../domain/generation/configDefaults';
     ```
4. **Update `src/utils/generatorBridge.ts`**:
   - Remove the moved functions and constants.
   - Import `mapConfigToInternal` and `getSmallBodyDetailLabel` from `../../domain/generation/configMapper`.
   - Keep only the `generateUniverse()` function and its stats computation (to be moved in Task 5).
5. **Update `src/domain/generation/index.ts`**:
   - Re-export: `defaultConfig`, `getPresetConfig`, `generateRandomSeed` from `./configDefaults`.
   - Re-export: `mapConfigToInternal`, `getSmallBodyDetailLabel` from `./configMapper`.

## Files to create/update

- Create:
  - `src/domain/generation/configDefaults.ts`
  - `src/domain/generation/configMapper.ts`
- Update:
  - `src/utils/generatorConfigDefaults.ts` (thin re-export)
  - `src/utils/generatorBridge.ts` (remove moved functions, add imports from domain)
  - `src/domain/generation/index.ts` (add re-exports)

## Acceptance criteria

- `defaultConfig`, `getPresetConfig`, `generateRandomSeed` live in `src/domain/generation/configDefaults.ts`.
- All `map*` functions and `SMALL_BODY_DETAIL_SCALES` live in `src/domain/generation/configMapper.ts`.
- `mapConfigToInternal`, `getSmallBodyDetailLabel` are exported from the domain generation barrel.
- Old import `src/utils/generatorConfigDefaults` still works via re-export.
- `src/utils/generatorBridge.ts` only contains the `generateUniverse()` orchestrator + stats (to be moved in Task 5).
- No browser/React/Three/Zustand imports in the new domain files.
- `npm run typecheck` passes.
- `npm run build` passes.

## Verification

```bash
npm run typecheck
npm run build
```

## Notes

- The config mapper is the largest extraction from `generatorBridge.ts` (~950 lines of mapping functions). The remaining bridge file should be ~430 lines (the `generateUniverse` orchestrator + stats computation).
- `mapBlackHoleConfig` was already `export function` in the bridge (it's used externally). Keep it exported from the mapper.
- The `SMALL_BODY_DETAIL_SCALES` constant is used by both `mapConfigToInternal` and `getSmallBodyDetailLabel`, so they must be in the same module (the mapper).
