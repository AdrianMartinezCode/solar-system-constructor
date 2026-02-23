/**
 * CommandStream port — frontend interface for receiving real-time
 * UniverseCommands from the backend.
 *
 * The single `connect` method opens a streaming connection scoped to a
 * universe and invokes the listener for each incoming command.
 *
 * Implementations (adapters) live in `src/infra/realtime/`.
 */

import type { UniverseCommand } from '@solar/domain';

// ---------------------------------------------------------------------------
// Callback types
// ---------------------------------------------------------------------------

/** Callback invoked for each command received from the server. */
export type CommandStreamListener = (command: UniverseCommand) => void;

/** Function to cleanly close the streaming connection. */
export type DisconnectFn = () => void;

// ---------------------------------------------------------------------------
// Stream interface
// ---------------------------------------------------------------------------

/** Port for receiving real-time universe commands from the backend. */
export interface CommandStream {
  /**
   * Open a streaming connection for the given universe.
   *
   * @param universeId - The universe to subscribe to.
   * @param onCommand  - Callback invoked for each received command.
   * @returns A function to disconnect (close the connection).
   */
  connect(universeId: string, onCommand: CommandStreamListener): DisconnectFn;
}
