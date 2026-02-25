# Design: repo-presentation

_Change name: `repo-presentation`_
_Date: 2026-02-25_
_Phase: Design_

---

## Technical Approach

This change is entirely documentation-scoped: no application code, build configuration, or infrastructure is modified. The core challenge is restructuring the repository's public-facing surface -- the files a visitor sees when landing on the GitHub page -- to be professional, compelling, and accurate.

The work decomposes into three independent tracks that can be executed in any order: (1) file moves with content cleanup, (2) README rewrite, and (3) LICENSE creation. Track 1 must complete before Track 2 can finalize link targets, but the README content can be drafted in parallel.

The design prioritizes _git history preservation_ for moved files, _link integrity_ across the entire docs tree, and _minimal diff surface_ -- only touching files that the proposal explicitly scopes. Cross-references in docs outside the proposal scope (e.g., broken relative links in `docs/implementation/COMETS_IMPLEMENTATION.md`) are noted as out-of-scope findings but not fixed in this change to keep the diff focused.

---

## Architecture Decisions

### Decision 1: File Move Strategy — `git mv` for all relocations

**Description**: Use `git mv` for all three file moves (`QUICKSTART.md`, `TROUBLESHOOTING.md`, `docs/mcp-server-usage.md`) rather than delete-and-recreate.

**Rationale**: `git mv` preserves file history in `git log --follow`, which is valuable for understanding how these docs evolved. It also produces a cleaner diff (rename detection) and avoids accidental content loss during the operation.

**Alternatives considered**:
- _Delete + create new file_: Loses git history. The only advantage would be if we wanted to completely rewrite the file content, but even then `git mv` followed by editing preserves history better.
- _Copy + delete original_: Functionally equivalent to delete+create from git's perspective; no advantage.

**Choice**: `git mv` for all three moves. Content edits (Spanish cleanup in QUICKSTART.md) are applied as a separate commit or in the same commit after the move -- git's rename detection handles this correctly as long as the content similarity stays above ~50%.

---

### Decision 2: QUICKSTART.md Spanish Content Handling — Remove roadmap section, translate nothing

**Description**: Remove the entire "Roadmap / Future Ideas" section (lines 3-11 of current `QUICKSTART.md`) rather than translating it to English.

**Rationale**: The Spanish roadmap items are informal personal notes, not user-facing documentation. Some items are already completed (marked with strikethrough). The roadmap section is unrelated to a "Quick Start Guide" and confuses the document's purpose. Translating them would give them unwarranted permanence as documentation.

**Alternatives considered**:
- _Translate to English_: Preserves the ideas but legitimizes informal notes as documentation. The items are vague ("more types of celestial bodies") and some are stale.
- _Move to a separate `ROADMAP.md`_: Creates a new file the proposal did not scope. Could be a follow-up change.
- _Leave as-is in moved file_: Defeats the purpose of the cleanup. A public visitor finding Spanish roadmap items in a Quick Start guide is confusing.

**Choice**: Delete the "Roadmap / Future Ideas" section entirely. Also remove the hardcoded absolute path (`cd /home/adr/front-portfolio-interactive/solar-system-constructor`) and replace with a generic relative instruction.

**Content changes to QUICKSTART.md during move**:
1. Remove lines 3-11 (the Spanish roadmap section).
2. Replace `cd /home/adr/front-portfolio-interactive/solar-system-constructor` with `cd solar-system-constructor` (or simply remove the `cd` since it is context-dependent).
3. Keep all other content intact (installation instructions, features list, usage tips).

---

### Decision 3: README.md Structure and Section Ordering

**Description**: The new README follows a top-down information architecture: hook first, then explain, then instruct, then reference.

**Rationale**: GitHub README rendering shows content linearly. The first ~20 lines are what appears "above the fold" without scrolling. A visitor should immediately understand: (1) what this project is, (2) what makes it interesting, (3) how to try it. Detailed reference material belongs at the bottom or in linked docs.

**Alternatives considered**:
- _Keep current structure with edits_: The current README buries differentiators under 354 lines of operational detail. Editing in-place would not fix the structural problem.
- _Single-page README with everything_: Too long for a landing page; the current 354 lines already demonstrate this problem.
- _Minimal README linking to docs for everything_: Loses the self-contained quality that makes GitHub READMEs effective; a visitor must click multiple links to understand the project.

**Choice**: The following section ordering, with approximate line budgets:

