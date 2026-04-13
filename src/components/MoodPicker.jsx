// ─────────────────────────────────────────────────────────────
// <MoodPicker /> — 5-emoji horizontal scale, big and tactile.
// Selecting one nudges the ring + recolors the halo around it.
// ─────────────────────────────────────────────────────────────

import Emoji from './Emoji.jsx';
import { MOODS } from '../data/moods.js';

export default function MoodPicker({ value, onChange, size = 'lg' }) {
  const emojiSize = size === 'lg' ? 44 : 32;
  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          gap: 6,
        }}
      >
        {MOODS.map((m) => {
          const selected = value === m.id;
          return (
            <button
              key={m.id}
              onClick={() => onChange(m.id)}
              aria-label={m.label}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 6,
                padding: '10px 2px 6px',
                borderRadius: 12,
                background: selected ? `${m.color}15` : 'transparent',
                border: `1px solid ${selected ? m.color + '55' : 'transparent'}`,
                transition: 'all 260ms cubic-bezier(.2,1,.3,1)',
                transform: selected ? 'translateY(-3px)' : 'none',
              }}
            >
              <div
                style={{
                  position: 'relative',
                  width: emojiSize + 12,
                  height: emojiSize + 12,
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                {selected && (
                  <div
                    style={{
                      position: 'absolute',
                      inset: -4,
                      borderRadius: '50%',
                      background: `radial-gradient(circle, ${m.color}44, transparent 70%)`,
                      filter: 'blur(6px)',
                    }}
                  />
                )}
                <Emoji
                  code={m.emoji}
                  label={m.label}
                  size={emojiSize}
                  style={{
                    position: 'relative',
                    transform: selected ? 'scale(1.1)' : 'scale(1)',
                    transition: 'transform 260ms cubic-bezier(.2,1,.3,1)',
                  }}
                />
              </div>
              <div
                className="mono"
                style={{
                  fontSize: 8,
                  letterSpacing: '0.2em',
                  color: selected ? m.color : 'var(--ink-dim)',
                  textTransform: 'uppercase',
                }}
              >
                {m.label}
              </div>
            </button>
          );
        })}
      </div>
      {value && (
        <div
          style={{
            textAlign: 'center',
            marginTop: 14,
            color: 'var(--ink-soft)',
            fontStyle: 'italic',
            fontSize: 14,
          }}
        >
          {MOODS.find((m) => m.id === value)?.subtitle}
        </div>
      )}
    </div>
  );
}
