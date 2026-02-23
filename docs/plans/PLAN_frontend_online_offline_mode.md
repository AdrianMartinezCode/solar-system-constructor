# Plan: Frontend Online/Offline Mode Selection

## Summary

Decompose `CR_frontend_online_offline_mode.md` into 4 ordered tasks that introduce a mode selection gate, a mode store, a frontend API port with a mock adapter, and the integration wiring in `App.tsx`. Each task is self-contained, touches ≤ 5 files, and can be verified independently.

## Repo Snapshot Used

- Inspected: `apps/web/src/main.tsx`, `apps/web/src/App.tsx`, `apps/web/src/App.css`
- Inspected: `apps/web/src/state/systemStore.ts`, `apps/web/src/state/uiStore.ts`
- Inspected: `apps/web/src/app/ports/systemRepository.ts`
- Inspected: `apps/web/src/infra/persistence/localStorageSystemRepository.ts`
- Inspected: `apps/api/src/app/ports/universeRepository.ts` (backend contract reference)
- Inspected: `apps/api/src/routes/universes.ts` (backend CRUD reference)
- Inspected: `apps/web/package.json` (dependencies: React 18, Zustand 4, Vite 5)
- Inspected: Project architecture in `.agents/agents.md`

## Assumptions

- The mode selection is a **session-level** choice (not persisted across browser refreshes for now; user picks each time).
- "Online" mode initially behaves identically to "Offline" from the user's perspective (mocked adapter returns realistic but hardcoded data).
- The existing `systemStore` persistence (save/load/reset using `localStorageSystemRepository`) is not modified in this CR. The mode store is an independent concern.
- No new npm packages are needed.

## Risks / Unknowns

- **UX friction**: adding a mandatory mode screen increases time-to-scene. Mitigation: keep the screen minimal and fast; consider adding a "remember choice" option in a future CR.
- **Mock data realism**: the mock adapter must return `PersistedUniverse`-shaped data. If the backend contract changes, the mock needs updating. Mitigation: define the port interface explicitly so changes are caught at compile time.

## Out of Scope

- Real HTTP communication with the backend.
- Switching `systemStore` persistence adapter based on mode.
- Universe listing/selection screen in online mode.
- Persisting the mode choice to localStorage.

---

## Task List (ordered)

### Task 1: Define AppMode type and create the mode store

**Goal**: Establish the foundational type and Zustand store that the rest of the feature depends on.

**Scope**: Types + state only. No UI, no wiring.

**Dependencies**: None.

**Files**:
- `apps/web/src/types/appMode.ts` (new)
- `apps/web/src/state/appModeStore.ts` (new)

**Acceptance Criteria**:
- `AppMode` type is `'online' | 'offline'`.
- `appModeStore` exposes `mode: AppMode | null`, `setMode(mode: AppMode): void`, and `clearMode(): void`.
- `mode` starts as `null` (no choice made yet).
- `npm run build` passes.

**Verification**: `npm run build && npm run typecheck`

---

### Task 2: Create the ModeSelectionScreen component

**Goal**: Build the UI that users see first to pick between Online and Offline.

**Scope**: Pure presentational component + CSS. No store wiring yet (receives callbacks via props).

**Dependencies**: Task 1 (uses `AppMode` type for the callback).

**Files**:
- `apps/web/src/components/ModeSelectionScreen.tsx` (new)
- `apps/web/src/components/ModeSelectionScreen.css` (new)

**Acceptance Criteria**:
- Component renders two cards/buttons: "Online" and "Offline", each with an icon and short description.
- Calls `onSelect(mode: AppMode)` when a card is clicked.
- Visual style matches the project's dark theme (`#0d0d0d` background, Inter font, accent colors).
- Component is responsive and centered on the screen.
- `npm run build` passes.

**Verification**: `npm run build && npm run typecheck`

---

### Task 3: Define the UniverseApiClient port and mock adapter

**Goal**: Create the frontend-side API abstraction for universe CRUD, and a mock implementation.

**Scope**: Port interface + mock adapter. No UI, no wiring to stores.

**Dependencies**: None (can be done in parallel with Task 2, but listed after for conceptual ordering).

**Files**:
- `apps/web/src/app/ports/universeApiClient.ts` (new)
- `apps/web/src/infra/api/mockUniverseApiClient.ts` (new)

**Acceptance Criteria**:
- `UniverseApiClient` interface defines: `list()`, `getById(id)`, `create(input)`, `update(id, input)`, `delete(id)` — all returning Promises.
- Types align with the backend's `PersistedUniverse`, `CreateUniverseInput`, and `UpdateUniverseInput` shapes (defined locally on the frontend, not imported from backend).
- `mockUniverseApiClient` implements the interface using an in-memory array with 2–3 pre-seeded example universes.
- Mock methods include realistic async delays (e.g., `setTimeout` of 100–300ms) to simulate network latency.
- `npm run build` passes.

**Verification**: `npm run build && npm run typecheck`

---

### Task 4: Integrate mode selection gate into App entry flow

**Goal**: Wire the `ModeSelectionScreen` into the application so it acts as a gate before the main experience loads.

**Scope**: Integration only — connect the existing `ModeSelectionScreen` to `appModeStore` and conditionally render either the mode screen or the current `App` content.

**Dependencies**: Tasks 1, 2, 3.

**Files**:
- `apps/web/src/App.tsx` (update)
- `apps/web/src/components/ModeSelectionScreen.tsx` (minor update if needed for store integration)

**Acceptance Criteria**:
- When `appModeStore.mode` is `null`, the `ModeSelectionScreen` is rendered.
- When `appModeStore.mode` is `'offline'`, the existing app content is rendered (Scene, WindowManager, Taskbar, etc.).
- When `appModeStore.mode` is `'online'`, the existing app content is rendered (same as offline for now — mocked).
- The transition from mode screen to app is seamless (no flash or layout jump).
- Existing behavior is not broken: once "Offline" is chosen, everything works exactly as before.
- `npm run build` passes.

**Verification**: `npm run build && npm run typecheck` + manual browser testing.
