# CLAUDE.md — conventions for any Claude session

> **You are reading this because you're Claude Code, working on Project Engram.**
> The user (Mavioni) is a creative genius with limited coding experience.
> They brief you in product language; you translate to code. Read this
> file first thing in any new session — it compounds every session's work.

## Session-start protocol — do this before responding to the first message

**The first time the user speaks in a session — regardless of what they say — you orient yourself before answering.** They may say "hi", "continue", "status", or a full brief. In all four cases, you take the same first step.

1. **Run `npm run status`** (or `node scripts/status.mjs` if npm's not ready) and read the output. It shows branch cleanliness, the live URL, test count, last 5 commits, and the Now / Next / Just shipped sections of `IDEAS.md`.
2. **Read these four files in parallel if you haven't already this session:**
   - `CLAUDE.md` (you're in it)
   - `DEV_GUIDE.md`
   - `IDEAS.md`
   - `CHANGELOG.md` (top 30 lines is plenty)
3. **Open your reply with a 2–4 line situational summary.** What shipped most recently, what's green vs. what needs attention, what's parked. Keep it tight. End with one clear prompt: "Ready when you are" or "Here's what I'd pick next — want me to run with it?"
4. **If the user already gave you a specific brief** (e.g. "add X" or "fix Y"), do the orient-and-summarize step in *one* paragraph and immediately begin the work in the next message. Don't block on confirmation when they've already told you what to do.
5. **If the repo is dirty** (uncommitted changes), surface that in the summary with the affected paths. Don't assume those changes are intentional — ask.
6. **If CI is failing** (last commit on main shows a red workflow, or you can reproduce a failure locally), surface that first and propose a fix before anything else.

The goal: the user types "continue" or "hi" or nothing at all, and your first message is a clean status brief + a concrete proposed next step. They nod, you ship.

---

## Who the user is and how to talk to them

- **Creative lead, not a coder.** They know what they want the app to *feel* like; they don't always know what it's called. Translate generously.
- **They ask in product language.** "Make the home screen less overwhelming." Your job is to turn that into concrete UI changes + code edits, explain what you're about to do in one sentence, and go.
- **They are learning through you.** When you make a non-obvious choice, add a short comment in the code explaining *why*. Comments teach.
- **Short is kind.** Write tight summaries (≤ 100 words unless detail is essential). Prose, not walls of bullets.
- **Show, don't demo.** Sprinkle tiny code snippets in replies only when a concept needs anchoring. Otherwise: file path + one-line description is enough.
- **Never lecture.** If you're about to explain something they didn't ask about, you're wrong. Exception: the *one line* of context they'd need to approve what you're about to do.

## How to work on this repo

### Before you touch code
1. **Read `DEV_GUIDE.md`** if you haven't in this session — it has the current product vocabulary.
2. **Read `IDEAS.md`** if the user references a "we were going to…" item. That file is truth.
3. **Check `docs/architecture.md`** if you're unsure how a subsystem connects.

### The build loop
Every non-trivial change follows this loop:

```
plan  →  write  →  npm run lint    (zero warnings tolerated)
                   npm run test:ci (all must pass)
                   npm run build   (must be clean)
                   curl preview    (routes stay 200)
       →  docs:update (auto via prebuild)
       →  commit     (detailed message)
       →  push       (main only; triggers GitHub Pages deploy)
```

If any step fails, fix the root cause — never `--no-verify`, never skip lint, never delete a failing test without understanding why.

### What you can change freely
- Anything under `src/components/`, `src/features/`, `src/styles/`, `src/lib/` — these are the product surface.
- Tests under `src/**/*.test.js[x]` and `src/test/`.
- `scripts/update-docs.mjs` and the README auto-sections.

### What to ask before touching
- **`src/features/iris/IRIS.jsx`** — this is the user's own Claude-artifact source. Minimal edits only (add props, swap helper imports). Never rewrite its internals.
- **`.github/workflows/*.yml`** — deploy pipeline. Works. Don't churn versions unless genuinely broken.
- **`public/icon.svg`** — brand. Icon PNGs regenerate from it on every build.
- **`supabase/migrations/0001_init.sql`** — if you change shape, migrations break. Add a new migration file instead.

### What never to change without explicit approval
- `LICENSE`
- `package.json` `"name"`, `"version"`, `"license"` fields
- Any file marked `// [canonical]` in a header comment

## House style

### Naming
- **Product terms in user-facing copy**: Dashboard, Chat, Engram, IRIS, Player Card, Coliseum, Arena, Seal, Level, XP, Replica. These are trademarked-in-spirit — don't invent alternatives in UI text.
- **kebab-case routes**: `/account/2fa`, not `/account-2fa` or `/accountTwoFactor`.
- **camelCase JS identifiers**. React components are PascalCase. File names mirror their export (`Engram.jsx` exports `Engram`).
- **Avoid abbreviations** in identifier names. `enneagramType`, not `enneaType`. `facetScores`, not `facets`.

### Components
- Inline styles with `var(--...)` theme tokens — not styled-components, not Tailwind, not CSS modules. One less layer to learn.
- One component per file. Sub-components inside the file are fine and preferred over new files for tiny helpers.
- Always destructure props in the signature: `function Foo({ a, b })`, not `function Foo(props)`.
- `memo` / `useMemo` / `useCallback` only when needed. Don't preemptively optimize.

### State
- **Canonical state lives in Zustand** (`src/lib/store.js`). Local component state only for ephemeral UI.
- Selectors that allocate new references (`.map`, `new Map`, `[...x]`) **must** be called inside `useMemo`, not `useStore`. Zustand 5's `Object.is` default causes infinite re-renders otherwise.
- Actions that mutate the store should be pure transformations of state — no side effects.

### Tests
- Every new store action gets a test.
- Every new pure function in `src/lib/` or `src/features/*/*.js` gets a test.
- UI components get a render-smoke test in `src/test/render-smoke.test.jsx` — just "it mounts without looping or throwing."
- Use `screen.getByText(/regex/i)` for copy assertions. Case-insensitive regex survives CSS `text-transform`.

### Theme awareness
- **Never hardcode background/text colors.** Use `var(--bg)`, `var(--bg-raised)`, `var(--ink)`, `var(--ink-soft)`, `var(--ink-dim)`, `var(--ink-faint)`, `var(--border)`, `var(--border-strong)`.
- Brand colors (mood colors, archetype colors, domain colors) can stay as hex — they're saturated enough to read on both themes.
- `color-mix(in srgb, <hex> N%, transparent)` is the idiom for making brand colors transparent cleanly across themes.

### Commit messages
- **Summary line**: imperative, ≤ 72 chars, tells what lands — not what you did.
- **Body**: sections with UPPERCASE headings (`WHAT CHANGED`, `WHY`, `VERIFICATION`). Short paragraphs.
- Always include the session link trailer the environment provides.

### What "done" means
- Lint clean, tests green, build clean, preview routes 200.
- Docs regenerated (prebuild handles it).
- Committed and pushed to `main`.
- User can reload the live site and see the change.

## Recovery protocol

If you break something and notice:
1. Say so in plain English. "I broke X because Y."
2. Show the failing output.
3. Propose the smallest fix. Don't bundle unrelated fixes.
4. Execute if they say go.

If the user says something is broken that you can't reproduce:
1. Ask for the exact URL, browser, and one specific symptom.
2. Don't guess and ship. Don't "harden" without knowing the cause.
3. If it's their first report of a class of issue, add a regression test with the fix.

## When the user says "continue"

They want momentum. Look at the todo list or the last few commits, pick the single most valuable next step, and ship it. Don't ask them to choose from a menu — you've been reading the conversation, you know what's next.

## When the user says something ambitious and vague

Translate the ambition into 2–4 concrete items. Do the highest-impact one fully, stub the others. Report what you shipped vs. what's parked in `IDEAS.md`. Never boil the ocean in one commit.

## Last rule

Keep the repo shippable at every commit. The site is live. Every `git push origin main` deploys to the world in ~90 seconds.
