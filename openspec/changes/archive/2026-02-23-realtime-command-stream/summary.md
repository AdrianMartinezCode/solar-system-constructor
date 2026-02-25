# Real-Time Command Stream — Archive Summary

**Date**: 2026-02-23
**Status**: Archived (legacy docs migration)

## What

Implemented real-time server-push communication using SSE (Server-Sent Events) so the backend can stream `UniverseCommand`s to connected frontend clients. External sources POST commands to the backend, which broadcasts them via SSE to all connected clients for live visualization.

## Key Decisions

- SSE chosen over WebSocket (unidirectional, zero dependencies, native auto-reconnect)
- `CommandGateway` port abstraction decouples command sources from consumers (source-agnostic)
- In-memory `EventEmitter`-based adapter (sufficient for single-process; Redis adapter deferred)
- Zero new runtime dependencies on both frontend and backend
- Command ingestion via REST POST; streaming via SSE `event: command` messages
- Hook deferred wiring into components to a separate CR (realtime-frontend-interactions)

## Tasks Completed

- Task 1: Created backend `CommandGateway` port and `InMemoryCommandGateway` adapter
- Task 2: Built backend SSE + command ingestion routes (`POST /universes/:id/commands`, `GET /universes/:id/events`)
- Task 3: Created frontend `CommandStream` port and `sseCommandStream` SSE adapter
- Task 4: Built `useRemoteCommandStream` hook and `systemStore.applyRemoteCommand()` store integration

## Related Artifacts (removed)

- docs/requests/CR_realtime_command_stream.md
- docs/plans/PLAN_realtime_command_stream.md
- docs/prompts/realtime_command_stream/ (4 tasks)
