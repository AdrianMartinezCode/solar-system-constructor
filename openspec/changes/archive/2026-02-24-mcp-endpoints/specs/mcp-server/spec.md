# Spec: mcp-server

_Delta spec for change: `mcp-endpoints`_

---

## Overview

The system exposes a standards-compliant Model Context Protocol (MCP) server alongside the existing HTTP API. The MCP server registers three tools — for reading universe state, listing available commands, and sending commands — and serves them over Streamable HTTP transport with stateful session management. Tool handlers delegate to shared services and ports, ensuring behavioral parity with the REST API. All tool responses use the MCP SDK's native result format.

---

## ADDED

### Tool Registration

**REQ-MCP-1** — The MCP server MUST register exactly three tools: `get_universe_state`, `list_universe_commands`, and `send_universe_command`.

**REQ-MCP-2** — Each registered tool MUST have a name, a human-readable description, and an input schema defined using Zod for runtime validation.

**REQ-MCP-3** — The `get_universe_state` tool MUST require a `universeId` parameter (string) in its input schema.

**REQ-MCP-4** — The `list_universe_commands` tool MUST require a `universeId` parameter (string) in its input schema.

**REQ-MCP-5** — The `send_universe_command` tool MUST require a `universeId` parameter (string) and a `command` parameter (object with at least a `type` string field) in its input schema.

### Tool Handler Behavior

**REQ-MCP-6** — The `get_universe_state` handler MUST retrieve the universe state from the persistence port for the given `universeId` and return it as serialized text content.

**REQ-MCP-7** — The `list_universe_commands` handler MUST return the static command category listing describing all available command types. The listing content MUST be consistent regardless of universe state.

**REQ-MCP-8** — The `send_universe_command` handler MUST delegate command processing to the shared command processing service (the same service used by the REST command endpoint), passing the `universeId` and `command` from the tool input.

**REQ-MCP-9** — The `send_universe_command` handler MUST return the result of the command processing (including updated state or events) as serialized text content.

### Response Format

**REQ-MCP-10** — All tool handlers MUST return responses in the MCP SDK's `CallToolResult` format: an object with a `content` array containing one or more entries, each with `type: "text"` and a `text` field holding a serialized string.

**REQ-MCP-11** — Successful tool responses MUST NOT set `isError` (or MUST set it to `false`).

**REQ-MCP-12** — The serialized text content for `get_universe_state` and `send_universe_command` MUST be valid JSON representing the universe state or command result.

**REQ-MCP-13** — The serialized text content for `list_universe_commands` MUST contain the command categories and their associated command types.

### Error Handling

**REQ-MCP-14** — If a tool handler encounters a "universe not found" condition, it MUST return a `CallToolResult` with `isError: true` and a descriptive error message in the text content.

**REQ-MCP-15** — If a tool handler encounters an unexpected error (e.g., persistence failure, reducer error), it MUST return a `CallToolResult` with `isError: true` and an error description. It MUST NOT throw an unhandled exception that crashes the MCP server.

**REQ-MCP-16** — Error result messages SHOULD include the universe identifier that caused the error, when applicable.

### Transport and Session Management

**REQ-MCP-17** — The MCP server MUST be accessible via Streamable HTTP transport mounted at a single HTTP path (`/mcp`).

**REQ-MCP-18** — The `/mcp` path MUST accept three HTTP methods:
- `POST` for client-to-server JSON-RPC messages (initialization, tool calls)
- `GET` for server-to-client SSE notification streams
- `DELETE` for session termination

**REQ-MCP-19** — The transport MUST use stateful session management. Each new MCP session MUST receive a unique session identifier.

**REQ-MCP-20** — The session identifier MUST be communicated via the `mcp-session-id` HTTP header on responses.

**REQ-MCP-21** — A `POST` request without a valid session identifier MUST initiate a new session (via the MCP initialize handshake).

**REQ-MCP-22** — A `DELETE` request with a valid session identifier MUST terminate that session and release associated resources.

