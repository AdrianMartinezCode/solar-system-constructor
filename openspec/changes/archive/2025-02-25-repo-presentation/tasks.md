# Tasks: repo-presentation

_Change name: `repo-presentation`_
_Date: 2026-02-25_
_Phase: Tasks_

---

## Phase 1: Foundation (File Moves)

Move files to their correct locations using `git mv` to preserve history. No content edits yet — moves only.

- [x] 1.1 Move QUICKSTART.md to docs/guides/
  - Run: `git mv QUICKSTART.md docs/guides/QUICKSTART.md`
  - **Verify**: `docs/guides/QUICKSTART.md` exists; `QUICKSTART.md` does not exist at root
  - **Refs**: REQ-DOCS-1, Design Decision 1

- [x] 1.2 Move TROUBLESHOOTING.md to docs/guides/
  - Run: `git mv TROUBLESHOOTING.md docs/guides/TROUBLESHOOTING.md`
  - **Verify**: `docs/guides/TROUBLESHOOTING.md` exists; `TROUBLESHOOTING.md` does not exist at root
  - **Refs**: REQ-DOCS-2, Design Decision 1

- [x] 1.3 Move docs/mcp-server-usage.md to docs/guides/
  - Run: `git mv docs/mcp-server-usage.md docs/guides/mcp-server-usage.md`
  - **Verify**: `docs/guides/mcp-server-usage.md` exists; `docs/mcp-server-usage.md` does not exist at docs root
  - **Refs**: REQ-DOCS-3, Design Decision 1

---

## Phase 2: Core Implementation (Content Edits)

Apply content edits to moved files, create new files, and update cross-references.

### 2A — QUICKSTART.md Cleanup

- [x] 2.1 Remove Spanish roadmap section from docs/guides/QUICKSTART.md
  - **File**: `docs/guides/QUICKSTART.md`
  - Delete lines 3-11 (the "## Roadmap / Future Ideas" section containing Spanish text: "Otros algoritmos de generación", "Todos los clusters...", etc.)
  - **Verify**: File contains no Spanish-language text; the "## Roadmap / Future Ideas" heading is gone
  - **Refs**: REQ-DOCS-4, Design Decision 2

- [x] 2.2 Remove hardcoded absolute path from docs/guides/QUICKSTART.md
  - **File**: `docs/guides/QUICKSTART.md`
  - Replace `cd /home/adr/front-portfolio-interactive/solar-system-constructor` with `cd solar-system-constructor` (or a generic relative instruction)
  - **Verify**: No occurrences of `/home/adr/` in the file
  - **Refs**: REQ-DOCS-5, Design Decision 2

- [x] 2.3 Update relative links in docs/guides/QUICKSTART.md for new location
  - **File**: `docs/guides/QUICKSTART.md`
  - Current links reference `docs/guides/LOCAL_DEV_DOCKER.md` and `docs/guides/LOCAL_DEV_BACKEND.md` — these were relative from root. Since the file is now inside `docs/guides/`, update these to `LOCAL_DEV_DOCKER.md` and `LOCAL_DEV_BACKEND.md` (or `../../docs/guides/...` as appropriate from new location)
  - **Verify**: All relative links in the file resolve correctly from `docs/guides/`
  - **Refs**: REQ-DOCS-11, Scenario 6

### 2B — LICENSE File

- [x] 2.4 Create LICENSE file at repository root
  - **File**: `LICENSE` (new, at repo root)
  - Use standard MIT License text
  - Copyright line: `Copyright (c) 2024-2026 adr`
  - Must include: MIT License header, full permission grant, warranty disclaimer
  - **Verify**: `LICENSE` exists at root; contains "MIT License", "2024-2026", and "adr"
  - **Refs**: REQ-LIC-1 through REQ-LIC-5, Design Decision 4

### 2C — README.md Rewrite

- [x] 2.5 Write new README.md with complete section structure
  - **File**: `README.md` (complete replacement)
  - Target: ~120 lines (down from 354), following the section ordering from Design Decision 3:
    1. **Title**: "Solar System Constructor" + one-line description mentioning 3D interactive + MCP-enabled + real-time
    2. **Screenshot placeholder**: HTML comment with instructions for adding visual asset
    3. **What is this?**: Elevator pitch covering 6 differentiators (3D visualization, MCP server, SSE streaming, hexagonal architecture, procedural generation, online/offline mode)
    4. **Highlights**: Categorized feature list covering all 6 categories from REQ-README-9 (3D visualization, UI, backend/persistence, MCP, real-time streaming, procedural generation)
    5. **Quick Start**: 3-step instructions distinguishing minimal (frontend-only) and full-stack paths, with links to detailed guides
    6. **MCP Integration**: Brief explanation + config snippet + link to `docs/guides/mcp-server-usage.md`
    7. **Tech Stack**: Table format (Layer / Technology / Path) for frontend, backend, shared, infrastructure
    8. **Project Structure**: Concise monorepo tree (max 2 levels deep) with one-line descriptions for `apps/web/`, `apps/api/`, `packages/`, `docs/`
    9. **Documentation**: Categorized links grouped by docs/ subfolder (guides, design, implementation)
    10. **License**: "MIT" + link to `LICENSE` file
  - **Verify**: Section order matches spec; line count is under 250; no Spanish text; no fabricated URLs
  - **Refs**: REQ-README-1 through REQ-README-21, Design Decision 3

