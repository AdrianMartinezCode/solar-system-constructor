import express from 'express';
import cors from 'cors';
import { healthRouter } from './routes/health.js';
import { createUniverseRouter } from './routes/universes.js';
import { createCommandsRouter } from './routes/commands.js';
import type { UniverseRepository } from './app/ports/universeRepository.js';
import type { CommandGateway } from './app/ports/commandGateway.js';

// ---------------------------------------------------------------------------
// CORS — allowed origins (extend as needed for staging / production)
// ---------------------------------------------------------------------------
const ALLOWED_ORIGINS = ['http://localhost:5173'];

export function createApp(universeRepo: UniverseRepository, commandGateway: CommandGateway) {
  const app = express();

  // ---------------------------------------------------------------------------
  // Middleware
  // ---------------------------------------------------------------------------
  app.use(cors({ origin: ALLOWED_ORIGINS }));
  app.use(express.json({ limit: '10mb' }));

  // ---------------------------------------------------------------------------
  // Routes
  // ---------------------------------------------------------------------------
  app.use(healthRouter);
  app.use(createUniverseRouter(universeRepo));
  app.use(createCommandsRouter(commandGateway));

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
