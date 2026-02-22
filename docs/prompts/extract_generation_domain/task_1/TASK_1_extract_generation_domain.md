# Task 1: Create domain generation types + barrel skeleton

## Objective

Establish the `src/domain/generation/` directory with type definitions (`GenerationConfig`, `GeneratedUniverse`) and a barrel export. This creates the skeleton that all subsequent tasks will populate.

## Context to read first

- `docs/plans/PLAN_extract_generation_domain.md` (Task 1 section)
- `src/types/generationConfig.ts` (current type definitions — to be moved)
- `src/domain/index.ts` (existing domain barrel — to be extended)
- `src/domain/universe/state.ts` (reference for domain file conventions)

## Constraints

- Only create new files under `src/domain/generation/` and update `src/domain/index.ts`.
- **No imports** from React, `@react-three/fiber`, `three`, Zustand, or browser globals in `src/domain/generation/**`.
- Types must remain **JSON-serializable**.
- The old import path `src/types/generationConfig.ts` must continue to work (add re-export from domain).
- Do NOT move any behavioral code (functions) yet — types only in this task.

## Steps

1. Create `src/domain/generation/types.ts`:
   - Copy `GenerationConfig` interface from `src/types/generationConfig.ts`.
   - Copy `GeneratedUniverse` interface from `src/types/generationConfig.ts`.
   - Update the `import type` at the bottom to reference `../../types` (the shared model types like `Star`, `Group`, etc.).
2. Create `src/domain/generation/index.ts`:
   - Re-export `GenerationConfig` and `GeneratedUniverse` from `./types`.
   - This barrel will grow as subsequent tasks add more exports.
3. Update `src/domain/index.ts`:
   - Add a section for generation re-exports: `export type { GenerationConfig, GeneratedUniverse } from './generation';`
4. Update `src/types/generationConfig.ts`:
   - Replace the current type definitions with re-exports from `../domain/generation/types`.
   - Keep the same export surface so existing consumers are unaffected.

## Files to create/update

- Create:
  - `src/domain/generation/types.ts`
  - `src/domain/generation/index.ts`
- Update:
  - `src/domain/index.ts`
  - `src/types/generationConfig.ts`

## Acceptance criteria

- `GenerationConfig` and `GeneratedUniverse` are defined in `src/domain/generation/types.ts`.
- `src/domain/generation/index.ts` re-exports both types.
- `src/domain/index.ts` re-exports generation types.
- Importing `GenerationConfig` from `../types/generationConfig` still works in existing consumers (backward compat re-export).
- No browser/React/Three/Zustand imports in `src/domain/generation/**`.
- `npm run typecheck` passes.
- `npm run build` passes.

## Verification

```bash
npm run typecheck
npm run build
```

## Notes

- The `GeneratedUniverse` type references types from `src/types.ts` (Star, Group, AsteroidBelt, etc.). These shared model types stay in `src/types.ts` for now; the domain generation module imports them via relative path.
- Later tasks (2–5) will add functions to this barrel. Keep the barrel thin for now.
