// ─────────────────────────────────────────────────────────────
// TwoFactorChallenge — step-up from AAL1 → AAL2 at sign-in.
// ─────────────────────────────────────────────────────────────
// Reached when AuthGate detects the user is signed in (aal1) but
// has a verified TOTP factor and hasn't completed the challenge
// for this session yet. Pulls the first verified TOTP factor and
// asks for a 6-digit code.
// ─────────────────────────────────────────────────────────────

import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Screen from '../../components/Screen.jsx';
import Card from '../../components/Card.jsx';
import Button from '../../components/Button.jsx';
import { challengeAndVerifyTotp, listFactors, signOut } from '../../lib/supabase.js';
import { useAuth } from '../../lib/auth.jsx';

export default function TwoFactorChallenge() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = params.get('next') || '/';
  const { refresh } = useAuth();

  const [factorId, setFactorId] = useState(null);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  useEffect(() => {
    listFactors()
      .then((data) => {
        const verified = (data?.totp || []).filter((f) => f.status === 'verified');
        if (verified.length === 0) {
          // No factor enrolled — bypass straight through.
          navigate(decodeURIComponent(next), { replace: true });
        } else {
          setFactorId(verified[0].id);
        }
      })
      .catch((e) => setErr(e.message));
  }, [navigate, next]);

  const submit = async (e) => {
    e.preventDefault();
    setErr(null);
    if (!factorId) return;
    if (code.length < 6) return setErr('Enter the 6-digit code from your authenticator.');
    setBusy(true);
    try {
      await challengeAndVerifyTotp({ factorId, code });
      await refresh();
      navigate(decodeURIComponent(next), { replace: true });
    } catch (e) {
      setErr(e.message || 'Code rejected. Codes expire every 30 seconds.');
    } finally {
      setBusy(false);
    }
  };

  const cancelAndSignOut = async () => {
    await signOut();
    navigate('/', { replace: true });
  };

  return (
    <Screen
      label="Two-factor"
      title="Verify it's you"
      subtitle="Enter the 6-digit code from your authenticator."
      action={
        <button
          onClick={cancelAndSignOut}
          className="mono"
          style={{
            fontSize: 10,
            letterSpacing: '0.22em',
            color: 'var(--ink-dim)',
            textTransform: 'uppercase',
          }}
        >
          Sign out
        </button>
      }
    >
      <Card>
        <form onSubmit={submit}>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            autoComplete="one-time-code"
            autoFocus
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="••••••"
            style={{
              width: '100%',
              padding: '20px 0',
              fontSize: 36,
              textAlign: 'center',
              letterSpacing: '0.5em',
              fontFamily: 'var(--mono)',
              color: 'var(--ink)',
              background: 'transparent',
              border: 'none',
              borderBottom: '1px solid var(--border-strong)',
              outline: 'none',
            }}
          />
          {err && (
            <div
              style={{
                marginTop: 12,
                fontSize: 13,
                color: '#ff6b6b',
                fontStyle: 'italic',
                textAlign: 'center',
              }}
            >
              {err}
            </div>
          )}
          <div style={{ marginTop: 24 }}>
            <Button
              variant="solid"
              tone="#b197fc"
              full
              disabled={busy || code.length !== 6}
              type="submit"
            >
              {busy ? 'Verifying…' : 'Continue'}
            </Button>
          </div>
        </form>
      </Card>

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
        Lost your authenticator? Sign out and use the recovery
        flow in your Supabase dashboard.
      </div>
    </Screen>
  );
}
