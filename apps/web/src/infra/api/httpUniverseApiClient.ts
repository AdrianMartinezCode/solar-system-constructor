/**
 * HTTP adapter for the UniverseApiClient port.
 *
 * Calls the real backend API using native `fetch`.
 * The base URL is read from the Vite environment variable VITE_API_BASE_URL.
 */

import type {
  UniverseApiClient,
  ApiUniverse,
  CreateUniverseInput,
  UpdateUniverseInput,
} from '../../app/ports/universeApiClient';

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

/** Throw a descriptive error for non-OK responses (excluding 404 which callers handle). */
async function throwOnError(res: Response, context: string): Promise<never> {
  let detail = '';
  try {
    const body = await res.json();
    detail = body?.error ?? JSON.stringify(body);
  } catch {
    detail = res.statusText;
  }
  throw new Error(`[UniverseApiClient] ${context}: ${res.status} — ${detail}`);
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createHttpUniverseApiClient(): UniverseApiClient {
  const baseUrl = resolveBaseUrl();

  return {
    async list(): Promise<ApiUniverse[]> {
      const res = await fetch(`${baseUrl}/universes`);
      if (!res.ok) await throwOnError(res, 'list');
      return res.json();
    },

    async getById(id: string): Promise<ApiUniverse | null> {
      const res = await fetch(`${baseUrl}/universes/${encodeURIComponent(id)}`);
      if (res.status === 404) return null;
      if (!res.ok) await throwOnError(res, `getById(${id})`);
      return res.json();
    },

    async create(input: CreateUniverseInput): Promise<ApiUniverse> {
      const res = await fetch(`${baseUrl}/universes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: input.name, state: input.state }),
      });
      if (!res.ok) await throwOnError(res, 'create');
      return res.json();
    },

    async update(id: string, input: UpdateUniverseInput): Promise<ApiUniverse | null> {
      const res = await fetch(`${baseUrl}/universes/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (res.status === 404) return null;
      if (!res.ok) await throwOnError(res, `update(${id})`);
      return res.json();
    },

    async delete(id: string): Promise<boolean> {
      const res = await fetch(`${baseUrl}/universes/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      if (res.status === 204) return true;
      if (res.status === 404) return false;
      await throwOnError(res, `delete(${id})`);
      return false; // unreachable — throwOnError always throws
    },
  };
}

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

/** Default HTTP instance for use across the app. */
export const httpUniverseApiClient = createHttpUniverseApiClient();
