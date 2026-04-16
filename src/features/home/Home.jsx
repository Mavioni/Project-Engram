// ─────────────────────────────────────────────────────────────
// Home — the primary dashboard. Player Card hero + daily check-in
// + stats + sparkline.
// ─────────────────────────────────────────────────────────────

import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Screen from '../../components/Screen.jsx';
import Card from '../../components/Card.jsx';
import Button from '../../components/Button.jsx';
import Emoji from '../../components/Emoji.jsx';
import Empty from '../../components/Empty.jsx';
import PlayerCard from '../../components/PlayerCard.jsx';
import {
  Divider,
  SeedOfLife,
  Merkaba,
} from '../../components/SacredGeometry.jsx';
import {
  useStore,
  selectTodayEntry,
  selectLastN,
  selectTotalNoteCount,
} from '../../lib/store.js';
import { moodByScore } from '../../data/moods.js';
import { greeting, prettyDate, currentStreak } from '../../lib/time.js';

export default function Home() {
  const navigate = useNavigate();
  const profile = useStore((s) => s.profile);
  const iris = useStore((s) => s.iris);
  const entries = useStore((s) => s.entries);
  const today = useStore(selectTodayEntry);
  const recent = useMemo(() => selectLastN({ entries }, 7), [entries]);
  const totalNotes = useStore(selectTotalNoteCount);

  const streak = useMemo(() => currentStreak(entries), [entries]);
  const totalDays = entries.length;
  const todayMood = today ? moodByScore(today.mood) : null;

  return (
    <Screen
      label={greeting()}
      title={profile.name ? profile.name : 'Engram'}
      subtitle={prettyDate(new Date())}
      glyph={
        <SeedOfLife size={40} color="#ffd166" opacity={0.35} spin={180} strokeWidth={0.5} />
      }
    >
      {/* ── Player Card hero ── */}
      {iris.enneagramType ? (
        <PlayerCard />
      ) : (
        <Card
          style={{ marginBottom: 20, position: 'relative', overflow: 'hidden' }}
          accent="#b197fc"
        >
          <div
            style={{
              position: 'absolute',
              right: -40,
              bottom: -40,
              width: 180,
              height: 180,
              pointerEvents: 'none',
              color: '#b197fc',
            }}
          >
            <Merkaba size={180} opacity={0.12} strokeWidth={0.4} spin={160} />
          </div>
          <div style={{ position: 'relative' }}>
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
              Your player card awaits
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
              24 facets. 16 crucible scenarios. A living artifact of who you are —
              your Player Card, your Coliseum standing, and the map Engram uses to
              write insights in your voice.
            </p>
            <Button variant="solid" tone="#b197fc" onClick={() => navigate('/iris')}>
              Begin the simulation
            </Button>
          </div>
        </Card>
      )}

      <Divider color="#7eb5ff" opacity={0.35} glyph="vesica" glyphSize={26} margin="8px 0 20px" />

      {/* ── Today's check-in ── */}
      <Card
        accent={todayMood?.color || 'rgba(255,255,255,0.12)'}
        style={{ marginBottom: 18 }}
      >
        {today ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Emoji code={todayMood.emoji} size={40} label={todayMood.label} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                className="mono"
                style={{
                  fontSize: 9,
                  letterSpacing: '0.28em',
                  color: 'var(--ink-dim)',
                  textTransform: 'uppercase',
                }}
              >
                Today
              </div>
              <div style={{ fontSize: 22, color: todayMood.color, fontWeight: 300 }}>
                {todayMood.label}
              </div>
            </div>
            <Button
              variant="subtle"
              size="sm"
              onClick={() => navigate('/journal/checkin')}
            >
              Add more →
            </Button>
          </div>
        ) : (
          <div>
            <div
              className="mono"
              style={{
                fontSize: 11,
                letterSpacing: '0.3em',
                color: 'var(--ink-dim)',
                textTransform: 'uppercase',
                marginBottom: 6,
              }}
            >
              Today is unwritten
            </div>
            <p
              style={{
                margin: '0 0 14px',
                color: 'var(--ink-soft)',
                fontStyle: 'italic',
                lineHeight: 1.5,
              }}
            >
              One check-in a day is how the pattern surfaces.
            </p>
            <Button
              variant="solid"
              tone="#ffd166"
              onClick={() => navigate('/journal/checkin')}
            >
              Check in
            </Button>
          </div>
        )}
      </Card>

      {/* ── Stats row ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 10,
          marginBottom: 18,
        }}
      >
        <Stat label="Streak" value={streak} suffix={streak === 1 ? 'day' : 'days'} />
        <Stat label="Days logged" value={totalDays} />
        <Stat label="Notes" value={totalNotes} />
      </div>

      {/* ── Mood sparkline ── */}
      <Sparkline entries={recent} />

      {/* ── Empty state ── */}
      {entries.length === 0 && !today && !iris.enneagramType && (
        <div style={{ marginTop: 24 }}>
          <Empty
            emoji="1f331"
            title="Your catalog starts today"
            body="Engram remembers for you. Run your IRIS, check in daily, and watch the patterns emerge."
          />
        </div>
      )}
    </Screen>
  );
}

function Stat({ label, value, suffix }) {
  return (
    <Card padding={14} style={{ textAlign: 'center' }}>
      <div
        className="mono"
        style={{
          fontSize: 8,
          letterSpacing: '0.28em',
          color: 'var(--ink-dim)',
          textTransform: 'uppercase',
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 28, fontWeight: 300, color: 'var(--ink)', lineHeight: 1 }}>
        {value}
      </div>
      {suffix && (
        <div className="mono" style={{ fontSize: 9, color: 'var(--ink-dim)', marginTop: 4 }}>
          {suffix}
        </div>
      )}
    </Card>
  );
}

function Sparkline({ entries }) {
  if (!entries || entries.length === 0) return null;
  const series = [...entries]
    .sort((a, b) => (a.day < b.day ? -1 : 1))
    .slice(-7);
  const W = 320;
  const H = 52;
  const pad = 6;
  const pts = series.map((e, i) => {
    const x = pad + (i / Math.max(1, series.length - 1)) * (W - pad * 2);
    const y = pad + (1 - (e.mood ?? 0.5)) * (H - pad * 2);
    return { x, y, mood: e.mood, day: e.day };
  });
  const d = pts
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(' ');
  return (
    <Card>
      <div
        className="mono"
        style={{
          fontSize: 9,
          letterSpacing: '0.28em',
          color: 'var(--ink-dim)',
          textTransform: 'uppercase',
          marginBottom: 10,
        }}
      >
        Last 7 days
      </div>
      <svg
        width="100%"
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        style={{ display: 'block' }}
      >
        <defs>
          <linearGradient id="sparkGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#7eb5ff" />
            <stop offset="50%" stopColor="#ff6b8a" />
            <stop offset="100%" stopColor="#ffd166" />
          </linearGradient>
        </defs>
        <path
          d={d}
          fill="none"
          stroke="url(#sparkGrad)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {pts.map((p) => (
          <circle key={p.day} cx={p.x} cy={p.y} r="2.5" fill="#fff" opacity="0.85" />
        ))}
      </svg>
    </Card>
  );
}
