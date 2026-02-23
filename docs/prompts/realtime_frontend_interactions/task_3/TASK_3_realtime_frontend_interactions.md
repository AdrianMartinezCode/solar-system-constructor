# Task 3 — Connection Status Indicator Component

## Objective

Create a small, color-coded connection status indicator that appears in the AppHeader when the user is in online mode. The indicator reads from `realtimeStore.connectionStatus` and visually communicates whether the SSE connection is connected, reconnecting, or disconnected.

## Context to Read First

- `apps/web/src/state/realtimeStore.ts` (Task 2) — the Zustand store with `connectionStatus`.
- `apps/web/src/components/AppHeader.tsx` — the app header that already shows online-mode elements (back button, universe name, save button). The new indicator should be placed in the `header-left` section, near the universe name.
- `apps/web/src/components/AppHeader.css` — existing styles; the new component should match the dark theme.
- `apps/web/src/state/appModeStore.ts` — to check if `mode === 'online'`.

## Constraints

- **Do not** modify `packages/domain/` — no domain changes.
- **Do not** add new npm dependencies.
- **Do not** modify the `realtimeStore` or `sseCommandStream` — only consume the existing store.
- Pure CSS styling (no CSS-in-JS, no external UI library).
- The indicator should be small and unobtrusive — a pill/badge, not a modal or banner.

## Steps

1. **Create the component** at `apps/web/src/components/ConnectionStatusIndicator.tsx`:

   A simple React component that:
   - Reads `connectionStatus` from `useRealtimeStore`.
   - Renders a small pill with a colored dot and a label:
     - `'idle'` → gray dot, label "Offline" (or hidden entirely).
     - `'connecting'` → amber/yellow dot (pulsing animation), label "Connecting…".
     - `'connected'` → green dot, label "Live".
     - `'error'` → red dot (pulsing animation), label "Reconnecting…".
   - The component returns `null` when the app is not in online mode (or this can be handled by the parent).

2. **Create the CSS** at `apps/web/src/components/ConnectionStatusIndicator.css`:

   - Small pill with rounded corners, dark background (`#2a2a2a`), subtle border.
   - Colored dot (8–10px circle) with status-specific colors:
     - Connected: `#44cc77` (green)
     - Connecting: `#ffaa00` (amber)
     - Error: `#ff5555` (red)
     - Idle: `#666` (gray)
   - Pulse animation for `connecting` and `error` states (CSS `@keyframes`).
   - Font size ~11px, matching the existing header style.
   - Smooth transitions between states.

3. **Wire into AppHeader** in `apps/web/src/components/AppHeader.tsx`:

   - Import `ConnectionStatusIndicator`.
   - Render it inside the `header-left` div, after the universe name label and before the speed control.
   - Only render when `isOnline` is true (the `isOnline` variable already exists in AppHeader).

## Files to Create/Update

| Action | Path |
|--------|------|
| Create | `apps/web/src/components/ConnectionStatusIndicator.tsx` |
| Create | `apps/web/src/components/ConnectionStatusIndicator.css` |
| Update | `apps/web/src/components/AppHeader.tsx` |

## Acceptance Criteria

- [ ] A connection status indicator pill is visible in the AppHeader when in online mode.
- [ ] The indicator shows "Live" (green) when connected, "Connecting…" (amber pulse) when connecting, "Reconnecting…" (red pulse) on error, and is hidden or gray when idle.
- [ ] The indicator is hidden when in offline mode.
- [ ] The indicator reads from `realtimeStore.connectionStatus` and re-renders only when the status changes.
- [ ] Visual style matches the existing dark theme of the AppHeader.
- [ ] `npm run build` passes.

## Verification

```bash
cd /home/adr/front-portfolio-interactive/solar-system-constructor
npm run build:domain && npm run build:web
```

## Notes

- **Indicator placement**: The `header-left` div flows left-to-right. The indicator should appear after the universe name so the user sees: `📋 Universes | My Universe | 🟢 Live | ⏱️ 1.00x`.
- **Pulse animation**: A simple CSS `@keyframes pulse` with opacity oscillation (0.4 → 1.0) is sufficient. Keep it subtle.
- **EventSource auto-reconnect**: When SSE reconnects after an error, the status transitions `error → connecting → connected` automatically. The indicator will reflect each state in sequence.
