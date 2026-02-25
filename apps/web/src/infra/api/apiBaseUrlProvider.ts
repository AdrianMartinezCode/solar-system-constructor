/**
 * apiBaseUrlProvider — centralized API base URL resolution.
 *
 * The hostConfigStore holds a host origin (e.g. "http://localhost:3001").
 *
 * - Host set → use it directly (backend routes are at root: /health, /universes)
 * - Host empty → fall back to "/api" (Vite dev proxy strips the prefix and forwards)
 */

import { useHostConfigStore } from '../../state/hostConfigStore';

/**
 * Returns the current API base URL.
 *
 * - Host set (e.g. "http://localhost:3001") → "http://localhost:3001"
 * - Host empty (proxy mode) → "/api"
 */
export function getApiBaseUrl(): string {
  const host = useHostConfigStore.getState().apiHost.replace(/\/+$/, '');

  if (host) {
    return host;
  }

  // Proxy mode — Vite dev proxy intercepts "/api/*" and forwards to the backend.
  return '/api';
}
