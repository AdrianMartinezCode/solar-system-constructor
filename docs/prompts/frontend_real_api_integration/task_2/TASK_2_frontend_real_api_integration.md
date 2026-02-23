# Task 2 — Create the HTTP adapter and environment config on the frontend

## Objective

Implement a real HTTP adapter (`httpUniverseApiClient`) for the existing `UniverseApiClient` port, backed by `fetch()` and configured via a Vite environment variable (`VITE_API_BASE_URL`). Also create the `.env` / `.env.example` files.

## Context to read first

- `apps/web/src/app/ports/universeApiClient.ts` — the port interface this adapter must implement.
- `apps/web/src/infra/api/mockUniverseApiClient.ts` — the existing mock adapter (for reference on structure and patterns).
- `apps/api/src/routes/universes.ts` — the backend route handlers (to match the HTTP contract exactly).

## Constraints

- **No new runtime dependencies** — use native `fetch` (available in all modern browsers).
- The base URL must come exclusively from `import.meta.env.VITE_API_BASE_URL` — zero hard-coded URL strings.
- The adapter must implement the **exact** `UniverseApiClient` interface without modifications.
- Do **not** modify the port interface, the mock adapter, or any existing component.

## Steps

1. Create `apps/web/.env` with:
   ```
   VITE_API_BASE_URL=http://localhost:3001
   ```
2. Create `apps/web/.env.example` with the same content (serves as documentation for other developers).
3. Create `apps/web/src/infra/api/httpUniverseApiClient.ts`:
   - Read `import.meta.env.VITE_API_BASE_URL` and store it (with a trailing-slash guard).
   - Export a factory function `createHttpUniverseApiClient(): UniverseApiClient`.
   - Implement each method:

   | Port method | HTTP call | Notes |
   |-------------|-----------|-------|
   | `list()` | `GET ${baseUrl}/universes` | Returns `ApiUniverse[]`. |
   | `getById(id)` | `GET ${baseUrl}/universes/${id}` | Returns `ApiUniverse` on 200, `null` on 404. |
   | `create(input)` | `POST ${baseUrl}/universes` with JSON body `{ name, state }` | Returns the `ApiUniverse` from the `201` response. |
   | `update(id, input)` | `PUT ${baseUrl}/universes/${id}` with JSON body `{ name?, state? }` | Returns `ApiUniverse` on 200, `null` on 404. |
   | `delete(id)` | `DELETE ${baseUrl}/universes/${id}` | Returns `true` on 204, `false` on 404. |

   - For non-404 error responses, throw an `Error` with a descriptive message (the existing callers already use try/catch).
   - Export a singleton instance: `export const httpUniverseApiClient = createHttpUniverseApiClient();`

4. Verify the build passes.

## Files to create/update

| Action | Path |
|--------|------|
| Create | `apps/web/.env` |
| Create | `apps/web/.env.example` |
| Create | `apps/web/src/infra/api/httpUniverseApiClient.ts` |

## Acceptance criteria

- [ ] `apps/web/.env` exists with `VITE_API_BASE_URL=http://localhost:3001`.
- [ ] `apps/web/.env.example` exists with the same content.
- [ ] `httpUniverseApiClient.ts` exports `createHttpUniverseApiClient` (factory) and `httpUniverseApiClient` (singleton).
- [ ] The adapter implements all 5 methods of `UniverseApiClient`.
- [ ] The adapter reads its base URL from `import.meta.env.VITE_API_BASE_URL` — no hard-coded URLs.
- [ ] `getById` and `update` return `null` (not throw) on 404.
- [ ] `delete` returns `false` (not throw) on 404, `true` on 204.
- [ ] Non-OK, non-404 responses throw an `Error`.
- [ ] `npm run build --workspace=@solar/web` passes without errors.

## Verification

```bash
npm run build --workspace=@solar/web
```

## Notes

- Vite automatically loads `.env` files and exposes variables prefixed with `VITE_` on `import.meta.env`. No extra configuration is needed.
- The `Content-Type: application/json` header must be set on `POST` and `PUT` requests.
- The root `.gitignore` already ignores `.env`, so `apps/web/.env` will **not** be tracked by git. This is conventional — `.env` is per-developer local config. The `.env.example` file **is** tracked and serves as a self-documenting template for other developers.
