/**
 * onlineSessionStore — tracks the user's session within online mode.
 *
 * Manages which phase the user is in (browsing the universe list vs editing
 * a specific universe) and which universe is currently loaded.
 *
 * This store is NOT persisted — it is session-level state, just like appModeStore.
 */

import { create } from 'zustand';

/** Phase within the online-mode session. */
export type OnlineSessionPhase = 'browsing' | 'editing';

interface OnlineSessionStore {
  /** Current phase: browsing the universe list or editing a universe. */
  phase: OnlineSessionPhase;

  /** ID of the universe currently loaded in the editor, or `null`. */
  currentUniverseId: string | null;

  /** Display name of the universe currently loaded, or `null`. */
  currentUniverseName: string | null;

  /** Transition to the editor with a specific universe loaded. */
  enterEditor: (id: string, name: string) => void;

  /** Leave the editor and return to the universe browser. */
  exitEditor: () => void;

  /** Reset the entire session back to initial state. */
  resetSession: () => void;
}

export const useOnlineSessionStore = create<OnlineSessionStore>((set) => ({
  phase: 'browsing',
  currentUniverseId: null,
  currentUniverseName: null,

  enterEditor: (id, name) => {
    set({ phase: 'editing', currentUniverseId: id, currentUniverseName: name });
  },

  exitEditor: () => {
    set({ phase: 'browsing', currentUniverseId: null, currentUniverseName: null });
  },

  resetSession: () => {
    set({ phase: 'browsing', currentUniverseId: null, currentUniverseName: null });
  },
}));
