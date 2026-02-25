# Exploration: host-config-health-check

## Current State

### Affected Areas (Concrete File Paths)

**Mode Selection Screen (primary target)**
- `apps/web/src/components/ModeSelectionScreen.tsx` — the full-screen gate shown when `mode === null`. Currently renders two cards (Offline / Online) with a single prop `onSelect: (mode: AppMode) => void`. Pure presentational; no state logic.
- `apps/web/src/components/ModeSelectionScreen.css` — dark-theme CSS with card layout, hover transitions, responsive breakpoint at 640 px.

**App-level routing (mode gate)**
- `apps/web/src/App.tsx` — orchestrates the mode selection flow: renders `<ModeSelectionScreen>` when `mode === null`, `<OnlineBrowser>` when online + browsing, and `<AppContent>` when editing. The `onSelect` callback calls `setMode()` from `appModeStore`.
- `apps/web/src/state/appModeStore.ts` — Zustand store with `mode: AppMode | null`, `setMode()`, `clearMode()`. Session-only (not persisted).
- `apps/web/src/types/appMode.ts` — `AppMode = 'online' | 'offline'`.

**API host configuration**
- `apps/web/.env` / `apps/web/.env.example` — both contain `VITE_API_BASE_URL=/api`. This is currently a **relative path** designed to work with Vite's dev proxy.
- `apps/web/vite.config.ts` — dev proxy: all `/api` requests are forwarded to `http://localhost:3001` with the `/api` prefix stripped.
- `apps/web/src/infra/api/httpUniverseApiClient.ts` — reads `import.meta.env.VITE_API_BASE_URL` via `resolveBaseUrl()`. Used to build API fetch URLs. Throws if the env var is missing. A **module-level singleton** is created at import time.
- `apps/web/src/infra/realtime/sseCommandStream.ts` — also reads `VITE_API_BASE_URL` via its own `resolveBaseUrl()`. Builds SSE EventSource URLs. Another module-level singleton.
- `apps/web/src/infra/api/universeApiClientProvider.ts` — re-exports `httpUniverseApiClient` as `universeApiClient`. Acts as the singleton swap point (mock vs. real).

**Backend health endpoint**
- `apps/api/src/routes/health.ts` — `GET /health` returning `{ ok: true, uptime: <seconds> }`. Registered in `app.ts` as `app.use(healthRouter)`.
- `apps/api/src/app.ts` — Express app with CORS, JSON body parsing, pino-http logging, health router, universe router, commands router, MCP endpoint.
- `apps/api/src/config/cors.ts` — `ALLOWED_ORIGINS = ['http://localhost:5173']`.

**Existing connection status patterns (reference)**
- `apps/web/src/components/ConnectionStatusIndicator.tsx` — pill component using a colored dot + label for SSE status (`idle | connecting | connected | error`). Visible in `AppHeader` only during online mode. Reads from `realtimeStore`.
- `apps/web/src/components/ConnectionStatusIndicator.css` — green/amber/red dot with pulsing animation. This is the exact semaphore pattern the user wants, already proven in the codebase.
- `apps/web/src/state/realtimeStore.ts` — `ConnectionStatus` type, Zustand store for SSE state.
- `apps/web/src/components/RemoteCommandToast.tsx` — toast notification UI pattern (auto-dismiss, fixed-position).
- `apps/web/src/components/Window.tsx` — draggable/resizable panel with header controls. Could inform the error popup design if a modal-like approach is used.

### Existing Patterns and Conventions

1. **Zustand stores** — all state is in `apps/web/src/state/*.ts`. Stores are small, single-responsibility, created with `create<T>()`. No middleware (no persist, no immer).
2. **Ports and adapters** — infrastructure lives under `apps/web/src/infra/`. Ports (interfaces) in `apps/web/src/app/ports/`. Adapters are factory functions exporting singletons.
3. **CSS approach** — plain CSS files co-located with components (`ComponentName.css` imported in `ComponentName.tsx`). Dark theme throughout. No CSS modules, no styled-components, no Tailwind.
4. **API base URL** — currently compile-time only (`import.meta.env.VITE_API_BASE_URL`). Both `httpUniverseApiClient` and `sseCommandStream` resolve this at module initialization. There is no runtime override mechanism.
5. **No existing modal/popup** — the codebase uses `window.prompt()` for the one user input (universe name). The Window component is a full desktop-like window manager, not a lightweight modal. There is no lightweight modal/dialog pattern.

