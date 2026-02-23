/**
 * In-memory adapter for CommandGateway.
 *
 * Uses a Node.js EventEmitter for pub/sub — sufficient for a single-process
 * backend. A future Redis-backed adapter would implement the same interface
 * for horizontal scaling.
 */

import { EventEmitter } from 'node:events';
import type { UniverseCommand } from '@solar/domain';
import type {
  CommandGateway,
  CommandListener,
  UnsubscribeFn,
} from '../../app/ports/commandGateway.js';

export function createInMemoryCommandGateway(): CommandGateway {
  const emitter = new EventEmitter();

  // Avoid MaxListenersExceededWarning when many SSE clients connect.
  emitter.setMaxListeners(0);

  return {
    broadcast(universeId: string, command: UniverseCommand): void {
      emitter.emit(universeId, command);
    },

    subscribe(universeId: string, listener: CommandListener): UnsubscribeFn {
      emitter.on(universeId, listener);
      return () => {
        emitter.off(universeId, listener);
      };
    },
  };
}
