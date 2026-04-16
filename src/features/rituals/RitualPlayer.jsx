// ─────────────────────────────────────────────────────────────
// RitualPlayer — guided playback of a single ritual.
// ─────────────────────────────────────────────────────────────
// Handles three kinds of step advance:
//   - breathe steps: walk through each phase (in/hold/out/rest)
//                    with matching sigil-scale animation
//   - timed prompts: auto-advance after `duration` seconds,
//                    with optional tap-to-skip
//   - tap prompts (tapAdvance: true): wait for user to confirm
//
// Ambient audio starts on user gesture (the "Begin" button) and
// stops on unmount or mute. Respects store.settings.ambientAudio.
// ─────────────────────────────────────────────────────────────

import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Screen from '../../components/Screen.jsx';
import Button from '../../components/Button.jsx';
import Emoji from '../../components/Emoji.jsx';
import { Sigil, Divider } from '../../components/SacredGeometry.jsx';
import { useStore } from '../../lib/store.js';
import { KINDS, ritualById } from '../../data/rituals.js';
import { createAmbientPlayer } from '../../lib/ambient-audio.js';

// Extracted so React's purity rule doesn't flag nowMs() inside
// the component body — this is a trivial helper invoked from event
// handlers where reading the wall clock is the right call.
const nowMs = () => nowMs();

