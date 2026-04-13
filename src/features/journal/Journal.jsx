// ─────────────────────────────────────────────────────────────
// Journal — scrollable history of every entry + their notes.
// Think: Daylio's timeline meets Day One's rich cards.
// ─────────────────────────────────────────────────────────────

import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Screen from '../../components/Screen.jsx';
import Card from '../../components/Card.jsx';
import Button from '../../components/Button.jsx';
import Emoji from '../../components/Emoji.jsx';
import Empty from '../../components/Empty.jsx';
import { useStore } from '../../lib/store.js';
import { moodById } from '../../data/moods.js';
import { ALL_ACTIVITIES } from '../../data/activities.js';
import { noteKindById } from '../../data/notekinds.js';
import { format, parseISO } from '../../lib/time.js';

export default function Journal() {
  const navigate = useNavigate();
  const entries = useStore((s) => s.entries);

  const sorted = useMemo(
    () => [...entries].sort((a, b) => (a.day < b.day ? 1 : -1)),
    [entries],
  );

  return (
    <Screen
      label="Your catalog"
      title="Journal"
      subtitle={`${entries.length} ${entries.length === 1 ? 'entry' : 'entries'}`}
      action={
        <Button
          variant="solid"
          tone="#ffd166"
          size="sm"
          onClick={() => navigate('/journal/checkin')}
        >
          + Check in
        </Button>
      }
    >
      {sorted.length === 0 ? (
        <Empty
          emoji="1f4d4"
          title="Empty catalog"
          body="Your first check-in starts the story. The graphs start working after a few days — the insights after a week."
          action={
            <Button
              variant="solid"
              tone="#ffd166"
              onClick={() => navigate('/journal/checkin')}
            >
              Start now
            </Button>
          }
        />
      ) : (
        sorted.map((e) => <EntryCard key={e.id} entry={e} />)
      )}
    </Screen>
  );
}

function EntryCard({ entry }) {
  const mood = moodById(entry.mood) || {
    color: '#aaaabb',
    emoji: '1f610',
    label: '',
  };
  const date = parseISO(entry.day + 'T00:00:00');
  return (
    <Card accent={mood.color} style={{ marginBottom: 14 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginBottom: 12,
        }}
      >
        <Emoji code={mood.emoji} size={34} label={mood.label} />
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
            {format(date, 'EEEE')}
          </div>
          <div style={{ fontSize: 18, fontWeight: 300, color: mood.color }}>
            {format(date, 'MMMM d, yyyy')}
          </div>
        </div>
      </div>
      {entry.activities && entry.activities.length > 0 && (
        <div
          style={{
            display: 'flex',
            gap: 6,
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
                title={a.label}
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
            marginTop: 10,
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
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    marginBottom: 4,
                  }}
                >
                  <Emoji code={kind.emoji} size={14} />
                  <span
                    className="mono"
                    style={{
                      fontSize: 9,
                      letterSpacing: '0.22em',
                      color: kind.color,
                      textTransform: 'uppercase',
                    }}
                  >
                    {kind.label}
                  </span>
                </div>
                <p
                  style={{
                    margin: 0,
                    fontSize: 15,
                    lineHeight: 1.65,
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
    </Card>
  );
}
