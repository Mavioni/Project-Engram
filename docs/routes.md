# Routes — what each URL shows

> **This table is auto-generated in `README.md` too** (see the AUTO:routes
> section). If you're reading this file and something looks stale, run
> `npm run docs:update`.

## Primary (the 3 bottom nav tabs)

| URL | Screen | What you see |
|---|---|---|
| `/` | Dashboard | Player Card → Today → Daily challenge → Stats → Recent entries → Mood trend → Mini calendar → Engram teaser |
| `/chat` | Chat | Conversation with your IRIS (Claude-grounded) |
| `/engram` | Engram | Stats / Arena / History tabs |

## Secondary (reached from in-page links)

| URL | Screen | Reached from |
|---|---|---|
| `/iris` | IRIS v4 assessment | Dashboard CTA, "Re-run IRIS" buttons in Settings / Player Card |
| `/checkin` | 3-step daily check-in | Dashboard "Check in" button, Calendar "Check in now" |
| `/journal` | Full entry timeline | Dashboard "View journal →" |
| `/calendar` | Month heatmap | Dashboard "Full calendar →" |
| `/insights` | Charts + Claude insights | Dashboard "Insights →" |
| `/settings` | Settings page | TopBar gear icon (top-right) |

## Auth (reached from Settings / gated surfaces)

| URL | Screen |
|---|---|
| `/signin` | Combined sign in / sign up / magic link / password reset |
| `/signin/2fa` | TOTP step-up challenge after password |
| `/account` | Authenticated account hub |
| `/account/2fa` | Enroll a TOTP factor (QR + 6-digit verify) |
| `/pricing` | Engram Pro upgrade screen |

## Legacy redirects (old bookmarks keep working)

| Old URL | Now goes to |
|---|---|
| `/home` | `/` |
| `/journal/checkin` | `/checkin` |
| `/insights/chat` | `/chat` |
| `/you` | `/settings` |

## Chrome

- **TopBar** (top of every page except IRIS): Engram logo on the left (→ `/`), gear icon on the right (→ `/settings`).
- **Nav** (bottom of every page except IRIS): 3 tabs, always the same 3.

## Full-screen flows (nav + topbar hidden)

`/iris` — the IRIS assessment is immersive and owns the whole viewport.

## When routes change

If you add, remove, or rename a route in `src/App.jsx`:

1. The `<!-- AUTO:routes -->` section of `README.md` regenerates itself via `npm run prebuild`.
2. If you removed a route, add a redirect so old links don't 404. Pattern: `<Route path="/old" element={<Navigate to="/new" replace />} />`.
3. Update any `navigate('/old')` calls elsewhere in the app (search with ripgrep or ask Claude).
