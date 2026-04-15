// ─────────────────────────────────────────────────────────────
// Insights — the analytics + AI tab.
// Top: three lock-step charts (mood trend, activity bars, streak grid).
// Middle: a radar of your IRIS domains.
// Bottom: Claude-powered insight cards (daily/weekly/monthly) + Chat.
// ─────────────────────────────────────────────────────────────

import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Screen from '../../components/Screen.jsx';
import Card from '../../components/Card.jsx';
import Button from '../../components/Button.jsx';
import Empty from '../../components/Empty.jsx';
import Emoji from '../../components/Emoji.jsx';
import {
  Divider,
  SeedOfLife,
  EnneagramGlyph,
} from '../../components/SacredGeometry.jsx';
import MoodTrend from './charts/MoodTrend.jsx';
import ActivityBars from './charts/ActivityBars.jsx';
import FacetRadar from './charts/FacetRadar.jsx';
import StreakGrid from './charts/StreakGrid.jsx';
import {
  useStore,
  selectEntriesByDay,
  selectMoodSeries,
  selectActivityFrequency,
} from '../../lib/store.js';
import { last } from '../../lib/time.js';
import { requestInsight, INSIGHT_KINDS } from '../../lib/claude.js';
import { hasSupabase } from '../../lib/supabase.js';

const WINDOWS = [
  { id: 7, label: '7d' },
  { id: 30, label: '30d' },
  { id: 90, label: '90d' },
];

