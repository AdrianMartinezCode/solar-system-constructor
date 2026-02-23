# Change Request: Online Universe Browser & Editor Save

## Summary

When the user selects **online mode**, introduce a **Universe Browser** screen between mode selection and the universe editor. This browser lists all available universes (from the mock API), lets the user select/load one, delete universes, or create a new universe. Once a universe is loaded, the existing editor appears with an additional **Save** button (and a **Back to Universes** button) that are exclusive to online mode. All API calls use the existing `mockUniverseApiClient` — no real backend communication yet.

## Context

The previous CR (`CR_frontend_online_offline_mode`) established:

- A **mode selection screen** (`ModeSelectionScreen`) where users pick online or offline.
- An **`appModeStore`** (Zustand) holding the session-level mode (`'online' | 'offline' | null`).
- A **`UniverseApiClient`** port (`apps/web/src/app/ports/universeApiClient.ts`) defining universe CRUD operations.
- A **mock adapter** (`apps/web/src/infra/api/mockUniverseApiClient.ts`) implementing the port with in-memory seed data and simulated latency.

Currently, after selecting "Online" mode, the app immediately enters the editor with no way to browse, select, or manage remote universes. The mock adapter exists but is not used by any component. This CR bridges that gap by building the frontend UI that consumes the mock adapter.

## Goals

- Show a **Universe Browser** screen after selecting online mode, listing all universes from the mock API.
- Allow the user to **load** a universe from the list and enter the editor.
- Allow the user to **delete** a universe from the list (with confirmation).
- Allow the user to **create a new universe** and enter the editor with it.
- In the editor (online mode only), provide a **Save** button that updates the current universe via the mock API.
- In the editor (online mode only), provide a **Back to Universes** button to return to the browser.
- All API interactions use the existing `mockUniverseApiClient` — easily swappable for a real HTTP adapter later.

## Non-goals

- Implementing real HTTP communication with the backend.
- Adding authentication, error-retry, or connection-status indicators.
- Modifying the backend API.
- Changing offline mode behavior in any way.
- Universe search, filtering, pagination, or sorting UI.
- Universe renaming from the browser screen (can be a future CR).

## Constraints

- Keep diffs small: one concern per task, ≤ 5 files each.
- Preserve the existing hexagonal port/adapter pattern (`app/ports/` → `infra/api/`).
- The Universe Browser must consume `UniverseApiClient` only through the port interface (not import the mock directly into components — inject it or import the singleton).
- Visual style must match the project's existing dark theme (`#0d0d0d` background, Inter font, accent colors).
- No new npm dependencies required.
- The existing `systemStore.replaceUniverseSnapshot()` should be used to load a universe's state into the editor.

## Out of Scope

- Real backend connectivity (HTTP adapter is a separate CR).
- Switching `systemStore` persistence strategy based on mode (still uses localStorage internally in offline mode).
- Multi-user / collaboration features.
- Universe search, pagination, or advanced list features.
- Universe thumbnail previews.

## Acceptance Criteria

- [ ] When "Online" is selected on the mode screen, a Universe Browser appears (not the editor directly).
- [ ] The browser lists all universes returned by the mock API with name and dates.
- [ ] Clicking "Load" on a universe enters the editor with that universe's state loaded.
- [ ] Clicking "Delete" on a universe shows a confirmation, then removes it from the list.
- [ ] A "Create New Universe" action creates a new universe via the mock API and enters the editor.
- [ ] In online mode, the editor header shows a "Save" button that updates the current universe via the mock API.
- [ ] In online mode, the editor header shows a "Back to Universes" button that returns to the browser.
- [ ] In offline mode, no Save or Back to Universes buttons appear — behavior is unchanged.
- [ ] `npm run build` passes without errors.
- [ ] The Universe Browser has a clean, on-brand UI consistent with the project's dark theme.

## Verification

```bash
npm run build
npm run typecheck
# Manual: open the app, select Online → verify Universe Browser appears
# Manual: verify universe list loads (3 mock universes)
# Manual: click Load on a universe → verify editor loads with its state
# Manual: click Delete on a universe → verify confirmation + removal
# Manual: click Create New → verify editor opens with new universe
# Manual: in editor (online), click Save → verify no errors
# Manual: in editor (online), click Back to Universes → verify browser appears
# Manual: select Offline → verify no browser screen, existing behavior intact
```
