# API (`apps/api`)

Node.js + TypeScript + Express backend for the Solar System Constructor.

## Quick start

```bash
# From repo root
npm run dev:api          # starts dev server with hot-reload (tsx watch)
npm run build:api        # compiles TypeScript → dist/
npm run typecheck:api    # type-check only (no emit)
```

Or from this directory:

```bash
npm run dev
npm run build
npm start                # runs the compiled dist/server.js
```

## Default port

**3001** — override with the `PORT` env variable.

## Folder structure

```
apps/api/
├── src/
│   ├── config/        # Environment parsing, app config
│   ├── routes/        # Express route handlers
│   ├── domain/        # Business logic (placeholder)
│   └── infra/         # Infrastructure adapters (DB, external services)
├── dist/              # Compiled output (gitignored)
├── Dockerfile         # Container image for local dev
├── .env.example       # Documented env vars
├── package.json
├── tsconfig.json
└── README.md
```

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Returns `{ ok: true, uptime: <seconds> }` |
