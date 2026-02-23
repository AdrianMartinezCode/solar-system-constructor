/**
 * SSE adapter for the CommandStream port.
 *
 * Uses the native browser EventSource API to receive real-time
 * UniverseCommands from the backend SSE endpoint.
 *
 * The base URL is read from the Vite environment variable VITE_API_BASE_URL
 * (same convention as httpUniverseApiClient).
 */

import type { UniverseCommand } from '@solar/domain';
import type {
  CommandStream,
  CommandStreamListener,
  CommandStreamOptions,
  DisconnectFn,
} from '../../app/ports/commandStream';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Read the API base URL from Vite env and strip any trailing slash. */
function resolveBaseUrl(): string {
  const raw = import.meta.env.VITE_API_BASE_URL;
  if (!raw) {
    throw new Error(
      'VITE_API_BASE_URL is not defined. ' +
        'Create an apps/web/.env file with VITE_API_BASE_URL=http://localhost:3001',
    );
  }
  return raw.replace(/\/+$/, '');
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createSseCommandStream(): CommandStream {
  const baseUrl = resolveBaseUrl();

  return {
    connect(
      universeId: string,
      onCommand: CommandStreamListener,
      options?: CommandStreamOptions,
    ): DisconnectFn {
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
