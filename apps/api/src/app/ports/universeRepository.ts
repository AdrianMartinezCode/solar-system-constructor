/**
 * UniverseRepository port — persistence interface for universe snapshots.
 *
 * Defines how the API layer persists and retrieves universe state.
 * Implementations (adapters) live in `src/infra/persistence/`.
 */

// ---------------------------------------------------------------------------
// Data types
// ---------------------------------------------------------------------------

/** Shape of a persisted universe record. */
export interface PersistedUniverse {
  /** UUID primary key. */
  id: string;

  /** Human-readable universe name. */
  name: string;

  /**
   * The universe state blob (JSONB-compatible).
   * Intentionally generic until a shared domain package provides the real type.
   */
  state: Record<string, unknown>;

  /** Timestamp of creation. */
  createdAt: Date;

  /** Timestamp of last update. */
  updatedAt: Date;
}

/** Input for creating a new universe. */
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
// Repository interface
// ---------------------------------------------------------------------------

/** Repository port for saving / loading / managing universes. */
export interface UniverseRepository {
  /** Create a new universe, returning the persisted record. */
  create(input: CreateUniverseInput): Promise<PersistedUniverse>;

  /** Retrieve a universe by its ID, or `null` if not found. */
  getById(id: string): Promise<PersistedUniverse | null>;

  /** List all universes (ordered by most-recently-created first). */
  list(): Promise<PersistedUniverse[]>;

  /** Partially update an existing universe. Returns the updated record, or `null` if not found. */
  update(id: string, input: UpdateUniverseInput): Promise<PersistedUniverse | null>;

  /** Delete a universe by ID. Returns `true` if a record was deleted. */
  delete(id: string): Promise<boolean>;
}
