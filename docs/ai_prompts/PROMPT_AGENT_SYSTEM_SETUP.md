# Prompt: Add an Agent/Skills + MCP Foundation (Planning-First) — Repo-Local, Safe, Boring

Use this document as a **copy/paste prompt** for another coding model.

## Intended model + role

- **Model**: a coding agent that can read/write repo files and run non-interactive verification commands
- **Role**: repo infrastructure maintainer (agent system + MCP foundation)

## Constraints / do-nots

- **Do not change the existing app implementation** (no edits under `src/` unless explicitly required to wire verification scripts, and even then prefer adding new scripts only).
- **Do not implement any product features** for the solar system app. This work is strictly repo-infrastructure for “agents + skills + MCP tools”.
- Prefer **small, reviewable, PR-sized** diffs.
- Default to **read-only tooling** first (Milestone A). Writing/patch tools are optional (Milestone B).
- No secrets. No destructive commands. No network calls unless required by dependency install.

## Context to read first

- `package.json` (scripts)
- `README.md` and `docs/guides/QUICKSTART.md` (repo entry points)
- Any existing `.agents/`, `docs/`, and `mcp/` folders (if present)

### Repo context

This repo is a Vite + React + TypeScript frontend project using **npm** (`package-lock.json` exists). Current scripts in `package.json`:

- `npm run dev`
- `npm run build` (runs `tsc && vite build`)
- `npm run preview`

There is currently **no dedicated agent system** folder structure and no MCP server in-repo.

## Objective

Add a clean, standard foundation that lets an AI agent:

- Inspect the repo safely (read/list/search/context snapshot).
- Read a “change request / implementation doc prompt”.
- Split it into **small tasks** with acceptance criteria.
- Generate per-task prompts into repo files (planning artifacts).
- (Optional later) apply patches and run verification scripts (lint/tests/build/typecheck).

We want:

- **`/.agents/`**: agent contract + “skills” playbooks (markdown)
- **`/docs/`**: requests, plans, prompts (markdown)
- **`/mcp/`**: a minimal MCP server skeleton (TypeScript) exposing safe repo tools

This should be **boring-on-purpose** and easy for other models to follow.

## Deliverables

Add these top-level folders/files:

```
/.agents/
  agents.md
  skills/
    README.md
    po_task_decomposer.md
    change_request_triage.md
    prompt_writer.md

/docs/
  requests/
  plans/
  prompts/
  decisions/   (ADRs)

/mcp/
  server/
    package.json
    tsconfig.json
    src/
      index.ts
      tools/
        repo_read.ts
        repo_list.ts
        repo_search.ts
        repo_context_snapshot.ts

      // Milestone B (optional):
      // tools/repo_write_patch.ts
      // tools/run_build.ts
      // tools/run_typecheck.ts
      // tools/run_lint.ts
      // tools/run_tests.ts
      // tools/git_status.ts
```

Notes:

- If your VCS doesn’t track empty directories, add `.gitkeep` files inside new empty folders (or ensure they contain real markdown files).
- Keep tooling **repo-local**: do not assume global binaries beyond Node/npm.

---

## Definition of Done (Overall)

When finished (Milestone A):

- The repo contains the new folders and markdown contracts under `/.agents` and `/docs`.
- The MCP server skeleton exists under `/mcp/server` and can be built/started locally (even if not “published”).
- The MCP server exposes **read-only** tools:
  - read file(s)
  - list directories
  - search text (ripgrep-style)
  - context snapshot (scripts, config presence, lightweight tree summary)
- Documentation explains:
  - how to write a change request in `/docs/requests/`
  - how the PO “task decomposer” skill outputs plan + task prompts into `/docs/plans` and `/docs/prompts`

Optional (Milestone B) DoD:

- Add safe gated write/patch tool(s) and verification tools (build/typecheck/lint/tests), each mapping to existing `npm run ...` scripts (add scripts if missing, but avoid changing app code).

---

## Suggested approach

### Milestone A — Planning-only agent (recommended first)

Deliver value immediately without risky writes:

