# Task 2: Move topology grammars into domain

## Objective

Relocate the topology grammar module (`src/utils/topology/`) into `src/domain/generation/topology/`, keeping the same internal structure. Leave backward-compatible re-exports at the old location.

## Context to read first

- `docs/plans/PLAN_extract_generation_domain.md` (Task 2 section)
- `src/utils/topology/index.ts` (current barrel + exports)
- `src/utils/topology/types.ts` (topology type definitions)
- `src/utils/topology/presets.ts` (topology presets)
- `src/utils/topology/generators.ts` (topology generators)
- `src/utils/procedural-generator.ts` (lines 1–6: imports from `./topology`)

## Constraints

- **No imports** from React, `@react-three/fiber`, `three`, Zustand, or browser globals in moved files.
- The old import path `src/utils/topology` must still work (thin re-export barrel).
- Do NOT modify the internal logic of any topology file — pure relocation.
- `src/utils/procedural-generator.ts` still imports from `./topology` — keep that working via the re-export barrel at the old location.

## Steps

1. Create `src/domain/generation/topology/` directory.
2. Move (copy content) each file from `src/utils/topology/` to `src/domain/generation/topology/`:
   - `types.ts` → `src/domain/generation/topology/types.ts`
   - `presets.ts` → `src/domain/generation/topology/presets.ts`
   - `generators.ts` → `src/domain/generation/topology/generators.ts`
   - `index.ts` → `src/domain/generation/topology/index.ts`
3. Update internal imports in the moved files if needed (they should reference sibling files via `./types`, `./presets`, etc. — likely unchanged).
4. Replace `src/utils/topology/index.ts` with a thin re-export:
   ```ts
   // Backward-compat re-export — canonical location: src/domain/generation/topology/
   export * from '../../../domain/generation/topology';
   ```
5. Remove or thin-out the other files in `src/utils/topology/` (types.ts, presets.ts, generators.ts) since the barrel re-export covers everything. Or simply leave them and only update the index.
6. Update `src/domain/generation/index.ts` to re-export topology types and functions as needed.

## Files to create/update

- Create:
  - `src/domain/generation/topology/types.ts`
  - `src/domain/generation/topology/presets.ts`
  - `src/domain/generation/topology/generators.ts`
  - `src/domain/generation/topology/index.ts`
- Update:
  - `src/utils/topology/index.ts` (thin re-export)

## Acceptance criteria

- All topology types, presets, and generators live under `src/domain/generation/topology/`.
- `import { ... } from '../utils/topology'` still works for existing consumers (e.g., `procedural-generator.ts`).
- No browser/React/Three/Zustand imports in `src/domain/generation/topology/**`.
- `npm run typecheck` passes.
- `npm run build` passes.

## Verification

```bash
npm run typecheck
npm run build
```

## Notes

- The topology module is self-contained with minimal external imports (only `src/types.ts` if any). This makes it the safest first move.
- In Task 3, `procedural-generator.ts` will be moved into domain and will import topology from `./topology` (a direct sibling), eliminating the re-export need. But for now, keep the re-export at `src/utils/topology/index.ts` so the current `procedural-generator.ts` location still works.
