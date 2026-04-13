// ─────────────────────────────────────────────────────────────
// <Button /> — the single button primitive used across Engram.
// Variants: ghost (default), solid, subtle, danger.
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
  const accent = tone || '#ffffff';
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
    borderRadius: 4,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.4 : 1,
    transition: 'all 220ms ease',
    width: full ? '100%' : undefined,
    border: `1px solid ${accent}22`,
  };

  const variants = {
    ghost: {
      background: 'transparent',
      color: accent === '#ffffff' ? 'var(--ink-soft)' : accent,
    },
    solid: {
      background: `${accent}18`,
      borderColor: `${accent}55`,
      color: accent,
    },
    subtle: {
      background: 'transparent',
      borderColor: 'transparent',
      color: 'var(--ink-dim)',
    },
    danger: {
      background: 'transparent',
      borderColor: 'rgba(255,107,107,0.4)',
      color: '#ff6b6b',
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
