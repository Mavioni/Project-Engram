// ─────────────────────────────────────────────────────────────
// <Screen /> — the consistent page frame used by every tab.
// Handles safe-area insets, the bottom-nav offset, and the
// canonical header (label + optional right-aligned action).
// ─────────────────────────────────────────────────────────────

export default function Screen({
  label,
  title,
  subtitle,
  action,
  children,
  scroll = true,
  padBottom = true,
}) {
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        paddingTop: 'var(--safe-top)',
        paddingLeft: 'var(--safe-left)',
        paddingRight: 'var(--safe-right)',
      }}
    >
      {(label || title || action) && (
        <header
          style={{
            padding: '16px 20px 8px',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <div style={{ minWidth: 0, flex: 1 }}>
            {label && (
              <div
                className="mono"
                style={{
                  fontSize: 9,
                  letterSpacing: '0.3em',
                  color: 'var(--ink-dim)',
                  textTransform: 'uppercase',
                  marginBottom: 4,
                }}
              >
                {label}
              </div>
            )}
            {title && (
              <h1
                style={{
                  fontSize: 28,
                  fontWeight: 300,
                  margin: 0,
                  color: 'var(--ink)',
                  letterSpacing: '0.02em',
                  fontFamily: 'var(--serif)',
                }}
              >
                {title}
              </h1>
            )}
            {subtitle && (
              <div
                style={{
                  fontSize: 14,
                  color: 'var(--ink-soft)',
                  marginTop: 2,
                  fontStyle: 'italic',
                }}
              >
                {subtitle}
              </div>
            )}
          </div>
          {action && <div>{action}</div>}
        </header>
      )}
      <div
        style={{
          flex: 1,
          overflowY: scroll ? 'auto' : 'hidden',
          padding: '8px 20px',
          paddingBottom: padBottom
            ? `calc(var(--nav-height) + var(--safe-bottom) + 24px)`
            : undefined,
        }}
      >
        {children}
      </div>
    </div>
  );
}
