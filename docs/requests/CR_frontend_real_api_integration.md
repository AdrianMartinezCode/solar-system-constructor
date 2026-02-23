# Change Request: Frontend Real API Integration

## Summary

Replace the in-memory mock `UniverseApiClient` adapter with a real HTTP adapter that calls the backend Express API (`apps/api`). The frontend already follows a ports-and-adapters pattern (port at `apps/web/src/app/ports/universeApiClient.ts`, mock adapter at `apps/web/src/infra/api/mockUniverseApiClient.ts`). This CR delivers a proper `httpUniverseApiClient` adapter, environment-based configuration so URLs are never hard-coded, CORS support on the backend, and wires the new adapter into the app.

## Context

- The backend API (`apps/api`) already exposes full CRUD for universes: `POST /universes`, `GET /universes`, `GET /universes/:id`, `PUT /universes/:id`, `DELETE /universes/:id`.
- The frontend has a clean `UniverseApiClient` port interface and a `mockUniverseApiClient` adapter used in `App.tsx` and `AppHeader.tsx`.
- There is **no auth** and **no WebSocket** requirement — only basic REST JSON operations.
- The backend listens on port **3001** by default; the Vite dev server listens on port **5173** by default. Cross-origin requests need CORS headers on the API.
- There are currently **no `.env` files** and **no Vite env variable usage** (`import.meta.env`) anywhere in the frontend.

### Backend API contract summary

| Operation        | Method   | Path                | Request Body                          | Success Response           |
|------------------|----------|---------------------|---------------------------------------|----------------------------|
| List universes   | `GET`    | `/universes`        | —                                     | `200` — `ApiUniverse[]`    |
| Get by ID        | `GET`    | `/universes/:id`    | —                                     | `200` — `ApiUniverse`      |
| Create universe  | `POST`   | `/universes`        | `{ name: string, state: object }`     | `201` — `ApiUniverse`      |
| Update universe  | `PUT`    | `/universes/:id`    | `{ name?: string, state?: object }`   | `200` — `ApiUniverse`      |
| Delete universe  | `DELETE` | `/universes/:id`    | —                                     | `204` — empty              |
| Health check     | `GET`    | `/health`           | —                                     | `200` — `{ ok, uptime }`   |

### Frontend port interface (already exists)

```
UniverseApiClient {
  list(): Promise<ApiUniverse[]>
  getById(id: string): Promise<ApiUniverse | null>
  create(input: CreateUniverseInput): Promise<ApiUniverse>
  update(id: string, input: UpdateUniverseInput): Promise<ApiUniverse | null>
  delete(id: string): Promise<boolean>
}
```

## Goals

- Deliver an `httpUniverseApiClient` adapter that implements the existing `UniverseApiClient` port using `fetch()` against the real backend.
- Introduce Vite environment variable configuration (`VITE_API_BASE_URL`) so the API base URL is never hard-coded.
- Add CORS middleware to the backend so the frontend dev server can reach it.
- Wire the new HTTP adapter as the **default** in the app, replacing all direct `mockUniverseApiClient` imports.
- Provide a clean adapter-injection mechanism so the mock can still be used if needed (e.g., future test/demo mode).

## Non-goals

- Authentication / authorization — not in scope.
- WebSocket / real-time sync — not in scope.
- Modifying the backend API contract (routes, validation, response shapes).
- Adding a retry/backoff layer or offline queue — out of scope for this CR.
- Unit/integration test infrastructure — no test runner is configured yet.

## Constraints

- **No hard-coded URLs** — the API base URL must come from `import.meta.env.VITE_API_BASE_URL`.
- **No new runtime dependencies** on the frontend — use the native `fetch` API (no axios, ky, etc.).
- **Preserve the existing port interface** — `UniverseApiClient` must remain unchanged.
- **Keep the mock adapter available** — do not delete it; it may be useful for demo/offline fallback.
- The backend CORS middleware should allow the Vite dev origin (`http://localhost:5173`) and be easy to extend for production origins.
- Follow existing project conventions (hexagonal / ports-and-adapters on both sides).

## Out of Scope

- Vite dev-server proxy configuration (use direct CORS instead for transparency).
- Production deployment and production CORS origin lists.
- Error-boundary UI or toast notifications for API failures.
- Offline fallback logic (auto-switching to mock when API is unreachable).

## Acceptance Criteria

- [ ] A new file `apps/web/src/infra/api/httpUniverseApiClient.ts` exists and implements `UniverseApiClient` using `fetch()`.
- [ ] The HTTP adapter reads the base URL from `import.meta.env.VITE_API_BASE_URL` — no string literals like `http://localhost:3001`.
- [ ] An `.env` file (and `.env.example`) exist at `apps/web/` providing `VITE_API_BASE_URL=http://localhost:3001`.
- [ ] The backend `apps/api/src/app.ts` applies CORS middleware allowing at least `http://localhost:5173`.
- [ ] `App.tsx` and `AppHeader.tsx` use the HTTP adapter (not the mock directly).
- [ ] Adapter injection is centralized in one place (e.g., a provider/factory module) so swapping mock ↔ HTTP requires changing only one line.
- [ ] `npm run build` passes for both `apps/web` and `apps/api`.
- [ ] Starting both apps (`npm run dev` in api + web) and navigating to online mode correctly lists/creates/loads/saves/deletes universes via real HTTP calls (manual verification).

## Verification

```bash
# Typecheck & build both packages
npm run build --workspace=@solar/api
npm run build --workspace=@solar/web
```
