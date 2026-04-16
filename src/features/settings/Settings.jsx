// ─────────────────────────────────────────────────────────────
// Settings — the one admin surface for the app.
// ─────────────────────────────────────────────────────────────
// Consolidates what was previously scattered across You, parts
// of Home, and the "Danger zone" card:
//   • Name / display name
//   • Theme (light / dark)
//   • Account (email, AAL, sign out) if configured
//   • Subscription status + link to Pricing
//   • IRIS management — re-run the simulation, clear results
//   • Danger zone — hard reset local data
//   • Backend status indicators
//
// Scrollable, calmly-spaced, one card per concern.
// ─────────────────────────────────────────────────────────────

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Screen from '../../components/Screen.jsx';
import Card from '../../components/Card.jsx';
import Button from '../../components/Button.jsx';
import { Divider } from '../../components/SacredGeometry.jsx';
import { useStore } from '../../lib/store.js';
import { useTheme } from '../../lib/theme.js';
import { useAuth } from '../../lib/auth.jsx';
import { signOut } from '../../lib/supabase.js';
import { hasSupabase } from '../../lib/supabase.js';
import { hasStripe } from '../../lib/stripe.js';

export default function Settings() {
  const navigate = useNavigate();
  const { theme, toggle } = useTheme();
  const profile = useStore((s) => s.profile);
  const iris = useStore((s) => s.iris);
  const subscription = useStore((s) => s.subscription);
  const setName = useStore((s) => s.setName);
  const clearIris = useStore((s) => s.clearIris);
  const hardReset = useStore((s) => s.hardReset);
  const auth = useAuth();

  const [editName, setEditName] = useState(false);
  const [nameDraft, setNameDraft] = useState(profile.name);
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmClearIris, setConfirmClearIris] = useState(false);
  const [busy, setBusy] = useState(null);

  const doSignOut = async () => {
    setBusy('signout');
    try {
      await signOut();
      await auth.refresh();
    } finally {
      setBusy(null);
    }
  };

  return (
    <Screen label="Your app" title="Settings">
      {/* ── Display name ── */}
      <Card style={{ marginBottom: 12 }}>
        <SectionTitle>Called</SectionTitle>
        {editName ? (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              placeholder="What should Engram call you?"
              autoFocus
              style={{
                flex: 1,
                fontSize: 20,
                padding: '6px 0',
                borderBottom: '1px solid var(--border-strong)',
                color: 'var(--ink)',
              }}
            />
            <Button
              variant="solid"
              size="sm"
              tone="var(--accent)"
              onClick={() => {
                setName(nameDraft.trim());
                setEditName(false);
              }}
            >
              Save
            </Button>
          </div>
        ) : (
          <button
            onClick={() => {
              setNameDraft(profile.name);
              setEditName(true);
            }}
            style={{
              fontSize: 22,
              fontWeight: 400,
              color: profile.name ? 'var(--ink)' : 'var(--ink-dim)',
              fontStyle: profile.name ? 'normal' : 'italic',
              cursor: 'pointer',
              background: 'none',
              border: 'none',
              padding: 0,
              textAlign: 'left',
            }}
          >
            {profile.name || 'Tap to set a name'}
          </button>
        )}
      </Card>

      {/* ── Theme toggle ── */}
      <Card style={{ marginBottom: 12 }}>
        <SectionTitle>Appearance</SectionTitle>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <div>
            <div style={{ fontSize: 16, color: 'var(--ink)' }}>
              {theme === 'dark' ? 'Dark mode' : 'Light mode'}
            </div>
            <div
              style={{
                fontSize: 12,
                color: 'var(--ink-soft)',
                fontStyle: 'italic',
                marginTop: 2,
              }}
            >
              {theme === 'dark'
                ? 'Cosmic backdrop, reverent and quiet.'
                : 'Warm, airy, ready for daylight.'}
            </div>
          </div>
          <ThemeSwitch theme={theme} onToggle={toggle} />
        </div>
      </Card>

      {/* ── Account (auth-aware) ── */}
      {auth.configured && (
        <Card style={{ marginBottom: 12 }}>
          <SectionTitle>Account</SectionTitle>
          {auth.isAuthed ? (
            <div>
              <div style={{ fontSize: 16, color: 'var(--ink)', wordBreak: 'break-all' }}>
                {auth.user?.email}
              </div>
              <div
                className="mono"
                style={{
                  fontSize: 10,
                  color: auth.hasVerifiedTotp ? 'var(--good)' : 'var(--ink-dim)',
                  marginTop: 4,
                  letterSpacing: '0.04em',
                }}
              >
                {auth.hasVerifiedTotp ? '2FA enabled · AAL2' : '2FA off · AAL1'}
              </div>
              <div style={{ marginTop: 12, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <Button variant="ghost" size="sm" onClick={() => navigate('/account')}>
                  Manage account
                </Button>
                <Button
                  variant="subtle"
                  size="sm"
                  onClick={doSignOut}
                  disabled={busy === 'signout'}
                >
                  {busy === 'signout' ? 'Signing out…' : 'Sign out'}
                </Button>
              </div>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: 16, color: 'var(--ink)' }}>Not signed in</div>
              <p
                style={{
                  margin: '4px 0 14px',
                  color: 'var(--ink-soft)',
                  fontStyle: 'italic',
                  fontSize: 13,
                  lineHeight: 1.6,
                }}
              >
                Sign in to sync across devices, subscribe, and chat with your IRIS.
              </p>
              <Button
                variant="solid"
                tone="var(--accent)"
                size="sm"
                onClick={() => navigate('/signin')}
              >
                Sign in / Sign up
              </Button>
            </div>
          )}
        </Card>
      )}

      {/* ── Subscription ── */}
      <Card style={{ marginBottom: 12 }}>
        <SectionTitle>Plan</SectionTitle>
        <div style={{ fontSize: 20, color: 'var(--ink)' }}>
          {subscription.tier === 'pro' ? 'Engram Pro' : 'Free'}
        </div>
        <div style={{ fontSize: 13, color: 'var(--ink-soft)', fontStyle: 'italic', marginTop: 2 }}>
          {subscription.tier === 'pro'
            ? 'Unlimited Claude insights + chat'
            : '3 free Claude insights per month'}
        </div>
        <div style={{ marginTop: 12 }}>
          <Button
            variant={subscription.tier === 'pro' ? 'ghost' : 'solid'}
            tone="var(--accent)"
            size="sm"
            onClick={() => navigate('/pricing')}
            disabled={!hasStripe()}
          >
            {subscription.tier === 'pro' ? 'Manage plan' : 'Upgrade to Pro'}
          </Button>
        </div>
      </Card>

      <Divider glyph="vesica" glyphSize={20} margin="16px 0" />

      {/* ── IRIS management ── */}
      <Card style={{ marginBottom: 12 }}>
        <SectionTitle>Your IRIS</SectionTitle>
        {iris.enneagramType ? (
          <div>
            <div style={{ fontSize: 14, color: 'var(--ink-soft)' }}>
              Type {iris.enneagramType} · last mapped{' '}
              {iris.takenAt ? new Date(iris.takenAt).toLocaleDateString() : '—'}
            </div>
            <div style={{ marginTop: 12, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <Button variant="ghost" size="sm" onClick={() => navigate('/iris')}>
                Re-run IRIS
              </Button>
              {confirmClearIris ? (
                <>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => {
                      clearIris();
                      setConfirmClearIris(false);
                    }}
                  >
                    Yes, clear results
                  </Button>
                  <Button
                    variant="subtle"
                    size="sm"
                    onClick={() => setConfirmClearIris(false)}
                  >
                    Cancel
                  </Button>
                </>
              ) : (
                <Button
                  variant="subtle"
                  size="sm"
                  onClick={() => setConfirmClearIris(true)}
                >
                  Clear IRIS results
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: 14, color: 'var(--ink-soft)' }}>Not mapped yet.</div>
            <div style={{ marginTop: 12 }}>
              <Button variant="solid" tone="var(--accent)" size="sm" onClick={() => navigate('/iris')}>
                Begin the simulation
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* ── Backend status ── */}
      <Card style={{ marginBottom: 12 }}>
        <SectionTitle>Backend</SectionTitle>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <StatusRow label="Local storage" on />
          <StatusRow label="Supabase sync" on={hasSupabase()} />
          <StatusRow label="Stripe billing" on={hasStripe()} />
        </div>
        <div
          className="mono"
          style={{
            marginTop: 12,
            fontSize: 9,
            color: 'var(--ink-faint)',
            letterSpacing: '0.04em',
            lineHeight: 1.6,
          }}
        >
          Engram works fully offline. Cloud features light up when env vars are set.
        </div>
      </Card>

      <Divider glyph="merkaba" glyphSize={20} margin="16px 0" />

      {/* ── Danger zone ── */}
      <Card style={{ marginBottom: 24, borderColor: 'rgba(220, 38, 38, 0.25)' }}>
        <div
          className="mono"
          style={{
            fontSize: 9,
            letterSpacing: '0.3em',
            color: 'var(--bad)',
            textTransform: 'uppercase',
            marginBottom: 10,
          }}
        >
          Danger zone
        </div>
        {confirmReset ? (
          <div>
            <p
              style={{
                color: 'var(--ink-soft)',
                fontStyle: 'italic',
                marginTop: 0,
                marginBottom: 12,
                fontSize: 13,
                lineHeight: 1.6,
              }}
            >
              This erases every entry, note, battle, IRIS result, and XP — locally.
              Cloud data, if configured, stays intact.
            </p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <Button
                variant="danger"
                size="sm"
                onClick={() => {
                  hardReset();
                  setConfirmReset(false);
                  navigate('/');
                }}
              >
                Yes, erase everything
              </Button>
              <Button variant="subtle" size="sm" onClick={() => setConfirmReset(false)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button variant="danger" size="sm" onClick={() => setConfirmReset(true)}>
            Reset local data
          </Button>
        )}
      </Card>

      <div
        className="mono"
        style={{
          textAlign: 'center',
          fontSize: 9,
          color: 'var(--ink-faint)',
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          marginTop: 4,
          paddingBottom: 12,
        }}
      >
        Engram · v0.1.0 · Eclipse Ventures LLC
      </div>
    </Screen>
  );
}

// ─────────────────────────────────────────────────────────────

function SectionTitle({ children }) {
  return (
    <div
      className="mono"
      style={{
        fontSize: 9,
        letterSpacing: '0.3em',
        color: 'var(--ink-dim)',
        textTransform: 'uppercase',
        marginBottom: 10,
      }}
    >
      {children}
    </div>
  );
}

function StatusRow({ label, on }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: on ? 'var(--good)' : 'var(--border)',
          boxShadow: on ? '0 0 8px color-mix(in srgb, var(--good) 60%, transparent)' : 'none',
        }}
      />
      <div style={{ fontSize: 14, color: 'var(--ink-soft)' }}>{label}</div>
      <div style={{ flex: 1 }} />
      <div
        className="mono"
        style={{
          fontSize: 9,
          letterSpacing: '0.18em',
          color: on ? 'var(--good)' : 'var(--ink-faint)',
          textTransform: 'uppercase',
        }}
      >
        {on ? 'Connected' : 'Off'}
      </div>
    </div>
  );
}

function ThemeSwitch({ theme, onToggle }) {
  const isDark = theme === 'dark';
  return (
    <button
      role="switch"
      aria-checked={isDark}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      onClick={onToggle}
      style={{
        width: 54,
        height: 30,
        borderRadius: 999,
        background: isDark ? 'var(--ink)' : 'var(--border)',
        position: 'relative',
        cursor: 'pointer',
        border: 'none',
        transition: 'background 260ms ease',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 3,
          left: isDark ? 27 : 3,
          width: 24,
          height: 24,
          borderRadius: '50%',
          background: isDark ? '#ffd166' : '#ffffff',
          boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
          transition: 'left 260ms cubic-bezier(.3,1.3,.6,1)',
          fontSize: 12,
          display: 'grid',
          placeItems: 'center',
          color: isDark ? '#06060e' : '#d97706',
        }}
      >
        {isDark ? '☽' : '☀'}
      </div>
    </button>
  );
}
