// ─────────────────────────────────────────────────────────────
// TwoFactorEnroll — enroll a TOTP factor for the current user.
// ─────────────────────────────────────────────────────────────
// Flow:
//   1. Mount → call enrollTotp() to create an unverified factor.
//      Returns a QR-code SVG (data URI) and a base32 secret.
//   2. User scans with Google Authenticator / Authy / 1Password
//      / etc., types the 6-digit code into the input.
//   3. Submit → verifyTotp({ factorId, code }) flips factor to
//      'verified' and the session AAL bumps to aal2.
//   4. We refresh the auth context and bounce back to /account.
// ─────────────────────────────────────────────────────────────

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Screen from '../../components/Screen.jsx';
import Card from '../../components/Card.jsx';
import Button from '../../components/Button.jsx';
import { enrollTotp, verifyTotp, unenrollFactor } from '../../lib/supabase.js';
import { useAuth } from '../../lib/auth.jsx';

export default function TwoFactorEnroll() {
  const navigate = useNavigate();
  const { refresh } = useAuth();
  const [factor, setFactor] = useState(null);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  useEffect(() => {
    let cancelled = false;
    let createdId = null;
    (async () => {
      try {
        const f = await enrollTotp('Engram');
        if (cancelled) {
          // If the user navigated away mid-enroll, clean up the
          // half-created unverified factor so they don't accumulate.
          if (f?.id) await unenrollFactor(f.id).catch(() => {});
        } else {
          createdId = f?.id;
          setFactor(f);
        }
      } catch (e) {
        if (!cancelled) setErr(e.message || 'Could not start enrollment.');
      }
    })();
    return () => {
      cancelled = true;
      // Leaving without verifying — drop the unverified factor.
      if (createdId) {
        unenrollFactor(createdId).catch(() => {});
      }
    };
  }, []);

  const verify = async (e) => {
    e.preventDefault();
    setErr(null);
    if (!factor?.id) return;
    if (code.length < 6) return setErr('Enter the 6-digit code from your authenticator.');
    setBusy(true);
    try {
      await verifyTotp({ factorId: factor.id, code });
      await refresh();
      navigate('/account', { replace: true });
    } catch (e) {
      setErr(e.message || 'Verification failed. Codes expire after 30 seconds — try the next one.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen
      label="Two-factor"
      title="Enable 2FA"
      subtitle="Bind a one-time code generator to your account."
      action={
        <button
          onClick={() => navigate('/account')}
          className="mono"
          style={{
            fontSize: 10,
            letterSpacing: '0.22em',
            color: 'var(--ink-dim)',
            textTransform: 'uppercase',
          }}
        >
          Cancel
        </button>
      }
    >
      <Card accent="#b197fc" style={{ marginBottom: 16 }}>
        <ol
          style={{
            margin: 0,
            paddingLeft: 20,
            color: 'var(--ink-soft)',
            fontSize: 14,
            lineHeight: 1.7,
          }}
        >
          <li>
            Install an authenticator app: <strong>1Password</strong>, <strong>Authy</strong>,{' '}
            <strong>Google Authenticator</strong>, or any TOTP-compatible vault.
          </li>
          <li>Scan the QR code below — or paste the secret manually.</li>
          <li>Enter the 6-digit code your app generates.</li>
        </ol>
      </Card>

      {!factor && !err && (
        <Card>
          <div
            className="mono"
            style={{
              fontSize: 10,
              letterSpacing: '0.22em',
              color: 'var(--ink-dim)',
              textTransform: 'uppercase',
              textAlign: 'center',
            }}
          >
            Generating QR code…
          </div>
        </Card>
      )}

      {err && !factor && (
        <Card style={{ borderColor: 'rgba(255,107,107,0.4)' }}>
          <div style={{ color: '#ff6b6b', fontSize: 13 }}>{err}</div>
        </Card>
      )}

      {factor && (
        <Card>
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              padding: 12,
              background: '#fff',
              borderRadius: 12,
              marginBottom: 18,
            }}
          >
            {/* Supabase returns the QR as an SVG data URI */}
            <img
              src={factor.totp.qr_code}
              alt="TOTP QR code"
              width={220}
              height={220}
              style={{ display: 'block' }}
            />
          </div>

          <div
            className="mono"
            style={{
              fontSize: 9,
              letterSpacing: '0.28em',
              color: 'var(--ink-dim)',
              textTransform: 'uppercase',
              marginBottom: 6,
              textAlign: 'center',
            }}
          >
            Or paste this secret
          </div>
          <div
            className="mono"
            style={{
              fontSize: 13,
              letterSpacing: '0.18em',
              color: 'var(--ink-soft)',
              textAlign: 'center',
              wordBreak: 'break-all',
              padding: '8px 12px',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid var(--border)',
              borderRadius: 6,
              marginBottom: 24,
            }}
          >
            {factor.totp.secret}
          </div>

          <form onSubmit={verify}>
            <div
              className="mono"
              style={{
                fontSize: 9,
                letterSpacing: '0.28em',
                color: 'var(--ink-dim)',
                textTransform: 'uppercase',
                marginBottom: 8,
              }}
            >
              6-digit code
            </div>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              autoComplete="one-time-code"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="••••••"
              style={{
                width: '100%',
                padding: '14px 0',
                fontSize: 32,
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
                {busy ? 'Verifying…' : 'Activate 2FA'}
              </Button>
            </div>
          </form>
        </Card>
      )}

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
        Once enabled, you'll need a code from your authenticator
        every time you sign in.
      </div>
    </Screen>
  );
}
