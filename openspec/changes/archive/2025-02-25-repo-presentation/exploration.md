# Exploration: repo-presentation

_Change name: `repo-presentation`_
_Date: 2026-02-25_

---

## Current State

### 1. Root-Level Files

| File | Belongs at root? | Notes |
|------|:-:|-------|
| `README.md` | Yes | Primary entry point, but needs rewrite (see analysis below) |
| `package.json` | Yes | Monorepo workspace orchestrator |
| `package-lock.json` | Yes | Lockfile |
| `tsconfig.json` | Yes | Root TS config |
| `tsconfig.base.json` | Yes | Shared TS base config |
| `compose.yaml` | Yes | Docker Compose for local dev |
| `.gitignore` | Yes | Standard |
| `.dockerignore` | Yes | Standard |
| `CLAUDE.md` | Yes | Claude Code configuration (project instructions) |
| `.cursorrules` | Yes | Cursor IDE configuration |
| `skills-lock.json` | Yes | Agent skills lockfile |
| **`QUICKSTART.md`** | **No** | Contains a mix of roadmap items (in Spanish!), installation, and troubleshooting. Content overlaps heavily with README. Should be merged into README or moved to `docs/guides/`. |
| **`TROUBLESHOOTING.md`** | **No** | Very early-stage troubleshooting from initial development. Specific to debugging blank screens and first-run issues. Should be moved to `docs/guides/`. |

**Key finding**: `QUICKSTART.md` contains a "Roadmap / Future Ideas" section at the top with items in Spanish, mixed with installation instructions. This should not be the first thing a public visitor sees.

### 2. Current README.md Analysis

The current README is **354 lines** and has several issues for a public-facing repo:

**Strengths:**
- Comprehensive feature list
- Shows monorepo structure
- Tech stack documented
- Getting started instructions present

**Problems for public presentation:**
1. **No visual hook** -- no screenshot, GIF, or demo link. A 3D interactive solar system is visually stunning but the README gives no visual impression at all.
2. **Title is "Nested Solar System Constructor"** -- inconsistent with the repo name `solar-system-constructor` and the project name in `package.json`.
3. **Feature list uses emojis inconsistently** -- some items have emojis, most don't.
4. **Too long and detailed for a landing page** -- 354 lines with deep usage instructions that belong in dedicated docs. The README reads like a user manual, not a project introduction.
5. **No "Why" section** -- doesn't explain the motivation, what makes this project unique, or who it's for.
6. **Missing key features** -- the README does not mention:
   - Online/offline mode
   - MCP server integration (major differentiator!)
   - Real-time SSE command streaming
   - PostgreSQL persistence
   - Domain-driven design / hexagonal architecture
   - The multi-agent SDD pipeline
   - The seeder script
7. **Broken/stale links** -- references `KEYBOARD_SHORTCUTS.md` and `docs/BODY_POV_CAMERA.md` and `docs/GROUP_ISOLATION_FEATURE.md` at old paths (pre-taxonomy migration). The docs have been moved to `docs/guides/KEYBOARD_SHORTCUTS.md`, `docs/design/BODY_POV_CAMERA.md`, `docs/implementation/GROUP_ISOLATION_FEATURE.md`.
8. **Data Structure section** is implementation detail that belongs in domain docs, not the README.
9. **License section says "MIT"** but there is no `LICENSE` file at the root.
10. **No badges** (build status, license, Node version, etc.).

### 3. docs/ Folder Structure

The docs folder is **well-organized** after a recent taxonomy migration:

```
docs/
├── README.md              # Docs map (entry point)
├── TAXONOMY.md            # Routing rules for doc placement
├── mcp-server-usage.md    # MCP integration guide
├── solar-system-constructor.code-workspace  # VS Code workspace (misplaced?)
├── decisions/             # 4 ADRs + triage notes + template
├── design/                # 7 design docs (architecture, algorithms, UI)
├── implementation/        # 14 implementation docs (features, orbits, belts)
├── guides/                # 7 how-to guides (generator, keyboard, dev setup)
├── summaries/             # 7 delivery summaries
└── ai_prompts/            # 3 reusable AI prompts + template
```

**Key docs that could be linked from README:**
- `docs/mcp-server-usage.md` -- MCP server setup and usage
- `docs/guides/KEYBOARD_SHORTCUTS.md` -- keyboard shortcuts reference
- `docs/guides/LOCAL_DEV_DOCKER.md` -- Docker development guide
- `docs/guides/LOCAL_DEV_BACKEND.md` -- Backend development guide
- `docs/design/PROCEDURAL_GENERATOR.md` -- Generator design doc
- `docs/guides/GENERATOR_QUICKREF.md` -- Generator quick reference

**Observation**: `docs/mcp-server-usage.md` sits at the docs root, outside the taxonomy folders. Per the taxonomy rules, it should be in `docs/guides/`.

### 4. Frontend Architecture (apps/web/)

**Stack**: Vite + React 18 + TypeScript + React Three Fiber + Zustand

