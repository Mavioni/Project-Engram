# Engram — the replica + arena

## What "your Engram" means

Your **Engram** is your personal personality replica. It's built from your IRIS facet scores and evolves through three kinds of use:

1. **Daily check-ins** feed it XP.
2. **Re-running IRIS** updates its core stats.
3. **Arena battles** earn XP + permanent seals.

## Stats you can see

On the **Engram page** (`/engram`), three tabs:

- **Stats** — level, XP, 6 domain attributes, 9-archetype seal grid
- **Arena** — pick an archetype, fight a best-of-5 battle
- **History** — last 30 battles with win/loss

On the **Dashboard**, the Player Card shows your seals row and your archetype identity. The Engram teaser at the bottom of the Dashboard shows level + XP + seal count.

## XP math

- **Level** = `floor(sqrt(xp / 100)) + 1`
- Level 1: 0–99 XP
- Level 2: 100–399 XP
- Level 3: 400–899 XP
- Level 4: 900–1599 XP
- Level 5: 1600–2499 XP
- (and so on — each level costs `level * 100` XP to reach)

The numbers grow non-linearly on purpose. Early levels come fast; later levels reward sustained engagement.

## What earns XP

| Action | XP | Notes |
|---|---|---|
| First check-in of the day | **+10** | Only once per day — editing/re-saving the same day doesn't re-award. |
| Adding a note | **+25** | Per note. Adding a note to today's existing entry counts. |
| Completing IRIS for the first time | **+50** | |
| Re-running IRIS | **+25** | Half of the first-time reward. |
| Winning an arena battle | **+100** | Plus a permanent **seal** (claimed archetype). |
| Losing an arena battle | **+25** | You still learn from losing. |

The XP amounts live in **`src/features/engram/rewards.js`** as the `XP` constant. Tweaking balance is a one-file edit.

## Level-up celebration

When `awardXp` or `recordBattle` crosses a level boundary, the store sets `engram.pendingLevelUp` to the new level. The `LevelUpToast` component (mounted once in `App.jsx`) shows a celebration above the bottom nav, auto-dismisses after 6 seconds or on tap, and has a "View →" button that takes you to `/engram`.

## The arena

When you pick an opponent, **`runBattle()`** in `src/features/engram/combat.js` runs:

1. Seeds a pseudo-random number generator with the battle id
2. Picks 5 domains at random (with replacement)
3. For each round: computes your average score for that domain and the archetype's average score for that domain; the higher one wins the round; ties go to the user (the challenger)
4. Whoever wins more rounds wins the battle

The whole thing is **deterministic** — same battle id → same outcome. This matters for testing (replayable scenarios) and future replay-sharing.

The 9 archetypes' facet signatures are hardcoded in `ARCHETYPE_FACETS` in `combat.js`. They're the same values IRIS uses to classify your own type.

## Seals

When you win a battle against an archetype for the first time, you claim its **seal**. Seals are visible in three places:

- **Engram → Stats tab** — the 9-glyph grid
- **Dashboard → Player Card** — the seal strip near the bottom
- **Dashboard → Engram teaser** — the `N / 9` count

Seals are permanent. You can't un-seal by losing a later battle.

## The daily challenge

Every local day, `ensureDailyChallenge` seeds one challenge target:

1. Picks an archetype you **haven't** defeated yet (fallback to any archetype if you've sealed all 9)
2. Deterministically based on the day key — so all day long you see the same challenge, even across refreshes
3. Excludes your own archetype (you don't fight yourself)

The challenge is shown as a card on the Dashboard. When you win a battle against the matching archetype, `recordBattle` flips `dailyChallenge.completed = true` and the card shows a ✓ + "Sealed" state for the rest of the day.

Tomorrow, a new challenge seeds automatically.

## Extending the game

Natural places to go next, pre-sketched in `IDEAS.md`:

- **Engram evolution from journals** — shadow tag usage → +shadow facet over time
- **Engram vs. Engram battles** (real, multiplayer) — requires backend + matchmaking
- **Badges / achievements** — streaks, battles, rituals

Already shipped: the ambient backdrop now tints with your archetype's color once IRIS is complete (see `docs/theme.md` → Backdrop tint).

All of these sit behind new data-model changes; the game mechanics scale cleanly.
