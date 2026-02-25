# Proposal: host-config-health-check

**Change name:** `host-config-health-check`
**Date:** 2026-02-25
**Status:** Proposed

---

## Intent

The mode selection screen currently offers an Offline / Online choice with no way for the user to configure *which* server the application connects to, and no feedback about whether that server is reachable. Users who self-host the backend or develop against a non-default API address must edit `.env` and restart the dev server.

This change adds a host configuration input and a live health-check semaphore to the mode selection screen so that users can point the application at any API host at runtime and immediately see whether the server is healthy before entering online mode. When the health check fails, the user can inspect the error details without leaving the screen.

---

## Scope

### In scope

- **Host configuration input** on `ModeSelectionScreen` — a text field showing the API host origin (e.g. `http://localhost:3001`), with that value as the placeholder. Empty means proxy mode.
- **Zustand store for the host URL** — a new `hostConfigStore` holding the user-editable host origin, defaulting to `import.meta.env.VITE_API_HOST ?? ''` (empty string = proxy mode).
- **API base URL provider** — a thin module that resolves the effective base URL: when the host is non-empty, returns the host directly (no `/api` suffix appended — backend routes live at root level); when the host is empty, returns `'/api'` for Vite proxy mode. Replaces direct `import.meta.env` reads in existing infra singletons.
- **Health-check mechanism** — a `fetch` call to `GET {baseUrl}/health` that runs automatically when the mode selection screen mounts and re-runs when the host URL changes. Returns a tri-state status (green / yellow / red).
- **Semaphore indicator** — a colored dot next to the host input reflecting health-check status (green = healthy, yellow = checking, red = error). Reuses the existing CSS dot pattern from `ConnectionStatusIndicator.css`.
- **Error detail overlay** — a small, dismissible overlay shown when the user clicks a "View Error" button (visible only in the red state) that displays the error message.
- **Refactor of `resolveBaseUrl()`** in `httpUniverseApiClient.ts` and `sseCommandStream.ts` to read from the new provider instead of `import.meta.env` directly.

### Out of scope

- **CORS configuration changes on the backend** — if the user enters a remote host, they are responsible for configuring CORS on that server. The UI may display a note about this, but no backend CORS changes are included.
- **Persisting the host URL across sessions** (e.g., localStorage) — the `appModeStore` pattern in this codebase is session-only; this change follows that precedent. Persistence can be added later.
- **~~Disabling or gating the Online card based on health-check status~~** — _Moved to in-scope._ The Online mode card is now disabled (dimmed, `disabled` attribute, hover/active suppressed) when health status is not `'healthy'`.
- **Full modal/dialog system** — the error overlay is a lightweight, purpose-built component, not a reusable modal framework.
- **Backend health endpoint changes** — `GET /health` already returns `{ ok: true, uptime }` and needs no modification.
- **Advanced settings UI** (collapsible section, "Advanced" toggle) — the host input is always visible in this iteration. A collapsible wrapper can be added in a follow-up.

---

## Approach

The change follows **Approach B from the exploration**: a new Zustand config store combined with a thin provider abstraction that centralizes base-URL resolution.

A new `hostConfigStore` will hold the user-editable API host origin (defaulting to `import.meta.env.VITE_API_HOST ?? ''`). A companion `apiBaseUrlProvider` module will export a `getApiBaseUrl()` function that reads from the store: when the host is non-empty, it returns the host as-is (backend routes are at root level, not under `/api`); when the host is empty, it returns `'/api'` for Vite proxy mode. The two existing infra modules that resolve the base URL (`httpUniverseApiClient.ts` and `sseCommandStream.ts`) will be updated to call `getApiBaseUrl()` instead of reading the environment variable directly. This is a narrow, surgical change to the infra layer — the singleton objects themselves remain unchanged; only their internal URL resolution becomes dynamic.

On the UI side, the `ModeSelectionScreen` component will gain a "Server Configuration" section positioned between the subtitle and the mode cards. This section contains a text input for the host origin (placeholder: `http://localhost:3001`), a semaphore dot indicating health status, and a conditional "View Error" button. The Online mode card is disabled when the health status is not `'healthy'` (dimmed with `opacity: 0.4`, `cursor: not-allowed`, hover/active effects suppressed). Health checking is performed via a `useHealthCheck` custom hook that issues `fetch(baseUrl + '/health')` with a short timeout, manages the tri-state lifecycle (yellow while in-flight, green on success, red on failure), and exposes the error message when applicable. The hook re-runs when the debounced host value changes and on initial mount.

The semaphore dot reuses the proven CSS pattern already established in `ConnectionStatusIndicator.css` (green/amber/red dot with pulsing animation during the connecting state). The error overlay is a small absolute-positioned box styled to match the dark theme, shown inline below the health indicator when toggled.

---

## Affected Areas

### Frontend