### Dependencies and Constraints

- **Vite proxy** — the current `.env` value `/api` only works because Vite's dev server proxies `/api/*` to `localhost:3001`. If the user sets a full URL (e.g., `https://myserver.com:3001`), the proxy is bypassed entirely, which is the desired behavior for remote hosts. However, CORS must be configured on the remote server for this to work.
- **Module-level singletons** — `httpUniverseApiClient` and `sseCommandStream` resolve the base URL once at import time. To support runtime host changes, either: (a) the singletons must be replaced with factories that read a dynamic value, or (b) a new provider layer must be introduced that can be swapped at runtime.
- **No test runner** — there is no testing infrastructure. All verification is manual.
- **Health endpoint returns 200 with `{ ok: true, uptime }` on success** — any non-200 or network failure indicates the server is unreachable.

---

## Approach Comparison

| # | Approach | Pros | Cons | Complexity |
|---|----------|------|------|------------|
| A | **Zustand config store + refactored singletons** — New `hostConfigStore` holds the user-editable host URL. `httpUniverseApiClient` and `sseCommandStream` are refactored to read the base URL from the store (or a shared getter) instead of `import.meta.env` at module level. The `ModeSelectionScreen` adds a host input + health check section below the cards. | Clean runtime override; single source of truth for host; health check can use the same base URL; store pattern is consistent with codebase. | Requires touching two infra singletons to make them dynamic; module-level singleton pattern must change to lazy or factory-with-getter. | **Medium** |
| B | **Zustand config store + new provider abstraction** — Like (A), but instead of refactoring existing singletons, introduce a new `apiHostProvider` module that wraps `resolveBaseUrl()` and reads from the store with a fallback to `import.meta.env`. Existing code calls `getBaseUrl()` from the provider. Singletons remain singletons but call the provider each time. | Minimal change to existing infra modules (just swap one line in `resolveBaseUrl`); provider is a clean abstraction. | Adds one more indirection layer; the "singleton" objects still exist but their internal calls become dynamic (fetch URL read per-request, which is fine for fetch but slightly odd for the SSE singleton whose URL is locked at connect time). | **Low–Medium** |
| C | **LocalStorage-persisted host + reload** — Store the custom host in localStorage. On the mode selection screen, provide an input. When the user changes the host and enters online mode, set a flag and reload the page so the Vite env override takes effect. | Simplest change; no infra refactoring needed. | Terrible UX (full-page reload); doesn't actually work because `import.meta.env` is compile-time, not runtime; localStorage can't override Vite env vars. | N/A (not viable) |
| D | **Host input on ModeSelectionScreen only, passed as prop through the tree** — The mode selection screen collects the host, passes it to `App`, which passes it down. No store involved. | No new store; explicit data flow. | Prop-drilling through App → OnlineBrowser → every consumer; breaks the existing singleton provider pattern; doesn't scale. | **Medium–High** |

---

## Recommended Approach

**Approach B: Zustand config store + new provider abstraction** is recommended.

**Rationale:**
- It introduces the smallest diff to the existing infra modules (`httpUniverseApiClient.ts` and `sseCommandStream.ts`) — only `resolveBaseUrl()` changes from reading `import.meta.env` directly to calling a shared `getApiBaseUrl()` function.
- The new `hostConfigStore` follows the existing Zustand store pattern (small, single-purpose, co-located in `state/`).
- The new `apiBaseUrlProvider` is a thin module under `infra/api/` that encapsulates the fallback logic: read from store first, fall back to `import.meta.env`.
- The health check is a straightforward `fetch(baseUrl + '/health')` triggered on mount and on host-change, with state managed either locally in the `ModeSelectionScreen` or via the config store.
- The error popup can be a simple inline expandable section or a small absolute-positioned overlay (no need for the heavy Window component).

