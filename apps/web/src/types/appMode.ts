/**
 * Application connection mode.
 *
 * - `'offline'` — local-only; universe persisted in the browser (localStorage).
 * - `'online'`  — server-backed; universe persisted via the backend API.
 */
export type AppMode = 'online' | 'offline';
