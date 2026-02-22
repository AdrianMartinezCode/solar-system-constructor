# Plan: Extract Generation Logic into Domain Layer

## Summary

This plan relocates all procedural universe generation logic from `src/utils/` and `src/types/` into `src/domain/generation/`, following the architectural pattern established by `src/domain/universe/`. The migration is incremental — each task moves one layer of the generation pipeline into domain, keeps backward-compatible re-exports, and ensures the build passes. No behavioral changes; same seed → same output.

## Repo snapshot used

| File / Directory | Purpose |
|---|---|
| `src/domain/` | Existing domain layer (universe commands/state/reducer) |
| `src/domain/index.ts` | Domain barrel export |
| `src/domain/universe/` | Established domain pattern to follow |
| `src/types/generationConfig.ts` | `GenerationConfig`, `GeneratedUniverse` types |
| `src/utils/generatorConfigDefaults.ts` | Config defaults + presets |
| `src/utils/generatorBridge.ts` | Config mapping + stats + orchestrator |
| `src/utils/procedural-generator.ts` | Core L-system generation engine |
| `src/utils/topology/` | Topology grammar presets + generators |
| `src/utils/stats/generationMetadataCache.ts` | Stats caching (consumer) |
| `src/components/UniverseGeneratorPanel.tsx` | UI panel (consumer) |
| `src/state/systemStore.ts` | Zustand store (consumer) |
| `prng.ts` | PRNG utility (shared, stays in place) |
| `src/types.ts` | Shared model types (stays in place) |

## Assumptions

- The generation pipeline is **already pure** (no browser/React/Three/Zustand imports) — this is a relocation, not a rewrite.
- Backward-compatible re-exports from old locations (`src/utils/generatorBridge.ts`, `src/types/generationConfig.ts`, etc.) will be maintained during migration and cleaned up in the final task.
- The `prng.ts` module at project root is a shared utility and stays where it is.
- The `src/types.ts` shared model types (Star, Group, etc.) stay in place; domain generation code imports them.

## Risks / unknowns

- **Import path depth**: `src/domain/generation/proceduralGenerator.ts` will have deeper relative imports to `../../types` and `../../prng`. This is manageable but requires careful path updates.
- **Circular dependency risk**: The `GeneratedUniverse` type references types from `src/types.ts`, and the domain index re-exports them. Keep the dependency direction one-way: domain → shared types (never types → domain).
- **Large file move** (`procedural-generator.ts` is ~3700 lines): Git may not track it as a rename. Commit message should note the move explicitly.

## Out of scope

- Internal refactoring of the procedural generator (splitting into smaller modules).
- Adding unit tests for generation.
- Building an MCP server adapter.
- Changes to `src/domain/universe/`.

## Task list (ordered)

### Task 1 — Create domain generation types + barrel skeleton

- **Goal**: Establish `src/domain/generation/` directory with type definitions and barrel export. Move `GenerationConfig` and `GeneratedUniverse` into domain.
- **Scope**: Types only; no behavioral code moves yet.
- **Dependencies**: None.
- **Files likely touched**:
  - `src/domain/generation/types.ts` (new)
  - `src/domain/generation/index.ts` (new)
  - `src/domain/index.ts` (update: re-export generation types)
  - `src/types/generationConfig.ts` (update: re-export from domain for backward compat)
- **Acceptance criteria**:
  - `GenerationConfig` and `GeneratedUniverse` are defined in `src/domain/generation/types.ts`.
  - `src/domain/generation/index.ts` exports them.
  - `src/domain/index.ts` re-exports generation types.
  - Old import path `src/types/generationConfig.ts` still works (re-export).
  - `npm run build` passes.
- **Verification**: `npm run typecheck && npm run build`

### Task 2 — Move topology grammars into domain

- **Goal**: Relocate `src/utils/topology/` → `src/domain/generation/topology/`.
- **Scope**: Topology module only. Leave backward-compat re-exports at old location.
- **Dependencies**: Task 1.
- **Files likely touched**:
  - `src/domain/generation/topology/types.ts` (new, moved from `src/utils/topology/types.ts`)
  - `src/domain/generation/topology/presets.ts` (new, moved from `src/utils/topology/presets.ts`)
  - `src/domain/generation/topology/generators.ts` (new, moved from `src/utils/topology/generators.ts`)
  - `src/domain/generation/topology/index.ts` (new, moved from `src/utils/topology/index.ts`)
  - `src/utils/topology/index.ts` (update: thin re-export from domain for backward compat)
- **Acceptance criteria**:
  - All topology types, presets, and generators live under `src/domain/generation/topology/`.
  - Old import `src/utils/topology` still works via re-export.
  - No browser/React/Three/Zustand imports in the moved files.
  - `npm run build` passes.
- **Verification**: `npm run typecheck && npm run build`

### Task 3 — Move procedural generator into domain

