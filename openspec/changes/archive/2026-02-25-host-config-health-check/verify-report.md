# Verify Report: host-config-health-check

**Verdict**: PASS_WITH_WARNINGS
**Date**: 2026-02-25

## Summary

- Build: FAIL (pre-existing errors only; zero errors in changed files)
- Typecheck: FAIL (pre-existing errors only; zero errors in changed files)
- Tests: N/A (no test runner configured)
- Tasks complete: 10/14 (Phase 4 tasks 4.1-4.4 are manual verification, intentionally left unchecked)

## Completeness

- [x] All automated tasks (Phases 1, 2, 3, 5) marked done — 10/10
- [ ] Phase 4 tasks (4.1-4.4) are manual verification — 0/4 left unchecked as expected

Uncompleted tasks: Tasks 4.1, 4.2, 4.3, 4.4 are manual QA tasks that require running dev servers and browser testing. These are marked `[ ]` in `tasks.md` and the tasks file header explicitly notes "Phase 4 requires manual verification." This is expected and not a blocking issue.

## Correctness

### Requirements Coverage

| Requirement | Status | Notes |
|-------------|--------|-------|
| REQ-HOST-1 (text input for host URL) | PASS | Input rendered in `.server-config-section` in `ModeSelectionScreen.tsx` line 41-46 |
| REQ-HOST-2 (pre-filled with env var) | PASS | `useHostConfigStore` reads `apiHost` which defaults to `import.meta.env.VITE_API_BASE_URL ?? '/api'` |
| REQ-HOST-3 (editable before mode selection) | PASS | `onChange` calls `setApiHost(e.target.value)` |
| REQ-HOST-4 (accepts any URL format) | PASS | No validation on input; any string accepted |
| REQ-HOST-5 (updated value is effective URL) | PASS | Store feeds `apiBaseUrlProvider`, which feeds infra singletons |
| REQ-HEALTH-1 (GET {host}/health) | PASS | `useHealthCheck.ts` line 62: `fetch(\`${baseUrl}/health\`, { signal })` |
| REQ-HEALTH-2 (auto-run on mount) | PASS | `isFirstRun.current` fires immediately, no debounce |
| REQ-HEALTH-3 (re-run on host change, debounced) | PASS | `useEffect` on `[baseUrl]`, 500ms debounce for non-first runs |
| REQ-HEALTH-4 (success = 200 + JSON ok:true) | PASS | Lines 67-90 check `res.ok`, parse JSON, verify `body.ok` |
| REQ-HEALTH-5 (failure cases) | PASS | Network error, non-200, non-JSON, missing ok — all handled |
| REQ-HEALTH-6 (proxy gateway errors) | PASS | Non-200 responses (502/504) fall into `!res.ok` branch |
| REQ-SEM-1 (semaphore adjacent to input) | PASS | `.health-semaphore` div inside `.server-config-row` after input |
| REQ-SEM-2 (yellow while checking) | PASS | `health-dot-checking` class with yellow color |
| REQ-SEM-3 (green on success) | PASS | `health-dot-healthy` class with green color |
| REQ-SEM-4 (red on failure) | PASS | `health-dot-error` class with red color |
| REQ-SEM-5 (resets to yellow on re-check) | PASS | Hook sets `'checking'` before fetch on every run |
| REQ-ERR-1 (View Error visible on red) | PASS | `{status === 'error' && <button>View Error</button>}` |
| REQ-ERR-2 (View Error hidden on green/yellow) | PASS | Conditional render only for `status === 'error'` |
| REQ-ERR-3 (overlay shows error message) | PASS | `showError && status === 'error'` renders `.health-error-detail` with `{error}` |
| REQ-ERR-4 (overlay dismissible) | PASS | Dismiss button calls `setShowError(false)` |
| REQ-ERR-5 (dark theme) | PASS | CSS uses dark bg `#1a1a1a`, border `#3a3a3a`, red text `#ff5555` |
| REQ-ERR-6 (overlay does not obstruct cards) | PASS | Inline `<div>` in document flow, not absolute/fixed positioned |
| REQ-NONBLOCK-1 (health does not block online) | PASS | No conditional rendering/disabling on mode cards |
| REQ-NONBLOCK-2 (user can select either mode) | PASS | Mode cards are always clickable regardless of status |
| REQ-STATE-1 (runtime mutable store) | PASS | Zustand store with `set({ apiHost: url })` |
| REQ-STATE-2 (default to env var or /api) | PASS | `import.meta.env.VITE_API_BASE_URL ?? '/api'` |
| REQ-STATE-3 (setter exposed) | PASS | `setApiHost` action in store |
| REQ-STATE-4 (session-scoped, no persist) | PASS | No persist middleware used |
| REQ-PROV-1 (centralized provider) | PASS | `getApiBaseUrl()` in `apiBaseUrlProvider.ts` |
| REQ-PROV-2 (returns current store value) | PASS | `useHostConfigStore.getState().apiHost` |
| REQ-PROV-3 (strips trailing slash) | PASS | `.replace(/\/+$/, '')` |
| REQ-PROV-4 (backward-compatible default) | PASS | Store defaults to env var; provider reads store |
| REQ-INFRA-1 (infra uses centralized provider) | PASS | Both clients import `getApiBaseUrl` |
| REQ-INFRA-2 (HTTP client per-request resolution) | PASS | `const baseUrl = getApiBaseUrl()` in each method |
| REQ-INFRA-3 (SSE per-connection resolution) | PASS | `const baseUrl = getApiBaseUrl()` in `connect()` |
| REQ-INFRA-4 (default behavior unchanged) | PASS | Fallback chain identical to prior `resolveBaseUrl()` |

