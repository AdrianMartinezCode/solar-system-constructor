# Design: logging-and-topbar-improvements

## Technical Approach

This change spans two independent workstreams -- backend structured logging and frontend top-bar enhancements -- that share no runtime coupling and can be implemented in parallel.

**Backend (API logging):** Introduce `pino` as the single structured logger for the entire `apps/api` workspace. A new `apps/api/src/config/logger.ts` module will create a root pino instance configured from `AppEnv`. Every file that currently uses `console.log` or `console.error` will import from this module instead. The `pino-http` Express middleware will be wired into the app factory to provide automatic request/response logging with timing data. When the `LOG_FILE` environment variable is set, `pino.multistream` will write JSON log lines to both `process.stdout` and a file writable stream simultaneously.

**Frontend (top-bar):** Modify `apps/web/src/components/AppHeader.tsx` to (a) conditionally display the universe name as the center title when editing a universe in online mode, and (b) display a truncated universe ID with a copy-to-clipboard button that shows brief "Copied!" feedback. The existing `header-universe-name` span in `header-left` will be removed to avoid duplication since the universe name moves to `header-center`. Both changes rely exclusively on state already provided by `useOnlineSessionStore` -- no new data plumbing is required.

All changes are additive and isolated to their respective layers. The backend changes do not affect the frontend and vice versa. The build pipeline (`npm run build`) and type-checking (`npm run typecheck`) must continue to pass after all modifications.

---

## Architecture Decisions

### Decision 1: Use pino as the structured logger

**Description:** Replace all `console.log`/`console.error` calls in the API with `pino`, a fast structured JSON logger for Node.js.

**Rationale:** Pino is the performance leader among Node.js loggers (async by default, low overhead, JSON-native). It ships its own TypeScript types, supports child loggers for scoped context, and has a rich middleware ecosystem (`pino-http`). The API currently uses ad-hoc `console.log` with manual `[api]`/`[db]` prefixes -- pino replaces this with structured, leveled output that includes timestamps, log levels, and contextual metadata by default.

**Alternatives considered:**
- **winston**: More popular by download count but synchronous by default, heavier, and more configuration surface. The API does not need winston's transport system (Syslog, HTTP, etc.) -- only stdout and optional file output.
- **Custom logger wrapping console**: Zero dependencies but no structured output, no log levels, no file transport, no request timing. Reinvents the wheel for a problem pino already solves.
- **morgan (for HTTP) + custom app logger**: Two dependencies serving different concerns. `pino-http` unifies both HTTP request logging and application logging under a single pino instance with consistent output format.

**Choice:** `pino` with `pino-pretty` (dev) and `pino-http` (request middleware).

---

### Decision 2: Central logger module at `apps/api/src/config/logger.ts`

**Description:** Create a single logger factory module in the `config/` directory that exports a configured pino instance.

**Rationale:** The existing `config/` directory already holds `env.ts` (environment parsing) and `cors.ts` (CORS origins). Placing the logger here follows the established convention of centralizing configuration concerns. All other modules import from `config/logger.ts` rather than configuring pino independently, ensuring consistent log format and levels across the entire API.

**Alternatives considered:**
- **`apps/api/src/lib/logger.ts`**: No `lib/` directory exists in the project. Creating one for a single file adds unnecessary structure.
- **Inline pino configuration in `app.ts`**: Couples the logger lifecycle to the Express app factory. Modules like `server.ts` and `postgresProvider.ts` need to log before the Express app is created.
- **`apps/api/src/utils/logger.ts`**: No `utils/` directory exists in the API workspace either. `config/` is the natural home.

**Choice:** `apps/api/src/config/logger.ts` exporting a root `logger` instance.

---

### Decision 3: pino.multistream for dual stdout + file output

**Description:** When `LOG_FILE` is set, use `pino.multistream` to write to both `process.stdout` and a writable file stream. When unset, write to `process.stdout` only.

**Rationale:** `pino.multistream` is pino's built-in mechanism for multi-destination logging. It accepts an array of stream targets and handles backpressure correctly. This avoids shell-level piping (`tee`) or third-party multiplexers. The file stream is created with `fs.createWriteStream` using append mode (`flags: 'a'`) so logs accumulate across restarts.

**Alternatives considered:**
- **`pino.destination()`**: Only supports a single destination. Would require choosing between stdout and file, not both.
- **`pino.transport()` with worker threads**: More complex, intended for production log shipping to remote targets. Overkill for local file output.
- **Shell-level `tee`**: Requires the operator to remember the piping; not self-contained; doesn't work in Docker Compose without extra configuration.

**Choice:** `pino.multistream` with conditional file stream based on `LOG_FILE` env var.

---

### Decision 4: Add LOG_LEVEL and LOG_FILE to AppEnv