---

## Phase 3: Integration (Cross-Reference Updates)

Update all files that reference moved/changed files to maintain link integrity.

- [x] 3.1 Update docs/README.md with entries for relocated files
  - **File**: `docs/README.md`
  - In the "Entry Points" section, add an MCP integration entry pointing to `docs/guides/mcp-server-usage.md`
  - In the appropriate listing area, ensure entries exist for:
    - `docs/guides/QUICKSTART.md`
    - `docs/guides/TROUBLESHOOTING.md`
    - `docs/guides/mcp-server-usage.md`
  - **Verify**: All three relocated files are listed in `docs/README.md` with correct paths; no entries reference old locations
  - **Refs**: REQ-DOCS-8, REQ-DOCS-9, Design Decision 6

- [x] 3.2 Update docs/TAXONOMY.md with relocated files in guides listing
  - **File**: `docs/TAXONOMY.md`
  - Add three entries to the `### docs/guides/` section:
    - `docs/guides/QUICKSTART.md`
    - `docs/guides/TROUBLESHOOTING.md`
    - `docs/guides/mcp-server-usage.md`
  - Add corresponding entries to the migration checklist table for these files
  - **Verify**: The `docs/guides/` listing includes all three new files; entries are alphabetically consistent with existing format
  - **Refs**: Design Decision 6

- [x] 3.3 Update QUICKSTART.md reference in docs/ai_prompts/PROMPT_AGENT_SYSTEM_SETUP.md
  - **File**: `docs/ai_prompts/PROMPT_AGENT_SYSTEM_SETUP.md`
  - Line 21: Change `QUICKSTART.md` to `docs/guides/QUICKSTART.md`
  - **Verify**: No references to root-level `QUICKSTART.md` remain in the file
  - **Refs**: REQ-DOCS-12, Design Decision 7

- [x] 3.4 Scan for any remaining references to old file paths
  - Search the entire repo for references to:
    - `QUICKSTART.md` at root (excluding `docs/guides/QUICKSTART.md` and openspec artifacts)
    - `TROUBLESHOOTING.md` at root (excluding `docs/guides/TROUBLESHOOTING.md` and openspec artifacts)
    - `docs/mcp-server-usage.md` (excluding `docs/guides/mcp-server-usage.md` and openspec artifacts)
  - Update any found references (expected: none beyond those already handled, but verify)
  - **Verify**: Zero occurrences of old paths remain outside openspec artifacts
  - **Refs**: REQ-DOCS-10, REQ-DOCS-12, Design Decision 5

---

## Phase 4: Verification

Validate all requirements are met without modifying files.

- [x] 4.1 Verify file existence — moved files at new locations, originals removed
  - Confirm these files EXIST:
    - `docs/guides/QUICKSTART.md`
    - `docs/guides/TROUBLESHOOTING.md`
    - `docs/guides/mcp-server-usage.md`
    - `LICENSE`
  - Confirm these files do NOT exist:
    - `QUICKSTART.md` (at root)
    - `TROUBLESHOOTING.md` (at root)
    - `docs/mcp-server-usage.md` (at docs root)
  - **Refs**: Scenarios 1-3 (docs-organization), Scenario 1 (repo-licensing)

- [x] 4.2 Verify README.md link integrity — every internal link resolves
  - Check every markdown link in `README.md` against the filesystem
  - Expected link targets (from Design link resolution map):
    - `docs/guides/QUICKSTART.md`
    - `docs/guides/TROUBLESHOOTING.md`
    - `docs/guides/mcp-server-usage.md`
    - `docs/guides/KEYBOARD_SHORTCUTS.md`
    - `docs/guides/LOCAL_DEV_DOCKER.md`
    - `docs/guides/LOCAL_DEV_BACKEND.md`
    - `docs/guides/GENERATOR_QUICKREF.md`
    - `docs/design/PROCEDURAL_GENERATOR.md`
    - `docs/design/BODY_POV_CAMERA.md`
    - `docs/implementation/GROUP_ISOLATION_FEATURE.md`
    - `LICENSE`
  - **Verify**: Zero broken links
  - **Refs**: REQ-README-17, REQ-DOCS-10, Scenario 11 (repo-readme)