### Scenario Coverage

All 21 scenarios from both specs (HOST-1 through HOST-3, HEALTH-1 through HEALTH-6, SEM-1 through SEM-4, ERR-1 through ERR-5, NONBLOCK-1 through NONBLOCK-2, STATE-1 through STATE-4, PROV-1 through PROV-3, INFRA-1 through INFRA-4) have corresponding implementation code. Manual testing (Phase 4) has not been performed.

### Mismatches: None

## Coherence

### Design Decisions

| Decision | Status | Notes |
|----------|--------|-------|
| D1: Per-request URL resolution | PASS | Each method in `httpUniverseApiClient` calls `getApiBaseUrl()`. `sseCommandStream.connect()` calls it per-connection. The old `resolveBaseUrl()` functions are removed. |
| D2: Provider at `infra/api/apiBaseUrlProvider.ts` | PASS | File exists at correct path, exports `getApiBaseUrl(): string`, reads store with fallback. |
| D3: Custom hook with local state | PASS | `useHealthCheck` uses `useState` + `useEffect`, not a Zustand store. |
| D4: 500ms debounce inside the hook | PASS | `setTimeout(runHealthCheck, DEBOUNCE_MS)` where `DEBOUNCE_MS = 500`. First run fires immediately. |
| D5: Inline expandable error overlay | PASS | `<div className="health-error-detail">` rendered in document flow, toggled by `showError` state. |
| D6: Store defaults to env var | PASS | `apiHost: import.meta.env.VITE_API_BASE_URL ?? '/api'` |

### Deviations

1. **Error dot animation**: The design appendix table specifies the error (red) dot should have a pulse animation (`connectionPulse 1.2s ease-in-out infinite`), matching the `ConnectionStatusIndicator.css` pattern where the error dot pulses. The implementation does NOT add a pulse animation to `.health-dot-error`. Only `.health-dot-checking` has the `healthPulse` animation. This is a minor deviation — arguably a UI improvement (static red = definitive failure, pulsing yellow = in-progress), but it does not match the design appendix table literally. **Classified as SUGGESTION.**

## CRITICAL Issues

None.

## WARNING Issues

**W1 — Phase 4 (manual verification) not performed**
Tasks 4.1-4.4 require running dev servers and browser-based testing. These are unchecked in `tasks.md`. While the tasks file header acknowledges this, the actual runtime behavior (semaphore colors, debounce timing, error overlay UX) has not been validated. The implementation looks correct by code review, but runtime confirmation is recommended before archival.

**W2 — Build and typecheck both fail (pre-existing)**
Both `npm run build` and `npm run typecheck` fail due to ~50 pre-existing type errors in unrelated files (e.g., `AsteroidBeltObject.tsx`, `proceduralGenerator.ts`, `StarEditorPanel.tsx`). Zero of these errors are in the 7 files changed by this feature. This is noted per the verification instructions but is not caused by this change.

