// ─────────────────────────────────────────────────────────────
// Self Mirror — unlocked panel.
// ─────────────────────────────────────────────────────────────
// Renders the active per-window snapshot: window pills, Drift,
// Themes, Mood-language, plus entry browser and export.
// Render-only — no IO, no crypto, no store mutations.
// ─────────────────────────────────────────────────────────────

import { useEffect, useState } from 'react';
import Card from '../../components/Card.jsx';
import Button from '../../components/Button.jsx';
import Empty from '../../components/Empty.jsx';
import { WINDOW_IDS } from './model/schema.js';
import { buildExportBundle } from './storage/export.js';

const TABS = [
  { id: WINDOW_IDS.RECENT, key: 'recent', label: 'Recent', hint: '30 days' },
  { id: WINDOW_IDS.MID, key: 'mid', label: 'Mid', hint: '90 days' },
  { id: WINDOW_IDS.LONG, key: 'long', label: 'Long', hint: 'All time' },
];
const THEMES_RENDERED = 20;
const PER_MOOD_PHRASES = 5;

const MONO = { fontSize: 9, letterSpacing: '0.28em', textTransform: 'uppercase' };

/**
 * @typedef {import('./model/schema.js').MirrorSnapshotPayload} SnapshotPayload
 * @typedef {{ recent: SnapshotPayload|null, mid: SnapshotPayload|null, long: SnapshotPayload|null }} SnapshotBundle
 */

/**
 * @param {{
 *   snapshots: SnapshotBundle | null,
 *   entries: Array<{id:string, createdDay:string, sourceKind:string, text:string, mood?:number}>,
 *   entriesBusy: boolean,
 *   loadEntries: (fromDay: string, toDay: string) => Promise<void>,
 *   activeWindow: 'recent-30d' | 'mid-90d' | 'long-all',
 *   setActiveWindow: (id: 'recent-30d' | 'mid-90d' | 'long-all') => void,
 *   accent: string,
 * }} props
 */
