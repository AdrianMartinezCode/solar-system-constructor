import { loadEnv } from './config/env.js';
import { createDbProvider } from './infra/db/index.js';
import type { PostgresDbProvider } from './infra/db/index.js';
import { createApp } from './app.js';
import { createInMemoryUniverseRepository } from './infra/persistence/inMemoryUniverseRepository.js';
import { createPostgresUniverseRepository } from './infra/persistence/postgresUniverseRepository.js';
import { createInMemoryCommandGateway } from './infra/realtime/inMemoryCommandGateway.js';
import type { UniverseRepository } from './app/ports/universeRepository.js';
import { logger } from './config/logger.js';

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
    logger.info({ provider: 'postgres' }, 'universe repository initialized');
  } else {
    universeRepo = createInMemoryUniverseRepository();
    logger.info({ provider: 'in-memory' }, 'universe repository initialized (ephemeral)');
  }

  // ---------------------------------------------------------------------------
  // Build the command gateway (real-time command broadcasting)
  // ---------------------------------------------------------------------------
  const commandGateway = createInMemoryCommandGateway();
  logger.info({ provider: 'in-memory' }, 'command gateway initialized');

  const app = createApp(universeRepo, commandGateway);
  const server = app.listen(env.PORT, () => {
    logger.info({ port: env.PORT, db: db.name }, 'server listening');
  });

  // ---------------------------------------------------------------------------
  // Graceful shutdown
  // ---------------------------------------------------------------------------
  const shutdown = async (signal: string) => {
    logger.info({ signal }, 'shutdown signal received');
    server.close();
    await db.disconnect();
    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

main().catch((err) => {
  logger.fatal({ err }, 'fatal startup error');
  process.exit(1);
});
