// ─────────────────────────────────────────────────────────────
// Self Mirror — route page.
// ─────────────────────────────────────────────────────────────
// Locked view shows the unlock form — passphrase field, live
// entropy meter, submit. Unlocked view delegates to
// <SelfMirrorPanel /> with an explicit "Lock now" header action.
//
// This is an *observation* instrument. It never generates text in
// the operator's voice. See ADR §11 for doctrine guardrails.
// ─────────────────────────────────────────────────────────────

import { useState } from 'react';
import Screen from '../../components/Screen.jsx';
import Card from '../../components/Card.jsx';
import Button from '../../components/Button.jsx';
import { MetatronsCube } from '../../components/SacredGeometry.jsx';
import SelfMirrorPanel from './SelfMirrorPanel.jsx';
import { useSelfMirror } from './useSelfMirror.js';
import {
  scoreEntropy,
  entropyLabel,
  MIN_ENTROPY_SCORE,
} from './privacy/entropy.js';

/**
 * Pearl-silver-lilac accent — chosen for Self Mirror because it
 * evokes reflection / mirrored light and sits distinct from the
 * gold (Insights), lavender (IRIS), sky (cognitive), and rose
 * (emotional) accents already in use. Kept as a constant so the
 * unlock + panel layers don't drift.
 */
const MIRROR_ACCENT = '#c7cfff';

/** Number of pills in the entropy strength meter. */
const METER_STEPS = 5;

export default function SelfMirrorPage() {
  const { unlocked, unlock, lock, snapshots, activeWindow, setActiveWindow, error, busy } =
    useSelfMirror();
  const [passphrase, setPassphrase] = useState('');

  const score = scoreEntropy(passphrase);
  const label = entropyLabel(score);
  const tooWeak = score < MIN_ENTROPY_SCORE;

  /** @param {import('react').FormEvent<HTMLFormElement>} e */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!passphrase || busy || tooWeak) return;
    try {
      await unlock(passphrase);
    } catch {
      // Error is surfaced via `error` from the hook. Swallow the
      // re-throw so the form can re-arm cleanly.
    } finally {
      setPassphrase('');
    }
  };

  return (
    <Screen
      label="Private reflection"
      title="Self Mirror"
      glyph={
        <MetatronsCube
          size={44}
          color={MIRROR_ACCENT}
          opacity={0.35}
          strokeWidth={0.32}
          spin={360}
        />
      }
      action={
        unlocked ? (
          <Button variant="ghost" tone={MIRROR_ACCENT} size="sm" onClick={lock}>
            Lock now
          </Button>
        ) : null
      }
    >
      {unlocked ? (
        <SelfMirrorPanel
          snapshots={snapshots}
          activeWindow={activeWindow}
          setActiveWindow={setActiveWindow}
          accent={MIRROR_ACCENT}
        />
      ) : (
        <Card accent={MIRROR_ACCENT}>
          <div
            className="mono"
            style={{
              fontSize: 9,
              letterSpacing: '0.3em',
              color: MIRROR_ACCENT,
              textTransform: 'uppercase',
              marginBottom: 12,
            }}
          >
            Session locked
          </div>
          <h2
            style={{
              margin: '0 0 10px',
              fontSize: 22,
              fontWeight: 300,
              color: 'var(--ink)',
              fontFamily: 'var(--serif)',
              letterSpacing: '0.01em',
            }}
          >
            Unlock your mirror
          </h2>
          <p
            style={{
              margin: '0 0 20px',
              fontSize: 13,
              lineHeight: 1.7,
              color: 'var(--ink-soft)',
              fontStyle: 'italic',
            }}
          >
            Encrypted on this device only. Never leaves. There is no
            recovery — false recovery would be false security.
          </p>

          <form onSubmit={handleSubmit} autoComplete="off">
            <PassphraseField
              value={passphrase}
              onChange={setPassphrase}
              disabled={busy}
              accent={MIRROR_ACCENT}
            />

            <EntropyMeter
              score={score}
              label={label}
              visible={passphrase.length > 0}
              accent={MIRROR_ACCENT}
            />

            {error && (
              <div
                role="alert"
                style={{
                  marginTop: 12,
                  fontSize: 13,
                  color: '#ff6b6b',
                  fontStyle: 'italic',
                }}
              >
                {error}
              </div>
            )}

            <div style={{ marginTop: 20 }}>
              <Button
                type="submit"
                variant="solid"
                tone={MIRROR_ACCENT}
                full
                disabled={!passphrase || busy || tooWeak}
              >
                {busy ? 'Unlocking…' : 'Unlock'}
              </Button>
            </div>
          </form>

          <div
            className="mono"
            style={{
              marginTop: 22,
              textAlign: 'center',
              fontSize: 9,
              color: 'var(--ink-faint)',
              letterSpacing: '0.22em',
              lineHeight: 1.8,
              textTransform: 'uppercase',
            }}
          >
            Key held only in memory.
            <br />
            30-minute idle timeout.
          </div>
        </Card>
      )}
    </Screen>
  );
}

/**
 * Single bottom-border passphrase input — matches SignIn.jsx Field.
 *
 * @param {{ value: string, onChange: (v: string) => void, disabled: boolean, accent: string }} props
 */
function PassphraseField({ value, onChange, disabled, accent }) {
  return (
    <label style={{ display: 'block', marginBottom: 4 }}>
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
        Passphrase
      </div>
      <input
        type="password"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        autoComplete="new-password"
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
          borderBottom: `1px solid ${accent}55`,
          outline: 'none',
          letterSpacing: '0.02em',
        }}
      />
      <div
        className="mono"
        style={{
          fontSize: 9,
          color: 'var(--ink-faint)',
          marginTop: 6,
          letterSpacing: '0.04em',
        }}
      >
        No recovery. Forget this and your mirror is gone.
      </div>
    </label>
  );
}

/**
 * Five-pill strength meter + mono uppercase label. Hidden until
 * the operator starts typing so the blank form stays quiet.
 *
 * @param {{ score: number, label: string, visible: boolean, accent: string }} props
 */
function EntropyMeter({ score, label, visible, accent }) {
  const pills = Array.from({ length: METER_STEPS }, (_, i) => i < score);
  return (
    <div
      style={{
        marginTop: 14,
        opacity: visible ? 1 : 0,
        transition: 'opacity 220ms ease',
        pointerEvents: visible ? 'auto' : 'none',
      }}
      aria-hidden={!visible}
    >
      <div
        role="meter"
        aria-label="Passphrase strength"
        aria-valuemin={0}
        aria-valuemax={METER_STEPS - 1}
        aria-valuenow={score}
        style={{ display: 'flex', gap: 6, marginBottom: 6 }}
      >
        {pills.map((filled, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: 4,
              borderRadius: 999,
              background: filled ? accent : `${accent}22`,
              transition: 'background 220ms ease',
            }}
          />
        ))}
      </div>
      <div
        className="mono"
        style={{
          fontSize: 9,
          letterSpacing: '0.3em',
          textTransform: 'uppercase',
          color: score >= MIN_ENTROPY_SCORE ? accent : 'var(--ink-dim)',
        }}
      >
        {label}
      </div>
    </div>
  );
}
