/**
 * SSE adapter for the CommandStream port.
 *
 * Uses the native browser EventSource API to receive real-time
 * UniverseCommands from the backend SSE endpoint.
 *
 * The base URL is resolved per-connection via the centralized apiBaseUrlProvider,
 * which reads from the hostConfigStore (user-editable at runtime).
 */

import type { UniverseCommand } from '@solar/domain';
import type {
  CommandStream,
  CommandStreamListener,
  CommandStreamOptions,
  DisconnectFn,
} from '../../app/ports/commandStream';
import { getApiBaseUrl } from '../api/apiBaseUrlProvider';

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createSseCommandStream(): CommandStream {
  return {
    connect(
      universeId: string,
      onCommand: CommandStreamListener,
      options?: CommandStreamOptions,
    ): DisconnectFn {
      const baseUrl = getApiBaseUrl();
      const url = `${baseUrl}/universes/${encodeURIComponent(universeId)}/events`;

      // Report "connecting" immediately, before the EventSource opens.
      options?.onStatusChange?.('connecting');

      const source = new EventSource(url);

      source.addEventListener('command', (e: MessageEvent) => {
        try {
          const command = JSON.parse(e.data) as UniverseCommand;
          onCommand(command);
        } catch (err) {
          console.error('[SSE] failed to parse command:', err);
        }
      });

      source.addEventListener('open', () => {
        console.log(`[SSE] connected to universe ${universeId}`);
        options?.onStatusChange?.('connected');
      });

      source.addEventListener('error', () => {
        // EventSource will automatically reconnect; just log for debugging.
        console.warn(`[SSE] connection error for universe ${universeId} — will retry`);
        options?.onStatusChange?.('error');
      });

      return () => {
        source.close();
        console.log(`[SSE] disconnected from universe ${universeId}`);
      };
    },
  };
}

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

/** Default SSE command stream instance for use across the app. */
export const sseCommandStream = createSseCommandStream();
