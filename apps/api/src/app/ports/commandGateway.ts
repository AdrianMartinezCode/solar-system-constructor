/**
 * CommandGateway port — source-agnostic abstraction for broadcasting
 * UniverseCommands to interested consumers.
 *
 * Any command producer (REST endpoint, future MCP server, scripts, etc.)
 * pushes commands through `broadcast`. Consumers (SSE connections, future
 * persistence layer, etc.) register via `subscribe`.
 *
 * Implementations (adapters) live in `src/infra/realtime/`.
 */

import type { UniverseCommand } from '@solar/domain';

// ---------------------------------------------------------------------------
// Callback types
// ---------------------------------------------------------------------------

/** Callback invoked when a command is broadcast on a subscribed universe. */
export type CommandListener = (command: UniverseCommand) => void;

/** Function returned by `subscribe` to remove the subscription. */
export type UnsubscribeFn = () => void;

// ---------------------------------------------------------------------------
// Gateway interface
// ---------------------------------------------------------------------------

/** Port for broadcasting and subscribing to universe commands. */
export interface CommandGateway {
  /**
   * Broadcast a command to all subscribers of the given universe.
   *
   * Fire-and-forget semantics — the method does not wait for subscribers
   * to process the command.
   */
  broadcast(universeId: string, command: UniverseCommand): void;

  /**
   * Subscribe to commands for a specific universe.
   *
   * @returns An unsubscribe function that removes this listener.
   */
  subscribe(universeId: string, listener: CommandListener): UnsubscribeFn;
}