```
# Solar System Constructor                              (~2 lines)
  One-line description + badge placeholders

<!-- Screenshot/GIF placeholder -->                     (~3 lines)
  HTML comment with instructions for adding visuals

## What is this?                                        (~8 lines)
  Elevator pitch: 3D interactive solar system builder
  with MCP AI integration, real-time SSE streaming,
  procedural L-System generation, hexagonal architecture

## Highlights                                           (~20 lines)
  Categorized feature list (concise, no operational detail):
  - 3D Visualization (R3F, orbits, nebulae, black holes...)
  - AI Integration (MCP server, 25 command types)
  - Real-time Collaboration (SSE streaming, online/offline)
  - Procedural Generation (L-System, topology presets)
  - Architecture (hexagonal, domain-driven, shared domain pkg)

## Quick Start                                          (~20 lines)
  3-step: install, run frontend, run full stack
  Minimal code blocks, link to detailed guides

## MCP Integration                                      (~12 lines)
  Brief explanation + config snippet + link to full guide
  (This is a major differentiator worth calling out)

## Tech Stack                                           (~15 lines)
  Table: Layer | Technology | Path
  Covers frontend, backend, shared, infra

## Project Structure                                    (~20 lines)
  Concise tree showing monorepo layout
  (trimmed from current verbose version)

## Documentation                                        (~15 lines)
  Categorized links to docs/:
  - Guides (quickstart, keyboard, docker, MCP)
  - Design (generator, architecture, camera)
  - Implementation (features list)

## License                                              (~3 lines)
  MIT + link to LICENSE file

TOTAL: ~120 lines (down from 354)
```

---

### Decision 4: LICENSE File — MIT with project name and current year

**Description**: Create a standard MIT license file at the repository root.

**Rationale**: The current README already claims "MIT" license. A `LICENSE` file is required for the claim to be legally meaningful and for GitHub to detect and display the license badge automatically.

**Alternatives considered**:
- _Apache 2.0_: More protective of trademarks, but the project has no trademark concerns and MIT is simpler. The README already says MIT.
- _ISC_: Functionally equivalent to MIT but less recognizable.
- _No license file_: Leaves the project in a legally ambiguous state ("all rights reserved" by default despite the README claim).

**Choice**: Standard MIT license text. Copyright line: `Copyright (c) 2024-2026 adr`. Year range starts from the earliest git commit year. The project name "Solar System Constructor" appears in the file header comment but is not required by the MIT template itself.

---

### Decision 5: Link Audit Strategy — Targeted scan of known broken links + systematic README link verification

**Description**: Fix the 3+ known broken links identified in the exploration, then verify every link in the new README resolves to an existing file.

**Rationale**: A full-repo link audit across all 50+ markdown files would be scope creep. The proposal explicitly scopes: (a) fixing broken links in README.md, and (b) updating references to moved files. A targeted approach keeps the diff small.

**Alternatives considered**:
- _Full repo-wide link audit_: Would find additional broken cross-references (e.g., `docs/implementation/COMETS_IMPLEMENTATION.md` line 484 links to `./BODY_POV_CAMERA.md` which resolves to `docs/implementation/BODY_POV_CAMERA.md` but the file is at `docs/design/BODY_POV_CAMERA.md`). However, this is out of scope per the proposal.
- _Automated link checker tool_: No link checker is configured in the repo. Adding one is out of scope.

**Choice**: Two-pass approach:

**Pass 1 — Fix known broken links** (from exploration):

| Source file | Broken link | Correct target |
|-------------|-------------|----------------|
| `README.md` line 135 | `KEYBOARD_SHORTCUTS.md` | `docs/guides/KEYBOARD_SHORTCUTS.md` |
| `README.md` line 205 | `docs/GROUP_ISOLATION_FEATURE.md` | `docs/implementation/GROUP_ISOLATION_FEATURE.md` |
| `README.md` line 252 | `docs/BODY_POV_CAMERA.md` | `docs/design/BODY_POV_CAMERA.md` |
| `README.md` line 273 | `KEYBOARD_SHORTCUTS.md` | `docs/guides/KEYBOARD_SHORTCUTS.md` |

Note: These links exist in the _current_ README which is being completely rewritten. The fix is implicit -- the new README will use correct paths from the start. However, the Builder must verify every link in the new README against the filesystem.

**Pass 2 — Update references to moved files**:

| Moved file | Old path | New path | Files that reference old path |
|------------|----------|----------|-------------------------------|
| QUICKSTART.md | `QUICKSTART.md` (root) | `docs/guides/QUICKSTART.md` | `docs/ai_prompts/PROMPT_AGENT_SYSTEM_SETUP.md` (line 21) |
| TROUBLESHOOTING.md | `TROUBLESHOOTING.md` (root) | `docs/guides/TROUBLESHOOTING.md` | None found outside openspec artifacts |
| mcp-server-usage.md | `docs/mcp-server-usage.md` | `docs/guides/mcp-server-usage.md` | None found in application code; `docs/README.md` may reference it implicitly |

**Out-of-scope broken links noted for future changes**:
- `docs/implementation/COMETS_IMPLEMENTATION.md` line 480: `./PRNG_README.md` (should be `../guides/PRNG_README.md`)
- `docs/implementation/COMETS_IMPLEMENTATION.md` line 482: `./UI_IMPLEMENTATION_SUMMARY.md` (should be `../summaries/UI_IMPLEMENTATION_SUMMARY.md`)
- `docs/implementation/COMETS_IMPLEMENTATION.md` line 484: `./BODY_POV_CAMERA.md` (should be `../design/BODY_POV_CAMERA.md`)
- `docs/implementation/COMETS_IMPLEMENTATION.md` line 485: `./PROCEDURAL_GENERATOR.md` (should be `../design/PROCEDURAL_GENERATOR.md`)
- `docs/implementation/LAGRANGE_POINTS_IMPLEMENTATION.md` line 431: `./PROCEDURAL_GENERATOR.md` (should be `../design/PROCEDURAL_GENERATOR.md`)
- `docs/implementation/LAGRANGE_POINTS_IMPLEMENTATION.md` line 437: `./UI_IMPLEMENTATION_SUMMARY.md` (should be `../summaries/UI_IMPLEMENTATION_SUMMARY.md`)
- `docs/implementation/LAGRANGE_POINTS_IMPLEMENTATION.md` line 438: `./PRNG_README.md` (should be `../guides/PRNG_README.md`)

These are pre-existing cross-folder link errors from the taxonomy migration. They should be tracked as a separate change.

---

### Decision 6: docs/README.md Update Strategy — Add entries to existing table and guides listing

**Description**: Add three new entries to `docs/README.md` for the relocated files, following the existing format.

**Rationale**: The docs map (`docs/README.md`) serves as the documentation index. It must stay accurate when files are added or moved. The current format uses a table for folder purposes and a categorized list for entry points.

**Alternatives considered**:
- _Rewrite docs/README.md entirely_: Scope creep. The current structure is adequate.
- _Only add to the guides section_: The `docs/guides/` section in the taxonomy listing (`docs/TAXONOMY.md`) should also be updated to include the three new files. However, `TAXONOMY.md` updates are implicit since the file documents what exists.

**Choice**: Add these entries to `docs/README.md`:

1. In the "Entry Points" section, add a line for MCP integration: `- MCP integration: docs/guides/mcp-server-usage.md`
2. The guides folder already has entries; add:
   - Quick start: `docs/guides/QUICKSTART.md`
   - Troubleshooting: `docs/guides/TROUBLESHOOTING.md`
   - MCP server usage: `docs/guides/mcp-server-usage.md`

Also update `docs/TAXONOMY.md` section "docs/guides/" to list the three new files for completeness.

---

### Decision 7: docs/ai_prompts/PROMPT_AGENT_SYSTEM_SETUP.md Reference Update

**Description**: Update the reference to `QUICKSTART.md` in `docs/ai_prompts/PROMPT_AGENT_SYSTEM_SETUP.md` line 21 from `QUICKSTART.md` to `docs/guides/QUICKSTART.md`.

**Rationale**: This is the only non-openspec file outside the docs root that references `QUICKSTART.md` by name. The reference will become stale after the move.

**Alternatives considered**:
- _Leave as-is_: The ai_prompts are copy/paste templates for external tools. The reference is descriptive ("repo entry points") rather than a clickable link, so breakage is cosmetic. However, keeping it accurate costs one line change.

**Choice**: Update the reference path. Minimal effort, high correctness.

---

## Data Flow

This change has no runtime data flow (documentation-only). The relevant "flow" is the file move and link resolution graph:

