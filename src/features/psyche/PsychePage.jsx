// ─────────────────────────────────────────────────────────────
// PsychePage — layered profiling surface at /psyche.
// ─────────────────────────────────────────────────────────────
// Six tiers unlock progressively as data accumulates:
//   Core          1 IRIS run       Type, wing, top-3, domains, outliers
//   Structure     1 IRIS run       Tritype, instinct, arrows
//   Depth         14+ entries      Level, defenses, shadow, tensions
//   Cross-frame   14+ entries      Big Five approx, attachment approx
//   Longitudinal  2+ IRIS runs     Domain drift, stability index
//   Corroboration 14+ entries      Behaviour-profile match (activity lift)
//
// Every layer carries a confidence badge and a plain-English
// "why we think this." Locked layers state their requirement.
//
// The Coliseum's encyclopaedic lore is now absorbed into the
// user's own type/wing/tritype — personal context, not detached
// reference.
// ─────────────────────────────────────────────────────────────

import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Screen from '../../components/Screen.jsx';
import Card from '../../components/Card.jsx';
import Button from '../../components/Button.jsx';
import Empty from '../../components/Empty.jsx';
import { Sigil } from '../../components/SacredGeometry.jsx';
import { useStore } from '../../lib/store.js';
import { DOMAINS, getType, getWing, getDomainAvg } from '../../data/enneagram.js';
import { computeActivityLift, computeIrisDrift } from '../../lib/patterns.js';
import { getTypeLore, getWingLore } from '../../data/psyche-lore.js';
import {
  computeTritype,
  approximateInstinct,
  getArrows,
  approximateLevel,
  getDefense,
  approximateBigFive,
  approximateAttachment,
} from '../../lib/psyche/index.js';

