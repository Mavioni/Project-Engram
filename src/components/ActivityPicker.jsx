// ─────────────────────────────────────────────────────────────
// <ActivityPicker /> — grouped grid of emoji tags.
// Multi-select. Group headers double as category filters.
// ─────────────────────────────────────────────────────────────

import { useState } from 'react';
import Emoji from './Emoji.jsx';
import { ACTIVITY_GROUPS } from '../data/activities.js';

export default function ActivityPicker({ selected = [], onChange }) {
  const [filter, setFilter] = useState('all');
  const groups =
    filter === 'all'
      ? ACTIVITY_GROUPS
      : ACTIVITY_GROUPS.filter((g) => g.id === filter);

  const toggle = (id) => {
    if (selected.includes(id)) {
      onChange(selected.filter((x) => x !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  return (
    <div>
      {/* Category chips */}
      <div
        style={{
          display: 'flex',
          gap: 6,
          overflowX: 'auto',
          paddingBottom: 12,
          marginBottom: 12,
          borderBottom: '1px solid var(--border)',
        }}
      >
        <Chip
          label="all"
          active={filter === 'all'}
          color="#ffffff"
          onClick={() => setFilter('all')}
        />
        {ACTIVITY_GROUPS.map((g) => (
          <Chip
            key={g.id}
            label={g.label}
            color={g.color}
            active={filter === g.id}
            onClick={() => setFilter(g.id)}
          />
        ))}
      </div>

      {groups.map((g) => (
        <div key={g.id} style={{ marginBottom: 22 }}>
          <div
            className="mono"
            style={{
              fontSize: 9,
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              color: g.color,
              marginBottom: 10,
            }}
          >
            {g.label}
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(78px, 1fr))',
              gap: 8,
            }}
          >
            {g.items.map((a) => {
              const on = selected.includes(a.id);
              return (
                <button
                  key={a.id}
                  onClick={() => toggle(a.id)}
                  aria-pressed={on}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 6,
                    padding: '10px 6px',
                    borderRadius: 10,
                    border: `1px solid ${on ? g.color + '66' : 'var(--border)'}`,
                    background: on ? `${g.color}15` : 'transparent',
                    transition: 'all 220ms ease',
                    transform: on ? 'translateY(-2px)' : 'none',
                    cursor: 'pointer',
                  }}
                >
                  <Emoji code={a.emoji} label={a.label} size={26} />
                  <div
                    style={{
                      fontSize: 10,
                      color: on ? 'var(--ink)' : 'var(--ink-soft)',
                      fontFamily: 'var(--mono)',
                      letterSpacing: '0.02em',
                      textAlign: 'center',
                      lineHeight: 1.2,
                    }}
                  >
                    {a.label}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function Chip({ label, color, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '6px 14px',
        borderRadius: 999,
        border: `1px solid ${active ? color + '66' : 'var(--border)'}`,
        background: active ? `${color}20` : 'transparent',
        color: active ? color : 'var(--ink-dim)',
        fontFamily: 'var(--mono)',
        fontSize: 9,
        letterSpacing: '0.2em',
        textTransform: 'uppercase',
        flexShrink: 0,
        cursor: 'pointer',
      }}
    >
      {label}
    </button>
  );
}
