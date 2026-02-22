# Plan: UI/Domain Separation Architecture Refactor

## Summary

This plan refactors the app toward a layered architecture with clear boundaries between:

- **Domain**: pure universe state + commands + invariants (headless; no browser/React/Zustand)
- **Application**: orchestration + effects policy via ports (persistence, generator, logging)
- **Infra**: adapters (localStorage repository, generator adapter)
- **UI**: React/R3F rendering and panels; dispatches intent via a stable API

The migration is incremental and keeps the app running after each task. The highest-leverage seam to fix early is the generator panel’s imperative state replacement (`useSystemStore.setState(...)`).

## Repo snapshot used (files inspected)

- Project/scripts: `package.json`, `tsconfig.json`, `vite.config.ts`
- State: `src/state/systemStore.ts`, `src/state/windowStore.ts`
- Persistence + generator: `src/utils/persistence.ts`, `src/utils/generatorBridge.ts`, `src/utils/procedural-generator.ts`
- UI hotspots: `src/components/UniverseGeneratorPanel.tsx`, `src/components/Scene.tsx`, `src/components/StarObject.tsx`, `src/components/BodyCameraController.tsx`, `src/ui/BodyEditorPanel.tsx`
- Model/types: `src/types.ts`, `src/types/generationConfig.ts`

## Assumptions

- Saved-data compatibility is required (same storage key, same shape), unless a migration is explicitly introduced.
- We can keep using the existing data model types (`src/types.ts`) initially to reduce churn, and introduce a protocol surface (commands/queries) around it.
- There is no test runner today; verification is via `npm run typecheck` and `npm run build`.

## Risks / unknowns

- Cross-cutting refactor risk: many UI files import `useSystemStore` directly.
- The `systemStore` currently mixes persistence side effects with mutations; untangling this without regressions requires careful incremental steps.
- Generator “replace universe” currently bypasses actions; introducing invariants may reveal latent inconsistencies in generated data.
- `windowStore` uses `window.*` and `localStorage`; moving its persistence behind an adapter may be slightly disruptive (should be optional/late).

## Out of scope (for this plan)

- Adding a full unit test suite (Vitest/Jest) and CI wiring (recommended follow-up CR).
- Major performance work unrelated to separation (beyond removing obvious architectural hazards like imperative state replacement).

## Task list (ordered)

### Task 1 — Architecture decision + boundaries doc (docs-only)

- **Goal**: Record the target layering, dependency rule, and the “command protocol” concept in repo docs so future work stays consistent.
- **Scope**: Add/update architecture docs and an ADR; no `src/` changes.
- **Dependencies**: none.
- **Files likely touched**:
  - `docs/decisions/ADR_0002_ui_domain_separation_architecture_refactor.md` (new)
  - `docs/design/LAYERED_ARCHITECTURE_UI_DOMAIN_INFRA.md` (new)
- **Acceptance criteria**:
  - Clear boundary rules (what is domain vs UI vs infra).
  - Explicit list of ports (repository, generator, logger/event sink).
  - Explicit definition of “commands/queries are JSON-serializable”.
- **Verification**: N/A (docs-only).

### Task 2 — Create domain protocol + pure reducer skeleton (new files only)

- **Goal**: Introduce `src/domain/` with a minimal headless core: `UniverseState`, `UniverseCommand`, and a pure `applyUniverseCommand`.
- **Scope**: New domain files only; no UI behavior changes yet.
- **Dependencies**: Task 1 (optional but recommended).
- **Files likely touched** (example layout; keep small):
  - `src/domain/universe/state.ts` (new)
  - `src/domain/universe/commands.ts` (new)
  - `src/domain/universe/applyCommand.ts` (new)
  - `src/domain/universe/validate.ts` (new)
  - `src/domain/index.ts` (new)
- **Acceptance criteria**:
  - No imports from React/R3F/three/Zustand/browser globals in `src/domain/**`.
  - Commands and state are JSON-serializable types.
  - Reducer returns `{ nextState, events }` and is side-effect-free.
- **Verification**:
  - `npm run typecheck`
  - `npm run build`

### Task 3 — Introduce ports + localStorage repository adapter (infra wiring, minimal)

- **Goal**: Move persistence behind a repository port, implemented by a localStorage adapter that preserves the existing key/format.
- **Scope**: Add port interface + infra adapter; keep current persistence logic as implementation detail (wrap existing `src/utils/persistence.ts` first).
- **Dependencies**: Task 2.
- **Files likely touched**:
  - `src/app/ports/systemRepository.ts` (new) (or `src/domain/ports/**` if preferred)
  - `src/infra/persistence/localStorageSystemRepository.ts` (new)
  - `src/utils/persistence.ts` (optional: keep, but treated as infra-only)
  - `src/state/systemStore.ts` (update `save/load/reset` to delegate to repository)
- **Acceptance criteria**:
  - `systemStore` no longer imports `saveSystem/loadSystem` directly (or only through the adapter).
  - Storage key and shape remain compatible.
- **Verification**:
  - `npm run typecheck`
  - `npm run build`

### Task 4 — Replace generator panel imperative “setState + save” with explicit API

