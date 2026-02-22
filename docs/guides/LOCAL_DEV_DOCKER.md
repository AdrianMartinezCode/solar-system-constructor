# Local Development with Docker

## Overview

The backend API and PostgreSQL database run inside Docker containers using `docker compose`. This provides a reproducible environment with a real database out of the box.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) (with Compose V2 plugin)

## Quick start

```bash
# From repo root
docker compose up --build
```

This builds the API image, starts PostgreSQL, runs the init SQL script, and starts the API. The API will be available at:

```
http://localhost:3001
```

### Verify

```bash
curl http://localhost:3001/health
# → {"ok":true,"uptime":...}
```

## Services

| Service | Image | Container port | Host port | Override |
|---------|-------|---------------|-----------|---------|
| API | custom (Dockerfile) | 3001 | 3001 | `API_PORT` env var |
| PostgreSQL | `postgres:16-alpine` | 5432 | 5432 | `POSTGRES_PORT` env var |

## PostgreSQL Database

### Default credentials

| Setting | Value |
|---------|-------|
| User | `solar` |
| Password | `solar` |
| Database | `solar_system` |
| Connection URL | `postgresql://solar:solar@localhost:5432/solar_system` |

> ⚠️ These are **local dev credentials only**. Do not use in production.

### Schema init script

The file `apps/api/infra/sql/init.sql` is mounted into the Postgres container and runs automatically on **first start** (when the data directory is empty). It creates:

- `universes` table — stores universe snapshots with JSONB `state` column
- `universe_commands` table — append-only event log for future event sourcing
- Associated indexes

### Connect manually

```bash
# psql inside the container
docker compose exec db psql -U solar -d solar_system

# Example queries
SELECT id, name, created_at FROM universes;
\dt           -- list tables
\d universes  -- describe table
```

### Reset the database

To wipe all data and re-run the init script:

```bash
docker compose down -v    # removes containers AND the db_data volume
docker compose up --build # fresh start
```

## Environment variables

Env vars are set in `compose.yaml` under each service's `environment` block. For local overrides you can create `apps/api/.env` and add an `env_file` directive in `compose.yaml`.

### API environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | HTTP port the API listens on |
| `NODE_ENV` | `development` | Runtime environment |
| `DB_PROVIDER` | `postgres` | Database provider (`postgres` or `noop`) |
| `DATABASE_URL` | `postgresql://solar:solar@db:5432/solar_system` | Postgres connection string |

### Running without a database (noop mode)

If you want to run the API without Postgres (universe data will be ephemeral / in-memory):

```bash
# Override env for just the API (DB container still starts but is unused)
DB_PROVIDER=noop npm run dev:api

# Or in Docker — run only the api service with overridden env
docker compose run --rm -e DB_PROVIDER=noop -e DATABASE_URL= -p 3001:3001 api
```

## Universe CRUD — Quick test

```bash
# Create a universe
curl -s -X POST http://localhost:3001/universes \
  -H 'Content-Type: application/json' \
  -d '{"name":"My Universe","state":{"stars":{},"rootIds":[]}}' | jq .

# List all universes
curl -s http://localhost:3001/universes | jq .

# Get by ID (replace <id> with actual UUID)
curl -s http://localhost:3001/universes/<id> | jq .

# Update
curl -s -X PUT http://localhost:3001/universes/<id> \
  -H 'Content-Type: application/json' \
  -d '{"name":"Renamed Universe"}' | jq .

# Delete
curl -s -X DELETE http://localhost:3001/universes/<id> -w "\nHTTP %{http_code}\n"
```

## Stopping

```bash
docker compose down       # stop containers, keep data
docker compose down -v    # stop containers, delete data volume
```

## Tips

- **Rebuild after dependency changes**: `docker compose up --build`
- **View logs**: `docker compose logs -f api`
- **View DB logs**: `docker compose logs -f db`
- **Shell into API container**: `docker compose exec api sh`
- **Shell into DB container**: `docker compose exec db sh`
