# Engram

**Catalog yourself.** Engram is a local-first personality-tracking PWA that pairs a 24-facet IRIS personality map with a daily, emoji-driven journal and Claude-powered insights. It builds to a static bundle, drops onto Netlify, and wraps for the Play Store via PWABuilder or Bubblewrap.

```
npm ci && npm run build && open dist/
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

## Deploying to Netlify (drag-and-drop)

This is the canonical shipping path for this repo. **No Git integration required** — no GitHub App to authorize.

1. `npm ci && npm run build`
2. Open [app.netlify.com/drop](https://app.netlify.com/drop).
3. **Drag the `dist/` folder itself** — not the repo folder, not a zip. The thing you drag must contain `index.html` at its top level. (The repo's own `index.html` is a Vite source file and will not run as a site; you must drag the built `dist/`.)
4. Netlify returns a `https://<random>.netlify.app` URL within ~10 seconds.
5. In the site dashboard → **Site settings → Change site name** → pick something nice like `engram-app`.
6. Open the URL on your phone and tap **Add to Home Screen** / **Install app**. That's a PWA install.

Every redeploy = repeat steps 1–3 with the updated `dist/`.

> **If you see a Netlify "Page not found" at `/`:** you dragged the wrong folder. Netlify Drop publishes the folder exactly as-is — it does not run a build. Drag `dist/`, not `Project-Engram/`.

**Why `_redirects` and `_headers` ship in `dist/`:** Netlify Drop does *not* read `netlify.toml` (that's only for Git-connected builds). The SPA fallback and security headers live in `public/_redirects` and `public/_headers`, which Vite copies into `dist/` at build time. This is what makes sub-routes like `/journal`, `/calendar`, `/insights/chat` resolve correctly after a page refresh on a Drop deploy.

### Custom domain

Netlify → **Domain management → Add a domain**. Point your DNS `A` record at Netlify's load balancer. HTTPS is automatic (Let's Encrypt). Use a real domain before you wrap for Play Store — TWAs need a stable origin for Digital Asset Links verification.

### Security headers

`netlify.toml` ships with HSTS, `X-Frame-Options: DENY`, `Permissions-Policy` (disables geo/camera/mic), and explicit `application/json` + CORS for `assetlinks.json`. No additional configuration needed.

---

## Wrapping for the Google Play Store (TWA)

Engram qualifies for a **Trusted Web Activity** wrap — the native shell is a thin wrapper around your PWA, served from your Netlify domain. Two routes, both well-supported. Start with PWABuilder; move to Bubblewrap only if you need reproducible CI builds.

### Route A — PWABuilder (recommended, zero local Android setup)

1. Visit [pwabuilder.com](https://www.pwabuilder.com/).
2. Paste your Netlify URL (e.g. `https://engram.app`). Wait for the report.
3. Fix any "missing" items. The scaffold in this repo already ships with: installable manifest, registered service worker, HTTPS, maskable icon. Score should be 90+.
4. Click **Package For Stores → Android**. Choose **Signed Play Store package**.
5. PWABuilder will generate a `.aab` + an `assetlinks.json` content block containing the correct SHA‑256 fingerprint for the keystore it just created.
6. **Copy that fingerprint** into `public/.well-known/assetlinks.json` (replace `PASTE_SHA256_FINGERPRINT_HERE_AFTER_FIRST_ANDROID_BUILD`) and **redeploy** `dist/` to Netlify. Verification requires the file to be live before submission.
7. Create a Play Console account ($25 one-time), create a new app, upload the `.aab`, fill in store listing, submit.

### Route B — Bubblewrap CLI (reproducible)

```bash
npm install -g @bubblewrap/cli
bubblewrap init --manifest=https://engram.app/manifest.webmanifest
bubblewrap build                  # produces app-release-signed.aab + fingerprint
```

Bubblewrap prints the SHA‑256 fingerprint after `bubblewrap build`. Paste it into `public/.well-known/assetlinks.json`, redeploy, then upload the `.aab` to Play Console.

### Digital Asset Links — the two-step gotcha

`public/.well-known/assetlinks.json` ships with a **placeholder** fingerprint. Until the file contains the real SHA‑256 from your signed Android build, Chrome will show its URL bar inside the TWA instead of running in fullscreen. This is an intentional Google check.

**Order of operations:**

1. Build + deploy the PWA.
2. Generate your Android package (PWABuilder **or** Bubblewrap). This gives you the fingerprint.
3. Paste the fingerprint into `public/.well-known/assetlinks.json` → `npm run build` → redeploy.
4. Now submit to Play Store.

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
├── package.json, vite.config.js  ← build tooling
├── netlify.toml                  ← deploy + security headers
├── index.html                    ← Vite entry, meta tags, viewport
├── .env.example                  ← env vars — all optional
├── scripts/
│   └── gen-icons.mjs             ← rasterizes public/icon.svg → PNG
├── public/
│   ├── icon.svg, favicon.svg     ← source
│   ├── icon-{192,512,maskable-512}.png, apple-touch-icon.png  ← generated
│   ├── robots.txt
│   └── .well-known/
│       └── assetlinks.json       ← TWA verification (placeholder until signed)
├── src/
│   ├── main.jsx, App.jsx         ← React entry + router
│   ├── styles/{global.css, tokens.js}
│   ├── lib/                      ← ternary, time, store, supabase, claude, stripe
│   ├── data/                     ← moods, activities, note kinds
│   ├── components/               ← Emoji, Screen, Button, Nav, Card, Empty, MoodPicker, ActivityPicker
│   └── features/
│       ├── iris/                 ← IRIS.jsx (the original), IrisRoute.jsx wrapper
│       ├── home/                 ← Home dashboard
│       ├── journal/              ← CheckIn, Journal
│       ├── calendar/             ← Calendar heatmap
│       ├── insights/             ← Insights + charts/*, Chat
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
