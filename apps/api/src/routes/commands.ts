/**
 * Command ingestion + SSE streaming routes.
 *
 * POST /universes/:id/commands — accept a UniverseCommand and broadcast it.
 * GET  /universes/:id/events   — SSE stream of commands for a universe.
 */

import { Router } from 'express';
import type { CommandGateway } from '../app/ports/commandGateway.js';
import type { CommandService } from '../app/services/commandService.js';
import { UniverseNotFoundError } from '../app/services/commandService.js';
import { ALLOWED_ORIGINS } from '../config/cors.js';
import { logger } from '../config/logger.js';

export function createCommandsRouter(commandService: CommandService, gateway: CommandGateway): Router {
  const router = Router();

  // ---------------------------------------------------------------------------
  // POST /universes/:id/commands — ingest a command
  // ---------------------------------------------------------------------------
  router.post('/universes/:id/commands', async (req, res, next) => {
    const command = req.body;

    if (
      command === null ||
      command === undefined ||
      typeof command !== 'object' ||
      Array.isArray(command) ||
      typeof command.type !== 'string' ||
      command.type.trim().length === 0
    ) {
      res.status(400).json({
        error: 'Request body must be a JSON object with a non-empty "type" string property',
      });
      return;
    }

    try {
      logger.debug({ universeId: req.params.id, type: command.type }, 'processing command');
      const result = await commandService.processCommand(req.params.id, command);
      res.status(200).json({ nextState: result.nextState, events: result.events });
    } catch (err) {
      if (err instanceof UniverseNotFoundError) {
        res.status(404).json({ error: 'Universe not found' });
        return;
      }
      next(err);
    }
  });

  // ---------------------------------------------------------------------------
  // GET /universes/:id/events — SSE stream
  // ---------------------------------------------------------------------------
  router.get('/universes/:id/events', (req, res) => {
    // SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Explicit CORS headers for SSE — the `cors` middleware may not cover
    // EventSource requests because some browsers omit the Origin header.
    const origin = req.headers.origin;
    if (origin && ALLOWED_ORIGINS.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    }

    // Disable response buffering (important for SSE through proxies)
    res.flushHeaders();

    // Initial comment to confirm connection
    res.write(':connected\n\n');

    logger.debug({ universeId: req.params.id }, 'SSE client connected');

    // Subscribe to the command gateway for this universe
    const unsubscribe = gateway.subscribe(req.params.id, (command) => {
      res.write(`event: command\ndata: ${JSON.stringify(command)}\n\n`);
    });

    // Cleanup on client disconnect
    req.on('close', () => {
      logger.debug({ universeId: req.params.id }, 'SSE client disconnected');
      unsubscribe();
      res.end();
    });
  });

  return router;
}
