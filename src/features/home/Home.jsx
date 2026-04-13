// ─────────────────────────────────────────────────────────────
// Home — the first thing a user sees after onboarding.
// Shows: greeting, streak, today's entry (or quick check-in),
// recent mood sparkline, and a prompt for the next insight.
// ─────────────────────────────────────────────────────────────

import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Screen from '../../components/Screen.jsx';
import Card from '../../components/Card.jsx';
import Button from '../../components/Button.jsx';
import Emoji from '../../components/Emoji.jsx';
import Empty from '../../components/Empty.jsx';
import { useStore, selectTodayEntry, selectLastN, selectTotalNoteCount } from '../../lib/store.js';
import { MOODS, moodById } from '../../data/moods.js';
import { ALL_ACTIVITIES } from '../../data/activities.js';
import { greeting, prettyDate, currentStreak, dayKey } from '../../lib/time.js';
import { domainColors } from '../../styles/tokens.js';

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
    >
      {/* ── Today card ── */}
      <Card accent={todayMood?.color || '#ffffff22'} style={{ marginBottom: 16 }}>
        {today ? (
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                marginBottom: 14,
              }}
            >
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 20,
                  background: `radial-gradient(circle, ${todayMood.color}25, transparent 70%)`,
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                <Emoji code={todayMood.emoji} size={40} label={todayMood.label} />
              </div>
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
                    fontSize: 22,
                    color: todayMood.color,
                    fontWeight: 300,
                  }}
                >
                  {todayMood.label}
                </div>
                <div
                  style={{
                    fontSize: 13,
                    color: 'var(--ink-soft)',
                    fontStyle: 'italic',
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
          <div>
            <div
              style={{
                fontSize: 11,
                letterSpacing: '0.3em',
                fontFamily: 'var(--mono)',
                color: 'var(--ink-dim)',
                textTransform: 'uppercase',
                marginBottom: 8,
              }}
            >
              Today is unwritten
            </div>
            <p
              style={{
                margin: '0 0 16px',
                color: 'var(--ink-soft)',
                fontStyle: 'italic',
                lineHeight: 1.5,
              }}
            >
              One check-in a day is how the pattern surfaces. Two minutes.
            </p>
            <Button
              variant="solid"
              tone="#ffd166"
              onClick={() => navigate('/journal/checkin')}
            >
              Check In
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
          marginBottom: 20,
        }}
      >
        <Stat label="Streak" value={streak} suffix={streak === 1 ? 'day' : 'days'} />
        <Stat label="Days logged" value={totalDays} />
        <Stat label="Notes" value={totalNotes} />
      </div>

      {/* ── Mood sparkline ── */}
      <Sparkline entries={recent} />

      {/* ── IRIS summary ── */}
      {iris.enneagramType ? (
        <IrisSummary iris={iris} onOpen={() => navigate('/you')} />
      ) : (
        <Card style={{ marginTop: 20 }}>
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
          <Button variant="solid" tone="#7eb5ff" onClick={() => navigate('/iris')}>
            Begin the simulation
          </Button>
        </Card>
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
    <Card style={{ marginBottom: 20 }}>
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
        <path d={d} fill="none" stroke="url(#sparkGrad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {pts.map((p) => (
          <circle key={p.day} cx={p.x} cy={p.y} r="2.5" fill="#fff" opacity="0.85" />
        ))}
      </svg>
    </Card>
  );
}

function IrisSummary({ iris, onOpen }) {
  return (
    <Card style={{ marginTop: 4 }} accent="#b197fc">
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(177,151,252,0.28), transparent 70%)',
            display: 'grid',
            placeItems: 'center',
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: 'rgba(177,151,252,0.35)',
              boxShadow: '0 0 24px rgba(177,151,252,0.4)',
            }}
          />
        </div>
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
