# Proposal: repo-presentation

_Change name: `repo-presentation`_
_Date: 2026-02-25_
_Phase: Propose_

---

## Intent

The repository is not ready for public visibility. The current README reads like an internal user manual rather than a compelling project introduction -- it buries the project's strongest differentiators (3D interactive visualization, MCP server for AI interaction, real-time SSE streaming, hexagonal architecture, procedural L-System generation) under 354 lines of operational detail. Root-level files (`QUICKSTART.md`, `TROUBLESHOOTING.md`) contain early-development artifacts and Spanish-language roadmap items that should not be the first thing a public visitor encounters. The README claims an MIT license but no `LICENSE` file exists. At least three documentation links are broken due to a prior taxonomy migration.

This change transforms the repository's public face so that a visitor landing on the GitHub page immediately understands what the project is, why it is interesting, and how to get started.

---

## Scope

### In scope

- **README.md rewrite**: Complete rewrite following modern open-source conventions -- concise hero section, "What is this?" elevator pitch, categorized feature highlights, quick start (3 steps), MCP integration section, architecture summary, tech stack table, project structure tree, documentation links, license badge.
- **Move QUICKSTART.md to `docs/guides/`**: Relocate to `docs/guides/QUICKSTART.md`. Remove or translate Spanish-language roadmap items during the move so the file is English-only and focused on quick-start instructions.
- **Move TROUBLESHOOTING.md to `docs/guides/`**: Relocate to `docs/guides/TROUBLESHOOTING.md`. No content changes required beyond adjusting any internal relative links.
- **Add LICENSE file**: Create `LICENSE` at the repository root with the MIT license text, using the project name and current year.
- **Fix broken documentation links**: Update all links in README.md that reference pre-migration paths (`KEYBOARD_SHORTCUTS.md`, `docs/BODY_POV_CAMERA.md`, `docs/GROUP_ISOLATION_FEATURE.md`) to their current locations under `docs/`.
- **Update `docs/README.md`**: Add entries for the two newly relocated guides (`QUICKSTART.md`, `TROUBLESHOOTING.md`) so the docs map stays accurate.
- **Move `docs/mcp-server-usage.md`**: Relocate to `docs/guides/mcp-server-usage.md` to comply with the docs taxonomy. Update any references to the old path.

### Out of scope

- **Screenshots, GIFs, or demo recordings**: The user can add visual assets later. The README will include a placeholder comment indicating where to insert a screenshot/GIF.
- **CONTRIBUTING.md**: A contributor guide can be a follow-up change.
- **Architecture overview document** (`docs/design/ARCHITECTURE_OVERVIEW.md`): The exploration identified this as Approach C. It is deferred to a separate change.
- **Code changes**: No application code (frontend, backend, shared packages) is modified.
- **Badge integrations** (CI status, npm version, etc.): These require CI pipeline configuration that does not exist yet. The README structure will accommodate badges when they become available.
- **Deployed demo URL**: None exists; the README will not fabricate one.

---

## Approach

The recommended approach is **Approach B** from the exploration: a full README redesign with supporting file reorganization. This provides the highest return on effort for public presentation without scope creep into new documentation authoring.

The README will be restructured to follow a top-down information architecture: hook the reader first (title, one-liner, visual placeholder), then explain what makes the project unique (elevator pitch, feature highlights, MCP callout), then show how to use it (quick start, tech stack, project structure), and finally link to deeper documentation. Detailed usage instructions (window docking, group nesting, elliptical orbits, etc.) will be removed from the README -- they already exist in dedicated docs under `docs/guides/` and `docs/implementation/`.

Root-level files that do not belong at the repository root (`QUICKSTART.md`, `TROUBLESHOOTING.md`) will be moved into `docs/guides/` where the docs taxonomy places how-to content. The `QUICKSTART.md` move includes a content cleanup pass to remove Spanish-language roadmap items and hardcoded local paths.

A `LICENSE` file will be created at the root to make the MIT license claim verifiable.

The `docs/mcp-server-usage.md` file will be moved into `docs/guides/` to align with the existing taxonomy, and all references (including any in the new README) will point to the new location.

---

## Affected Areas

### Config / Root