**Architecture** (domain-driven, hexagonal ports & adapters):
```
apps/web/src/
├── app/ports/           # Port interfaces (commandStream, systemRepository, universeApiClient)
├── domain/
│   ├── generation/      # Procedural generation (L-System, topology, stats)
│   └── universe/        # Universe domain (commands, state, validate, applyCommand)
├── infra/
│   ├── api/             # HTTP client + mock client + provider
│   ├── persistence/     # localStorage adapter
│   └── realtime/        # SSE command stream adapter
├── state/               # Zustand stores (appMode, onlineSession, realtime, system, ui, window)
├── hooks/               # Custom hooks (keyboard shortcuts, performance telemetry, remote command stream)
├── components/          # R3F 3D scene components (30+ components)
│   └── charts/          # SVG chart components (donut, histogram, scatter, sparkline)
├── ui/                  # React UI panels (editors, hierarchy, star list, etc.)
├── utils/               # Helper functions (physics, persistence, topology, stats)
└── types/               # TypeScript type definitions
```

**Key features implemented:**
- Online/offline mode selection screen at startup
- Universe browser (list, load, create, delete universes from API)
- Real-time SSE command stream with toast notifications
- Connection status indicator
- Window manager with draggable/resizable/dockable panels
- Taskbar with workspace presets (Exploration, Editing, Generation)
- 3D scene with: stars, planets, moons, orbit rings, asteroid belts, Kuiper belts, protoplanetary disks, nebulae, black holes, comets, Lagrange points, rogue planets, planetary rings, group boxes
- Body POV camera (first-person view from any celestial body)
- Procedural universe generator (L-System based)
- Hierarchy tree, system overview, stats panel
- Full keyboard shortcuts

### 5. Backend Architecture (apps/api/)

**Stack**: Node.js + Express + TypeScript + PostgreSQL

**Architecture** (layered, hexagonal ports & adapters):
```
apps/api/src/
├── app/
│   ├── ports/           # Port interfaces (commandGateway, universeRepository)
│   └── services/        # Application services (commandService)
├── config/              # Environment, CORS, structured logging (pino)
├── content/             # MCP tool definitions, documentation content
├── infra/
│   ├── db/              # Database providers (postgres, noop, factory)
│   ├── persistence/     # Repository adapters (inMemory, postgres)
│   └── realtime/        # Command gateway adapter (inMemory pub/sub)
├── mcp/                 # MCP server + Streamable HTTP transport
├── routes/              # Express routers (health, universes CRUD, commands + SSE)
├── app.ts               # Express app factory
└── server.ts            # Server entry point
```

**API Endpoints:**
| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| POST | `/universes` | Create universe |
| GET | `/universes` | List universes |
| GET | `/universes/:id` | Get universe |
| PUT | `/universes/:id` | Update universe |
| DELETE | `/universes/:id` | Delete universe |
| POST | `/universes/:id/commands` | Send a command (mutate + broadcast) |
| GET | `/universes/:id/events` | SSE stream of commands |
| POST/GET/DELETE | `/mcp` | MCP Streamable HTTP transport |

**Key features:**
- Dual persistence: in-memory (offline/dev) and PostgreSQL (production)
- SSE real-time command broadcasting
- MCP server with 3 tools + 6 documentation resources
- Command event log (append-only, for future event sourcing)
- Structured logging with pino
- CORS configuration

### 6. Shared Domain Package (packages/domain/)

**Package**: `@solar/domain`

Contains the shared universe domain types, command definitions, state management, command reducer (applyCommand), and validation logic. Used by both frontend and backend.

**Key types**: `Star`, `PlanetaryRing`, `CometMeta`, `LagrangePointMeta`, `BlackHoleProperties`, `RoguePlanetMeta`, `AsteroidBelt`, `SmallBodyField`, `ProtoplanetaryDisk`, `NebulaRegion`, `Group`, `GroupChild`, `NestingLevel`, `Position`

**25 command types** across 10 categories (Simulation, Star CRUD, Star Hierarchy, Group CRUD, Group Hierarchy, Small Body Fields, Protoplanetary Disks, Nebulae, Rings, Snapshot).

### 7. Agent System (.agents/)

A sophisticated multi-agent SDD (Spec-Driven Development) pipeline:

- **10 roles**: Scout, Advocate, Scribe, Architect, Strategist, Builder, Sentinel, Archivist, Curator, Founder
- **27+ skills**: codebase-explorer, proposal-writer, spec-writer, design-writer, task-planner, dev-task-executor, implementation-verifier, change-archiver, and more (including imported skills: backend-dev-guidelines, docker-expert, mcp-builder, react-components, skill-creator, vite, websocket-engineer)
- **8 flow commands**: flow-init, flow-explore, flow-new, flow-continue, flow-ff, flow-apply, flow-verify, flow-archive
- Orchestrator is delegate-only; sub-agents execute phase work

### 8. openspec/ (SDD Pipeline Artifacts)

