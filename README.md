# Solar System Constructor

A 3D interactive solar system builder with MCP-powered AI integration, real-time SSE streaming, and procedural L-System generation.

<!-- TODO: Add a screenshot or animated GIF here showcasing the 3D solar system view.
     Recommended size: 800x450px. Place the image in the repo and reference it like:
     ![Solar System Constructor](docs/assets/screenshot.png)
-->

## What is this?

Solar System Constructor is a browser-based tool for building, exploring, and simulating nested solar systems in real time. It combines **React Three Fiber** for GPU-accelerated 3D rendering with a **Node.js + Express** backend that provides persistence, an **MCP server** for AI assistant integration, and **SSE-based command streaming** for live collaboration.

The frontend uses a **hexagonal architecture** (ports and adapters) with a shared domain package, keeping rendering, state management, and infrastructure cleanly separated. An **L-System procedural generator** creates entire solar systems from grammar-based topology presets. The app runs in **online mode** (connected to the backend with PostgreSQL persistence) or **offline mode** (localStorage only, no server required).

## Highlights

**3D Visualization**
- Stars, planets, moons, asteroid belts, comets, nebulae, black holes, protoplanetary disks, ring systems, Lagrange points, rogue planets
- Elliptical orbits with eccentricity, inclination, and 3D rotation
- Body POV camera -- view the universe from any orbiting object

**User Interface**
- Floating/dockable window manager with workspace presets (Exploration, Editing, Generation)
- System overview with search, filter, and browse for 1000+ objects
- Full keyboard shortcut support

**Backend and Persistence**
- Express API with PostgreSQL storage via Docker Compose
- Online/offline dual mode -- works as a standalone frontend or full stack
- SSE-powered real-time command broadcasting

**MCP Integration**
- AI assistants read universe state, list commands, and send mutations
- 25 command types across 10 categories (star CRUD, groups, nebulae, disks, rings, snapshots)
- Streamable HTTP transport with session management

**Procedural Generation**
- L-System grammar with topology presets (sparse, solar-like, crowded, super-dense)
- Configurable eccentricity styles, orbit inclination, and center offsets
- Deterministic seed-based generation with hierarchical grouping

**Architecture**
- Hexagonal architecture with ports and adapters in the frontend
- Shared domain package (`packages/domain`) consumed by both web and API
- Domain-driven folder layout with Zustand stores

## Quick Start

**Prerequisites:** Node.js 18+ and npm.

### Frontend only (offline mode)

```bash
git clone <repo-url> && cd solar-system-constructor
npm install
npm run dev        # http://localhost:5173
```

### Full stack (frontend + backend + database)

```bash
npm install
docker compose up -d          # starts PostgreSQL
npm run dev:api               # http://localhost:3001
npm run dev:web               # http://localhost:5173 (connects to API)
```

See [Quick Start Guide](docs/guides/QUICKSTART.md) for detailed instructions, [Docker setup](docs/guides/LOCAL_DEV_DOCKER.md), or [Backend development](docs/guides/LOCAL_DEV_BACKEND.md).

## MCP Integration

The API exposes an [MCP (Model Context Protocol)](https://modelcontextprotocol.io/) server that lets AI assistants interact with the universe in real time.

Add to your `.claude/settings.json`:

```json
{
  "mcpServers": {
    "solar-system": {
      "url": "http://localhost:3001/mcp"
    }
  }
}
```

The MCP server provides three tools: `get_universe_state`, `list_universe_commands`, and `send_universe_command`. See the full [MCP Server Usage Guide](docs/guides/mcp-server-usage.md) for setup details, command categories, and example interactions.

## Tech Stack

| Layer | Technology | Path |
|-------|-----------|------|
| Frontend | React 18, React Three Fiber, Three.js, Zustand, Vite | `apps/web/` |
| Backend | Node.js, Express, PostgreSQL, MCP SDK | `apps/api/` |
| Shared | TypeScript domain library (types, universe logic) | `packages/domain/` |
| Infrastructure | Docker Compose, npm workspaces, TypeScript | root config |

## Project Structure

```
solar-system-constructor/
├── apps/
│   ├── web/                  # Vite + React + R3F frontend
│   └── api/                  # Express API + MCP server
├── packages/
│   └── domain/               # Shared domain types and logic
├── docs/                     # Guides, design docs, implementation details
├── compose.yaml              # Docker Compose (PostgreSQL)
├── tsconfig.base.json        # Shared TypeScript config
└── package.json              # Root workspace orchestrator
```

## Documentation

**Guides**
- [Quick Start](docs/guides/QUICKSTART.md)
- [Keyboard Shortcuts](docs/guides/KEYBOARD_SHORTCUTS.md)
- [Docker Setup](docs/guides/LOCAL_DEV_DOCKER.md)
- [Backend Development](docs/guides/LOCAL_DEV_BACKEND.md)
- [MCP Server Usage](docs/guides/mcp-server-usage.md)
- [Generator Quick Reference](docs/guides/GENERATOR_QUICKREF.md)
- [Troubleshooting](docs/guides/TROUBLESHOOTING.md)

**Design**
- [Procedural Generator](docs/design/PROCEDURAL_GENERATOR.md)
- [Body POV Camera](docs/design/BODY_POV_CAMERA.md)

**Implementation**
- [Group Isolation Feature](docs/implementation/GROUP_ISOLATION_FEATURE.md)

## License

[MIT](LICENSE)
