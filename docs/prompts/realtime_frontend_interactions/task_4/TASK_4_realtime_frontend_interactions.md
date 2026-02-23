# Task 4 — Remote Command Toast Notifications

## Objective

Display brief, auto-dismissing toast notifications when remote commands are applied via the SSE stream. This provides the user with immediate visual feedback that external changes are arriving, along with a short description of what changed.

## Context to Read First

- `apps/web/src/state/realtimeStore.ts` (Task 2) — the realtime Zustand store; this task will extend it with a toast queue.
- `apps/web/src/hooks/useRemoteCommandStream.ts` — the hook that receives commands and calls `applyRemoteCommand`. This is where toast entries will be pushed.
- `apps/web/src/components/AppHeader.tsx` — reference for the existing dark theme styling.
- `apps/web/src/App.tsx` — to understand where the toast container should be rendered (at the top level, as a sibling of `WindowManager`).
- `packages/domain/src/universe/commands.ts` (or the re-export shim at `apps/web/src/domain/universe/commands.ts`) — to understand all `UniverseCommand` types and craft human-readable labels.

## Constraints

- **Do not** modify `packages/domain/` — no domain changes.
- **Do not** add new npm dependencies (no external toast library).
- **Do not** modify `systemStore` — toasts are purely UI/infra state.
- Maximum 3 visible toasts at a time; oldest are evicted when exceeded.
- Auto-dismiss after ~4 seconds.
- `tick` commands are already filtered by the hook — no toast logic needed for them.

## Steps

1. **Extend `realtimeStore`** in `apps/web/src/state/realtimeStore.ts`:

   Add a toast queue:

   ```ts
   interface RemoteCommandToast {
     id: string;          // unique (e.g., crypto.randomUUID() or Date.now() + counter)
     message: string;     // human-readable label, e.g. "Star added"
     commandType: string; // raw command type for styling
     timestamp: number;   // Date.now()
   }

   // Add to RealtimeStore interface:
   toasts: RemoteCommandToast[];
   pushToast: (message: string, commandType: string) => void;
   dismissToast: (id: string) => void;
   ```

   `pushToast` implementation:
   - Creates a new toast entry.
   - Appends it to the `toasts` array.
   - If `toasts.length > 3`, slice to keep only the last 3 (evict oldest).

   `dismissToast` implementation:
   - Filters out the toast with the given `id`.

2. **Create a command-type-to-label mapping** utility:

   A small helper function (can live inside the toast component or as a separate util) that maps `command.type` to a human-readable message:

   | Command Type | Label |
   |---|---|
   | `addStar` | "Star added" |
   | `updateStar` | "Star updated" |
   | `removeStar` | "Star removed" |
   | `attachStar` | "Star attached to parent" |
   | `detachStar` | "Star detached" |
   | `addGroup` | "Group added" |
   | `updateGroup` | "Group updated" |
   | `removeGroup` | "Group removed" |
   | `addToGroup` | "Entity added to group" |
   | `removeFromGroup` | "Entity removed from group" |
   | `moveToGroup` | "Entity moved to group" |
   | `replaceSnapshot` | "Universe snapshot replaced" |
   | `setSmallBodyFields` | "Asteroid fields updated" |
   | `updateSmallBodyField` | "Asteroid field updated" |
   | `removeSmallBodyField` | "Asteroid field removed" |
   | `setProtoplanetaryDisks` | "Protoplanetary disks updated" |
   | `addProtoplanetaryDisk` | "Protoplanetary disk added" |
   | `updateProtoplanetaryDisk` | "Protoplanetary disk updated" |
   | `removeProtoplanetaryDisk` | "Protoplanetary disk removed" |
   | `setNebulae` | "Nebulae updated" |
   | `updateNebula` | "Nebula updated" |
   | `removeNebula` | "Nebula removed" |
   | `updateRing` | "Planetary ring updated" |
   | `removeRing` | "Planetary ring removed" |
   | _(default)_ | `"Remote command: ${type}"` |

3. **Update `useRemoteCommandStream`** to push a toast after applying each command:

   After `useSystemStore.getState().applyRemoteCommand(command)`, call:
   ```ts
   useRealtimeStore.getState().pushToast(labelFor(command.type), command.type);
   ```

4. **Create `RemoteCommandToast.tsx`** at `apps/web/src/components/RemoteCommandToast.tsx`:

   A component that:
   - Reads `toasts` from `useRealtimeStore`.
   - Renders a fixed-position container (bottom-right corner of the viewport).
   - Each toast is a small card with:
     - An icon/emoji based on command type (star → ⭐, group → 📁, snapshot → 🔄, etc.).
     - The human-readable message.
     - A subtle slide-in animation on appear.
     - Auto-dismiss via `useEffect` + `setTimeout` (4s) calling `dismissToast`.
   - Returns `null` if `toasts` is empty.

5. **Create `RemoteCommandToast.css`** at `apps/web/src/components/RemoteCommandToast.css`:

   - Fixed position: bottom-right, with some margin.
   - Dark theme card: `#1a1a1a` background, `#3a3a3a` border, subtle box-shadow.
   - Slide-in animation from the right.
   - Fade-out animation before dismissal.
   - Small font (12-13px), compact padding.
   - `z-index` above the 3D scene but below modal windows.
   - `replaceSnapshot` toasts get a highlighted border color (e.g., `#4a9eff`).

6. **Render `RemoteCommandToast` in `App.tsx`**:

   Add `<RemoteCommandToast />` inside `AppContent`, as a sibling of `<WindowManager />`.

## Files to Create/Update

| Action | Path |
|--------|------|
| Update | `apps/web/src/state/realtimeStore.ts` |
| Update | `apps/web/src/hooks/useRemoteCommandStream.ts` |
| Create | `apps/web/src/components/RemoteCommandToast.tsx` |
| Create | `apps/web/src/components/RemoteCommandToast.css` |
| Update | `apps/web/src/App.tsx` |

## Acceptance Criteria

- [ ] When a remote command is applied, a toast notification appears in the bottom-right corner with a human-readable description.
- [ ] Toasts auto-dismiss after ~4 seconds.
- [ ] At most 3 toasts are visible at a time; oldest are evicted.
- [ ] `replaceSnapshot` commands produce a visually distinct (highlighted) toast.
- [ ] `tick` commands do not produce toasts (already filtered).
- [ ] No memory leaks: `setTimeout` handles are cleaned up if the toast is dismissed early or the component unmounts.
- [ ] `npm run build` passes.

## Verification

```bash
cd /home/adr/front-portfolio-interactive/solar-system-constructor
npm run build:domain && npm run build:web
```

## Notes

- **Toast ID generation**: `crypto.randomUUID()` is available in modern browsers and Vite dev. Alternatively, use a simple `Date.now() + Math.random()` string.
- **Why not a full toast library**: The project has zero external UI dependencies. A 50-line component is simpler and more maintainable than adding a dependency for this single use case.
- **Batch scenarios**: If the backend sends many commands quickly (e.g., during a scripted universe build), the 3-toast limit prevents UI clutter. The user sees the most recent 3 changes.
