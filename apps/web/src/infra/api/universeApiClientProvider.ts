/**
 * Centralized provider for the active UniverseApiClient adapter.
 *
 * Change the import below to swap between HTTP (real) and mock adapters.
 */
import type { UniverseApiClient } from '../../app/ports/universeApiClient';
import { httpUniverseApiClient } from './httpUniverseApiClient';
// import { mockUniverseApiClient } from './mockUniverseApiClient';

export const universeApiClient: UniverseApiClient = httpUniverseApiClient;
