import { applyUniverseCommand } from '@solar/domain';
import type { UniverseCommand, CommandResult } from '@solar/domain';
import type { UniverseRepository } from '../ports/universeRepository.js';
import type { CommandGateway } from '../ports/commandGateway.js';

export class UniverseNotFoundError extends Error {
  constructor(public readonly universeId: string) {
    super(`Universe not found: ${universeId}`);
    this.name = 'UniverseNotFoundError';
  }
}

export interface CommandServiceDeps {
  universeRepo: UniverseRepository;
  commandGateway: CommandGateway;
}

export interface CommandService {
  processCommand(universeId: string, command: UniverseCommand): Promise<CommandResult>;
}

export function createCommandService(deps: CommandServiceDeps): CommandService {
  return {
    async processCommand(universeId, command) {
      const cmd: unknown = command;
      if (
        cmd === null ||
        cmd === undefined ||
        typeof cmd !== 'object' ||
        !('type' in cmd) ||
        typeof (cmd as { type: unknown }).type !== 'string'
      ) {
        throw new Error('Command must be an object with a string "type" field');
      }

      const universe = await deps.universeRepo.getById(universeId);
      if (!universe) {
        throw new UniverseNotFoundError(universeId);
      }

      const result = applyUniverseCommand(universe.state, command);

      await deps.universeRepo.update(universeId, { state: result.nextState });

      deps.commandGateway.broadcast(universeId, command);

      return result;
    },
  };
}
