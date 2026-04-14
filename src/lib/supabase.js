// ─────────────────────────────────────────────────────────────
// Supabase client + full auth surface (env-gated, lazy).
// ─────────────────────────────────────────────────────────────
// If VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are missing,
// getSupabase() returns null and every caller falls back to
// local-only behavior. This lets Engram run fully offline AND
// activate auth/MFA/cloud sync as soon as the user wires keys.
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
          flowType: 'pkce',
        },
      },
    );
    return cached;
  } catch (e) {
    console.error('Failed to initialize Supabase client', e);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────
// Session + identity
// ─────────────────────────────────────────────────────────────

export async function getSession() {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export async function getUser() {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  return data.user;
}

/**
 * Subscribe to auth state changes. Returns an unsubscribe function.
 *   onAuthChange(({event, session}) => ...)
 */
export function onAuthChange(callback) {
  const supabase = getSupabase();
  if (!supabase) return () => {};
  const { data } = supabase.auth.onAuthStateChange((event, session) => {
    callback({ event, session });
  });
  return () => data.subscription.unsubscribe();
}

// ─────────────────────────────────────────────────────────────
// Sign-up / sign-in / sign-out
// ─────────────────────────────────────────────────────────────

/**
 * Email + password sign-up. Supabase sends a confirmation email
 * if email confirmations are enabled in Auth settings.
 */
export async function signUpWithPassword({ email, password }) {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase not configured');
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: window.location.origin + '/account',
    },
  });
  if (error) throw error;
  return data;
}

export async function signInWithPassword({ email, password }) {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase not configured');
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
}

/** Magic-link sign-in (no password). Optional alternate flow. */
export async function signInWithMagicLink(email) {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase not configured');
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: window.location.origin + '/account' },
  });
  if (error) throw error;
}

export async function signOut() {
  const supabase = getSupabase();
  if (!supabase) return;
  await supabase.auth.signOut();
}

export async function sendPasswordReset(email) {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase not configured');
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin + '/account',
  });
  if (error) throw error;
}

export async function updatePassword(newPassword) {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase not configured');
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
}

// ─────────────────────────────────────────────────────────────
// Multi-factor auth (TOTP)
// ─────────────────────────────────────────────────────────────
//
// Supabase MFA model:
//   1. user signs in with password   → session AAL = aal1
//   2. if user has a verified TOTP factor, they MUST step up to
//      aal2 by completing a challenge before sensitive ops.
//   3. enroll() returns a QR-code SVG + secret. Caller renders
//      the QR; user scans with Authenticator/Authy/1Password.
//   4. caller submits the 6-digit TOTP code with verify().
//   5. once verified, factor.status flips from 'unverified' to
//      'verified' and the session AAL bumps to aal2.
//
// References:
//   https://supabase.com/docs/guides/auth/auth-mfa
// ─────────────────────────────────────────────────────────────

/** Returns the current session's Authenticator Assurance Level. */
export async function getAal() {
  const supabase = getSupabase();
  if (!supabase) return { current: null, next: null };
  const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (error) throw error;
  return data; // { currentLevel, nextLevel, currentAuthenticationMethods }
}

/** List all enrolled MFA factors for the current user. */
export async function listFactors() {
  const supabase = getSupabase();
  if (!supabase) return { totp: [], phone: [] };
  const { data, error } = await supabase.auth.mfa.listFactors();
  if (error) throw error;
  return data; // { all, totp, phone }
}

/**
 * Enroll a new TOTP factor. Returns the factor with a QR-code SVG
 * in `totp.qr_code` and the raw secret in `totp.secret`.
 */
export async function enrollTotp(friendlyName = 'Engram') {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase not configured');
  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: 'totp',
    friendlyName,
    issuer: 'Engram',
  });
  if (error) throw error;
  return data; // { id, type, totp: { qr_code, secret, uri } }
}

/**
 * Verify a TOTP code against an enrollment to flip it from
 * 'unverified' → 'verified'.
 */
export async function verifyTotp({ factorId, code }) {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase not configured');
  // First create a challenge, then verify it.
  const { data: challenge, error: challengeError } =
    await supabase.auth.mfa.challenge({ factorId });
  if (challengeError) throw challengeError;
  const { data, error } = await supabase.auth.mfa.verify({
    factorId,
    challengeId: challenge.id,
    code,
  });
  if (error) throw error;
  return data;
}

/** Remove a TOTP factor by ID. Drops session AAL back to aal1. */
export async function unenrollFactor(factorId) {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase not configured');
  const { data, error } = await supabase.auth.mfa.unenroll({ factorId });
  if (error) throw error;
  return data;
}

/**
 * Step-up authentication: post-sign-in the user must complete
 * a TOTP challenge to reach aal2. Used by TwoFactorChallenge screen.
 */
export async function challengeAndVerifyTotp({ factorId, code }) {
  return verifyTotp({ factorId, code });
}
