// ─────────────────────────────────────────────────────────────
// Engram — your evolving personality replica.
// ─────────────────────────────────────────────────────────────
// Three tabs:
//   • Stats   — level, XP, domain attributes
//   • World   — global archetype distribution, rarity, sectors
//   • Growth  — journal history, ritual streak, reflection
//
// Combat is gone. Growth stays.
// ─────────────────────────────────────────────────────────────

import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Screen from '../../components/Screen.jsx';
import Card from '../../components/Card.jsx';
import Button from '../../components/Button.jsx';
import Empty from '../../components/Empty.jsx';
import { Sigil } from '../../components/SacredGeometry.jsx';
import { useStore } from '../../lib/store.js';
import { DOMAINS, TYPES, getType, getDomainAvg, getPercentile } from '../../data/enneagram.js';
import { levelFromXp, xpToNext, levelProgress } from './rewards.js';
import { selectRitualStats, selectTotalNoteCount } from '../../lib/store.js';

const TABS = [
  { id: 'stats', label: 'Stats' },
  { id: 'world', label: 'World' },
  { id: 'growth', label: 'Growth' },
];

export default function Engram() {
  const navigate = useNavigate();
  const iris = useStore((s) => s.iris);
  const engram = useStore((s) => s.engram);

  const [tab, setTab] = useState('stats');

  const facetScores = iris?.facetScores;
  const userType = iris?.enneagramType;
  const userTypeMeta = userType ? getType(userType) : null;

  // Derived stats
  const level = levelFromXp(engram.xp);
  const progress = levelProgress(engram.xp);
  const toNext = xpToNext(engram.xp);

  const domainStats = useMemo(() => {
    if (!facetScores) return null;
    return DOMAINS.map((d, i) => ({
      ...d,
      score: Math.round(getDomainAvg(facetScores, i) * 100),
    }));
  }, [facetScores]);

  // ── No IRIS yet: gate the whole page ──
  if (!userType || !facetScores) {
    return (
      <Screen label="Your replica" title="Engram">
        <Empty
          emoji="1f3ad"
          title="No replica yet"
          body="Your Engram is built from your IRIS profile. Run the 16-scenario assessment and your replica comes to life — stats, world context, and growth tracking unlock here."
          action={
            <Button variant="solid" tone="var(--accent)" onClick={() => navigate('/iris')}>
              Begin IRIS
            </Button>
          }
        />
      </Screen>
    );
  }

  return (
    <Screen label="Your replica" title="Engram" subtitle="Your evolving personality replica">
      {/* Level / XP bar — always visible */}
      <Card style={{ marginBottom: 14 }} accent={userTypeMeta.color}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Sigil size={64} color={userTypeMeta.color} opacity={0.55} spin={180}>
            <div
              className="engram-breathe"
              style={{
                fontSize: 28,
                color: userTypeMeta.color,
                fontWeight: 300,
                lineHeight: 1,
                fontFamily: 'var(--serif)',
              }}
            >
              {level}
            </div>
          </Sigil>
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
              Level {level} Replica
            </div>
            <div style={{ fontSize: 20, fontWeight: 400, color: 'var(--ink)', letterSpacing: '0.02em' }}>
              {userTypeMeta.name}
            </div>
            <div
              className="mono"
              style={{ fontSize: 10, color: 'var(--ink-dim)', marginTop: 2 }}
            >
              {engram.xp} XP · {toNext} to next level
            </div>
            <div
              style={{
                height: 4,
                background: 'var(--border)',
                borderRadius: 2,
                overflow: 'hidden',
                marginTop: 8,
              }}
            >
              <div
                style={{
                  width: `${Math.round(progress * 100)}%`,
                  height: '100%',
                  background: userTypeMeta.color,
                  transition: 'width 600ms cubic-bezier(.2,1,.3,1)',
                }}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 18 }}>
        {TABS.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="mono"
              style={{
                flex: 1,
                padding: '10px 12px',
                borderRadius: 999,
                border: `1px solid ${active ? 'var(--border-strong)' : 'var(--border)'}`,
                background: active ? 'var(--bg-raised)' : 'transparent',
                color: active ? 'var(--ink)' : 'var(--ink-dim)',
                fontSize: 10,
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                transition: 'all 220ms ease',
              }}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {/* ── Tab content ── */}
      {tab === 'stats' && (
        <StatsTab
          typeMeta={userTypeMeta}
          userType={userType}
          domainStats={domainStats}
        />
      )}

      {tab === 'world' && (
        <WorldTab userType={userType} typeMeta={userTypeMeta} />
      )}

      {tab === 'growth' && <GrowthTab />}
    </Screen>
  );
}