```
BEFORE                                    AFTER
======                                    =====

root/                                     root/
├── README.md (354 lines, stale links)    ├── README.md (~120 lines, all links valid)
├── QUICKSTART.md (Spanish + hardcoded)   ├── LICENSE (MIT, new)
├── TROUBLESHOOTING.md                    ├── package.json (unchanged)
├── package.json                          ├── ...
├── ...                                   │
│                                         docs/
docs/                                     ├── README.md (updated with 3 new entries)
├── README.md                             ├── TAXONOMY.md (updated guides listing)
├── TAXONOMY.md                           ├── guides/
├── mcp-server-usage.md  ─────────────┐   │   ├── QUICKSTART.md (cleaned, moved from root)
├── guides/                            │   │   ├── TROUBLESHOOTING.md (moved from root)
│   ├── KEYBOARD_SHORTCUTS.md          │   │   ├── mcp-server-usage.md (moved from docs/)
│   ├── LOCAL_DEV_DOCKER.md            │   │   ├── KEYBOARD_SHORTCUTS.md
│   ├── LOCAL_DEV_BACKEND.md           │   │   ├── LOCAL_DEV_DOCKER.md
│   ├── GENERATOR_QUICKREF.md          └──>│   ├── LOCAL_DEV_BACKEND.md
│   ├── ...                                │   ├── GENERATOR_QUICKREF.md
│                                          │   └── ...
├── design/                                ├── design/ (unchanged)
├── implementation/                        ├── implementation/ (unchanged)
├── summaries/                             ├── summaries/ (unchanged)
└── ai_prompts/                            └── ai_prompts/
    └── PROMPT_AGENT_SYSTEM_SETUP.md           └── PROMPT_AGENT_SYSTEM_SETUP.md (ref updated)
```

### Link Resolution Map (new README)

All links in the new `README.md` must resolve correctly. This is the target link map:

```
README.md link target                        → Actual file path
─────────────────────────────────────────────────────────────────
docs/guides/QUICKSTART.md                    → docs/guides/QUICKSTART.md
docs/guides/TROUBLESHOOTING.md               → docs/guides/TROUBLESHOOTING.md
docs/guides/mcp-server-usage.md              → docs/guides/mcp-server-usage.md
docs/guides/KEYBOARD_SHORTCUTS.md            → docs/guides/KEYBOARD_SHORTCUTS.md
docs/guides/LOCAL_DEV_DOCKER.md              → docs/guides/LOCAL_DEV_DOCKER.md
docs/guides/LOCAL_DEV_BACKEND.md             → docs/guides/LOCAL_DEV_BACKEND.md
docs/guides/GENERATOR_QUICKREF.md            → docs/guides/GENERATOR_QUICKREF.md
docs/design/PROCEDURAL_GENERATOR.md          → docs/design/PROCEDURAL_GENERATOR.md
docs/design/BODY_POV_CAMERA.md               → docs/design/BODY_POV_CAMERA.md
docs/implementation/GROUP_ISOLATION_FEATURE.md → docs/implementation/GROUP_ISOLATION_FEATURE.md
LICENSE                                       → LICENSE
```

---

## File Changes Table

| File | Action | Purpose |
|------|--------|---------|
| `README.md` | **Rewrite** | Complete replacement with modern OSS structure (~120 lines) |
| `LICENSE` | **Create** | MIT license file (standard template) |
| `QUICKSTART.md` | **Move + Edit** | `git mv` to `docs/guides/QUICKSTART.md`; remove Spanish roadmap section and hardcoded paths |
| `TROUBLESHOOTING.md` | **Move** | `git mv` to `docs/guides/TROUBLESHOOTING.md`; no content changes |
| `docs/mcp-server-usage.md` | **Move** | `git mv` to `docs/guides/mcp-server-usage.md`; no content changes |
| `docs/README.md` | **Modify** | Add entries for three relocated guides |
| `docs/TAXONOMY.md` | **Modify** | Add three new files to `docs/guides/` listing |
| `docs/ai_prompts/PROMPT_AGENT_SYSTEM_SETUP.md` | **Modify** | Update `QUICKSTART.md` path reference (line 21) |

**Files NOT modified** (explicitly out of scope):
- No files under `apps/`, `packages/`, `.agents/`, `openspec/specs/`, `scripts/`
- No `package.json`, `tsconfig.json`, `compose.yaml`, or any config files
- No files in `docs/implementation/`, `docs/design/`, `docs/summaries/` (broken cross-links there are a separate concern)

---

## Interfaces/Contracts

This change defines no APIs, types, or runtime interfaces. The "contracts" are documentation conventions:

### README Section Contract

Each section in the new README has a defined purpose and length constraint:

