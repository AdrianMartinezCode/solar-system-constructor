/**
 * LocalStorage adapter implementing the SystemRepository port.
 *
 * Wraps the existing persistence logic from `src/utils/persistence.ts`,
 * preserving the storage key ("nested-solar-system") and JSON shape.
 */

import type { SystemRepository, PersistedSystemData } from '../../app/ports/systemRepository';
import { saveSystem, loadSystem, clearSystem } from '../../utils/persistence';

export function createLocalStorageSystemRepository(): SystemRepository {
  return {
    save(data: PersistedSystemData): void {
      saveSystem(data);
    },

    load(): PersistedSystemData | null {
      return loadSystem();
    },

    clear(): void {
      clearSystem();
    },
  };
}

/**
 * Default singleton instance for use by the store layer.
 */
export const localStorageSystemRepository = createLocalStorageSystemRepository();
