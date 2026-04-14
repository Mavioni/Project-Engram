// ─────────────────────────────────────────────────────────────
// Auth context + useAuth hook.
// ─────────────────────────────────────────────────────────────
// Wraps the supabase.js helpers in a React context that:
//   - hydrates the session from storage on mount
//   - subscribes to auth state changes (sign in/out, refresh, MFA)
//   - exposes user, session, AAL, factors, and isAuthed
//   - is safe to mount even when Supabase isn't configured
//     (everything just stays null and consumers degrade locally)
// ─────────────────────────────────────────────────────────────

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  getSession,
  getAal,
  listFactors,
  hasSupabase,
  onAuthChange,
} from './supabase.js';

const AuthContext = createContext({
  ready: false,
  configured: false,
  session: null,
  user: null,
  aal: null,        // { currentLevel, nextLevel }
  factors: null,    // { all, totp, phone }
  isAuthed: false,
  needsMfaChallenge: false,
  hasVerifiedTotp: false,
  refresh: async () => {},
});

export function AuthProvider({ children }) {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState(null);
  const [aal, setAal] = useState(null);
  const [factors, setFactors] = useState(null);

  const refresh = async () => {
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
  };

  useEffect(() => {
    refresh();
    if (!hasSupabase()) return;
    // Subscribe to auth changes and refresh the entire derived state.
    const unsub = onAuthChange(({ event, session: nextSession }) => {
      setSession(nextSession);
      // After any auth event, re-derive AAL + factors so the UI
      // immediately reflects MFA enrollment changes.
      Promise.all([
        getAal().catch(() => null),
        listFactors().catch(() => null),
      ]).then(([a, f]) => {
        setAal(a);
        setFactors(f);
      });
      // Useful breakpoints during dev:
      // SIGNED_IN | SIGNED_OUT | TOKEN_REFRESHED | USER_UPDATED | MFA_CHALLENGE_VERIFIED
      void event;
    });
    return unsub;
  }, []);

  const value = useMemo(() => {
    const user = session?.user || null;
    const isAuthed = Boolean(user);
    const verifiedTotp = (factors?.totp || []).filter((f) => f.status === 'verified');
    const hasVerifiedTotp = verifiedTotp.length > 0;
    // Step-up needed when the next required level (aal2) hasn't
    // been reached yet but the user has a verified TOTP factor.
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
      refresh,
    };
  }, [ready, session, aal, factors]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
