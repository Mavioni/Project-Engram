// ─────────────────────────────────────────────────────────────
// Home — the first thing a user sees after onboarding.
// Shows: greeting, today's sigil + mood, streak, recent
// sparkline, IRIS summary, and a prompt for the next insight.
// ─────────────────────────────────────────────────────────────

import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Screen from '../../components/Screen.jsx';
import Card from '../../components/Card.jsx';
import Button from '../../components/Button.jsx';
import Emoji from '../../components/Emoji.jsx';
import Empty from '../../components/Empty.jsx';
import {
  Sigil,
  Divider,
  SeedOfLife,
  FlowerOfLife,
  EnneagramGlyph,
  Merkaba,
} from '../../components/SacredGeometry.jsx';
import {
  useStore,
  selectTodayEntry,
  selectLastN,
  selectTotalNoteCount,
} from '../../lib/store.js';
import { moodById } from '../../data/moods.js';
import { ALL_ACTIVITIES } from '../../data/activities.js';
import { greeting, prettyDate, currentStreak } from '../../lib/time.js';

export default function Home() {
  const navigate = useNavigate();
  const profile = useStore((s) => s.profile);
  const iris = useStore((s) => s.iris);
  const entries = useStore((s) => s.entries);
  const today = useStore(selectTodayEntry);
  const recent = useStore((s) => selectLastN(s, 7));
  const totalNotes = useStore(selectTotalNoteCount);

  const streak = useMemo(() => currentStreak(entries), [entries]);
  const totalDays = entries.length;

  const todayMood = today && moodById(today.mood);

  return (
    <Screen
      label={greeting()}
      title={profile.name ? profile.name : 'Engram'}
      subtitle={prettyDate(new Date())}
      glyph={
        <SeedOfLife size={40} color="#ffd166" opacity={0.35} spin={180} strokeWidth={0.5} />
      }
    >
      {/* ── Today hero card ── */}
      <Card
        accent={todayMood?.color || 'rgba(255,255,255,0.12)'}
        style={{
          marginBottom: 18,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Subtle Flower of Life behind the content */}
        <div
          style={{
            position: 'absolute',
            right: -30,
            top: -30,
            width: 180,
            height: 180,
            pointerEvents: 'none',
            color: todayMood?.color || '#7eb5ff',
          }}
        >
          <FlowerOfLife size={180} opacity={0.08} strokeWidth={0.3} spin={200} />
        </div>

        <div style={{ position: 'relative' }}>
          {today ? (
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 18,
                  marginBottom: 16,
                }}
              >
                <Sigil size={96} color={todayMood.color} opacity={0.45} spin={90}>
                  <div className="engram-breathe">
                    <Emoji code={todayMood.emoji} size={48} label={todayMood.label} />
                  </div>
                </Sigil>
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
                  <div
                    style={{
                      fontSize: 26,
                      color: todayMood.color,
                      fontWeight: 300,
                      letterSpacing: '0.02em',
                    }}
                  >
                    {todayMood.label}
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      color: 'var(--ink-soft)',
                      fontStyle: 'italic',
                      marginTop: 2,
                    }}
                  >
                    {todayMood.subtitle}
                  </div>
                </div>
              </div>
              {today.activities && today.activities.length > 0 && (
                <div
                  style={{
                    display: 'flex',
                    gap: 6,
                    flexWrap: 'wrap',
                    marginBottom: 12,
                  }}
                >
                  {today.activities.slice(0, 10).map((id) => {
                    const a = ALL_ACTIVITIES.find((x) => x.id === id);
                    if (!a) return null;
                    return (
                      <div
                        key={id}
                        title={a.label}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          padding: '4px 10px',
                          borderRadius: 999,
                          border: `1px solid ${a.groupColor}33`,
                          background: `${a.groupColor}10`,
                          fontSize: 10,
                          fontFamily: 'var(--mono)',
                          color: 'var(--ink-soft)',
                        }}
                      >
                        <Emoji code={a.emoji} size={14} />
                        {a.label}
                      </div>
                    );
                  })}
                </div>
              )}
              <Button
                variant="subtle"
                size="sm"
                onClick={() => navigate('/journal/checkin')}
              >
                Add more →
              </Button>
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 18,
              }}
            >
              <Sigil size={96} color="#ffd166" opacity={0.35} spin={120}>
                <div className="engram-breathe" style={{ fontSize: 34, color: '#ffd166' }}>
                  ✧
                </div>
              </Sigil>
              <div style={{ flex: 1 }}>
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
                    fontSize: 14,
                  }}
                >
                  One check-in is how the pattern surfaces. Two minutes.
                </p>
                <Button
                  variant="solid"
                  tone="#ffd166"
                  onClick={() => navigate('/journal/checkin')}
                >
                  Check in
                </Button>
              </div>
            </div>
          )}
        </div>
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

      <Divider color="#7eb5ff" opacity={0.35} glyph="vesica" glyphSize={26} margin="8px 0 20px" />

      {/* ── Mood sparkline ── */}
      <Sparkline entries={recent} />

      {/* ── IRIS summary or CTA ── */}
      {iris.enneagramType ? (
        <>
          <Divider color="#b197fc" opacity={0.35} glyph="enneagram" glyphSize={28} margin="22px 0 18px" />
          <IrisSummary iris={iris} onOpen={() => navigate('/you')} />
        </>
      ) : (
        <>
          <Divider color="#b197fc" opacity={0.35} glyph="merkaba" glyphSize={28} margin="22px 0 18px" />
          <Card style={{ position: 'relative', overflow: 'hidden' }}>
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
                Next step
              </div>
              <h3
                style={{
                  margin: '0 0 8px',
                  fontWeight: 300,
                  fontSize: 22,
                  color: 'var(--ink)',
                }}
              >
                Meet your IRIS
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
                and the map Engram uses to write insights in your voice.
              </p>
              <Button variant="solid" tone="#b197fc" onClick={() => navigate('/')}>
                Begin the simulation
              </Button>
            </div>
          </Card>
        </>
      )}

      {/* ── Empty state if no entries at all ── */}
      {entries.length === 0 && !today && (
        <div style={{ marginTop: 24 }}>
          <Empty
            emoji="1f331"
            title="Your catalog starts today"
            body="Engram remembers for you. Mood, activities, ideas, dreams — all in one living document of who you are."
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
        <div
          className="mono"
          style={{ fontSize: 9, color: 'var(--ink-dim)', marginTop: 4 }}
        >
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

function IrisSummary({ iris, onOpen }) {
  return (
    <Card accent="#b197fc" style={{ position: 'relative', overflow: 'hidden' }}>
      <div
        style={{
          position: 'absolute',
          right: -24,
          top: -24,
          width: 120,
          height: 120,
          pointerEvents: 'none',
          color: '#b197fc',
        }}
      >
        <EnneagramGlyph size={120} opacity={0.22} strokeWidth={0.4} spin={280} highlightType={iris.enneagramType} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, position: 'relative' }}>
        <Sigil size={64} color="#b197fc" opacity={0.5} spin={150}>
          <div
            style={{
              fontSize: 24,
              fontWeight: 300,
              color: '#b197fc',
              fontFamily: 'var(--serif)',
            }}
          >
            {iris.enneagramType}
          </div>
        </Sigil>
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
            Your IRIS
          </div>
          <div style={{ fontSize: 20, fontWeight: 300, color: 'var(--ink)' }}>
            Type {iris.enneagramType}
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onOpen}>
          View
        </Button>
      </div>
    </Card>
  );
}