**Description:** Extend the `AppEnv` interface and `loadEnv()` function in `apps/api/src/config/env.ts` to include `LOG_LEVEL` and `LOG_FILE`.

**Rationale:** The project convention is that all environment variable access goes through `config/env.ts` -- the file header comment explicitly states "All env access goes through this module". Adding `LOG_LEVEL` (with a default of `'info'`) and `LOG_FILE` (optional, defaulting to `undefined`) follows this pattern. The logger module reads these values from the parsed `AppEnv` object rather than accessing `process.env` directly.

**Alternatives considered:**
- **Read `process.env.LOG_LEVEL` directly in logger.ts**: Violates the project's centralized env convention. Would be the only module bypassing `loadEnv()`.
- **Separate logging config file**: Over-engineering for two env vars. The existing `AppEnv` pattern keeps all config in one place.

**Choice:** Add both fields to `AppEnv` interface and `loadEnv()`.

---

### Decision 5: pino-http middleware placement in the Express pipeline

**Description:** Wire `pino-http` middleware immediately after body parsing (`express.json`) and before route registration in `apps/api/src/app.ts`.

**Rationale:** Placing the request logger early in the middleware chain ensures all requests are logged, including those that hit the CORS middleware or fail validation. Placing it after `express.json` ensures the request body is available for potential serialization in debug mode. The `pino-http` middleware attaches `req.log` (a child logger) to each request, which route handlers could use for request-scoped logging if desired in the future.

**Alternatives considered:**
- **Before `cors()` middleware**: Would log CORS preflight `OPTIONS` requests, which adds noise without value.
- **After route registration**: Would miss logging for requests that error out during middleware processing.

**Choice:** After `express.json()` and `cors()`, before route mounting.

---

### Decision 6: Conditional title rendering in header-center

**Description:** Replace the hard-coded `<h1>` title in `header-center` with conditional rendering: show universe name when in online editing mode, show default title otherwise.

**Rationale:** The component already imports `currentUniverseName` from `useOnlineSessionStore`. A simple ternary expression replaces the static title. The existing `header-universe-name` span in `header-left` (lines 121-125 of `AppHeader.tsx`) becomes redundant since the universe name moves to the center title -- it will be removed to avoid duplication.

**Alternatives considered:**
- **Keep both the center title and the left-side universe name label**: Creates visual duplication. The center title is more prominent and is the correct location for the universe name.
- **Create a separate `TitleBar` sub-component**: Over-engineering for a single ternary. The proposal explicitly lists this as out of scope.

**Choice:** Inline conditional rendering in `AppHeader.tsx` with removal of the duplicate `header-universe-name` span.

---

### Decision 7: Inline copy-to-clipboard with useState feedback

**Description:** Display a truncated universe ID in `header-center` below the title, with a copy button that uses `navigator.clipboard.writeText` and toggles a brief "Copied!" state via `useState`.

**Rationale:** The Clipboard API is available in all modern browsers (the target audience). A local `useState<boolean>` for `copied` with a `setTimeout` to reset it after ~1.5s is the simplest React pattern for transient feedback. Wrapping the clipboard call in `try/catch` handles permission failures gracefully. The truncated display (first 8 characters of the UUID) keeps the header compact while the full UUID is copied.

**Alternatives considered:**
- **Reusable `CopyableId` component**: Only one usage site exists. The proposal explicitly lists this as out of scope.
- **`document.execCommand('copy')` fallback**: Deprecated API. All modern browsers on localhost support the Clipboard API.
- **Toast/notification system**: No toast system exists in the app. Adding one for a single use case is over-engineering.

**Choice:** Inline `navigator.clipboard.writeText` with `useState` feedback in `AppHeader.tsx`.

---

## Data Flow

### Backend: Request logging flow

```
                    ┌─────────────────────────────────────┐
                    │         apps/api/src/app.ts          │
                    │                                      │
  HTTP Request ───> │  cors()                              │
                    │    │                                  │
                    │    v                                  │
                    │  express.json()                       │
                    │    │                                  │
                    │    v                                  │
                    │  pinoHttp({ logger })  ◄── config/logger.ts
                    │    │                       │              │
                    │    │  attaches req.log      │  reads from  │
                    │    │  (child logger)        │  AppEnv      │
                    │    v                       │              │
                    │  routes (universes,         │              │
                    │   commands, mcp, health)    │              │
                    │    │                       ▼              │
                    │    v                   ┌──────────┐       │
                    │  error handler         │ AppEnv   │       │
                    │    │  uses logger.error│ LOG_LEVEL│       │
                    │    v                   │ LOG_FILE │       │
  HTTP Response <── │  (auto-logged by       └──────────┘       │
                    │   pino-http on finish)                     │
                    └─────────────────────────────────────┘
```

### Backend: Logger initialization with multistream