- **Goal**: Relocate `src/utils/procedural-generator.ts` → `src/domain/generation/proceduralGenerator.ts`.
- **Scope**: The core generator file only. Update its internal imports (topology path). Leave backward-compat re-export at old location.
- **Dependencies**: Task 2 (topology must be in domain first so the generator can import it).
- **Files likely touched**:
  - `src/domain/generation/proceduralGenerator.ts` (new, moved from `src/utils/procedural-generator.ts`)
  - `src/utils/procedural-generator.ts` (update: thin re-export from domain)
  - `src/domain/generation/index.ts` (update: re-export generator functions)
- **Acceptance criteria**:
  - `proceduralGenerator.ts` lives in `src/domain/generation/` and imports topology from `./topology`.
  - `GeneratorConfig` type and `generateSolarSystem`/`generateMultipleSystems` functions are exported from domain barrel.
  - Old import `src/utils/procedural-generator` still works via re-export.
  - No browser/React/Three/Zustand imports in the moved file.
  - `npm run build` passes.
- **Verification**: `npm run typecheck && npm run build`

### Task 4 — Move config defaults + config mapper into domain

- **Goal**: Relocate config defaults (`defaultConfig`, `getPresetConfig`, `generateRandomSeed`) and config mapping logic (`mapConfigToInternal` and all `map*` helpers) into domain.
- **Scope**: Config defaults + the entire bridge mapping layer. Not the stats computation or orchestrator yet.
- **Dependencies**: Task 3 (mapper references `GeneratorConfig` from the procedural generator).
- **Files likely touched**:
  - `src/domain/generation/configDefaults.ts` (new, moved from `src/utils/generatorConfigDefaults.ts`)
  - `src/domain/generation/configMapper.ts` (new, extracted from `src/utils/generatorBridge.ts`)
  - `src/utils/generatorConfigDefaults.ts` (update: thin re-export from domain)
  - `src/domain/generation/index.ts` (update: re-export)
- **Acceptance criteria**:
  - `defaultConfig`, `getPresetConfig`, `generateRandomSeed` live in `src/domain/generation/configDefaults.ts`.
  - All `map*` functions live in `src/domain/generation/configMapper.ts`.
  - `mapConfigToInternal` is exported from the domain barrel.
  - Old import `src/utils/generatorConfigDefaults` still works via re-export.
  - `npm run build` passes.
- **Verification**: `npm run typecheck && npm run build`

### Task 5 — Create generation orchestrator + stats in domain

- **Goal**: Extract the `generateUniverse()` orchestrator function and stats computation from `src/utils/generatorBridge.ts` into dedicated domain files. This creates the top-level generation API.
- **Scope**: Orchestrator + stats. The remaining `generatorBridge.ts` becomes a thin backward-compat re-export.
- **Dependencies**: Task 4 (config mapper must be in domain).
- **Files likely touched**:
  - `src/domain/generation/generateUniverse.ts` (new, orchestrator extracted from bridge)
  - `src/domain/generation/stats.ts` (new, stats computation extracted from bridge)
  - `src/utils/generatorBridge.ts` (update: thin re-export layer)
  - `src/domain/generation/index.ts` (update: re-export `generateUniverse`, stats helpers)
- **Acceptance criteria**:
  - `generateUniverse(config: GenerationConfig): GeneratedUniverse` is a pure domain function in `src/domain/generation/generateUniverse.ts`.
  - Stats computation logic is in `src/domain/generation/stats.ts`.
  - `src/utils/generatorBridge.ts` is now a thin re-export file (~5-10 lines).
  - Domain barrel exports `generateUniverse` and `getSmallBodyDetailLabel`.
  - `npm run build` passes.
- **Verification**: `npm run typecheck && npm run build`

### Task 6 — Update all consumers to import from domain + cleanup

- **Goal**: Switch all UI / infra consumers to import from `src/domain/` (or `src/domain/generation/`) instead of `src/utils/`. Remove or minimize backward-compat re-export files.
- **Scope**: Consumer import updates + old file cleanup.
- **Dependencies**: Task 5 (all domain files must be in place).
- **Files likely touched**:
  - `src/components/UniverseGeneratorPanel.tsx` (update imports)
  - `src/utils/stats/generationMetadataCache.ts` (update imports)
  - `src/components/UniverseGeneratorExample.tsx` (update imports if needed)
  - `src/utils/generator-examples.ts` (update imports if needed)
  - Old files in `src/utils/` and `src/types/` (delete or reduce to minimal re-exports)
- **Acceptance criteria**:
  - No UI component imports generation logic from `src/utils/generatorBridge.ts` or `src/utils/generatorConfigDefaults.ts` directly.
  - All generation imports go through `src/domain/` or `src/domain/generation/`.
  - Old `src/utils/` generation files are either deleted or contain only backward-compat re-exports (< 10 lines each).
  - `src/types/generationConfig.ts` re-exports from domain (or is deleted if no external consumers remain).
  - `npm run build` passes.
  - Generation behavior is unchanged (same seed → same output).
- **Verification**: `npm run typecheck && npm run build`
