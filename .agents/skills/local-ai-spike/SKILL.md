---
name: local-ai-spike
description: Evaluate local AI, RAG, embeddings, runtime constraints, and provider seams.
---

# Local AI Spike

## Mandatory trigger
Use this skill for local model support, AI provider abstraction, RAG, embeddings, prompt/runtime constraints, Ollama, browser/server inference, or cost/latency tradeoffs.

## Contract
- Do not wire a full local model integration first.
- Start with seams, contracts, and one measured spike.
- Keep the product usable without cloud AI.
- Do not add provider dependencies without measured justification.

## Workflow
1. State the hypothesis.
2. Identify the provider interface or runtime seam.
3. Pick one test case and one metric.
4. Run or design the smallest spike.
5. Decide: adopt, defer, or reject.

## Output
- Hypothesis
- Seam
- Test case
- Metric
- Result or expected result
- Decision
