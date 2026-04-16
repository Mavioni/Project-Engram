// ─────────────────────────────────────────────────────────────
// Engram — your replica. Stats, arena, rewards.
// ─────────────────────────────────────────────────────────────
// The user's evolving personality replica lives here. Three
// sub-sections, picked via a simple tab row:
//   • Stats   — level, XP, domain attributes, defeated seals
//   • Arena   — battle the 9 archetypes; see rounds play out
//   • History — recent battle results
//
// Battle logic is pure and lives in ./combat.js. This component
// only orchestrates state + renders the outcomes.
// ─────────────────────────────────────────────────────────────

import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Screen from '../../components/Screen.jsx';
import Card from '../../components/Card.jsx';
import Button from '../../components/Button.jsx';
import Empty from '../../components/Empty.jsx';
import { Sigil } from '../../components/SacredGeometry.jsx';
import { useStore } from '../../lib/store.js';
import { DOMAINS, TYPES, getType, getDomainAvg } from '../../data/enneagram.js';
import { runBattle, seedFrom } from './combat.js';
import { levelFromXp, xpToNext, levelProgress } from './rewards.js';

const TABS = [
  { id: 'stats', label: 'Stats' },
  { id: 'arena', label: 'Arena' },
  { id: 'history', label: 'History' },
];

export default function Engram() {
  const navigate = useNavigate();
  const iris = useStore((s) => s.iris);
  const engram = useStore((s) => s.engram);
  const recordBattle = useStore((s) => s.recordBattle);

  const [tab, setTab] = useState('stats');
  const [battle, setBattle] = useState(null); // the latest battle result, if we just fought one

  const facetScores = iris?.facetScores;
  const userType = iris?.enneagramType;
  const userTypeMeta = userType ? getType(userType) : null;

  // Derived stats
  const level = levelFromXp(engram.xp);
  const progress = levelProgress(engram.xp);
  const toNext = xpToNext(engram.xp);
  const defeated = new Set(engram.defeated || []);

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
          body="Your Engram is built from your IRIS profile. Run the 16-scenario simulation and your replica comes to life — ready to enter the arena."
          action={
            <Button variant="solid" tone="var(--accent)" onClick={() => navigate('/iris')}>
              Begin IRIS
            </Button>
          }
        />
      </Screen>
    );
  }

  const handleBattle = (archetype) => {
    const seed = seedFrom(`${engram.battleHistory.length}:${archetype}:${Date.now()}`);
    const result = runBattle({ userFacetScores: facetScores, archetype, seed });
    recordBattle(result);
    setBattle(result);
  };

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
          defeated={defeated}
        />
      )}

      {tab === 'arena' && (
        <ArenaTab
          userType={userType}
          userTypeMeta={userTypeMeta}
          defeated={defeated}
          onBattle={handleBattle}
          latestBattle={battle}
          onClear={() => setBattle(null)}
        />
      )}

      {tab === 'history' && <HistoryTab history={engram.battleHistory || []} />}
    </Screen>
  );
}

// ─────────────────────────────────────────────────────────────
// Stats tab
// ─────────────────────────────────────────────────────────────
function StatsTab({ typeMeta, userType, domainStats, defeated }) {
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

      <Card accent={typeMeta.color}>
        <SectionTitle color={typeMeta.color}>Archetypes defeated</SectionTitle>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 8,
          }}
        >
          {Object.entries(TYPES).map(([num, t]) => {
            const n = parseInt(num, 10);
            const won = defeated.has(n);
            const isYou = n === userType;
            return (
              <div
                key={num}
                style={{
                  padding: '10px 6px',
                  borderRadius: 8,
                  textAlign: 'center',
                  background: won ? `${t.color}10` : 'var(--bg-raised)',
                  border: `1px solid ${won ? `${t.color}55` : 'var(--border)'}`,
                  opacity: won ? 1 : 0.55,
                }}
              >
                <div style={{ fontSize: 22, color: t.color, lineHeight: 1 }}>{t.glyph}</div>
                <div
                  className="mono"
                  style={{
                    fontSize: 8,
                    letterSpacing: '0.18em',
                    color: 'var(--ink-dim)',
                    textTransform: 'uppercase',
                    marginTop: 4,
                  }}
                >
                  #{num}
                  {isYou ? ' · you' : ''}
                </div>
              </div>
            );
          })}
        </div>
        <div
          className="mono"
          style={{
            marginTop: 12,
            fontSize: 9,
            letterSpacing: '0.04em',
            color: 'var(--ink-dim)',
            textAlign: 'center',
          }}
        >
          {defeated.size} / 9 seals claimed
        </div>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Arena tab
