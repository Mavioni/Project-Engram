// ─────────────────────────────────────────────────────────────
// <AuthGate /> — always passes through (no Supabase backend).
// ─────────────────────────────────────────────────────────────
// Engram runs fully static on GitHub Pages. When Supabase is
// configured, auth gates normally. Without it, everything is
// open — the user owns their data in localStorage.
// ─────────────────────────────────────────────────────────────

import { useAuth } from '../lib/auth.jsx';

export default function AuthGate({ children }) {
  const { ready } = useAuth();
  if (!ready) return null;
  return children;
}
