// ─────────────────────────────────────────────────────────────
// Dashboard — the single primary surface of the app.
// ─────────────────────────────────────────────────────────────
// Scrollable, airy, unhurried. Sections stack top to bottom:
//   1. Greeting
//   2. Player Card hero (your replica's snapshot) — or IRIS CTA
//   3. Today — one simple action
//   4. Recent entries — last 5, with "View all" → /journal
//   5. Mood trend (last 30 days sparkline)
//   6. Calendar preview (last 14 days heatmap)
//   7. Engram teaser (XP + level + "Enter arena")
//
// Deeper experiences (full journal timeline, month calendar,
// full insights with Claude) live behind "View all" links —
// the dashboard never shows everything at once.
// ─────────────────────────────────────────────────────────────

import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { subDays } from 'date-fns';
import Screen from '../../components/Screen.jsx';
import Card from '../../components/Card.jsx';
import Button from '../../components/Button.jsx';
import Emoji from '../../components/Emoji.jsx';
import Empty from '../../components/Empty.jsx';
import PlayerCard from '../../components/PlayerCard.jsx';
import { SeedOfLife, Merkaba } from '../../components/SacredGeometry.jsx';
import {
  useStore,
  selectTodayEntry,
  selectLastN,
  selectEntriesByDay,
  selectTotalNoteCount,
} from '../../lib/store.js';
import { moodByScore } from '../../data/moods.js';
import { noteKindById } from '../../data/notekinds.js';
import { getType } from '../../data/enneagram.js';
import { levelFromXp } from '../engram/rewards.js';
import { greeting, prettyDate, currentStreak, dayKey, eachDayOfInterval, format } from '../../lib/time.js';

export default function Home() {
  const navigate = useNavigate();
  const profile = useStore((s) => s.profile);
  const iris = useStore((s) => s.iris);
  const engram = useStore((s) => s.engram);
  const entries = useStore((s) => s.entries);
  const today = useStore(selectTodayEntry);
  const recent = useMemo(() => selectLastN({ entries }, 5), [entries]);
  const totalNotes = useStore(selectTotalNoteCount);
  const byDay = useMemo(() => selectEntriesByDay({ entries }), [entries]);

  const streak = useMemo(() => currentStreak(entries), [entries]);
  const totalDays = entries.length;
  const todayMood = today ? moodByScore(today.mood) : null;
  const hasIris = Boolean(iris.enneagramType);
  const typeMeta = hasIris ? getType(iris.enneagramType) : null;

  return (
    <Screen
      label={greeting()}
      title={profile.name ? profile.name : 'Engram'}
      subtitle={prettyDate(new Date())}
      glyph={
        <SeedOfLife
          size={36}
          color={typeMeta?.color || 'var(--accent)'}
          opacity={0.45}
          spin={180}
          strokeWidth={0.5}
        />
      }
    >
      {/* ── Player Card hero (or IRIS CTA) ── */}
      {hasIris ? (
        <PlayerCard />
      ) : (
        <Card
          style={{ marginBottom: 24, position: 'relative', overflow: 'hidden' }}
          accent="var(--d-exi)"
        >
          <div
            style={{
              position: 'absolute',
              right: -40,
              bottom: -40,
              width: 180,
              height: 180,
              pointerEvents: 'none',
              color: 'var(--d-exi)',
            }}
          >
            <Merkaba size={180} opacity={0.12} strokeWidth={0.4} spin={160} />
          </div>
          <div style={{ position: 'relative' }}>
            <SectionLabel>Your replica awaits</SectionLabel>
            <h3 style={{ margin: '0 0 8px', fontWeight: 400, fontSize: 22, color: 'var(--ink)' }}>
              Map yourself first
            </h3>
            <p
              style={{
                margin: '0 0 16px',
                color: 'var(--ink-soft)',
                fontStyle: 'italic',
                lineHeight: 1.6,
              }}
            >
              24 facets. 16 crucible scenarios. Your Engram replica comes alive
              the moment you finish — your Player Card, your Coliseum standing,
              and your arena contender.
            </p>
            <Button variant="solid" tone="var(--d-exi)" onClick={() => navigate('/iris')}>
              Begin the simulation
            </Button>
          </div>
        </Card>
      )}

      {/* ── Today ── */}
      <SectionHeader>Today</SectionHeader>
      <Card
        accent={todayMood?.color || 'var(--border)'}
        style={{ marginBottom: 24 }}
      >
        {today ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <Emoji code={todayMood.emoji} size={38} label={todayMood.label} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 20, color: todayMood.color, fontWeight: 400 }}>
                {todayMood.label}
              </div>
              <div style={{ fontSize: 13, color: 'var(--ink-soft)', fontStyle: 'italic' }}>
                {todayMood.subtitle}
              </div>
            </div>
            <Button
              variant="subtle"
              size="sm"
              onClick={() => navigate('/checkin')}
            >
              Edit
            </Button>
          </div>
        ) : (
          <div>
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
              tone="var(--accent)"
              onClick={() => navigate('/checkin')}
            >
              Check in
            </Button>
          </div>
        )}
      </Card>

      {/* ── Quick stats ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 10,
          marginBottom: 24,
        }}
      >
        <Stat label="Streak" value={streak} suffix={streak === 1 ? 'day' : 'days'} />
        <Stat label="Days logged" value={totalDays} />
        <Stat label="Notes" value={totalNotes} />
      </div>

      {/* ── Recent entries ── */}
      {recent.length > 0 && (
        <>
          <SectionHeader linkLabel="View journal" linkTo="/journal">
            Recent entries
          </SectionHeader>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
            {recent.map((e) => (
              <EntryRow key={e.id} entry={e} />
            ))}
          </div>
        </>
      )}

      {/* ── Mood trend ── */}
      {entries.length >= 2 && (
        <>
          <SectionHeader linkLabel="Insights" linkTo="/insights">
            Mood trend
          </SectionHeader>
          <MoodSparkline byDay={byDay} days={30} />
        </>
      )}

      {/* ── Calendar preview ── */}
      {entries.length > 0 && (
        <>
          <SectionHeader linkLabel="Full calendar" linkTo="/calendar">
            Last two weeks
          </SectionHeader>
          <MiniCalendar byDay={byDay} days={14} />
        </>
      )}

      {/* ── Engram teaser ── */}
      {hasIris && (
        <>
          <SectionHeader linkLabel="Enter arena" linkTo="/engram">
            Your Engram
          </SectionHeader>
          <EngramTeaser engram={engram} typeMeta={typeMeta} />
        </>
      )}

      {/* ── Empty state ── */}
      {entries.length === 0 && !today && !hasIris && (
        <div style={{ marginTop: 12 }}>
          <Empty
            emoji="1f331"
            title="Your catalog starts today"
            body="Run your IRIS, check in daily, and watch the patterns surface."
          />
        </div>
      )}
    </Screen>
  );
}

