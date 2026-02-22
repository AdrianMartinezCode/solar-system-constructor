# Task 6: Update all consumers to import from domain + cleanup

## Objective

Switch all remaining consumers (UI components, metadata cache, example files) to import generation functions and types from `src/domain/` instead of `src/utils/`. Clean up the backward-compat re-export files — either delete them or reduce them to minimal stubs.

## Context to read first

- `docs/plans/PLAN_extract_generation_domain.md` (Task 6 section)
- `src/domain/generation/index.ts` (the complete domain barrel after Tasks 1–5)
- `src/components/UniverseGeneratorPanel.tsx` (lines 1–7: current imports from utils)
- `src/utils/stats/generationMetadataCache.ts` (line 6: import from `../../types/generationConfig`)
- `src/components/UniverseGeneratorExample.tsx` (if it exists: check imports)
- `src/utils/generator-examples.ts` (check imports)

## Constraints

- **No behavioral changes** — only import path updates and file cleanup.
- Ensure `npm run build` passes after all changes.
- If any file outside the explicit list below also imports from the old locations, update it too (use `grep` to find all consumers).

## Steps

1. **Find all consumers** of the old generation import paths:
   ```bash
   grep -r "from.*generatorBridge" src/ --include="*.ts" --include="*.tsx"
   grep -r "from.*generatorConfigDefaults" src/ --include="*.ts" --include="*.tsx"
   grep -r "from.*types/generationConfig" src/ --include="*.ts" --include="*.tsx"
   grep -r "from.*procedural-generator" src/ --include="*.ts" --include="*.tsx"
   grep -r "from.*utils/topology" src/ --include="*.ts" --include="*.tsx"
   ```
2. **Update `src/components/UniverseGeneratorPanel.tsx`**:
   - Change: `import type { GenerationConfig } from '../types/generationConfig'`
     → `import type { GenerationConfig } from '../domain/generation'`
   - Change: `import { defaultConfig, getPresetConfig, generateRandomSeed } from '../utils/generatorConfigDefaults'`
     → `import { defaultConfig, getPresetConfig, generateRandomSeed } from '../domain/generation'`
   - Change: `import { generateUniverse, getSmallBodyDetailLabel } from '../utils/generatorBridge'`
     → `import { generateUniverse, getSmallBodyDetailLabel } from '../domain/generation'`
3. **Update `src/utils/stats/generationMetadataCache.ts`**:
   - Change: `import { GenerationConfig, GeneratedUniverse } from '../../types/generationConfig'`
     → `import type { GenerationConfig, GeneratedUniverse } from '../../domain/generation'`
4. **Update any other consumers** found in step 1 (e.g., `generator-examples.ts`, `UniverseGeneratorExample.tsx`).
5. **Clean up old files**:
   - `src/utils/generatorBridge.ts` — delete (or keep as 2-line re-export if external tools reference it).
   - `src/utils/generatorConfigDefaults.ts` — delete (or keep as 2-line re-export).
   - `src/types/generationConfig.ts` — delete (or keep as 2-line re-export).
   - `src/utils/procedural-generator.ts` — delete (or keep as 2-line re-export).
   - `src/utils/topology/` — delete the directory if all files are now thin re-exports and no consumer imports from it directly. Otherwise keep the barrel re-export.
   
   **Recommended approach**: keep the re-export files for safety (they're < 5 lines each). If you're confident no external tool references them, delete them.

6. **Verify the domain barrel is complete**:
   - `src/domain/generation/index.ts` should export: `GenerationConfig`, `GeneratedUniverse`, `generateUniverse`, `defaultConfig`, `getPresetConfig`, `generateRandomSeed`, `getSmallBodyDetailLabel`, `mapConfigToInternal`, `computeGenerationStats`, `GenerationStats`, and topology types.

## Files to create/update

- Update:
  - `src/components/UniverseGeneratorPanel.tsx`
  - `src/utils/stats/generationMetadataCache.ts`
  - (any other consumers found via grep)
- Delete or minimize:
  - `src/utils/generatorBridge.ts`
  - `src/utils/generatorConfigDefaults.ts`
  - `src/types/generationConfig.ts`
  - `src/utils/procedural-generator.ts`
  - `src/utils/topology/` (directory)

## Acceptance criteria

- No UI component imports generation logic from `src/utils/generatorBridge.ts`, `src/utils/generatorConfigDefaults.ts`, or `src/types/generationConfig.ts` directly (all go through `src/domain/generation/` or `src/domain/`).
- All generation imports in `src/` resolve to `src/domain/generation/**` as the canonical source.
- Old `src/utils/` generation files are either deleted or contain only backward-compat re-exports (< 5 lines each).
- `npm run typecheck` passes.
- `npm run build` passes.
- Generation behavior is unchanged (same seed → same result; verify by generating a universe in the UI if possible).

## Verification

```bash
npm run typecheck
npm run build
# Optionally verify no leftover direct imports:
grep -r "from.*utils/generatorBridge" src/ --include="*.ts" --include="*.tsx" | grep -v "node_modules"
grep -r "from.*utils/generatorConfigDefaults" src/ --include="*.ts" --include="*.tsx" | grep -v "node_modules"
# Both should return empty (or only the re-export files themselves).
```

## Notes

- This is the final task — after it, the domain generation module is fully self-contained and the old locations are cleaned up.
- If you kept backward-compat re-export files, a follow-up cleanup PR can remove them once all consumers are verified.
- The `src/utils/generator-examples.ts` file may also import generation types — check and update if needed.
- After this task, an MCP server can `import { generateUniverse, defaultConfig } from 'src/domain/generation'` and run generation without any UI dependencies.
