# Agent Architecture Decision

## Decision

Do not add LangGraphJS now. Project Engram should remain Codex-native: `AGENTS.md`, narrow repo skills, targeted file reads, small diffs, tests, lint, build, and explicit subagents only for bounded parallel work.

## Why

Engram is a single static PWA with optional Supabase edge functions. It does not currently need durable graph state, server-side agent routing, resumable workflows, or planner/executor orchestration.

LangGraphJS would add:

- A new dependency and mental model.
- Runtime boundaries the product does not need yet.
- More docs and maintenance surface.
- A risk of building orchestration instead of product value.

Codex-native workflow already covers the current work:

- Search before reading.
- Read only relevant files.
- Patch small surfaces.
- Run repo scripts.
- Use subagents only for isolated docs, audit, strategy, or verification reports.
- Keep decisions in repo docs instead of agent runtime state.

## Current operating model

1. `AGENTS.md` defines the repo contract.
2. `.agents/skills/*` define mandatory low-token workflows.
3. Codex supervises implementation and verification.
4. Subagents are optional and bounded, not a standing swarm.
5. CI remains the final external verification when local commands cannot run.

## Reconsider LangGraphJS only if

- Engram gains a real backend worker that runs multi-step AI workflows.
- Workflows need checkpoints, retries, branching, and human approval gates.
- Multiple providers or tools require dynamic routing at runtime.
- Product features depend on long-running agent state across sessions.
- The cost of custom scripts exceeds the cost of a graph runtime.

## Boundary if adopted later

If LangGraphJS becomes justified, keep it isolated from the PWA:

- Put it in a backend or worker package, not the React app.
- Keep provider contracts independent of LangGraphJS types.
- Make the graph optional and replaceable.
- Do not store product data inside graph state.
- Document exact workflows that require it.

## Conclusion

Codex-native orchestration is the correct architecture today. LangGraphJS is a future option, not a present dependency.
