# Deploy — how code becomes a live website

## One-sentence version

Push to `main` → GitHub Actions builds the app → publishes to GitHub Pages → **https://mavioni.github.io/Project-Engram/** updates in ~90 seconds.

## The files that make this work

| File | Role |
|---|---|
| `.github/workflows/deploy.yml` | The actual pipeline — runs on every push to `main` |
| `.github/workflows/ci.yml` | Lint + test + build + docs-check on every PR (no deploy) |
| `.github/workflows/lighthouse.yml` | Advisory PWA/performance audit on PRs touching app code |
| `vite.config.js` | Bakes `BASE_PATH=/Project-Engram/` into every asset URL at build time |
| `public/404.html` | The SPA redirect trick — more on this below |
| `index.html` | The SPA decode side of the same trick |

## What actually happens on push

1. GitHub sees a new commit on `main` and triggers `deploy.yml`.
2. The runner does `npm ci` (installs dependencies from the lockfile — reproducible).
3. It runs `npm run build` with `BASE_PATH=/Project-Engram/` as an env var. That causes Vite to:
   - Generate the PNG icons from `public/icon.svg` (`prebuild` hook)
   - Regenerate the README auto-sections (`prebuild` hook)
   - Bundle all the JS/CSS into hashed asset files
   - Write the PWA service worker + manifest
4. The runner uploads `dist/` as a GitHub Pages artifact.
5. The `deploy-pages` action publishes it.
6. ~30–60 seconds later, the new site is live.

## The SPA redirect trick (why it matters)

GitHub Pages has no server-side rewrites. So a deep link like `/Project-Engram/engram` would normally 404 — there's no `engram` file on disk.

**The trick**: when a user visits a missing path, GitHub Pages serves `404.html`. Our `404.html` runs a tiny script that:

1. Reads the requested path
2. Redirects to `/Project-Engram/?/engram` (the real path is in the query string)

Then `index.html` has the decode side — a script that runs before React mounts:

1. Sees the `?/engram` query
2. Uses `history.replaceState` to make the URL look like `/Project-Engram/engram` again
3. Hands off to React Router

From the user's perspective: clean URLs, deep-link refreshes work, shareable links work.

## The secrets situation

**Nothing secret is in the browser.** The Anthropic API key, the Stripe secret key, and the Supabase service-role key all live on the server in Supabase Edge Functions. The browser talks to those functions; they talk to the services.

The env vars that DO go into the browser (and hence into the build):

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_STRIPE_PUBLISHABLE_KEY`
- `VITE_STRIPE_PRICE_MONTHLY`
- `VITE_STRIPE_PRICE_YEARLY`

All of these are safe to ship publicly — the anon key is rate-limited and RLS-gated, the publishable key is literally meant to be public.

They're set as GitHub repo secrets (Settings → Secrets → Actions) and read by `deploy.yml`. If you haven't set them, the build still succeeds — the app falls back to local-only mode.

## When deploys fail

Common causes:

- **Lint error** — a new ESLint warning slipped in. Fix the warning; push again.
- **Test failure** — a test broke. Read the failure output; fix the code or update the test.
- **`docs:check` failed** — someone edited `App.jsx` or `package.json` without running `npm run docs:update`. Run it locally, commit, push.
- **Pages not enabled** — one-time Settings fix: Settings → Pages → Source: GitHub Actions.

Red builds are loud and visible in the Actions tab. Paste the error at Claude; it'll fix.

## Manual deploy

You almost never need this, but: Actions tab → "Deploy to GitHub Pages" → Run workflow → Run. Deploys the current `main` without needing a new commit.

## Rolling back

- Every commit is a deployable checkpoint.
- To roll back: revert the bad commit with `git revert <sha>` and push. GitHub Actions redeploys the previous-good state. Zero downtime.
- Alternatively: re-run the last-good Actions run from the Actions tab — it'll redeploy exactly that build.

## Play Store wrap (when the time comes)

Engram is a PWA. It qualifies for a Play Store wrap via **PWABuilder** or **Bubblewrap** (a Trusted Web Activity — a thin Android shell around the PWA).

The blocker right now: the `/.well-known/assetlinks.json` file has to live at the **domain root** (e.g. `https://engram.app/.well-known/assetlinks.json`), not at `/Project-Engram/.well-known/...`. GitHub Pages project sites can't serve at the root without a custom domain.

Plan when we're ready: buy a domain → add `public/CNAME` → set `BASE_PATH=/` → rebuild → submit to Play.

See `README.md` → "Wrapping for the Google Play Store" for the full walkthrough.
