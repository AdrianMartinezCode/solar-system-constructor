/**
 * useRemoteCommandStream — connects to the backend SSE command stream
 * and applies incoming UniverseCommands to the Zustand systemStore.
 *
 * Usage:
 *   useRemoteCommandStream(universeId);   // connect
 *   useRemoteCommandStream(null);         // disconnect / idle
 *
 * Lifecycle:
 * - Connects when universeId transitions to a non-null string.
 * - Disconnects when universeId becomes null or the component unmounts.
 * - Skips `tick` commands (the local animation loop handles ticks).
 */

import { useEffect } from 'react';
import { useSystemStore } from '../state/systemStore';
import { sseCommandStream } from '../infra/realtime/sseCommandStream';
import type { UniverseCommand } from '@solar/domain';

export function useRemoteCommandStream(universeId: string | null): void {
  useEffect(() => {
    if (!universeId) return;

    const disconnect = sseCommandStream.connect(universeId, (command: UniverseCommand) => {
      // Skip tick commands — the local animation loop handles simulation time.
      if (command.type === 'tick') return;

      useSystemStore.getState().applyRemoteCommand(command);
    });

    return () => {
      disconnect();
    };
  }, [universeId]);
}
