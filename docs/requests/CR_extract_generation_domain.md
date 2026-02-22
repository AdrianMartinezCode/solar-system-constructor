# Change Request: Extract Generation Logic into Domain Layer

## Summary

The procedural universe generation logic (config types, config mapping, topology grammars, the L-system procedural generator, stats computation, and orchestration) currently lives scattered across `src/utils/` and `src/types/`. This change extracts all generation concerns into `src/domain/generation/`, following the same architectural pattern already established by `src/domain/universe/` (pure functions, no browser/React/Zustand/Three.js imports, JSON-serializable types). This enables the generation pipeline to be consumed headlessly by an MCP server or any non-UI context.

## Context

The project already completed a UI/domain separation refactor (`PLAN_ui_domain_separation_architecture_refactor`) that introduced `src/domain/universe/` with a pure command-reducer architecture for universe state mutations. However, the **generation** side was left in `src/utils/`:

| Current location | Content | Problem |
|---|---|---|
| `src/types/generationConfig.ts` | `GenerationConfig`, `GeneratedUniverse` | Not in domain; re-imports from `../types` |
| `src/utils/generatorConfigDefaults.ts` | `defaultConfig`, `getPresetConfig`, `generateRandomSeed` | Pure domain logic misplaced in utils |
| `src/utils/generatorBridge.ts` | Config mapping (UI→internal), stats computation, `generateUniverse` orchestrator (~1380 lines) | Pure domain logic, no browser deps, lives in utils |
| `src/utils/procedural-generator.ts` | L-system grammar generation engine (~3700 lines) | Pure domain logic, no browser deps, lives in utils |
| `src/utils/topology/` | Topology grammar presets & generators | Pure domain logic, no browser deps, lives in utils |

None of these files import React, Three.js, Zustand, or browser globals — they are **already pure** and just need to be relocated and re-organized under the domain layer.

## Goals

- All generation logic lives under `src/domain/generation/` and is importable without any UI/framework dependency.
- The `src/domain/generation/` barrel export provides a clean public API: `generateUniverse(config)`, `GenerationConfig`, `GeneratedUniverse`, `defaultConfig`, `getPresetConfig`, etc.
- The existing `src/domain/index.ts` re-exports generation types so all domain consumers have a single entry point.
- UI components import from `src/domain/` (or its barrel) instead of `src/utils/`.
- An MCP server or CLI tool can import `src/domain/generation` and run generation without pulling in React/Three/Zustand.
- No behavioral changes — the generation output remains identical.

## Non-goals

- Refactoring the internal structure of `procedural-generator.ts` (splitting its 3700 lines into smaller modules). That is a separate follow-up.
- Changing the `GeneratorConfig` interface or the L-system grammar behavior.
- Adding unit tests for the generation pipeline (recommended follow-up CR).
- Modifying the universe command/reducer domain (`src/domain/universe/`).

## Constraints

- The generation output must remain **byte-identical** for the same seed + config. No behavioral changes.
- Follow the existing domain convention: no imports from React, `@react-three/fiber`, `three`, Zustand, or browser globals in `src/domain/**`.
- Keep each task ≤ 5 files changed and one concern per task.
- The app must build successfully (`npm run build`) after each task.
- Preserve backward-compatible re-exports from old locations during migration (old import paths should still work until the final cleanup task).

## Out of Scope

- Internal refactoring of the 3700-line procedural generator into smaller modules.
- Adding Vitest/Jest tests for generation.
- Creating an MCP server adapter for generation (that consumes the new domain API).
- Changes to the universe command/reducer domain.
- Performance optimization of the generator.

## Acceptance Criteria

- [ ] All generation-related types, functions, and modules live under `src/domain/generation/`.
- [ ] `src/domain/generation/index.ts` exports: `generateUniverse`, `GenerationConfig`, `GeneratedUniverse`, `defaultConfig`, `getPresetConfig`, `generateRandomSeed`, `getSmallBodyDetailLabel`, and topology types.
- [ ] No file under `src/domain/generation/**` imports from React, Three.js, Zustand, or browser globals.
- [ ] `UniverseGeneratorPanel.tsx` and other UI consumers import generation functions from `src/domain/` (not `src/utils/`).
- [ ] `npm run build` passes without errors.
- [ ] Generation output is functionally identical (same seed → same result).

## Verification

```bash
npm run typecheck
npm run build
```