- Add `/.agents/*` and `/docs/*` structure and templates.
- Add MCP server with **read/list/search/context snapshot** tools only.

### Milestone B — Implementation agent (optional later)

Enable incremental task execution:

- Add patch application tool (repo-local, path-restricted).
- Add verification tools (build/typecheck/lint/tests).
- (Optional) add `git_status` and `git_diff`.

---

## Tasks (Small, Reviewable Chunks)

Implement tasks in order. Each task should be a small PR-sized change.

### Task 1 — Add agent contract + skills markdown

**Goal**: Create the human-readable “agent contract” and 3 initial skills playbooks.

**Scope**:

- Add `.agents/agents.md`
- Add `.agents/skills/README.md`
- Add 3 skills:
  - `.agents/skills/po_task_decomposer.md`
  - `.agents/skills/change_request_triage.md`
  - `.agents/skills/prompt_writer.md`

**Non-goals**:

- No MCP server code yet.

**Acceptance criteria**:

- `.agents/agents.md` contains:
  - project overview (5–10 lines max)
  - architecture snapshot (stack + key directories)
  - workflow (read → plan → user approval → implement tasks)
  - definition of done (build passes; later lint/tests if added)
  - change policy (small diffs; don’t mix refactor + feature)
  - safety policy (no secrets; no destructive commands)
- Each skill markdown file uses a consistent template:
  - Purpose
  - Inputs
  - Outputs (file paths under `/docs/`)
  - Algorithm / steps
  - Task sizing rules
  - Example output headings (no code)

**Files touched** (expected):

- `.agents/agents.md`
- `.agents/skills/*`

---

### Task 2 — Add docs folders + “change request” template

**Goal**: Standardize how requests and plans are stored and generated.

**Scope**:

- Create:
  - `docs/requests/`
  - `docs/plans/`
  - `docs/prompts/`
  - `docs/decisions/`
- Add a template change request file:
  - `docs/requests/CR_TEMPLATE.md`
- Add a short README describing the workflow:
  - `docs/requests/README.md` (or `docs/README_AGENTS.md` if preferred)

**Acceptance criteria**:

- `CR_TEMPLATE.md` has headings:
  - Summary
  - Context
  - Goals
  - Non-goals
  - Constraints
  - Out of scope
  - Acceptance criteria
  - Verification (commands)
- Docs explain the loop:
  - write request → run PO decomposer → generate plan + task prompts → implement tasks

**Files touched** (expected):

- `docs/requests/*`
- `docs/plans/` (folder only)
- `docs/prompts/` (folder only)
- `docs/decisions/` (folder only)

---

### Task 3 — Create MCP server skeleton (TypeScript)

**Goal**: Add a minimal MCP server project under `/mcp/server`.

**Scope**:

- Add `mcp/server/package.json` with:
  - build script
  - start/dev script
  - TypeScript config
  - minimal dependencies (MCP SDK + TS tooling)
- Add `mcp/server/src/index.ts` that registers tools (even placeholders at first).

**Constraints**:

- Keep the dependency footprint minimal.
- Avoid any tool that writes to disk in Milestone A.

**Acceptance criteria**:

- `npm install` inside `mcp/server` succeeds.
- `npm run build` (inside `mcp/server`) succeeds.
- Starting the server doesn’t crash (even if tools are minimal at first).

**Files touched** (expected):

- `mcp/server/*`

---

### Task 4 — Implement read-only repo tools: read/list/search/context snapshot

**Goal**: Expose a standard set of safe tools needed by “skills”.

**Scope**:

- Implement tools under `mcp/server/src/tools/`:
  - `repo_read`: read one file (or multiple files) by path, return contents
  - `repo_list`: list directory entries (non-recursive)
  - `repo_search`: text search (ripgrep-like)
  - `repo_context_snapshot`: return:
    - package manager detection (npm/pnpm/yarn)
    - root `package.json` scripts
    - presence of `tsconfig.json`, `vite.config.*`, `.eslintrc*`, `prettier*`, `vitest/jest` config if any
    - short tree summary of top-level dirs

**Safety requirements**:

