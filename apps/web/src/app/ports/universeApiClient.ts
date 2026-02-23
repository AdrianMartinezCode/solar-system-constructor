/**
 * UniverseApiClient port — frontend interface for backend universe CRUD.
 *
 * Mirrors the backend API contract (`apps/api/src/app/ports/universeRepository.ts`)
 * but lives on the frontend so there is no cross-package import.
 *
 * Implementations (adapters) live in `src/infra/api/`.
 */

// ---------------------------------------------------------------------------
// Data types (mirror backend's PersistedUniverse shape)
// ---------------------------------------------------------------------------

/** A universe record as returned by the API (JSON-serialised dates). */
export interface ApiUniverse {
  id: string;
  name: string;
  /** Universe state blob (generic JSON). */
  state: Record<string, unknown>;
  /** ISO-8601 string. */
  createdAt: string;
  /** ISO-8601 string. */
  updatedAt: string;
}

/** Input for creating a new universe via the API. */
export interface CreateUniverseInput {
  name: string;
  state: Record<string, unknown>;
}

/** Input for partially updating an existing universe. */
export interface UpdateUniverseInput {
  name?: string;
  state?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Client interface
// ---------------------------------------------------------------------------

/** Port for communicating with the backend universe API. */
export interface UniverseApiClient {
  /** List all universes (most-recently-created first). */
  list(): Promise<ApiUniverse[]>;

  /** Retrieve a single universe by ID, or `null` if not found. */
  getById(id: string): Promise<ApiUniverse | null>;

  /** Create a new universe, returning the created record. */
  create(input: CreateUniverseInput): Promise<ApiUniverse>;

  /** Partially update an existing universe. Returns updated record or `null`. */
  update(id: string, input: UpdateUniverseInput): Promise<ApiUniverse | null>;

  /** Delete a universe by ID. Returns `true` if a record was deleted. */
  delete(id: string): Promise<boolean>;
}