## SUGGESTION Issues

**S1 — Error dot lacks pulse animation per design appendix**
The design appendix CSS reference table specifies that the error (red) dot should pulse with `connectionPulse 1.2s ease-in-out infinite`, matching `ConnectionStatusIndicator.css`. The implementation omits this — the red dot is static. The current behavior is arguably better UX (pulsing suggests transience; a static red dot conveys definitive failure), but it deviates from the design appendix. If the deviation is intentional, the design document should be updated for consistency.

**S2 — Consider `aria-live` for semaphore status accessibility**
The health semaphore changes state dynamically (idle -> checking -> healthy/error). Screen reader users will not be notified of these transitions. Adding `aria-live="polite"` to the `.health-semaphore` container or the `.health-label` span would improve accessibility. This is out of scope for the current change but worth noting for a follow-up.

**S3 — Error overlay auto-dismissal on status change**
Task 3.1 step 6 mentions: "When status changes away from 'error', hide the error overlay (reset showError to false)." The implementation handles this via the render condition `showError && status === 'error'` (line 63 of `ModeSelectionScreen.tsx`), which visually hides the overlay when status is no longer `'error'`. However, the `showError` state variable remains `true` internally. If the health check fails again, the error overlay will reappear immediately without the user clicking "View Error" again. This could be surprising UX. A `useEffect` that resets `showError = false` when `status` changes away from `'error'` would make the behavior more explicit.

## Verification Commands Output

### `npm run typecheck`
```
Exit code 1
All errors are in pre-existing files:
  - AsteroidBeltObject.tsx (3 errors)
  - GroupBox.tsx (2 errors)
  - NebulaObject.tsx (1 error)
  - OrbitRing.tsx (1 error)
  - RogueTrajectory.tsx (2 errors)
  - SmallBodyFieldObject.tsx (1 error)
  - StarObject.tsx (1 error)
  - Taskbar.tsx (1 error)
  - Window.tsx (2 errors)
  - proceduralGenerator.ts (17 errors)
  - BodyEditorPanel.tsx (2 errors)
  - GroupEditorPanel.tsx (2 errors)
  - StarEditorPanel.tsx (5 errors)
  - LagrangePointDisplay.tsx (1 error)
  - generator-examples.ts (1 error)
  - groupUtils.ts (2 errors)
  - computeStats.ts (1 error)

ZERO errors in changed files: hostConfigStore.ts, apiBaseUrlProvider.ts,
useHealthCheck.ts, httpUniverseApiClient.ts, sseCommandStream.ts,
ModeSelectionScreen.tsx, ModeSelectionScreen.css
```

### `npm run build`
```
Exit code 1
Same pre-existing errors as typecheck (build runs tsc before vite build).
ZERO errors in changed files.
```

### Stale reference check
```
grep "resolveBaseUrl" — 0 matches (fully removed)
grep "import.meta.env.VITE_API_BASE_URL" — only in:
  - apiBaseUrlProvider.ts (defensive fallback — correct)
  - hostConfigStore.ts (default initialization — correct)
```

## Scope Verification

### Files changed (expected vs. actual)

| Proposal file | Action | Found | Status |
|---------------|--------|-------|--------|
| `apps/web/src/state/hostConfigStore.ts` | Add | New (untracked) | PASS |
| `apps/web/src/infra/api/apiBaseUrlProvider.ts` | Add | New (untracked) | PASS |
| `apps/web/src/hooks/useHealthCheck.ts` | Add | New (untracked) | PASS |
| `apps/web/src/infra/api/httpUniverseApiClient.ts` | Modify | Modified (unstaged) | PASS |
| `apps/web/src/infra/realtime/sseCommandStream.ts` | Modify | Modified (unstaged) | PASS |
| `apps/web/src/components/ModeSelectionScreen.tsx` | Modify | Modified (unstaged) | PASS |
| `apps/web/src/components/ModeSelectionScreen.css` | Modify | Modified (unstaged) | PASS |

No unrelated files were modified. The change is scoped exactly as proposed: 3 new files, 4 modified files, all within `apps/web/`.
