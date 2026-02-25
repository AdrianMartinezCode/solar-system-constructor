# Using the Solar System Constructor MCP Server

The Solar System Constructor exposes an [MCP (Model Context Protocol)](https://modelcontextprotocol.io/) server that lets AI assistants interact with the universe in real time — reading state, listing available commands, and sending mutations.

## Prerequisites

- Node.js 18+
- PostgreSQL running (via Docker or locally)

## 1. Start the API server

From the project root:

```bash
# Start PostgreSQL (if not already running)
docker compose up -d

# Start the API in dev mode
npm run dev:api
```

The API starts on `http://localhost:3001` by default (override with the `PORT` env var).
The MCP endpoint is available at `http://localhost:3001/mcp`.

## 2. Configure the MCP server in Claude Code

Add the server to your project-level settings in `.claude/settings.json`:

```json
{
  "mcpServers": {
    "solar-system": {
      "url": "http://localhost:3001/mcp"
    }
  }
}
```

Alternatively, add it to your user-level config at `~/.claude/settings.json` if you want it available across all projects.

After saving, restart Claude Code (or run `/mcp` in the terminal to verify the connection).

## 3. Configure in Claude Desktop (optional)

If you prefer Claude Desktop, add to `~/.claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "solar-system": {
      "url": "http://localhost:3001/mcp"
    }
  }
}
```

## 4. Available tools

Once connected, the MCP server exposes three tools:

| Tool | Purpose | Type |
|------|---------|------|
| `get_universe_state` | Retrieve a snapshot of the current universe (stars, groups, belts, disks, nebulae, time) | read-only |
| `list_universe_commands` | List all 25 available command types, optionally filtered by category | read-only |
| `send_universe_command` | Send a command to mutate the universe | destructive |

### Command categories

Commands are organized into 10 categories:

| Category | Commands |
|----------|----------|
| Simulation | `tick` |
| Star CRUD | `addStar`, `updateStar`, `removeStar` |
| Star Hierarchy | `attachStar`, `detachStar` |
| Group CRUD | `addGroup`, `updateGroup`, `removeGroup` |
| Group Hierarchy | `addToGroup`, `removeFromGroup`, `moveToGroup` |
| Small Body Fields | `setSmallBodyFields`, `updateSmallBodyField`, `removeSmallBodyField` |
| Protoplanetary Disks | `setProtoplanetaryDisks`, `addProtoplanetaryDisk`, `updateProtoplanetaryDisk`, `removeProtoplanetaryDisk` |
| Nebulae | `setNebulae`, `updateNebula`, `removeNebula` |
| Rings | `updateRing`, `removeRing` |
| Snapshot | `replaceSnapshot` |

## 5. Documentation resources

The server also registers documentation resources accessible via the MCP protocol:

- `docs://solar-system-constructor/system-overview`
- `docs://solar-system-constructor/universe-structure`
- `docs://solar-system-constructor/commands-reference`
- `docs://solar-system-constructor/validation-rules`
- `docs://solar-system-constructor/realtime-streaming`
- `docs://solar-system-constructor/full` (all sections combined)

## 6. Example usage in Claude Code

Once the MCP server is connected, you can interact with the universe conversationally:

```
You: "Show me the current state of the universe"
→ Claude calls get_universe_state

You: "Add a red dwarf star named Proxima at position (10, 0, 5)"
→ Claude calls send_universe_command with type: addStar

You: "What commands can I use to manage nebulae?"
→ Claude calls list_universe_commands with category: nebulae

You: "Create a binary star system with a main sequence and a white dwarf orbiting it"
→ Claude calls send_universe_command multiple times (addStar × 2, attachStar)
```

## Transport details

The MCP server uses the **Streamable HTTP** transport:

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/mcp` | Client → Server JSON-RPC messages |
| `GET` | `/mcp` | Server → Client SSE notifications |
| `DELETE` | `/mcp` | Session termination |

Sessions are tracked via the `mcp-session-id` header.
