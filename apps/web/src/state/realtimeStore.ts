/**
 * realtimeStore — SSE connection lifecycle and remote-command activity state.
 *
 * Tracks:
 * - connectionStatus: whether the SSE stream is idle, connecting, connected, or in error.
 * - toasts: a short queue of recent remote-command notifications.
 *
 * This store is intentionally separate from systemStore (domain data) and
 * uiStore (selection/camera) to avoid unrelated re-renders when connection
 * status changes.
 */

import { create } from 'zustand';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'error';

export interface RemoteCommandToast {
  id: string;
  message: string;
  commandType: string;
  timestamp: number;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

interface RealtimeStore {
  /** Current SSE connection status. */
  connectionStatus: ConnectionStatus;
  setConnectionStatus: (status: ConnectionStatus) => void;

  /** Queue of recent remote-command toasts (max 3). */
  toasts: RemoteCommandToast[];
  pushToast: (message: string, commandType: string) => void;
  dismissToast: (id: string) => void;
}

const MAX_TOASTS = 3;

export const useRealtimeStore = create<RealtimeStore>((set) => ({
  connectionStatus: 'idle',

  setConnectionStatus: (status) => {
    set({ connectionStatus: status });
  },

  toasts: [],

  pushToast: (message, commandType) => {
    const toast: RemoteCommandToast = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      message,
      commandType,
      timestamp: Date.now(),
    };
    set((state) => ({
      toasts: [...state.toasts, toast].slice(-MAX_TOASTS),
    }));
  },

  dismissToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },
}));
