// ─────────────────────────────────────────────────────────────
// <PlayerCard /> — the user's live Player Card, rendered as a
// React component (not the downloadable HTML artifact).
// ─────────────────────────────────────────────────────────────
// Shows: type glyph + number, archetype name + wing, percentile,
// 6 domain stat cards, societal distribution bars, strengths vs.
// growth edges, facet vector code, and a "Download Full Card"
// button that triggers the IRIS-native HTML export.
//
// This component reads from the Zustand store directly and
// gracefully returns null if no IRIS data exists yet.
// ─────────────────────────────────────────────────────────────

import Card from './Card.jsx';
import Button from './Button.jsx';
import {
  Sigil,
  EnneagramGlyph,
  FlowerOfLife,
  Divider,
} from './SacredGeometry.jsx';
import { useStore } from '../lib/store.js';
import {
  DOMAINS,
  getType,
  getDomainAvg,
  getWing,
  getPercentile,
  getVector,
} from '../data/enneagram.js';

export default function PlayerCard({ onDownload }) {
  const iris = useStore((s) => s.iris);
  const { facetScores, enneagramType, enneagramScores, takenAt } = iris;

  if (!enneagramType || !facetScores) return null;

  const t = getType(enneagramType);
  if (!t) return null;

  const wing = getWing(enneagramType, enneagramScores);
  const percentile = getPercentile(enneagramType);
  const resonance = enneagramScores
    ? Math.round(
        (Object.entries(enneagramScores).sort((a, b) => b[1] - a[1])[0]?.[1] || 0) * 100,
      )
    : 0;
  const vector = getVector(facetScores, enneagramType, wing);

  const sectors = [
    ['Leadership', t.society.leadership],
    ['Creative', t.society.creative],
    ['Technical', t.society.technical],
    ['Service', t.society.service],
    ['Entrepreneurial', t.society.entrepreneurial],
  ];

  return (
    <Card
      accent={t.color}
      style={{
        position: 'relative',
        overflow: 'hidden',
        marginBottom: 20,
      }}
    >
      {/* Ambient geometry */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'grid',
          placeItems: 'center',
          pointerEvents: 'none',
          color: t.color,
        }}
      >
        <FlowerOfLife size={360} opacity={0.05} strokeWidth={0.25} spin={400} />
      </div>

      <div style={{ position: 'relative' }}>
        {/* ── Header: glyph + type number + name ── */}
        <div style={{ textAlign: 'center', marginBottom: 18 }}>
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <EnneagramGlyph
              size={160}
              color={t.color}
              opacity={0.35}
              strokeWidth={0.4}
              spin={300}
              highlightType={enneagramType}
            />
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <Sigil size={100} color={t.color} opacity={0.5} spin={200}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 22, color: t.color, lineHeight: 1 }}>{t.glyph}</div>
                  <div
                    className="engram-breathe"
                    style={{
                      fontSize: 42,
                      fontWeight: 300,
                      color: t.color,
                      lineHeight: 1,
                      fontFamily: 'var(--serif)',
                    }}
                  >
                    {enneagramType}
                  </div>
                </div>
              </Sigil>
            </div>
          </div>

          <h2
            style={{
              fontSize: 24,
              fontWeight: 300,
              color: '#fff',
              letterSpacing: '0.08em',
              margin: '8px 0 2px',
            }}
          >
            {t.name}
          </h2>
          <div
            className="mono"
            style={{ fontSize: 10, color: 'var(--ink-dim)', letterSpacing: '0.12em' }}
          >
            Wing {wing} · {resonance}% resonance · {t.tagline}
          </div>
        </div>

        {/* ── Percentile + population ── */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 24,
            marginBottom: 18,
          }}
        >
          <StatBadge label="Percentile" value={`${percentile}th`} color={t.color} />
          <StatBadge label="Population" value={`${t.pop}%`} color={t.color} />
        </div>

        {/* ── Vector code ── */}
        <div
          className="mono"
          style={{
            textAlign: 'center',
            fontSize: 9,
            color: 'var(--ink-faint)',
            letterSpacing: '0.08em',
            marginBottom: 18,
          }}
        >
          <code>{vector}</code>
        </div>

        <Divider color={t.color} opacity={0.4} glyph="vesica" glyphSize={22} margin="0 0 18px" />

        {/* ── Domain stat cards (3×2 grid) ── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 6,
            marginBottom: 18,
          }}
        >
          {DOMAINS.map((dom, i) => {
            const avg = Math.round(getDomainAvg(facetScores, i) * 100);
            return (
              <div
                key={dom.id}
                style={{
                  textAlign: 'center',
                  padding: '10px 6px',
                  background: 'rgba(255,255,255,0.025)',
                  borderRadius: 8,
                  border: '1px solid rgba(255,255,255,0.05)',
                }}
              >
                <div
                  className="mono"
                  style={{
                    fontSize: 7,
                    letterSpacing: '0.22em',
                    color: 'var(--ink-dim)',
                    textTransform: 'uppercase',
                    marginBottom: 4,
                  }}
                >
                  {dom.name}
                </div>
                <div style={{ fontSize: 22, fontWeight: 300, color: dom.color, lineHeight: 1 }}>
                  {avg}
                </div>
              </div>
            );
          })}
        </div>

        <Divider color={t.color} opacity={0.35} glyph="seed" glyphSize={20} margin="0 0 16px" />

        {/* ── Societal distribution ── */}
        <div
          className="mono"
          style={{
            fontSize: 8,
            letterSpacing: '0.26em',
            color: 'var(--ink-dim)',
            textTransform: 'uppercase',
            marginBottom: 10,
            textAlign: 'center',
          }}
        >
          Societal standing
        </div>
        {sectors.map(([name, pct]) => (
          <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
            <span
              className="mono"
              style={{
                width: 100,
                fontSize: 9,
                color: 'var(--ink-dim)',
                textAlign: 'right',
                flexShrink: 0,
              }}
            >
              {name}
            </span>
            <div
              style={{
                flex: 1,
                height: 5,
                background: 'rgba(255,255,255,0.04)',
                borderRadius: 3,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${pct}%`,
                  height: '100%',
                  background: t.color,
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
                color: t.color,
                textAlign: 'right',
                fontWeight: 600,
                flexShrink: 0,
              }}
            >
              {pct}%
            </span>
          </div>
        ))}

        <Divider color={t.color} opacity={0.3} glyph="merkaba" glyphSize={20} margin="16px 0" />

        {/* ── Strengths vs Growth Edges ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
          <div>
            <div
              className="mono"
              style={{
                fontSize: 8,
                letterSpacing: '0.22em',
                color: '#69db7c',
                textTransform: 'uppercase',
                marginBottom: 8,
              }}
            >
              Strengths
            </div>
            {t.strengths.map((s) => (
              <div
                key={s}
                style={{ fontSize: 12, color: 'var(--ink-soft)', marginBottom: 4, lineHeight: 1.4 }}
              >
                {s}
              </div>
            ))}
          </div>
          <div>
            <div
              className="mono"
              style={{
                fontSize: 8,
                letterSpacing: '0.22em',
                color: '#ff6b8a',
                textTransform: 'uppercase',
                marginBottom: 8,
              }}
            >
              Growth edges
            </div>
            {t.weaknesses.map((w) => (
              <div
                key={w}
                style={{ fontSize: 12, color: 'var(--ink-soft)', marginBottom: 4, lineHeight: 1.4 }}
              >
                {w}
              </div>
            ))}
          </div>
        </div>

        {/* ── Taken date + download ── */}
        <div
          className="mono"
          style={{
            textAlign: 'center',
            fontSize: 8,
            color: 'var(--ink-faint)',
            letterSpacing: '0.12em',
            marginBottom: 14,
          }}
        >
          Mapped {takenAt ? new Date(takenAt).toLocaleDateString() : '—'}
        </div>

        {onDownload && (
          <div style={{ textAlign: 'center' }}>
            <Button
              variant="solid"
              tone={t.color}
              size="sm"
              onClick={onDownload}
            >
              Download full player card
            </Button>
          </div>
        )}
      </div>
    </Card>
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