- **Goal**: Stop `UniverseGeneratorPanel` from calling `useSystemStore.setState(...)` directly; replace with a store/facade action (e.g., `replaceUniverseSnapshot`).
- **Scope**: Generator integration only; no other UI refactors.
- **Dependencies**: Task 3 (repository) or provide an interim action that still persists via existing policy.
- **Files likely touched**:
  - `src/state/systemStore.ts`
  - `src/components/UniverseGeneratorPanel.tsx`
  - `docs/guides/GENERATOR_UI_INTEGRATION.md` (update contract description)
- **Acceptance criteria**:
  - No `useSystemStore.setState(...)` usage in `UniverseGeneratorPanel`.
  - Universe replacement persists via the new action/policy.
- **Verification**:
  - `npm run typecheck`
  - `npm run build`

### Task 5 — Create `uiStore` for selection state and migrate core selection flows

- **Goal**: Move selection out of `systemStore` into `uiStore` (selected star/group/belt/field/disk/nebula).
- **Scope**: Selection only (not camera/nesting yet). Migrate a small set of critical components first.
- **Dependencies**: Task 4.
- **Files likely touched**:
  - `src/state/uiStore.ts` (new)
  - `src/components/StarObject.tsx` (click → select via `uiStore`)
  - `src/ui/BodyEditorPanel.tsx` (read selection via `uiStore`)
  - `src/state/systemStore.ts` (remove selection fields and “selection clearing” side effects, or keep as deprecated bridge temporarily)
- **Acceptance criteria**:
  - Selection state is owned by `uiStore`.
  - Domain mutations no longer implicitly clear selection.
- **Verification**:
  - `npm run typecheck`
  - `npm run build`

### Task 6 — Migrate camera state (Body POV) to `uiStore`

- **Goal**: Move camera mode/target/offset out of universe/domain state.
- **Scope**: Camera only.
- **Dependencies**: Task 5.
- **Files likely touched**:
  - `src/state/uiStore.ts`
  - `src/components/BodyCameraController.tsx`
  - `src/ui/BodyEditorPanel.tsx` (view-from-here / reset)
  - `src/state/systemStore.ts` (remove camera fields/actions or keep a compatibility bridge)
- **Acceptance criteria**:
  - Camera mode and target come from `uiStore` only.
  - Persistence does not store camera mode.
- **Verification**:
  - `npm run typecheck`
  - `npm run build`

### Task 7 — Migrate nesting level + group isolation to `uiStore`

- **Goal**: Move viewport display controls (nesting level, isolated group) out of universe/domain state.
- **Scope**: Nesting/isolation only.
- **Dependencies**: Task 5.
- **Files likely touched**:
  - `src/state/uiStore.ts`
  - `src/components/Scene.tsx`
  - `src/ui/NestingLevelControl.tsx`
  - `src/ui/GroupEditorPanel.tsx` (if it owns isolation toggle)
- **Acceptance criteria**:
  - Nesting and isolation are UI state; not persisted as part of universe snapshot.
  - Isolation behavior in the scene remains unchanged.
- **Verification**:
  - `npm run typecheck`
  - `npm run build`

### Task 8 — Migrate star CRUD + hierarchy ops to the domain reducer (first real slice)

- **Goal**: Replace inline mutation logic in `systemStore` with calls into `src/domain/**` for stars and time tick.
- **Scope**: Stars only (add/update/remove/attach/detach) + tick; no groups/fields yet.
- **Dependencies**: Task 2 and Task 5–7 (to keep UI state separate).
- **Files likely touched**:
  - `src/domain/universe/**` (extend reducer)
  - `src/state/systemStore.ts` (or new `src/state/universeStore.ts` if introduced here)
  - `src/components/Scene.tsx` (tick wiring if moved)
- **Acceptance criteria**:
  - Star mutations are applied via domain commands (pure reducer).
  - Persistence policy is handled outside the reducer (store/app layer).
- **Verification**:
  - `npm run typecheck`
  - `npm run build`

### Task 9 — Migrate group operations to the domain reducer

- **Goal**: Move group CRUD and hierarchy/cycle prevention into domain commands.
- **Scope**: Groups only; keep UI-only nesting/isolation in `uiStore`.
- **Dependencies**: Task 8.
- **Files likely touched**:
  - `src/domain/universe/**`
  - `src/state/systemStore.ts` (or `src/state/universeStore.ts`)
  - `src/utils/groupUtils.ts` (optional: move/duplicate pure logic into domain if needed)
- **Acceptance criteria**:
  - Group operations are domain commands with invariant checks.
  - UI-level visibility computation remains UI or becomes a pure selector (no store side effects).
- **Verification**:
  - `npm run typecheck`
  - `npm run build`

### Task 10 — Migrate fields/disks/nebula operations to domain commands; tighten boundary rules

- **Goal**: Move remaining universe data mutations (small body fields, disks, nebulae) into domain commands and ensure no infra/UI leakage.
- **Scope**: Universe data only; keep UI selection/camera/nesting separate.
- **Dependencies**: Task 8–9.
- **Files likely touched**:
  - `src/domain/universe/**`
  - `src/state/systemStore.ts` (or `src/state/universeStore.ts`)
  - `src/ui/NebulaEditorPanel.tsx`, `src/components/SmallBodyFieldObject.tsx`, `src/components/ProtoplanetaryDiskObject.tsx` (as needed to adapt to new APIs)
- **Acceptance criteria**:
  - All universe mutations go through domain commands.
  - Persistence and generator are only accessed via ports/adapters.
- **Verification**:
  - `npm run typecheck`
  - `npm run build`

