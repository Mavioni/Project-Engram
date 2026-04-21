---
name: code-change-verification
description: Verify code, config, scripts, and build changes with targeted checks.
---

# Code Change Verification

## Mandatory trigger
Use this skill after any code, config, script, dependency, workflow, or build-related change.

## Contract
- Verify the exact changed surface first.
- Prefer targeted checks, then full checks when risk is broad.
- Inspect the diff for unrelated churn before handoff.
- Report failures with the root cause and next fix.

## Workflow
1. List changed files and expected behavior.
2. Run the smallest relevant check.
3. Run broader checks if the change crosses feature or build boundaries.
4. Inspect the diff for secrets, dependency churn, and unrelated edits.
5. Record residual risk if any required check cannot run.

## Default checks
- `npm run lint`
- `npm run docs:check`
- `npm run test:ci`
- `npm run build`

## Output
- Changed surface
- Checks run
- Result
- Residual risk
