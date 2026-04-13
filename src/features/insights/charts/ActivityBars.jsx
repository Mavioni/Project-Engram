// ─────────────────────────────────────────────────────────────
// ActivityBars — horizontal bar chart of top N activities.
// Each bar carries its group color and its emoji.
// ─────────────────────────────────────────────────────────────

import Emoji from '../../../components/Emoji.jsx';

export default function ActivityBars({ data, limit = 10 }) {
  const top = data.slice(0, limit);
  if (top.length === 0) return null;
  const max = Math.max(...top.map((d) => d.count));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {top.map((a) => (
        <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Emoji code={a.emoji} size={18} label={a.label} />
          <div
            style={{
              width: 96,
              fontFamily: 'var(--mono)',
              fontSize: 10,
              color: 'var(--ink-soft)',
              textTransform: 'lowercase',
              letterSpacing: '0.02em',
              flexShrink: 0,
            }}
          >
            {a.label}
          </div>
          <div
            style={{
              flex: 1,
              height: 8,
              background: 'rgba(255,255,255,0.04)',
              borderRadius: 4,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${(a.count / max) * 100}%`,
                height: '100%',
                background: `linear-gradient(90deg, ${a.groupColor}44, ${a.groupColor})`,
                borderRadius: 4,
                transition: 'width 520ms cubic-bezier(.2,1,.3,1)',
              }}
            />
          </div>
          <div
            style={{
              width: 24,
              textAlign: 'right',
              fontFamily: 'var(--mono)',
              fontSize: 10,
              color: 'var(--ink-dim)',
            }}
          >
            {a.count}
          </div>
        </div>
      ))}
    </div>
  );
}