**REQ-MCP-23** — Requests with an unknown or expired session identifier (on `GET` or `DELETE`) MUST receive an appropriate HTTP error response (e.g., 400 or 404).

### Coexistence

**REQ-MCP-24** — The MCP transport MUST coexist with all existing HTTP routes without conflicts. Existing endpoints (universe CRUD, health, command streaming) MUST remain fully operational.

**REQ-MCP-25** — The MCP server's SSE stream on `GET /mcp` MUST NOT interfere with any existing SSE endpoints in the application.

---

## Scenarios

### Tool Registration

**Scenario MCP-1** (REQ-MCP-1):
- **Given** the MCP server has started
- **When** a client sends a `tools/list` JSON-RPC request via `POST /mcp`
- **Then** the response contains exactly 3 tool definitions with names `get_universe_state`, `list_universe_commands`, and `send_universe_command`

**Scenario MCP-2** (REQ-MCP-2):
- **Given** the MCP server's tool list
- **When** a consumer inspects any tool definition
- **Then** it has a non-empty `name`, a non-empty `description`, and an `inputSchema` object

**Scenario MCP-3** (REQ-MCP-3):
- **Given** the `get_universe_state` tool definition
- **When** a consumer inspects its input schema
- **Then** `universeId` is listed as a required string parameter

**Scenario MCP-4** (REQ-MCP-4):
- **Given** the `list_universe_commands` tool definition
- **When** a consumer inspects its input schema
- **Then** `universeId` is listed as a required string parameter

**Scenario MCP-5** (REQ-MCP-5):
- **Given** the `send_universe_command` tool definition
- **When** a consumer inspects its input schema
- **Then** both `universeId` (string) and `command` (object with `type` string) are listed as required parameters

### Tool Handler Behavior

**Scenario MCP-6a** (REQ-MCP-6):
- **Given** a universe "u-1" exists in persistence with a known state
- **When** the `get_universe_state` tool is called with `{ universeId: "u-1" }`
- **Then** the response content contains the serialized universe state for "u-1"

**Scenario MCP-6b** (REQ-MCP-6):
- **Given** the `get_universe_state` tool is called for a universe with 3 stars
- **When** the response is received
- **Then** the deserialized state includes the 3 stars in the universe state structure

**Scenario MCP-7** (REQ-MCP-7):
- **Given** the MCP server is running
- **When** the `list_universe_commands` tool is called with any valid `universeId`
- **Then** the response content contains the command category listing describing all 10 command categories and their associated command types

**Scenario MCP-8** (REQ-MCP-8):
- **Given** a universe "u-1" exists in persistence
- **When** the `send_universe_command` tool is called with `{ universeId: "u-1", command: { type: "tick" } }`
- **Then** the same command processing service used by the REST endpoint is invoked with "u-1" and the command
- **And** the universe state is updated in persistence
- **And** the command is broadcast to real-time subscribers

**Scenario MCP-9** (REQ-MCP-9):
- **Given** a `send_universe_command` call completes successfully
- **When** the response is returned
- **Then** the text content contains a serialized representation of the command result including updated state information

### Response Format

**Scenario MCP-10** (REQ-MCP-10):
- **Given** any tool call completes (success or error)
- **When** the response is inspected
- **Then** it is an object with a `content` array, and each entry has `type: "text"` and a non-empty `text` string

**Scenario MCP-11** (REQ-MCP-11):
- **Given** a `get_universe_state` call succeeds for a valid universe
- **When** the response is inspected
- **Then** `isError` is either absent or `false`

**Scenario MCP-12** (REQ-MCP-12):
- **Given** a `get_universe_state` call returns successfully
- **When** the `text` field in the response content is parsed
- **Then** it is valid JSON representing the universe state

**Scenario MCP-13** (REQ-MCP-13):
- **Given** a `list_universe_commands` call returns successfully
- **When** the `text` field in the response content is inspected
- **Then** it contains references to all 10 command categories (Simulation, Star CRUD, Star hierarchy, Group CRUD, Group hierarchy, Small body fields, Protoplanetary disks, Nebulae, Rings, Snapshot)

