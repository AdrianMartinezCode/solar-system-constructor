# Spec: repo-readme

_Domain: `repo-readme`_
_Change: `repo-presentation`_
_Date: 2026-02-25_
_Format: Full (new domain)_

---

## Overview

Defines the content and structural requirements for the repository's root `README.md`. The README is the primary entry point for anyone visiting the repository. It MUST convey the project's purpose, differentiators, and getting-started path within the first screenful of content, then provide progressively deeper information for interested readers.

---

## Requirements

### Section Structure

**REQ-README-1**: The README MUST contain the following sections, in this order:

1. Hero section (project title + one-line description + visual placeholder)
2. Elevator pitch ("What is this?" / project introduction)
3. Feature highlights
4. Quick start
5. Tech stack
6. Project structure
7. Documentation links
8. License

**REQ-README-2**: The README SHOULD NOT exceed 250 lines. Detailed usage instructions, tutorials, and implementation specifics MUST be delegated to dedicated documentation files under `docs/`.

### Hero Section

**REQ-README-3**: The hero section MUST include a project title that matches the repository name (`solar-system-constructor`) or its human-readable equivalent ("Solar System Constructor").

**REQ-README-4**: The hero section MUST include a one-line description (subtitle) that communicates both the visual nature (3D interactive) and the technical nature (MCP-enabled, real-time) of the project.

**REQ-README-5**: The hero section MUST include a designated location for a screenshot or animated GIF. If no visual asset is available at the time of implementation, a placeholder comment MUST indicate where to insert one.

**REQ-README-6**: The hero section MAY include badges (license, build status, Node version). If badges are not yet available, the section SHOULD accommodate their future addition without restructuring.

### Elevator Pitch

**REQ-README-7**: The elevator pitch section MUST explain what the project is and what makes it unique. It MUST mention at least the following differentiators:

- Interactive 3D solar system visualization
- MCP server enabling AI assistants to interact with the universe
- Real-time SSE command streaming
- Hexagonal architecture (ports and adapters)
- Procedural generation (L-System based)
- Online/offline mode support

### Feature Highlights

**REQ-README-8**: The feature highlights section MUST present key capabilities in a scannable format (list, table, or categorized groups). Each highlight MUST be concise (one to two lines).

**REQ-README-9**: The feature highlights MUST cover at minimum the following capability categories:

- 3D visualization and scene objects (stars, planets, moons, belts, nebulae, etc.)
- User interface (window manager, panels, workspace presets, keyboard shortcuts)
- Backend and persistence (API, PostgreSQL, Docker)
- MCP integration (tools, resources, transport)
- Real-time streaming (SSE command broadcasting)
- Procedural generation

### Quick Start

**REQ-README-10**: The quick start section MUST provide a getting-started path in three steps or fewer. The steps MUST cover: (a) installing dependencies, (b) running the frontend, and (c) optionally running the backend with database.

**REQ-README-11**: The quick start section MUST distinguish between the minimal path (frontend only, offline mode) and the full-stack path (frontend + backend + database).

**REQ-README-12**: The quick start section SHOULD link to more detailed setup guides for users who need additional help (Docker setup, backend development, troubleshooting).

### Tech Stack

**REQ-README-13**: The tech stack section MUST list the primary technologies used by the project, organized by layer (frontend, backend, shared, infrastructure). The list MUST be accurate and reflect the actual dependencies.

### Project Structure

**REQ-README-14**: The project structure section MUST present a concise directory tree showing the top-level organization of the monorepo. It MUST include at minimum: `apps/web/`, `apps/api/`, `packages/`, `docs/`, and their one-line descriptions.

**REQ-README-15**: The project structure section MUST NOT reproduce the full directory tree of every subfolder. Deep structure details SHOULD be delegated to dedicated documentation.

### Documentation Links

**REQ-README-16**: The documentation links section MUST provide organized links to key documentation files. Links MUST be categorized (e.g., guides, design documents, implementation details).

