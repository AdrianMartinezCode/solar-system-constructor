# Tasks: logging-and-topbar-improvements

> Generated from: proposal.md, specs/api-logging/spec.md, specs/topbar-ui/spec.md, design.md

---

## Phase 1: Foundation

- [x] 1.1 Install logging dependencies in the API workspace
  - **Files:** `apps/api/package.json`
  - **Action:** Run `npm install pino pino-http --save` and `npm install pino-pretty --save-dev` in the `apps/api` workspace. Verify the packages appear in `dependencies` and `devDependencies` respectively.
  - **Verify:** `pino`, `pino-http` listed under `dependencies`; `pino-pretty` under `devDependencies` in `apps/api/package.json`. `npm ls pino` resolves without errors.

- [x] 1.2 Add `LOG_LEVEL` and `LOG_FILE` to `AppEnv`
  - **Files:** `apps/api/src/config/env.ts`
  - **Action:** Extend the `AppEnv` interface with `LOG_LEVEL: 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace'` and `LOG_FILE: string | undefined`. Update `loadEnv()` to read `process.env['LOG_LEVEL']` (default `'info'`) and `process.env['LOG_FILE']` (default `undefined`).
  - **Verify:** `npm run typecheck` passes. The `AppEnv` type includes both new fields.
  - **Refs:** REQ-LEVEL-1, REQ-LEVEL-2, REQ-FILE-1, REQ-FILE-4; Scenario FILE-3

- [x] 1.3 Create the central logger module
  - **Files:** `apps/api/src/config/logger.ts` (new file)
  - **Action:** Create `apps/api/src/config/logger.ts` that exports a `createLogger(env)` function and a pre-initialized `logger` instance. Use `pino.multistream` when `LOG_FILE` is set (append mode via `fs.createWriteStream`). Use `pino.transport({ target: 'pino-pretty' })` for stdout when `NODE_ENV=development` and `LOG_FILE` is not set. Default log level from `env.LOG_LEVEL`. Always write structured JSON (no pretty-print when file logging is active).
  - **Verify:** `npm run typecheck` passes. Importing `logger` from the module does not throw.
  - **Refs:** REQ-LOG-1, REQ-LOG-2, REQ-LOG-3, REQ-LOG-4, REQ-FILE-2, REQ-FILE-3; Scenarios LOG-1, LOG-2, LOG-3, FILE-1, FILE-2

- [x] 1.4 Add log file patterns to `.gitignore`
  - **Files:** `.gitignore`
  - **Action:** Append `*.log` and `logs/` patterns to the project root `.gitignore`.
  - **Verify:** Create a temporary `test.log` file and `logs/` directory; `git status` does not show them as untracked. Clean up after verification.
  - **Refs:** REQ-GIT-1; Scenario GIT-1

---

## Phase 2: Core Implementation — Backend Logging

- [x] 2.1 Wire `pino-http` middleware into the Express app
  - **Files:** `apps/api/src/app.ts`
  - **Action:** Import `pinoHttp` from `pino-http` and `logger` from `./config/logger.js`. Add `app.use(pinoHttp({ logger }))` after `cors()` and `express.json()`, before route registration. Replace `console.error('[api] unhandled error:', err.message)` in the global error handler with `logger.error({ err }, 'unhandled error')`.
  - **Verify:** `npm run typecheck` passes. No `console.error` calls remain in `app.ts`.
  - **Refs:** REQ-HTTP-1, REQ-HTTP-2, REQ-HTTP-3, REQ-REPLACE-1; Scenarios HTTP-1, HTTP-2

