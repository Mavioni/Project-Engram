# Engram

**Catalog yourself.** Engram is a local-first personality-tracking PWA that pairs a 24-facet IRIS personality map with a daily, emoji-driven journal and Claude-powered insights. It deploys to **GitHub Pages** via a GitHub Actions workflow on every push.

```
git push origin main          # GitHub Actions builds + publishes
```

— that's the whole shipping story.

---

## What's inside

| Area | What the user sees |
|---|---|
| **Home** | Greeting, streak, today's check-in, 7-day mood sparkline, next-step card. |
| **Journal** | Full timeline of every entry with moods, activity tags, and note cards. |
| **Check-In** | 3-step flow: mood (5-emoji scale) → activities (7 groups, ~50 emoji tags) → note (9 kinds: reflection, idea, dream, gratitude, win, struggle, question, quote, goal). |
| **Calendar** | Month-grid heatmap with per-day mood emoji, tap any day to view its entry. |
| **Insights** | Area chart of mood trend, horizontal activity bars, GitHub-style consistency grid, IRIS domain radar, and three AI insight buttons (daily / weekly / monthly). |
| **Chat with your IRIS** | Grounded chat that calls Claude with your full IRIS profile attached. |
| **You** | Profile + IRIS results + radar + subscription status + danger-zone reset. |
| **Pricing** | Free vs. Engram Pro ($4.99/mo or $39/yr). |
| **IRIS** | The original 16-scenario / 24-facet / Enneagram assessment, lifted intact into `src/features/iris/`. |

All data is stored locally in IndexedDB-backed `localStorage` via Zustand. Cloud sync, Claude insights, and Stripe billing activate only when the corresponding env vars are present — the app degrades gracefully to local-only without them.

---

## Architecture at a glance

```
┌─────────────────────── Browser (PWA) ──────────────────────┐
│  React 18 + React Router + Zustand + Recharts + three.js   │
│  ─────────────────────────────────────────────────────────  │
│  Local-first store (localStorage)                           │
│       │                                                     │
│       │ env-gated sync layer                                │
│       ▼                                                     │
└───── Supabase JS SDK ─────────────────────────────────────┘
            │
┌───────────┴────── Supabase project (optional) ───────────┐
│  Postgres        ← entries, notes, iris_snapshots, …      │
│  Auth (magic)    ← magic-link email sign-in               │
│  Edge Functions  ← claude-insight, stripe-checkout,       │
│                    stripe-portal, stripe-webhook          │
│  Storage         ← (future: attachments)                  │
└──────────────────────────────────────────────────────────┘
                            │
              ┌─────────────┴─────────────┐
              ▼                           ▼
        Anthropic API                 Stripe API
       (claude-sonnet-4-6)       (Checkout + Billing Portal)
```

The browser never sees the Anthropic API key or the Stripe secret key. The edge functions hold them, enforce subscription gating, and return signed URLs / insight text.

---

## Prerequisites

