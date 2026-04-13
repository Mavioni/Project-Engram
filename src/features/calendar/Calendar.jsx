// ─────────────────────────────────────────────────────────────
// Calendar — a month-grid heatmap. Each cell is a day; fill color
// is the mood score, and logged days pulse slightly.
// ─────────────────────────────────────────────────────────────

import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { addMonths, format, isSameDay, isSameMonth, startOfToday, subMonths } from 'date-fns';
import Screen from '../../components/Screen.jsx';
import Card from '../../components/Card.jsx';
import Button from '../../components/Button.jsx';
import Emoji from '../../components/Emoji.jsx';
import { useStore, selectEntriesByDay } from '../../lib/store.js';
import { MOODS, moodById, moodByScore } from '../../data/moods.js';
import { ALL_ACTIVITIES } from '../../data/activities.js';
import { noteKindById } from '../../data/notekinds.js';
import { dayKey, monthGrid, prettyDate } from '../../lib/time.js';

export default function Calendar() {
  const navigate = useNavigate();
  const byDay = useStore(selectEntriesByDay);
  const [anchor, setAnchor] = useState(() => startOfToday());
  const [selected, setSelected] = useState(() => startOfToday());

  const days = useMemo(() => monthGrid(anchor), [anchor]);
  const selectedEntry = byDay.get(dayKey(selected));

  return (
    <Screen
      label={format(anchor, 'yyyy')}
      title={format(anchor, 'MMMM')}
      action={
        <div style={{ display: 'flex', gap: 6 }}>
          <Button
            variant="subtle"
            size="sm"
            onClick={() => setAnchor((a) => subMonths(a, 1))}
          >
            ←
          </Button>
          <Button
            variant="subtle"
            size="sm"
            onClick={() => setAnchor((a) => addMonths(a, 1))}
          >
            →
          </Button>
        </div>
      }
    >
      {/* Weekday header */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: 4,
          marginBottom: 8,
          fontFamily: 'var(--mono)',
          fontSize: 9,
          color: 'var(--ink-dim)',
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          textAlign: 'center',
        }}
      >
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>

      {/* Day grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: 4,
          marginBottom: 20,
        }}
      >
        {days.map((d) => {
          const key = dayKey(d);
          const entry = byDay.get(key);
          const mood = entry ? moodByScore(entry.mood) : null;
          const inMonth = isSameMonth(d, anchor);
          const isSelected = isSameDay(d, selected);
          const isToday = isSameDay(d, new Date());
          return (
            <button
              key={key}
              onClick={() => setSelected(d)}
              style={{
                aspectRatio: '1 / 1',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 2,
                borderRadius: 10,
                position: 'relative',
                background: mood ? `${mood.color}20` : 'transparent',
                border: `1px solid ${
                  isSelected
                    ? 'var(--ink)'
                    : isToday
                      ? 'var(--border-strong)'
                      : 'var(--border)'
                }`,
                opacity: inMonth ? 1 : 0.32,
                cursor: 'pointer',
                transition: 'all 180ms ease',
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  fontFamily: 'var(--mono)',
                  color: mood ? mood.color : 'var(--ink-dim)',
                  lineHeight: 1,
                  marginBottom: 2,
                }}
              >
                {format(d, 'd')}
              </span>
              {mood && <Emoji code={mood.emoji} size={16} />}
              {isToday && !isSelected && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: 3,
                    width: 3,
                    height: 3,
                    borderRadius: '50%',
                    background: '#ffd166',
                  }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Selected day detail */}
      <Card accent={selectedEntry ? moodByScore(selectedEntry.mood).color : '#555'}>
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
          {prettyDate(selected)}
        </div>
        {selectedEntry ? (
          <SelectedEntry entry={selectedEntry} />
        ) : (
          <div>
            <p
              style={{
                margin: '4px 0 14px',
                color: 'var(--ink-soft)',
                fontStyle: 'italic',
              }}
            >
              Nothing logged this day.
            </p>
            {isSameDay(selected, new Date()) && (
              <Button
                variant="solid"
                tone="#ffd166"
                size="sm"
                onClick={() => navigate('/journal/checkin')}
              >
                Check in now
              </Button>
            )}
          </div>
        )}
      </Card>

      {/* Legend */}
      <div style={{ marginTop: 24 }}>
        <div
          className="mono"
          style={{
            fontSize: 9,
            letterSpacing: '0.28em',
            color: 'var(--ink-dim)',
            textTransform: 'uppercase',
            marginBottom: 10,
            textAlign: 'center',
          }}
        >
          Mood scale
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 14 }}>
          {MOODS.map((m) => (
            <div
              key={m.id}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}
            >
              <Emoji code={m.emoji} size={22} label={m.label} />
              <span
                className="mono"
                style={{
                  fontSize: 8,
                  letterSpacing: '0.18em',
                  color: 'var(--ink-faint)',
                  textTransform: 'uppercase',
                }}
              >
                {m.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </Screen>
  );
}

function SelectedEntry({ entry }) {
  const mood = moodByScore(entry.mood);
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <Emoji code={mood.emoji} size={34} label={mood.label} />
        <div>
          <div style={{ fontSize: 20, fontWeight: 300, color: mood.color }}>
            {mood.label}
          </div>
          <div
            style={{ fontSize: 13, color: 'var(--ink-soft)', fontStyle: 'italic' }}
          >
            {mood.subtitle}
          </div>
        </div>
      </div>
      {entry.activities && entry.activities.length > 0 && (
        <div
          style={{
            display: 'flex',
            gap: 5,
            flexWrap: 'wrap',
            marginBottom: entry.notes?.length ? 12 : 0,
          }}
        >
          {entry.activities.map((id) => {
            const a = ALL_ACTIVITIES.find((x) => x.id === id);
            if (!a) return null;
            return (
              <div
                key={id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '3px 9px',
                  borderRadius: 999,
                  border: `1px solid ${a.groupColor}33`,
                  background: `${a.groupColor}10`,
                  fontSize: 10,
                  fontFamily: 'var(--mono)',
                  color: 'var(--ink-soft)',
                }}
              >
                <Emoji code={a.emoji} size={12} />
                {a.label}
              </div>
            );
          })}
        </div>
      )}
      {entry.notes && entry.notes.length > 0 && (
        <div
          style={{
            marginTop: 12,
            paddingTop: 12,
            borderTop: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          {entry.notes.map((n) => {
            const kind = noteKindById(n.kind);
            return (
              <div key={n.id}>
                <div
                  className="mono"
                  style={{
                    fontSize: 8,
                    letterSpacing: '0.22em',
                    textTransform: 'uppercase',
                    color: kind.color,
                    marginBottom: 4,
                  }}
                >
                  {kind.label}
                </div>
                <p
                  style={{
                    margin: 0,
                    fontSize: 14,
                    lineHeight: 1.6,
                    color: 'var(--ink-soft)',
                    fontStyle: 'italic',
                  }}
                >
                  {n.text}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
