// ─────────────────────────────────────────────────────────────
// SignIn — combined sign-in / sign-up / magic-link / reset.
// ─────────────────────────────────────────────────────────────
// Mode tabs: "sign in" | "sign up" | "magic link" | "reset".
// On successful sign-in, useAuth refreshes; if a verified TOTP
// factor exists the AuthGate sends them to /signin/2fa next.
// ─────────────────────────────────────────────────────────────

import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Screen from '../../components/Screen.jsx';
import Card from '../../components/Card.jsx';
import Button from '../../components/Button.jsx';
import {
  signInWithPassword,
  signUpWithPassword,
  signInWithMagicLink,
  sendPasswordReset,
  hasSupabase,
} from '../../lib/supabase.js';
import { useAuth } from '../../lib/auth.jsx';

const MODES = [
  { id: 'in', label: 'Sign in' },
  { id: 'up', label: 'Sign up' },
  { id: 'magic', label: 'Magic link' },
  { id: 'reset', label: 'Reset' },
];

export default function SignIn() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = params.get('next') || '/';
  const { ready, isAuthed, needsMfaChallenge, configured } = useAuth();

  const [mode, setMode] = useState('in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [info, setInfo] = useState(null);

  // After auth completes, route the user out of /signin.
  useEffect(() => {
    if (!ready || !isAuthed) return;
    if (needsMfaChallenge) {
      navigate(`/signin/2fa?next=${encodeURIComponent(next)}`, { replace: true });
    } else {
      navigate(decodeURIComponent(next), { replace: true });
    }
  }, [ready, isAuthed, needsMfaChallenge, next, navigate]);

  const submit = async (e) => {
    e.preventDefault();
    setErr(null);
    setInfo(null);
    if (!email) return setErr('Email is required.');
    if (mode !== 'magic' && mode !== 'reset' && password.length < 8) {
      return setErr('Password must be at least 8 characters.');
    }
    setBusy(true);
    try {
      if (mode === 'in') {
        await signInWithPassword({ email, password });
      } else if (mode === 'up') {
        await signUpWithPassword({ email, password });
        setInfo("Account created. If email confirmation is enabled, check your inbox to verify before signing in.");
      } else if (mode === 'magic') {
        await signInWithMagicLink(email);
        setInfo('Check your inbox for a one-time sign-in link.');
      } else if (mode === 'reset') {
        await sendPasswordReset(email);
        setInfo('Password reset email sent.');
      }
    } catch (e) {
      setErr(e.message || 'Authentication failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen
      label="Engram account"
      title={mode === 'up' ? 'Create account' : mode === 'magic' ? 'Magic link' : mode === 'reset' ? 'Reset password' : 'Welcome back'}
      subtitle={
        mode === 'up'
          ? 'A few details, and your catalog syncs across devices.'
          : mode === 'magic'
            ? 'No password — we email you a one-time link.'
            : mode === 'reset'
              ? "We'll send a reset link to your inbox."
              : 'Sign in to sync, subscribe, and chat with your IRIS.'
      }
      action={
        <button
          onClick={() => navigate(-1)}
          className="mono"
          style={{
            fontSize: 10,
            letterSpacing: '0.22em',
            color: 'var(--ink-dim)',
            textTransform: 'uppercase',
          }}
        >
          Back
        </button>
      }
    >
      {!hasSupabase() && (
        <Card style={{ marginBottom: 16, borderColor: 'rgba(255,209,102,0.4)' }}>
          <div
            className="mono"
            style={{
              fontSize: 10,
              color: '#ffd166',
              letterSpacing: '0.04em',
              lineHeight: 1.6,
            }}
          >
            Auth backend not configured. Set VITE_SUPABASE_URL and
            VITE_SUPABASE_ANON_KEY in <code>.env</code>, then run{' '}
            <code>npm run build</code>. Engram still works fully
            offline without it.
          </div>
        </Card>
      )}

      {/* Mode tabs */}
      <div
        style={{
          display: 'flex',
          gap: 6,
          marginBottom: 18,
          overflowX: 'auto',
          paddingBottom: 4,
        }}
      >
        {MODES.map((m) => {
          const active = mode === m.id;
          return (
            <button
              key={m.id}
              onClick={() => {
                setMode(m.id);
                setErr(null);
                setInfo(null);
              }}
              style={{
                padding: '8px 16px',
                borderRadius: 999,
                border: `1px solid ${active ? 'var(--border-strong)' : 'var(--border)'}`,
                background: active ? 'var(--bg-raised)' : 'transparent',
                color: active ? 'var(--ink)' : 'var(--ink-dim)',
                fontFamily: 'var(--mono)',
                fontSize: 10,
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              {m.label}
            </button>
          );
        })}
      </div>

      <Card>
        <form onSubmit={submit} autoComplete="on">
          <Field
            label="Email"
            type="email"
            value={email}
            onChange={setEmail}
            autoComplete="email"
            disabled={!configured}
          />
          {(mode === 'in' || mode === 'up') && (
            <Field
              label="Password"
              type="password"
              value={password}
              onChange={setPassword}
              autoComplete={mode === 'up' ? 'new-password' : 'current-password'}
              disabled={!configured}
              hint={mode === 'up' ? '8+ characters' : undefined}
            />
          )}

          {err && (
            <div
              style={{
                marginTop: 12,
                fontSize: 13,
                color: '#ff6b6b',
                fontStyle: 'italic',
              }}
            >
              {err}
            </div>
          )}
          {info && (
            <div
              style={{
                marginTop: 12,
                fontSize: 13,
                color: '#63e6be',
                fontStyle: 'italic',
              }}
            >
              {info}
            </div>
          )}

          <div style={{ marginTop: 24 }}>
            <Button
              variant="solid"
              tone="#ffd166"
              full
              disabled={busy || !configured}
              type="submit"
            >
              {busy
                ? 'Working…'
                : mode === 'in'
                  ? 'Sign in'
                  : mode === 'up'
                    ? 'Create account'
                    : mode === 'magic'
                      ? 'Email me a link'
                      : 'Email reset link'}
            </Button>
          </div>
        </form>
      </Card>

      <div
        style={{
          marginTop: 20,
          textAlign: 'center',
          fontSize: 12,
          color: 'var(--ink-dim)',
          fontStyle: 'italic',
        }}
      >
        {mode === 'in' ? (
          <>
            New here?{' '}
            <button
              onClick={() => setMode('up')}
              style={{ color: '#ffd166', textDecoration: 'underline' }}
            >
              Create an account
            </button>
          </>
        ) : (
          <>
            Already have an account?{' '}
            <button
              onClick={() => setMode('in')}
              style={{ color: '#ffd166', textDecoration: 'underline' }}
            >
              Sign in
            </button>
          </>
        )}
      </div>

      <div
        className="mono"
        style={{
          marginTop: 24,
          textAlign: 'center',
          fontSize: 9,
          color: 'var(--ink-faint)',
          letterSpacing: '0.1em',
          lineHeight: 1.7,
        }}
      >
        Engram never sees your password.
        <br />
        TLS in transit, hashed at rest, RLS isolated by row.
      </div>
    </Screen>
  );
}

function Field({ label, type, value, onChange, autoComplete, disabled, hint }) {
  return (
    <label style={{ display: 'block', marginBottom: 18 }}>
      <div
        className="mono"
        style={{
          fontSize: 9,
          letterSpacing: '0.28em',
          color: 'var(--ink-dim)',
          textTransform: 'uppercase',
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        disabled={disabled}
        spellCheck={false}
        autoCapitalize="off"
        style={{
          width: '100%',
          padding: '12px 0',
          fontSize: 18,
          fontFamily: 'var(--serif)',
          color: 'var(--ink)',
          background: 'transparent',
          border: 'none',
          borderBottom: '1px solid var(--border-strong)',
          outline: 'none',
        }}
      />
      {hint && (
        <div
          className="mono"
          style={{ fontSize: 9, color: 'var(--ink-faint)', marginTop: 6 }}
        >
          {hint}
        </div>
      )}
    </label>
  );
}
