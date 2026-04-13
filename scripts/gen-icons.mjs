#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────
// gen-icons.mjs — rasterize public/icon.svg into the PNG sizes
// the PWA manifest + Apple touch icon need. Runs automatically
// via the `prebuild` npm script so a fresh clone produces a
// complete dist/ with one `npm run build`.
// ─────────────────────────────────────────────────────────────

import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const source = resolve(root, 'public/icon.svg');

const TARGETS = [
  { out: 'public/icon-192.png', size: 192 },
  { out: 'public/icon-512.png', size: 512 },
  { out: 'public/icon-maskable-512.png', size: 512, maskable: true },
  { out: 'public/apple-touch-icon.png', size: 180 },
];

async function exists(p) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  if (!(await exists(source))) {
    console.warn(`[gen-icons] source missing: ${source} — skipping`);
    return;
  }

  let sharp;
  try {
    sharp = (await import('sharp')).default;
  } catch {
    console.warn(
      '[gen-icons] sharp is not installed — skipping PNG generation. ' +
        'Run `npm install` to enable it. Builds will still succeed because ' +
        'vite-plugin-pwa falls back to the SVG.',
    );
    return;
  }

  const svg = await readFile(source);

  for (const t of TARGETS) {
    const outPath = resolve(root, t.out);
    await mkdir(dirname(outPath), { recursive: true });

    // Maskable icons need a safe zone: composite onto a solid bg
    // with ~20% padding so Android's shape mask doesn't crop them.
    const pad = t.maskable ? Math.floor(t.size * 0.12) : 0;
    const inner = t.size - pad * 2;

    const rendered = await sharp(svg, { density: 512 })
      .resize(inner, inner)
      .png()
      .toBuffer();

    if (t.maskable) {
      await sharp({
        create: {
          width: t.size,
          height: t.size,
          channels: 4,
          background: { r: 6, g: 6, b: 14, alpha: 1 },
        },
      })
        .composite([{ input: rendered, top: pad, left: pad }])
        .png()
        .toFile(outPath);
    } else {
      await writeFile(outPath, rendered);
    }

    console.log(`[gen-icons] ${t.out} (${t.size}×${t.size})`);
  }
}

main().catch((e) => {
  console.error('[gen-icons] failed:', e);
  // Don't fail the build — icons are non-blocking polish.
  process.exit(0);
});