export default function Insights() {
  const navigate = useNavigate();
  const [windowDays, setWindowDays] = useState(30);
  const [generating, setGenerating] = useState(null);
  const [error, setError] = useState(null);

  const entries = useStore((s) => s.entries);
  const iris = useStore((s) => s.iris);
  const subscription = useStore((s) => s.subscription);
  const insights = useStore((s) => s.insights);
  const cacheInsight = useStore((s) => s.cacheInsight);
  // Aliased away from the `use` prefix — it's a store action, not a React hook,
  // and the naming collision makes react-hooks/rules-of-hooks fire.
  const consumeAiCredit = useStore((s) => s.useAiCredit);

  const days = useMemo(() => last(windowDays), [windowDays]);
  // Memoize per-render instead of subscribing — see zustand 5 note above.
  const byDay = useMemo(() => selectEntriesByDay({ entries }), [entries]);
  const moodSeries = useMemo(
    () => selectMoodSeries({ entries }, days),
    [entries, days],
  );
  const activityFreq = useMemo(
    () => selectActivityFrequency({ entries }, days),
    [entries, days],
  );

  const isPro = subscription.tier === 'pro';
  const freeCreditsLeft = Math.max(0, 3 - (subscription.aiCreditsUsed || 0));

  const generate = async (kind) => {
    if (!isPro && freeCreditsLeft <= 0) {
      navigate('/pricing');
      return;
    }
    setError(null);
    setGenerating(kind);
    try {
      const result = await requestInsight({ kind, windowDays });
      cacheInsight({ kind, content: result.content, model: result.model, windowDays });
      if (!isPro) consumeAiCredit();
    } catch (e) {
      setError(e.message || 'Failed to generate insight.');
    } finally {
      setGenerating(null);
    }
  };

  if (entries.length === 0) {
    return (
      <Screen label="Your patterns" title="Insights">
        <Empty
          emoji="1f52e"
          title="Nothing to read yet"
          body="Insights need data. Log a few days and the graphs will start speaking."
          action={
            <Button
              variant="solid"
              tone="#ffd166"
              onClick={() => navigate('/journal/checkin')}
            >
              Start your first check-in
            </Button>
          }
        />
      </Screen>
    );
  }

  return (
    <Screen
      label="Your patterns"
      title="Insights"
      glyph={<SeedOfLife size={40} color="#7eb5ff" opacity={0.4} spin={200} strokeWidth={0.45} />}
    >
      {/* Window selector */}
      <div
        style={{
          display: 'flex',
          gap: 6,
          marginBottom: 16,
        }}
      >
        {WINDOWS.map((w) => (
          <button
            key={w.id}
            onClick={() => setWindowDays(w.id)}
            className="mono"
            style={{
              padding: '8px 16px',
              borderRadius: 999,
              border: `1px solid ${
                windowDays === w.id ? 'var(--border-strong)' : 'var(--border)'
              }`,
              background: windowDays === w.id ? 'rgba(255,255,255,0.05)' : 'transparent',
              color: windowDays === w.id ? 'var(--ink)' : 'var(--ink-dim)',
              fontSize: 10,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              cursor: 'pointer',
            }}
          >
            {w.label}
          </button>
        ))}
      </div>

      {/* Mood trend */}
      <Card style={{ marginBottom: 14 }}>
        <SectionHeader
          emoji="1f30a"
          title="Mood trend"
          subtitle={`Average: ${avgMood(moodSeries)}`}
        />
        <MoodTrend data={moodSeries} />
      </Card>

      {/* Streak grid */}
      <Card style={{ marginBottom: 14 }}>
        <SectionHeader
          emoji="1f525"
          title="Consistency"
          subtitle="Each cell is one day"
        />
        <div style={{ overflowX: 'auto', paddingBottom: 4 }}>
          <StreakGrid byDay={byDay} weeks={Math.ceil(windowDays / 7)} />
        </div>
      </Card>

      {/* Activity frequency */}
      {activityFreq.length > 0 && (
        <Card style={{ marginBottom: 14 }}>
          <SectionHeader
            emoji="1f4ca"
            title="What you did most"
            subtitle="Top lenses in the window"
          />
          <ActivityBars data={activityFreq} />
        </Card>
      )}

      {/* Facet radar */}
      {iris.facetScores && (
        <Card
          style={{ marginBottom: 14, position: 'relative', overflow: 'hidden' }}
          accent="#b197fc"
        >
          <div
            style={{
              position: 'absolute',
              right: -40,
              top: -40,
              width: 160,
              height: 160,
              pointerEvents: 'none',
              color: '#b197fc',
            }}
          >
            <EnneagramGlyph
              size={160}
              opacity={0.1}
              strokeWidth={0.4}
              spin={340}
              highlightType={iris.enneagramType}
            />
          </div>
          <div style={{ position: 'relative' }}>
            <SectionHeader
              emoji="1f441"
              title="Your IRIS domains"
              subtitle="6-axis projection of your 24 facets"
            />
            <FacetRadar facetScores={iris.facetScores} />
          </div>
        </Card>
      )}

      {/* ── Claude insights section ── */}
      <Divider color="#ffd166" opacity={0.4} glyph="seed" glyphSize={30} margin="28px 0" />
      <div style={{ marginBottom: 16 }}>
        <div
          className="mono"
          style={{
            fontSize: 9,
            letterSpacing: '0.3em',
            color: 'var(--ink-dim)',
            textTransform: 'uppercase',
            marginBottom: 10,
            textAlign: 'center',
          }}
        >
          Written by Claude, from your data
        </div>
        {!isPro && (
          <div
            style={{
              textAlign: 'center',
              fontSize: 12,
              color: 'var(--ink-dim)',
              fontFamily: 'var(--mono)',
              letterSpacing: '0.04em',
              marginBottom: 10,
            }}
          >
            {freeCreditsLeft} free insight{freeCreditsLeft === 1 ? '' : 's'} left
            this month ·{' '}
            <button
              onClick={() => navigate('/pricing')}
              style={{
                color: '#ffd166',
                textTransform: 'uppercase',
                letterSpacing: '0.2em',
              }}
            >
              Upgrade
            </button>
          </div>
        )}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: 8,
          marginBottom: 16,
        }}
      >
        <InsightBtn
          label="Daily"
          emoji="1f305"
          color="#ffd166"
          loading={generating === INSIGHT_KINDS.DAILY}
          onClick={() => generate(INSIGHT_KINDS.DAILY)}
        />
        <InsightBtn
          label="Weekly"
          emoji="1f319"
          color="#ff6b8a"
          loading={generating === INSIGHT_KINDS.WEEKLY}
          onClick={() => generate(INSIGHT_KINDS.WEEKLY)}
        />
        <InsightBtn
          label="Monthly"
          emoji="1f30c"
          color="#7eb5ff"
          loading={generating === INSIGHT_KINDS.MONTHLY}
          onClick={() => generate(INSIGHT_KINDS.MONTHLY)}
        />
      </div>

      {error && (
        <Card style={{ marginBottom: 14, borderColor: 'rgba(255,107,107,0.35)' }}>
          <div style={{ color: '#ff6b6b', fontSize: 13 }}>{error}</div>
        </Card>
      )}

      {/* Chat launcher */}
      <Card
        style={{
          marginBottom: 14,
          cursor: 'pointer',
          background: 'linear-gradient(180deg, rgba(177,151,252,0.08), rgba(177,151,252,0.02))',
        }}
        onClick={() => navigate('/insights/chat')}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Emoji code="1f4ac" size={30} label="chat" />
          <div style={{ flex: 1 }}>
            <div
              className="mono"
              style={{
                fontSize: 9,
                letterSpacing: '0.28em',
                color: '#b197fc',
                textTransform: 'uppercase',
              }}
            >
              Pro feature
            </div>
            <div style={{ fontSize: 18, fontWeight: 300, color: 'var(--ink)' }}>
              Chat with your IRIS
            </div>
            <div style={{ fontSize: 13, color: 'var(--ink-soft)', fontStyle: 'italic' }}>
              Ask Claude anything, grounded in your profile.
            </div>
          </div>
          <div style={{ color: 'var(--ink-dim)', fontSize: 22 }}>→</div>
        </div>
      </Card>

      {/* Past insights */}
      {insights.length > 0 && (
        <>
          <Divider color="#ffd166" opacity={0.4} glyph="seed" glyphSize={30} margin="28px 0" />
          <div
            className="mono"
            style={{
              fontSize: 9,
              letterSpacing: '0.3em',
              color: 'var(--ink-dim)',
              textTransform: 'uppercase',
              marginBottom: 10,
            }}
          >
            Recent insights
          </div>
          {insights.slice(0, 5).map((i) => (
            <Card key={i.id} style={{ marginBottom: 10 }}>
              <div
                className="mono"
                style={{
                  fontSize: 8,
                  letterSpacing: '0.24em',
                  color: 'var(--ink-dim)',
                  textTransform: 'uppercase',
                  marginBottom: 6,
                }}
              >
                {i.kind} · {new Date(i.createdAt).toLocaleDateString()}
              </div>
              <p
                style={{
                  margin: 0,
                  fontSize: 14,
                  lineHeight: 1.7,
                  color: 'var(--ink-soft)',
                  fontStyle: 'italic',
                }}
              >
                {i.content}
              </p>
            </Card>
          ))}
        </>
      )}

      {!hasSupabase() && (
        <div
          className="mono"
          style={{
            marginTop: 24,
            padding: 14,
            border: '1px dashed var(--border)',
            borderRadius: 10,
            fontSize: 10,
            color: 'var(--ink-dim)',
            textAlign: 'center',
            letterSpacing: '0.04em',
          }}
        >
          Claude + subscription features activate when you set Supabase env vars.
          See <code style={{ color: '#ffd166' }}>README → AI setup</code>.
        </div>
      )}
    </Screen>
  );
}

function SectionHeader({ emoji, title, subtitle }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
      <Emoji code={emoji} size={22} />
      <div>
        <div
          className="mono"
          style={{
            fontSize: 9,
            letterSpacing: '0.28em',
            color: 'var(--ink-dim)',
            textTransform: 'uppercase',
          }}
        >
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

function InsightBtn({ label, emoji, color, loading, onClick }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6,
        padding: '14px 6px',
        borderRadius: 12,
        border: `1px solid ${color}33`,
        background: `${color}10`,
        cursor: loading ? 'progress' : 'pointer',
        transition: 'all 240ms ease',
      }}
    >
      <Emoji code={emoji} size={28} />
      <div
        className="mono"
        style={{
          fontSize: 10,
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          color: color,
        }}
      >
        {loading ? '...' : label}
      </div>
    </button>
  );
}

function avgMood(series) {
  const vals = series.map((s) => s.raw).filter((v) => v != null);
  if (vals.length === 0) return '—';
  const m = vals.reduce((a, b) => a + b, 0) / vals.length;
  return `${Math.round(m * 100)} / 100`;
}
