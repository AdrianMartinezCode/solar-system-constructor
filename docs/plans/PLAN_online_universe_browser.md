# Plan: Online Universe Browser & Editor Save

## Summary

Decompose `CR_online_universe_browser.md` into 4 ordered tasks that introduce an online session store, a Universe Browser screen, App-level routing integration, and online-mode editor buttons (Save + Back). Each task is self-contained, touches ≤ 5 files, and can be verified independently.

## Repo Snapshot Used

- Inspected: `apps/web/src/App.tsx` (current entry point, mode gating logic)
- Inspected: `apps/web/src/state/appModeStore.ts` (session-level mode store)
- Inspected: `apps/web/src/state/systemStore.ts` (universe state + `replaceUniverseSnapshot`)
- Inspected: `apps/web/src/app/ports/universeApiClient.ts` (API port interface)
- Inspected: `apps/web/src/infra/api/mockUniverseApiClient.ts` (mock adapter with seed data)
- Inspected: `apps/web/src/components/ModeSelectionScreen.tsx` (existing mode screen)
- Inspected: `apps/web/src/components/AppHeader.tsx` (editor header bar)
- Inspected: `apps/web/src/state/windowStore.ts` (window types and management)
- Inspected: `apps/web/src/domain/universe/state.ts` (UniverseState type)

## Assumptions

- The "Universe Browser" is a full-screen gate (like the mode selection screen), not a window/panel inside the editor.
- When a universe is loaded from the browser, its `state` blob is fed into `systemStore.replaceUniverseSnapshot()`.
- The `mockUniverseApiClient` singleton is imported directly in components/stores for now. When a real HTTP adapter is built, it will be swapped via the port interface.
- "Create New Universe" generates a universe with an empty/example state and a user-provided name (simple prompt or inline input).
- The online session store tracks which universe is loaded so the Save button knows what ID to update.

## Risks / Unknowns

- **State shape mismatch**: The mock API's `state` blob is a generic `Record<string, unknown>`, while `systemStore.replaceUniverseSnapshot()` expects a typed snapshot. The integration task must handle the cast/validation.
- **Mock adapter is in-memory**: Data resets on page refresh. This is acceptable since we're mocking; users will be informed this is a mock experience.
- **Universe state might be empty**: Seed universes have empty state blobs (`{ stars: {}, rootIds: [], ... }`). Loading them will show an empty editor. This is expected for mock data.

## Out of Scope

- Real HTTP communication with the backend.
- Persisting the online session state across page refreshes.
- Universe renaming, search, pagination, or advanced filtering.
- Switching `systemStore` persistence adapter based on mode.

---

## Task List (ordered)

### Task 1: Create the `onlineSessionStore` (Zustand store for online session state)

**Goal**: Establish a Zustand store that tracks the online-mode session: which phase the user is in (browsing vs editing) and which universe is currently loaded.

**Scope**: State management only. No UI, no API calls.

**Dependencies**: None.

**Files**:
- `apps/web/src/state/onlineSessionStore.ts` (new)

**Acceptance Criteria**:
- Store exposes `phase: 'browsing' | 'editing'` (starts as `'browsing'`).
- Store exposes `currentUniverseId: string | null` and `currentUniverseName: string | null` (both start as `null`).
- `enterEditor(id: string, name: string)` sets the current universe and transitions phase to `'editing'`.
- `exitEditor()` clears the current universe and transitions phase to `'browsing'`.
- `resetSession()` clears everything back to initial state.
- `npm run build` passes.

**Verification**: `npm run build`

---

### Task 2: Create the `UniverseBrowser` presentational component

**Goal**: Build the full-screen UI component that displays a list of universes with Load, Delete, and Create actions.

**Scope**: Presentational component + CSS. Receives data and callbacks via props — no direct store/API access.

**Dependencies**: Task 1 (uses the `ApiUniverse` type from the port for prop typing).

**Files**:
- `apps/web/src/components/UniverseBrowser.tsx` (new)
- `apps/web/src/components/UniverseBrowser.css` (new)

**Acceptance Criteria**:
- Component receives props: `universes: ApiUniverse[]`, `loading: boolean`, `onLoad(id: string): void`, `onDelete(id: string): void`, `onCreate(): void`, `onBack(): void`.
- Renders a full-screen dark-themed layout matching the project style.
- Shows a loading indicator when `loading` is true.
- Lists each universe as a card/row with name, creation date, updated date.
- Each universe row has a "Load" button and a "Delete" button.
- Delete button shows an inline confirmation before calling `onDelete`.
- A "Create New Universe" button is prominently displayed.
- A "Back" button returns to the mode selection screen (calls `onBack`).
- Empty state message when no universes exist.
- `npm run build` passes.

**Verification**: `npm run build`

---

### Task 3: Integrate Universe Browser into the App online-mode flow

**Goal**: Wire the `UniverseBrowser` into `App.tsx` so that selecting "Online" mode shows the browser first, and user actions (load/delete/create) work end-to-end using the mock API.

**Scope**: Integration wiring — connects components to stores and mock API. Modifies `App.tsx` to handle the online sub-flow.

**Dependencies**: Tasks 1, 2.

**Files**:
- `apps/web/src/App.tsx` (update)

**Acceptance Criteria**:
- When `appModeStore.mode === 'online'` and `onlineSessionStore.phase === 'browsing'`, the `UniverseBrowser` is rendered.
- When `appModeStore.mode === 'online'` and `onlineSessionStore.phase === 'editing'`, the existing `AppContent` is rendered.
- When `appModeStore.mode === 'offline'`, the existing `AppContent` is rendered directly (no browser).
- "Load" fetches the universe by ID from the mock API and calls `systemStore.replaceUniverseSnapshot()` with its state, then transitions to editing phase.
- "Delete" calls the mock API delete, then refreshes the universe list.
- "Create" prompts for a name (simple `window.prompt` or inline input), creates via mock API with an empty/example state, and transitions to editing phase.
- "Back" from browser calls `appModeStore.clearMode()` to return to mode selection.
- `npm run build` passes.

**Verification**: `npm run build` + manual browser testing.

---

### Task 4: Add online-mode "Save" and "Back to Universes" buttons in AppHeader

**Goal**: When in online mode and editing a universe, show a "Save" button and a "Back to Universes" button in the editor header. These are not visible in offline mode.

**Scope**: UI update to `AppHeader.tsx` + wiring to mock API and `onlineSessionStore`.

**Dependencies**: Tasks 1, 3.

**Files**:
- `apps/web/src/components/AppHeader.tsx` (update)
- `apps/web/src/components/AppHeader.css` (update)

**Acceptance Criteria**:
- When `appModeStore.mode === 'online'`, the header shows a "💾 Save" button and a "📋 Universes" button.
- When `appModeStore.mode === 'offline'`, neither button is visible.
- Clicking "Save" calls `mockUniverseApiClient.update()` with the current `onlineSessionStore.currentUniverseId` and the current system state from `systemStore`.
- Save button shows brief visual feedback (e.g., "Saving…" → "Saved ✓" for 2 seconds).
- Clicking "Back to Universes" calls `onlineSessionStore.exitEditor()` to return to the browser.
- `npm run build` passes.

**Verification**: `npm run build` + manual browser testing.
