// ─────────────────────────────────────────────────────────────
// <TopBar /> — sticky top bar with the Engram mark on the left
// and a settings gear on the right.
// ─────────────────────────────────────────────────────────────
// Logo → /  (Dashboard)
// Gear → /settings
// Hidden on full-screen flows (/iris, /onboarding, /checkout).
// ─────────────────────────────────────────────────────────────

import { useNavigate, useLocation } from 'react-router-dom';

const HIDDEN_PREFIXES = ['/iris', '/onboarding', '/checkout'];

export default function TopBar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  if (HIDDEN_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + '/'))) {
    return null;
  }

  const onSettings = pathname === '/settings';

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 90,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 16px',
        paddingTop: 'calc(var(--safe-top) + 10px)',
        paddingLeft: 'calc(var(--safe-left) + 16px)',
        paddingRight: 'calc(var(--safe-right) + 16px)',
        background:
          'linear-gradient(180deg, color-mix(in srgb, var(--bg) 92%, transparent), color-mix(in srgb, var(--bg) 60%, transparent) 80%, transparent)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      {/* Logo → Dashboard */}
      <button
        onClick={() => navigate('/')}
        aria-label="Go to dashboard"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            background:
              'radial-gradient(circle, color-mix(in srgb, var(--accent) 70%, transparent) 0%, color-mix(in srgb, var(--d-emo) 45%, transparent) 40%, color-mix(in srgb, var(--d-cog) 35%, transparent) 70%, transparent 100%)',
            boxShadow: '0 0 14px color-mix(in srgb, var(--accent) 25%, transparent)',
            display: 'grid',
            placeItems: 'center',
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: 'var(--bg)',
            }}
          />
        </div>
        <span
          className="mono"
          style={{
            fontSize: 11,
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            color: 'var(--ink-soft)',
          }}
        >
          Engram
        </span>
      </button>

      {/* Settings gear */}
      <button
        onClick={() => navigate(onSettings ? '/' : '/settings')}
        aria-label={onSettings ? 'Close settings' : 'Open settings'}
        style={{
          width: 36,
          height: 36,
          display: 'grid',
          placeItems: 'center',
          background: onSettings ? 'var(--bg-raised)' : 'transparent',
          border: `1px solid ${onSettings ? 'var(--border-strong)' : 'transparent'}`,
          borderRadius: '50%',
          cursor: 'pointer',
          color: 'var(--ink-dim)',
          transition: 'all 220ms ease',
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
          <path
            d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </header>
  );
}