// ─────────────────────────────────────────────────────────────
function ArenaTab({ userType, userTypeMeta, defeated, onBattle, latestBattle, onClear }) {
  if (latestBattle) {
    return <BattleResult result={latestBattle} userTypeMeta={userTypeMeta} onClear={onClear} />;
  }
  return (
    <div>
      <Card style={{ marginBottom: 14 }}>
        <SectionTitle color={userTypeMeta.color}>Choose an opponent</SectionTitle>
        <p
          style={{
            fontSize: 13,
            color: 'var(--ink-soft)',
            fontStyle: 'italic',
            margin: '0 0 14px',
            lineHeight: 1.6,
          }}
        >
          Battle the nine archetypes. Best of 5 rounds — each round pits a random
          domain against theirs. Win to claim their seal and earn 100 XP.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {Object.entries(TYPES).map(([num, t]) => {
            const n = parseInt(num, 10);
            const isYou = n === userType;
            const claimed = defeated.has(n);
            return (
              <button
                key={num}
                onClick={() => !isYou && onBattle(n)}
                disabled={isYou}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 14px',
                  borderRadius: 10,
                  textAlign: 'left',
                  background: isYou ? 'transparent' : 'var(--bg-raised)',
                  border: `1px solid ${isYou ? 'var(--border)' : `${t.color}33`}`,
                  cursor: isYou ? 'default' : 'pointer',
                  opacity: isYou ? 0.4 : 1,
                  transition: 'all 220ms ease',
                }}
              >
                <div style={{ fontSize: 22, color: t.color, width: 28, textAlign: 'center' }}>
                  {t.glyph}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, color: 'var(--ink)', fontWeight: 400 }}>
                    {t.name}
                    {isYou && (
                      <span
                        className="mono"
                        style={{
                          marginLeft: 8,
                          fontSize: 8,
                          letterSpacing: '0.2em',
                          color: t.color,
                        }}
                      >
                        YOU
                      </span>
                    )}
                    {claimed && (
                      <span
                        className="mono"
                        style={{
                          marginLeft: 8,
                          fontSize: 8,
                          letterSpacing: '0.2em',
                          color: 'var(--good)',
                        }}
                      >
                        SEALED
                      </span>
                    )}
                  </div>
                  <div
                    className="mono"
                    style={{ fontSize: 9, color: 'var(--ink-dim)', marginTop: 2 }}
                  >
                    Type {num} · {t.tagline}
                  </div>
                </div>
                {!isYou && (
                  <div
                    className="mono"
                    style={{
                      fontSize: 9,
                      letterSpacing: '0.22em',
                      color: t.color,
                      textTransform: 'uppercase',
                    }}
                  >
                    Fight →
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Battle result
// ─────────────────────────────────────────────────────────────
function BattleResult({ result, userTypeMeta, onClear }) {
  const opp = getType(result.archetype);
  const { won, userWins, oppWins, rounds } = result;
  const tone = won ? userTypeMeta.color : opp.color;

  return (
    <div>
      <Card style={{ marginBottom: 14, textAlign: 'center' }} accent={tone}>
        <div
          className="mono"
          style={{
            fontSize: 9,
            letterSpacing: '0.3em',
            color: won ? 'var(--good)' : 'var(--bad)',
            textTransform: 'uppercase',
            marginBottom: 6,
          }}
        >
          {won ? 'Victory' : 'Defeat'}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 18 }}>
          <div style={{ textAlign: 'center' }}>
            <Sigil size={72} color={userTypeMeta.color} opacity={0.5} spin={160}>
              <div style={{ fontSize: 26, color: userTypeMeta.color, fontFamily: 'var(--serif)' }}>
                You
              </div>
            </Sigil>
            <div
              style={{
                fontSize: 28,
                color: userTypeMeta.color,
                fontWeight: 300,
                marginTop: 8,
              }}
            >
              {userWins}
            </div>
          </div>
          <div
            style={{
              fontSize: 32,
              color: 'var(--ink-dim)',
              fontFamily: 'var(--serif)',
              fontWeight: 300,
            }}
          >
            ⸻
          </div>
          <div style={{ textAlign: 'center' }}>
            <Sigil size={72} color={opp.color} opacity={0.5} spin={-160}>
              <div style={{ fontSize: 22, color: opp.color, fontFamily: 'var(--serif)' }}>
                {opp.glyph}
              </div>
            </Sigil>
            <div style={{ fontSize: 28, color: opp.color, fontWeight: 300, marginTop: 8 }}>
              {oppWins}
            </div>
          </div>
        </div>
        <h3
          style={{
            fontSize: 18,
            fontWeight: 400,
            color: 'var(--ink)',
            margin: '14px 0 4px',
            letterSpacing: '0.04em',
          }}
        >
          vs {opp.name}
        </h3>
        <div
          className="mono"
          style={{ fontSize: 10, color: 'var(--ink-dim)', letterSpacing: '0.08em' }}
        >
          {won ? '+100 XP · seal claimed' : '+25 XP · try again'}
        </div>
      </Card>

      <Card>
        <SectionTitle color={tone}>Round breakdown</SectionTitle>
        {rounds.map((r, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 0',
              borderBottom: i < rounds.length - 1 ? '1px solid var(--border)' : 'none',
            }}
          >
            <div
              className="mono"
              style={{
                width: 20,
                fontSize: 10,
                color: 'var(--ink-dim)',
                flexShrink: 0,
              }}
            >
              {i + 1}
            </div>
            <div
              style={{
                width: 92,
                fontSize: 12,
                color: 'var(--ink)',
                flexShrink: 0,
                letterSpacing: '0.02em',
              }}
            >
              {r.domainName}
            </div>
            <div
              className="mono"
              style={{
                flex: 1,
                textAlign: 'right',
                fontSize: 11,
                color: r.winner === 'user' ? userTypeMeta.color : 'var(--ink-dim)',
              }}
            >
              {Math.round(r.user * 100)}
            </div>
            <div style={{ fontSize: 10, color: 'var(--ink-dim)', width: 12, textAlign: 'center' }}>
              :
            </div>
            <div
              className="mono"
              style={{
                width: 32,
                textAlign: 'left',
                fontSize: 11,
                color: r.winner === 'opp' ? opp.color : 'var(--ink-dim)',
              }}
            >
              {Math.round(r.opp * 100)}
            </div>
          </div>
        ))}
      </Card>

      <div style={{ marginTop: 18, display: 'flex', justifyContent: 'center', gap: 12 }}>
        <Button variant="solid" tone={userTypeMeta.color} onClick={onClear}>
          Back to arena
        </Button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// History tab
// ─────────────────────────────────────────────────────────────
function HistoryTab({ history }) {
  if (history.length === 0) {
    return (
      <Empty
        emoji="1f5e1"
        title="No battles yet"
        body="Enter the arena and fight an archetype. Every battle — win or lose — is logged here."
      />
    );
  }
  return (
    <Card>
      {history.map((h, i) => {
        const opp = getType(h.archetype);
        return (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '10px 0',
              borderBottom: i < history.length - 1 ? '1px solid var(--border)' : 'none',
            }}
          >
            <div style={{ fontSize: 20, color: opp.color, width: 28, textAlign: 'center' }}>
              {opp.glyph}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, color: 'var(--ink)' }}>{opp.name}</div>
              <div
                className="mono"
                style={{ fontSize: 9, color: 'var(--ink-dim)', letterSpacing: '0.04em' }}
              >
                {new Date(h.at).toLocaleDateString()} · {h.userWins}–{h.oppWins}
              </div>
            </div>
            <div
              className="mono"
              style={{
                fontSize: 9,
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                color: h.won ? 'var(--good)' : 'var(--bad)',
              }}
            >
              {h.won ? 'Win' : 'Loss'}
            </div>
          </div>
        );
      })}
    </Card>
  );
}

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
