# Task 1: Create the `onlineSessionStore` (Zustand store for online session state)

## Objective

Create a Zustand store that manages the user's session state within online mode. It tracks whether the user is browsing the universe list or editing a specific universe, and which universe (if any) is currently loaded.

## Context to Read First

- `apps/web/src/state/appModeStore.ts` — existing session-level mode store; follow the same patterns (Zustand `create`, typed interface).
- `apps/web/src/state/systemStore.ts` — the main universe state store; understand the `replaceUniverseSnapshot` method.
- `apps/web/src/app/ports/universeApiClient.ts` — the `ApiUniverse` type (for understanding what IDs/names look like).
- `docs/requests/CR_online_universe_browser.md` — full change request for context.
- `docs/plans/PLAN_online_universe_browser.md` — plan overview.

## Constraints

- State management only — no UI components, no API calls.
- Follow the same Zustand patterns used in `appModeStore.ts` (typed interface, `create` function).
- Do not modify any existing files.
- No new npm dependencies.

## Steps

1. Create `apps/web/src/state/onlineSessionStore.ts`.
2. Define the `OnlineSessionPhase` type: `'browsing' | 'editing'`.
3. Define the `OnlineSessionStore` interface with:
   - `phase: OnlineSessionPhase` — starts as `'browsing'`.
   - `currentUniverseId: string | null` — starts as `null`.
   - `currentUniverseName: string | null` — starts as `null`.
   - `enterEditor(id: string, name: string): void` — sets current universe and phase to `'editing'`.
   - `exitEditor(): void` — clears current universe and sets phase to `'browsing'`.
   - `resetSession(): void` — resets everything to initial state.
4. Implement the store using `create` from Zustand.
5. Export the hook (`useOnlineSessionStore`) and the phase type.

## Files to Create/Update

- `apps/web/src/state/onlineSessionStore.ts` **(new)**

## Acceptance Criteria

- [ ] `OnlineSessionPhase` type is `'browsing' | 'editing'`.
- [ ] Store starts with `phase: 'browsing'`, `currentUniverseId: null`, `currentUniverseName: null`.
- [ ] `enterEditor('some-id', 'My Universe')` sets `phase` to `'editing'`, `currentUniverseId` to `'some-id'`, `currentUniverseName` to `'My Universe'`.
- [ ] `exitEditor()` sets `phase` to `'browsing'`, clears `currentUniverseId` and `currentUniverseName` to `null`.
- [ ] `resetSession()` returns all fields to their initial values.
- [ ] `npm run build` passes without errors.

## Verification

```bash
cd /home/adr/front-portfolio-interactive/solar-system-constructor
npm run build
```

## Notes

- This store is NOT persisted — it is session-level state, just like `appModeStore`.
- The store will be consumed by `App.tsx` (Task 3) and `AppHeader.tsx` (Task 4).
- Keep the store minimal — avoid adding API call logic here. API calls will be handled at the integration layer (App.tsx).
