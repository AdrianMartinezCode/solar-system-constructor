# Task 3: Move Universe Domain Logic to `@solar/domain`

## Objective

Copy the four universe domain files (`state.ts`, `commands.ts`, `applyCommand.ts`, `validate.ts`) from `apps/web/src/domain/universe/` into `packages/domain/src/universe/`, updating internal imports to reference the package-local `../types` instead of the web-relative `../../types`.

## Context to Read First

- `apps/web/src/domain/universe/state.ts` — `UniverseState` interface + `emptyUniverseState()`.
- `apps/web/src/domain/universe/commands.ts` — all command interfaces + `UniverseCommand` union + `DomainEvent`.
- `apps/web/src/domain/universe/applyCommand.ts` — pure reducer function + `CommandResult`.
- `apps/web/src/domain/universe/validate.ts` — cycle detection and helper functions.
- `packages/domain/src/types.ts` — entity types (from Task 2).
- `packages/domain/src/index.ts` — current barrel exports.

## Constraints

- **Copy, don't move yet** — original files in `apps/web/` stay untouched. Task 4 will convert them to re-export shims.
- Do **not** modify any files under `apps/web/` or `apps/api/`.
- All `import ... from '../../types'` must become `import ... from '../types'` (package-local).
- All `import('../../types').Foo` inline type imports must become `import('../types').Foo`.
- The logic must remain **identical** — no behavioral changes, no refactoring.
- No new dependencies (the domain logic is pure TypeScript with no external deps).

## Steps

1. Create `packages/domain/src/universe/state.ts`:
   - Copy from `apps/web/src/domain/universe/state.ts`.
   - Change import path: `from '../../types'` → `from '../types'`.

2. Create `packages/domain/src/universe/commands.ts`:
   - Copy from `apps/web/src/domain/universe/commands.ts`.
   - Change import path: `from '../../types'` → `from '../types'`.
   - Update all `import('../../types').Foo` inline references to `import('../types').Foo`.

3. Create `packages/domain/src/universe/validate.ts`:
   - Copy from `apps/web/src/domain/universe/validate.ts`.
   - Change import paths: `from '../../types'` → `from '../types'`.

4. Create `packages/domain/src/universe/applyCommand.ts`:
   - Copy from `apps/web/src/domain/universe/applyCommand.ts`.
   - Change import path: `from '../../types'` → `from '../types'`.
   - Change internal imports to reference sibling files: `from './state'`, `from './commands'`, `from './validate'` (these should already be correct since the relative structure is the same).
   - Update all `import('../../types').Foo` inline references to `import('../types').Foo`.

5. Update `packages/domain/src/index.ts`:
   - Add universe domain re-exports matching the public API from `apps/web/src/domain/index.ts` (universe part only):
     ```typescript
     // State
     export type { UniverseState } from './universe/state';
     export { emptyUniverseState } from './universe/state';

     // Commands & events
     export type { UniverseCommand, TickCommand, AddStarCommand, ... , DomainEvent } from './universe/commands';

     // Reducer
     export type { CommandResult } from './universe/applyCommand';
     export { applyUniverseCommand } from './universe/applyCommand';

     // Validation helpers
     export { wouldCreateStarCycle, collectDescendants, starExists, wouldCreateGroupCycle } from './universe/validate';
     ```
   - Export ALL command type interfaces individually (not just the union).

6. Verify the package compiles.

## Files to Create/Update

| File | Action |
|------|--------|
| `packages/domain/src/universe/state.ts` | Create |
| `packages/domain/src/universe/commands.ts` | Create |
| `packages/domain/src/universe/applyCommand.ts` | Create |
| `packages/domain/src/universe/validate.ts` | Create |
| `packages/domain/src/index.ts` | Update |

## Acceptance Criteria

- [ ] All four files exist under `packages/domain/src/universe/`.
- [ ] No file contains `from '../../types'` — all use `from '../types'`.
- [ ] No file contains `import('../../types')` — all use `import('../types')`.
- [ ] The barrel (`packages/domain/src/index.ts`) exports all types and functions from the universe domain.
- [ ] All exported type signatures are identical to the originals.
- [ ] `npx tsc -p packages/domain/tsconfig.json --noEmit` passes with zero errors.
- [ ] No files under `apps/` are modified.

## Verification

```bash
npx tsc -p packages/domain/tsconfig.json --noEmit
```

## Notes

- `applyCommand.ts` uses both top-level `import type` statements and inline `import('../../types').Foo` patterns in function parameters and local variables. Make sure to catch ALL occurrences.
- `commands.ts` also uses inline `import('../../types').Foo` in several places (e.g. `AddGroupCommand.payload`, `ReplaceSnapshotCommand.snapshot`). Search for all occurrences.
- `validate.ts` has two separate `import type` blocks (one for `Star`, one for `Group` further down). Consolidate into a single import block from `'../types'` at the top for cleanliness, or keep both — either is acceptable as long as paths are correct.