export default function SelfMirrorPanel({
  snapshots,
  entries,
  entriesBusy,
  loadEntries,
  activeWindow,
  setActiveWindow,
  accent,
}) {
  const [exportBusy, setExportBusy] = useState(false);
  const activeKey = TABS.find((t) => t.id === activeWindow)?.key ?? 'mid';
  const snap = snapshots ? snapshots[activeKey] : null;
  const hasContent = snap && Object.keys(snap.phraseCounts || {}).length > 0;

  // Auto-load entries when snapshots are ready (once, on mount)
  useEffect(() => {
    if (snapshots && entries.length === 0 && !entriesBusy) {
      const d = new Date();
      const toDay = d.toISOString().slice(0, 10);
      const from = new Date(d);
      from.setDate(from.getDate() - 30);
      loadEntries(from.toISOString().slice(0, 10), toDay);
    }
  }, [snapshots]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleExport = async () => {
    setExportBusy(true);
    try {
      const bundle = await buildExportBundle(null);
      const json = JSON.stringify(bundle, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `engram-self-mirror-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {
      console.warn('Self Mirror export failed:', e.message);
    } finally {
      setExportBusy(false);
    }
  };

  return (
    <>
      {/* ── Window tabs ── */}
      <div
        role="tablist"
        aria-label="Retention windows"
        style={{ display: 'flex', gap: 6, marginBottom: 16 }}
      >
        {TABS.map((t) => {
          const on = t.id === activeWindow;
          return (
            <button
              key={t.id}
              role="tab"
              aria-selected={on}
              onClick={() => setActiveWindow(t.id)}
              style={{
                flex: 1,
                padding: '10px 0',
                borderRadius: 8,
                border: 'none',
                background: on ? `${accent}14` : 'transparent',
                color: on ? accent : 'var(--ink-dim)',
                fontFamily: 'var(--mono)',
                fontSize: 10,
                letterSpacing: '0.18em',
                cursor: 'pointer',
                transition: 'all 200ms ease',
              }}
            >
              <div style={{ fontWeight: on ? 600 : 400 }}>{t.label}</div>
              <div style={{ fontSize: 8, opacity: 0.6, marginTop: 2 }}>{t.hint}</div>
            </button>
          );
        })}
      </div>

      {/* ── Drift ── */}
      {snap && hasContent && (
        <DriftCard snap={snap} accent={accent} />
      )}

      {/* ── Themes ── */}
      {snap && hasContent && (
        <ThemesCard themeScores={snap.themeScores} accent={accent} />
      )}

      {/* ── Mood-language ── */}
      {snap && hasContent && (
        <MoodLanguageCard moodPhrases={snap.moodPhrases} accent={accent} />
      )}

      {/* ── Entry browser ── */}
      <Card accent={accent} style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: entries.length > 0 ? 12 : 0 }}>
          <div>
            <div className="mono" style={{ ...MONO, color: accent, marginBottom: 4 }}>
              Encrypted entries
            </div>
            <div style={{ fontSize: 12, color: 'var(--ink-soft)', fontStyle: 'italic' }}>
              {entries.length > 0
                ? `${entries.length} entries decrypted`
                : 'Load to browse your journal'}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button
              variant="subtle"
              size="sm"
              tone={accent}
              onClick={() => {
                const d = new Date();
                const toDay = d.toISOString().slice(0, 10);
                const from = new Date(d);
                from.setDate(from.getDate() - 30);
                loadEntries(from.toISOString().slice(0, 10), toDay);
              }}
              disabled={entriesBusy}
            >
              {entriesBusy ? 'Loading…' : 'Load recent'}
            </Button>
            <Button
              variant="subtle"
              size="sm"
              tone={accent}
              onClick={handleExport}
              disabled={exportBusy}
            >
              {exportBusy ? 'Exporting…' : 'Export'}
            </Button>
          </div>
        </div>

        {entries.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 360, overflowY: 'auto' }}>
            {entries.map((e) => (
              <div
                key={e.id}
                style={{
                  padding: '10px 12px',
                  borderRadius: 8,
                  background: 'var(--bg-soft)',
                  border: '1px solid var(--border)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span className="mono" style={{ fontSize: 9, color: 'var(--ink-dim)', letterSpacing: '0.1em' }}>
                    {e.createdDay}
                  </span>
                  {typeof e.mood === 'number' && (
                    <span style={{
                      width: 8, height: 8, borderRadius: '50%',
                      background: `hsl(${240 - e.mood * 50}, 60%, 60%)`,
                      flexShrink: 0,
                    }} />
                  )}
                </div>
                <div style={{ fontSize: 13, color: 'var(--ink)', lineHeight: 1.6, fontFamily: 'var(--serif)', whiteSpace: 'pre-wrap' }}>
                  {e.text.length > 300 ? e.text.slice(0, 300) + '…' : e.text}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* ── Empty state ── */}
      {!hasContent && entries.length === 0 && !entriesBusy && (
        <Empty
          emoji="1f52e"
          title="No patterns yet"
          body="Keep journaling — the mirror sharpens with every entry."
        />
      )}
    </>
  );
}

// ── Existing sub-components (unchanged) ─────────────────────

/** @param {{ snap: SnapshotPayload, accent: string }} props */
function DriftCard({ snap, accent }) {
  const drift = snap.drift || [];
  if (drift.length === 0) return null;
  const top = drift.slice(0, 8);

  return (
    <Card accent={accent} style={{ marginBottom: 16 }}>
      <div className="mono" style={{ ...MONO, color: accent, marginBottom: 10 }}>
        Signal drift
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {top.map(({ phrase, g2, direction }) => (
          <div
            key={phrase}
            style={{
              padding: '4px 10px',
              borderRadius: 999,
              background: direction === 'up' ? 'rgba(105,219,124,0.08)' : 'rgba(255,107,107,0.08)',
              border: `1px solid ${direction === 'up' ? 'rgba(105,219,124,0.2)' : 'rgba(255,107,107,0.2)'}`,
              fontSize: 11,
              color: direction === 'up' ? '#69db7c' : '#ff6b6b',
              fontFamily: 'var(--mono)',
              letterSpacing: '0.04em',
            }}
          >
            {phrase}
            <span style={{ fontSize: 9, marginLeft: 4, opacity: 0.6 }}>
              {direction === 'up' ? '↑' : '↓'}{g2.toFixed(1)}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}

/** @param {{ themeScores: Record<string, { score: number, classification: -1|0|1 }>, accent: string }} props */
function ThemesCard({ themeScores, accent }) {
  const entries = Object.entries(themeScores || {})
    .sort((a, b) => b[1].score - a[1].score)
    .slice(0, THEMES_RENDERED);

  if (entries.length === 0) return null;

  return (
    <Card accent={accent} style={{ marginBottom: 16 }}>
      <div className="mono" style={{ ...MONO, color: accent, marginBottom: 10 }}>
        Recurring themes
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {entries.map(([phrase, { score, classification }]) => (
          <div
            key={phrase}
            style={{
              padding: '4px 10px',
              borderRadius: 999,
              background: classification === 1
                ? 'rgba(105,219,124,0.06)'
                : classification === -1
                  ? 'rgba(255,107,107,0.06)'
                  : 'transparent',
              border: '1px solid var(--border)',
              fontSize: 11,
              color: 'var(--ink-soft)',
              fontFamily: 'var(--mono)',
              letterSpacing: '0.04em',
              opacity: 0.3 + score * 0.7,
            }}
          >
            {phrase}
          </div>
        ))}
      </div>
    </Card>
  );
}

/** @param {{ moodPhrases: Record<string, string[]>, accent: string }} props */
function MoodLanguageCard({ moodPhrases, accent }) {
  const moods = Object.entries(moodPhrases || {});
  if (moods.length === 0) return null;

  return (
    <Card accent={accent} style={{ marginBottom: 16 }}>
      <div className="mono" style={{ ...MONO, color: accent, marginBottom: 10 }}>
        Language by mood
      </div>
      {moods.map(([moodLabel, phrases]) => (
        <div key={moodLabel} style={{ marginBottom: 10 }}>
          <div className="mono" style={{ fontSize: 8, color: 'var(--ink-dim)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 4 }}>
            {moodLabel}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {phrases.slice(0, PER_MOOD_PHRASES).map((p) => (
              <span
                key={p}
                style={{
                  padding: '2px 8px',
                  borderRadius: 999,
                  background: 'var(--bg-soft)',
                  border: '1px solid var(--border)',
                  fontSize: 10,
                  color: 'var(--ink-soft)',
                  fontFamily: 'var(--mono)',
                }}
              >
                {p}
              </span>
            ))}
          </div>
        </div>
      ))}
    </Card>
  );
}
