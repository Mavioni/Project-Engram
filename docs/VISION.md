# Engram — Vision

> **Status:** canonical
> **Last updated:** 2026-04-21
> **Operator:** Mavioni (Massimo Panella)

This document is the load-bearing statement of what Engram is.
Any PR that materially changes product surface must either affirm
alignment with this document or open an ADR proposing a revision.

---

## One-sentence thesis

Engram turns a personality assessment into a **game you can
actually play** — your IRIS results become a **Player Card** and
an **Engram replica** that levels up through daily check-ins,
rituals, and arena battles against the nine archetypes.

## Three pillars

### 1. IRIS — the 24-facet simulation

A 16-scenario, 24-facet, Enneagram-aware personality assessment
that produces a **Player Card**: archetype + wing + resonance +
vector code + domain stats (Cognitive, Emotional, Volitional,
Relational, Existential, Shadow). The Player Card is the user's
identity inside the app — not a chart, a **character**.

### 2. Daily check-ins — the feedback loop

A single scrollable **Dashboard** shows the Player Card plus
today's check-in, recent entries, mood trend, and a 2-week
calendar heatmap. Check-in is lightweight and emoji-driven —
mood + activities + optional note — so the ritual survives
life's bad days.

### 3. The Engram replica + arena — growth as play

The **Engram** is a personality replica derived from the user's
IRIS facet scores. It lives at `/engram` and has three tabs:

- **Stats** — live XP bar, 6 domain attributes, 9-archetype seal grid
- **Arena** — deterministic best-of-5 battles against each archetype. Each round picks a random domain via a seeded PRNG and compares the user's domain average against the archetype's signature
- **History** — permanent battle log, last 30

Wins earn 100 XP + a **seal**; losses still earn 25 XP. Level
is `floor(sqrt(xp / 100)) + 1`. The loop is designed to reward
engagement without forcing it.

## Supporting surfaces

- **Chat** (`/chat`) — grounded chat with your IRIS, Claude-powered when configured; local-only fallback otherwise.
- **Rituals** (`/rituals`) — 13 curated practices (pranayama, box breath, zazen, etc.) with guided playback + ambient audio. Turns the app from tracker to tool.
- **Journal** (`/journal`) + **Calendar** (`/calendar`) + **Insights** (`/insights`) — secondary reflection surfaces, reached via in-page links.
- **Self Mirror** (`/insights/self-mirror`) — encrypted local-first reflection instrument. Per-session passphrase unlock, AES-GCM 256 + PBKDF2 600k, three retention windows, LLR drift analysis. See [ADR-0001](decisions/2026-04-17-self-mirror-architecture.md).

## Information architecture

**Three primary tabs** (bottom nav) — every non-essential surface is an in-page link:

| Tab | Route | Role |
|---|---|---|
| Dashboard | `/` | Player Card hero + today + recent + trend + calendar |
| Chat | `/chat` | Talk to your IRIS |
| Engram | `/engram` | Stats + Arena + History |

Top bar: logo → Dashboard, gear → Settings. Hidden on `/iris`.
Both themes intentional (light is default).

## What Engram is not

- Not a social network. No sharing, no followers, no feed.
- Not an LLM wearing a user's face. Chat reflects, challenges, queries — never impersonates (ISO doctrine).
- Not a habit-tracker with a gym-bro loop. The gamification exists to make reflection sticky, not to enforce compliance.
- Not a replacement for therapy, medical advice, or a clinician. A reflection tool, tested against itself.

## Architectural invariants

These do not move without an ADR:

1. **Offline-graceful.** Supabase / Claude / Stripe are all optional. The app must run on a cold-boot device with no network.
2. **Canonical state in Zustand.** Ephemeral UI state only in components.
3. **Zustand 5 selector discipline.** Selectors that allocate new references must be called inside `useMemo`, not `useStore` (sync-renders).
4. **Self-mirror encrypts before persisting.** Plaintext never leaves the unlocked session (ADR-0001).
5. **Self-mirror redaction rules never live in source.** Machinery only; tokens populate via the in-app panel.
6. **Engram replica never impersonates.** Chat speaks *to* the user, not *as* them.
7. **Theme-token discipline.** No hardcoded backgrounds/text. Use `var(--bg)`, `var(--ink)`, etc. Brand colours may stay as hex.
8. **Deterministic combat.** The arena PRNG is seeded; battles are reproducible from a `(seed, archetype)` pair.
9. **Auto-docs stay fresh.** README auto-sections + CHANGELOG regenerate on every build; CI fails on drift.

## Cross-references

- [`README.md`](../README.md) — setup + deploy + routes + features
- [`CLAUDE.md`](../CLAUDE.md) — session conventions
- [`DEV_GUIDE.md`](../DEV_GUIDE.md) — operator-facing playbook
- [`IDEAS.md`](../IDEAS.md) — Now / Next / Later / Wild scratchpad
- [`docs/decisions/2026-04-17-self-mirror-architecture.md`](decisions/2026-04-17-self-mirror-architecture.md) — ADR-0001
