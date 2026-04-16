# IRIS — how the assessment flows

## What IRIS is

**IRIS** (Integrative Resonance Identity Simulation) is the 24-facet personality assessment at the heart of the app. It's the source of your **Player Card**, your **Engram**'s starting stats, your **Chat** grounding, and everything downstream.

## The shape

- **24 facets** grouped into **6 domains** (Cognitive, Emotional, Volitional, Relational, Existential, Shadow)
- **16 crucible scenarios** — each scenario has 4 choices, each choice nudges several facet scores
- **9 archetypes** (Enneagram types 1–9) — after the 16 scenarios, your facet scores are compared to each archetype's signature, and the nearest match is your type
- **Wing** — the adjacent type with the second-highest resonance
- **Coliseum** — browsable gallery of all 9 archetypes with historical context + population stats

## The file

The whole assessment lives in **`src/features/iris/IRIS.jsx`** — a single ~500-line file that came from the user's own Claude artifact. It's treated as mostly-immutable: Claude only makes minimal surgical edits (add props, swap helper imports).

**Do not** break this file up, rewrite its internals, or "clean it up." It's working art.

## The four phases

The component has one `phase` state that walks through:

1. **`landing`** — the 3D IRIS visualization + "Begin" and "Coliseum" buttons
2. **`coliseum`** — browse all 9 archetypes (reachable from landing)
3. **`assess`** — the 16 scenarios, one at a time
4. **`results`** — final Player Card + facet breakdown + download

## The handoff to the rest of the app

When the assessment finishes, `calculateResults()` fires `onComplete()` — a prop passed in by **`IrisRoute.jsx`**.

`IrisRoute.jsx` wires `onComplete` to the store's `saveIrisResults` action AND awards XP:

- **+50 XP** for a first-ever assessment
- **+25 XP** for a re-run

This is how doing IRIS actually powers up your Engram replica.

`onExit` is the "Enter Engram →" button on the landing/results screens — it navigates to `/` (the Dashboard) so the user can see their new Player Card.

## The data shape after completion

The store's `iris` field becomes:

```js
{
  facetScores: {
    analytical: 0.74,
    pattern: 0.6,
    // ... 24 facet scores, all in [0, 1]
  },
  enneagramType: 5,   // integer 1-9
  enneagramScores: {
    1: 0.42,
    2: 0.38,
    // ... resonance with each of the 9 types, in [0, 1]
  },
  takenAt: '2026-04-20T19:01:22Z',
  history: [           // up to last 24 snapshots
    { facetScores, enneagramType, enneagramScores, takenAt }
  ]
}
```

## Who reads this data

- **`PlayerCard.jsx`** (on the Dashboard) — renders the live summary.
- **`Engram.jsx`** — uses it to compute domain attributes for the arena.
- **`combat.js`** — feeds `facetScores` into `runBattle()` to compare against archetype signatures.
- **`Chat.jsx`** — passes the whole `iris` object as context to Claude so responses are grounded in the user's profile.
- **`FacetRadar.jsx`** — renders the 6-axis radar chart from facet scores.
- **The Player Card HTML download** (`generatePlayerCard`) — produces a standalone NFT-style artifact.

## Archetype colors

The 9 types each have a canonical color. These live in **`src/data/enneagram.js`** as the `TYPES` lookup:

```js
TYPES[5].color // '#74c0fc' — investigator blue
TYPES[8].color // '#ff6b6b' — challenger red
```

Same colors are used in the Coliseum, the Player Card, the Engram arena, and the type-themed accents across the app.

## Extending IRIS

The user's artifact is stable, but if they ever want to:

- **Add a new facet** — edit `FACETS` in IRIS.jsx and adjust the archetype signatures in both IRIS.jsx and `combat.js`.
- **Add a new scenario** — append to `SCENARIOS` in IRIS.jsx. The choices' `scores` object is what maps scenario answers to facets.
- **Change archetype colors/names** — edit `TYPES` in `src/data/enneagram.js` and `ENNEAGRAM_PROFILES` in IRIS.jsx. **Both must stay in sync**; otherwise the Coliseum and PlayerCard will disagree.

These are medium-scope changes. Ask Claude to do them; don't attempt by hand.