| File | Action | Notes |
|------|--------|-------|
| `README.md` | **Rewrite** | Complete replacement with modern OSS structure |
| `LICENSE` | **Create** | MIT license file (does not currently exist) |
| `QUICKSTART.md` | **Move** | Relocate to `docs/guides/QUICKSTART.md`; clean up Spanish content and hardcoded paths |
| `TROUBLESHOOTING.md` | **Move** | Relocate to `docs/guides/TROUBLESHOOTING.md` |

### Documentation

| File | Action | Notes |
|------|--------|-------|
| `docs/README.md` | **Modify** | Add entries for relocated QUICKSTART.md and TROUBLESHOOTING.md |
| `docs/mcp-server-usage.md` | **Move** | Relocate to `docs/guides/mcp-server-usage.md` |
| `docs/guides/QUICKSTART.md` | **Create** | Destination for moved QUICKSTART.md (cleaned up) |
| `docs/guides/TROUBLESHOOTING.md` | **Create** | Destination for moved TROUBLESHOOTING.md |
| `docs/guides/mcp-server-usage.md` | **Create** | Destination for moved mcp-server-usage.md |

### Frontend / Backend / Shared

No application code is modified.

---

## Risks

| # | Risk | Likelihood | Impact | Mitigation |
|---|------|:---:|:---:|-----------|
| 1 | **Broken external bookmarks** | Medium | Low | Old root-level paths for QUICKSTART.md and TROUBLESHOOTING.md will 404. Since the repo is not yet public, external bookmarks are unlikely. |
| 2 | **Incomplete link audit** | Low | Medium | The exploration identified 3 broken links; the implementation phase should perform a systematic scan for any additional stale references across all docs. |
| 3 | **MCP docs path change breaks existing MCP configuration examples** | Low | Low | `docs/mcp-server-usage.md` is referenced from within the file itself and possibly from MCP tool documentation in `apps/api/src/content/`. All references must be updated. |
| 4 | **Spanish content in QUICKSTART.md removed prematurely** | Low | Low | The roadmap items are informal notes, not user-facing content. They can be preserved in a separate internal document if desired. |
| 5 | **README rewrite loses important content** | Low | Medium | All detailed usage content being removed from the README already exists in dedicated docs files. The new README will link to each of them. |

---

## Rollback Plan

All changes are documentation-only (no code, no database, no infrastructure). Rollback is straightforward:

1. **Git revert**: A single `git revert <commit>` undoes the entire change, restoring the original README, root-level files, and docs structure.
2. **Manual rollback**: If partial changes were applied across multiple commits, `git checkout main -- README.md QUICKSTART.md TROUBLESHOOTING.md docs/README.md docs/mcp-server-usage.md` restores the originals. Then delete the newly created files (`LICENSE`, `docs/guides/QUICKSTART.md`, `docs/guides/TROUBLESHOOTING.md`, `docs/guides/mcp-server-usage.md`).
3. **No downstream dependencies**: No application code depends on these files, so reverting has zero runtime impact.

---

## Dependencies

- **None external**. All inputs (exploration findings, existing file content, project metadata from `package.json` and `openspec/config.yaml`) are already available in the repository.
- **Internal prerequisite**: The exploration phase (`exploration.md`) is complete and provides the analysis needed for the README rewrite.

---

## Success Criteria

- [ ] `README.md` is rewritten with: project title matching repo name, one-line description, screenshot/GIF placeholder, "What is this?" section, categorized feature highlights (including MCP, online/offline, SSE streaming, hexagonal architecture, procedural generation), quick start (3 steps), architecture summary, tech stack table, project structure tree, documentation links section, and license section.
- [ ] `README.md` contains zero broken internal links (all doc references resolve to existing files).
- [ ] `QUICKSTART.md` no longer exists at the repository root; its content (cleaned of Spanish text and hardcoded paths) lives at `docs/guides/QUICKSTART.md`.
- [ ] `TROUBLESHOOTING.md` no longer exists at the repository root; it lives at `docs/guides/TROUBLESHOOTING.md`.
- [ ] `LICENSE` file exists at the repository root with valid MIT license text.
- [ ] `docs/mcp-server-usage.md` no longer exists at the old path; it lives at `docs/guides/mcp-server-usage.md`.
- [ ] `docs/README.md` references the three relocated files.
- [ ] `npm run build` passes (no build breakage from documentation-only changes).
- [ ] No application code files are modified.
