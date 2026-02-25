import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

export function createMcpTransportHandler(createServer: () => McpServer): Router {
  const router = Router();
  const sessions = new Map<string, StreamableHTTPServerTransport>();

  // ---------------------------------------------------------------------------
  // POST / — client-to-server JSON-RPC messages
  // ---------------------------------------------------------------------------
  router.post('/', async (req, res) => {
    const sessionId = req.headers['mcp-session-id'] as string | undefined;

    if (sessionId && sessions.has(sessionId)) {
      const transport = sessions.get(sessionId)!;
      await transport.handleRequest(req, res, req.body);
      return;
    }

    if (isInitializeRequest(req.body)) {
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: (id) => {
          sessions.set(id, transport);
        },
      });

      transport.onclose = () => {
        const id = [...sessions.entries()].find(([, t]) => t === transport)?.[0];
        if (id) sessions.delete(id);
      };

      const server = createServer();
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
      return;
    }

    res.status(400).json({ error: 'Bad request: no valid session' });
  });

  // ---------------------------------------------------------------------------
  // GET / — server-to-client SSE notification stream
  // ---------------------------------------------------------------------------
  router.get('/', async (req, res) => {
    const sessionId = req.headers['mcp-session-id'] as string | undefined;
    if (!sessionId || !sessions.has(sessionId)) {
      res.status(400).json({ error: 'Invalid or missing session' });
      return;
    }
    const transport = sessions.get(sessionId)!;
    await transport.handleRequest(req, res);
  });

  // ---------------------------------------------------------------------------
  // DELETE / — session termination
  // ---------------------------------------------------------------------------
  router.delete('/', async (req, res) => {
    const sessionId = req.headers['mcp-session-id'] as string | undefined;
    if (!sessionId || !sessions.has(sessionId)) {
      res.status(400).json({ error: 'Invalid or missing session' });
      return;
    }
    const transport = sessions.get(sessionId)!;
    await transport.close();
    sessions.delete(sessionId);
    res.status(200).json({ ok: true });
  });

  return router;
}