- [x] 2.2 Replace `console.log`/`console.error` in `server.ts` with logger calls
  - **Files:** `apps/api/src/server.ts`
  - **Action:** Import `logger` from `./config/logger.js`. Replace: `console.log('[api] universe repository: ...')` with `logger.info(...)`, `console.log('[api] command gateway: ...')` with `logger.info(...)`, `console.log('[api] listening on ...')` with `logger.info(...)`, `console.log('[api] ... received — shutting down')` with `logger.info(...)`, `console.error('[api] fatal startup error:', err)` with `logger.fatal({ err }, 'fatal startup error')`.
  - **Verify:** `npm run typecheck` passes. Zero `console.log` or `console.error` calls remain in `server.ts`.
  - **Refs:** REQ-REPLACE-1, REQ-REPLACE-2; Scenarios REPLACE-1, REPLACE-2

- [x] 2.3 Replace `console.log` in database providers with logger calls
  - **Files:** `apps/api/src/infra/db/postgresProvider.ts`, `apps/api/src/infra/db/noopProvider.ts`
  - **Action:** Import `logger` from `../../config/logger.js`. Create a child logger `const log = logger.child({ component: 'database' })`. Replace all `console.log('[db] ...')` calls with `log.info(...)`.
  - **Verify:** `npm run typecheck` passes. Zero `console.log` calls remain in either file.
  - **Refs:** REQ-LOG-4, REQ-REPLACE-1, REQ-REPLACE-2; Scenarios LOG-3, REPLACE-1, REPLACE-2

- [x] 2.4 Add logging to route handlers (`universes.ts`)
  - **Files:** `apps/api/src/routes/universes.ts`
  - **Action:** Import `logger` from `../config/logger.js`. Add `debug`-level logging at entry points of each CRUD operation (e.g., `logger.debug({ name }, 'creating universe')`, `logger.debug({ id }, 'fetching universe')`, etc.). No existing console calls to replace — this is new instrumentation.
  - **Verify:** `npm run typecheck` passes.
  - **Refs:** REQ-LOG-1

- [x] 2.5 Add logging to route handlers (`commands.ts`)
  - **Files:** `apps/api/src/routes/commands.ts`
  - **Action:** Import `logger` from `../config/logger.js`. Add `debug`-level logging for command ingestion (`logger.debug({ universeId, type }, 'processing command')`) and SSE connection lifecycle (`logger.debug({ universeId }, 'SSE client connected')`, `logger.debug({ universeId }, 'SSE client disconnected')`).
  - **Verify:** `npm run typecheck` passes.
  - **Refs:** REQ-LOG-1

- [x] 2.6 Add logging to MCP modules (`transport.ts` and `server.ts`)
  - **Files:** `apps/api/src/mcp/transport.ts`, `apps/api/src/mcp/server.ts`
  - **Action:** Import `logger` from `../config/logger.js`. In `transport.ts`, add `debug`-level logging for session initialization (`onsessioninitialized`), message handling, session close, and invalid request. In `server.ts`, add `debug`-level logging for tool invocations and error returns.
  - **Verify:** `npm run typecheck` passes.
  - **Refs:** REQ-LOG-1

- [x] 2.7 Add logging to `commandService.ts` and `inMemoryCommandGateway.ts`
  - **Files:** `apps/api/src/app/services/commandService.ts`, `apps/api/src/infra/realtime/inMemoryCommandGateway.ts`
  - **Action:** Import `logger` from the appropriate relative path. In `commandService.ts`, add `debug`-level logging for command processing start and `warn`-level logging for validation failures. In `inMemoryCommandGateway.ts`, add `debug`-level logging for broadcast, subscribe, and unsubscribe events.
  - **Verify:** `npm run typecheck` passes.
  - **Refs:** REQ-LOG-1, REQ-REPLACE-2

---

## Phase 3: Core Implementation — Frontend Top Bar

- [x] 3.1 Replace center title with conditional universe name display
  - **Files:** `apps/web/src/components/AppHeader.tsx`
  - **Action:** In the `header-center` div, replace the hard-coded `<h1 className="app-title">Nested Solar System Constructor</h1>` with a conditional: when `isOnline && currentUniverseName`, render `<h1 className="app-title" title={currentUniverseName}>{currentUniverseName}</h1>`; otherwise render the default title. Remove the `header-universe-name` span from `header-left` (lines 120-125) to avoid duplicate display.
  - **Verify:** `npm run typecheck` passes. The `header-universe-name` span no longer appears in the JSX.
  - **Refs:** REQ-TITLE-1, REQ-TITLE-2, REQ-TITLE-4; Scenarios TITLE-1, TITLE-2, TITLE-3, TITLE-5

