# Triage: UI/Domain Separation Architecture Refactor

## Change Request Reference

- `docs/requests/CR_ui_domain_separation_architecture_refactor.md`

## Classification

- **Size**: large (expected 8–12 tasks)
- **Type**: architectural refactor
- **Risk**: high (cross-cutting changes across stores, UI panels, generator integration, persistence)

## Affected Areas

- **State**: `src/state/systemStore.ts`, `src/state/windowStore.ts`
- **UI**: generator + editor panels + R3F scene objects (multiple files under `src/components/` and `src/ui/`)
- **Infra**: localStorage persistence (`src/utils/persistence.ts`) and procedural generator bridge (`src/utils/generatorBridge.ts`)
- **Types**: central model types (`src/types.ts`) and generator config types (`src/types/generationConfig.ts`)

## Key Coupling / Risk Drivers (Observed)

- `systemStore` triggers persistence from inside mutations (`get().save()`), making domain logic hard to test and hard to swap persistence.
- Generator UI bypasses the store API (`useSystemStore.setState(...)`), which makes it hard to enforce invariants and effects policy.
- UI state (selection/camera/nesting/isolation) is stored alongside universe data and mutated as side effects (selection clearing).
- `src/infra/` exists but is empty; adapters/ports need to be introduced without a breaking “big bang”.

## Blockers / Open Questions

- Should the first domain extraction keep using `src/types.ts` directly (pragmatic) or introduce separate domain DTOs immediately (cleaner but more disruptive)?
- Do we want a minimal “protocol version” field for future MCP tooling now, or later once the command surface is stable?
- Should `windowStore` workspace persistence be part of this refactor, or handled as a follow-up (recommended: include only if cheap)?

## Recommendation

Proceed with an **incremental migration**:

- Establish ports/adapters and a small domain command surface first.
- Replace the generator panel’s imperative state replacement early (high leverage seam).
- Split UI-only state into a dedicated `uiStore`.
- Migrate universe mutations to the domain reducer in chunks (stars → groups → fields/disks/nebulae).

## Next Steps

- Produce an ordered plan (`docs/plans/PLAN_ui_domain_separation_architecture_refactor.md`) and per-task prompts under `docs/prompts/ui_domain_separation_architecture_refactor/`.

