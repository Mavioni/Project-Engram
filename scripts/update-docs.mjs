#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────
// update-docs.mjs — regenerate README auto-sections in place.
// ─────────────────────────────────────────────────────────────
//
// The README has a few regions enclosed in HTML comments like
//   <!-- AUTO:routes -->  <!-- /AUTO:routes -->
// This script reads the codebase, derives the current truth for
// each region, and rewrites just that slice. Everything outside
// the markers is left alone so hand-written prose survives.
//
// Runs on every build (via `prebuild` → `npm run docs:update`)
// so the published site's README can never drift from the code.
//
// Regions generated:
//   • routes   — top-level routes from src/App.jsx
//   • scripts  — npm scripts from package.json
//   • deps     — prod + dev dependency counts and top-level list
//   • features — feature folders under src/features/
//   • stats    — test count, build time, version, last-updated
//
// Usage:
//   node scripts/update-docs.mjs         → writes README.md
//   node scripts/update-docs.mjs --check → exits non-zero if stale
// ─────────────────────────────────────────────────────────────

import { readFile, writeFile, readdir } from 'node:fs/promises';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const README = resolve(root, 'README.md');

// ── helpers ────────────────────────────────────────────────

async function readJSON(p) {
  return JSON.parse(await readFile(p, 'utf8'));
}

function listRoutesFromApp(source) {
  // Match JSX <Route path="x" ... /> patterns.
  const out = [];
  const re = /<Route\s+path=["']([^"']+)["']/g;
  let m;
  while ((m = re.exec(source)) !== null) {
    out.push(m[1]);
  }
  // Dedup, keep order
  return [...new Set(out)];
}

function classifyRoute(path) {
  if (path === '*') return { section: 'fallback', label: 'catch-all → /' };
  if (path === '/') return { section: 'primary', label: 'Dashboard' };
  if (path === '/chat') return { section: 'primary', label: 'Chat with your IRIS' };
  if (path === '/engram') return { section: 'primary', label: 'Engram — replica + arena' };
  if (path.startsWith('/signin') || path.startsWith('/account') || path === '/pricing') {
    return { section: 'auth', label: humanize(path) };
  }
  if (['/home', '/you', '/insights/chat', '/journal/checkin'].includes(path)) {
    return { section: 'legacy', label: `${path} → redirect` };
  }
  return { section: 'secondary', label: humanize(path) };
}

function humanize(path) {
  const map = {
    '/iris': 'IRIS v4 assessment',
    '/journal': 'Journal timeline',
    '/calendar': 'Month calendar',
    '/insights': 'Insights + charts',
    '/checkin': 'Daily check-in flow',
    '/settings': 'Settings + theme toggle',
    '/signin': 'Sign in / up / magic link',
    '/signin/2fa': 'TOTP step-up challenge',
    '/account': 'Account hub',
    '/account/2fa': 'Enroll 2FA',
    '/pricing': 'Subscription plans',
  };
  return map[path] || path;
}

// ── region generators ─────────────────────────────────────

async function regionRoutes() {
  const app = await readFile(resolve(root, 'src/App.jsx'), 'utf8');
  const paths = listRoutesFromApp(app);
  const groups = { primary: [], secondary: [], auth: [], legacy: [] };
  for (const p of paths) {
    const c = classifyRoute(p);
    if (groups[c.section]) groups[c.section].push({ path: p, label: c.label });
  }
  const rows = [];
  const section = (title, items) => {
    if (items.length === 0) return;
    rows.push(`**${title}**`);
    rows.push('');
    rows.push('| Path | What it is |');
    rows.push('|---|---|');
    for (const r of items) {
      rows.push(`| \`${r.path}\` | ${r.label} |`);
    }
    rows.push('');
  };
  section('Primary (bottom nav)', groups.primary);
  section('Secondary (in-page links)', groups.secondary);
  section('Auth', groups.auth);
  section('Legacy redirects', groups.legacy);
  return rows.join('\n').trimEnd();
}

async function regionScripts() {
  const pkg = await readJSON(resolve(root, 'package.json'));
  const rows = ['| Script | Purpose |', '|---|---|'];
  const scripts = pkg.scripts || {};
  const descriptions = {
    dev: 'Local dev server (Vite)',
    build: 'Production build to `dist/` (runs `prebuild` first)',
    preview: 'Serve the built bundle',
    icons: 'Rasterize `public/icon.svg` → PNG manifest icons',
    prebuild: 'Runs before `build` — generates icons + updates docs',
    lint: 'ESLint on `src/`, zero warnings tolerated',
    format: 'Prettier write on everything',
    test: 'Vitest in watch mode',
    'test:ci': 'Vitest single-run (CI)',
    'docs:update': 'Regenerate auto-sections in README',
    'docs:check': "Verify README auto-sections are up to date (exits non-zero if stale)",
  };
  for (const [name, cmd] of Object.entries(scripts)) {
    const d = descriptions[name] || `\`${cmd}\``;
    rows.push(`| \`npm run ${name}\` | ${d} |`);
  }
  return rows.join('\n');
}

