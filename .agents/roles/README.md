# Agent Roles (`.agents/roles/`)

Agent roles are “personas” with a well-defined responsibility boundary. They all follow the global contract in `.agents/agents.md`.

## Available Roles

- **Curator of Order**: `curator_of_order.md` — repository librarian/refactoring scalpel; keeps docs/agents/decisions organized and entropy low.
- **Developer**: `developer.md` — implements **small, direct** code changes (no PO task decomposition).
- **Product Owner**: `product_owner.md` — generates CR/PLAN/TASK prompts (planning-only; no implementation/verification).
- **Task Developer**: `task_developer.md` — executes approved task prompts under `docs/prompts/<slug>/task_<n>/...`.
- **Task Curator of Order**: `task_curator_of_order.md` — executes approved curator-oriented task prompts under `docs/prompts/<slug>/task_<n>/...`.