```
  loadEnv() ──> AppEnv { LOG_LEVEL, LOG_FILE }
                    │
                    v
            ┌───────────────────────────────┐
            │   config/logger.ts            │
            │                               │
            │   streams = [{ stream:        │
            │     process.stdout }]         │
            │                               │
            │   if (LOG_FILE) {             │
            │     streams.push({            │
            │       stream: fs.create       │
            │       WriteStream(LOG_FILE,   │
            │       { flags: 'a' })         │
            │     })                        │
            │   }                           │
            │                               │
            │   logger = pino(              │
            │     { level: LOG_LEVEL },     │
            │     pino.multistream(streams) │
            │   )                           │
            │                               │
            │   export { logger }           │
            └───────────────────────────────┘
                    │
          ┌─────────┼─────────┬──────────┐
          v         v         v          v
      server.ts  app.ts  postgres   noopProvider
                         Provider
```

### Frontend: Top bar conditional rendering flow

```
  useOnlineSessionStore ──> { currentUniverseId, currentUniverseName }
  useAppModeStore ────────> { mode }
         │
         v
  ┌──────────────────────────────────────────────────────┐
  │                   AppHeader.tsx                       │
  │                                                      │
  │  header-left                                         │
  │  ├─ [Back] button (online only)                      │
  │  ├─ ConnectionStatusIndicator (online only)          │
  │  └─ SpeedControl                                     │
  │                                                      │
  │  header-center                                       │
  │  ├─ <h1>                                             │
  │  │   mode=online && currentUniverseName              │
  │  │     ? currentUniverseName                         │
  │  │     : "Nested Solar System Constructor"           │
  │  │                                                   │
  │  └─ (online && currentUniverseId)                    │
  │      ├─ truncated ID (first 8 chars)                 │
  │      └─ [Copy] button ──> clipboard.writeText()      │
  │           │                                          │
  │           └──> copied state (true for 1.5s)          │
  │                └──> "Copied!" feedback               │
  │                                                      │
  │  header-right                                        │
  │  ├─ Generate button                                  │
  │  └─ Save button (online only)                        │
  └──────────────────────────────────────────────────────┘
```

---

## File Changes Table

| Path | Action | Purpose |
|------|--------|---------|
| `apps/api/package.json` | Modify | Add `pino`, `pino-http` to `dependencies`; add `pino-pretty` to `devDependencies` |
| `apps/api/src/config/env.ts` | Modify | Add `LOG_LEVEL` and `LOG_FILE` fields to `AppEnv` interface and `loadEnv()` |
| `apps/api/src/config/logger.ts` | **Add** | New module: creates and exports a configured pino logger instance with multistream support |
| `apps/api/src/app.ts` | Modify | Import logger; add `pino-http` middleware; replace `console.error` in error handler with `logger.error` |
| `apps/api/src/server.ts` | Modify | Import logger; replace all `console.log`/`console.error` calls with `logger.info`/`logger.error`/`logger.fatal` |
| `apps/api/src/routes/universes.ts` | Modify | Import logger; add `debug`-level logging for CRUD operations (create, get, list, update, delete) |
| `apps/api/src/routes/commands.ts` | Modify | Import logger; add `debug`-level logging for command ingestion and SSE connection lifecycle |
| `apps/api/src/mcp/transport.ts` | Modify | Import logger; add `debug`-level logging for MCP session init, message handling, and teardown |
| `apps/api/src/mcp/server.ts` | Modify | Import logger; add `debug`-level logging for MCP tool invocations and errors |
| `apps/api/src/app/services/commandService.ts` | Modify | Import logger; add `debug`-level logging for command processing and `warn` for validation failures |
| `apps/api/src/infra/db/postgresProvider.ts` | Modify | Import logger; replace `console.log` with `logger.info` for connect/disconnect |
| `apps/api/src/infra/db/noopProvider.ts` | Modify | Import logger; replace `console.log` with `logger.info` for connect/disconnect |
| `apps/api/src/infra/realtime/inMemoryCommandGateway.ts` | Modify | Import logger; add `debug`-level logging for broadcast and subscribe/unsubscribe events |
| `.gitignore` | Modify | Add `*.log` and `logs/` patterns |
| `apps/web/src/components/AppHeader.tsx` | Modify | Conditional title rendering; remove duplicate universe name span from header-left; add universe ID display with copy button |
| `apps/web/src/components/AppHeader.css` | Modify | Add styles for `.universe-id-display`, `.universe-id-text`, `.copy-id-btn`, `.copy-id-btn.copied`; add `text-overflow: ellipsis` + `max-width` to `.app-title` |

---

## Interfaces/Contracts

### AppEnv (modified)

```typescript
// apps/api/src/config/env.ts

export interface AppEnv {
  PORT: number;
  DB_PROVIDER: 'noop' | string;
  DATABASE_URL: string | undefined;
  NODE_ENV: 'development' | 'production' | 'test';

  /** Pino log level. Defaults to 'info'. */
  LOG_LEVEL: 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace';

  /** Optional path to a log file. When set, logs are written to both stdout and this file. */
  LOG_FILE: string | undefined;
}
```

