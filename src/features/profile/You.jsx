// ─────────────────────────────────────────────────────────────
// You — the profile tab. Shows IRIS results, subscription status,
// and settings. Entry point for re-running the assessment.
// ─────────────────────────────────────────────────────────────

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Screen from '../../components/Screen.jsx';
import Card from '../../components/Card.jsx';
import Button from '../../components/Button.jsx';
import Emoji from '../../components/Emoji.jsx';
import FacetRadar from '../insights/charts/FacetRadar.jsx';
import {
  Sigil,
  Merkaba,
  EnneagramGlyph,
  FlowerOfLife,
  Divider,
} from '../../components/SacredGeometry.jsx';
import { useStore } from '../../lib/store.js';
import { hasStripe } from '../../lib/stripe.js';
import { hasSupabase } from '../../lib/supabase.js';
import { useAuth } from '../../lib/auth.jsx';

const ENNEAGRAM_NAMES = {
  1: 'The Reformer',
  2: 'The Helper',
  3: 'The Achiever',
  4: 'The Individualist',
  5: 'The Investigator',
  6: 'The Loyalist',
  7: 'The Enthusiast',
  8: 'The Challenger',
  9: 'The Peacemaker',
};

const ENNEAGRAM_COLORS = {
  1: '#e8e8e8',
  2: '#ff8fa3',
  3: '#ffd43b',
  4: '#9775fa',
  5: '#74c0fc',
  6: '#63e6be',
  7: '#ffa94d',
  8: '#ff6b6b',
  9: '#a9e34b',
};

