// ─────────────────────────────────────────────────────────────
// Rituals — the practice library.
// ─────────────────────────────────────────────────────────────
// Scrollable, kind-filterable list of 13 curated rituals. Each
// card shows the kind emoji, duration, name, one-line blurb, and
// whether it uses ambient audio. Tap a card → /rituals/:id
// (the RitualPlayer).
// ─────────────────────────────────────────────────────────────

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Screen from '../../components/Screen.jsx';
import Card from '../../components/Card.jsx';
import Emoji from '../../components/Emoji.jsx';
import { SeedOfLife } from '../../components/SacredGeometry.jsx';
import { RITUALS, KINDS } from '../../data/rituals.js';
import { useStore, selectRitualStats } from '../../lib/store.js';

export default function Rituals() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all');
  const ritualsSlice = useStore((s) => s.rituals);
  const stats = useMemo(
    () => selectRitualStats({ rituals: ritualsSlice }),
    [ritualsSlice],
  );

  const kindList = useMemo(() => [{ id: 'all', label: 'All', color: 'var(--ink)' }, ...Object.values(KINDS)], []);
  const visible = useMemo(
    () => (filter === 'all' ? RITUALS : RITUALS.filter((r) => r.kind === filter)),
    [filter],
  );

  return (
    <Screen
      label="Rituals"
      title="Practices"
      subtitle={`${stats.total} completed · ${stats.streak} day streak`}
      glyph={<SeedOfLife size={36} color="#b197fc" opacity={0.45} spin={220} strokeWidth={0.5} />}
    >
      {/* Filter chips */}
      <div
        style={{
          display: 'flex',
          gap: 6,
          overflowX: 'auto',
          paddingBottom: 12,
          marginBottom: 18,
          borderBottom: '1px solid var(--border)',
        }}
      >
        {kindList.map((k) => {
          const on = filter === k.id;
          return (
            <button
              key={k.id}
              onClick={() => setFilter(k.id)}
              className="mono"
              style={{
                padding: '8px 16px',
                borderRadius: 999,
                flexShrink: 0,
                border: `1px solid ${on ? `color-mix(in srgb, ${k.color} 55%, transparent)` : 'var(--border)'}`,
                background: on ? `color-mix(in srgb, ${k.color} 12%, transparent)` : 'transparent',
                color: on ? k.color : 'var(--ink-dim)',
                fontSize: 10,
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                cursor: 'pointer',
              }}
            >
              {k.label}
            </button>
          );
        })}
      </div>

      {/* Ritual cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
        {visible.map((r) => {
          const k = KINDS[r.kind];
          return (
            <Card key={r.id} accent={k?.color} padding={14} style={{ cursor: 'pointer' }}>
              <button
                onClick={() => navigate(`/rituals/${r.id}`)}
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
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    display: 'grid',
                    placeItems: 'center',
                    background: `color-mix(in srgb, ${k?.color || 'var(--accent)'} 14%, transparent)`,
                    flexShrink: 0,
                  }}
                >
                  <Emoji code={r.emoji || k?.emoji} size={22} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'baseline',
                      gap: 10,
                      flexWrap: 'wrap',
                    }}
                  >
                    <span style={{ fontSize: 16, color: 'var(--ink)', fontWeight: 400 }}>
                      {r.name}
                    </span>
                    <span
                      className="mono"
                      style={{
                        fontSize: 9,
                        letterSpacing: '0.2em',
                        color: k?.color || 'var(--ink-dim)',
                        textTransform: 'uppercase',
                      }}
                    >
                      {r.duration} min · {k?.label}
                      {r.ambient ? ' · ♪' : ''}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      color: 'var(--ink-soft)',
                      fontStyle: 'italic',
                      marginTop: 2,
                    }}
                  >
                    {r.blurb}
                  </div>
                </div>
                <div
                  style={{
                    fontSize: 20,
                    color: 'var(--ink-dim)',
                    flexShrink: 0,
                  }}
                >
                  →
                </div>
              </button>
            </Card>
          );
        })}
      </div>
    </Screen>
  );
}
