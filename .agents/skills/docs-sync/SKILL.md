---
name: docs-sync
description: Keep docs aligned with routes, commands, behavior, env vars, and architecture.
---

# Docs Sync

## Mandatory trigger
Use this skill when routes, scripts, dependencies, env vars, public behavior, setup instructions, architecture, or workflow conventions change.

## Contract
- Update only docs that are actually affected.
- Preserve generated sections unless the repo script regenerates them.
- Prefer concise operational wording over narrative expansion.
- Remove stale claims instead of adding caveats around them.

## Workflow
1. Identify what changed for a reader or operator.
2. Locate the smallest affected docs set.
3. Patch the docs and examples.
4. Run `npm run docs:check` when generated sections may be touched.
5. State what remains intentionally undocumented.

## Output
- Docs changed
- Behavior covered
- Stale content removed
- Verification
