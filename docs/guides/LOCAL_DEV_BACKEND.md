# Local Backend Development

## Overview

The backend API lives at `apps/api/` and runs as a Node.js + Express + TypeScript service. It can be run directly via `tsx` (hot-reload) or inside a Docker container.

## Running locally (without Docker)

```bash
# From repo root
npm run dev:api
```

This starts the API with hot-reload (via `tsx watch`). Changes to `apps/api/src/**` are picked up automatically.

### Default port

**3001** — override with `PORT` env variable:

```bash
PORT=4000 npm run dev:api
```

## Verifying

```bash
curl http://localhost:3001/health
# → {"ok":true,"uptime":...}
```

## Environment variables

All env vars are centralized in `apps/api/src/config/env.ts`. See `apps/api/.env.example` for the full list.

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | HTTP port |
| `DB_PROVIDER` | `noop` | Database provider (`noop` = no persistence) |
| `DATABASE_URL` | _(none)_ | Connection string (ignored when `DB_PROVIDER=noop`) |
| `NODE_ENV` | `development` | Runtime environment |

## Build & start (production-like)

```bash
npm run build:api
cd apps/api && npm start
```

## Type checking

```bash
npm run typecheck:api
```

## Running via Docker

See [`LOCAL_DEV_DOCKER.md`](LOCAL_DEV_DOCKER.md) for Docker Compose instructions.

## API folder structure

```
apps/api/src/
├── config/        # Environment parsing, app configuration
│   └── env.ts
├── routes/        # Express route handlers
│   └── health.ts
├── domain/        # Business logic (placeholder — add as features grow)
├── infra/         # Infrastructure adapters
│   └── db/        # Database provider interface + implementations
│       ├── types.ts         # DbProvider interface
│       ├── noopProvider.ts  # Default no-op implementation
│       └── index.ts         # Factory (resolves provider from env)
├── app.ts         # Express app creation + middleware + routes
└── server.ts      # Entry point: env loading, DB init, listen, shutdown
```

## Adding a database

1. Choose a DB technology and add its driver as a dependency in `apps/api/package.json`.
2. Implement a new provider in `apps/api/src/infra/db/` (e.g. `postgresProvider.ts`).
3. Register the provider in `apps/api/src/infra/db/index.ts` (add a `case` to the switch).
4. Set `DB_PROVIDER` and `DATABASE_URL` in your `.env` or `compose.yaml`.
5. The API will use the new provider on next startup.
