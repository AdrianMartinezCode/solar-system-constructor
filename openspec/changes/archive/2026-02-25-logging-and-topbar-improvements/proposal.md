# Proposal: logging-and-topbar-improvements

## Triage Classification

| Dimension | Value |
|-----------|-------|
| **Size** | Medium (4 requirements, ~8-12 tasks) |
| **Type** | Feature + Infrastructure |
| **Risk** | Low-Medium |

---

## Intent

The API currently relies on scattered `console.log` / `console.error` calls with ad-hoc prefixes and no structured output, making it difficult to trace request flows, diagnose issues, or audit system behavior. At the same time, the frontend top bar displays a hard-coded application title regardless of context, and the universe identifier -- already available in client state -- is never surfaced to the user.

This change introduces structured, leveled logging across the API layer with file export support for local development, and enhances the top bar to display contextual universe information with a copy-to-clipboard affordance for the universe ID.

---

## Scope

### In scope

- Install and configure `pino` as the structured logger for the API, with `pino-pretty` for human-readable dev output.
- Add `pino-http` middleware for automatic request/response logging (method, URL, status, response time).
- Replace all existing `console.log` / `console.error` calls in the API with `pino` logger calls at appropriate levels.
- Add `LOG_LEVEL` and `LOG_FILE` environment variables to `AppEnv` for runtime configuration.
- Configure `pino.multistream` to write to both stdout and a local log file when `LOG_FILE` is set (local development).
- Add log file patterns and log directories to `.gitignore`.
- Replace the hard-coded center title in `AppHeader.tsx` with the universe name when editing a universe in online mode; fall back to the default application title otherwise.
- Display the universe identifier in the top bar (when in online mode) with a button that copies the full UUID to the clipboard using `navigator.clipboard.writeText`.
- Provide brief visual feedback (e.g., "Copied!" tooltip/state) after a successful copy action.

### Out of scope

- Log rotation or log management tooling (e.g., `pino-roll`, `logrotate`).
- Request correlation IDs or `X-Request-Id` header propagation (can be added in a follow-up).
- Centralized log aggregation or remote log shipping.
- Changes to the frontend's own console logging or adding a frontend logging library.
- Refactoring `AppHeader.tsx` into smaller sub-components (the changes are small enough to remain inline).
- Creating a reusable `CopyableId` component (only one usage site exists currently).
- Modifying the offline-mode top bar behavior (it retains the default title).
- Adding unit tests for logging (no test runner is configured yet).

---

## Approach

### API Logging (Backend)

Adopt `pino` as the single structured logger for the entire API workspace. A central logger instance will be created in a new module (e.g., `apps/api/src/config/logger.ts`) that reads `LOG_LEVEL` from the environment config. This logger will be imported by all modules that currently use `console.log` or `console.error`. The `pino-http` Express middleware will be wired into the app factory (`apps/api/src/app.ts`) to provide automatic request/response logging with timing data.

### Log File Export

When running locally, the logger will support writing to a file in addition to stdout. This will be achieved through `pino.multistream`, which can target both `process.stdout` and a file writable stream. The file path will be controlled by a `LOG_FILE` environment variable (defaulting to unset, meaning stdout-only). When `LOG_FILE` is set (e.g., `LOG_FILE=logs/api.log`), the logger will write to both destinations. The `logs/` directory and `*.log` files will be added to `.gitignore`.

### UI Title Replacement

In `AppHeader.tsx`, the `header-center` section will use conditional rendering: when `currentUniverseName` is available (online mode, editing a universe), display the universe name as the title; otherwise, display the default "Nested Solar System Constructor". The existing universe name label in `header-left` will be removed or repurposed to avoid duplication. CSS will include `text-overflow: ellipsis` protection for long names.

### UI Universe ID with Copy

In `AppHeader.tsx`, when `currentUniverseId` is available, a compact element will display a truncated version of the UUID alongside a copy button. Clicking the button will invoke `navigator.clipboard.writeText(currentUniverseId)` and toggle a brief "Copied!" feedback state. The implementation will wrap the clipboard call in a try/catch to handle permission failures gracefully.

---

## Affected Areas

### Backend

