# Change Request: Frontend Online/Offline Mode Selection

## Summary

Introduce a mode selection screen as the first interaction point when entering the Solar System Constructor application. Users will choose between **offline mode** (current behavior: localStorage persistence) and **online mode** (backed by the API — mocked for now). This change prepares the frontend architecture for backend integration without actually implementing HTTP communication yet.

## Context

The frontend currently operates exclusively in offline mode, persisting universe state to localStorage via the `localStorageSystemRepository` adapter (hexagonal port/adapter pattern already in place at `apps/web/src/app/ports/systemRepository.ts`). The backend API exists at `apps/api/` with full CRUD universe endpoints (`POST/GET/PUT/DELETE /universes`), but the frontend has no awareness of it.

Before wiring real HTTP calls, we want to:

1. Let the user explicitly choose a session mode (online vs offline).
2. Establish a frontend-side API port for universe operations that mirrors the backend's contract.
3. Provide a mock adapter for the online-mode port, so the UI can be developed and tested end-to-end without a running backend.

This is the first preparatory step toward full backend integration.

## Goals

- Present a **mode selection screen** at application startup where users choose "Online" or "Offline".
- Create a **Zustand store** for application mode so all layers can react to the choice.
- Define a **frontend API port** (`UniverseApiClient` interface) that mirrors the backend's universe CRUD contract.
- Provide a **mock in-memory adapter** implementing that port, returning realistic stubbed data.
- Gate the existing `App` component behind the mode choice (render the current experience only after a mode is selected).
- Existing offline behavior must remain fully functional and unchanged.

## Non-goals

- Implementing real HTTP communication with the backend (fetch/axios calls).
- Adding authentication, error-retry, or connection-status UI.
- Changing the existing offline persistence logic (localStorage adapter stays as-is).
- Modifying the backend API.
- Changing the behavior of the universe within the 3D scene after mode selection.

## Constraints

- Keep diffs small: one concern per task, ≤ 5 files each.
- Preserve the existing hexagonal port/adapter pattern in `apps/web/src/app/ports/` and `apps/web/src/infra/`.
- The mock adapter should return data structurally compatible with the backend's `PersistedUniverse` shape (id, name, state, createdAt, updatedAt).
- The mode selection screen should follow the project's existing dark-theme visual language (`#0d0d0d` background, Inter font, etc.).
- No new npm dependencies required.

## Out of Scope

- Real backend connectivity (HTTP adapter will be a separate CR).
- Switching persistence strategy based on mode (systemStore still uses localStorage internally; the mode store is a separate concern for now).
- Universe listing / selection screen (may come in a future CR once the API port is wired for real).
- Multi-user / collaboration features.

## Acceptance Criteria

- [ ] A mode selection screen appears when the application starts, before any 3D scene or panels are rendered.
- [ ] Clicking "Offline" enters the existing app experience unchanged.
- [ ] Clicking "Online" enters the app experience (mocked for now, behaving identically to offline).
- [ ] A Zustand `appModeStore` exposes the current mode (`'online' | 'offline' | null`) to all layers.
- [ ] A `UniverseApiClient` interface is defined under `apps/web/src/app/ports/`.
- [ ] A mock adapter implementing `UniverseApiClient` exists under `apps/web/src/infra/api/`.
- [ ] `npm run build` passes without errors.
- [ ] The mode selection screen has a clean, on-brand UI consistent with the project's dark theme.

## Verification

```bash
npm run build
npm run typecheck
# Manual: open the app, verify the mode selection screen appears first
# Manual: select Offline → verify existing behavior is intact
# Manual: select Online → verify app loads (mocked, same behavior for now)
```
