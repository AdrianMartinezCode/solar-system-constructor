import { loadEnv } from './config/env.js';
import { createDbProvider } from './infra/db/index.js';
import type { PostgresDbProvider } from './infra/db/index.js';
import { createApp } from './app.js';
import { createInMemoryUniverseRepository } from './infra/persistence/inMemoryUniverseRepository.js';
import { createPostgresUniverseRepository } from './infra/persistence/postgresUniverseRepository.js';
import type { UniverseRepository } from './app/ports/universeRepository.js';

async function main() {
  const env = loadEnv();
  const db = createDbProvider(env);

  // Connect to database (noop by default)
  await db.connect();

  // ---------------------------------------------------------------------------
  // Build the universe repository based on DB provider
  // ---------------------------------------------------------------------------
  let universeRepo: UniverseRepository;

  if (db.name === 'postgres') {
    const pool = (db as PostgresDbProvider).getPool();
    universeRepo = createPostgresUniverseRepository(pool);
    console.log('[api] universe repository: postgres');
  } else {
    universeRepo = createInMemoryUniverseRepository();
    console.log('[api] universe repository: in-memory (ephemeral)');
  }

  const app = createApp(universeRepo);
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