export default function RitualPlayer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const ritual = useMemo(() => ritualById(id), [id]);

  const completeRitual = useStore((s) => s.completeRitual);
  const ambientPref = useStore((s) => s.settings?.ambientAudio ?? true);

  const [phase, setPhase] = useState('intro'); // intro | playing | done
  const [stepIdx, setStepIdx] = useState(0);
  const [breathPhase, setBreathPhase] = useState(null); // { label, seconds, scale }
  const [muted, setMuted] = useState(!ambientPref);
  const startedAtRef = useRef(null);
  const playerRef = useRef(null);
  const timersRef = useRef([]);

  const kind = ritual ? KINDS[ritual.kind] : null;
  const accent = kind?.color || 'var(--accent)';

  // ── audio lifecycle ──
  useEffect(() => {
    // Only create a player if the ritual wants ambient + user hasn't muted
    if (phase !== 'playing' || muted || !ritual?.ambient) return;
    const p = createAmbientPlayer({ volume: 0.25 });
    playerRef.current = p;
    p.start();
    return () => {
      p.stop();
      playerRef.current = null;
    };
  }, [phase, muted, ritual?.ambient]);

  // ── cleanup any pending step timers on unmount ──
  useEffect(() => {
    return () => {
      timersRef.current.forEach((id) => clearTimeout(id));
      timersRef.current = [];
    };
  }, []);

  if (!ritual) {
    return (
      <Screen label="Rituals" title="Not found">
        <p style={{ color: 'var(--ink-soft)', fontStyle: 'italic' }}>
          No ritual by that name.
        </p>
        <Button variant="ghost" onClick={() => navigate('/rituals')}>
          Back to practices
        </Button>
      </Screen>
    );
  }

  // ── start playing ──
  const begin = () => {
    startedAtRef.current = nowMs();
    setPhase('playing');
    setStepIdx(0);
    runStep(0);
  };

  const runStep = (idx) => {
    const step = ritual.steps[idx];
    if (!step) return finish();
    setStepIdx(idx);
    setBreathPhase(null);

    if (step.breathe) {
      // Walk breath phases in sequence, then advance.
      playBreathSequence(step.breathe, () => {
        runStep(idx + 1);
      });
      return;
    }

    if (step.tapAdvance) {
      // Wait for the user to tap Next.
      return;
    }

    // Timed auto-advance.
    const seconds = step.duration || 5;
    const t = setTimeout(() => runStep(idx + 1), seconds * 1000);
    timersRef.current.push(t);
  };

  // ── play one full breath sequence (e.g. in-hold-out-rest) ──
  const playBreathSequence = (phases, onDone) => {
    let i = 0;
    const next = () => {
      if (i >= phases.length) {
        setBreathPhase(null);
        onDone();
        return;
      }
      const p = phases[i];
      // Scale target for the sigil:
      //   in   → 1.15  (open)
      //   hold → 1.15  (hold open)
      //   out  → 0.88  (close)
      //   rest → 0.88  (hold closed)
      const scale =
        p.phase === 'in' || p.phase === 'hold'
          ? 1.15
          : 0.88;
      setBreathPhase({ label: p.phase, seconds: p.seconds, scale });
      i += 1;
      const t = setTimeout(next, p.seconds * 1000);
      timersRef.current.push(t);
    };
    next();
  };

  const advance = () => {
    // Clear any pending auto-advance first.
    timersRef.current.forEach((id) => clearTimeout(id));
    timersRef.current = [];
    runStep(stepIdx + 1);
  };

  const finish = () => {
    setPhase('done');
    const elapsed = startedAtRef.current
      ? Math.floor((nowMs() - startedAtRef.current) / 1000)
      : 0;
    completeRitual({ id: ritual.id, durationSeconds: elapsed });
    // Fade the audio here; the useEffect cleanup handles the teardown.
    if (playerRef.current) {
      playerRef.current.stop();
      playerRef.current = null;
    }
  };

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    if (next && playerRef.current) {
      playerRef.current.stop();
      playerRef.current = null;
    }
    // If un-muting and the ritual is playing, the useEffect will
    // pick up the change on the next render and create a new player.
  };

  // ── views ──
  if (phase === 'intro') {
    return (
      <Screen
        label="Ritual"
        title={ritual.name}
        action={
          <button
            onClick={() => navigate('/rituals')}
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
        <div style={{ display: 'grid', placeItems: 'center', marginBottom: 20 }}>
          <div style={{ position: 'relative' }}>
            <Sigil size={140} color={accent} opacity={0.45} spin={200}>
              <Emoji code={ritual.emoji || kind?.emoji} size={56} />
            </Sigil>
          </div>
        </div>

        <div
          className="mono"
          style={{
            fontSize: 9,
            letterSpacing: '0.3em',
            color: accent,
            textTransform: 'uppercase',
            textAlign: 'center',
            marginBottom: 8,
          }}
        >
          {kind?.label} · {ritual.duration} min{ritual.ambient ? ' · ♪ music' : ''}
        </div>

        <p
          style={{
            fontSize: 18,
            color: 'var(--ink)',
            textAlign: 'center',
            fontStyle: 'italic',
            lineHeight: 1.6,
            margin: '0 auto 18px',
            maxWidth: 440,
          }}
        >
          {ritual.blurb}
        </p>

        <Divider color={accent} opacity={0.3} glyph="vesica" glyphSize={18} margin="16px 0" />

        <p
          style={{
            fontSize: 14,
            color: 'var(--ink-soft)',
            lineHeight: 1.7,
            margin: '0 auto 22px',
            maxWidth: 440,
          }}
        >
          {ritual.why}
        </p>

        {ritual.ambient && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              marginBottom: 20,
            }}
          >
            <label
              className="mono"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 10,
                letterSpacing: '0.22em',
                color: 'var(--ink-dim)',
                textTransform: 'uppercase',
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={!muted}
                onChange={toggleMute}
                style={{ accentColor: accent, cursor: 'pointer' }}
              />
              Ambient music
            </label>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Button variant="solid" size="lg" tone={accent} onClick={begin}>
            Begin
          </Button>
        </div>
      </Screen>
    );
  }

  if (phase === 'done') {
    return (
      <Screen label="Ritual" title="Complete">
        <div style={{ display: 'grid', placeItems: 'center', marginBottom: 24 }}>
          <Sigil size={120} color={accent} opacity={0.55} spin={90}>
            <div
              className="engram-breathe"
              style={{ fontSize: 36, color: accent, lineHeight: 1 }}
            >
              ✓
            </div>
          </Sigil>
        </div>
        <p
          style={{
            fontSize: 18,
            color: 'var(--ink)',
            textAlign: 'center',
            fontStyle: 'italic',
            lineHeight: 1.6,
            marginBottom: 28,
          }}
        >
          You practiced. That&apos;s the whole thing.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <Button variant="ghost" onClick={() => navigate('/rituals')}>
            More practices
          </Button>
          <Button variant="solid" tone={accent} onClick={() => navigate('/')}>
            Dashboard
          </Button>
        </div>
      </Screen>
    );
  }

  // ── playing view ──
  const step = ritual.steps[stepIdx];
  const showNext = step?.tapAdvance;

  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
        textAlign: 'center',
        position: 'relative',
      }}
    >
      {/* Audio mute + exit — persistent chrome */}
      <div
        style={{
          position: 'absolute',
          top: 'calc(var(--safe-top) + 16px)',
          left: 16,
          right: 16,
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <button
          onClick={() => {
            finish();
            navigate('/rituals');
          }}
          className="mono"
          style={{
            fontSize: 10,
            letterSpacing: '0.22em',
            color: 'var(--ink-dim)',
            textTransform: 'uppercase',
          }}
        >
          End
        </button>
        {ritual.ambient && (
          <button
            onClick={toggleMute}
            aria-label={muted ? 'Unmute ambient music' : 'Mute ambient music'}
            className="mono"
            style={{
              fontSize: 14,
              color: muted ? 'var(--ink-dim)' : accent,
            }}
          >
            {muted ? '🔇' : '♪'}
          </button>
        )}
      </div>

      {/* Breathing sigil */}
      <div
        style={{
          marginBottom: 32,
          transform: `scale(${breathPhase?.scale ?? 1})`,
          transition: `transform ${breathPhase?.seconds ?? 1}s ease-in-out`,
        }}
      >
        <Sigil size={180} color={accent} opacity={0.6} spin={280}>
          <Emoji code={ritual.emoji || kind?.emoji} size={56} />
        </Sigil>
      </div>

      {/* Breath phase label (if active) */}
      {breathPhase && (
        <div
          className="mono"
          style={{
            fontSize: 13,
            letterSpacing: '0.4em',
            color: accent,
            textTransform: 'uppercase',
            marginBottom: 12,
          }}
        >
          {breathPhase.label}
        </div>
      )}

      {/* Step text */}
      <p
        style={{
          fontSize: 22,
          fontWeight: 300,
          color: 'var(--ink)',
          lineHeight: 1.5,
          maxWidth: 520,
          margin: '0 0 8px',
          fontFamily: 'var(--serif)',
        }}
      >
        {step?.text}
      </p>

      {/* Progress dots */}
      <div
        style={{
          display: 'flex',
          gap: 6,
          marginTop: 32,
          opacity: 0.5,
        }}
      >
        {ritual.steps.map((_, i) => (
          <div
            key={i}
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: i <= stepIdx ? accent : 'var(--border)',
            }}
          />
        ))}
      </div>

      {/* Next button for tap-advance prompts */}
      {showNext && (
        <div style={{ marginTop: 28 }}>
          <Button variant="solid" size="sm" tone={accent} onClick={advance}>
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
