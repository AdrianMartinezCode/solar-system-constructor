-- =============================================================================
-- Solar System Constructor — PostgreSQL schema init
-- =============================================================================
-- This script runs automatically on first container start when mounted into
-- /docker-entrypoint-initdb.d/. It is idempotent (safe to re-run).
-- =============================================================================

-- pgcrypto provides gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------------
-- Universe snapshots (current state)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS universes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  state       JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for querying by name
CREATE INDEX IF NOT EXISTS idx_universes_name
  ON universes (name);

-- GIN index for querying state internals (e.g. state->'stars')
CREATE INDEX IF NOT EXISTS idx_universes_state
  ON universes USING GIN (state);

-- ---------------------------------------------------------------------------
-- Command event log (append-only, for future event sourcing)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS universe_commands (
  id           BIGSERIAL PRIMARY KEY,
  universe_id  UUID REFERENCES universes(id) ON DELETE CASCADE,
  command      JSONB NOT NULL,
  events       JSONB,
  applied_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_universe_commands_universe_id
  ON universe_commands (universe_id);

CREATE INDEX IF NOT EXISTS idx_universe_commands_applied_at
  ON universe_commands (applied_at);