// ─────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────

function SectionHeader({ children, linkLabel, linkTo }) {
  const navigate = useNavigate();
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        marginBottom: 10,
        marginTop: 2,
      }}
    >
      <div
        className="mono"
        style={{
          fontSize: 9,
          letterSpacing: '0.3em',
          color: 'var(--ink-dim)',
          textTransform: 'uppercase',
        }}
      >
        {children}
      </div>
      {linkLabel && linkTo && (
        <button
          onClick={() => navigate(linkTo)}
          className="mono"
          style={{
            fontSize: 9,
            letterSpacing: '0.22em',
            color: 'var(--ink-dim)',
            textTransform: 'uppercase',
            cursor: 'pointer',
          }}
        >
          {linkLabel} →
        </button>
      )}
    </div>
  );
}

function SectionLabel({ children }) {
  return (
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
      {children}
    </div>
  );
}

function Stat({ label, value, suffix }) {
  return (
    <Card padding={14} style={{ textAlign: 'center' }}>
      <div
        className="mono"
        style={{
          fontSize: 8,
          letterSpacing: '0.26em',
          color: 'var(--ink-dim)',
          textTransform: 'uppercase',
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 26, fontWeight: 400, color: 'var(--ink)', lineHeight: 1 }}>
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

function EntryRow({ entry }) {
  const mood = moodByScore(entry.mood);
  const firstNote = entry.notes?.[0];
  const noteKind = firstNote ? noteKindById(firstNote.kind) : null;
  return (
    <Card padding={12} accent={mood.color} style={{ cursor: 'default' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Emoji code={mood.emoji} size={22} label={mood.label} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 13,
              color: 'var(--ink)',
              fontWeight: 400,
              display: 'flex',
              alignItems: 'baseline',
              gap: 8,
            }}
          >
            <span style={{ color: mood.color }}>{mood.label}</span>
            <span
              className="mono"
              style={{ fontSize: 9, color: 'var(--ink-dim)', letterSpacing: '0.04em' }}
            >
              {format(new Date(entry.day + 'T00:00:00'), 'MMM d')}
            </span>
          </div>
          {firstNote && (
            <div
              style={{
                fontSize: 12,
                color: 'var(--ink-soft)',
                fontStyle: 'italic',
                marginTop: 2,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {noteKind?.label && (
                <span
                  className="mono"
                  style={{
                    fontSize: 8,
                    color: noteKind.color,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    marginRight: 6,
                  }}
                >
                  {noteKind.label}
                </span>
              )}
              {firstNote.text}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

function MoodSparkline({ byDay, days }) {
  const today = new Date();
  const range = eachDayOfInterval({
    start: subDays(today, days - 1),
    end: today,
  });
  const series = range.map((d) => {
    const e = byDay.get(dayKey(d));
    return { day: dayKey(d), mood: e ? e.mood : null };
  });
  const W = 320;
  const H = 56;
  const pad = 6;
  const points = series.map((s, i) => {
    const x = pad + (i / Math.max(1, series.length - 1)) * (W - pad * 2);
    const y = s.mood == null ? null : pad + (1 - s.mood) * (H - pad * 2);
    return { x, y };
  });
  const drawn = points.filter((p) => p.y != null);
  if (drawn.length === 0) return null;
  const d = drawn
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(' ');
  return (
    <Card style={{ marginBottom: 24 }}>
      <svg
        width="100%"
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        style={{ display: 'block' }}
        role="img"
        aria-label={`Mood trend, last ${days} days`}
      >
        <defs>
          <linearGradient id="spark" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--d-cog)" />
            <stop offset="50%" stopColor="var(--d-emo)" />
            <stop offset="100%" stopColor="var(--accent)" />
          </linearGradient>
        </defs>
        <path
          d={d}
          fill="none"
          stroke="url(#spark)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {drawn.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="2.2" fill="var(--ink)" opacity="0.75" />
        ))}
      </svg>
    </Card>
  );
}

function MiniCalendar({ byDay, days }) {
  const today = new Date();
  const range = eachDayOfInterval({
    start: subDays(today, days - 1),
    end: today,
  });
  return (
    <Card style={{ marginBottom: 24 }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${days}, 1fr)`,
          gap: 3,
        }}
      >
        {range.map((d) => {
          const key = dayKey(d);
          const e = byDay.get(key);
          const mood = e ? moodByScore(e.mood) : null;
          return (
            <div
              key={key}
              title={`${format(d, 'MMM d')}${mood ? ' · ' + mood.label : ''}`}
              style={{
                aspectRatio: '1',
                borderRadius: 4,
                background: mood ? mood.color : 'var(--border)',
                opacity: mood ? 0.9 : 1,
              }}
            />
          );
        })}
      </div>
    </Card>
  );
}

function EngramTeaser({ engram, typeMeta }) {
  const navigate = useNavigate();
  const level = levelFromXp(engram.xp);
  const defeated = (engram.defeated || []).length;
  return (
    <Card accent={typeMeta.color} style={{ marginBottom: 24, cursor: 'pointer' }}>
      <button
        onClick={() => navigate('/engram')}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          background: 'none',
          border: 'none',
          padding: 0,
          textAlign: 'left',
          cursor: 'pointer',
          color: 'inherit',
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            background: `color-mix(in srgb, ${typeMeta.color} 20%, transparent)`,
            display: 'grid',
            placeItems: 'center',
            color: typeMeta.color,
            fontSize: 20,
            flexShrink: 0,
          }}
        >
          {typeMeta.glyph}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 16, color: 'var(--ink)', fontWeight: 400 }}>
            Level {level} replica
          </div>
          <div
            className="mono"
            style={{ fontSize: 10, color: 'var(--ink-dim)', marginTop: 2, letterSpacing: '0.04em' }}
          >
            {engram.xp} XP · {defeated} / 9 seals
          </div>
        </div>
        <div
          className="mono"
          style={{
            fontSize: 9,
            letterSpacing: '0.22em',
            color: typeMeta.color,
            textTransform: 'uppercase',
          }}
        >
          Arena →
        </div>
      </button>
    </Card>
  );
}
