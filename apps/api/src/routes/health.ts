import { Router } from 'express';

export const healthRouter = Router();

const startedAt = Date.now();

healthRouter.get('/health', (_req, res) => {
  res.json({
    ok: true,
    uptime: Math.floor((Date.now() - startedAt) / 1000),
  });
});
