# Architecture — the 30-second tour

## What the app is, in one breath

Engram is a **local-first personal app**. That means: everything you write, every mood you log, every IRIS result, every battle — all of it is stored on your own device first. If you're signed in, it can sync to a cloud database; if you're not, it still works forever.

## The shape

```
         ┌─────────────────────────────────────────┐
         │  Your browser                           │
         │                                         │
         │   ┌───────────────┐    ┌──────────────┐ │
         │   │  UI screens   │◄──►│ Local store  │ │
         │   │  (React)      │    │ (Zustand +    │ │
         │   │               │    │  localStorage)│ │
         │   └───────┬───────┘    └───────┬──────┘ │
         │           │                    │        │
         └───────────┼────────────────────┼────────┘
                     │                    │
                     │   (only if you     │   (only if env
                     │    sign in)        │    vars are set)
                     ▼                    ▼
              ┌──────────────┐     ┌──────────────┐
              │  Supabase    │     │   Supabase    │
              │  (your data) │     │  Edge Fns     │
              └──────────────┘     │               │
                                   └──┬────────┬───┘
                                      │        │
                                      ▼        ▼
                                 Anthropic    Stripe
                                 (Claude)    (payments)
```

**Three things to know:**

1. **The browser is the source of truth.** The code is written so the app works with zero network. Cloud sync is an option, not a requirement.
2. **Sensitive keys never touch the browser.** The Anthropic API key and Stripe secret key live only in Supabase Edge Functions on the server. The browser asks those functions to do things; the functions do them and return the answer.
3. **Everything compiles to static files.** The whole app is built into a folder called `dist/`, which gets served as a plain website on GitHub Pages. No Node server. No database connection from the browser directly.

## The primary tabs (bottom nav)

Only three. Everything else is a link from inside one of these.

- **Dashboard** (`/`) — the home surface
- **Chat** (`/chat`) — conversation with your IRIS
- **Engram** (`/engram`) — your replica + arena

## The secondary surfaces

These are real screens, but you reach them through a link on one of the three tabs, or through the top-right gear:

- **IRIS** (`/iris`) — the 24-facet assessment. Reached from Dashboard CTA or Settings.
- **Settings** (`/settings`) — theme toggle, account, plan, reset. Reached from the gear.
- **Journal** (`/journal`) — full timeline of every check-in. Reached from Dashboard's "View journal →".
- **Calendar** (`/calendar`) — the month heatmap. Reached from Dashboard's "Full calendar →".
- **Insights** (`/insights`) — charts + Claude-generated insights. Reached from Dashboard's "Insights →".
- **Check-in** (`/checkin`) — the 3-step daily capture flow. Reached from Dashboard's "Check in" button.
- **Pricing / Account / Signin** — auth + subscription flows.

## What each folder holds

```
src/
├── main.jsx        ← the boot file
├── App.jsx         ← the router (every URL → screen)
├── styles/         ← CSS vars for light + dark themes
├── lib/            ← utilities: time, theme, store, supabase, claude, stripe
├── data/           ← plain data: mood scale, activities, note kinds, enneagram types
├── components/     ← reusable UI pieces (Card, Button, Emoji, PlayerCard…)
└── features/       ← one folder per real feature
    ├── home/       ← Dashboard
    ├── iris/       ← IRIS assessment
    ├── engram/     ← Replica + Arena
    ├── journal/    ← Timeline + check-in
    ├── calendar/   ← Month heatmap
    ├── insights/   ← Charts + Claude insights + Chat
    ├── auth/       ← Sign-in + 2FA + Account
    ├── subscription/  ← Pricing
    └── settings/   ← Settings page
```

If Claude says "let's change X on the Dashboard," it's editing files in `src/features/home/`. If it says "add a new mood option," it's editing `src/data/moods.js`.

## The build + deploy loop

You push to the `main` branch → GitHub Actions runs → ~90 seconds later the live site is updated.

```
you say "continue"
      │
      ▼
Claude writes code
      │
      ▼
runs lint, tests, build   ← Claude verifies locally
      │
      ▼
commits + pushes          ← your changes are now on GitHub
      │
      ▼
GitHub Actions builds     ← happens automatically
      │
      ▼
publishes to GitHub Pages ← live site updates
      │
      ▼
you see the change on https://mavioni.github.io/Project-Engram/
```

That's the whole pipeline.
