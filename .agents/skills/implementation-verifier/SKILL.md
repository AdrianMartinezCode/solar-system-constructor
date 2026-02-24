---
name: implementation-verifier
description: Validate that implementation matches specs, design, and tasks. Produce verify-report.md with categorized issues and verdict.
metadata:
  owner: Sentinel
  version: "0.1.0"
---
# Implementation Verifier

## Purpose

Verify that code changes satisfy the approved specifications, design decisions, and task checklists. Produce a structured verification report that gates archival. This skill is read-only — it reports issues but does not fix them.

## When to Use This Skill

- When acting as the Sentinel sub-agent for the Verify phase.
- When `/flow:verify` is invoked for a named change.
- When you need to validate implementation quality against SDD artifacts before archival.

## Inputs

- Change name (kebab-case)
- `openspec/changes/<change-name>/proposal.md`
- `openspec/changes/<change-name>/specs/` (all delta and domain specs)
- `openspec/changes/<change-name>/design.md`
- `openspec/changes/<change-name>/tasks.md` (with completion status)
- Actual code changes (read modified files or use git diff)
- `openspec/config.yaml` (for rules.verify and build/typecheck commands)

## Outputs

- `openspec/changes/<change-name>/verify-report.md` — structured report with verdict, issue categories, and findings

## Algorithm / Steps

1. **Load config**: Read `openspec/config.yaml` for `rules.verify`, `build_command`, `typecheck_command`, and project layout.
2. **Read all artifacts**:
   - proposal.md (intent, scope, success criteria)
   - specs/ (requirements, scenarios, acceptance criteria)
   - design.md (decisions, rationale, file paths)
   - tasks.md (task list with `[x]` completion markers)
3. **Identify code changes**: Use git diff or file reads to determine what was modified.
4. **Run verification commands**:
   - Execute `npm run build` (from config or default)
   - Execute `npm run typecheck` if available
   - Execute `npm test` if available
   - Capture pass/fail and any error output
5. **Check completeness**:
   - Are all tasks in tasks.md marked `[x]`?
   - List any uncompleted tasks
6. **Check correctness**:
   - For each requirement in specs, verify implementation satisfies it
   - For each Given/When/Then scenario, verify it is implemented (or testable)
   - Note any mismatches
7. **Check coherence**:
   - For each design decision, verify implementation follows it
   - Note any deviations (wrong file paths, different patterns, skipped rationale)
8. **Check testing** (if tests exist):
   - Are spec scenarios covered by tests?
   - Note gaps
9. **Categorize issues**:
   - **CRITICAL**: Blocks archival. Implementation does not meet spec, design violated in a blocking way, or build/typecheck fails.
   - **WARNING**: Should fix. Non-blocking deviations, missing edge cases, or incomplete task coverage.
   - **SUGGESTION**: Nice to have. Style, documentation, or minor improvements.
10. **Determine verdict**:
    - **FAIL**: Any CRITICAL issue or build/typecheck failure
    - **PASS_WITH_WARNINGS**: No CRITICAL, but WARNING(s) present
    - **PASS**: No CRITICAL, no WARNING (SUGGESTIONs allowed)
11. **Write verify-report.md** using the structure below.
12. **Do NOT fix any issues** — only report.

## Task Sizing Rules

- Verification is a single-phase activity — one report per change.
- Report should be concise but complete: typically 1–3 pages.
- If the change folder is missing required artifacts, report BLOCKED and do not produce a verdict.

## Example Output Headings

### verify-report.md structure

```markdown
# Verify Report: <change-name>

**Verdict**: PASS | PASS_WITH_WARNINGS | FAIL
**Date**: YYYY-MM-DD

## Summary

- Build: pass | fail
- Typecheck: pass | fail | N/A
- Tests: pass | fail | N/A
- Tasks complete: Y/N (<n>/<total>)

## Completeness

- [ ] All tasks marked done
- Uncompleted tasks: (list or "None")

## Correctness

- Requirements coverage: (per-requirement or summary)
- Scenario coverage: (per-scenario or summary)
- Mismatches: (list or "None")

## Coherence

- Design decisions followed: (per-decision or summary)
- Deviations: (list or "None")

## CRITICAL Issues

(Block archival. List each with file/line or artifact reference.)

## WARNING Issues

(Should fix. List each.)

## SUGGESTION Issues

(Nice to have. List each.)

## Verification Commands Output

(Relevant excerpts from build/typecheck/test runs.)
```
