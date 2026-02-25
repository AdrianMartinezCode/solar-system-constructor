# Tasks: host-config-health-check

**Change name:** `host-config-health-check`
**Date:** 2026-02-25
**Status:** Implementation complete (Phases 1-3, 5 done; Phase 4 requires manual verification). Post-implementation adjustments applied (see notes below).
**Phases:** 5 phases, 14 tasks total

---

## Phase 1: Foundation

_Setup the new store and provider that everything else depends on._

- [x] **1.1** Create `hostConfigStore` Zustand store

  **File:** `apps/web/src/state/hostConfigStore.ts` (new)

  Create a new Zustand store following the exact pattern in `appModeStore.ts`:
  - Interface `HostConfigStore` with `apiHost: string` and `setApiHost: (url: string) => void`.
  - Default `apiHost` to `import.meta.env.VITE_API_HOST ?? ''` (empty = proxy mode, non-empty = host origin like `http://localhost:3001`).
  - Export as `useHostConfigStore` using `create<HostConfigStore>()`.
  - Session-scoped (no persist middleware), matching existing convention.

  > **Post-impl note:** Changed from `VITE_API_BASE_URL ?? '/api'` to `VITE_API_HOST ?? ''`. The store holds a host origin, not a path.

  **Verify:** File compiles. `useHostConfigStore.getState().apiHost` returns the env var value. `npm run typecheck` passes.

  **Refs:** REQ-STATE-1, REQ-STATE-2, REQ-STATE-3, REQ-STATE-4; Design Decision 6.

---

- [x] **1.2** Create `apiBaseUrlProvider` module

  **File:** `apps/web/src/infra/api/apiBaseUrlProvider.ts` (new)

  Create a module exporting a single named function `getApiBaseUrl(): string`:
  - Read `useHostConfigStore.getState().apiHost`.
  - When host is non-empty: return host as-is (no `/api` suffix). Backend routes are at root level.
  - When host is empty: return `'/api'` (Vite proxy mode).
  - Strip trailing slashes with `.replace(/\/+$/, '')`.
  - Import `useHostConfigStore` from `../../state/hostConfigStore`.

  > **Post-impl note:** Provider does NOT append `/api` to direct hosts. The `/api` prefix is only a Vite dev proxy convention.

  **Verify:** File compiles. Calling `getApiBaseUrl()` returns the env var value (default path). `npm run typecheck` passes.

  **Refs:** REQ-PROV-1, REQ-PROV-2, REQ-PROV-3, REQ-PROV-4; Design Decision 2.

---

## Phase 2: Core Implementation

_Build the health-check hook and refactor infra modules to use the new provider._

- [x] **2.1** Create `useHealthCheck` custom hook

  **File:** `apps/web/src/hooks/useHealthCheck.ts` (new)

  Implement the hook per the design contract:
  - Type `HealthStatus = 'idle' | 'checking' | 'healthy' | 'error'`.
  - Interface `HealthCheckResult` with `status: HealthStatus` and `error: string | null`.
  - Function signature: `useHealthCheck(baseUrl: string): HealthCheckResult`.
  - `useEffect` that fires a `fetch(baseUrl + '/health')` call:
    - On initial mount: fire immediately (no debounce).
    - On subsequent `baseUrl` changes: debounce 500ms via `setTimeout`/`clearTimeout`.
    - Use `AbortController` to cancel in-flight requests on cleanup or re-run.
    - Apply a 5-second timeout: prefer `AbortSignal.timeout(5000)` with try-catch fallback to manual `setTimeout` + `abort()`.
  - Status transitions:
    - Set `'checking'` before the fetch.
    - Set `'healthy'` when response is HTTP 200 AND `response.json()` yields `{ ok: true, ... }`.
    - Set `'error'` for: network error, non-200 status, non-JSON body, JSON without truthy `ok`, timeout.
  - Error messages:
    - Network error: use `err.message` (e.g., "Failed to fetch").
    - Non-200: `"HTTP {status}: {statusText}"`.
    - Non-JSON: `"Invalid response (not JSON)"`.
    - Missing `ok`: `"Server reported not OK"`.
  - Wrap JSON parse in try-catch to handle non-JSON 200 responses (REQ-HEALTH-6, Scenario HEALTH-6).
  - Return `{ status, error }`.

  **Verify:** File compiles. `npm run typecheck` passes. Hook can be imported without errors.

  **Refs:** REQ-HEALTH-1 through REQ-HEALTH-6; Scenarios HEALTH-1 through HEALTH-6, SEM-1 through SEM-4; Design Decisions 3, 4.

