import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { UniverseCommand } from '@solar/domain';
import type { UniverseRepository } from '../app/ports/universeRepository.js';
import type { CommandService } from '../app/services/commandService.js';
import { UniverseNotFoundError } from '../app/services/commandService.js';

// ---------------------------------------------------------------------------
// Command categories (static listing for list_universe_commands tool)
// ---------------------------------------------------------------------------

const COMMAND_CATEGORIES: Record<string, string[]> = {
  Simulation: ['tick'],
  'Star CRUD': ['addStar', 'updateStar', 'removeStar'],
  'Star hierarchy': ['attachStar', 'detachStar'],
  'Group CRUD': ['addGroup', 'updateGroup', 'removeGroup'],
  'Group hierarchy': ['addToGroup', 'removeFromGroup', 'moveToGroup'],
  'Small body fields': ['setSmallBodyFields', 'updateSmallBodyField', 'removeSmallBodyField'],
  'Protoplanetary disks': [
    'setProtoplanetaryDisks',
    'addProtoplanetaryDisk',
    'updateProtoplanetaryDisk',
    'removeProtoplanetaryDisk',
  ],
  Nebulae: ['setNebulae', 'updateNebula', 'removeNebula'],
  Rings: ['updateRing', 'removeRing'],
  Snapshot: ['replaceSnapshot'],
};

function getCommandListing(category?: string): Record<string, string[]> {
  if (!category) return COMMAND_CATEGORIES;

  const match = Object.entries(COMMAND_CATEGORIES).find(
    ([key]) => key.toLowerCase() === category.toLowerCase(),
  );
  if (!match) return {};

  return { [match[0]]: match[1] };
}

// ---------------------------------------------------------------------------
// MCP Server factory
// ---------------------------------------------------------------------------

export interface McpServerDeps {
  universeRepo: UniverseRepository;
  commandService: CommandService;
}

export function createMcpServer(deps: McpServerDeps): McpServer {
  const server = new McpServer(
    {
      name: 'solar-system-constructor',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: { listChanged: false },
      },
    },
  );

  // -- get_universe_state -----------------------------------------------------
  server.registerTool(
    'get_universe_state',
    {
      description: 'Retrieve the current state snapshot of a universe.',
      inputSchema: { universeId: z.string().describe('Unique identifier of the universe') },
    },
    async ({ universeId }) => {
      const universe = await deps.universeRepo.getById(universeId);
      if (!universe) {
        return {
          content: [{ type: 'text' as const, text: JSON.stringify({ error: 'Universe not found', universeId }) }],
          isError: true,
        };
      }
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(universe.state) }],
      };
    },
  );

  // -- list_universe_commands -------------------------------------------------
  server.registerTool(
    'list_universe_commands',
    {
      description: 'List available command types for a universe.',
      inputSchema: {
        universeId: z.string().describe('Unique identifier of the target universe'),
        category: z.string().optional().describe('Filter by command category'),
      },
    },
    async ({ universeId, category }) => {
      const universe = await deps.universeRepo.getById(universeId);
      if (!universe) {
        return {
          content: [{ type: 'text' as const, text: JSON.stringify({ error: 'Universe not found', universeId }) }],
          isError: true,
        };
      }
      const listing = getCommandListing(category);
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(listing) }],
      };
    },
  );

  // -- send_universe_command --------------------------------------------------
  server.registerTool(
    'send_universe_command',
    {
      description: 'Send a command to mutate a universe.',
      inputSchema: {
        universeId: z.string().describe('Unique identifier of the target universe'),
        command: z.object({ type: z.string() }).passthrough().describe('Command object with type discriminator'),
      },
    },
    async ({ universeId, command }) => {
      try {
        const result = await deps.commandService.processCommand(
          universeId,
          command as unknown as UniverseCommand,
        );
        return {
          content: [{ type: 'text' as const, text: JSON.stringify({ nextState: result.nextState, events: result.events }) }],
        };
      } catch (err) {
        if (err instanceof UniverseNotFoundError) {
          return {
            content: [{ type: 'text' as const, text: JSON.stringify({ error: 'Universe not found', universeId }) }],
            isError: true,
          };
        }
        return {
          content: [{ type: 'text' as const, text: JSON.stringify({ error: 'Command processing failed', message: String(err) }) }],
          isError: true,
        };
      }
    },
  );

  return server;
}
