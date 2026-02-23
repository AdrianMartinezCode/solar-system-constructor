/**
 * CORS — allowed origins (extend as needed for staging / production).
 *
 * Shared across the global cors middleware and any route that needs to set
 * CORS headers manually (e.g. SSE endpoints).
 */
export const ALLOWED_ORIGINS: string[] = ['http://localhost:5173'];