- **Node 20** (`.nvmrc` pins it). `nvm use` if you have nvm.
- **npm 10**. Yarn/pnpm also work but the scripts assume npm.
- Optional for live backend: a free [Supabase](https://supabase.com) project and a Stripe account.

---

## Quickstart

```bash
nvm use                     # or install Node 20
npm ci
cp .env.example .env        # optional; app works without it
npm run dev                 # open http://localhost:5173
```

The dev server is a fully functional Engram — you can run your IRIS, start journaling, and all the charts populate in real time. Claude insights will show fallback text (because no backend), which is the expected local-only behavior.

### Build for production

```bash
npm run build               # runs prebuild → gen-icons → vite build
npm run preview             # serves dist/ on http://localhost:4173
```

`dist/` is the static bundle. It contains:

- `index.html` + hashed `/assets/*.js` `/assets/*.css`
- `manifest.webmanifest` (PWA manifest — auto-generated from `vite.config.js`)
- `sw.js` + `workbox-*.js` (service worker, from `vite-plugin-pwa`)
- `favicon.svg`, `icon-192.png`, `icon-512.png`, `icon-maskable-512.png`, `apple-touch-icon.png`
- `.well-known/assetlinks.json` (for Play Store TWA verification)
- `robots.txt`

---

## Deploying to GitHub Pages

This repo ships a GitHub Actions workflow (`.github/workflows/deploy.yml`) that builds and publishes to GitHub Pages on every push. One-time setup in the repo's **Settings** tab:

1. **Settings → Pages → Build and deployment → Source:** set to **GitHub Actions**.
2. **(Optional)** If you're pushing from a non-default branch, also go to **Settings → Environments → `github-pages` → Deployment branches and tags** and add your branch to the allow-list. The workflow ships with both `main` and `claude/optimize-ternary-logic-vSODz` pre-configured as triggers.
3. **(Optional)** If you want the auth / Claude / Stripe features to light up in production, add these repo secrets under **Settings → Secrets and variables → Actions**:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_STRIPE_PUBLISHABLE_KEY`
   - `VITE_STRIPE_PRICE_MONTHLY`
   - `VITE_STRIPE_PRICE_YEARLY`

   Engram runs fully offline without them — the workflow reads them as optional and the client falls back to local-only mode if they're missing.

After that, every push to `main` builds the site and deploys it. Watch the run in the **Actions** tab. The live URL is:

```
https://<your-username>.github.io/<your-repo>/
```

For this repo: **https://mavioni.github.io/Project-Engram/**. You can trigger a build manually via **Actions → "Deploy to GitHub Pages" → Run workflow**.

### Why the `/Project-Engram/` subpath

GitHub Pages serves project sites under `https://<user>.github.io/<repo>/`, not at the domain root. Engram has to bake that subpath into every asset URL, the React Router basename, the PWA manifest `start_url` / `scope`, and the Workbox service-worker `navigateFallback`. The workflow sets `BASE_PATH=/${repo}/` at build time, `vite.config.js` reads it, and everything downstream stays consistent.

If you later move Engram to a user/organization page (`<user>.github.io`) or a custom domain, set `BASE_PATH=/` — nothing else needs to change.

### SPA routing on a static host

GitHub Pages has no server-side rewrites. Deep links like `/Project-Engram/journal` would normally 404 on refresh because there's no file at that path. Engram works around this with the standard `rafgraph/spa-github-pages` trick:

- **`public/404.html`** — served by Pages for any unknown path. A tiny script encodes the requested path into a query string and redirects to `/Project-Engram/?/journal`.
- **Inline decode script in `index.html`** — runs before React mounts, restores the real path via `history.replaceState`, and hands control to React Router.

The effect: clean URLs (`/Project-Engram/journal`), and refresh / share / deep link all work.

### Custom domain

To use your own domain (e.g. `engram.app`):

1. Create `public/CNAME` containing just the domain:
   ```
   engram.app
   ```
2. In **Settings → Pages → Custom domain**, enter the same domain. GitHub provisions a Let's Encrypt cert automatically.
3. Point your DNS — an `A` record to GitHub's IPs, or a `CNAME` to `<user>.github.io`. See GitHub's docs.
4. Since your site now lives at the root, you can change the workflow to pass `BASE_PATH=/` (or remove the env var entirely — it defaults to `/`).

---

## Wrapping for the Google Play Store (TWA)

Engram qualifies for a **Trusted Web Activity** wrap on **any custom domain** served over HTTPS. There's one caveat that matters for GitHub Pages:

**GitHub Pages project sites cannot serve `/.well-known/assetlinks.json` at the domain root** — the file ends up at `/<repo>/.well-known/assetlinks.json`, which Play's Digital Asset Links check won't find. A TWA wrap needs the verification file at `https://<domain>/.well-known/assetlinks.json`, not under a subpath.

Your options:

1. **Custom domain** (recommended) — move Engram to `engram.app` via the CNAME instructions above, set `BASE_PATH=/`, and `public/.well-known/assetlinks.json` will then be served at the correct path.
2. **User/org page** — if you rename the repo to `mavioni.github.io`, Engram becomes `https://mavioni.github.io/` (root), and the assetlinks file works. Only one user/org page per account.
3. **Different static host** — back to Netlify / Cloudflare Pages / Vercel. All support `/.well-known/*` at the root for free.

Once the verification file is at the right URL, the wrap flow is the same as before:

```bash
# Route A — PWABuilder, zero local Android setup
# Visit pwabuilder.com, paste your URL, click "Package For Stores → Android".

# Route B — Bubblewrap, reproducible local build
npm install -g @bubblewrap/cli
bubblewrap init --manifest=https://engram.app/manifest.webmanifest
bubblewrap build
```

Both routes print the signed keystore's SHA-256 fingerprint. Paste it into `public/.well-known/assetlinks.json` (replacing `PASTE_SHA256_FINGERPRINT_HERE_AFTER_FIRST_ANDROID_BUILD`), push, wait for Actions to redeploy, then submit the `.aab` to Play Console.

---

## Auth, 2FA, and subscriptions

Engram ships a complete auth + subscription system on top of Supabase + Stripe. Everything is wired and routed; the only thing you have to do is paste in your keys and run the migrations.

### Auth surface

| Route | Screen | Notes |
|---|---|---|
| `/signin` | Sign in / Sign up / Magic link / Reset password | Mode tabs in one screen |
| `/signin/2fa` | TOTP step-up challenge | Auto-redirected to after sign-in if 2FA enrolled |
| `/account` | Account hub | Email, AAL, sign out, billing portal |
| `/account/2fa` | 2FA enrollment | QR + manual secret + 6-digit verify |
| `/pricing` | Subscription plans | **Auth-gated** — bounces to `/signin?next=/pricing` |
| `/insights/chat` | Chat with your IRIS | **Auth-gated** |

### What's protected by auth + 2FA

- `/pricing`, `/account`, `/insights/chat` are wrapped in `<AuthGate>` (`src/components/AuthGate.jsx`).
- AuthGate enforces three states:
  1. **Supabase not configured** → renders an inline notice (no redirect — there's no backend to redirect to).
  2. **Not signed in** → `Navigate` to `/signin?next=<original>` so the user lands back where they started after auth.
  3. **Signed in with verified TOTP factor but not yet challenged** → `Navigate` to `/signin/2fa` to step up from AAL1 → AAL2.
- The `useAuth()` hook (`src/lib/auth.js`) wraps Supabase's session, AAL, and factor list into one reactive context. It re-derives on every `onAuthStateChange` event.

### 2FA implementation

TOTP via Supabase's built-in MFA. Compatible with 1Password, Authy, Google Authenticator, Bitwarden, and any RFC 6238 authenticator.

```
src/features/auth/TwoFactorEnroll.jsx     # QR + manual secret + 6-digit verify
src/features/auth/TwoFactorChallenge.jsx  # AAL1 → AAL2 step-up at sign-in
src/lib/supabase.js                       # enrollTotp / verifyTotp / unenrollFactor / getAal / listFactors
```

The enroll screen calls `supabase.auth.mfa.enroll({ factorType: 'totp' })`, which returns an SVG QR-code data-URI ready to drop into an `<img>`. If the user navigates away mid-enroll, the `useEffect` cleanup unenrolls the half-baked factor so the user doesn't accumulate dangling unverified factors.

### Wiring it up

1. Create your Supabase project (see below). Set the env vars.
2. Run the migration (`supabase/migrations/0001_init.sql`).
3. In Supabase **Auth → Providers → Email**: enable Email + Password. Optionally enable Magic Link.
4. In Supabase **Auth → MFA**: TOTP is enabled by default — confirm it's on.
5. Deploy the Stripe edge functions (see Stripe section below).
6. `npm run drop` → upload to Netlify. Visit `/signin`, create an account, enable 2FA from `/account`, click **Upgrade** → Stripe Checkout opens.

### Stripe + auth gating together

When a signed-in user clicks **Upgrade** on `/pricing`, the flow is:

1. `Pricing.jsx` calls `startCheckout('monthly' | 'yearly')` from `src/lib/stripe.js`.
2. That invokes the `stripe-checkout` edge function with the user's bearer token.
3. The edge function reads `auth.uid()`, looks up or creates a Stripe customer (linked via `subscriptions.stripe_customer_id`), creates a Checkout Session, and returns the URL.
4. The browser redirects to Stripe Checkout; on success, Stripe redirects back to `/you?checkout=success`.
5. The `stripe-webhook` edge function receives `checkout.session.completed` and upserts `subscriptions.tier = 'pro'` for that user.
6. Next time the app loads, the You / Account / Insights screens see `tier === 'pro'` and unlock unlimited Claude insights + chat.

Because `Pricing` is wrapped in `<AuthGate>`, an unauthenticated user clicking **Upgrade** is bounced to `/signin?next=/pricing`. After they sign in (and pass 2FA if enrolled), the redirect takes them straight back to the pricing screen with one click left to checkout. No Stripe call is made until the user is fully authenticated and AAL2-cleared if MFA is on.

---

## Optional: Supabase backend setup

Engram runs 100% offline without a backend. Add this when you want cross-device sync, accounts + 2FA, Claude insights, or Stripe billing.

### 1. Create a project

1. [supabase.com](https://supabase.com) → New project. Pick a region close to your users.
2. Copy **Project URL** and **anon key** from Settings → API. Paste into `.env`:

```bash
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
```

### 2. Run migrations

Install the Supabase CLI (`brew install supabase/tap/supabase`), then:

```bash
supabase login
supabase link --project-ref xxxx
supabase db push                 # applies supabase/migrations/0001_init.sql
```

This creates `profiles`, `entries`, `notes`, `iris_snapshots`, `insights`, `chat_threads`, `chat_messages`, `subscriptions`, plus RLS policies restricting every row to its owner. It also registers a trigger that auto-creates a `profiles` row when a new user signs up.

### 3. Deploy edge functions

```bash
supabase functions deploy claude-insight
supabase functions deploy stripe-checkout
supabase functions deploy stripe-portal
supabase functions deploy stripe-webhook --no-verify-jwt
```

Set the server-side secrets:

```bash
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
supabase secrets set ANTHROPIC_MODEL=claude-sonnet-4-6
supabase secrets set STRIPE_SECRET_KEY=sk_live_...
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
```

### 4. (Anthropic) Get an API key

1. [console.anthropic.com](https://console.anthropic.com) → API keys → Create.
2. Only paste it via `supabase secrets set ANTHROPIC_API_KEY=...`. **Never commit it** and never put it in `.env` — the anon key goes to the browser; the Anthropic key never should.

With all four secrets set, the **Insights** tab generates real Claude-authored insights and **Chat with your IRIS** streams real responses.

---

## Optional: Stripe subscriptions

Engram Pro ($4.99/mo or $39/yr) unlocks unlimited Claude insights and chat. The free tier gets 3 insights per month.

### 1. Create products in Stripe

Dashboard → Products → **New product**:

- **Name**: Engram Pro
- **Recurring price 1**: $4.99 / month (copy the `price_...` ID)
- **Recurring price 2**: $39.00 / year (copy the `price_...` ID)

Paste into `.env`:

```bash
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
VITE_STRIPE_PRICE_MONTHLY=price_...
VITE_STRIPE_PRICE_YEARLY=price_...
```

### 2. Register the webhook

Dashboard → Developers → Webhooks → **Add endpoint**:

- **URL**: `https://<your-project>.supabase.co/functions/v1/stripe-webhook`
- **Events**: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid`, `invoice.payment_failed`
- Copy the **Signing secret** (`whsec_...`) → `supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...`.

### ⚠️ Play Store billing warning

Google Play's Payments Policy generally requires **Google Play Billing** (not Stripe) for digital goods sold through apps distributed on Play. A 2024 US court order (Epic v Google) has loosened this for US users, but international users remain affected and the rules shift frequently.

**Safest launch:**

1. Ship the web PWA on Netlify. Collect Stripe subscriptions there.
2. Ship the Play Store TWA with **AI features gated but without an in-app purchase flow** — direct users to your website or pop a Chrome Custom Tab for sign-up.
3. Once you have revenue + legal clarity, integrate Google Play Billing in a native-plus-TWA build.

This repo ships the web path. The Play Store TWA will install fine; the Pricing screen will just not fire checkout inside the TWA.

---

## Repository layout

```
.
├── README.md                     ← you are here
├── LICENSE
├── package.json, vite.config.js  ← build tooling (vite.config reads BASE_PATH env)
├── index.html                    ← Vite entry + SPA redirect decode script
├── .env.example                  ← env vars — all optional
├── .github/workflows/
│   └── deploy.yml                ← builds + publishes to GitHub Pages on push
├── scripts/
│   └── gen-icons.mjs             ← rasterizes public/icon.svg → PNG
├── public/
│   ├── icon.svg, favicon.svg     ← source
│   ├── icon-{192,512,maskable-512}.png, apple-touch-icon.png  ← generated
│   ├── 404.html                  ← GitHub Pages SPA redirect encode
│   ├── robots.txt
│   └── .well-known/
│       └── assetlinks.json       ← TWA verification (needs custom domain on GH Pages)
├── src/
│   ├── main.jsx, App.jsx         ← React entry + router (basename=BASE_URL)
│   ├── styles/{global.css, tokens.js}
│   ├── lib/                      ← ternary, time, store, supabase, auth, claude, stripe
│   ├── data/                     ← moods, activities, note kinds
│   ├── components/               ← Emoji, Screen, Button, Nav, Card, Empty, MoodPicker, ActivityPicker, ErrorBoundary, AuthGate
│   └── features/
│       ├── iris/                 ← IRIS.jsx (the original), IrisRoute.jsx wrapper
│       ├── home/                 ← Home dashboard
│       ├── journal/              ← CheckIn, Journal
│       ├── calendar/             ← Calendar heatmap
│       ├── insights/             ← Insights + charts/*, Chat
│       ├── auth/                 ← SignIn, TwoFactorEnroll, TwoFactorChallenge, Account
│       ├── subscription/         ← Pricing
│       └── profile/              ← You
└── supabase/
    ├── config.toml
    ├── migrations/0001_init.sql  ← full schema + RLS
    └── functions/
        ├── claude-insight/       ← Anthropic proxy + credit gating
        ├── stripe-checkout/      ← creates Checkout session
        ├── stripe-portal/        ← customer billing portal
        └── stripe-webhook/       ← Stripe → Supabase sync
```

---

## About the ternary logic

The branch this was built on is `claude/optimize-ternary-logic-vSODz`. The load-bearing change is `src/lib/ternary.js` — it formalizes the low/mid/high classifier IRIS v3.2 had inlined and makes it branchless. Every facet interpretation in the app routes through it now, including the in-product 3D visualization and the downloadable HTML profile card:

```js
// src/lib/ternary.js
export function ternaryIndex(value, thresholds = [0.35, 0.65]) {
  return (value > thresholds[0]) + (value > thresholds[1]);
}
export function classifyTernary(obj, value, thresholds) {
  return [obj.low, obj.mid, obj.high][ternaryIndex(value, thresholds)];
}
```

It's the smallest change that makes the most code predictable.

---

## License

See `LICENSE`. IRIS v3.2 and all assessment content © Eclipse Ventures LLC / Yunis AI.
