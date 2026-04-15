// ─────────────────────────────────────────────────────────────
// Account — the authenticated user's hub.
// ─────────────────────────────────────────────────────────────
// Shows email, sign-in method, AAL, MFA status, and the actions
// for: enabling/disabling 2FA, signing out, opening billing portal.
// ─────────────────────────────────────────────────────────────

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Screen from '../../components/Screen.jsx';
import Card from '../../components/Card.jsx';
import Button from '../../components/Button.jsx';
import { useAuth } from '../../lib/auth.jsx';
import { signOut, unenrollFactor } from '../../lib/supabase.js';
import { hasStripe, openBillingPortal } from '../../lib/stripe.js';
import { useStore } from '../../lib/store.js';

export default function Account() {
  const navigate = useNavigate();
  const { user, aal, factors, refresh, hasVerifiedTotp } = useAuth();
  const subscription = useStore((s) => s.subscription);
  const [busy, setBusy] = useState(null);
  const [err, setErr] = useState(null);

  const verifiedTotp = (factors?.totp || []).filter((f) => f.status === 'verified');

  const doSignOut = async () => {
    setBusy('signout');
    try {
      await signOut();
      await refresh();
      navigate('/', { replace: true });
    } finally {
      setBusy(null);
    }
  };

  const doDisable2fa = async () => {
    setErr(null);
    setBusy('disable2fa');
    try {
      for (const f of verifiedTotp) {
        await unenrollFactor(f.id);
      }
      await refresh();
    } catch (e) {
      setErr(e.message || 'Could not disable 2FA.');
    } finally {
      setBusy(null);
    }
  };

  const doBillingPortal = async () => {
    setErr(null);
    setBusy('billing');
    try {
      await openBillingPortal();
    } catch (e) {
      setErr(e.message || 'Could not open billing portal.');
      setBusy(null);
    }
  };

  return (
    <Screen
      label="Engram account"
      title="Account"
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
      {/* Email + AAL */}
      <Card style={{ marginBottom: 14 }}>
        <Row label="Email" value={user?.email || '—'} />
        <Row
          label="Verified"
          value={user?.email_confirmed_at ? 'Yes' : 'Pending email confirmation'}
        />
        <Row
          label="Auth level"
          value={aal?.currentLevel === 'aal2' ? 'AAL2 (2FA verified)' : 'AAL1'}
          good={aal?.currentLevel === 'aal2'}
        />
        <div style={{ marginTop: 12 }}>
          <Button
            variant="ghost"
            size="sm"
            onClick={doSignOut}
            disabled={busy === 'signout'}
          >
            {busy === 'signout' ? 'Signing out…' : 'Sign out'}
          </Button>
        </div>
      </Card>

      {/* 2FA */}
      <Card accent={hasVerifiedTotp ? '#63e6be' : '#b197fc'} style={{ marginBottom: 14 }}>
        <div
          className="mono"
          style={{
            fontSize: 9,
            letterSpacing: '0.3em',
            color: hasVerifiedTotp ? '#63e6be' : 'var(--ink-dim)',
            textTransform: 'uppercase',
            marginBottom: 8,
          }}
        >
          Two-factor authentication
        </div>
        {hasVerifiedTotp ? (
          <>
            <div style={{ fontSize: 18, color: 'var(--ink)' }}>Enabled</div>
            <p
              style={{
                margin: '4px 0 14px',
                color: 'var(--ink-soft)',
                fontStyle: 'italic',
                fontSize: 13,
              }}
            >
              You&rsquo;ll need a code from your authenticator on every sign-in.
            </p>
            <Button variant="danger" size="sm" onClick={doDisable2fa} disabled={busy === 'disable2fa'}>
              {busy === 'disable2fa' ? 'Disabling…' : 'Disable 2FA'}
            </Button>
          </>
        ) : (
          <>
            <div style={{ fontSize: 18, color: 'var(--ink)' }}>Not enabled</div>
            <p
              style={{
                margin: '4px 0 14px',
                color: 'var(--ink-soft)',
                fontStyle: 'italic',
                fontSize: 13,
                lineHeight: 1.6,
              }}
            >
              Bind your Engram account to an authenticator app for a second
              factor on every sign-in.
            </p>
            <Button
              variant="solid"
              tone="#b197fc"
              size="sm"
              onClick={() => navigate('/account/2fa')}
            >
              Enable 2FA →
            </Button>
          </>
        )}
      </Card>

      {/* Subscription */}
      <Card
        style={{ marginBottom: 14 }}
        accent={subscription?.tier === 'pro' ? '#ffd166' : undefined}
      >
        <div
          className="mono"
          style={{
            fontSize: 9,
            letterSpacing: '0.3em',
            color: 'var(--ink-dim)',
            textTransform: 'uppercase',
            marginBottom: 8,
          }}
        >
          Plan
        </div>
        <div style={{ fontSize: 22, fontWeight: 300, color: subscription?.tier === 'pro' ? '#ffd166' : 'var(--ink)' }}>
          {subscription?.tier === 'pro' ? 'Engram Pro' : 'Free'}
        </div>
        <div style={{ fontSize: 13, color: 'var(--ink-soft)', fontStyle: 'italic' }}>
          {subscription?.status === 'active'
            ? 'Active'
            : subscription?.tier === 'pro'
              ? subscription.status
              : '3 free Claude insights / month'}
        </div>
        <div style={{ marginTop: 14, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {subscription?.tier === 'pro' ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={doBillingPortal}
              disabled={busy === 'billing' || !hasStripe()}
            >
              {busy === 'billing' ? 'Opening…' : 'Manage billing'}
            </Button>
          ) : (
            <Button
              variant="solid"
              tone="#ffd166"
              size="sm"
              onClick={() => navigate('/pricing')}
            >
              Upgrade to Pro
            </Button>
          )}
        </div>
      </Card>

      {err && (
        <Card style={{ borderColor: 'rgba(255,107,107,0.4)' }}>
          <div style={{ color: '#ff6b6b', fontSize: 13 }}>{err}</div>
        </Card>
      )}
    </Screen>
  );
}

function Row({ label, value, good }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 12,
        padding: '8px 0',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <div
        className="mono"
        style={{
          fontSize: 9,
          letterSpacing: '0.24em',
          color: 'var(--ink-dim)',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 14,
          color: good ? '#63e6be' : 'var(--ink-soft)',
          textAlign: 'right',
          wordBreak: 'break-all',
          maxWidth: '60%',
        }}
      >
        {value}
      </div>
    </div>
  );
}
