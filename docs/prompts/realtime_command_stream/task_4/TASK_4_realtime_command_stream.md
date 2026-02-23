# Task 4 — Frontend Real-Time Store Integration

## Objective

Wire the SSE command stream (Task 3) into the Zustand `systemStore` so that `UniverseCommand`s received from the backend are applied to the local universe state in real-time. The 3D scene will update live as commands arrive.

## Context to Read First

- `apps/web/src/app/ports/commandStream.ts` (Task 3) — the `CommandStream` port interface.
- `apps/web/src/infra/realtime/sseCommandStream.ts` (Task 3) — the SSE adapter.
- `apps/web/src/state/systemStore.ts` — the Zustand store; pay close attention to:
  - The internal `dispatchDomainCommand(get, set, command)` helper (lines ~36–55).
  - The `getUniverseSlice(state)` helper (lines ~18–30).
  - How existing actions (e.g., `addStar`, `updateStar`) delegate to `dispatchDomainCommand`.
- `apps/web/src/state/onlineSessionStore.ts` — tracks which universe is currently loaded in online mode.
- `packages/domain/src/universe/applyCommand.ts` — the pure reducer that processes commands.
- `packages/domain/src/universe/commands.ts` — the `UniverseCommand` type.

## Constraints

- **Do not** modify `packages/domain/` — no domain changes.
- **Do not** add new npm dependencies.
- **Do not** create UI components (no connection status indicators, no "watching" badge). Pure plumbing.
- The hook must handle the full lifecycle: connect on mount (or when universe ID changes), disconnect on unmount or ID change.
- Remote commands must **not** trigger the `save()` call that local commands trigger (remote commands come from the backend; re-persisting to localStorage is unnecessary and could cause conflicts).
- The hook should filter out `tick` commands from the remote stream to avoid conflicting with the local animation loop.

## Steps

1. **Expose a way to dispatch remote commands** in `apps/web/src/state/systemStore.ts`:

   The existing `dispatchDomainCommand` is a module-level function (not exported). Rather than exporting it directly (which would expose the raw `get`/`set` internals), add a new store action:

   - Add `applyRemoteCommand: (command: UniverseCommand) => void` to the `SystemStore` interface.
   - Implement it: call `dispatchDomainCommand(get, set, command)` but **do not** call `get().save()` afterward (unlike local mutations).
   - This is the single entry point for externally-sourced commands.

2. **Create the React hook** at `apps/web/src/hooks/useRemoteCommandStream.ts`:

   ```ts
   import { useEffect } from 'react';
   import { useSystemStore } from '../state/systemStore';
   import { sseCommandStream } from '../infra/realtime/sseCommandStream';
   import type { UniverseCommand } from '@solar/domain';
   ```

   - Accept `universeId: string | null` as parameter.
   - When `universeId` is non-null, call `sseCommandStream.connect(universeId, onCommand)`.
   - The `onCommand` callback:
     - Skip `tick` commands (the local animation loop handles ticks).
     - Otherwise, call `useSystemStore.getState().applyRemoteCommand(command)`.
   - Store the disconnect function and call it on cleanup (dependency: `universeId`).
   - When `universeId` is `null`, do nothing (no connection).

3. **No wiring into components yet** — the hook is ready to use but does not need to be called from any component in this task. A follow-up task or the developer can add `useRemoteCommandStream(currentUniverseId)` in the appropriate online-mode component. However, if you want to demonstrate end-to-end integration, you may optionally add the hook call in a top-level component that has access to the online session's `currentUniverseId` (e.g., `App.tsx` or a dedicated online-mode wrapper), gated behind an `if (appMode === 'online')` condition.

## Files to Create/Update

| Action | Path |
|--------|------|
| Update | `apps/web/src/state/systemStore.ts` — add `applyRemoteCommand` action |
| Create | `apps/web/src/hooks/useRemoteCommandStream.ts` — new React hook |

## Acceptance Criteria

- [ ] `systemStore` exposes an `applyRemoteCommand(command)` action that applies the command to the universe state without triggering `save()`.
- [ ] `useRemoteCommandStream(universeId)` connects to the SSE stream when `universeId` is a non-null string.
- [ ] The hook disconnects when the component unmounts or `universeId` changes.
- [ ] `tick` commands from the remote stream are ignored.
- [ ] Other commands (e.g., `addStar`, `updateStar`, `replaceSnapshot`) are applied to the Zustand store and trigger React re-renders / 3D scene updates.
- [ ] No memory leaks: EventSource is closed on cleanup.
- [ ] `npm run build` passes.

## Verification

```bash
cd /home/adr/front-portfolio-interactive/solar-system-constructor
npm run build:domain && npm run build:web
```

End-to-end manual test (requires all 4 tasks completed):

```bash
# Terminal 1: start the API
npm run dev:api

# Terminal 2: start the web app
npm run dev:web

# Terminal 3: send a command to add a star
curl -X POST http://localhost:3001/universes/test-123/commands \
  -H 'Content-Type: application/json' \
  -d '{"type":"replaceSnapshot","snapshot":{"stars":{"star-1":{"id":"star-1","name":"Remote Sol","mass":100,"radius":5,"color":"#FF6600","children":[],"parentId":null,"orbitalDistance":0,"orbitalSpeed":0,"orbitalPhase":0}},"rootIds":["star-1"],"groups":{},"rootGroupIds":[],"belts":{},"smallBodyFields":{},"protoplanetaryDisks":{},"nebulae":{}}}'
```

If the web app is connected with `useRemoteCommandStream('test-123')`, a new orange star named "Remote Sol" should appear in the 3D viewport.

## Notes

- **Why skip `tick` commands**: The frontend runs its own animation loop that calls `tick(dt)` at 60fps. Accepting remote `tick` commands would double-advance the simulation time and cause visual jitter. All other commands are spatial/structural mutations that are idempotent with respect to the animation loop.
- **Why no `save()` on remote commands**: Remote commands originate from the backend. Persisting them locally to `localStorage` would be redundant and could cause state divergence if the user later switches back to offline mode. If local persistence of remote state is desired, it should be an explicit user action ("Save locally").
- **Zustand reactivity**: Since `applyRemoteCommand` updates the store via `set()`, all React components subscribed to the affected slices (e.g., `stars`, `rootIds`) will re-render automatically. The Three.js scene graph, driven by these stores, will update in real-time.