```
openspec/
├── config.yaml                    # Project context, conventions, phase rules
├── specs/                         # Living specifications (6 domain specs)
│   ├── api-content/spec.md
│   ├── api-logging/spec.md
│   ├── command-endpoint/spec.md
│   ├── command-service/spec.md
│   ├── mcp-server/spec.md
│   └── topbar-ui/spec.md
└── changes/
    └── archive/                   # 17 completed changes with full audit trail
        ├── 2026-02-19-curator-of-order-agent/
        ├── 2026-02-19-docs-root-md-taxonomy-refactor/
        ├── ... (15 more)
        └── 2026-02-25-logging-and-topbar-improvements/
```

### 9. MCP Server

The MCP (Model Context Protocol) server is a major differentiator. It allows AI assistants to interact with the universe in real time:

- **3 tools**: `get_universe_state`, `list_universe_commands`, `send_universe_command`
- **6 documentation resources**: system-overview, universe-structure, commands-reference, validation-rules, realtime-streaming, full
- **Transport**: Streamable HTTP (POST/GET/DELETE on `/mcp`)
- **Documentation**: `docs/mcp-server-usage.md` with Claude Code and Claude Desktop configuration examples

### 10. Docker/Infrastructure

- `compose.yaml`: API + PostgreSQL 16 Alpine
- `apps/api/Dockerfile`: Multi-stage build (builder + runtime)
- `apps/api/infra/sql/init.sql`: Schema with `universes` and `universe_commands` tables
- `scripts/seed-solar-system.mjs`: 50-command seeder script that builds a full Solar System via the API

---

## Approach Comparison

### Approach A: Minimal README Rewrite + File Reorganization

**Description**: Rewrite the README to be a compelling project introduction. Move QUICKSTART.md and TROUBLESHOOTING.md into docs/guides/. Fix broken links. Add a license file.

| Pros | Cons | Complexity |
|------|------|:---:|
| Focused, quick to execute | Does not address missing screenshots/demos | Low |
| Clear separation of concerns | README might still be too text-heavy | |
| Reduces root clutter | | |

### Approach B: Full README Redesign + Supporting Docs

**Description**: Complete README redesign following modern open-source conventions: hero section with screenshot/GIF, concise "what/why/how" structure, feature highlights with architecture diagram, prominent MCP section, badges, links to detailed docs. Move stale root files. Add LICENSE. Create a CONTRIBUTING.md stub.

| Pros | Cons | Complexity |
|------|------|:---:|
| Professional public-facing presentation | Requires screenshot/GIF creation (out of scope?) | Medium |
| Highlights unique differentiators (MCP, real-time, 3D) | More files to coordinate | |
| Modern OSS conventions (badges, contributing) | | |
| Good structure for future growth | | |

### Approach C: Approach B + Architecture Documentation Page

**Description**: Everything in Approach B, plus a dedicated `docs/design/ARCHITECTURE_OVERVIEW.md` that documents the full system architecture (hexagonal architecture, domain model, real-time streaming, MCP integration) with diagrams. README links to it.

| Pros | Cons | Complexity |
|------|------|:---:|
| Complete documentation story | Scope creep risk | Medium-High |
| Architecture doc serves as deep-dive for contributors | Takes longer | |
| README stays concise, deep content lives in docs | | |

---

## Recommended Approach

**Approach B** -- Full README redesign + supporting docs. This gives the best return on effort for making the repo presentable. The architecture overview (Approach C) can be a follow-up change.

**Key elements for the new README:**
1. Project title + one-line description
2. Screenshot/GIF placeholder (or embedded if available)
3. "What is this?" section (elevator pitch highlighting unique aspects)
4. Feature highlights (concise, categorized)
5. Architecture overview (brief, with link to detailed doc)
6. Quick start (3-step: install, run frontend, run backend)
7. MCP integration section (this is a major differentiator)
8. Tech stack table
9. Project structure (concise tree)
10. Documentation links (organized by category)
11. License + badges

---

## Risks

1. **No screenshots/GIFs exist** -- The README would benefit enormously from visual content, but creating screenshots may be out of scope for this change. A placeholder section with instructions to add them later is acceptable.
2. **Broken links in current README** -- At least 3 links point to pre-migration paths. These will be fixed in the rewrite but any existing bookmarks will break.
3. **QUICKSTART.md has Spanish content** -- Moving this file preserves the Spanish roadmap items. They should be cleaned up or removed.
4. **No LICENSE file** -- README says "MIT" but no LICENSE file exists. One should be added.
5. **`docs/mcp-server-usage.md` placement** -- This file sits outside the taxonomy folders. It should ideally move to `docs/guides/` for consistency, but this would break the link from MCP configuration docs.

---

## Open Questions

1. Should a `LICENSE` file (MIT) be created as part of this change, or is that a separate concern?
2. Does the user have screenshots/GIFs of the application to include in the README, or should placeholders be used?
3. Should `QUICKSTART.md` be deleted entirely (merging useful content into README) or moved to `docs/guides/`?
4. Should a `CONTRIBUTING.md` be created for the public repo?
5. Is there a deployed demo URL to link from the README?
