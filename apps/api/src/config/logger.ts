/**
 * Central pino logger.
 *
 * - Reads LOG_LEVEL and LOG_FILE from AppEnv.
 * - Always writes structured JSON to stdout.
 * - When LOG_FILE is set, also writes to the specified file (append mode).
 * - In development (NODE_ENV=development) with stdout-only, uses pino-pretty
 *   via pino.transport() for human-readable output.
 */

import fs from 'node:fs';
import path from 'node:path';
import pino from 'pino';
import type { Logger } from 'pino';
import { loadEnv } from './env.js';

export function createLogger(env: {
  LOG_LEVEL: string;
  LOG_FILE: string | undefined;
  NODE_ENV: string;
}): Logger {
  const level = env.LOG_LEVEL;

  // When LOG_FILE is set, use multistream for dual output (stdout + file).
  // pino-pretty is not compatible with multistream, so both destinations get JSON.
  if (env.LOG_FILE) {
    // Ensure the parent directory exists
    const dir = path.dirname(env.LOG_FILE);
    if (dir && dir !== '.') {
      fs.mkdirSync(dir, { recursive: true });
    }

    const streams: pino.StreamEntry[] = [
      { stream: process.stdout },
      { stream: fs.createWriteStream(env.LOG_FILE, { flags: 'a' }) },
    ];

    return pino({ level }, pino.multistream(streams));
  }

  // Stdout-only mode: use pino-pretty in development for readability.
  if (env.NODE_ENV === 'development') {
    return pino({
      level,
      transport: {
        target: 'pino-pretty',
        options: { colorize: true },
      },
    });
  }

  // Production stdout-only: structured JSON.
  return pino({ level });
}

/** Pre-initialized logger instance for import convenience. */
export const logger: Logger = createLogger(loadEnv());
