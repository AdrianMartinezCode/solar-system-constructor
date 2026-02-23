import express from 'express';
import cors from 'cors';
import { healthRouter } from './routes/health.js';
import { createUniverseRouter } from './routes/universes.js';
import type { UniverseRepository } from './app/ports/universeRepository.js';

// ---------------------------------------------------------------------------
// CORS — allowed origins (extend as needed for staging / production)
// ---------------------------------------------------------------------------
const ALLOWED_ORIGINS = ['http://localhost:5173'];

export function createApp(universeRepo: UniverseRepository) {
  const app = express();

  // ---------------------------------------------------------------------------
  // Middleware
  // ---------------------------------------------------------------------------
  app.use(cors({ origin: ALLOWED_ORIGINS }));
  app.use(express.json());

  // ---------------------------------------------------------------------------
  // Routes
  // ---------------------------------------------------------------------------
  app.use(healthRouter);
  app.use(createUniverseRouter(universeRepo));

  // ---------------------------------------------------------------------------
  // Global error handler (placeholder — extend as the API grows)
  // ---------------------------------------------------------------------------
  app.use(
    (
      err: Error,
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction,
    ) => {
      console.error('[api] unhandled error:', err.message);
      res.status(500).json({ error: 'Internal server error' });
    },
  );

  return app;
}
