// ─────────────────────────────────────────────────────────────
// Auth context + useAuth hook.
// ─────────────────────────────────────────────────────────────
// Wraps the supabase.js helpers in React contexts that:
//   - hydrate the session from storage on mount
//   - subscribe to auth state changes (sign in/out, refresh, MFA)
//   - expose user, session, AAL, factors, and isAuthed
//   - are safe to mount even when Supabase isn't configured
//
// Split into two contexts:
//   AuthSessionContext — session-derived state (changes on auth events)
//   AuthActionsContext — stable action refs (never changes)
// Consumers that only call refresh/signOut don't re-render on session
// changes — they grab actions from the actions context only.
// ─────────────────────────────────────────────────────────────

import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import {
  getSession,
  getAal,
  listFactors,
  hasSupabase,
  onAuthChange,
} from './supabase.js';

const AuthSessionContext = createContext({
  ready: false,
  configured: false,
  session: null,
  user: null,
  aal: null,
  factors: null,
  isAuthed: false,
  needsMfaChallenge: false,
  hasVerifiedTotp: false,
});

const AuthActionsContext = createContext({
  refresh: async () => {},
});

export function AuthProvider({ children }) {
  const [ready, setReady] = useState(() => !hasSupabase());
  const [session, setSession] = useState(null);
  const [aal, setAal] = useState(null);
  const [factors, setFactors] = useState(null);

  const refresh = useCallback(async () => {
    if (!hasSupabase()) {
      setReady(true);
      return;
    }
    try {
      const [s, a, f] = await Promise.all([
        getSession(),
        getAal().catch(() => null),
        listFactors().catch(() => null),
      ]);
      setSession(s);
      setAal(a);
      setFactors(f);
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    if (!hasSupabase()) return undefined;
    queueMicrotask(() => {
      void refresh();
    });
    const unsub = onAuthChange(({ event, session: nextSession }) => {
      setSession(nextSession);
      Promise.all([
        getAal().catch(() => null),
        listFactors().catch(() => null),
      ]).then(([a, f]) => {
        setAal(a);
        setFactors(f);
      });
      void event;
    });
    return unsub;
  }, [refresh]);

  // Session-derived state — changes on auth events
  const sessionValue = useMemo(() => {
    const user = session?.user || null;
    const isAuthed = Boolean(user);
    const verifiedTotp = (factors?.totp || []).filter((f) => f.status === 'verified');
    const hasVerifiedTotp = verifiedTotp.length > 0;
    const needsMfaChallenge =
      isAuthed &&
      hasVerifiedTotp &&
      aal &&
      aal.currentLevel === 'aal1' &&
      aal.nextLevel === 'aal2';

    return {
      ready,
      configured: hasSupabase(),
      session,
      user,
      aal,
      factors,
      isAuthed,
      needsMfaChallenge,
      hasVerifiedTotp,
    };
  }, [ready, session, aal, factors]);

  // Actions — stable, never changes
  const actionsValue = useMemo(() => ({ refresh }), [refresh]);

  return (
    <AuthSessionContext.Provider value={sessionValue}>
      <AuthActionsContext.Provider value={actionsValue}>
        {children}
      </AuthActionsContext.Provider>
    </AuthSessionContext.Provider>
  );
}

/** Full auth state — use when you need session/user/MFA info. */
export function useAuth() {
  return useContext(AuthSessionContext);
}

/** Stable auth actions — use when you only call refresh/signOut. */
export function useAuthActions() {
  return useContext(AuthActionsContext);
}
