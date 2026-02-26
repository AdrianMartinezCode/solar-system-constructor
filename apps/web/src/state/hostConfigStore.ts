/**
 * hostConfigStore — runtime API host configuration.
 *
 * Holds the user-editable API host origin used by the mode selection screen.
 * The value is a host origin only (e.g. "http://localhost:3001"), NOT a path.
 * When empty, the app uses the Vite dev proxy at "/api".
 *
 * This store is NOT persisted — the value resets each session.
 */

import { create } from 'zustand';

interface HostConfigStore {
  /** API host origin (e.g. "http://localhost:3001"). Empty = use Vite proxy. */
  apiHost: string;

  /** Update the API host origin. Called by the host input on the mode selection screen. */
  setApiHost: (url: string) => void;
}

export const useHostConfigStore = create<HostConfigStore>((set) => ({
  apiHost: 'http://localhost:3001',

  setApiHost: (url) => {
    set({ apiHost: url });
  },
}));