| Section | Max lines | Must contain |
|---------|-----------|-------------|
| Title + description | 5 | Project name matching `package.json` name, one-line description |
| Screenshot placeholder | 5 | HTML comment with instructions for adding visual |
| What is this? | 10 | Elevator pitch, 3-5 differentiators named |
| Highlights | 25 | Categorized feature bullets, no operational detail |
| Quick Start | 25 | Prerequisites, install, run frontend, run full stack |
| MCP Integration | 15 | What MCP is, config snippet, link to full guide |
| Tech Stack | 20 | Table format: Layer / Technology / Path |
| Project Structure | 25 | Monorepo tree (trimmed, max 2 levels deep) |
| Documentation | 20 | Categorized links grouped by docs/ subfolder |
| License | 5 | License name + link to LICENSE file |

### LICENSE File Contract

Standard MIT license template. Must contain:
- `MIT License` header
- `Copyright (c) 2024-2026 adr`
- Full permission grant text
- WARRANTY DISCLAIMER in caps

---

## Testing Strategy

This is a documentation-only change. Testing is verification-based, not automated:

1. **Build verification**: `npm run build` must pass. Since no application code is modified, this is a sanity check that the build toolchain does not scan or depend on the moved markdown files.

2. **Link integrity verification**: The Builder must verify every markdown link in:
   - `README.md` (all links resolve to existing files)
   - `docs/README.md` (all links resolve)
   - `docs/guides/QUICKSTART.md` (relative links still work from new location)

3. **File existence verification**: After all moves, confirm:
   - `QUICKSTART.md` does NOT exist at root
   - `TROUBLESHOOTING.md` does NOT exist at root
   - `docs/mcp-server-usage.md` does NOT exist at old location
   - `docs/guides/QUICKSTART.md` EXISTS
   - `docs/guides/TROUBLESHOOTING.md` EXISTS
   - `docs/guides/mcp-server-usage.md` EXISTS
   - `LICENSE` EXISTS at root

4. **Content verification**:
   - `docs/guides/QUICKSTART.md` contains no Spanish text
   - `docs/guides/QUICKSTART.md` contains no hardcoded absolute path `/home/adr/...`
   - `LICENSE` contains valid MIT text with correct year and copyright holder

5. **Git history verification**: `git log --follow docs/guides/QUICKSTART.md` shows history from before the move.

---

## Migration/Rollout Plan

### Execution Order

The changes should be applied in this order to maintain a clean commit history:

**Commit 1: File moves and content cleanup**
1. `git mv QUICKSTART.md docs/guides/QUICKSTART.md`
2. `git mv TROUBLESHOOTING.md docs/guides/TROUBLESHOOTING.md`
3. `git mv docs/mcp-server-usage.md docs/guides/mcp-server-usage.md`
4. Edit `docs/guides/QUICKSTART.md`: remove Spanish section, fix hardcoded paths
5. Edit `docs/README.md`: add entries for relocated files
6. Edit `docs/TAXONOMY.md`: add three files to guides listing
7. Edit `docs/ai_prompts/PROMPT_AGENT_SYSTEM_SETUP.md`: update QUICKSTART.md path

**Commit 2: LICENSE and README**
1. Create `LICENSE` with MIT text
2. Rewrite `README.md` with new structure

This two-commit approach allows clean rollback of either piece independently. However, the Builder may combine into a single commit if preferred -- the proposal's rollback plan supports both approaches.

### Rollback

Per the proposal: `git revert <commit>` for single-commit, or `git checkout main -- <files>` for selective rollback. No runtime dependencies to worry about.

---

## Open Questions

1. **Copyright holder name**: The design assumes `adr` (matching the system username and git history). Should this be a full name or organization? The Builder should use whatever name appears in existing git commits.

2. **Node.js version in README**: The current QUICKSTART.md says "v21+". The actual minimum version should be verified from `package.json` engines field or the Dockerfile. If no engines field exists, document "Node.js 18+" (matching the MCP docs prerequisite).

3. **Badge placeholders**: The proposal says badges are out of scope since no CI exists. The README should include an HTML comment indicating where badges can be added later, but no actual badge markup.

4. **Out-of-scope broken links in docs/implementation/**: Seven broken cross-folder links were found in `COMETS_IMPLEMENTATION.md` and `LAGRANGE_POINTS_IMPLEMENTATION.md` (see Decision 5). These should be tracked as a follow-up change. The Sentinel should flag them during verification if they are not addressed.