### Error Handling

**Scenario MCP-14a** (REQ-MCP-14):
- **Given** no universe exists with identifier "u-missing"
- **When** the `get_universe_state` tool is called with `{ universeId: "u-missing" }`
- **Then** the response has `isError: true` and the text content describes that the universe was not found

**Scenario MCP-14b** (REQ-MCP-14):
- **Given** no universe exists with identifier "u-missing"
- **When** the `send_universe_command` tool is called with `{ universeId: "u-missing", command: { type: "tick" } }`
- **Then** the response has `isError: true` and the text content describes that the universe was not found

**Scenario MCP-15** (REQ-MCP-15):
- **Given** the domain reducer throws an error during `send_universe_command` processing
- **When** the error is caught by the tool handler
- **Then** the response has `isError: true` with a descriptive error message
- **And** the MCP server remains operational for subsequent tool calls

**Scenario MCP-16** (REQ-MCP-16):
- **Given** a tool call fails for universe "u-42"
- **When** the error result text is inspected
- **Then** the message includes "u-42" or the universe identifier that caused the error

### Transport and Session Management

**Scenario MCP-17** (REQ-MCP-17):
- **Given** the application is running
- **When** a client sends a `POST` request to `/mcp` with a valid JSON-RPC initialize message
- **Then** the server responds with a successful JSON-RPC response and a session identifier

**Scenario MCP-18a** (REQ-MCP-18):
- **Given** an active MCP session
- **When** a client sends a `POST /mcp` with a `tools/call` JSON-RPC message and the session header
- **Then** the server processes the tool call and returns a JSON-RPC response

**Scenario MCP-18b** (REQ-MCP-18):
- **Given** an active MCP session
- **When** a client sends a `GET /mcp` with the session header
- **Then** the server opens an SSE stream for server-to-client notifications

**Scenario MCP-18c** (REQ-MCP-18):
- **Given** an active MCP session
- **When** a client sends a `DELETE /mcp` with the session header
- **Then** the session is terminated and the server responds with a success status

**Scenario MCP-19** (REQ-MCP-19):
- **Given** two separate clients each initialize an MCP session
- **When** both sessions are active
- **Then** each has a distinct session identifier

**Scenario MCP-20** (REQ-MCP-20):
- **Given** a client sends a `POST /mcp` initialize request
- **When** the response is received
- **Then** the `mcp-session-id` header is present and contains a non-empty string

**Scenario MCP-21** (REQ-MCP-21):
- **Given** a client sends a `POST /mcp` without a session identifier header
- **When** the request body is a valid JSON-RPC initialize message
- **Then** the server creates a new session and returns the session identifier

**Scenario MCP-22** (REQ-MCP-22):
- **Given** an active session with identifier "session-abc"
- **When** a client sends `DELETE /mcp` with `mcp-session-id: session-abc`
- **Then** the session is terminated
- **And** subsequent requests with `mcp-session-id: session-abc` on `GET` or `DELETE` receive an error response

**Scenario MCP-23** (REQ-MCP-23):
- **Given** no session exists with identifier "session-expired"
- **When** a client sends `GET /mcp` with `mcp-session-id: session-expired`
- **Then** the server responds with an HTTP error status (400 or 404)

### Coexistence

**Scenario MCP-24** (REQ-MCP-24):
- **Given** the MCP server is mounted at `/mcp`
- **When** a client sends requests to existing endpoints (`GET /health`, `GET /universes`, `POST /universes/:id/commands`)
- **Then** all existing endpoints respond as before, with no behavioral changes

**Scenario MCP-25** (REQ-MCP-25):
- **Given** the MCP SSE stream is active on `GET /mcp` for one client
- **When** another client connects to the existing command streaming SSE endpoint
- **Then** both SSE streams operate independently without interference
