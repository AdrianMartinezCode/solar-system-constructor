# Spec: command-endpoint

---

## Overview

The existing HTTP endpoint for submitting universe commands is refactored from a fire-and-forget broadcast model (202 Accepted) to a synchronous apply-and-persist model (200 OK with result). The endpoint delegates to the shared command processing service, ensuring behavioral parity with the MCP `send_universe_command` tool. This is an intentional semantic change — the server becomes the authoritative source of post-mutation universe state.

---

## Shared Service Delegation

**REQ-CMD-1** — The `POST /universes/:id/commands` endpoint MUST delegate all command processing to the shared command processing service (the same service used by the MCP `send_universe_command` tool). The endpoint MUST NOT apply commands, persist state, or broadcast commands directly.

**REQ-CMD-2** — The endpoint MUST pass the universe identifier from the URL path parameter and the command object from the request body to the command processing service.

## Response Format

**REQ-CMD-3** — On successful command application, the endpoint MUST return HTTP status 200 with a JSON response body containing the command processing result (updated state and/or events from the domain reducer).

**REQ-CMD-4** — The response body SHOULD include at minimum the `nextState` produced by the domain reducer so the caller can confirm the effect of the command.

## Semantic Change

**REQ-CMD-5** — The endpoint's HTTP response status MUST change from 202 (Accepted) to 200 (OK) for successful command processing. The response MUST include a body (no longer empty or acknowledgment-only).

_Previous behavior: The endpoint validated the `type` field, broadcast the command via the real-time gateway, and returned 202 with `{ status: "sent" }` without applying or persisting the command._

_New behavior: The endpoint validates, applies via the domain reducer, persists the result, broadcasts, and returns 200 with the command result._

**REQ-CMD-6** — The endpoint MUST continue to validate that the request body contains a `type` field (string). Requests missing a `type` field MUST be rejected with HTTP 400 before invoking the command processing service.

## Error Responses

**REQ-CMD-7** — If the universe identified by the path parameter does not exist, the endpoint MUST return HTTP 404 with a JSON body containing an error message that identifies the missing universe.

**REQ-CMD-8** — If the domain reducer rejects the command (e.g., domain invariant violation), the endpoint MUST return an appropriate HTTP error status (400 or 422) with a JSON body describing the error.

**REQ-CMD-9** — If an unexpected server error occurs during command processing (e.g., persistence failure), the endpoint MUST return HTTP 500 with a JSON body containing a generic error message. Internal details MUST NOT be exposed to the client.

## Removed Behavior

**REQ-CMD-R1** — The endpoint MUST NO LONGER return HTTP 202 (Accepted) for successful requests. The fire-and-forget semantics are removed.

**REQ-CMD-R2** — The endpoint MUST NO LONGER broadcast commands without first applying them via the domain reducer and persisting the resulting state. Direct broadcast-only behavior is removed.

---

## Scenarios

### Shared Service Delegation

**Scenario CMD-1a** (REQ-CMD-1):
- **Given** a universe "u-1" exists in persistence
- **When** `POST /universes/u-1/commands` is called with body `{ "type": "tick" }`
- **Then** the shared command processing service is invoked with universe identifier "u-1" and the command object
- **And** the endpoint does not call the persistence or broadcast ports directly

**Scenario CMD-1b** (REQ-CMD-1):
- **Given** the same command `{ "type": "tick" }` is sent to both `POST /universes/u-1/commands` and the MCP `send_universe_command` tool for universe "u-1"
- **When** both requests complete
- **Then** both produce identical side effects (same state persisted, same command broadcast) because they share the same service

**Scenario CMD-2** (REQ-CMD-2):
- **Given** a `POST /universes/u-5/commands` request with body `{ "type": "addStar", "star": { "name": "Sol" } }`
- **When** the request is processed
- **Then** the command processing service receives "u-5" as the universe identifier and the full command object from the body

### Response Format

**Scenario CMD-3** (REQ-CMD-3):
- **Given** a universe "u-1" exists and the command `{ "type": "tick" }` is valid
- **When** `POST /universes/u-1/commands` is called with this body
- **Then** the response status is 200
- **And** the response body is a JSON object containing the command processing result

**Scenario CMD-4** (REQ-CMD-4):
- **Given** a successful command application
- **When** the response body is inspected
- **Then** it contains a `nextState` field representing the updated universe state after the command was applied

### Semantic Change

**Scenario CMD-5a** (REQ-CMD-5):
- **Given** a universe "u-1" exists
- **When** `POST /universes/u-1/commands` is called with `{ "type": "tick" }`
- **Then** the response status is 200 (not 202)
- **And** the response body contains the result of applying the command

**Scenario CMD-5b** (REQ-CMD-5):
- **Given** a universe "u-1" exists with initial state S₀
- **When** `POST /universes/u-1/commands` is called with `{ "type": "tick" }`
- **Then** the universe state in persistence is updated from S₀ to the reducer's output
- **And** the command is broadcast to real-time subscribers
- **And** the response body reflects the new state

**Scenario CMD-6a** (REQ-CMD-6):
- **Given** a `POST /universes/u-1/commands` request with body `{ "data": "no type" }`
- **When** the request is processed
- **Then** the response status is 400
- **And** the command processing service is never invoked

**Scenario CMD-6b** (REQ-CMD-6):
- **Given** a `POST /universes/u-1/commands` request with body `{ "type": "addStar", "star": { "name": "Vega" } }`
- **When** the request is processed
- **Then** the `type` field validation passes and the command is forwarded to the service

### Error Responses

**Scenario CMD-7** (REQ-CMD-7):
- **Given** no universe exists with identifier "u-missing"
- **When** `POST /universes/u-missing/commands` is called with `{ "type": "tick" }`
- **Then** the response status is 404
- **And** the response body contains a JSON object with an error message mentioning "u-missing"

**Scenario CMD-8** (REQ-CMD-8):
- **Given** a universe "u-1" exists
- **When** `POST /universes/u-1/commands` is called with a command that violates a domain invariant (e.g., removing a non-existent star)
- **Then** the response status is 400 or 422
- **And** the response body contains a JSON object describing the domain error

**Scenario CMD-9** (REQ-CMD-9):
- **Given** the persistence layer is experiencing a transient failure
- **When** `POST /universes/u-1/commands` is called with a valid command
- **Then** the response status is 500
- **And** the response body contains a generic error message
- **And** internal error details (stack traces, connection strings) are not exposed

### Removed Behavior

**Scenario CMD-R1** (REQ-CMD-R1):
- **Given** any valid command sent to `POST /universes/:id/commands`
- **When** the request completes successfully
- **Then** the response status is never 202

**Scenario CMD-R2** (REQ-CMD-R2):
- **Given** a valid command sent to `POST /universes/u-1/commands`
- **When** the request is processed
- **Then** the command is applied via the domain reducer and persisted before broadcast
- **And** the command is never broadcast without first being applied and persisted
