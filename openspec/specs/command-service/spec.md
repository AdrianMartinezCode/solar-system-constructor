# Spec: command-service

---

## Overview

The command processing service encapsulates the full lifecycle of applying a universe command: validate the command, retrieve the current universe state from persistence, apply the command through the domain reducer, persist the resulting state, broadcast the command for real-time subscribers, and return the outcome. It serves as the single source of truth for command processing, consumed by both REST and MCP entry points.

---

## Interface and Dependencies

**REQ-CS-1** — The command processing service MUST accept two injected ports at construction: a persistence port (for reading and writing universe state) and a real-time broadcast port (for notifying subscribers of applied commands).

**REQ-CS-2** — The command processing service MUST expose a `processCommand` operation that accepts a universe identifier (string) and a command object, and returns a result containing the updated universe state and any domain events produced.

**REQ-CS-3** — The command processing service MUST NOT import or depend on any HTTP framework, transport layer, or infrastructure adapter directly. It SHALL depend only on domain types, the domain reducer, and the two injected ports.

## Command Processing Behavior

**REQ-CS-4** — When `processCommand` is invoked, the service MUST retrieve the current universe state from the persistence port using the provided universe identifier.

**REQ-CS-5** — After retrieving the universe state, the service MUST apply the command using the pure domain reducer (`applyUniverseCommand`), which accepts the current state and the command and returns the next state and domain events.

**REQ-CS-6** — After successful command application, the service MUST persist the resulting state to the persistence port, associating it with the same universe identifier.

**REQ-CS-7** — After successful persistence, the service MUST broadcast the command through the real-time broadcast port, targeting the same universe identifier.

**REQ-CS-8** — The service MUST return the result of the domain reducer (updated state and events) to the caller after completing all steps.

**REQ-CS-9** — The processing steps MUST execute in this order: retrieve state → apply command → persist state → broadcast command. Broadcast MUST NOT occur if persistence fails. Persistence MUST NOT occur if command application fails.

## Error Handling

**REQ-CS-10** — If the persistence port cannot find a universe for the given identifier, the service MUST signal a "universe not found" error to the caller. It MUST NOT attempt to apply, persist, or broadcast.

**REQ-CS-11** — If the domain reducer throws an error during command application (e.g., invalid command shape, violated domain invariants), the service MUST propagate that error to the caller. It MUST NOT persist or broadcast.

**REQ-CS-12** — If persistence fails after successful command application, the service MUST propagate the persistence error to the caller. It MUST NOT broadcast the command.

## Validation

**REQ-CS-13** — The service SHOULD validate that the command object contains a `type` field (string) before attempting to apply it. If the `type` field is absent or not a string, the service SHOULD return a validation error without querying the persistence port.

---

## Scenarios

### Interface and Dependencies

**Scenario CS-1** (REQ-CS-1):
- **Given** the command processing service is constructed with a persistence port and a broadcast port
- **When** the service is ready for use
- **Then** it holds references to both ports and can invoke their operations

**Scenario CS-2a** (REQ-CS-2):
- **Given** a valid universe identifier and a valid command object
- **When** `processCommand` is called with these arguments
- **Then** the return value contains an `nextState` property (the updated universe state) and an `events` property (an array of domain events)

**Scenario CS-2b** (REQ-CS-2):
- **Given** a valid universe identifier and a `tick` command
- **When** `processCommand` is called
- **Then** the returned `nextState` reflects the tick applied to the previous state

**Scenario CS-3** (REQ-CS-3):
- **Given** the command processing service source
- **When** its import dependencies are inspected
- **Then** no HTTP framework, Express, or transport-layer modules are referenced

### Command Processing Behavior

**Scenario CS-4** (REQ-CS-4):
- **Given** a universe with identifier "u-1" exists in persistence with a known state
- **When** `processCommand("u-1", { type: "tick" })` is called
- **Then** the persistence port's read operation is invoked with "u-1" before the command is applied

**Scenario CS-5** (REQ-CS-5):
- **Given** the persistence port returns a universe state for "u-1"
- **When** a command `{ type: "addStar", star: { ... } }` is processed
- **Then** the domain reducer is invoked with the retrieved state and the command, and its output determines the result

**Scenario CS-6** (REQ-CS-6):
- **Given** the domain reducer successfully produces a next state
- **When** the processing pipeline continues
- **Then** the persistence port's update operation is called with the universe identifier and the new state

**Scenario CS-7** (REQ-CS-7):
- **Given** the persistence port successfully updates the universe state
- **When** the processing pipeline continues
- **Then** the broadcast port is called with the universe identifier and the original command

**Scenario CS-8** (REQ-CS-8):
- **Given** a complete successful command processing cycle
- **When** `processCommand` resolves
- **Then** the caller receives the `nextState` and `events` from the domain reducer

**Scenario CS-9** (REQ-CS-9):
- **Given** persistence update fails (throws an error)
- **When** the error is caught
- **Then** the broadcast port was never called

### Error Handling

**Scenario CS-10a** (REQ-CS-10):
- **Given** no universe exists with identifier "u-missing"
- **When** `processCommand("u-missing", { type: "tick" })` is called
- **Then** a "universe not found" error is returned or thrown
- **And** the domain reducer is never invoked
- **And** the persistence port's update operation is never called
- **And** the broadcast port is never called

**Scenario CS-10b** (REQ-CS-10):
- **Given** the persistence port returns null/undefined for an identifier
- **When** `processCommand` is called with that identifier
- **Then** the error clearly identifies which universe was not found

**Scenario CS-11** (REQ-CS-11):
- **Given** a universe "u-1" exists with a valid state
- **When** `processCommand("u-1", { type: "removeStar", starId: "nonexistent" })` is called and the domain reducer throws a domain error
- **Then** the error from the reducer is propagated to the caller
- **And** the persistence port's update operation is never called
- **And** the broadcast port is never called

**Scenario CS-12** (REQ-CS-12):
- **Given** a universe "u-1" exists and the domain reducer succeeds
- **When** the persistence port's update operation throws an error
- **Then** the persistence error is propagated to the caller
- **And** the broadcast port is never called

### Validation

**Scenario CS-13a** (REQ-CS-13):
- **Given** a command object `{ data: "no type field" }` with no `type` property
- **When** `processCommand("u-1", { data: "no type field" })` is called
- **Then** a validation error is returned without querying the persistence port

**Scenario CS-13b** (REQ-CS-13):
- **Given** a command object `{ type: 123 }` where `type` is not a string
- **When** `processCommand("u-1", { type: 123 })` is called
- **Then** a validation error is returned without querying the persistence port
