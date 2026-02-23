# Task 3 — Centralize adapter injection and swap the app to use the HTTP adapter

## Objective

Create a single adapter-provider module that exports the active `UniverseApiClient` instance, then update all consumer files to import from this provider instead of directly from the mock. The provider defaults to the HTTP adapter created in Task 2.

## Context to read first

- `apps/web/src/infra/api/httpUniverseApiClient.ts` — the HTTP adapter (created in Task 2).
- `apps/web/src/infra/api/mockUniverseApiClient.ts` — the mock adapter (kept for reference / future use).
- `apps/web/src/App.tsx` — currently imports and uses `mockUniverseApiClient` in `OnlineBrowser`.
- `apps/web/src/components/AppHeader.tsx` — currently imports and uses `mockUniverseApiClient` for save.
- `apps/web/src/app/ports/universeApiClient.ts` — the port interface.

## Constraints

- Do **not** delete the mock adapter file.
- Do **not** modify the `UniverseApiClient` port interface.
- Do **not** modify the HTTP adapter file (Task 2 output).
- The provider module should be the **only** place that decides which adapter is active — a one-line swap between `httpUniverseApiClient` and `mockUniverseApiClient`.
- No React Context or dependency injection framework needed — a simple module-level export is sufficient.

## Steps

1. Create `apps/web/src/infra/api/universeApiClientProvider.ts`:
   ```ts
   /**
    * Centralized provider for the active UniverseApiClient adapter.
    *
    * Change the import below to swap between HTTP (real) and mock adapters.
    */
   import type { UniverseApiClient } from '../../app/ports/universeApiClient';
   import { httpUniverseApiClient } from './httpUniverseApiClient';
   // import { mockUniverseApiClient } from './mockUniverseApiClient';

   export const universeApiClient: UniverseApiClient = httpUniverseApiClient;
   ```

2. Update `apps/web/src/App.tsx`:
   - Replace the import `import { mockUniverseApiClient } from './infra/api/mockUniverseApiClient';` with `import { universeApiClient } from './infra/api/universeApiClientProvider';`.
   - Replace all occurrences of `mockUniverseApiClient.` with `universeApiClient.` in the `OnlineBrowser` component (methods: `list`, `getById`, `delete`, `create`).

3. Update `apps/web/src/components/AppHeader.tsx`:
   - Replace the import `import { mockUniverseApiClient } from '../infra/api/mockUniverseApiClient';` with `import { universeApiClient } from '../infra/api/universeApiClientProvider';`.
   - Replace `mockUniverseApiClient.update(...)` with `universeApiClient.update(...)` in the `handleSave` callback.

4. Verify the build passes and do a manual smoke test.

## Files to create/update

| Action | Path |
|--------|------|
| Create | `apps/web/src/infra/api/universeApiClientProvider.ts` |
| Update | `apps/web/src/App.tsx` |
| Update | `apps/web/src/components/AppHeader.tsx` |

## Acceptance criteria

- [ ] `universeApiClientProvider.ts` exists and exports `universeApiClient`.
- [ ] The provider defaults to `httpUniverseApiClient`.
- [ ] Swapping to the mock adapter requires changing only the provider file (comment/uncomment one line).
- [ ] `App.tsx` no longer imports from `mockUniverseApiClient`.
- [ ] `AppHeader.tsx` no longer imports from `mockUniverseApiClient`.
- [ ] `mockUniverseApiClient.ts` still exists (not deleted).
- [ ] `npm run build --workspace=@solar/web` passes without errors.
- [ ] Running both `@solar/api` (dev) and `@solar/web` (dev) and navigating to online mode correctly lists, creates, loads, saves, and deletes universes via real HTTP calls.

## Verification

```bash
npm run build --workspace=@solar/web
```

## Notes

- After this task, no file in `apps/web/src/` should directly import from `mockUniverseApiClient.ts` (except the provider module's commented-out line). A quick grep confirms:
  ```bash
  grep -r "mockUniverseApiClient" apps/web/src/ --include="*.ts" --include="*.tsx"
  ```
  Should only show hits in the mock file itself and the commented import in the provider.
- For a full end-to-end smoke test, start the API (`npm run dev --workspace=@solar/api`) and the web app (`npm run dev --workspace=@solar/web`), then exercise: list universes → create → load → save (edit + save) → delete.
