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
 * - Reports SSE connection status to the realtimeStore.
 * - Pushes toast notifications for each applied remote command.
 * - Handles UI edge cases (selection/camera reset) after remote mutations.
 */

import { useEffect } from 'react';
import { useSystemStore } from '../state/systemStore';
import { useRealtimeStore } from '../state/realtimeStore';
import { useUiStore } from '../state/uiStore';
import { sseCommandStream } from '../infra/realtime/sseCommandStream';
import type { UniverseCommand } from '@solar/domain';

// ---------------------------------------------------------------------------
// Command-type → human-readable label mapping
// ---------------------------------------------------------------------------

function commandLabel(type: string): string {
  switch (type) {
    case 'addStar':                return 'Star added';
    case 'updateStar':             return 'Star updated';
    case 'removeStar':             return 'Star removed';
    case 'attachStar':             return 'Star attached to parent';
    case 'detachStar':             return 'Star detached';
    case 'addGroup':               return 'Group added';
    case 'updateGroup':            return 'Group updated';
    case 'removeGroup':            return 'Group removed';
    case 'addToGroup':             return 'Entity added to group';
    case 'removeFromGroup':        return 'Entity removed from group';
    case 'moveToGroup':            return 'Entity moved to group';
    case 'replaceSnapshot':        return 'Universe snapshot replaced';
    case 'setSmallBodyFields':     return 'Asteroid fields updated';
    case 'updateSmallBodyField':   return 'Asteroid field updated';
    case 'removeSmallBodyField':   return 'Asteroid field removed';
    case 'setProtoplanetaryDisks': return 'Protoplanetary disks updated';
    case 'addProtoplanetaryDisk':  return 'Protoplanetary disk added';
    case 'updateProtoplanetaryDisk': return 'Protoplanetary disk updated';
    case 'removeProtoplanetaryDisk': return 'Protoplanetary disk removed';
    case 'setNebulae':             return 'Nebulae updated';
    case 'updateNebula':           return 'Nebula updated';
    case 'removeNebula':           return 'Nebula removed';
    case 'updateRing':             return 'Planetary ring updated';
    case 'removeRing':             return 'Planetary ring removed';
    default:                       return `Remote command: ${type}`;
  }
}

// ---------------------------------------------------------------------------
// Post-command UI side-effects
// ---------------------------------------------------------------------------

/**
 * After a remote command has been applied to the domain state, reconcile
 * the UI store (selection, camera, isolation) to avoid stale references.
 */
function handleRemoteCommandUiSideEffects(command: UniverseCommand): void {
  const ui = useUiStore.getState();

  switch (command.type) {
    case 'removeStar': {
      if (ui.selectedStarId === command.id) {
        useUiStore.getState().clearSelection();
      }
      if (ui.cameraMode === 'body' && ui.cameraTargetBodyId === command.id) {
        useUiStore.getState().resetCamera();
      }
      break;
    }
    case 'removeGroup': {
      if (ui.selectedGroupId === command.id) {
        useUiStore.getState().clearSelection();
      }
      if (ui.isolatedGroupId === command.id) {
        useUiStore.getState().setIsolatedGroupId(null);
      }
      break;
    }
    case 'removeSmallBodyField': {
      if (ui.selectedSmallBodyFieldId === command.id) {
        useUiStore.getState().clearSelection();
      }
      break;
    }
    case 'removeProtoplanetaryDisk': {
      if (ui.selectedProtoplanetaryDiskId === command.id) {
        useUiStore.getState().clearSelection();
      }
      break;
    }
    case 'removeNebula': {
      if (ui.selectedNebulaId === command.id) {
        useUiStore.getState().clearSelection();
      }
      break;
    }
    case 'replaceSnapshot': {
      useUiStore.getState().clearSelection();
      useUiStore.getState().resetCamera();
      useUiStore.getState().setIsolatedGroupId(null);
      break;
    }
    // No UI action needed for add/update commands — they don't invalidate selections.
  }
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useRemoteCommandStream(universeId: string | null): void {
  useEffect(() => {
    if (!universeId) {
      // Ensure status is idle when not connected.
      useRealtimeStore.getState().setConnectionStatus('idle');
      return;
    }

    const disconnect = sseCommandStream.connect(
      universeId,
      (command: UniverseCommand) => {
        // Skip tick commands — the local animation loop handles simulation time.
        if (command.type === 'tick') return;

        // 1. Apply to domain state.
        useSystemStore.getState().applyRemoteCommand(command);

        // 2. Reconcile UI state (clear stale selections, reset camera, etc.).
        handleRemoteCommandUiSideEffects(command);

        // 3. Push toast notification.
        useRealtimeStore.getState().pushToast(commandLabel(command.type), command.type);
      },
      {
        onStatusChange: (status) => {
          useRealtimeStore.getState().setConnectionStatus(status);
        },
      },
    );

    return () => {
      disconnect();
      useRealtimeStore.getState().setConnectionStatus('idle');
    };
  }, [universeId]);
}
