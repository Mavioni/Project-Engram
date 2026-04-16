// ─────────────────────────────────────────────────────────────
// <TopBar /> — sticky top bar with the Engram iris mark.
// ─────────────────────────────────────────────────────────────
// Clicking the mark navigates to / (the Home dashboard).
// Hidden on full-screen flows (/iris, /onboarding, /checkout)
// so it doesn't compete with the IRIS 3D scene.
// ─────────────────────────────────────────────────────────────

import { useNavigate, useLocation } from 'react-router-dom';

const HIDDEN_PREFIXES = ['/iris', '/onboarding', '/checkout'];

export default function TopBar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  if (HIDDEN_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + '/'))) {
    return null;
  }

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
        padding: '10px 16px',
        paddingTop: 'calc(var(--safe-top) + 10px)',
        background: 'linear-gradient(180deg, rgba(6,6,14,0.92), rgba(6,6,14,0.6) 80%, transparent)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        pointerEvents: 'auto',
      }}
    >
      <button
        onClick={() => navigate('/')}
        aria-label="Go home"
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
        {/* Iris mark — tiny version of the icon */}
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(255,209,102,0.65) 0%, rgba(255,107,138,0.4) 40%, rgba(126,181,255,0.3) 70%, transparent 100%)',
            boxShadow: '0 0 14px rgba(255,209,102,0.3)',
            display: 'grid',
            placeItems: 'center',
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: '#06060e',
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
    </header>
  );
}
