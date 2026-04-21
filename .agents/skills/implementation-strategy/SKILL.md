---
name: implementation-strategy
description: Plan ambiguous or multi-step implementation work before editing.
---

# Implementation Strategy

## Mandatory trigger
Use this skill when a request involves multiple files, unclear sequencing, architecture decisions, or a change that could expand beyond one obvious edit.

## Contract
- Output the smallest viable implementation path.
- Keep the plan decision-complete enough to execute.
- Avoid broad research unless it changes the implementation.
- Do not edit files while using this skill.

## Workflow
1. State the goal in one sentence.
2. Identify the minimum files or systems involved.
3. Break work into 3-5 ordered steps.
4. Attach a verification method to each step.
5. Name rollback or stop conditions when relevant.

## Output
- Goal
- Steps
- Verification
- Risks
- Assumptions
