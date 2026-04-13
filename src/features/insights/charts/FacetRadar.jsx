// ─────────────────────────────────────────────────────────────
// FacetRadar — 6-axis radar chart of IRIS domains.
// Each axis is a domain averaged from its 4 facets.
// ─────────────────────────────────────────────────────────────

import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from 'recharts';

const DOMAIN_MAP = [
  { key: 'Cognitive', color: '#7eb5ff', facets: ['analytical', 'pattern', 'abstract', 'pragmatic'] },
  { key: 'Emotional', color: '#ff6b8a', facets: ['depth', 'empathy', 'regulation', 'vulnerability'] },
  { key: 'Volitional', color: '#ffa94d', facets: ['assertion', 'discipline', 'spontaneity', 'patience'] },
  { key: 'Relational', color: '#69db7c', facets: ['bonding', 'social', 'autonomy', 'trust'] },
  { key: 'Existential', color: '#b197fc', facets: ['purpose', 'identity', 'mortality', 'transcendence'] },
  { key: 'Shadow', color: '#868e96', facets: ['anger', 'fear', 'shame', 'desire'] },
];

export default function FacetRadar({ facetScores, height = 260 }) {
  if (!facetScores) return null;
  const data = DOMAIN_MAP.map((d) => {
    const vals = d.facets.map((f) => facetScores[f] ?? 0);
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
    return { domain: d.key, score: Math.round(avg * 100), fullMark: 100 };
  });

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <RadarChart data={data} outerRadius="70%">
          <PolarGrid stroke="rgba(255,255,255,0.08)" />
          <PolarAngleAxis
            dataKey="domain"
            tick={{
              fill: '#888',
              fontSize: 10,
              fontFamily: 'DM Mono, monospace',
            }}
          />
          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
          <Radar
            name="You"
            dataKey="score"
            stroke="#ffd166"
            fill="#ffd166"
            fillOpacity={0.18}
            strokeWidth={1.5}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
