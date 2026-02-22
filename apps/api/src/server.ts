import { loadEnv } from './config/env.js';
import { createDbProvider } from './infra/db/index.js';
import { createApp } from './app.js';

async function main() {
  const env = loadEnv();
  const db = createDbProvider(env);

  // Connect to database (noop by default)
  await db.connect();

  const app = createApp();
  const server = app.listen(env.PORT, () => {
    console.log(`[api] listening on http://localhost:${env.PORT}  (db: ${db.name})`);
  });

  // ---------------------------------------------------------------------------
  // Graceful shutdown
  // ---------------------------------------------------------------------------
  const shutdown = async (signal: string) => {
    console.log(`[api] ${signal} received — shutting down`);
    server.close();
    await db.disconnect();
    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

main().catch((err) => {
  console.error('[api] fatal startup error:', err);
  process.exit(1);
});
