# The store — how the app remembers things

The app has one central "memory." It's called **the store**, and it lives in `src/lib/store.js`.

## What's in the store

Every piece of app-wide state. Not local things like "is this button currently hovered" — app-wide things like:

- **Your theme** (light or dark)
- **Your profile** (display name)
- **Your IRIS results** (facet scores, type, history of past assessments)
- **Your Engram** (XP, level, defeated archetypes, battle history, pending level-up, today's challenge)
- **Your entries** (every daily check-in)
- **Your chat threads** (conversations with your IRIS)
- **Your insights** (Claude-written observations)
- **Your subscription** (free or pro)

## How it persists

The store saves itself to `localStorage` (a browser feature) under the key **`engram.v1`**. If you close the tab and come back, everything's still there.

If you want to prove this to yourself: open DevTools → Application → Local Storage → find `engram.v1`. That blob of JSON is your whole app state.

## How components read from it

Components use a hook called `useStore`. Example:

```js
const iris = useStore((s) => s.iris);
```

That line says: "give me the `iris` slice of the store, and re-render me whenever it changes."

## Actions

The store has **actions** — functions that change state. Only actions can change state. A component calls an action; the store runs the action; the new state is broadcast to every subscribed component.

Key actions (you'll see these names in Claude's commit messages sometimes):

| Action | What it does |
|---|---|
| `setTheme('light'\|'dark')` | Flip the theme. |
| `setName(string)` | Set your display name. |
| `saveIrisResults({ ... })` | Save an IRIS assessment result. Also appends to the `history` array (keeps last 24). |
| `clearIris()` | Wipe your IRIS results. |
| `upsertEntry({ mood, activities, note })` | Create today's check-in or merge into an existing one. |
| `addNote(entryId, note)` | Attach a note to an existing entry. |
| `awardXp(amount)` | Add XP to your Engram. Auto-computes level. Flags a level-up if crossed. |
| `recordBattle(result)` | Log a battle, award XP, add seal if won, complete daily challenge if matched. |
| `acknowledgeLevelUp()` | Clear the level-up celebration flag (called after the toast dismisses). |
| `ensureDailyChallenge()` | Seed today's arena challenge if none exists. |
| `hardReset()` | Wipe everything except your theme preference. |

## The infinite re-render rule (for Claude)

Zustand 5 uses strict reference equality (`Object.is`). If a selector returns a new reference every call, React re-renders forever.

- **Safe**: `useStore((s) => s.entries)` — returns the same array reference until `entries` changes.
- **Safe**: `useStore((s) => s.profile.name)` — returns a string, a primitive.
- **Dangerous**: `useStore((s) => s.entries.map(f))` — allocates a new array every call.
- **Dangerous**: `useStore((s) => selectEntriesByDay(s))` — if the selector makes a `new Map()`, every call is a new reference.

For the dangerous patterns, we use `useMemo`:

```js
const entries = useStore((s) => s.entries);
const byDay = useMemo(() => selectEntriesByDay({ entries }), [entries]);
```

We subscribe to the *stable* raw entries and derive the Map locally, only when entries change. This matters enough that it has tests (`src/test/render-smoke.test.jsx`) that would catch a regression.

## Schema versioning

The store has a version number (`SCHEMA_VERSION = 1`). If we ever change the shape of stored data in a breaking way, we bump that number and add a `migrate()` step that converts old-shape state into the new shape. Users don't lose data when we upgrade.
