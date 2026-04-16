// ─────────────────────────────────────────────────────────────
// <Button /> — the single button primitive used across Engram.
// Theme-aware: variants use CSS vars or the caller-supplied
// `tone` color with color-mix for backgrounds.
// ─────────────────────────────────────────────────────────────

export default function Button({
  variant = 'ghost',
  tone,
  size = 'md',
  full,
  disabled,
  style,
  children,
  ...rest
}) {
  const accent = tone || 'var(--ink)';
  const padding =
    size === 'sm' ? '8px 16px' : size === 'lg' ? '16px 36px' : '12px 24px';
  const fontSize = size === 'sm' ? 10 : size === 'lg' ? 13 : 11;

  const base = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding,
    fontSize,
    letterSpacing: '0.25em',
    textTransform: 'uppercase',
    fontFamily: 'var(--mono)',
    borderRadius: 999,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.4 : 1,
    transition: 'all 220ms ease',
    width: full ? '100%' : undefined,
    border: `1px solid color-mix(in srgb, ${accent} 25%, transparent)`,
  };

  const variants = {
    ghost: {
      background: 'transparent',
      color: tone ? accent : 'var(--ink-soft)',
    },
    solid: {
      background: `color-mix(in srgb, ${accent} 18%, var(--bg-raised))`,
      borderColor: `color-mix(in srgb, ${accent} 45%, transparent)`,
      color: tone ? accent : 'var(--ink)',
    },
    subtle: {
      background: 'transparent',
      borderColor: 'transparent',
      color: 'var(--ink-dim)',
    },
    danger: {
      background: 'transparent',
      borderColor: 'color-mix(in srgb, var(--bad) 40%, transparent)',
      color: 'var(--bad)',
    },
  };

  return (
    <button
      disabled={disabled}
      {...rest}
      style={{ ...base, ...variants[variant], ...style }}
    >
      {children}
    </button>
  );
}
