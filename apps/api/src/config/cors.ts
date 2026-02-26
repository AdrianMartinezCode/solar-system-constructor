/**
 * CORS — allowed origins.
 *
 * Shared across the global cors middleware and any route that needs to set
 * CORS headers manually (e.g. SSE endpoints).
 *
 * Set CORS_ORIGINS env var to a comma-separated list of additional origins.
 * Example: CORS_ORIGINS=https://example.com,https://staging.example.com
 */

const DEFAULT_ORIGINS = [
  'http://localhost:5173',
  'https://adrianmartinezcode.github.io',
];

const envOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean)
  : [];

export const ALLOWED_ORIGINS: string[] = [...DEFAULT_ORIGINS, ...envOrigins];
