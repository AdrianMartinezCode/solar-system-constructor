# Task 5: Docker Compose Postgres Service and SQL Init Script

## Objective

Activate the PostgreSQL container in `compose.yaml`, provide an idempotent SQL init script for creating the `universes` and `universe_commands` tables, wire the API service to use the Postgres provider, and update the Docker dev guide.

## Context to Read First

- `compose.yaml` — current Docker Compose file (Postgres is commented out)
- `apps/api/Dockerfile` — current API Docker build
- `apps/api/src/config/env.ts` — environment variables the API reads
- `docs/guides/LOCAL_DEV_DOCKER.md` — existing Docker dev guide (to update)
- `apps/api/src/infra/db/postgresProvider.ts` — Postgres provider (from Task 1)
- `apps/api/src/infra/persistence/postgresUniverseRepository.ts` — Postgres adapter (from Task 3)

## Constraints

- Do **not** modify any API TypeScript source files.
- Do **not** modify any `apps/web/` files.
- The SQL script must be **idempotent** (`CREATE TABLE IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`).
- Use `postgres:16-alpine` image (matches existing comment).
- Credentials: `POSTGRES_USER=solar`, `POSTGRES_PASSWORD=solar`, `POSTGRES_DB=solar_system` (simple local dev creds, not for production).
- The `api` service must declare `depends_on: db` with a health-check condition so it doesn't start before Postgres is ready.
- The init script is mounted via Docker volume into `/docker-entrypoint-initdb.d/` (Postgres auto-runs scripts here on first start).

## Steps

1. **Create `apps/api/infra/sql/init.sql`**:
   ```sql
   -- Idempotent DDL for Solar System Constructor
   -- Run automatically by Postgres on first container start

   CREATE EXTENSION IF NOT EXISTS "pgcrypto";  -- for gen_random_uuid()

   CREATE TABLE IF NOT EXISTS universes (
     id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     name        TEXT NOT NULL,
     state       JSONB NOT NULL DEFAULT '{}'::jsonb,
     created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
     updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
   );

   -- Index for querying by name (case-insensitive search)
   CREATE INDEX IF NOT EXISTS idx_universes_name ON universes (name);

   -- Index for querying state internals (future use)
   CREATE INDEX IF NOT EXISTS idx_universes_state ON universes USING GIN (state);

   -- Command event log (append-only, for future event sourcing)
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
   ```

2. **Update `compose.yaml`**:
   - Replace the commented-out `db` service with an active one:
     ```yaml
     db:
       image: postgres:16-alpine
       ports:
         - "${POSTGRES_PORT:-5432}:5432"
       environment:
         POSTGRES_USER: solar
         POSTGRES_PASSWORD: solar
         POSTGRES_DB: solar_system
       volumes:
         - db_data:/var/lib/postgresql/data
         - ./apps/api/infra/sql/init.sql:/docker-entrypoint-initdb.d/init.sql:ro
       healthcheck:
         test: ["CMD-SHELL", "pg_isready -U solar -d solar_system"]
         interval: 5s
         timeout: 3s
         retries: 5
       restart: unless-stopped
     ```
   - Update the `api` service:
     - Set `DB_PROVIDER=postgres` and `DATABASE_URL=postgresql://solar:solar@db:5432/solar_system` in `environment`.
     - Add `depends_on: db: condition: service_healthy`.
   - Uncomment the `volumes:` section with `db_data:`.

3. **Update `docs/guides/LOCAL_DEV_DOCKER.md`**:
   - Add a section about the Postgres database service.
   - Document:
     - Default credentials (`solar`/`solar`/`solar_system`).
     - The init script auto-runs on first start.
     - How to connect manually: `docker compose exec db psql -U solar -d solar_system`.
     - How to reset the DB: `docker compose down -v` (removes the volume).
     - How to run with noop (override env): `DB_PROVIDER=noop docker compose up api`.
   - Add universe CRUD curl examples for quick testing.

## Files to Create/Update

| Action | Path |
|--------|------|
| Create | `apps/api/infra/sql/init.sql` |
| Update | `compose.yaml` |
| Update | `docs/guides/LOCAL_DEV_DOCKER.md` |

## Acceptance Criteria

- [ ] `apps/api/infra/sql/init.sql` exists with idempotent DDL for `universes` and `universe_commands` tables.
- [ ] `compose.yaml` has an active `db` service with `postgres:16-alpine`, health check, volume mount for init script, and persistent data volume.
- [ ] `compose.yaml` API service has `DB_PROVIDER=postgres`, `DATABASE_URL`, and `depends_on: db` with health condition.
- [ ] `compose.yaml` `volumes:` section declares `db_data`.
- [ ] `docker compose config` validates without errors.
- [ ] `docker compose up --build` starts both API and DB containers.
- [ ] After startup, `/health` returns successfully.
- [ ] Universe CRUD endpoints work end-to-end (create, list, get, update, delete).
- [ ] `docker compose down -v` cleanly removes containers and data volume.
- [ ] `LOCAL_DEV_DOCKER.md` is updated with Postgres instructions.

## Verification

```bash
cd /home/adr/front-portfolio-interactive/solar-system-constructor

# Validate compose file
docker compose config > /dev/null

# Start the stack
docker compose up --build -d
sleep 8  # wait for Postgres health check + API boot

# Health check
curl -s http://localhost:3001/health | jq .

# Create a universe
curl -s -X POST http://localhost:3001/universes \
  -H 'Content-Type: application/json' \
  -d '{"name":"Docker Test","state":{"stars":{},"rootIds":[],"groups":{},"rootGroupIds":[],"belts":{}}}' | jq .

# List universes
curl -s http://localhost:3001/universes | jq .

# Verify Postgres has the data
docker compose exec db psql -U solar -d solar_system -c "SELECT id, name, created_at FROM universes;"

# Clean up
docker compose down -v
```

## Notes

- The `init.sql` script only runs on **first container start** (when the Postgres data directory is empty). If you need to re-run it after schema changes, use `docker compose down -v` to remove the volume first.
- The `universe_commands` table is created now but not actively used by the current API routes. It is prepared for future event-sourcing implementation.
- The `pgcrypto` extension is needed for `gen_random_uuid()`. It is included in `postgres:16-alpine` by default.
- Production deployments will need proper secrets management; the hardcoded credentials here are for local dev only.
- The Dockerfile may need updating if `pg` has native dependencies, but `pg` is a pure JS driver by default (no native bindings needed unless `pg-native` is installed).
