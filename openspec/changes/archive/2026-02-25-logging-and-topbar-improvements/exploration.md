# Exploration: logging-and-topbar-improvements

## Current State

### 1. API Logging (Backend)

**Affected files:**

- `apps/api/src/server.ts` -- startup orchestration, uses `console.log` / `console.error` with `[api]` prefix
- `apps/api/src/app.ts` -- Express app factory, global error handler uses `console.error('[api] unhandled error:', err.message)`
- `apps/api/src/routes/universes.ts` -- CRUD routes, no logging at all (errors forwarded via `next(err)`)
- `apps/api/src/routes/commands.ts` -- command ingestion + SSE, no logging
- `apps/api/src/mcp/transport.ts` -- MCP transport handler, no logging
- `apps/api/src/mcp/server.ts` -- MCP server, no logging
- `apps/api/src/app/services/commandService.ts` -- command processing service, no logging
- `apps/api/src/infra/db/postgresProvider.ts` -- `console.log('[db]'...)` for connect/disconnect
- `apps/api/src/infra/db/noopProvider.ts` -- `console.log('[db]'...)` for noop connect/disconnect
- `apps/api/src/infra/realtime/inMemoryCommandGateway.ts` -- no logging

**Existing patterns:**

- All current logging uses raw `console.log` / `console.error`.
- A manual prefix convention exists: `[api]` for server/app, `[db]` for database providers.
- No structured logging, no timestamps, no log levels, no request correlation IDs.
- No logging middleware (no request/response logging).
- No logging dependencies in `apps/api/package.json` -- zero logging libraries installed.

**Config:**

- `apps/api/src/config/env.ts` -- centralized env parsing (`AppEnv` interface). Has `NODE_ENV` but no `LOG_LEVEL` or `LOG_DIR` fields.
- `apps/api/src/config/cors.ts` -- CORS origins only.
- `compose.yaml` -- `NODE_ENV=development` set for Docker.

### 2. Log File Export (.gitignore)

**Affected files:**

- `.gitignore` (project root) -- currently ignores `node_modules`, `dist`, `.env*`, editor files. Does **not** have any log file patterns (`*.log`, `logs/`, etc.).

**No existing log directory or file conventions.**

### 3. UI Top Bar -- Application Title

**Affected files:**

- `apps/web/src/components/AppHeader.tsx` -- the top bar component. Line 183: `<h1 className="app-title">Nested Solar System Constructor</h1>` in `header-center` div.
- `apps/web/src/components/AppHeader.css` -- `.app-title` styling (18px, centered).

**Existing behavior:**

- The title is a hard-coded string: `"Nested Solar System Constructor"`.
- In online mode, the universe name already appears in `header-left` (line 121-125) as `<span className="header-universe-name">`. This is a secondary label, not the main title.
- The requirement is to **replace** the center title with the universe name when in online mode (editing a universe).

### 4. UI Top Bar -- Universe Identifier with Copy Button

**Affected files:**

- `apps/web/src/components/AppHeader.tsx` -- currently has `currentUniverseId` from `useOnlineSessionStore` (line 25) but does **not** display it anywhere.
- `apps/web/src/state/onlineSessionStore.ts` -- stores `currentUniverseId: string | null` and `currentUniverseName: string | null`. Both are set when entering the editor via `enterEditor(id, name)`.

**Universe ID characteristics:**

- The `PersistedUniverse` type (in `apps/api/src/app/ports/universeRepository.ts`) has `id: string` (UUID primary key).
- UUIDs are generated server-side (in-memory via `crypto.randomUUID()` or database-generated).
- The frontend already has access to the ID via `useOnlineSessionStore((s) => s.currentUniverseId)`.

**No copy-to-clipboard pattern exists in the codebase yet.** This would be a new interaction.

---

## Approach Comparison

### Requirement A: API Comprehensive Logging

| Approach | Pros | Cons | Complexity |
|----------|------|------|------------|
| **A1: pino** (structured JSON logger) | Industry standard for Node.js; fast (low overhead); built-in support for child loggers, request IDs, log levels; `pino-pretty` for dev readability; `pino.destination` for file streams | Adds a dependency; team must learn pino API | Medium |
| **A2: winston** (general-purpose logger) | Very popular; flexible transports (console, file, HTTP); easy to configure multiple outputs | Heavier than pino; synchronous by default; more config surface | Medium |
| **A3: Custom logger wrapping console** | Zero dependencies; simple; matches existing `[api]`/`[db]` prefix pattern | No structured output; no file transport; limited features; reinventing the wheel | Low |
| **A4: Express middleware (morgan) + custom logger** | Morgan is standard for HTTP request logging; pair with pino/winston for app logging | Two dependencies; morgan only covers HTTP, not app-level logs | Medium |