- Enforce **repo root path restriction** (no `../` escapes).
- Enforce **file size limits** (avoid returning huge blobs).
- Ensure search respects ignore patterns where possible (or implement a safe allowlist).

**Acceptance criteria**:

- Each tool returns clear, structured JSON with:
  - `ok: true/false`
  - `data` and/or `error`
- `repo_context_snapshot` is fast and deterministic.

**Files touched** (expected):

- `mcp/server/src/index.ts`
- `mcp/server/src/tools/*`

---

### Task 5 — Document “skills workflow” using the MCP tools

**Goal**: Provide a concrete runbook showing how the tools + skills work together.

**Scope**:

- Add `.agents/skills/workflow/SKILL.md` (or append to `.agents/agents.md`) describing:
  - how to create `docs/requests/CR_<slug>.md`
  - which MCP tools to run to gather repo context
  - how the PO decomposer should output:
    - `docs/plans/PLAN_<slug>.md`
    - `docs/prompts/<slug>/task_<n>/TASK_<n>_<slug>.md`

**Acceptance criteria**:

- A new contributor can follow the doc and understand:
  - where to put requests
  - how tasks are shaped
  - what “done” means for each task

---

## Required Artifact Templates (what the “PO decomposer” must generate)

These templates are **part of the contract**. Any model acting as the PO decomposer must generate artifacts that follow these headings so subsequent coding agents can execute tasks consistently.

### Plan file template: `docs/plans/PLAN_<slug>.md`

Required sections/headings:

- **Summary**: 5–10 lines max
- **Repo snapshot used**: what was inspected (tools + key files)
- **Assumptions**
- **Risks / unknowns**
- **Out of scope**
- **Task list** (ordered)
  - For each task:
    - Goal
    - Scope / non-goals
    - Dependencies
    - Files likely touched
    - Acceptance criteria
    - Verification commands

### Per-task prompt template: `docs/prompts/<slug>/task_<n>/TASK_<n>_<slug>.md`

Required sections/headings:

- **Task title**
- **Objective**
- **Context to read first** (exact files and/or MCP tools to run)
- **Constraints**
- **Steps** (implementation approach; no giant refactors)
- **Files to create/update** (explicit list)
- **Acceptance criteria** (bullet list, testable)
- **Verification** (commands to run; non-interactive)
- **Notes** (edge cases, rollback plan)

Artifact rules:

- Prefer **referencing** files and paths over embedding code in the prompt docs.
- Keep each task to a **small surface area** (guideline: $\le$ 5 files) unless explicitly justified.

---

## Optional Tasks (Milestone B)

Only do these after Milestone A is stable.

### Task B1 — Add repo write/patch tool (gated)

**Goal**: Enable controlled changes via unified diffs.

**Scope**:

- Add `repo_write_patch` tool that:
  - applies a unified diff
  - restricts changes to files under repo root
  - blocks binary files
  - optionally requires an explicit “allowWrite: true” flag

**Acceptance criteria**:

- Patch application is deterministic and logs touched files.
- Attempts to write outside repo are rejected.

---

### Task B2 — Add verification tools (build/typecheck/lint/tests)

**Goal**: Make “Definition of Done” enforceable by tools.

**Scope**:

- Add tools that call:
  - `npm run build`
  - `npm run typecheck` (add script if needed, but avoid code changes)
  - `npm run lint` (only if you add ESLint config; otherwise skip)
  - `npm test` / `npm run test` (only if a test runner exists; otherwise skip)

**Acceptance criteria**:

- Tools return exit codes + trimmed stdout/stderr.
- No interactive prompts.

---

## Notes / pitfalls

When you finish, provide:

- A short list of **new files and folders created**
- For each task: list **files touched**
- Any new scripts added and how to run them

Avoid pasting large code blocks in the response; keep code changes in actual files.

## Files to touch

- `.agents/` (contract + skills markdown)
- `docs/` (requests/plans/prompts/decisions workflow folders)
- `mcp/` (server skeleton + tools)

## Verification commands

```bash
npm run typecheck
npm run build
```