---

- [x] **2.2** Refactor `httpUniverseApiClient.ts` to use `getApiBaseUrl()` per-request

  **File:** `apps/web/src/infra/api/httpUniverseApiClient.ts` (modify)

  Changes:
  1. Add import: `import { getApiBaseUrl } from './apiBaseUrlProvider';`.
  2. Remove the standalone `resolveBaseUrl()` function (lines 20-29).
  3. Remove the `const baseUrl = resolveBaseUrl();` line inside `createHttpUniverseApiClient()` (line 48).
  4. In each method body (`list`, `getById`, `create`, `update`, `delete`), add `const baseUrl = getApiBaseUrl();` as the first line.
  5. The singleton export at line 102 remains unchanged.

  **Verify:** File compiles. `npm run typecheck` passes. The singleton still exports correctly. Default behavior (no user override) is identical to before.

  **Refs:** REQ-INFRA-1, REQ-INFRA-2, REQ-INFRA-4; Scenario INFRA-1, INFRA-3, INFRA-4; Design Decision 1.

---

- [x] **2.3** Refactor `sseCommandStream.ts` to use `getApiBaseUrl()` per-connection

  **File:** `apps/web/src/infra/realtime/sseCommandStream.ts` (modify)

  Changes:
  1. Add import: `import { getApiBaseUrl } from '../api/apiBaseUrlProvider';`.
  2. Remove the standalone `resolveBaseUrl()` function (lines 24-33).
  3. Remove the `const baseUrl = resolveBaseUrl();` line inside `createSseCommandStream()` (line 40).
  4. Inside `connect()`, add `const baseUrl = getApiBaseUrl();` as the first line of the method body (before the URL construction on line 48).
  5. The singleton export at line 88 remains unchanged.

  **Verify:** File compiles. `npm run typecheck` passes. The singleton still exports correctly. Default behavior unchanged.

  **Refs:** REQ-INFRA-1, REQ-INFRA-3, REQ-INFRA-4; Scenario INFRA-2, INFRA-3; Design Decision 1.

---

## Phase 3: Integration

_Wire the store, hook, and UI together on the mode selection screen._

- [x] **3.1** Add server configuration section to `ModeSelectionScreen.tsx`

  **File:** `apps/web/src/components/ModeSelectionScreen.tsx` (modify)

  Changes:
  1. Add imports:
     - `import { useState } from 'react';`
     - `import { useHostConfigStore } from '../state/hostConfigStore';`
     - `import { useHealthCheck } from '../hooks/useHealthCheck';`
  2. Inside the component, read store: `const { apiHost, setApiHost } = useHostConfigStore();`.
  3. Call the health-check hook: `const { status, error } = useHealthCheck(apiHost);`.
  4. Add local state for error overlay: `const [showError, setShowError] = useState(false);`.
  5. Insert a `.server-config-section` `<div>` between `.mode-selection-header` and `.mode-selection-cards` per the design component tree:
     - `.server-config-row` containing:
       - `<label>` with text "Server".
       - `<input type="text">` bound to `apiHost` with `onChange` calling `setApiHost(e.target.value)`.
       - `.health-semaphore` containing:
         - `.health-dot` with a class modifier for state: `.health-dot-healthy`, `.health-dot-checking`, `.health-dot-error` (or `.health-dot-idle` when idle).
         - `<span className="health-label">` showing "Healthy" / "Checking..." / "Unreachable" / "" (idle).
         - `<button className="health-error-btn">` "View Error" visible only when `status === 'error'`, onClick toggles `setShowError(true)`.
     - `.health-error-detail` rendered conditionally when `showError && status === 'error'`:
       - `<p>` with the error message.
       - `<button>` "Dismiss" that calls `setShowError(false)`.
  6. When `status` changes away from `'error'`, hide the error overlay (reset `showError` to false — this can be done via a `useEffect` or by conditioning render on both `showError` and `status === 'error'`).
  7. The Online mode card gets `disabled` attribute + `mode-card-disabled` class when `status !== 'healthy'`. The Offline card is always enabled.
  8. The host input shows the host origin with placeholder `http://localhost:3001`. Empty value means proxy mode.

  > **Post-impl notes:** (a) Input shows host origin, not path. Placeholder is `http://localhost:3001`. (b) Online card is disabled when health is not green (`mode-card-disabled` class, `opacity: 0.4`, `cursor: not-allowed`, hover/active suppressed via `:not(:disabled)`).

  **Verify:** File compiles. `npm run typecheck` passes. The server config section renders between header and cards. Online card is disabled when not healthy.

  **Refs:** REQ-HOST-1 through REQ-HOST-5; REQ-SEM-1 through REQ-SEM-5; REQ-ERR-1 through REQ-ERR-6; REQ-GATE-1 through REQ-GATE-4; Scenarios HOST-1, HOST-2, HOST-3, SEM-1 through SEM-4, ERR-1 through ERR-5, GATE-1 through GATE-3; Design Decisions 3, 5, 7.