async function regionDeps() {
  const pkg = await readJSON(resolve(root, 'package.json'));
  const prod = Object.entries(pkg.dependencies || {});
  const dev = Object.entries(pkg.devDependencies || {});
  const fmt = (entries) =>
    entries.map(([name, ver]) => `\`${name}@${ver.replace(/^[\^~]/, '')}\``).join(', ');
  return [
    `**${prod.length} production dependencies**`,
    '',
    fmt(prod),
    '',
    `**${dev.length} dev dependencies**`,
    '',
    fmt(dev),
  ].join('\n');
}

async function regionFeatures() {
  const featuresDir = resolve(root, 'src/features');
  const entries = await readdir(featuresDir, { withFileTypes: true });
  const dirs = entries.filter((e) => e.isDirectory()).map((e) => e.name);
  const descriptions = {
    home: 'Dashboard — the single primary surface',
    iris: 'IRIS v4 — 24-facet assessment + Coliseum + Player Card export',
    engram: 'Engram replica — Stats, Arena (battle 9 archetypes), History',
    journal: 'Journal timeline + Check-In flow',
    calendar: 'Month heatmap',
    insights: 'Charts + Claude-powered insights + Chat',
    auth: 'Sign in / Sign up / 2FA TOTP / Account',
    subscription: 'Stripe-gated Pro pricing + upgrade',
    settings: 'Theme toggle, account, plan, reset',
    profile: 'Legacy You page (redirects to Settings)',
  };
  const rows = ['| Folder | Feature |', '|---|---|'];
  for (const d of dirs.sort()) {
    rows.push(`| \`src/features/${d}/\` | ${descriptions[d] || d} |`);
  }
  return rows.join('\n');
}

async function regionStats() {
  const pkg = await readJSON(resolve(root, 'package.json'));

  // Count test files + test() / it() calls — quick-and-dirty AST-free scan.
  async function countTests(dir, out = { files: 0, cases: 0 }) {
    let items;
    try {
      items = await readdir(dir, { withFileTypes: true });
    } catch {
      return out;
    }
    for (const item of items) {
      const full = join(dir, item.name);
      if (item.isDirectory()) {
        await countTests(full, out);
      } else if (/\.(test|spec)\.(js|jsx|ts|tsx)$/.test(item.name)) {
        out.files += 1;
        const src = await readFile(full, 'utf8');
        const matches = src.match(/\b(it|test)\s*\(/g);
        out.cases += matches ? matches.length : 0;
      }
    }
    return out;
  }
  const tests = await countTests(resolve(root, 'src'));

  const now = new Date().toISOString().slice(0, 10);
  return [
    `| Item | Value |`,
    `|---|---|`,
    `| Version | \`${pkg.version}\` |`,
    `| Node | \`${pkg.engines?.node || '—'}\` |`,
    `| Test files | ${tests.files} |`,
    `| Test cases | ${tests.cases} |`,
    `| Last doc sync | ${now} |`,
  ].join('\n');
}

const REGIONS = {
  routes: regionRoutes,
  scripts: regionScripts,
  deps: regionDeps,
  features: regionFeatures,
  stats: regionStats,
};

// ── main ──────────────────────────────────────────────────

function buildReplaced(source, regionName, content) {
  const tag = regionName;
  const startMarker = `<!-- AUTO:${tag} -->`;
  const endMarker = `<!-- /AUTO:${tag} -->`;
  const startIdx = source.indexOf(startMarker);
  const endIdx = source.indexOf(endMarker);
  if (startIdx === -1 || endIdx === -1) {
    // No marker present yet — skip silently (caller adds markers).
    return source;
  }
  const before = source.slice(0, startIdx + startMarker.length);
  const after = source.slice(endIdx);
  return `${before}\n${content}\n${after}`;
}

async function main() {
  const checkOnly = process.argv.includes('--check');
  let source;
  try {
    source = await readFile(README, 'utf8');
  } catch {
    console.error('[update-docs] README.md not found — skipping');
    return;
  }

  let next = source;
  for (const [name, fn] of Object.entries(REGIONS)) {
    try {
      const content = await fn();
      next = buildReplaced(next, name, content);
    } catch (e) {
      console.error(`[update-docs] region ${name} failed:`, e.message);
    }
  }

  if (next === source) {
    console.log('[update-docs] README already up to date.');
    return;
  }

  if (checkOnly) {
    console.error('[update-docs] README is stale — run `npm run docs:update`.');
    process.exit(1);
  }

  await writeFile(README, next);
  console.log('[update-docs] README regenerated.');
}

main().catch((e) => {
  console.error('[update-docs] failed:', e);
  // Non-blocking — don't break builds over docs.
  process.exit(0);
});
