# Plan: Frontend Real API Integration

**Change Request**: `docs/requests/CR_frontend_real_api_integration.md`

## Summary

Wire the frontend web app to the backend Express API by: (1) adding CORS to the backend, (2) creating an HTTP adapter for the existing `UniverseApiClient` port, (3) configuring environment variables, and (4) swapping the mock for the real adapter across the app.

## Assumptions

- The backend API contract (routes, request/response shapes) is stable and does not need modification.
- `fetch` is sufficient — no need for axios or similar libraries.
- The backend currently has **no CORS middleware**; it needs to be added.
- A centralized adapter-provider module is the cleanest way to switch adapters; dependency injection via React Context would be over-engineering for a single port.

## Risks / Unknowns

- The backend `DELETE /universes/:id` returns `204` (no body), but the frontend port returns `Promise<boolean>`. The HTTP adapter must handle the empty-body case correctly.
- The backend serializes `Date` objects as ISO strings in JSON. The frontend port already expects ISO strings (`createdAt: string`), so no conversion issue expected.
- CORS: If the user ever deploys to a different origin, the allowed origins list needs updating. For now, only `http://localhost:5173` is required.

## Out of Scope

- Auth, WebSocket, retry/backoff, offline fallback, error-boundary UI, production deployment.

## Task List (ordered)

### Task 1 — Add CORS middleware to the backend API

**Goal**: Allow cross-origin requests from the Vite dev server.
**Scope**: Backend only (`apps/api`).
**Dependencies**: None.
**Files**:
- `apps/api/package.json` (add `cors` dependency)
- `apps/api/src/app.ts` (apply CORS middleware)

**Acceptance criteria**:
- `cors` package is in `dependencies`.
- CORS middleware is applied before routes in `app.ts`.
- Allows origin `http://localhost:5173` (and can be extended).
- `npm run build --workspace=@solar/api` passes.

---

### Task 2 — Create the HTTP adapter and environment config on the frontend

**Goal**: Implement `httpUniverseApiClient` using `fetch()` and Vite env vars.
**Scope**: Frontend only (`apps/web`).
**Dependencies**: None (can be done in parallel with Task 1, but needs Task 1 for runtime testing).
**Files**:
- `apps/web/.env` (new — `VITE_API_BASE_URL=http://localhost:3001`)
- `apps/web/.env.example` (new — same content as `.env`)
- `apps/web/src/infra/api/httpUniverseApiClient.ts` (new — HTTP adapter)

**Acceptance criteria**:
- `httpUniverseApiClient` implements the `UniverseApiClient` port interface.
- Base URL comes from `import.meta.env.VITE_API_BASE_URL` — no hard-coded URL strings.
- All five methods (`list`, `getById`, `create`, `update`, `delete`) make correct HTTP calls matching the backend contract.
- Handles `204` (delete) and `404` (getById/update returning `null`) correctly.
- `npm run build --workspace=@solar/web` passes.

---

### Task 3 — Centralize adapter injection and swap the app to use the HTTP adapter

**Goal**: Replace all direct `mockUniverseApiClient` imports with a single adapter-provider module that defaults to the HTTP adapter.
**Scope**: Frontend only (`apps/web`).
**Dependencies**: Task 2 (HTTP adapter must exist).
**Files**:
- `apps/web/src/infra/api/universeApiClientProvider.ts` (new — centralised factory/provider)
- `apps/web/src/App.tsx` (update imports to use provider)
- `apps/web/src/components/AppHeader.tsx` (update imports to use provider)

**Acceptance criteria**:
- A new provider module exports a single `universeApiClient` instance.
- The provider defaults to the HTTP adapter.
- Switching to mock requires changing only the provider module (one line).
- `App.tsx` and `AppHeader.tsx` import from the provider, not from `mockUniverseApiClient` directly.
- The mock adapter file is **not deleted**.
- `npm run build --workspace=@solar/web` passes.
- Running both apps and using online mode performs real HTTP CRUD against the backend.