- `apps/web/src/components/ModeSelectionScreen.tsx` — **Modified**: add host input, semaphore, error overlay, and health-check integration.
- `apps/web/src/components/ModeSelectionScreen.css` — **Modified**: add styles for the server configuration section, input field, semaphore dot, error button, and error overlay.
- `apps/web/src/state/hostConfigStore.ts` — **New**: Zustand store with `{ apiHost: string; setApiHost(url: string): void }`.
- `apps/web/src/infra/api/apiBaseUrlProvider.ts` — **New**: thin provider exporting `getApiBaseUrl(): string`.
- `apps/web/src/hooks/useHealthCheck.ts` — **New**: custom hook managing health-check fetch lifecycle and tri-state status.
- `apps/web/src/infra/api/httpUniverseApiClient.ts` — **Modified**: replace `resolveBaseUrl()` internals to call `getApiBaseUrl()`.
- `apps/web/src/infra/realtime/sseCommandStream.ts` — **Modified**: replace `resolveBaseUrl()` internals to call `getApiBaseUrl()`.

### Backend

- No backend changes required. `GET /health` already exists and returns the expected shape.

### Shared

- No shared package changes.

### Config

- No configuration file changes. The existing `VITE_API_BASE_URL` env var continues to serve as the compile-time default.

---

## Risks

| # | Risk | Likelihood | Impact | Mitigation |
|---|------|-----------|--------|------------|
| 1 | **CORS rejection on remote hosts** — browsers block cross-origin `fetch` when the remote server does not include the frontend origin in `Access-Control-Allow-Origin`. | High (for any non-localhost host) | Medium — health check shows red; online mode will also fail. | The health-check error message will naturally surface CORS errors. A brief note near the host input can explain that the remote server must allow the frontend's origin. No backend CORS changes are in scope. |
| 2 | **Health-check false positive via Vite proxy** — with the default `/api` base URL, Vite's dev proxy forwards to localhost:3001. If the backend is down, the proxy returns a 502/504, not a clean health response. | Medium (dev-only) | Low — misleading yellow-then-red instead of immediate red. | The health-check logic must treat non-JSON responses and non-200 status codes as errors, including proxy gateway errors. |
| 3 | **Module initialization order** — `httpUniverseApiClient` and `sseCommandStream` are module-level singletons that resolve their base URL at import time. If imported before any store hydration, the provider falls back to `import.meta.env`, which is the correct default. | Low | Low — fallback behavior is identical to current behavior. | The provider's fallback is `import.meta.env.VITE_API_BASE_URL`, matching today's behavior exactly. No ordering risk for the default path. |
| 4 | **Stale SSE connection after host change** — if the user somehow changes the host after an SSE connection is already open, the old connection will continue using the old URL. | Very Low (host is set before entering online mode) | Low | The host input exists only on the mode selection screen, which is shown before online mode is entered. By the time SSE connects, the host value is finalized. |

---

## Rollback Plan

All changes are additive and isolated to the frontend layer:

1. **Revert the `ModeSelectionScreen` changes** — remove the server configuration section, restoring the original two-card layout.
2. **Revert `resolveBaseUrl()`** in `httpUniverseApiClient.ts` and `sseCommandStream.ts` to read `import.meta.env.VITE_API_BASE_URL` directly.
3. **Delete new files**: `hostConfigStore.ts`, `apiBaseUrlProvider.ts`, `useHealthCheck.ts`.
4. **Remove CSS additions** from `ModeSelectionScreen.css`.

Since no backend changes, database migrations, or shared-package changes are involved, rollback is a single revert commit with zero side effects.

---

## Dependencies

- **`GET /health` endpoint** — already exists at `apps/api/src/routes/health.ts`. No work required.
- **`ConnectionStatusIndicator.css`** — existing CSS dot pattern to reference (not import directly; the relevant styles will be adapted into `ModeSelectionScreen.css` to avoid coupling).
- **Zustand** — already a project dependency.
- **No new npm packages required.**

---

## Success Criteria

- [ ] The mode selection screen displays a text input for the API host origin, with placeholder `http://localhost:3001` (derived from `VITE_API_HOST`, empty by default for proxy mode).
- [ ] Editing the input updates the host value used by the application when entering online mode.
- [ ] A semaphore dot is visible next to the host input, showing **yellow** while a health check is in progress.
- [ ] The semaphore turns **green** when `GET {host}/health` returns a 200 with a JSON body containing `ok: true`.
- [ ] The semaphore turns **red** when the health check fails (network error, non-200 status, non-JSON response, timeout).
- [ ] The health check runs automatically when the mode selection screen mounts.
- [ ] The health check re-runs when the user changes the host URL (with appropriate debouncing to avoid excessive requests).
- [ ] When the semaphore is red, a "View Error" button appears. Clicking it shows an overlay with the error message.
- [ ] The error overlay can be dismissed.
- [ ] The Online mode card is disabled (dimmed, non-clickable) when health status is not `'healthy'`.
- [ ] Existing API calls (`httpUniverseApiClient`, `sseCommandStream`) use the host value from the new provider, returning the host directly when set or `'/api'` in proxy mode.
- [ ] The default behavior (no user interaction with the host input) is identical to the current behavior — no regression.
- [ ] `npm run build` passes with no errors.
- [ ] `npm run typecheck` passes with no errors.
