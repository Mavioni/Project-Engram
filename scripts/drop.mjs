#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────
// drop.mjs — zero-ambiguity Netlify Drop helper.
//
// Runs the build, then opens the file manager at dist/ (or the
// dist folder's URL in a browser) so there's no way to drag the
// wrong folder. Usage:
//
//   npm run drop
//
// Then drag the highlighted `dist` folder onto
// https://app.netlify.com/drop.
// ─────────────────────────────────────────────────────────────

import { spawnSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
import { platform } from 'node:os';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const dist = resolve(root, 'dist');

function run(cmd, args, opts = {}) {
  const result = spawnSync(cmd, args, { stdio: 'inherit', cwd: root, shell: false, ...opts });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function open(target) {
  const os = platform();
  try {
    if (os === 'darwin') {
      spawnSync('open', [target], { stdio: 'ignore' });
    } else if (os === 'win32') {
      spawnSync('explorer', [target], { stdio: 'ignore' });
    } else {
      spawnSync('xdg-open', [target], { stdio: 'ignore' });
    }
  } catch {
    // If no file manager is available (headless, WSL, etc.), just
    // print the path — the user can navigate manually.
  }
}

console.log('\n[drop] building…');
run('npm', ['run', 'build']);

if (!existsSync(dist)) {
  console.error('\n[drop] ERROR: dist/ does not exist after build. Aborting.');
  process.exit(1);
}

console.log('\n[drop] ✓ build complete');
console.log('\n  ┌──────────────────────────────────────────────────────┐');
console.log('  │  Now drag the highlighted folder onto:               │');
console.log('  │    https://app.netlify.com/drop                      │');
console.log('  │                                                      │');
console.log(`  │  Folder: ${dist.padEnd(44, ' ')}│`);
console.log('  │                                                      │');
console.log('  │  Do NOT drag the parent repo folder.                 │');
console.log('  │  Do NOT zip it.                                      │');
console.log('  │  Drag the `dist` folder itself.                      │');
console.log('  └──────────────────────────────────────────────────────┘\n');

open(dist);