**REQ-README-17**: Every documentation link in the README MUST resolve to an existing file in the repository. There MUST be zero broken internal links.

### License Section

**REQ-README-18**: The license section MUST state the license type (MIT) and MUST link to the `LICENSE` file at the repository root.

### Content Quality

**REQ-README-19**: The README MUST be written entirely in English. It MUST NOT contain content in other languages.

**REQ-README-20**: The README MUST NOT contain implementation details such as internal type definitions, command reducer logic, or database schema descriptions. Such content belongs in dedicated documentation.

**REQ-README-21**: The README MUST NOT fabricate information. It MUST NOT reference a deployed demo URL unless one actually exists. It MUST NOT claim CI badge URLs that do not resolve.

---

## Scenarios

### Scenario 1 (REQ-README-1): README section ordering

- **Given** a visitor opens the repository's `README.md`
- **When** they read the document from top to bottom
- **Then** they encounter sections in the prescribed order: hero, elevator pitch, feature highlights, quick start, tech stack, project structure, documentation links, license

### Scenario 2 (REQ-README-2): README length constraint

- **Given** the README has been rewritten
- **When** the total line count is measured
- **Then** the line count SHOULD NOT exceed 250 lines

### Scenario 3 (REQ-README-3): Title matches repository identity

- **Given** a visitor lands on the GitHub repository page
- **When** they read the README title
- **Then** the title reads "Solar System Constructor" or a close equivalent of the repository name `solar-system-constructor`

### Scenario 4 (REQ-README-4): One-line description communicates scope

- **Given** a visitor reads the subtitle/one-liner
- **When** they parse the description
- **Then** they understand the project involves 3D interactive visualization and has technical depth (MCP, real-time capabilities)

### Scenario 5 (REQ-README-5): Visual placeholder present

- **Given** no screenshot or GIF asset has been added yet
- **When** a maintainer opens the README source
- **Then** they find a clearly marked placeholder comment indicating where to insert a visual asset

### Scenario 6 (REQ-README-7): Elevator pitch covers differentiators

- **Given** a visitor reads the elevator pitch section
- **When** they finish reading it
- **Then** they have encountered mentions of: 3D visualization, MCP server, SSE streaming, hexagonal architecture, procedural generation, and online/offline mode

### Scenario 7 (REQ-README-9): Feature highlights cover all categories

- **Given** a visitor scans the feature highlights section
- **When** they review the listed capabilities
- **Then** they find entries for: 3D scene objects, user interface, backend/persistence, MCP integration, real-time streaming, and procedural generation

### Scenario 8 (REQ-README-10, REQ-README-11): Quick start paths

- **Given** a new user wants to try the project
- **When** they follow the quick start section
- **Then** they find a minimal path (frontend-only, 2-3 steps) and a full-stack path (frontend + backend + database) clearly distinguished

### Scenario 9 (REQ-README-13): Tech stack accuracy

- **Given** the tech stack section lists technologies
- **When** each listed technology is checked against the project's actual dependencies
- **Then** every listed technology is genuinely used by the project

### Scenario 10 (REQ-README-14, REQ-README-15): Project structure conciseness

- **Given** the project structure section presents a directory tree
- **When** the tree is reviewed
- **Then** it shows top-level directories with one-line descriptions and does not reproduce deep subfolder structures

### Scenario 11 (REQ-README-17): Zero broken links

- **Given** the README contains internal documentation links
- **When** each link target is checked against the repository file system
- **Then** every link resolves to an existing file (zero broken links)

### Scenario 12 (REQ-README-19): English-only content

- **Given** the README has been rewritten
- **When** the full text is reviewed
- **Then** all content is in English with no Spanish or other non-English text

### Scenario 13 (REQ-README-21): No fabricated information

- **Given** the README references external URLs or assets
- **When** each reference is checked
- **Then** no demo URLs, badge URLs, or asset URLs are included unless they actually resolve