// ─────────────────────────────────────────────────────────────
// Stats tab — domain attributes
// ─────────────────────────────────────────────────────────────
function StatsTab({ typeMeta, domainStats }) {
  return (
    <div>
      <Card style={{ marginBottom: 14 }}>
        <SectionTitle color={typeMeta.color}>Domain attributes</SectionTitle>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 6,
          }}
        >
          {domainStats.map((d) => (
            <div
              key={d.id}
              style={{
                textAlign: 'center',
                padding: '12px 6px',
                background: 'var(--bg-raised)',
                borderRadius: 8,
                border: '1px solid var(--border)',
              }}
            >
              <div
                className="mono"
                style={{
                  fontSize: 8,
                  letterSpacing: '0.22em',
                  color: 'var(--ink-dim)',
                  textTransform: 'uppercase',
                  marginBottom: 4,
                }}
              >
                {d.name}
              </div>
              <div style={{ fontSize: 22, fontWeight: 300, color: d.color, lineHeight: 1 }}>
                {d.score}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// World tab — global distribution, rarity, societal standing
// ─────────────────────────────────────────────────────────────
function WorldTab({ userType, typeMeta }) {
  const sorted = useMemo(() => {
    return Object.entries(TYPES)
      .map(([num, t]) => ({ type: parseInt(num, 10), ...t }))
      .sort((a, b) => b.pop - a.pop);
  }, []);

  const userPercentile = getPercentile(userType);
  const userPop = typeMeta.pop;

  // Sector labels
  const SECTORS = [
    { id: 'leadership', label: 'Leadership' },
    { id: 'creative', label: 'Creative' },
    { id: 'technical', label: 'Technical' },
    { id: 'service', label: 'Service' },
    { id: 'entrepreneurial', label: 'Entrepreneurial' },
  ];

  return (
    <div>
      {/* Population distribution chart */}
      <Card style={{ marginBottom: 14 }} accent={typeMeta.color}>
        <SectionTitle color={typeMeta.color}>Global distribution</SectionTitle>
        <p style={{ fontSize: 12, color: 'var(--ink-soft)', margin: '0 0 14px', lineHeight: 1.6 }}>
          How common each archetype is in the general population.
          <span style={{ color: 'var(--ink-faint)' }}> Source: Enneagram Institute / RHETI studies.</span>
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {sorted.map((t) => {
            const isYou = t.type === userType;
            return (
              <div
                key={t.type}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '6px 8px',
                  borderRadius: 6,
                  background: isYou ? `${t.color}14` : 'transparent',
                  border: isYou ? `1px solid ${t.color}40` : '1px solid transparent',
                }}
              >
                <span style={{ fontSize: 15, color: t.color, width: 22, textAlign: 'center', flexShrink: 0 }}>
                  {t.glyph}
                </span>
                <span
                  className="mono"
                  style={{
                    width: 24,
                    fontSize: 9,
                    color: 'var(--ink-dim)',
                    flexShrink: 0,
                  }}
                >
                  #{t.type}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      height: 8,
                      background: 'var(--border)',
                      borderRadius: 4,
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        width: `${t.pop}%`,
                        height: '100%',
                        background: isYou ? t.color : `${t.color}88`,
                        borderRadius: 4,
                        transition: 'width 800ms ease',
                      }}
                    />
                  </div>
                </div>
                <span
                  className="mono"
                  style={{
                    width: 32,
                    fontSize: 10,
                    color: isYou ? t.color : 'var(--ink-dim)',
                    textAlign: 'right',
                    fontWeight: isYou ? 600 : 400,
                    flexShrink: 0,
                  }}
                >
                  {t.pop}%
                </span>
                {isYou && (
                  <span
                    className="mono"
                    style={{
                      fontSize: 7,
                      letterSpacing: '0.22em',
                      color: t.color,
                      textTransform: 'uppercase',
                      flexShrink: 0,
                    }}
                  >
                    YOU
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Rarity + percentile card */}
      <Card style={{ marginBottom: 14 }} accent={typeMeta.color}>
        <SectionTitle color={typeMeta.color}>Your standing</SectionTitle>
        <div style={{ display: 'flex', gap: 24, justifyContent: 'center', marginBottom: 16 }}>
          <StatBadge label="Percentile" value={`${userPercentile}th`} color={typeMeta.color} />
          <StatBadge label="Population" value={`${userPop}%`} color={typeMeta.color} />
        </div>
        <p style={{ fontSize: 12, color: 'var(--ink-soft)', textAlign: 'center', margin: 0, lineHeight: 1.6 }}>
          Type {userType} is {userPop}% of the population — you are{' '}
          <strong style={{ color: typeMeta.color }}>rarer than {userPercentile}% of people</strong>.
        </p>
      </Card>

      {/* Societal sectors */}
      <Card accent={typeMeta.color}>
        <SectionTitle color={typeMeta.color}>Societal concentration</SectionTitle>
        <p style={{ fontSize: 12, color: 'var(--ink-soft)', margin: '0 0 14px', lineHeight: 1.6 }}>
          Where your archetype concentrates across five sectors.
        </p>
        {SECTORS.map((sec) => {
          const pct = typeMeta.society[sec.id] || 0;
          return (
            <div key={sec.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
              <span
                className="mono"
                style={{
                  width: 110,
                  fontSize: 9,
                  color: 'var(--ink-dim)',
                  textAlign: 'right',
                  flexShrink: 0,
                }}
              >
                {sec.label}
              </span>
              <div
                style={{
                  flex: 1,
                  height: 5,
                  background: 'var(--border)',
                  borderRadius: 3,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${pct}%`,
                    height: '100%',
                    background: typeMeta.color,
                    borderRadius: 3,
                    transition: 'width 1s ease',
                  }}
                />
              </div>
              <span
                className="mono"
                style={{
                  width: 30,
                  fontSize: 9,
                  color: typeMeta.color,
                  textAlign: 'right',
                  fontWeight: 600,
                  flexShrink: 0,
                }}
              >
                {pct}%
              </span>
            </div>
          );
        })}
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Growth tab — journal, ritual, reflection
// ─────────────────────────────────────────────────────────────
function GrowthTab() {
  const entries = useStore((s) => s.entries);
  const rituals = useStore((s) => s.rituals);
  const ritualStats = useMemo(() => selectRitualStats({ rituals }), [rituals]);
  const totalNotes = useStore(selectTotalNoteCount);
  const iris = useStore((s) => s.iris);
  const irisRuns = (iris.history || []).length + (iris.takenAt ? 1 : 0);

  return (
    <div>
      <Card style={{ marginBottom: 14 }}>
        <SectionTitle color="var(--ink-dim)">Reflection activity</SectionTitle>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 8,
          }}
        >
          <StatCard
            label="Journal entries"
            value={entries.length}
            subtitle={`${totalNotes} notes written`}
          />
          <StatCard
            label="Day streak"
            value={ritualStats.streak}
            subtitle={`${ritualStats.total} rituals completed`}
          />
          <StatCard
            label="IRIS runs"
            value={irisRuns}
            subtitle="personality snapshots"
          />
          <StatCard
            label="Unique days"
            value={ritualStats.uniqueDays}
            subtitle="days with at least one ritual"
          />
        </div>
      </Card>

      <Card>
        <SectionTitle color="var(--ink-dim)">XP sources</SectionTitle>
        <p style={{ fontSize: 12, color: 'var(--ink-soft)', margin: '0 0 10px', lineHeight: 1.6 }}>
          XP is earned through reflection — not combat. Each action that deepens your
          self-knowledge contributes to your replica&apos;s growth.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {[
            { label: 'Daily check-in', xp: 10 },
            { label: 'Streak day bonus', xp: 5 },
            { label: 'IRIS assessment', xp: 50 },
            { label: 'Journal note', xp: 25 },
            { label: 'Ritual completion', xp: '15–40' },
          ].map((r) => (
            <div
              key={r.label}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '6px 0',
                borderBottom: '1px solid var(--border)',
              }}
            >
              <span style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{r.label}</span>
              <span className="mono" style={{ fontSize: 10, color: 'var(--ink-dim)' }}>
                +{r.xp} XP
              </span>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 14, textAlign: 'center' }}>
          <a href="/psyche" style={{ textDecoration: 'none' }}>
            <Button variant="subtle" size="sm">
              Psyche Engine →
            </Button>
          </a>
        </div>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Shared helpers
// ─────────────────────────────────────────────────────────────

function SectionTitle({ children, color }) {
  return (
    <div
      className="mono"
      style={{
        fontSize: 9,
        letterSpacing: '0.3em',
        color: color || 'var(--ink-dim)',
        textTransform: 'uppercase',
        marginBottom: 12,
      }}
    >
      {children}
    </div>
  );
}

function StatBadge({ label, value, color }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div
        style={{
          fontSize: 24,
          fontWeight: 300,
          color,
          lineHeight: 1,
          fontFamily: 'var(--mono)',
        }}
      >
        {value}
      </div>
      <div
        className="mono"
        style={{
          fontSize: 7,
          letterSpacing: '0.22em',
          color: 'var(--ink-dim)',
          textTransform: 'uppercase',
          marginTop: 4,
        }}
      >
        {label}
      </div>
    </div>
  );
}

function StatCard({ label, value, subtitle }) {
  return (
    <div
      style={{
        textAlign: 'center',
        padding: '14px 8px',
        background: 'var(--bg-raised)',
        borderRadius: 8,
        border: '1px solid var(--border)',
      }}
    >
      <div style={{ fontSize: 28, fontWeight: 300, color: 'var(--ink)', lineHeight: 1 }}>
        {value}
      </div>
      <div
        className="mono"
        style={{
          fontSize: 8,
          letterSpacing: '0.22em',
          color: 'var(--ink-dim)',
          textTransform: 'uppercase',
          margin: '6px 0 2px',
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 10, color: 'var(--ink-faint)' }}>
        {subtitle}
      </div>
    </div>
  );
}
