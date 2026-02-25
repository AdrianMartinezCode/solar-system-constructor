import express from 'express';
import cors from 'cors';
import pinoHttp from 'pino-http';
import { healthRouter } from './routes/health.js';
import { createUniverseRouter } from './routes/universes.js';
import { createCommandsRouter } from './routes/commands.js';
import type { UniverseRepository } from './app/ports/universeRepository.js';
import type { CommandGateway } from './app/ports/commandGateway.js';
import { ALLOWED_ORIGINS } from './config/cors.js';
import { createCommandService } from './app/services/commandService.js';
import { createMcpServer } from './mcp/server.js';
import { createMcpTransportHandler } from './mcp/transport.js';
import { logger } from './config/logger.js';

export function createApp(universeRepo: UniverseRepository, commandGateway: CommandGateway) {
  const app = express();

  const commandService = createCommandService({ universeRepo, commandGateway });

  // ---------------------------------------------------------------------------
  // Middleware
  // ---------------------------------------------------------------------------
  app.use(cors({ origin: ALLOWED_ORIGINS }));
  app.use(express.json({ limit: '10mb' }));
  app.use(pinoHttp({ logger }));

  // ---------------------------------------------------------------------------
  // Routes
  // ---------------------------------------------------------------------------
  app.use(healthRouter);
  app.use(createUniverseRouter(universeRepo));
  app.use(createCommandsRouter(commandService, commandGateway));
  app.use('/mcp', createMcpTransportHandler(() => createMcpServer({ universeRepo, commandService })));

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
      logger.error({ err }, 'unhandled error');
      res.status(500).json({ error: 'Internal server error' });
    },
  );

  return app;
}
