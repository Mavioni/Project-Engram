// ─────────────────────────────────────────────────────────────
// <Emoji /> — Twemoji-backed, platform-consistent emoji.
// ─────────────────────────────────────────────────────────────
// We use Twitter's Twemoji SVGs via jsdelivr CDN so every user
// sees identical, gorgeous emoji regardless of OS/browser. PWA
// service worker runtime-caches them (see vite.config.js), so
// the second visit is offline-ready.
//
// Pass a Twemoji codepoint string, e.g. "1f929" for 🤩.
// Sequences like ZWJ emojis use hyphens: "1f9d1-200d-1f4bb".
// ─────────────────────────────────────────────────────────────

const TWEMOJI_BASE =
  'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg';

export default function Emoji({
  code,
  size = 24,
  label,
  style,
  className,
  animated = false,
}) {
  if (!code) return null;
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
