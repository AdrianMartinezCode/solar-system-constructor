# Task 3: Introduce ports + localStorage repository adapter (infra wiring, minimal)

## Objective

Move universe persistence behind a **repository port** with a **localStorage adapter**, while preserving the existing save key and data format. `systemStore` should no longer own persistence implementation details.

## Context to read first

- `docs/plans/PLAN_ui_domain_separation_architecture_refactor.md` (Task 3 section)
- `src/state/systemStore.ts` (current `save/load/reset` behavior and mutation-triggered saves)
- `src/utils/persistence.ts` (current localStorage implementation)

## Constraints

- Preserve:
  - localStorage key used for universe save data
  - JSON shape of persisted data
- Do not change UI behavior; this task is about wiring and boundaries.
- Keep the port interface small and focused.

## Steps

- Define a port/interface for persistence (repository) in a non-UI layer:
  - methods for `save(snapshot)`, `load()`, `clear()` (as needed)
- Implement a localStorage adapter that delegates to existing logic:
  - initial implementation may wrap `src/utils/persistence.ts`
  - keep adapter in `src/infra/persistence/**`
- Update `src/state/systemStore.ts` so that:
  - persistence is performed via the repository adapter
  - `systemStore` does not directly import or call `localStorage` helpers (except through the adapter)

## Files to create/update

- Create:
  - `src/app/ports/systemRepository.ts` (or equivalent port location)
  - `src/infra/persistence/localStorageSystemRepository.ts`
- Update:
  - `src/state/systemStore.ts`
- Optional (only if needed for boundary clarity):
  - `src/utils/persistence.ts` (e.g., tighten exports or add comments that it’s infra-only)

## Acceptance criteria

- Universe save/load flows still work (behavior preserved).
- `systemStore` no longer depends on `src/utils/persistence.ts` as an implementation detail (it depends on a repository adapter instead).
- `src/infra/` is no longer empty; persistence has a clear home.

## Verification

```bash
npm run typecheck
npm run build
```

## Notes

- It’s acceptable for `windowStore` to keep its workspace persistence for now; that can be tackled later if needed.