export default function PsychePage() {
  const navigate = useNavigate();
  const iris = useStore((s) => s.iris);
  const entries = useStore((s) => s.entries);
  const enneagramScores = iris?.enneagramScores;
  const facetScores = iris?.facetScores;
  const userType = iris?.enneagramType;

  // Hooks must run unconditionally (rules-of-hooks).
  const typeMeta = userType ? getType(userType) : null;
  const wing = userType && enneagramScores ? getWing(userType, enneagramScores) : null;
  const wingMeta = wing ? getType(wing) : null;

  // Compute all psyche data once
  const psyche = useMemo(() => {
    if (!userType || !facetScores) return null;

    // Data thresholds
    const entryCount = entries?.length || 0;
    const irisRuns = (iris.history?.length || 0) + 1;
    const enoughEntries = entryCount >= 14;
    const enoughIrisRuns = irisRuns >= 2;

    // Core + Structure (always available with 1 IRIS run)
    const tritype = computeTritype(enneagramScores);
    const instinct = approximateInstinct(facetScores);
    const arrows = getArrows(userType);
    const defense = getDefense(userType);
    const lore = getTypeLore(userType);
    const wingLore = wing ? getWingLore(userType, wing) : null;

    // Depth tier (14+ entries)
    const level = enoughEntries ? approximateLevel(facetScores) : null;

    // Cross-frame tier (14+ entries)
    const bigFive = enoughEntries ? approximateBigFive(facetScores) : null;
    const attachment = enoughEntries ? approximateAttachment(facetScores) : null;

    // Longitudinal (2+ IRIS runs)
    const drift = enoughIrisRuns ? computeIrisDrift(iris.history || []) : null;

    // Corroboration (14+ entries)
    const activityLift = enoughEntries ? computeActivityLift(entries) : null;
    const topLifts = activityLift?.slice(0, 3) || [];

    return {
      entryCount, irisRuns, enoughEntries, enoughIrisRuns,
      tritype, instinct, arrows, defense, lore, wingLore,
      level, bigFive, attachment, drift, topLifts,
    };
  }, [iris, entries, enneagramScores, facetScores, userType, wing]);

  // Domain stats
  const domainStats = useMemo(() => {
    if (!facetScores) return [];
    return DOMAINS.map((d, i) => ({
      ...d,
      score: Math.round(getDomainAvg(facetScores, i) * 100),
    }));
  }, [facetScores]);

  // Early return AFTER all hooks
  if (!userType || !facetScores) {
    return (
      <Screen label="Your psyche" title="Psyche Engine">
        <Empty
          emoji="1f9e0"
          title="No IRIS profile yet"
          body="The Psyche Engine maps your inner architecture — but it needs your IRIS results first. Run the 16-scenario assessment and every layer here unlocks."
          action={<Button variant="solid" tone="var(--accent)" onClick={() => navigate('/iris')}>Begin IRIS</Button>}
        />
      </Screen>
    );
  }

  if (!typeMeta) return null;
  if (!psyche) return null;

  return (
    <Screen label="Your psyche" title="Psyche Engine" subtitle="Map yourself as deeply as the evidence honestly allows">
      {/* ── Hero: core type ── */}
      <Card accent={typeMeta.color} style={{ marginBottom: 18 }}>
        <div style={{ textAlign: 'center' }}>
          <Sigil size={80} color={typeMeta.color} opacity={0.5} spin={200}>
            <div style={{ fontSize: 30, color: typeMeta.color, fontFamily: 'var(--serif)' }}>
              {typeMeta.glyph}
            </div>
          </Sigil>
          <h2 style={{ fontSize: 22, fontWeight: 400, color: 'var(--ink)', letterSpacing: '0.06em', margin: '12px 0 4px' }}>
            {typeMeta.name}
          </h2>
          <div className="mono" style={{ fontSize: 10, color: 'var(--ink-dim)', letterSpacing: '0.12em' }}>
            Type {userType}{wing ? ` · Wing ${wing}` : ''} · {typeMeta.tagline}
          </div>
        </div>
      </Card>

      {/* ── Tier 1: Core ── */}
      <TierSection title="Core" unlocked badge="high">
        <Card accent={typeMeta.color} style={{ marginBottom: 12 }}>
          <LayerTitle color={typeMeta.color}>Top-3 matches</LayerTitle>
          <ConfidenceBadge level="high" reason="Based on Pearson correlation — the same maths that replaced the Loyalist bias." />
          {iris.matches?.slice(0, 3).map((m, i) => {
            const tm = getType(m.type);
            return (
              <div key={m.type} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', borderBottom: i < 2 ? '1px solid var(--border)' : 'none' }}>
                <span style={{ fontSize: 16, color: tm.color, width: 24, textAlign: 'center' }}>{tm.glyph}</span>
                <span style={{ flex: 1, fontSize: 14, color: 'var(--ink)' }}>{tm.name}</span>
                <span className="mono" style={{ fontSize: 14, color: tm.color, fontWeight: 600 }}>{m.matchPct}%</span>
              </div>
            );
          })}
          {iris.clarity?.isClose && (
            <div style={{ marginTop: 8, padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-raised)', fontSize: 11, color: 'var(--ink-soft)', fontStyle: 'italic' }}>
              Near-tie — read both. A 2% gap means both archetypes are genuinely present. You contain multitudes.
            </div>
          )}
        </Card>

        <Card style={{ marginBottom: 12 }}>
          <LayerTitle color={typeMeta.color}>Domain profile</LayerTitle>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6 }}>
            {domainStats.map((d) => (
              <div key={d.id} style={{ textAlign: 'center', padding: '10px 6px', background: 'var(--bg-raised)', borderRadius: 8, border: '1px solid var(--border)' }}>
                <div className="mono" style={{ fontSize: 7, letterSpacing: '0.22em', color: 'var(--ink-dim)', textTransform: 'uppercase', marginBottom: 4 }}>{d.name}</div>
                <div style={{ fontSize: 20, fontWeight: 300, color: d.color, lineHeight: 1 }}>{d.score}</div>
              </div>
            ))}
          </div>
        </Card>

        {psyche.lore && (
          <Card accent={typeMeta.color} style={{ marginBottom: 12 }}>
            <LayerTitle color={typeMeta.color}>Historical context — {psyche.lore.era}</LayerTitle>
            <p style={{ fontSize: 12, color: 'var(--ink-soft)', lineHeight: 1.7, margin: '0 0 10px' }}>{psyche.lore.history}</p>
            <div className="mono" style={{ fontSize: 9, color: 'var(--ink-faint)', letterSpacing: '0.08em' }}>
              Notable: {psyche.lore.figures}
            </div>
          </Card>
        )}

        {wingMeta && psyche.wingLore && (
          <Card accent={wingMeta.color} style={{ marginBottom: 12 }}>
            <LayerTitle color={wingMeta.color}>Wing {wing} — {wingMeta.name}</LayerTitle>
            <p style={{ fontSize: 12, color: 'var(--ink-soft)', lineHeight: 1.7, margin: 0 }}>{psyche.wingLore}</p>
          </Card>
        )}
      </TierSection>

      {/* ── Tier 2: Structure ── */}
      <TierSection title="Structure" unlocked badge="high">
        {psyche.tritype && (
          <Card style={{ marginBottom: 12 }}>
            <LayerTitle color={typeMeta.color}>Tritype</LayerTitle>
            <ConfidenceBadge level="high" reason="Highest resonance score in each centre of intelligence." />
            <div style={{ textAlign: 'center', marginBottom: 12 }}>
              <div style={{ fontSize: 28, fontFamily: 'var(--serif)', color: typeMeta.color, fontWeight: 300, letterSpacing: '0.06em' }}>
                {psyche.tritype.tritype.join('-')}
              </div>
              <div style={{ fontSize: 16, color: 'var(--ink)', marginTop: 4, fontWeight: 400 }}>
                {psyche.tritype.tritypeName}
              </div>
              <div className="mono" style={{ fontSize: 9, color: 'var(--ink-dim)', marginTop: 4 }}>
                gut · heart · head
              </div>
            </div>
            {['gut', 'heart', 'head'].map((centre) => {
              const c = psyche.tritype.centres[centre];
              return (
                <div key={centre} style={{ marginBottom: 6 }}>
                  <div className="mono" style={{ fontSize: 8, letterSpacing: '0.22em', color: 'var(--ink-dim)', textTransform: 'uppercase', marginBottom: 4 }}>
                    {centre} centre
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {c.map((r) => {
                      const tm = getType(r.type);
                      const isTop = r.type === c[0].type;
                      return (
                        <div key={r.type} style={{
                          flex: 1, textAlign: 'center', padding: '6px 4px', borderRadius: 6,
                          background: isTop ? `${tm.color}18` : 'var(--bg-raised)',
                          border: `1px solid ${isTop ? `${tm.color}40` : 'var(--border)'}`,
                          opacity: isTop ? 1 : 0.6,
                        }}>
                          <div style={{ fontSize: 14, color: tm.color }}>{tm.glyph}</div>
                          <div className="mono" style={{ fontSize: 8, color: 'var(--ink-dim)', marginTop: 2 }}>#{r.type}</div>
                          <div className="mono" style={{ fontSize: 7, color: 'var(--ink-faint)', marginTop: 1 }}>{Math.round(r.score * 100)}%</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </Card>
        )}

        {psyche.instinct && (
          <Card style={{ marginBottom: 12 }}>
            <LayerTitle color={typeMeta.color}>Instinctual subtype</LayerTitle>
            <ConfidenceBadge level={psyche.instinct.confidence === 'clear' ? 'high' : 'moderate'} reason="Approximated from facet patterns — not a validated instrument." />
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <span style={{ fontSize: 28 }}>{psyche.instinct.emoji}</span>
              <div>
                <div style={{ fontSize: 16, color: 'var(--ink)', fontWeight: 400 }}>{psyche.instinct.label}</div>
                <div style={{ fontSize: 11, color: 'var(--ink-soft)', marginTop: 2 }}>{psyche.instinct.summary}</div>
              </div>
            </div>
            {['sp', 'so', 'sx'].map((k) => (
              <Bar key={k} label={k.toUpperCase()} pct={Math.round(psyche.instinct.scores[k] * 100)} max={100} color={k === psyche.instinct.dominant ? typeMeta.color : 'var(--border)'} />
            ))}
            <div className="mono" style={{ marginTop: 8, fontSize: 8, color: 'var(--ink-faint)', fontStyle: 'italic' }}>
              {psyche.instinct.note}
            </div>
          </Card>
        )}

        {psyche.arrows && (
          <Card style={{ marginBottom: 12 }}>
            <LayerTitle color={typeMeta.color}>Integration & disintegration</LayerTitle>
            {(['integration', 'disintegration']).map((dir) => {
              const a = psyche.arrows[dir];
              const am = getType(a.type);
              return (
                <div key={dir} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 16, color: am.color }}>{am.glyph}</span>
                    <span className="mono" style={{ fontSize: 9, letterSpacing: '0.2em', color: dir === 'integration' ? 'var(--good)' : 'var(--bad)', textTransform: 'uppercase' }}>
                      {dir} — {a.label}
                    </span>
                  </div>
                  <p style={{ fontSize: 11, color: 'var(--ink-soft)', lineHeight: 1.6, margin: 0, paddingLeft: 24 }}>{a.desc}</p>
                </div>
              );
            })}
          </Card>
        )}
      </TierSection>

      {/* ── Tier 3: Depth ── */}
      <TierSection title="Depth" unlocked={psyche.enoughEntries} required="14+ journal entries">
        {psyche.level && (
          <Card style={{ marginBottom: 12 }}>
            <LayerTitle color={typeMeta.color}>Developmental level</LayerTitle>
            <ConfidenceBadge level={psyche.level.confidence} reason="Approximated from facet intensity and domain balance." />
            <div style={{ textAlign: 'center', marginBottom: 10 }}>
              <div style={{ fontSize: 36, fontFamily: 'var(--serif)', color: typeMeta.color, fontWeight: 300 }}>{psyche.level.level}</div>
              <div className="mono" style={{ fontSize: 10, letterSpacing: '0.22em', color: 'var(--ink-dim)', textTransform: 'uppercase' }}>Level · {psyche.level.band}</div>
            </div>
            <p style={{ fontSize: 11, color: 'var(--ink-soft)', lineHeight: 1.6, margin: 0 }}>{psyche.level.desc}</p>
            <div className="mono" style={{ marginTop: 8, fontSize: 8, color: 'var(--ink-faint)', fontStyle: 'italic' }}>{psyche.level.note}</div>
          </Card>
        )}

        {psyche.defense && (
          <Card accent={typeMeta.color} style={{ marginBottom: 12 }}>
            <LayerTitle color={typeMeta.color}>Signature defence — {psyche.defense.name}</LayerTitle>
            <p style={{ fontSize: 11, color: 'var(--ink-soft)', lineHeight: 1.6, margin: '0 0 8px' }}>{psyche.defense.short}</p>
            <p style={{ fontSize: 12, color: 'var(--ink-soft)', lineHeight: 1.7, margin: '0 0 10px' }}>{psyche.defense.desc}</p>
            <div style={{ padding: '10px 12px', borderRadius: 8, background: `${typeMeta.color}10`, border: `1px solid ${typeMeta.color}20` }}>
              <div style={{ fontSize: 13, color: typeMeta.color, fontStyle: 'italic' }}>&ldquo;{psyche.defense.reflection}&rdquo;</div>
            </div>
          </Card>
        )}
      </TierSection>

      {/* ── Tier 4: Cross-frame ── */}
      <TierSection title="Cross-frame" unlocked={psyche.enoughEntries} required="14+ journal entries">
        {psyche.bigFive && (
          <Card style={{ marginBottom: 12 }}>
            <LayerTitle color={typeMeta.color}>Big Five approximation</LayerTitle>
            <ConfidenceBadge level="low" reason="Approximation from facet overlap — NOT a validated instrument. Treat as a curiosity." />
            {Object.entries(psyche.bigFive.scores).map(([dim, s]) => (
              <div key={dim} style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ fontSize: 12, color: 'var(--ink)' }}>{s.name}</span>
                  <span className="mono" style={{ fontSize: 10, color: 'var(--ink-dim)' }}>{s.label} · {s.percentile}%</span>
                </div>
                <Bar label="" pct={s.percentile} max={100} color={typeMeta.color} />
              </div>
            ))}
            <div className="mono" style={{ marginTop: 8, fontSize: 8, color: 'var(--ink-faint)', fontStyle: 'italic' }}>{psyche.bigFive.disclaimer}</div>
          </Card>
        )}

        {psyche.attachment && (
          <Card accent={typeMeta.color} style={{ marginBottom: 12 }}>
            <LayerTitle color={typeMeta.color}>Attachment style approximation</LayerTitle>
            <ConfidenceBadge level="low" reason="Approximation from facet patterns — NOT a validated instrument (AAI, ECR-R)." />
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <span style={{ fontSize: 28 }}>{psyche.attachment.emoji}</span>
              <div>
                <div style={{ fontSize: 16, color: 'var(--ink)', fontWeight: 400 }}>{psyche.attachment.label}</div>
                <div style={{ fontSize: 11, color: 'var(--ink-soft)', marginTop: 2 }}>{psyche.attachment.desc}</div>
              </div>
            </div>
            <Bar label="Anxiety" pct={psyche.attachment.anxiety} max={100} color="#ff6b8a" />
            <Bar label="Avoidance" pct={psyche.attachment.avoidance} max={100} color="#74c0fc" />
            <div className="mono" style={{ marginTop: 8, fontSize: 8, color: 'var(--ink-faint)', fontStyle: 'italic' }}>{psyche.attachment.disclaimer}</div>
          </Card>
        )}
      </TierSection>

      {/* ── Tier 5: Longitudinal ── */}
      <TierSection title="Longitudinal" unlocked={psyche.enoughIrisRuns} required="2+ IRIS runs">
        {psyche.drift && (
          <Card accent={typeMeta.color} style={{ marginBottom: 12 }}>
            <LayerTitle color={typeMeta.color}>Domain drift</LayerTitle>
            <ConfidenceBadge level="high" reason="Direct comparison of first vs. latest IRIS snapshot." />
            <p style={{ fontSize: 11, color: 'var(--ink-soft)', lineHeight: 1.6, margin: '0 0 10px' }}>
              How your profile has shifted since your first IRIS run. Positive = strengthened; negative = softened.
            </p>
            {Object.entries(psyche.drift).map(([domain, d]) => {
              const dom = DOMAINS.find((x) => x.id === domain);
              const deltaPct = Math.round(d.delta * 100);
              const dir = deltaPct > 0 ? '+' : '';
              return (
                <div key={domain} style={{ marginBottom: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                    <span style={{ fontSize: 11, color: dom?.color || 'var(--ink)' }}>{dom?.name || domain}</span>
                    <span className="mono" style={{ fontSize: 10, color: deltaPct > 0 ? 'var(--good)' : deltaPct < 0 ? '#ff6b8a' : 'var(--ink-dim)' }}>{dir}{deltaPct}%</span>
                  </div>
                  <Bar label="" pct={Math.abs(deltaPct)} max={30} color={dom?.color || typeMeta.color} />
                </div>
              );
            })}
            {iris.takenAt && (
              <div className="mono" style={{ marginTop: 8, fontSize: 8, color: 'var(--ink-faint)' }}>
                First IRIS: {new Date(iris.history?.[0]?.takenAt || iris.takenAt).toLocaleDateString()} · Latest: {new Date(iris.takenAt).toLocaleDateString()}
              </div>
            )}
          </Card>
        )}
      </TierSection>

      {/* ── Tier 6: Corroboration ── */}
      <TierSection title="Corroboration" unlocked={psyche.enoughEntries && psyche.topLifts.length > 0} required="14+ journal entries">
        <Card accent={typeMeta.color}>
          <LayerTitle color={typeMeta.color}>Behaviour-profile match</LayerTitle>
          <ConfidenceBadge level="moderate" reason="Do your logged behaviours align with your predicted archetype traits?" />
          {psyche.topLifts.length > 0 ? (
            <>
              <p style={{ fontSize: 11, color: 'var(--ink-soft)', lineHeight: 1.6, margin: '0 0 10px' }}>
                Activities that most shift your mood. When your behaviour aligns with your archetype&apos;s natural strengths, mood tends to lift — corroborating the profile. Mismatches don&apos;t invalidate it; they illuminate tension.
              </p>
              {psyche.topLifts.map((l) => (
                <div key={l.activityId} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ flex: 1, fontSize: 12, color: 'var(--ink)' }}>{l.name || l.activityId}</span>
                  <span className="mono" style={{ fontSize: 10, color: l.lift > 0 ? 'var(--good)' : '#ff6b8a' }}>
                    {l.lift > 0 ? '+' : ''}{Math.round(l.lift * 100)}% mood
                  </span>
                  <span className="mono" style={{ fontSize: 9, color: 'var(--ink-faint)' }}>{l.count}×</span>
                </div>
              ))}
            </>
          ) : (
            <p style={{ fontSize: 11, color: 'var(--ink-soft)', fontStyle: 'italic', margin: 0 }}>
              Not enough varied activity data yet. Keep logging — patterns surface with consistency.
            </p>
          )}
          {psyche.enoughEntries && psyche.topLifts.length === 0 && (
            <p style={{ fontSize: 11, color: 'var(--ink-soft)', fontStyle: 'italic', margin: '8px 0 0' }}>
              Honesty gate active: fewer than 3 appearances per activity — we won&apos;t fabricate a pattern from noise.
            </p>
          )}
        </Card>
      </TierSection>

      {/* ── Footer: clinical disclaimer ── */}
      <div style={{ textAlign: 'center', margin: '32px 0 40px' }}>
        <div className="mono" style={{ fontSize: 9, letterSpacing: '0.12em', color: 'var(--ink-faint)', lineHeight: 1.6 }}>
          The Psyche Engine is a tool for self-inquiry, not a replacement for therapy, medical advice, or a qualified clinician.
          Every layer states its evidence basis and confidence. What you do with the map is yours.
        </div>
      </div>
    </Screen>
  );
}

// ─────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────

function TierSection({ title, unlocked, required, badge, children }) {
  const lock = !unlocked;
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <h3 style={{ fontSize: 14, fontWeight: 400, color: lock ? 'var(--ink-faint)' : 'var(--ink)', letterSpacing: '0.06em', margin: 0 }}>
          {title}
        </h3>
        {lock ? (
          <span className="mono" style={{ fontSize: 8, letterSpacing: '0.2em', color: 'var(--ink-faint)', textTransform: 'uppercase' }}>
            🔒 {required}
          </span>
        ) : (
          badge && <span className="mono" style={{ fontSize: 8, letterSpacing: '0.2em', color: 'var(--good)', textTransform: 'uppercase' }}>✓</span>
        )}
      </div>
      {lock ? (
        <Card style={{ opacity: 0.4, pointerEvents: 'none' }}>
          <p style={{ fontSize: 11, color: 'var(--ink-faint)', fontStyle: 'italic', margin: 0 }}>
            Unlocks with {required}. Keep journaling, running IRIS, and checking in — each entry builds the foundation this tier reads from.
          </p>
        </Card>
      ) : children}
    </div>
  );
}

function LayerTitle({ children, color }) {
  return (
    <div className="mono" style={{ fontSize: 9, letterSpacing: '0.22em', color: color || 'var(--ink-dim)', textTransform: 'uppercase', marginBottom: 8 }}>
      {children}
    </div>
  );
}

function ConfidenceBadge({ level, reason }) {
  const colors = {
    high: { bg: '#69db7c18', border: '#69db7c40', text: '#69db7c' },
    moderate: { bg: '#ffa94d10', border: '#ffa94d30', text: '#ffa94d' },
    low: { bg: '#868e9610', border: '#868e9630', text: '#868e96' },
    tentative: { bg: '#868e9610', border: '#868e9630', text: '#868e96' },
  };
  const c = colors[level] || colors.low;
  return (
    <div style={{ marginBottom: 10, padding: '6px 10px', borderRadius: 6, background: c.bg, border: `1px solid ${c.border}`, display: 'inline-block' }}>
      <span className="mono" style={{ fontSize: 8, letterSpacing: '0.18em', color: c.text, textTransform: 'uppercase' }}>
        {level} confidence
      </span>
      <span style={{ fontSize: 10, color: 'var(--ink-soft)', marginLeft: 6 }}>{reason}</span>
    </div>
  );
}

function Bar({ label, pct, max, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
      {label && <span className="mono" style={{ width: 28, fontSize: 8, color: 'var(--ink-dim)', textAlign: 'right', flexShrink: 0 }}>{label}</span>}
      <div style={{ flex: 1, height: 5, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${Math.min(100, (pct / max) * 100)}%`, height: '100%', background: color, borderRadius: 3, transition: 'width 800ms ease' }} />
      </div>
      <span className="mono" style={{ width: 32, fontSize: 9, color: 'var(--ink-dim)', textAlign: 'right', flexShrink: 0 }}>{pct}%</span>
    </div>
  );
}
