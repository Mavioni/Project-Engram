// ─────────────────────────────────────────────────────────────
// Self Mirror — unlocked panel.
// ─────────────────────────────────────────────────────────────
// Renders the active per-window snapshot: window pills, Drift,
// Themes, Mood-language. Render-only — no IO, no crypto, no store
// mutations. Owns no state beyond what props hand in.
// ─────────────────────────────────────────────────────────────

import { useNavigate } from 'react-router-dom';
import Card from '../../components/Card.jsx';
import Button from '../../components/Button.jsx';
import Empty from '../../components/Empty.jsx';
import Emoji from '../../components/Emoji.jsx';
import { WINDOW_IDS } from './model/schema.js';

const TABS = [
  { id: WINDOW_IDS.RECENT, key: 'recent', label: 'Recent', hint: '30 days' },
  { id: WINDOW_IDS.MID, key: 'mid', label: 'Mid', hint: '90 days' },
  { id: WINDOW_IDS.LONG, key: 'long', label: 'Long', hint: 'All time' },
];
const THEMES_RENDERED = 20;
const PER_MOOD_PHRASES = 5;

const MONO = { fontSize: 9, letterSpacing: '0.28em', textTransform: 'uppercase' };
const SERIF_ITALIC = { fontFamily: 'var(--serif)', fontStyle: 'italic' };

/**
 * @typedef {import('./model/schema.js').MirrorSnapshotPayload} SnapshotPayload
 * @typedef {{ recent: SnapshotPayload|null, mid: SnapshotPayload|null, long: SnapshotPayload|null }} SnapshotBundle
 */

/**
 * @param {{
 *   snapshots: SnapshotBundle | null,
 *   activeWindow: 'recent-30d' | 'mid-90d' | 'long-all',
 *   setActiveWindow: (id: 'recent-30d' | 'mid-90d' | 'long-all') => void,
 *   accent: string,
 * }} props
 */
export default function SelfMirrorPanel({
  snapshots,
  activeWindow,
  setActiveWindow,
  accent,
}) {
  const navigate = useNavigate();
  const activeKey = TABS.find((t) => t.id === activeWindow)?.key ?? 'mid';
  const snap = snapshots ? snapshots[activeKey] : null;
  const hasContent = snap && Object.keys(snap.phraseCounts || {}).length > 0;

  return (
    <>
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
              className="mono"
              style={{
                padding: '8px 16px',
                borderRadius: 999,
                border: `1px solid ${on ? accent + '88' : 'var(--border)'}`,
                background: on ? `${accent}12` : 'transparent',
                color: on ? accent : 'var(--ink-dim)',
                fontSize: 10,
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                transition: 'all 220ms ease',
              }}
            >
              {t.label} · {t.hint}
            </button>
          );
        })}
      </div>

      {hasContent ? (
        <>
          <DriftCard drift={snap.drift} accent={accent} />
          <ThemesCard themeScores={snap.themeScores} accent={accent} />
          <MoodLanguageCard moodLanguage={snap.moodLanguage} accent={accent} />
        </>
      ) : (
        <Card accent={accent}>
          <Empty
            emoji="1f5d2"
            title="Nothing reflected yet"
            body="Journal for a few days and your mirror will start to speak."
            action={
              <Button
                variant="solid"
                tone={accent}
                onClick={() => navigate('/journal/checkin')}
              >
                First check-in
              </Button>
            }
          />
        </Card>
      )}
    </>
  );
}

/** @param {{ drift: { added: string[], rising: string[], fading: string[] }, accent: string }} props */
function DriftCard({ drift, accent }) {
  const groups = [
    { label: 'Rising', phrases: drift?.rising ?? [], tone: '#7eb5ff', fb: 'no rise detected' },
    { label: 'Fading', phrases: drift?.fading ?? [], tone: '#ffa9a9', fb: 'no fade detected' },
    { label: 'New', phrases: drift?.added ?? [], tone: accent, fb: 'nothing new' },
  ];
  return (
    <Card style={{ marginBottom: 14 }} accent={accent}>
      <SectionHeader emoji="1f30a" title="Drift" subtitle="What's moving" />
      <div style={{ display: 'grid', gap: 16 }}>
        {groups.map((g) => (
          <div key={g.label}>
            <div className="mono" style={{ ...MONO, color: g.tone, marginBottom: 8 }}>
              {g.label}
            </div>
            {g.phrases.length === 0 ? (
              <div style={{ fontSize: 13, color: 'var(--ink-faint)', fontStyle: 'italic' }}>
                {g.fb}
              </div>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {g.phrases.map((p) => (
                  <span
                    key={p}
                    style={{
                      ...SERIF_ITALIC,
                      padding: '4px 10px',
                      borderRadius: 999,
                      border: `1px solid ${g.tone}33`,
                      background: `${g.tone}10`,
                      color: 'var(--ink)',
                      fontSize: 13,
                    }}
                  >
                    {p}
                  </span>
                ))}
              </div>
            )}
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
    <Card style={{ marginBottom: 14 }} accent={accent}>
      <SectionHeader
        emoji="1f30c"
        title="Themes"
        subtitle={`Top ${entries.length} phrases, classified`}
      />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          columnGap: 20,
          rowGap: 8,
        }}
      >
        {entries.map(([phrase, { classification: c }]) => {
          const glyph = c > 0 ? '↑' : c < 0 ? '↓' : '·';
          const color = c > 0 ? accent : c < 0 ? 'var(--ink-faint)' : 'var(--ink-dim)';
          return (
            <div
              key={phrase}
              style={{
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'space-between',
                gap: 8,
                minWidth: 0,
              }}
            >
              <span
                style={{
                  ...SERIF_ITALIC,
                  flex: 1,
                  minWidth: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  fontSize: 14,
                  color: 'var(--ink)',
                }}
              >
                {phrase}
              </span>
              <span className="mono" style={{ fontSize: 11, color, letterSpacing: '0.12em' }}>
                {glyph}
              </span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

/** @param {{ moodLanguage: Record<string, Record<string, number>>, accent: string }} props */
function MoodLanguageCard({ moodLanguage, accent }) {
  const moods = Object.entries(moodLanguage || {});
  if (moods.length === 0) return null;
  return (
    <Card style={{ marginBottom: 14 }} accent={accent}>
      <SectionHeader
        emoji="1f30a"
        title="Mood language"
        subtitle="What you reach for, by mood"
      />
      <div style={{ display: 'grid', gap: 14 }}>
        {moods.map(([mood, counts]) => {
          const top = Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, PER_MOOD_PHRASES)
            .map(([phrase]) => phrase)
            .join(' · ');
          return (
            <div key={mood}>
              <div className="mono" style={{ ...MONO, color: accent, marginBottom: 6 }}>
                {mood}
              </div>
              <div
                style={{ ...SERIF_ITALIC, fontSize: 14, color: 'var(--ink-soft)', lineHeight: 1.8 }}
              >
                {top}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

/** @param {{ emoji: string, title: string, subtitle?: string }} props */
function SectionHeader({ emoji, title, subtitle }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
      <Emoji code={emoji} size={22} />
      <div>
        <div className="mono" style={{ ...MONO, color: 'var(--ink-dim)' }}>
          {title}
        </div>
        {subtitle && (
          <div style={{ fontSize: 12, color: 'var(--ink-soft)', fontStyle: 'italic' }}>
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
}
