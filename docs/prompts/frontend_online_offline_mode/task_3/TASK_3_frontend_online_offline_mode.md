# Task 3: Define the UniverseApiClient port and mock adapter

## Objective

Create the frontend-side API abstraction for universe CRUD operations and a mock in-memory implementation. This establishes the interface that a real HTTP adapter will implement later, following the project's existing hexagonal port/adapter pattern.

## Context to Read First

- `apps/web/src/app/ports/systemRepository.ts` — existing port pattern on the frontend (interface + types).
- `apps/web/src/infra/persistence/localStorageSystemRepository.ts` — existing adapter pattern (factory function + singleton export).
- `apps/api/src/app/ports/universeRepository.ts` — backend's port definition (the source of truth for the data contract: `PersistedUniverse`, `CreateUniverseInput`, `UpdateUniverseInput`).
- `apps/api/src/routes/universes.ts` — backend CRUD operations (to understand the full API surface).

## Constraints

- Do **not** import from `apps/api/` — the frontend must define its own local types that mirror the backend contract. (A shared package may be introduced later.)
- Do **not** modify any existing files.
- Do **not** use `fetch`, `axios`, or any HTTP library — this is a mock-only task.
- Follow the existing port/adapter folder conventions:
  - Port (interface): `apps/web/src/app/ports/`
  - Adapter (implementation): `apps/web/src/infra/api/`
- All methods return Promises to match the async nature of real API calls.
- Mock methods should include a small artificial delay (100–300ms) to simulate network latency.

## Steps

1. Create `apps/web/src/app/ports/universeApiClient.ts`:
   - Define and export these types (mirroring the backend):
     - `ApiUniverse` — `{ id: string; name: string; state: Record<string, unknown>; createdAt: string; updatedAt: string }` (note: `string` for dates instead of `Date`, since JSON serialization yields strings).
     - `CreateUniverseInput` — `{ name: string; state: Record<string, unknown> }`.
     - `UpdateUniverseInput` — `{ name?: string; state?: Record<string, unknown> }`.
   - Define and export the `UniverseApiClient` interface:
     - `list(): Promise<ApiUniverse[]>`
     - `getById(id: string): Promise<ApiUniverse | null>`
     - `create(input: CreateUniverseInput): Promise<ApiUniverse>`
     - `update(id: string, input: UpdateUniverseInput): Promise<ApiUniverse | null>`
     - `delete(id: string): Promise<boolean>`

2. Create `apps/web/src/infra/api/mockUniverseApiClient.ts`:
   - Import the port types.
   - Create a `createMockUniverseApiClient()` factory function returning a `UniverseApiClient`.
   - Internally maintain an in-memory `Map<string, ApiUniverse>` seeded with 2–3 example universes (e.g., "Alpha Centauri System", "Trappist-1 Cluster").
   - Each method:
     - Wraps logic in a short `await delay(150)` to simulate latency.
     - `list()` returns all entries sorted by most-recently-created.
     - `getById(id)` returns the entry or `null`.
     - `create(input)` generates a UUID, creates the record, returns it.
     - `update(id, input)` merges fields, updates `updatedAt`, returns the record or `null`.
     - `delete(id)` removes the record, returns `true` / `false`.
   - Export a `mockUniverseApiClient` singleton.

## Files to Create/Update

- `apps/web/src/app/ports/universeApiClient.ts` (new)
- `apps/web/src/infra/api/mockUniverseApiClient.ts` (new)

## Acceptance Criteria

- [ ] `UniverseApiClient` interface is exported from `apps/web/src/app/ports/universeApiClient.ts`.
- [ ] `ApiUniverse`, `CreateUniverseInput`, and `UpdateUniverseInput` types are exported.
- [ ] `mockUniverseApiClient` singleton is exported from `apps/web/src/infra/api/mockUniverseApiClient.ts`.
- [ ] Mock adapter implements all 5 methods (`list`, `getById`, `create`, `update`, `delete`).
- [ ] Mock data includes at least 2 pre-seeded example universes.
- [ ] All methods return Promises (async).
- [ ] No existing files are modified.
- [ ] `npm run build` passes.

## Verification

```bash
cd apps/web && npx tsc --noEmit
cd ../.. && npm run build
```

## Notes

- Use `crypto.randomUUID()` (available in modern browsers and Node 19+) or a simple `Date.now()` + `Math.random()` approach for generating mock IDs. Avoid adding `uuid` as a new dependency for the mock — the project already has it but the mock should stay lightweight.
- The `state` field in `ApiUniverse` is `Record<string, unknown>` — intentionally generic. The real adapter will need to serialize/deserialize the domain `UniverseState`, but that mapping is out of scope here.
- Date fields use `string` (ISO format) instead of `Date` to match what JSON.parse returns from API responses.