export default function You() {
  const navigate = useNavigate();
  const profile = useStore((s) => s.profile);
  const iris = useStore((s) => s.iris);
  const subscription = useStore((s) => s.subscription);
  const setName = useStore((s) => s.setName);
  const hardReset = useStore((s) => s.hardReset);

  const [editName, setEditName] = useState(false);
  const [nameDraft, setNameDraft] = useState(profile.name);
  const [confirmReset, setConfirmReset] = useState(false);

  const enneColor = iris.enneagramType ? ENNEAGRAM_COLORS[iris.enneagramType] : '#fff';
  const enneName = iris.enneagramType ? ENNEAGRAM_NAMES[iris.enneagramType] : null;

  const auth = useAuth();

  return (
    <Screen label="Your profile" title="You">
      {/* Account banner — sign in / account link */}
      <Card
        style={{ marginBottom: 14 }}
        accent={auth.isAuthed ? (auth.hasVerifiedTotp ? '#63e6be' : '#ffd166') : undefined}
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
          Account
        </div>
        {!auth.configured ? (
          <div style={{ fontSize: 14, color: 'var(--ink-soft)', fontStyle: 'italic' }}>
            Local-only mode. Configure Supabase to enable accounts, sync, and Pro.
          </div>
        ) : auth.isAuthed ? (
          <div>
            <div style={{ fontSize: 18, color: 'var(--ink)', wordBreak: 'break-all' }}>
              {auth.user?.email}
            </div>
            <div
              className="mono"
              style={{
                fontSize: 10,
                color: auth.hasVerifiedTotp ? '#63e6be' : 'var(--ink-dim)',
                marginTop: 4,
                letterSpacing: '0.04em',
              }}
            >
              {auth.hasVerifiedTotp ? '2FA enabled · AAL2' : '2FA off · AAL1'}
            </div>
            <div style={{ marginTop: 12 }}>
              <Button variant="ghost" size="sm" onClick={() => navigate('/account')}>
                Manage account →
              </Button>
            </div>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: 18, color: 'var(--ink)' }}>Not signed in</div>
            <p
              style={{
                margin: '4px 0 14px',
                color: 'var(--ink-soft)',
                fontStyle: 'italic',
                fontSize: 13,
                lineHeight: 1.6,
              }}
            >
              Engram works fully offline. Sign in to sync, subscribe to Pro,
              and chat with your IRIS.
            </p>
            <Button variant="solid" tone="#ffd166" size="sm" onClick={() => navigate('/signin')}>
              Sign in / Sign up
            </Button>
          </div>
        )}
      </Card>

      {/* Name */}
      <Card style={{ marginBottom: 14 }}>
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
          Called
        </div>
        {editName ? (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              placeholder="What should Engram call you?"
              style={{
                flex: 1,
                fontSize: 22,
                padding: '6px 0',
                borderBottom: '1px solid var(--border-strong)',
                color: 'var(--ink)',
              }}
              autoFocus
            />
            <Button
              variant="solid"
              size="sm"
              tone="#ffd166"
              onClick={() => {
                setName(nameDraft.trim());
                setEditName(false);
              }}
            >
              Save
            </Button>
          </div>
        ) : (
          <div
            onClick={() => {
              setNameDraft(profile.name);
              setEditName(true);
            }}
            style={{
              fontSize: 26,
              fontWeight: 300,
              color: profile.name ? 'var(--ink)' : 'var(--ink-dim)',
              fontStyle: profile.name ? 'normal' : 'italic',
              cursor: 'pointer',
            }}
          >
            {profile.name || 'Tap to set a name'}
          </div>
        )}
      </Card>

      {/* IRIS results */}
      {iris.enneagramType ? (
        <Card
          style={{ marginBottom: 14, position: 'relative', overflow: 'hidden' }}
          accent={enneColor}
        >
          {/* Faint Flower of Life backdrop */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'grid',
              placeItems: 'center',
              pointerEvents: 'none',
              color: enneColor,
            }}
          >
            <FlowerOfLife size={320} opacity={0.06} strokeWidth={0.3} spin={320} />
          </div>

          <div style={{ position: 'relative' }}>
            <div
              className="mono"
              style={{
                fontSize: 9,
                letterSpacing: '0.3em',
                color: 'var(--ink-dim)',
                textTransform: 'uppercase',
                marginBottom: 14,
                textAlign: 'center',
              }}
            >
              Your IRIS
            </div>

            {/* Sigil wrapping the Enneagram number, with the
                glyph as a second rotating ring. */}
            <div
              style={{
                display: 'grid',
                placeItems: 'center',
                marginBottom: 10,
              }}
            >
              <div style={{ position: 'relative', width: 180, height: 180 }}>
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'grid',
                    placeItems: 'center',
                    color: enneColor,
                  }}
                >
                  <EnneagramGlyph
                    size={180}
                    color={enneColor}
                    opacity={0.55}
                    strokeWidth={0.45}
                    spin={320}
                    highlightType={iris.enneagramType}
                  />
                </div>
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'grid',
                    placeItems: 'center',
                  }}
                >
                  <Sigil size={110} color={enneColor} opacity={0.6} spin={180}>
                    <div
                      className="engram-breathe"
                      style={{
                        fontSize: 56,
                        fontWeight: 300,
                        lineHeight: 1,
                        color: enneColor,
                        fontFamily: 'var(--serif)',
                      }}
                    >
                      {iris.enneagramType}
                    </div>
                  </Sigil>
                </div>
              </div>
            </div>

            <div
              style={{
                fontSize: 22,
                fontWeight: 300,
                color: 'var(--ink)',
                textAlign: 'center',
                letterSpacing: '0.05em',
                marginTop: 6,
              }}
            >
              {enneName}
            </div>

            <Divider
              color={enneColor}
              opacity={0.4}
              glyph="vesica"
              glyphSize={22}
              margin="18px 0 12px"
            />

            <div style={{ marginBottom: 8 }}>
              <FacetRadar facetScores={iris.facetScores} />
            </div>
            <div
              className="mono"
              style={{
                fontSize: 9,
                color: 'var(--ink-faint)',
                textAlign: 'center',
                letterSpacing: '0.1em',
                marginTop: 4,
              }}
            >
              Taken {iris.takenAt ? new Date(iris.takenAt).toLocaleDateString() : '—'}
            </div>
            <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center', gap: 10 }}>
              <Button variant="ghost" size="sm" onClick={() => navigate('/iris')}>
                Re-run IRIS
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <Card
          style={{ marginBottom: 14, position: 'relative', overflow: 'hidden' }}
          accent="#b197fc"
        >
          <div
            style={{
              position: 'absolute',
              right: -30,
              top: -30,
              width: 180,
              height: 180,
              pointerEvents: 'none',
              color: '#b197fc',
            }}
          >
            <Merkaba size={180} opacity={0.14} strokeWidth={0.4} spin={240} />
          </div>
          <div
            className="mono"
            style={{
              fontSize: 9,
              letterSpacing: '0.3em',
              color: 'var(--ink-dim)',
              textTransform: 'uppercase',
              marginBottom: 8,
              position: 'relative',
            }}
          >
            Unmapped
          </div>
          <h3
            style={{
              margin: '0 0 8px',
              fontWeight: 300,
              fontSize: 22,
              color: 'var(--ink)',
            }}
          >
            Run your IRIS
          </h3>
          <p
            style={{
              margin: '0 0 16px',
              color: 'var(--ink-soft)',
              fontStyle: 'italic',
              lineHeight: 1.6,
            }}
          >
            24 facets. 16 scenarios. The map Engram uses to write insights in your voice.
          </p>
          <Button variant="solid" tone="#b197fc" onClick={() => navigate('/iris')}>
            Begin
          </Button>
        </Card>
      )}

      {/* Subscription */}
      <Card style={{ marginBottom: 14 }} accent={subscription.tier === 'pro' ? '#ffd166' : undefined}>
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Emoji code={subscription.tier === 'pro' ? '1f31f' : '1f331'} size={36} />
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: 22,
                fontWeight: 300,
                color: subscription.tier === 'pro' ? '#ffd166' : 'var(--ink)',
                textTransform: 'capitalize',
              }}
            >
              {subscription.tier === 'pro' ? 'Engram Pro' : 'Free'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>
              {subscription.tier === 'pro'
                ? 'Unlimited Claude insights + chat'
                : '3 free Claude insights per month'}
            </div>
          </div>
          {subscription.tier === 'pro' ? (
            <Button variant="ghost" size="sm" onClick={() => navigate('/pricing')}>
              Manage
            </Button>
          ) : (
            <Button
              variant="solid"
              tone="#ffd166"
              size="sm"
              onClick={() => navigate('/pricing')}
            >
              Upgrade
            </Button>
          )}
        </div>
        {!hasStripe() && (
          <div
            className="mono"
            style={{
              marginTop: 12,
              fontSize: 9,
              color: 'var(--ink-faint)',
              letterSpacing: '0.04em',
            }}
          >
            Stripe not configured · see README
          </div>
        )}
      </Card>

      {/* Backend status */}
      <Card style={{ marginBottom: 14 }}>
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
          Backend
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <StatusRow label="Local storage" on={true} />
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
          Engram works fully offline. Cloud features activate when env vars are set.
        </div>
      </Card>

      {/* Reset */}
      <Card style={{ marginBottom: 20, borderColor: 'rgba(255,107,107,0.2)' }}>
        <div
          className="mono"
          style={{
            fontSize: 9,
            letterSpacing: '0.3em',
            color: '#ff6b6b',
            textTransform: 'uppercase',
            marginBottom: 10,
          }}
        >
          Danger zone
        </div>
        {confirmReset ? (
          <div>
            <p style={{ color: 'var(--ink-soft)', fontStyle: 'italic', marginTop: 0 }}>
              This wipes every entry, note, insight, and your IRIS results — locally. Cloud data
              (if configured) stays intact.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <Button
                variant="danger"
                onClick={() => {
                  hardReset();
                  setConfirmReset(false);
                  navigate('/');
                }}
              >
                Yes, erase everything
              </Button>
              <Button variant="subtle" onClick={() => setConfirmReset(false)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button variant="danger" onClick={() => setConfirmReset(true)}>
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
        }}
      >
        Engram · v0.1.0 · Eclipse Ventures LLC
      </div>
    </Screen>
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
          background: on ? '#63e6be' : 'rgba(255,255,255,0.12)',
          boxShadow: on ? '0 0 8px rgba(99,230,190,0.7)' : 'none',
        }}
      />
      <div style={{ fontSize: 13, color: 'var(--ink-soft)' }}>{label}</div>
      <div style={{ flex: 1 }} />
      <div
        className="mono"
        style={{
          fontSize: 9,
          letterSpacing: '0.18em',
          color: on ? '#63e6be' : 'var(--ink-faint)',
          textTransform: 'uppercase',
        }}
      >
        {on ? 'Connected' : 'Off'}
      </div>
    </div>
  );
}
