# Spec: api-logging

---

## Overview

The API logging domain governs how the backend API produces operational log output. The system MUST use a structured, leveled logger as its sole logging mechanism -- replacing all ad-hoc console output. The logger MUST support runtime level configuration, automatic HTTP request/response logging, and optional dual-destination output (stdout and a local file) controlled by environment variables. Log files produced locally MUST be excluded from version control.

---

## Requirements

### Structured Logger

**REQ-LOG-1** -- The API MUST produce all operational log output through a single structured logger instance. Raw `console.log` and `console.error` calls MUST NOT be used for operational logging anywhere in the API source tree.

**REQ-LOG-2** -- The structured logger MUST emit log entries as JSON objects to stdout by default. Each log entry MUST include at minimum: a severity level, a timestamp, and a message string.

**REQ-LOG-3** -- The structured logger MUST support the following severity levels, in ascending order of severity: `debug`, `info`, `warn`, `error`, `fatal`.

**REQ-LOG-4** -- The logger MUST support child logger instances that inherit the parent's configuration and MAY carry additional contextual fields (e.g., a component label).

### Log Level Configuration

**REQ-LEVEL-1** -- The API MUST accept a `LOG_LEVEL` environment variable that sets the minimum severity level for log output. The value MUST be one of: `debug`, `info`, `warn`, `error`, `fatal`.

**REQ-LEVEL-2** -- When `LOG_LEVEL` is not set, the logger MUST default to the `info` level.

**REQ-LEVEL-3** -- Log entries below the configured minimum level MUST be suppressed and MUST NOT appear in any output destination.

### HTTP Request/Response Logging

**REQ-HTTP-1** -- The API MUST automatically log every incoming HTTP request and its corresponding response. This logging MUST be applied as middleware to the Express application.

**REQ-HTTP-2** -- Each HTTP request/response log entry MUST include at minimum: the HTTP method, the request URL path, the response status code, and the response time in milliseconds.

**REQ-HTTP-3** -- HTTP request/response logging SHOULD use the same structured logger instance and output format as application-level logging.

### Log File Export

**REQ-FILE-1** -- The API MUST accept a `LOG_FILE` environment variable specifying a file path for log output.

**REQ-FILE-2** -- When `LOG_FILE` is set, the logger MUST write log entries to both stdout and the specified file simultaneously. Neither destination SHALL be silenced when both are active.

**REQ-FILE-3** -- When `LOG_FILE` is not set, the logger MUST write to stdout only. No file output SHALL be produced.

**REQ-FILE-4** -- The `LOG_FILE` and `LOG_LEVEL` environment variables MUST be declared in the API's centralized environment configuration alongside other environment settings.

### Version Control Exclusion

**REQ-GIT-1** -- The project's `.gitignore` MUST include patterns that exclude log files (glob pattern `*.log`) and log directories (glob pattern `logs/`) from version control.

### Console Replacement Completeness

**REQ-REPLACE-1** -- Every `console.log` and `console.error` call in the API source tree that produces operational output MUST be replaced with an equivalent structured logger call at an appropriate severity level.

**REQ-REPLACE-2** -- Replacement calls SHOULD use severity levels as follows: informational startup/lifecycle messages at `info`; warnings at `warn`; error conditions at `error`; verbose diagnostic output at `debug`.

---

## Scenarios

### Scenario LOG-1 (REQ-LOG-1, REQ-LOG-2): Structured JSON output on stdout

**Given** the API is started with default configuration (no `LOG_FILE` set)
**When** the API produces a log entry during normal operation
**Then** the entry is written to stdout as a valid JSON object containing at least `level`, `time`, and `msg` fields.

### Scenario LOG-2 (REQ-LOG-3): Severity levels are supported

**Given** the logger is initialized
**When** a log entry is emitted at the `warn` level
**Then** the JSON output contains a `level` field whose value maps to the `warn` severity.

### Scenario LOG-3 (REQ-LOG-4): Child logger carries contextual fields

**Given** a child logger is created with a `component` field set to `"database"`
**When** the child logger emits an `info`-level message
**Then** the resulting JSON log entry includes the field `component` with value `"database"` in addition to the standard fields.

### Scenario LEVEL-1 (REQ-LEVEL-1, REQ-LEVEL-2): Default log level is info

**Given** the API is started without a `LOG_LEVEL` environment variable
**When** a `debug`-level entry is emitted
**Then** the entry is suppressed and does not appear on stdout.

### Scenario LEVEL-2 (REQ-LEVEL-1, REQ-LEVEL-3): Custom log level filters output

**Given** the API is started with `LOG_LEVEL=warn`
**When** an `info`-level entry is emitted
**Then** the entry is suppressed and does not appear on stdout
**And** when a `warn`-level entry is emitted, it appears on stdout.

### Scenario HTTP-1 (REQ-HTTP-1, REQ-HTTP-2): HTTP requests are logged automatically

**Given** the API is running with HTTP logging middleware active
**When** a client sends a `GET` request to any route and receives a response
**Then** a structured log entry is written containing the HTTP method (`GET`), the request URL path, the response status code, and the response time in milliseconds.

### Scenario HTTP-2 (REQ-HTTP-3): HTTP logs share the same format

**Given** the API is running with HTTP logging middleware active
**When** an HTTP request is processed
**Then** the resulting log entry uses the same JSON format and output destination(s) as application-level log entries.

### Scenario FILE-1 (REQ-FILE-1, REQ-FILE-2): Dual output when LOG_FILE is set

**Given** the API is started with `LOG_FILE` set to a valid writable file path
**When** any log entry is emitted
**Then** the entry appears on stdout AND is appended to the specified file, and both outputs contain the same structured content.

### Scenario FILE-2 (REQ-FILE-3): Stdout-only when LOG_FILE is unset

**Given** the API is started without a `LOG_FILE` environment variable
**When** any log entry is emitted
**Then** the entry appears on stdout only, and no log file is created or written to.

### Scenario FILE-3 (REQ-FILE-4): Environment variables declared in centralized config

**Given** a developer inspects the API's centralized environment configuration
**When** they look for logging-related settings
**Then** both `LOG_LEVEL` and `LOG_FILE` are declared as recognized environment variables with appropriate defaults (level: `info`, file: unset).

### Scenario GIT-1 (REQ-GIT-1): Log files are git-ignored

**Given** a developer creates a file named `api.log` or a directory named `logs/` within the project
**When** they run a version control status check
**Then** the log file and log directory are excluded from tracked changes.

### Scenario REPLACE-1 (REQ-REPLACE-1): No console.log/console.error in API source

**Given** the change has been fully applied
**When** a text search for `console.log` and `console.error` is performed across the API source tree
**Then** zero matches are found for operational logging purposes (build tooling or third-party code excluded).

### Scenario REPLACE-2 (REQ-REPLACE-2): Appropriate severity levels

**Given** the API starts up and connects to the database
**When** the startup sequence logs lifecycle events
**Then** informational messages (e.g., "server listening", "database connected") use `info` level, and error conditions (e.g., startup failure) use `error` level.