---

- [x] **3.2** Add CSS styles for the server configuration section

  **File:** `apps/web/src/components/ModeSelectionScreen.css` (modify)

  Add styles at the end of the file (before the `@media` query) for:
  1. `.server-config-section` — centered layout, appropriate margin between header and cards (~24px bottom margin), max-width matching the card row.
  2. `.server-config-row` — flex row with centered alignment, gap between items.
  3. `.server-config-row label` — color `#888`, font-size `13px`, white-space `nowrap`.
  4. `.server-config-row input[type="text"]` — dark theme input: `background: #1a1a1a`, `border: 1px solid #3a3a3a`, `color: #e8e8e8`, `border-radius: 6px`, `padding: 6px 10px`, `font-size: 13px`, `font-family: monospace`. Min-width ~260px. Focus state: `border-color: #4a9eff`, `outline: none`.
  5. `.health-semaphore` — flex row, centered, gap `6px`.
  6. `.health-dot` — 8x8px circle, `border-radius: 50%`, `flex-shrink: 0`. State modifiers:
     - `.health-dot-healthy`: `background: #44cc77`, `box-shadow: 0 0 4px rgba(68,204,119,0.5)`.
     - `.health-dot-checking`: `background: #ffaa00`, `box-shadow: 0 0 4px rgba(255,170,0,0.5)`, `animation: healthPulse 1.2s ease-in-out infinite`.
     - `.health-dot-error`: `background: #ff5555`, `box-shadow: 0 0 4px rgba(255,85,85,0.5)`.
     - `.health-dot-idle`: `display: none` (or hidden).
  7. `.health-label` — font-size `11px`, color matches dot state.
  8. `.health-error-btn` — small text button, `color: #ff5555`, `background: transparent`, `border: 1px solid rgba(255,85,85,0.3)`, `border-radius: 4px`, `cursor: pointer`, `font-size: 11px`.
  9. `.health-error-detail` — inline expandable section: `background: #1a1a1a`, `border: 1px solid #3a3a3a`, `border-radius: 8px`, `padding: 12px 16px`, `margin-top: 8px`, `font-size: 12px`, `color: #ff5555`. Dark theme (REQ-ERR-5).
  10. `.health-error-detail button` — dismiss button: `color: #888`, `background: transparent`, `border: 1px solid #3a3a3a`, `border-radius: 4px`, `cursor: pointer`, `font-size: 11px`, `margin-top: 8px`.
  11. `@keyframes healthPulse` — duplicate the pulse pattern from `ConnectionStatusIndicator.css` (0%,100% opacity:1; 50% opacity:0.4) per Design appendix.
  12. Responsive adjustments in the existing `@media (max-width: 640px)` block: stack `.server-config-row` vertically, shrink input width.

  **Verify:** Styles render correctly in the dark theme. Semaphore dot colors match the design appendix. `npm run build` passes (CSS is valid).

  **Refs:** REQ-SEM-1 through REQ-SEM-4; REQ-ERR-4, REQ-ERR-5; Design CSS appendix.

