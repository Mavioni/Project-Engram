// ─────────────────────────────────────────────────────────────
// <LevelUpToast /> — celebration that appears when the store's
// `engram.pendingLevelUp` flips to a number.
// ─────────────────────────────────────────────────────────────
// Dismissed by tap anywhere. Auto-dismisses after 6 seconds.
// Fires one-time per level boundary — awardXp + recordBattle
// both set the flag when the level advances, and this component
// clears it via `acknowledgeLevelUp`.
//
// Lives above the route content (inside App shell), so it works
// on every page without needing per-feature wiring.
// ─────────────────────────────────────────────────────────────

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../lib/store.js';
import { getType } from '../data/enneagram.js';
import { Sigil } from './SacredGeometry.jsx';

const AUTO_DISMISS_MS = 6000;

export default function LevelUpToast() {
  const navigate = useNavigate();
  const level = useStore((s) => s.engram?.pendingLevelUp);
  const acknowledge = useStore((s) => s.acknowledgeLevelUp);
  const enneagramType = useStore((s) => s.iris?.enneagramType);
  const typeMeta = enneagramType ? getType(enneagramType) : null;
  const accent = typeMeta?.color || 'var(--accent)';

  useEffect(() => {
    if (!level) return;
    const id = setTimeout(acknowledge, AUTO_DISMISS_MS);
    return () => clearTimeout(id);
  }, [level, acknowledge]);

  if (!level) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      onClick={acknowledge}
      style={{
        position: 'fixed',
        inset: 'auto 0 calc(var(--nav-height) + var(--safe-bottom) + 20px) 0',
        display: 'grid',
        placeItems: 'center',
        zIndex: 200,
        cursor: 'pointer',
        pointerEvents: 'auto',
        animation: 'engramFadeIn 320ms cubic-bezier(0.2, 1, 0.3, 1)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          padding: '14px 20px',
          borderRadius: 999,
          background: 'var(--bg-raised)',
          border: `1px solid color-mix(in srgb, ${accent} 45%, transparent)`,
          boxShadow:
            'var(--shadow-card), 0 0 42px color-mix(in srgb, var(--accent) 25%, transparent)',
          maxWidth: 'min(420px, 90vw)',
        }}
      >
        <Sigil size={40} color={accent} opacity={0.55} spin={60}>
          <div
            className="engram-breathe"
            style={{
              fontSize: 16,
              fontWeight: 500,
              color: accent,
              fontFamily: 'var(--serif)',
              lineHeight: 1,
            }}
          >
            {level}
          </div>
        </Sigil>
        <div style={{ minWidth: 0 }}>
          <div
            className="mono"
            style={{
              fontSize: 8,
              letterSpacing: '0.3em',
              color: 'var(--ink-dim)',
              textTransform: 'uppercase',
              marginBottom: 2,
            }}
          >
            Level up
          </div>
          <div style={{ fontSize: 15, color: 'var(--ink)', fontWeight: 400 }}>
            Your replica reached level {level}
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            acknowledge();
            navigate('/engram');
          }}
          className="mono"
          style={{
            padding: '6px 14px',
            borderRadius: 999,
            border: `1px solid color-mix(in srgb, ${accent} 40%, transparent)`,
            background: 'transparent',
            color: accent,
            fontSize: 9,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          View
        </button>
      </div>
    </div>
  );
}
