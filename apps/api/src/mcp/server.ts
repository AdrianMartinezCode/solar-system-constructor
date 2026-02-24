import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { UniverseCommand } from '@solar/domain';
import type { UniverseRepository } from '../app/ports/universeRepository.js';
import type { CommandService } from '../app/services/commandService.js';
import { UniverseNotFoundError } from '../app/services/commandService.js';
import { mcpTools, docsContent } from '../content/index.js';
import type { McpToolDefinition } from '../content/index.js';

// ---------------------------------------------------------------------------
// Content helpers
// ---------------------------------------------------------------------------

function findToolDef(name: string): McpToolDefinition {
  const def = mcpTools.find((t) => t.name === name);
  if (!def) throw new Error(`MCP tool definition not found: ${name}`);
  return def;
}

function getDocsSection(id: string): string {
  return docsContent.sections.find((s) => s.id === id)?.body ?? '';
}

/**
 * Extract a single category section from the commands-reference Markdown.
 * Categories are delimited by `## Category Name (N commands)` headings.
 * The `category` parameter uses kebab-case (e.g. `star-crud`).
 */
function filterCommandsMarkdown(body: string, category: string): string | null {
  const sections = body.split(/(?=^## )/m);
  const normalized = category.toLowerCase().replace(/-/g, ' ');
  const match = sections.find((s) => {
    const heading = s.match(/^## (.+?)(?:\s*\()/)?.[1];
    return heading?.toLowerCase() === normalized;
  });
  return match?.trim() ?? null;
}

function getCommandTypes(): string[] {
  const def = findToolDef('send_universe_command');
  const cmd = def.inputSchema.properties.command as {
    oneOf?: Array<{ properties?: { type?: { const?: string } } }>;
  };
  if (!cmd?.oneOf) return [];
  return cmd.oneOf
    .map((v) => v.properties?.type?.const)
    .filter((t): t is string => typeof t === 'string');
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
    { name: 'solar-system-constructor', version: '1.0.0' },
    {
      capabilities: {
        tools: { listChanged: false },
        resources: {},
      },
    },
  );

  // -- Documentation resources ------------------------------------------------

  for (const section of docsContent.sections) {
    const uri = `docs://solar-system-constructor/${section.id}`;
    server.registerResource(
      section.heading,
      uri,
      { description: `${section.heading} — ${docsContent.title}`, mimeType: 'text/markdown' },
      async (reqUri) => ({
        contents: [{ uri: reqUri.href, text: section.body, mimeType: 'text/markdown' }],
      }),
    );
  }

  const fullDocsBody = docsContent.sections
    .map((s) => `# ${s.heading}\n\n${s.body}`)
    .join('\n\n---\n\n');

  server.registerResource(
    'Full Documentation',
    'docs://solar-system-constructor/full',
    { description: `Complete documentation — ${docsContent.title}`, mimeType: 'text/markdown' },
    async (reqUri) => ({
      contents: [{ uri: reqUri.href, text: fullDocsBody, mimeType: 'text/markdown' }],
    }),
  );

  // -- get_universe_state -----------------------------------------------------

  const getStateDef = findToolDef('get_universe_state');
  server.registerTool(
    'get_universe_state',
    {
      description: getStateDef.description,
      inputSchema: { universeId: z.string().describe('Unique identifier of the universe') },
      annotations: getStateDef.annotations,
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

  const listCmdDef = findToolDef('list_universe_commands');
  server.registerTool(
    'list_universe_commands',
    {
      description: listCmdDef.description,
      inputSchema: {
        universeId: z.string().describe('Unique identifier of the target universe'),
        category: z.string().optional().describe('Filter by command category'),
      },
      annotations: listCmdDef.annotations,
    },
    async ({ universeId, category }) => {
      const universe = await deps.universeRepo.getById(universeId);
      if (!universe) {
        return {
          content: [{ type: 'text' as const, text: JSON.stringify({ error: 'Universe not found', universeId }) }],
          isError: true,
        };
      }

      const commandsBody = getDocsSection('commands-reference');
      const commandTypes = getCommandTypes();

      if (category) {
        const filtered = filterCommandsMarkdown(commandsBody, category);
        if (!filtered) {
          return {
            content: [{ type: 'text' as const, text: JSON.stringify({ error: 'Unknown category', category, availableTypes: commandTypes }) }],
            isError: true,
          };
        }
        return {
          content: [
            { type: 'text' as const, text: filtered },
            { type: 'text' as const, text: JSON.stringify({ commandTypes }) },
          ],
        };
      }

      return {
        content: [
          { type: 'text' as const, text: commandsBody },
          { type: 'text' as const, text: JSON.stringify({ commandTypes }) },
        ],
      };
    },
  );

  // -- send_universe_command --------------------------------------------------

  const sendCmdDef = findToolDef('send_universe_command');
  server.registerTool(
    'send_universe_command',
    {
      description: sendCmdDef.description,
      inputSchema: {
        universeId: z.string().describe('Unique identifier of the target universe'),
        command: z.object({ type: z.string() }).passthrough().describe('Command object with type discriminator'),
      },
      annotations: sendCmdDef.annotations,
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