---

## Phase 4: Testing (Manual Verification)

_No test runner is configured. All verification is manual per the design's testing strategy._

- [ ] **4.1** Verify build and typecheck pass

  Run:
  ```
  npm run build
  npm run typecheck
  ```

  Both commands must complete with zero errors. This confirms all new and modified files compile correctly and no type errors were introduced.

  **Refs:** Proposal success criteria (last two items).

---

- [ ] **4.2** Verify default behavior (no regression)

  Start both dev servers (`npm run dev:web`, `npm run dev:api`).

  1. Load the mode selection screen. Verify the host input is visible and pre-filled with `/api` (Scenario HOST-1).
  2. Verify the semaphore shows yellow briefly, then turns green (Scenarios SEM-1, SEM-2, HEALTH-1).
  3. Without changing the host input, select Online mode. Verify the universe browser loads and API calls work (Scenario INFRA-3).
  4. Return to mode selection and select Offline mode. Verify the editor loads (Scenario NONBLOCK-2).

  **Refs:** REQ-INFRA-4; Scenarios HOST-1, HEALTH-1, SEM-1, SEM-2, INFRA-3, NONBLOCK-2.

---

- [ ] **4.3** Verify custom host and health-check failure states

  1. Change the host input to `http://localhost:3001`. Verify semaphore turns yellow then green (Scenario SEM-4, HEALTH-2).
  2. Stop the backend. Change the host input to `http://localhost:3001`. Verify semaphore turns yellow then red (Scenarios HEALTH-3, SEM-3).
  3. Verify "View Error" button appears (Scenario ERR-1). Click it. Verify error overlay appears with a meaningful message (Scenario ERR-2).
  4. Click "Dismiss". Verify overlay disappears (Scenario ERR-3).
  5. Verify error overlay matches dark theme styling (Scenario ERR-4).
  6. While error overlay is visible, verify clicking a mode card still works (Scenario ERR-5, NONBLOCK-1).

  **Refs:** REQ-HEALTH-3, REQ-HEALTH-5; REQ-SEM-3, REQ-SEM-4, REQ-SEM-5; REQ-ERR-1 through REQ-ERR-6; REQ-NONBLOCK-1, REQ-NONBLOCK-2.

---

- [ ] **4.4** Verify debounce and edge cases

  1. Open browser DevTools Network tab. Type a URL character by character. Verify health check requests do not fire on every keystroke — only ~500ms after the last keystroke (Design Decision 4).
  2. Enter `not-a-url` in the host input. Verify semaphore turns red with a network error (Scenario HOST-3 edge case).
  3. Enter a URL with a trailing slash (e.g., `http://localhost:3001/`). Verify API calls still work (the provider strips trailing slashes — REQ-PROV-3, Scenario PROV-2).
  4. Reload the page. Verify the health check fires automatically on mount (Scenario HEALTH-1, REQ-HEALTH-2).

  **Refs:** REQ-HEALTH-3; REQ-PROV-3; Scenarios HOST-3, HEALTH-2, PROV-2, PROV-3.

---

## Phase 5: Cleanup

- [x] **5.1** Verify no unused code or stale references remain

  Check that:
  1. The removed `resolveBaseUrl()` functions in `httpUniverseApiClient.ts` and `sseCommandStream.ts` are fully deleted (no lingering dead code).
  2. No file still imports `resolveBaseUrl` from those modules.
  3. No `import.meta.env.VITE_API_BASE_URL` reads remain in `httpUniverseApiClient.ts` or `sseCommandStream.ts` (only the provider and the store should read it).
  4. All new files have appropriate JSDoc/header comments matching the existing style (see `appModeStore.ts` header comment pattern).

  **Refs:** Design file changes table; existing code conventions.

---

- [x] **5.2** Final build verification

  Run `npm run build` and `npm run typecheck` one final time after all changes and cleanup. Both must pass with zero errors and zero warnings related to the changed files.

  **Refs:** Proposal success criteria.
