import express from 'express';
import { healthRouter } from './routes/health.js';

export function createApp() {
  const app = express();

  // ---------------------------------------------------------------------------
  // Middleware
  // ---------------------------------------------------------------------------
  app.use(express.json());

  // ---------------------------------------------------------------------------
  // Routes
  // ---------------------------------------------------------------------------
  app.use(healthRouter);

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
