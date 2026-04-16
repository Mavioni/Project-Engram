#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────
// status.mjs — the one-command orientation for any session.
// ─────────────────────────────────────────────────────────────
//
// Prints a compact, human-readable snapshot of the project's
// current state. Designed to be the FIRST thing a new Claude
// session runs (CLAUDE.md tells it to), and a useful check-in
// for Mavioni at any time.
//
// Output is intentionally short — under 30 lines. The goal is
// "is everything fine? what's next?" answered at a glance.
//
// Usage:
//   npm run status
//   node scripts/status.mjs
// ─────────────────────────────────────────────────────────────

import { readFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const c = {
  dim: '\x1b[2m',
  bold: '\x1b[1m',
  reset: '\x1b[0m',
  good: '\x1b[32m',
  warn: '\x1b[33m',
  bad: '\x1b[31m',
  accent: '\x1b[36m',
};

function git(cmd, fallback = '') {
  try {
    return execSync(cmd, { cwd: root, encoding: 'utf8' }).trim();
  } catch {
    return fallback;
  }
}

async function readFileSafe(path) {
  try {
    return await readFile(resolve(root, path), 'utf8');
  } catch {
    return '';
  }
}

/**
 * Extract the first N non-empty bullet lines from a section in
 * IDEAS.md. Sections are `## <name>` headings; extraction stops
 * at the next `## ` heading.
 */
function extractSection(ideas, name, limit = 4) {
  const re = new RegExp(`^##\\s+${name}\\b`, 'im');
  const m = ideas.match(re);
  if (!m) return [];
  const start = m.index + m[0].length;
  const rest = ideas.slice(start);
  const end = rest.search(/^##\s/m);
  const block = end === -1 ? rest : rest.slice(0, end);
  const lines = block
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.startsWith('- '))
    .map((l) => l.slice(2).trim())
    .filter(Boolean);
  return lines.slice(0, limit);
}

async function readStatsFromReadme() {
  const md = await readFileSafe('README.md');
  const block = md.match(/<!-- AUTO:stats -->([\s\S]*?)<!-- \/AUTO:stats -->/);
  if (!block) return {};
  const out = {};
  const rows = block[1].match(/\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|/g) || [];
  for (const row of rows) {
    const m = row.match(/\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|/);
    if (!m) continue;
    const k = m[1].toLowerCase().replace(/[^a-z]/g, '');
    const v = m[2].replace(/`/g, '');
    if (k) out[k] = v;
  }
  return out;
}

async function main() {
  const branch = git('git rev-parse --abbrev-ref HEAD', '(detached)');
  const age = git("git log -1 --format=%ar", '');
  // Use %x09 (tab) to avoid shell interpolation issues with %s.
  const recent = git('git log -5 --format=%h%x09%s', '')
    .split('\n')
    .filter(Boolean)
    .slice(0, 5);
  const statusLines = git('git status --porcelain', '').split('\n').filter(Boolean);
  const clean = statusLines.length === 0;

  let behindAhead = '';
  try {
    git('git fetch --quiet origin', '');
    const ahead = git('git rev-list --count HEAD..origin/main', '0');
    const local = git('git rev-list --count origin/main..HEAD', '0');
    if (ahead !== '0') behindAhead = ` · ${ahead} behind origin`;
    else if (local !== '0') behindAhead = ` · ${local} ahead of origin`;
  } catch {
    /* offline is fine */
  }

  const ideas = await readFileSafe('IDEAS.md');
  const now = extractSection(ideas, 'Now', 3);
  const next = extractSection(ideas, 'Next', 3);
  const justShipped = extractSection(ideas, 'Just shipped', 2);

  const stats = await readStatsFromReadme();

  const live = 'https://mavioni.github.io/Project-Engram/';

  // ── Render ──────────────────────────────────────────────

  const out = [];
  out.push('');
  out.push(`${c.bold}${c.accent}Engram${c.reset} ${c.dim}· session status${c.reset}`);
  out.push('');

  // Branch + cleanliness
  const cleanLabel = clean
    ? `${c.good}clean${c.reset}`
    : `${c.warn}${statusLines.length} uncommitted${c.reset}`;
  out.push(`${c.dim}Branch${c.reset}     ${branch} · ${cleanLabel}${behindAhead}`);
  out.push(`${c.dim}Live${c.reset}       ${live}`);

  if (stats.version) {
    const parts = [];
    if (stats.version) parts.push(`v${stats.version}`);
    if (stats.testcases) parts.push(`${stats.testcases} tests`);
    if (stats.testfiles) parts.push(`${stats.testfiles} files`);
    out.push(`${c.dim}Stats${c.reset}      ${parts.join(' · ')}`);
  }

  out.push('');
  out.push(`${c.bold}Last 5 commits${c.reset}`);
  for (const line of recent) {
    const [sha, msg] = line.split('\t');
    out.push(`  ${c.dim}${sha}${c.reset}  ${msg}`);
  }

  if (now.length > 0) {
    out.push('');
    out.push(`${c.bold}Now${c.reset}`);
    for (const item of now) out.push(`  · ${item}`);
  }

  if (next.length > 0) {
    out.push('');
    out.push(`${c.bold}Next${c.reset}`);
    for (const item of next) out.push(`  · ${truncate(item, 90)}`);
  }

  if (justShipped.length > 0) {
    out.push('');
    out.push(`${c.bold}Just shipped${c.reset}`);
    for (const item of justShipped) out.push(`  · ${truncate(item, 90)}`);
  }

  out.push('');
  out.push(`${c.dim}Age of last commit: ${age}${c.reset}`);
  out.push('');

  if (!clean) {
    out.push(`${c.warn}⚠ Uncommitted changes — review before shipping.${c.reset}`);
    for (const l of statusLines.slice(0, 10)) {
      out.push(`  ${c.dim}${l}${c.reset}`);
    }
    out.push('');
  }

  out.push(`${c.dim}Ready when you are. Brief me or say "continue".${c.reset}`);
  out.push('');

  process.stdout.write(out.join('\n'));
}

function truncate(s, n) {
  if (!s) return '';
  // Strip bold/italic markers for terminal-friendly output.
  const plain = s.replace(/\*\*/g, '').replace(/\*/g, '');
  return plain.length > n ? plain.slice(0, n - 1) + '…' : plain;
}

main().catch((e) => {
  console.error('[status] failed:', e);
  process.exit(0); // non-blocking
});