### Requirement B: Log File Export (Local)

| Approach | Pros | Cons | Complexity |
|----------|------|------|------------|
| **B1: pino with `pino.destination` + tee to stdout** | Single library handles both stdout and file via `pino.multistream`; no shell piping needed | Requires pino (aligns with A1) | Low |
| **B2: winston with Console + File transports** | Built-in multi-transport; easy to configure independently | Requires winston (aligns with A2) | Low |
| **B3: Custom writable stream multiplexer** | No dependency | Fragile; must handle rotation, encoding, error handling manually | Medium |

### Requirement C: Replace Title with Universe Name

| Approach | Pros | Cons | Complexity |
|----------|------|------|------------|
| **C1: Conditional rendering in `header-center`** | Minimal change; already have `currentUniverseName` in the component; show universe name when in online-editing mode, fall back to app title otherwise | None significant | Low |
| **C2: Lift title to a new `TitleBar` sub-component** | Better separation of concerns | Over-engineering for a simple conditional | Low-Medium |

### Requirement D: Display Universe ID with Copy Button

| Approach | Pros | Cons | Complexity |
|----------|------|------|------------|
| **D1: Inline in `header-center` or `header-left`, use `navigator.clipboard.writeText`** | Simple; no dependencies; `navigator.clipboard` is widely supported; can show a brief "Copied!" toast | Must handle clipboard permission errors gracefully | Low |
| **D2: Create a reusable `CopyableId` component** | Reusable; encapsulates the copy logic and tooltip | Slightly more files; may be over-engineering if only used once | Low-Medium |

---

## Recommended Approach

**Logging (A1 + B1): Use `pino` with `pino-pretty` (dev) and `pino.multistream` (stdout + file).**

Rationale:
- Pino is the fastest structured logger for Node.js and is the de facto standard for Express applications.
- It supports child loggers (for request-scoped context), log levels, and JSON output -- all essential for "comprehensive logging".
- `pino.multistream` natively supports writing to both stdout and a file simultaneously with minimal configuration.
- The `pino-http` middleware provides automatic request/response logging with timing, status codes, and request IDs.
- Adding a `LOG_LEVEL` field to `AppEnv` aligns with the existing centralized config pattern (`apps/api/src/config/env.ts`).

**Title replacement (C1): Conditional rendering in `AppHeader.tsx`.**

Rationale:
- The component already imports `currentUniverseName` from the store. A simple ternary in `header-center` replaces the hard-coded title with the universe name when available.
- Remove or repurpose the existing `header-universe-name` span in `header-left` to avoid duplication.

**Universe ID with copy (D1): Inline in `AppHeader.tsx` using `navigator.clipboard.writeText`.**

Rationale:
- The component already reads `currentUniverseId`. A small inline element with a copy button and brief feedback state is straightforward.
- No external dependencies needed; the Clipboard API is supported in all modern browsers.

---

## Risks

1. **pino + ESM compatibility**: The API uses ESM (`"type": "module"`). Pino v8+ supports ESM natively, but `pino-pretty` and `pino-http` need version verification. Mitigation: pin known-good versions.
2. **Log file path and rotation**: Writing logs to a file locally requires choosing a path (e.g., `apps/api/logs/`). Without log rotation, files could grow unbounded. Mitigation: document the path; rotation is out of scope for the initial implementation but can be added later via `pino-roll` or OS-level logrotate.
3. **Clipboard API permissions**: On some browsers (especially non-HTTPS localhost), `navigator.clipboard.writeText` may fail silently. Mitigation: wrap in try/catch and fall back to a `document.execCommand('copy')` polyfill or show an error toast.
4. **Title truncation**: Long universe names could overflow the center header area. Mitigation: apply `text-overflow: ellipsis` with a `max-width` (similar to the existing `.header-universe-name` style).

---

## Open Questions

1. **Log level default**: Should the default log level be `info` (standard) or `debug` (verbose for local dev)? Recommend `info` for general use with `LOG_LEVEL=debug` available via env var.
2. **Log file location**: `apps/api/logs/` (workspace-local) vs project root `logs/`? Recommend `apps/api/logs/` to keep it scoped to the API workspace.
3. **Request ID header**: Should the API expose a `X-Request-Id` header for correlation? This is a nice-to-have that pino-http supports easily.
4. **Offline mode title**: When not in online mode (no universe loaded), should the title remain "Nested Solar System Constructor" or change? Recommend keeping the fallback title.
5. **Universe ID display format**: Show full UUID or a truncated version (e.g., first 8 chars)? Recommend showing a truncated version with the full UUID available on hover/copy.
