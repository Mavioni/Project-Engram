// ─────────────────────────────────────────────────────────────
// <AuthGate /> — wraps a route element to enforce auth + MFA.
// ─────────────────────────────────────────────────────────────
// Three states it can render:
//   1. Supabase not configured — render `unconfiguredFallback`
//      (or the default "backend required" panel) instead of
//      bouncing to /signin (there's no auth backend to sign in to).
//   2. Not signed in — redirect to /signin?next=<current path>.
//   3. Signed in but verified TOTP factor not yet challenged —
//      redirect to /signin/2fa?next=<current path>.
//   4. Fully authed (and AAL2 if MFA enrolled) — render children.
// ─────────────────────────────────────────────────────────────

import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth.jsx';

export default function AuthGate({ children, requireMfa = true, unconfiguredFallback }) {
  const { ready, configured, isAuthed, needsMfaChallenge } = useAuth();
  const location = useLocation();

  if (!ready) {
    return (
      <div
        style={{
          flex: 1,
          display: 'grid',
          placeItems: 'center',
          color: 'var(--ink-dim)',
          fontFamily: 'var(--mono)',
          fontSize: 10,
          letterSpacing: '0.3em',
          textTransform: 'uppercase',
          minHeight: '60vh',
        }}
      >
        Checking session…
      </div>
    );
  }

  if (!configured) {
    if (unconfiguredFallback) return unconfiguredFallback;
    return (
      <div
        style={{
          padding: 40,
          textAlign: 'center',
          color: 'var(--ink-soft)',
          fontStyle: 'italic',
          maxWidth: 460,
          margin: '60px auto',
        }}
      >
        Accounts and subscriptions need a Supabase backend. Engram still
        works fully offline — see <code style={{ color: '#ffd166' }}>README → Auth setup</code>.
      </div>
    );
  }

  const next = encodeURIComponent(location.pathname + location.search);

  if (!isAuthed) {
    return <Navigate to={`/signin?next=${next}`} replace />;
  }

  if (requireMfa && needsMfaChallenge) {
    return <Navigate to={`/signin/2fa?next=${next}`} replace />;
  }

  return children;
}
