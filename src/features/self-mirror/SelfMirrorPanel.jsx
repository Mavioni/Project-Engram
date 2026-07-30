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
import { redactForDisplay } from './privacy/redact.js';

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
  searchQuery,
  setSearchQuery,
  searchAllEntries,
  redactionRules,
  setRedactionRules,
  activeWindow,
  setActiveWindow,
  accent,
}) {
  const [exportBusy, setExportBusy] = useState(false);
  const [showRedact, setShowRedact] = useState(false);
  const activeKey = TABS.find((t) => t.id === activeWindow)?.key ?? 'mid';
  const snap = snapshots ? snapshots[activeKey] : null;
  const hasContent = snap && Object.keys(snap.phraseCounts || {}).length > 0;

  // Filter entries by search query (case-insensitive, any field)
  const q = searchQuery.trim().toLowerCase();
  const filteredEntries = q
    ? entries.filter((e) =>
        e.text.toLowerCase().includes(q) ||
        e.createdDay.includes(q) ||
        (e.sourceKind || '').toLowerCase().includes(q))
    : entries;

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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div>
            <div className="mono" style={{ ...MONO, color: accent, marginBottom: 4 }}>
              Encrypted entries
            </div>
            <div style={{ fontSize: 12, color: 'var(--ink-soft)', fontStyle: 'italic' }}>
              {entries.length > 0
                ? `${filteredEntries.length} of ${entries.length} entries`
                : 'Load to browse your journal'}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="subtle" size="sm" tone={accent} onClick={searchAllEntries} disabled={entriesBusy}>
              {entriesBusy ? 'Loading…' : 'Load all'}
            </Button>
            <Button variant="subtle" size="sm" tone={accent}
              onClick={() => {
                const d = new Date();
                loadEntries(new Date(d.getFullYear(), d.getMonth(), d.getDate() - 30).toISOString().slice(0, 10), d.toISOString().slice(0, 10));
              }}
              disabled={entriesBusy}>
              Recent
            </Button>
            <Button variant="subtle" size="sm" tone={accent} onClick={handleExport} disabled={exportBusy}>
              {exportBusy ? 'Exporting…' : 'Export'}
            </Button>
          </div>
        </div>

        {/* Search bar */}
        {entries.length > 0 && (
          <div style={{ marginBottom: 8 }}>
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search entries…"
              style={{
                width: '100%', padding: '8px 12px', borderRadius: 8,
                border: `1px solid ${accent}30`, background: 'var(--bg-soft)',
                color: 'var(--ink)', fontSize: 13, fontFamily: 'var(--serif)',
                outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>
        )}

        {filteredEntries.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 360, overflowY: 'auto' }}>
            {filteredEntries.map((e) => (
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
                  {redactForDisplay(e.text.length > 300 ? e.text.slice(0, 300) + '…' : e.text, redactionRules)}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* ── Redaction settings ── */}
      <Card accent={accent} style={{ marginBottom: 16 }}>
        <button
          onClick={() => setShowRedact((v) => !v)}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'inherit',
          }}
        >
          <div>
            <div className="mono" style={{ ...MONO, color: accent, marginBottom: 2 }}>
              Display redaction
            </div>
            <div style={{ fontSize: 11, color: 'var(--ink-soft)', fontStyle: 'italic' }}>
              {showRedact ? 'Tap to collapse' : 'Mask names, places, sensitive terms in the entry list'}
            </div>
          </div>
          <span style={{ color: 'var(--ink-dim)', fontSize: 14 }}>{showRedact ? '▴' : '▾'}</span>
        </button>

        {showRedact && (
          <div style={{ marginTop: 12 }}>
            <TokenField
              label="Family names"
              tokens={redactionRules.familyNames}
              onChange={(v) => setRedactionRules({ ...redactionRules, familyNames: v })}
              accent={accent}
            />
            <TokenField
              label="Locations"
              tokens={redactionRules.locations}
              onChange={(v) => setRedactionRules({ ...redactionRules, locations: v })}
              accent={accent}
            />
            <TokenField
              label="IRIS / sensitive"
              tokens={redactionRules.irisSensitive}
              onChange={(v) => setRedactionRules({ ...redactionRules, irisSensitive: v })}
              accent={accent}
            />
            <div className="mono" style={{ fontSize: 8, color: 'var(--ink-faint)', letterSpacing: '0.1em', marginTop: 8 }}>
              Emails, phones, and URLs are always masked. Tokens here are additional.
            </div>
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

// ── Redaction token input ──────────────────────────────────

/** @param {{ label: string, tokens: string[], onChange: (tokens: string[]) => void, accent: string }} props */
function TokenField({ label, tokens, onChange, accent }) {
  const [draft, setDraft] = useState('');
  const [editing, setEditing] = useState(false);

  const displayText = editing ? draft : tokens.join(', ');

  const apply = () => {
    const parsed = draft
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    onChange(parsed);
    setEditing(false);
  };

  const startEdit = () => {
    setDraft(tokens.join(', '));
    setEditing(true);
  };

  const removeToken = (idx) => {
    onChange(tokens.filter((_, i) => i !== idx));
  };

  return (
    <div style={{ marginBottom: 8 }}>
      <div className="mono" style={{ fontSize: 8, color: 'var(--ink-dim)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <input
          value={displayText}
          onChange={(e) => setDraft(e.target.value)}
          onFocus={startEdit}
          onBlur={apply}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); apply(); } }}
          placeholder="token, another token"
          style={{
            flex: 1, padding: '6px 10px', borderRadius: 6,
            border: `1px solid ${accent}30`, background: 'var(--bg-soft)',
            color: 'var(--ink)', fontSize: 11, fontFamily: 'var(--mono)',
            outline: 'none',
          }}
        />
        <Button variant="subtle" size="sm" tone={accent} onClick={apply}>Set</Button>
      </div>
      {tokens.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
          {tokens.map((t, i) => (
            <span key={i} style={{
              padding: '2px 8px', borderRadius: 999, fontSize: 10,
              background: `${accent}14`, border: `1px solid ${accent}30`,
              color: 'var(--ink-soft)', fontFamily: 'var(--mono)',
              display: 'inline-flex', alignItems: 'center', gap: 4,
            }}>
              {t}
              <button
                onClick={() => removeToken(i)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-dim)', fontSize: 12, lineHeight: 1, padding: 0 }}
                aria-label={`Remove ${t}`}
              >×</button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Existing sub-components ────────────────────────────────

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
