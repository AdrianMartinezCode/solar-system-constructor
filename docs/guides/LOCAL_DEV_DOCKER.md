# Local Development with Docker

## Overview

The backend API can be run inside a Docker container using `docker compose`. This provides a reproducible environment and makes it easy to add services (database, cache, etc.) later.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) (with Compose V2 plugin)

## Quick start

```bash
# From repo root
docker compose up --build
```

This builds the API image and starts the container. The API will be available at:

```
http://localhost:3001
```

### Verify

```bash
curl http://localhost:3001/health
# → {"ok":true,"uptime":...}
```

## Ports

| Service | Container port | Host port | Override |
|---------|---------------|-----------|---------|
| API | 3001 | 3001 | `API_PORT` env var |

## Environment variables

Env vars are set in `compose.yaml` under the `api` service `environment` block. For local overrides you can also create `apps/api/.env` and uncomment the `env_file` directive in `compose.yaml`.

See `apps/api/.env.example` for the full list of supported variables.

## Stopping

```bash
docker compose down
```

## Adding a database

The `compose.yaml` file contains commented-out examples for **PostgreSQL**, **SQLite**, and **MongoDB**. To enable one:

1. Uncomment the relevant `db` service block.
2. Uncomment the `volumes` section at the bottom.
3. Set `DB_PROVIDER` and `DATABASE_URL` in the API's environment.
4. Implement the corresponding provider in `apps/api/src/infra/db/`.

## Tips

- **Rebuild after dependency changes**: `docker compose up --build`
- **View logs**: `docker compose logs -f api`
- **Shell into container**: `docker compose exec api sh`
