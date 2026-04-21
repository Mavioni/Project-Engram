// ─────────────────────────────────────────────────────────────
// <Emoji /> — Twemoji-backed, platform-consistent emoji with a
// graceful unicode fallback when the CDN is unreachable.
// ─────────────────────────────────────────────────────────────
// We use Twitter's Twemoji SVGs via jsdelivr CDN so every user
// sees identical, gorgeous emoji regardless of OS/browser. PWA
// service worker runtime-caches them (see vite.config.js), so
// the second visit is offline-ready.
//
// Pass a Twemoji codepoint string, e.g. "1f929" for 🤩.
// Sequences like ZWJ emojis use hyphens: "1f9d1-200d-1f4bb".
//
// When the image fails to load (blocked CDN, corporate filter,
// flaky network) the component falls back to the native unicode
// character so the UI stays functional. Previously an emoji
// 404 tripped the index.html boot error handler and killed the
// whole app — fixed there too, but defence-in-depth here.
// ─────────────────────────────────────────────────────────────

import { useState } from 'react';

const TWEMOJI_BASE =
  'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg';

/**
 * Convert a Twemoji codepoint sequence ("1f929" or "1f9d8-200d-2642")
 * into the corresponding unicode string for fallback rendering.
 */
function codepointsToChar(code) {
  try {
    return code
      .split('-')
      .map((cp) => String.fromCodePoint(parseInt(cp, 16)))
      .join('');
  } catch {
    return '';
  }
}

export default function Emoji({
  code,
  size = 24,
  label,
  style,
  className,
  animated = false,
}) {
  const [failed, setFailed] = useState(false);
  if (!code) return null;

  if (failed) {
    // Unicode fallback — no network, no CDN, no surprises.
    return (
      <span
        aria-label={label || undefined}
        role={label ? 'img' : 'presentation'}
        className={className}
        style={{
          display: 'inline-block',
          width: size,
          height: size,
          lineHeight: `${size}px`,
          textAlign: 'center',
          fontSize: Math.round(size * 0.85),
          userSelect: 'none',
          verticalAlign: 'middle',
          ...style,
        }}
      >
        {codepointsToChar(code)}
      </span>
    );
  }

  const src = `${TWEMOJI_BASE}/${code}.svg`;
  return (
    <img
      src={src}
      alt={label || ''}
      aria-label={label || undefined}
      role={label ? 'img' : 'presentation'}
      width={size}
      height={size}
      draggable={false}
      loading="lazy"
      decoding="async"
      // `fetchpriority=low` tells the browser these CDN fetches
      // must not compete with critical bundle JS/CSS. Emoji are
      // chrome, not content — letting the main bundle win the
      // bandwidth race keeps first-paint fast.
      fetchPriority="low"
      onError={() => setFailed(true)}
      className={className}
      style={{
        width: size,
        height: size,
        display: 'inline-block',
        verticalAlign: 'middle',
        userSelect: 'none',
        filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.35))',
        transition: animated ? 'transform 260ms cubic-bezier(.2,1,.3,1)' : undefined,
        ...style,
      }}
    />
  );
}