- [x] 3.2 Add universe ID display with copy-to-clipboard button
  - **Files:** `apps/web/src/components/AppHeader.tsx`
  - **Action:** Add a `const [copied, setCopied] = useState(false)` state. Add a `handleCopyId` callback that calls `navigator.clipboard.writeText(currentUniverseId)`, sets `copied` to `true`, and resets it after 1500ms via `setTimeout`. Wrap in try/catch for clipboard failures. In the `header-center` div (below the `<h1>`), conditionally render (when `isOnline && currentUniverseId`) a `<div className="universe-id-display">` containing a `<span className="universe-id-text">` showing the first 8 characters of the UUID and a `<button className="copy-id-btn">` that invokes `handleCopyId`. When `copied` is true, the button text changes to "Copied!" and the button gets an additional `copied` class.
  - **Verify:** `npm run typecheck` passes. The copy button and truncated ID appear in the JSX.
  - **Refs:** REQ-ID-1, REQ-ID-2, REQ-ID-3, REQ-COPY-1, REQ-COPY-2, REQ-COPY-3; Scenarios ID-1, ID-2, COPY-1, COPY-2, COPY-3

- [x] 3.3 Add CSS styles for universe ID display and title truncation
  - **Files:** `apps/web/src/components/AppHeader.css`
  - **Action:** Add `max-width` and `text-overflow: ellipsis` + `overflow: hidden` + `white-space: nowrap` to `.app-title` for long name truncation. Add styles for `.universe-id-display` (layout with gap, centered), `.universe-id-text` (monospace font, muted color, small size), `.copy-id-btn` (small button matching existing header button style), and `.copy-id-btn.copied` (success color, e.g., `#44cc77` matching the existing saved-state style).
  - **Verify:** `npm run build` passes (CSS is valid). Title truncation and ID display have appropriate styling.
  - **Refs:** REQ-TITLE-3; Scenario TITLE-4

---

## Phase 4: Integration & Verification

- [x] 4.1 Full build and typecheck
  - **Files:** (all modified files)
  - **Action:** Run `npm run build` and `npm run typecheck` from the project root. Fix any type errors or build failures.
  - **Verify:** Both commands exit with code 0 and no errors.
  - **Refs:** Success criteria: "npm run build passes with no errors after all changes are applied."

- [x] 4.2 Verify no remaining `console.log`/`console.error` in API source tree
  - **Files:** All files under `apps/api/src/`
  - **Action:** Run a text search for `console.log` and `console.error` across the entire `apps/api/src/` directory. Any matches must be justified (e.g., third-party code or build tooling) or converted to logger calls.
  - **Verify:** Zero matches for operational console calls in `apps/api/src/`.
  - **Refs:** REQ-REPLACE-1; Scenario REPLACE-1

- [x] 4.3 Verify no unrelated files modified
  - **Files:** N/A
  - **Action:** Run `git diff --name-only` and confirm every modified file is listed in the design's File Changes Table. No files outside the approved list should be modified (exception: `package-lock.json` changes from dependency installation are acceptable).
  - **Verify:** All changed files are in the approved set.
  - **Refs:** Success criteria: "No unrelated files are modified."

---

## Phase 5: Cleanup

- [x] 5.1 Remove the deprecated `.header-universe-name` CSS rule
  - **Files:** `apps/web/src/components/AppHeader.css`
  - **Action:** Remove the `.header-universe-name` CSS rule block (currently around lines 267-276) since the corresponding HTML element was removed in task 3.1. The styling is now dead code.
  - **Verify:** `npm run build` passes. No CSS rule for `.header-universe-name` exists in the file.
  - **Refs:** REQ-TITLE-4; Scenario TITLE-5
