# Rituals — curated short practices

## What this feature is

The Rituals library is a small, curated collection of **13 short practices** grounded in real wellness traditions. Each one is intentionally brief (30 seconds to 10 minutes), designed for someone with no previous experience, and built to be used on a phone in any quiet-ish moment.

The whole feature is offline-first. No audio files ship in the bundle, no network calls, no copyright on anything.

## The 13 practices

| Kind | Ritual | Duration | Tradition |
|---|---|---|---|
| Breath | Four · Seven · Eight | 2 min | Pranayama (Andrew Weil) |
| Breath | Box Breath | 3 min | Navy SEAL / trauma therapy |
| Meditation | Simple Sitting | 5 min | Zazen |
| Meditation | Breath Awareness | 10 min | MBSR / Vipassana roots |
| Meditation | Sky Mind | 8 min | Dzogchen visualization |
| Grounding | Five · Four · Three · Two · One | 4 min | CBT grounding |
| Arrival | Arrival | 1 min | — (original, short-form) |
| Body | Body Scan | 7 min | Jon Kabat-Zinn MBSR |
| Gratitude | Three Gratitudes | 3 min | Positive psychology (Seligman) |
| Shadow | Shadow Check-in | 4 min | Jungian shadow work |
| Intention | Intention for the Day | 2 min | ACT / modern coaching |
| Compassion | Loving-Kindness | 5 min | Theravada metta bhavana |
| Review | Evening Review | 3 min | Jesuit examen / CBT thought review |

## How a ritual runs

The `RitualPlayer` walks through a ritual's `steps` array. A step is one of three shapes:

- **Breath step** — `{ breathe: [{ phase: 'in', seconds: 4 }, ...], text }` — plays each phase in sequence, scales the sacred-geometry sigil on screen to match.
- **Timed prompt** — `{ text, duration: 60 }` — shows text for N seconds then auto-advances.
- **Tap prompt** — `{ text, tapAdvance: true }` — waits for the user to confirm. Used for reflection questions where the user may want to dwell.

At the end, the player calls `completeRitual({ id, durationSeconds })` on the store.

## XP reward

Completing a ritual awards:
- **+15 base XP**
- **+1 XP per 30 seconds of practice**, capped at **+25**

So a 30-second arrival practice gives 16 XP; a 10-minute meditation gives 40. The cap keeps long meditations from dominating the economy while still rewarding depth.

## Ambient music

See [`audio.md`](./audio.md). In short: the RitualPlayer generates a soft Web Audio pad in real time during practices marked `ambient: true`. The user can mute per-session or default-off it in Settings.

## The suggestion engine

`suggestRitual({ dayKey, recentMood })` picks one ritual per day, shown on the Dashboard:

- **Low recent mood** (< 0.35) → steers toward grounding, breath, body, or compassion
- **High recent mood** (> 0.65) → steers toward gratitude, intention, compassion, or review
- **Middle** → arrival, breath, grounding, review
- **No mood yet** → arrival / breath (shortest, safest entry)

It's deterministic per local date — all day long, you see the same suggestion.

## Adding a new ritual

1. Append to the `RITUALS` array in `src/data/rituals.js`.
2. Fields: `id` (URL slug), `name`, `kind` (must exist in `KINDS`), `duration` (minutes for the list badge), `blurb` (one-sentence preview), `why` (one paragraph of context), `emoji` (Twemoji codepoint), `ambient` (boolean, whether to play music), `steps` (array as above).
3. Tests in `src/lib/rituals-store.test.js` pick up any new ritual via the `RITUALS` export — add a specific test if the new ritual has unusual mechanics.

## Adding a new kind

Append to the `KINDS` object in `src/data/rituals.js` with `id`, `label`, `color` (hex), `emoji`. The filter chip row on `/rituals` picks it up automatically.