- `apps/api/package.json` -- add `pino`, `pino-pretty`, `pino-http` dependencies
- `apps/api/src/config/env.ts` -- add `LOG_LEVEL` and `LOG_FILE` fields to `AppEnv`
- `apps/api/src/config/logger.ts` -- **new file**: central pino logger factory
- `apps/api/src/app.ts` -- integrate `pino-http` middleware, replace `console.error` in error handler
- `apps/api/src/server.ts` -- replace `console.log` / `console.error` with logger
- `apps/api/src/routes/universes.ts` -- add route-level logging (CRUD operations)
- `apps/api/src/routes/commands.ts` -- add logging for command ingestion and SSE events
- `apps/api/src/mcp/transport.ts` -- add logging for MCP transport lifecycle
- `apps/api/src/mcp/server.ts` -- add logging for MCP server events
- `apps/api/src/app/services/commandService.ts` -- add logging for command processing
- `apps/api/src/infra/db/postgresProvider.ts` -- replace `console.log` with logger
- `apps/api/src/infra/db/noopProvider.ts` -- replace `console.log` with logger
- `apps/api/src/infra/realtime/inMemoryCommandGateway.ts` -- add logging for gateway events

### Frontend

- `apps/web/src/components/AppHeader.tsx` -- conditional title rendering, universe ID display with copy button
- `apps/web/src/components/AppHeader.css` -- styles for universe ID element, copy button, "Copied!" feedback, title truncation

### Config

- `.gitignore` -- add `*.log`, `logs/` patterns
- `compose.yaml` -- optionally document `LOG_LEVEL` env var (no change required if not setting it)

---

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| **pino ESM compatibility** -- the API uses `"type": "module"`; pino v8+ supports ESM but transitive deps need verification | Low | Medium | Pin known-good versions of `pino`, `pino-pretty`, `pino-http`; verify imports work before proceeding |
| **Unbounded log file growth** -- local log files have no rotation | Low | Low | Out of scope for this change; document that rotation can be added later; developers can delete/truncate manually |
| **Clipboard API failures** -- `navigator.clipboard.writeText` may fail on non-HTTPS or unsupported browsers | Low | Low | Wrap in try/catch; show error feedback if copy fails; localhost with most modern browsers is fine |
| **Title overflow** -- long universe names could break header layout | Low | Low | Apply `text-overflow: ellipsis` and `max-width` on the title element |
| **Console.log migration completeness** -- missing a `console.log` call leaves inconsistent logging | Medium | Low | Thorough search for all `console.log`/`console.error` in `apps/api/src/` during implementation; verify phase catches stragglers |

---

## Rollback Plan

1. **API logging**: Revert the `pino`, `pino-pretty`, and `pino-http` dependency additions from `apps/api/package.json`. Restore all `console.log` / `console.error` calls in the affected files (revert the diff). Remove `apps/api/src/config/logger.ts`. Remove `LOG_LEVEL` and `LOG_FILE` from `env.ts`. The API will return to its prior state with no structural impact.
2. **Log file / .gitignore**: Remove the log-related patterns from `.gitignore`. Delete any local log files. No data loss risk -- logs are ephemeral local artifacts.
3. **UI title**: Revert the conditional rendering in `AppHeader.tsx` to restore the hard-coded `"Nested Solar System Constructor"` title. Restore the `header-universe-name` span in `header-left` if it was removed.
4. **UI universe ID / copy**: Remove the universe ID display element and copy button from `AppHeader.tsx`. Remove associated CSS. No state or data changes involved.

All changes are additive and isolated to their respective layers. Rolling back any single requirement does not affect the others.

---

## Dependencies

- **npm packages**: `pino` (v8+), `pino-pretty` (v10+), `pino-http` (v9+) -- all need to support ESM (`"type": "module"`).
- **TypeScript type declarations**: `pino` ships its own types; `pino-http` ships its own types; `pino-pretty` is a dev/CLI tool and does not need types.
- **Browser API**: `navigator.clipboard.writeText` -- available in all modern browsers; no polyfill needed for the target audience.
- **Existing state**: `useOnlineSessionStore` already provides `currentUniverseId` and `currentUniverseName` to `AppHeader.tsx` -- no new state plumbing required.

---

## Success Criteria

- All `console.log` and `console.error` calls in `apps/api/src/` are replaced with structured `pino` logger calls at appropriate levels (`info`, `warn`, `error`, `debug`).
- The API produces structured JSON log output to stdout by default.
- When `LOG_LEVEL` is set via environment variable, the logger respects the configured level.
- When `LOG_FILE` is set, logs are written to both the specified file and stdout simultaneously.
- Log files (`*.log`) and log directories (`logs/`) are git-ignored and do not appear in version control.
- When editing a universe in online mode, the top bar center title displays the universe name instead of "Nested Solar System Constructor".
- When no universe is loaded (offline mode or lobby), the top bar displays the default application title.
- The universe identifier is displayed in the top bar when in online mode.
- Clicking the copy button copies the full universe UUID to the clipboard and shows brief visual confirmation.
- `npm run build` passes with no errors after all changes are applied.
- No unrelated files are modified.
