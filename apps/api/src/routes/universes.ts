/**
 * Universe CRUD routes.
 *
 * All routes delegate to the injected UniverseRepository — no direct DB access.
 */

import { Router } from 'express';
import type { UniverseState } from '@solar/domain';
import type { UniverseRepository } from '../app/ports/universeRepository.js';
import { logger } from '../config/logger.js';

export function createUniverseRouter(repo: UniverseRepository): Router {
  const router = Router();

  // ---------------------------------------------------------------------------
  // POST /universes — create a new universe
  // ---------------------------------------------------------------------------
  router.post('/universes', async (req, res, next) => {
    try {
      const { name, state } = req.body ?? {};

      if (typeof name !== 'string' || name.trim().length === 0) {
        res.status(400).json({ error: '"name" is required and must be a non-empty string' });
        return;
      }

      if (state === null || state === undefined || typeof state !== 'object' || Array.isArray(state)) {
        res.status(400).json({ error: '"state" is required and must be a JSON object' });
        return;
      }

      logger.debug({ name: name.trim() }, 'creating universe');
      const created = await repo.create({ name: name.trim(), state: state as UniverseState });
      res.status(201).json(created);
    } catch (err) {
      next(err);
    }
  });

  // ---------------------------------------------------------------------------
  // GET /universes — list all universes
  // ---------------------------------------------------------------------------
  router.get('/universes', async (_req, res, next) => {
    try {
      logger.debug('listing universes');
      const universes = await repo.list();
      res.json(universes);
    } catch (err) {
      next(err);
    }
  });

  // ---------------------------------------------------------------------------
  // GET /universes/:id — get a single universe
  // ---------------------------------------------------------------------------
  router.get('/universes/:id', async (req, res, next) => {
    try {
      logger.debug({ id: req.params.id }, 'fetching universe');
      const universe = await repo.getById(req.params.id);
      if (!universe) {
        res.status(404).json({ error: 'Universe not found' });
        return;
      }
      res.json(universe);
    } catch (err) {
      next(err);
    }
  });

  // ---------------------------------------------------------------------------
  // PUT /universes/:id — update an existing universe
  // ---------------------------------------------------------------------------
  router.put('/universes/:id', async (req, res, next) => {
    try {
      const { name, state } = req.body ?? {};

      // Build the update input — only include fields that were provided
      const input: { name?: string; state?: UniverseState } = {};

      if (name !== undefined) {
        if (typeof name !== 'string' || name.trim().length === 0) {
          res.status(400).json({ error: '"name" must be a non-empty string when provided' });
          return;
        }
        input.name = name.trim();
      }

      if (state !== undefined) {
        if (state === null || typeof state !== 'object' || Array.isArray(state)) {
          res.status(400).json({ error: '"state" must be a JSON object when provided' });
          return;
        }
        input.state = state as UniverseState;
      }

      logger.debug({ id: req.params.id }, 'updating universe');
      const updated = await repo.update(req.params.id, input);
      if (!updated) {
        res.status(404).json({ error: 'Universe not found' });
        return;
      }
      res.json(updated);
    } catch (err) {
      next(err);
    }
  });

  // ---------------------------------------------------------------------------
  // DELETE /universes/:id — delete a universe
  // ---------------------------------------------------------------------------
  router.delete('/universes/:id', async (req, res, next) => {
    try {
      logger.debug({ id: req.params.id }, 'deleting universe');
      const deleted = await repo.delete(req.params.id);
      if (!deleted) {
        res.status(404).json({ error: 'Universe not found' });
        return;
      }
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  });

  return router;
}
