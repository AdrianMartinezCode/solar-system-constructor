/**
 * Command ingestion + SSE streaming routes.
 *
 * POST /universes/:id/commands — accept a UniverseCommand and broadcast it.
 * GET  /universes/:id/events   — SSE stream of commands for a universe.
 */

import { Router } from 'express';
import type { CommandGateway } from '../app/ports/commandGateway.js';

export function createCommandsRouter(gateway: CommandGateway): Router {
  const router = Router();

  // ---------------------------------------------------------------------------
  // POST /universes/:id/commands — ingest a command
  // ---------------------------------------------------------------------------
  router.post('/universes/:id/commands', (req, res, next) => {
    try {
      const command = req.body;

      // Minimal validation: body must be an object with a non-empty `type` string.
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

      gateway.broadcast(req.params.id, command);
      res.status(202).json({ ok: true });
    } catch (err) {
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

    // Disable response buffering (important for SSE through proxies)
    res.flushHeaders();

    // Initial comment to confirm connection
    res.write(':connected\n\n');

    // Subscribe to the command gateway for this universe
    const unsubscribe = gateway.subscribe(req.params.id, (command) => {
      res.write(`event: command\ndata: ${JSON.stringify(command)}\n\n`);
    });

    // Cleanup on client disconnect
    req.on('close', () => {
      unsubscribe();
      res.end();
    });
  });

  return router;
}