- [x] 4.3 Verify README.md content quality
  - Confirm: line count under 250 (REQ-README-2, Scenario 2)
  - Confirm: title matches "Solar System Constructor" (REQ-README-3, Scenario 3)
  - Confirm: one-line description mentions 3D + technical depth (REQ-README-4, Scenario 4)
  - Confirm: screenshot/GIF placeholder comment exists (REQ-README-5, Scenario 5)
  - Confirm: elevator pitch mentions all 6 differentiators (REQ-README-7, Scenario 6)
  - Confirm: feature highlights cover all 6 categories (REQ-README-9, Scenario 7)
  - Confirm: quick start has minimal and full-stack paths (REQ-README-10/11, Scenario 8)
  - Confirm: tech stack is accurate (REQ-README-13, Scenario 9)
  - Confirm: project structure is concise, max 2 levels (REQ-README-14/15, Scenario 10)
  - Confirm: all English, no Spanish (REQ-README-19, Scenario 12)
  - Confirm: no fabricated URLs or badges (REQ-README-21, Scenario 13)
  - **Refs**: REQ-README-1 through REQ-README-21

- [x] 4.4 Verify LICENSE file content
  - Confirm: contains "MIT License" header (REQ-LIC-3, Scenario 2)
  - Confirm: copyright line includes "2024-2026" (REQ-LIC-4, Scenario 3)
  - Confirm: copyright line includes "adr" (REQ-LIC-5, Scenario 4)
  - Confirm: README license section says "MIT" matching LICENSE (REQ-LIC-6, Scenario 5)
  - **Refs**: REQ-LIC-1 through REQ-LIC-7

- [x] 4.5 Verify QUICKSTART.md cleanup
  - Confirm: no Spanish text in `docs/guides/QUICKSTART.md` (REQ-DOCS-4, Scenario 4)
  - Confirm: no hardcoded `/home/adr/` paths (REQ-DOCS-5, Scenario 5)
  - Confirm: internal links resolve from new location (REQ-DOCS-11, Scenario 6)
  - **Refs**: REQ-DOCS-4, REQ-DOCS-5, REQ-DOCS-11

- [x] 4.6 Verify docs/README.md integrity
  - Confirm: entries exist for all three relocated files (REQ-DOCS-8, Scenario 8)
  - Confirm: no dead entries pointing to nonexistent files (REQ-DOCS-9, Scenario 9)
  - **Refs**: REQ-DOCS-8, REQ-DOCS-9

- [x] 4.7 Verify no unrelated source code modifications
  - Review git diff to confirm no files under `apps/`, `packages/`, `scripts/`, `.agents/` are modified (except docs path references per REQ-DOCS-13)
  - **Refs**: REQ-DOCS-13, Scenario 13 (docs-organization)

- [x] 4.8 Run build to confirm no breakage (NOTE: `npm run build:domain` passes; `npm run build:web` has pre-existing TS errors in app source code, unrelated to this change)
  - Run: `npm run build`
  - **Verify**: Build succeeds (exit code 0). Documentation-only changes should not affect the build, but this confirms the build toolchain does not depend on moved files.
  - **Refs**: Proposal success criteria, Design testing strategy

---

## Phase 5: Cleanup (Commit Organization)

Stage and commit changes following the 2-commit strategy from the design.

- [x] 5.1 ~~Create Commit 1~~ Skipped per user instructions — user will commit. All changes are stage-ready.
  - Stage all file moves (QUICKSTART.md, TROUBLESHOOTING.md, mcp-server-usage.md) and associated edits:
    - `docs/guides/QUICKSTART.md` (moved + cleaned)
    - `docs/guides/TROUBLESHOOTING.md` (moved)
    - `docs/guides/mcp-server-usage.md` (moved)
    - `docs/README.md` (updated entries)
    - `docs/TAXONOMY.md` (updated guides listing)
    - `docs/ai_prompts/PROMPT_AGENT_SYSTEM_SETUP.md` (updated reference)
  - Commit message should describe file reorganization
  - **Verify**: `git log --follow docs/guides/QUICKSTART.md` shows history from before the move
  - **Refs**: Design Migration/Rollout Plan — Commit 1

- [x] 5.2 ~~Create Commit 2~~ Skipped per user instructions — user will commit. All changes are stage-ready.
  - Stage:
    - `LICENSE` (new)
    - `README.md` (rewritten)
  - Commit message should describe README rewrite and license addition
  - **Refs**: Design Migration/Rollout Plan — Commit 2
