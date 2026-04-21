# AGENTS.md - Project Engram

This file is the Codex-native operating contract for this repository. `CLAUDE.md` remains useful background, but this file is authoritative for Codex sessions.

## Default posture

- Preserve the local-first product direction: browser state first, optional cloud features second.
- Keep diffs narrow, reversible, and reviewable.
- Read with search first; open only the files needed for the current change.
- Do not add dependencies, frameworks, or orchestration unless the repo proves the need.
- Prefer existing scripts: `npm run lint`, `npm run docs:check`, `npm run test:ci`, `npm run build`.
- Do not hard-couple new product logic to one hosted AI provider.
- Treat generated README sections as generated; update through the repo scripts when code changes affect them.

## Mandatory skills

Use these repo-local skills when their trigger matches:

- `.agents/skills/implementation-strategy/` before ambiguous or multi-step implementation work.
- `.agents/skills/code-change-verification/` after any code, config, script, or build change.
- `.agents/skills/docs-sync/` when behavior, commands, routes, env vars, or examples change.
- `.agents/skills/product-roadmap/` for roadmap, sequencing, or product-priority decisions.
- `.agents/skills/revenue-wedge/` for monetization, offer design, pricing, or GTM questions.
- `.agents/skills/local-ai-spike/` for local model, RAG, embedding, runtime, or provider-abstraction work.

## Subagent policy

- Use subagents only for bounded, isolated deliverables that can run in parallel.
- Do not spawn agents for theater, status summaries, or work that is easier to do directly.
- Give each subagent a file target or a concrete report target.
- Integrate subagent output; do not paste unreviewed work into the repo.

## Done means

- The intended behavior or document exists.
- The diff has no unrelated churn.
- Verification ran, or the handoff states exactly why it could not run.
- Residual risk is named plainly.
