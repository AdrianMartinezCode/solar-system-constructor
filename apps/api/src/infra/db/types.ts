/**
 * Database provider contract.
 *
 * Every concrete DB implementation (postgres, sqlite, mongo, …) must satisfy
 * this interface.  The API boots with a "noop" provider by default so that the
 * server can run without any database configured.
 */
export interface DbProvider {
  /** Human-readable name (e.g. "noop", "postgres"). */
  readonly name: string;

  /**
   * Open the connection / pool.
   * Called once at startup before the HTTP server starts listening.
   */
  connect(): Promise<void>;

  /**
   * Close the connection / pool gracefully.
   * Called on SIGTERM / SIGINT for clean shutdown.
   */
  disconnect(): Promise<void>;

  /**
   * Lightweight connectivity check (e.g. `SELECT 1`).
   * Used by the /health endpoint to report DB status.
   * Returns `true` when the DB is reachable.
   */
  ping(): Promise<boolean>;
}