### Logger module (new)

```typescript
// apps/api/src/config/logger.ts

import pino from 'pino';
import type { Logger } from 'pino';

/**
 * Create the application-wide pino logger.
 *
 * - Reads LOG_LEVEL and LOG_FILE from the provided AppEnv.
 * - Always writes structured JSON to stdout.
 * - When LOG_FILE is set, also writes to the specified file path (append mode).
 * - In development (NODE_ENV=development), uses pino-pretty for stdout.
 */
export function createLogger(env: {
  LOG_LEVEL: string;
  LOG_FILE: string | undefined;
  NODE_ENV: string;
}): Logger;

/**
 * Pre-initialized logger instance for import convenience.
 * Initialized eagerly on module load using loadEnv().
 */
export const logger: Logger;
```

### pino-http middleware integration

```typescript
// apps/api/src/app.ts — middleware section (conceptual)

import pinoHttp from 'pino-http';
import { logger } from './config/logger.js';

// After cors() and express.json(), before routes:
app.use(pinoHttp({ logger }));
```

### AppHeader copy-to-clipboard (conceptual)

```typescript
// apps/web/src/components/AppHeader.tsx — new state and handler

const [copied, setCopied] = useState(false);

const handleCopyId = useCallback(async () => {
  if (!currentUniverseId) return;
  try {
    await navigator.clipboard.writeText(currentUniverseId);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  } catch {
    // Clipboard API not available — fail silently
  }
}, [currentUniverseId]);
```

---

## Testing Strategy

No test runner is configured in this project (noted in both the exploration and proposal as out of scope). Therefore:

- **Manual verification (API logging):**
  1. Start the API with `npm run dev:api` and confirm structured JSON output on stdout.
  2. Set `LOG_LEVEL=debug` and verify verbose output appears.
  3. Set `LOG_FILE=logs/api.log` and verify the file is created and receives log lines alongside stdout.
  4. Verify `pino-pretty` formats output readably in development mode.
  5. Send HTTP requests and confirm `pino-http` logs method, URL, status code, and response time.

- **Manual verification (UI):**
  1. Open the app in offline mode -- confirm the center title reads "Nested Solar System Constructor".
  2. Switch to online mode and open a universe -- confirm the center title shows the universe name.
  3. Confirm the universe name label in `header-left` is gone (no duplication).
  4. Confirm the truncated universe ID appears below the title.
  5. Click the copy button -- confirm the full UUID is in the clipboard and "Copied!" feedback appears briefly.
  6. Verify title truncation with a long universe name (ellipsis should appear).

- **Build verification:**
  - `npm run build` must pass with zero errors.
  - `npm run typecheck` must pass with zero errors.

---

## Migration/Rollout Plan

This change is fully additive and does not modify any data models, database schemas, or API contracts. No phased rollout or feature flags are needed.

**Deployment steps:**
1. Install new dependencies: `npm install` (adds pino, pino-http, pino-pretty).
2. Deploy the updated API. Log output changes from unstructured `console.log` to structured JSON -- any log consumers should be aware of the format change.
3. Optionally set `LOG_LEVEL` and `LOG_FILE` in the environment. Defaults (`info` level, no file) provide the same visibility as before with better structure.
4. Deploy the updated frontend. No configuration needed -- the UI changes are purely presentational.

**Backward compatibility:** The API continues to serve the same HTTP endpoints with the same request/response formats. The only observable difference is log output format (from text to JSON). No client-facing breaking changes.

---

## Open Questions

1. **pino-pretty activation method**: Should `pino-pretty` be activated via `pino.transport()` (worker thread, recommended by pino docs for production safety) or via direct stream piping? **Recommendation:** Use `pino.transport({ target: 'pino-pretty' })` only when `NODE_ENV=development` and `LOG_FILE` is unset (stdout-only mode). When `LOG_FILE` is set, use `pino.multistream` with raw JSON to both destinations (pino-pretty is not compatible with multistream's stream array). This means development with file logging gets JSON output, not pretty output -- acceptable since the file is meant for programmatic consumption.

2. **Logger initialization timing**: The logger module will call `loadEnv()` at import time to create the default `logger` export. This means the env must be available when the module is first imported. Since `loadEnv()` reads from `process.env` (which is populated before any module loads), this is safe. The alternative -- requiring explicit initialization -- would add boilerplate to every importing module.

3. **Request-scoped child loggers**: `pino-http` attaches `req.log` to each request. Route handlers could use `req.log.info(...)` for request-correlated logging. For this change, route-level logging will use the global `logger` import for simplicity. A follow-up change could adopt `req.log` when request correlation IDs are added.
