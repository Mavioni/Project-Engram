// ─────────────────────────────────────────────────────────────
// <Card /> — the reusable raised surface. Theme-aware.
// ─────────────────────────────────────────────────────────────

export default function Card({ accent, padding = 20, style, children, ...rest }) {
  return (
    <div
      {...rest}
      style={{
        position: 'relative',
        padding,
        borderRadius: 14,
        background: 'var(--bg-raised)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-card)',
        overflow: 'hidden',
        ...style,
      }}
    >
      {accent && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 1,
            background: `linear-gradient(90deg, transparent, ${accent}, transparent)`,
          }}
        />
      )}
      {children}
    </div>
  );
}