**Key design points for the Advocate:**
1. **New Zustand store**: `apps/web/src/state/hostConfigStore.ts` with `{ apiHost: string; setApiHost(url: string): void }`. Default value: `import.meta.env.VITE_API_HOST ?? ''` — an empty string means proxy mode, a non-empty value is a host origin like `http://localhost:3001`.
2. **New provider**: `apps/web/src/infra/api/apiBaseUrlProvider.ts` exporting `getApiBaseUrl(): string` — reads from `hostConfigStore`. When the host is non-empty, returns it as-is (no `/api` suffix); when empty, returns `'/api'` for Vite proxy mode.
3. **Refactor `resolveBaseUrl()`** in `httpUniverseApiClient.ts` and `sseCommandStream.ts` to call `getApiBaseUrl()` instead of reading `import.meta.env` directly.
4. **Health check**: a `useHealthCheck(baseUrl)` custom hook (or inline effect) that fetches `GET {baseUrl}/health` with a timeout, returning `{ status: 'green' | 'yellow' | 'red'; error?: string }`.
5. **ModeSelectionScreen changes**: Add a "Server Configuration" section below the subtitle with:
   - A text input for the host origin (pre-filled from store/env, placeholder `http://localhost:3001`). The input shows the host origin, not a path segment.
   - A semaphore dot (reuse the CSS pattern from `ConnectionStatusIndicator.css`).
   - A small "View Error" button (visible only on red) that toggles an error detail overlay.
   - The **Online mode card is disabled** (visually dimmed + `disabled` attribute) when health status is not `'healthy'`.
6. **Error detail overlay**: A small absolute-positioned box (not a full modal) showing the error message and a "Dismiss" button. Follows the dark-theme styling.

---

## Risks

1. **CORS on remote hosts** — If the user enters a remote server URL (not localhost), the browser will enforce CORS. The backend's `ALLOWED_ORIGINS` currently only includes `http://localhost:5173`. The user must configure their remote server's CORS accordingly. This is out of scope for this change, but should be documented or noted in the UI.
2. **SSE reconnection with new host** — If the user changes the host URL after having already established an SSE connection, the old connection uses the old URL. Since the host is set on the mode selection screen (before any SSE connection is opened), this is not a real problem in practice, but the code should be defensive.
3. **Health check false positives via proxy** — In the default dev setup (`/api` proxied to `localhost:3001`), a health check to `/api/health` will succeed as long as Vite is running, even if the backend is down (Vite proxy returns 502/504). The health check should handle non-JSON responses and proxy errors gracefully.
4. **Module initialization order** — If `httpUniverseApiClient` is imported before the store is initialized, `getApiBaseUrl()` will fall back to `import.meta.env`, which is fine. But this ordering dependency should be considered.

---

## Open Questions

1. **Should the host input be visible by default or hidden behind an "Advanced" toggle?** — For a cleaner UX, it could be collapsed by default and expanded when the user clicks "Configure Server" or similar. The Advocate should decide.
2. **Should the health check auto-run on page load or only when the user interacts with the input?** — The user's request says "dynamically when entering the screen," which implies auto-run on mount with the current/default host.
3. **Should the host value be persisted (e.g., localStorage) across sessions?** — The `appModeStore` is explicitly session-only, but users who always connect to the same remote server might want persistence. The Advocate should decide.
4. **Should the Online card be disabled (or show a warning) when the health check is red?** — **Resolved: Yes.** The Online mode card is disabled (`disabled` attribute + `mode-card-disabled` CSS class with `opacity: 0.4` and `cursor: not-allowed`) when the health status is not `'healthy'`. Hover/active effects are suppressed via `:not(:disabled)`.
