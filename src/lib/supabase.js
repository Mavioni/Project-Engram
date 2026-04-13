// ─────────────────────────────────────────────────────────────
// Supabase client — env-gated, lazy-initialized.
// ─────────────────────────────────────────────────────────────
// If VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are missing,
// getSupabase() returns null and every caller falls back to
// local-only behavior. This is how Engram stays fully offline
// without breaking when a user later adds a backend.
// ─────────────────────────────────────────────────────────────

import { createClient } from '@supabase/supabase-js';

let cached = null;
let attempted = false;

export function hasSupabase() {
  return Boolean(
    import.meta.env.VITE_SUPABASE_URL &&
      import.meta.env.VITE_SUPABASE_ANON_KEY,
  );
}

export function getSupabase() {
  if (cached) return cached;
  if (attempted) return null;
  attempted = true;
  if (!hasSupabase()) return null;
  try {
    cached = createClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_ANON_KEY,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      },
    );
    return cached;
  } catch (e) {
    console.error('Failed to initialize Supabase client', e);
    return null;
  }
}

/**
 * Magic-link sign-in. Caller should render a "check your email"
 * state; Supabase handles the redirect back.
 */
export async function signInWithEmail(email) {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase not configured');
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: window.location.origin },
  });
  if (error) throw error;
}

export async function signOut() {
  const supabase = getSupabase();
  if (!supabase) return;
  await supabase.auth.signOut();
}

export async function getSession() {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session;
}
