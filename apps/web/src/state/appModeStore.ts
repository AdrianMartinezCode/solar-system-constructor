/**
 * appModeStore — session-level application mode (online / offline).
 *
 * Starts as `null` (no choice made yet). The mode selection screen reads this
 * to decide whether to show itself, and sets it when the user picks a mode.
 *
 * This store is NOT persisted — the user picks the mode each session.
 */

import { create } from 'zustand';
import type { AppMode } from '../types/appMode';

interface AppModeStore {
  /** Current mode, or `null` if the user hasn't chosen yet. */
  mode: AppMode | null;

  /** Set the application mode. */
  setMode: (mode: AppMode) => void;

  /** Reset the mode to `null` (back to selection screen). */
  clearMode: () => void;
}

export const useAppModeStore = create<AppModeStore>((set) => ({
  mode: null,

  setMode: (mode) => {
    set({ mode });
  },

  clearMode: () => {
    set({ mode: null });
  },
}));
