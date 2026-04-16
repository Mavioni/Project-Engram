// ─────────────────────────────────────────────────────────────
// Shared Enneagram display data.
// ─────────────────────────────────────────────────────────────
// This file contains the visual/lookup metadata for each of the
// 9 types plus the 6 IRIS domains. Imported by PlayerCard,
// Home, You, and the Insights radar — but NOT by the heavy IRIS
// assessment engine (which carries its own copy with full prose
// descriptions and Coliseum histories).
//
// Keeping this separate means the Home screen can render a full
// Player Card without pulling in Three.js.
// ─────────────────────────────────────────────────────────────

export const DOMAINS = [
  { id: 'cognitive',    name: 'Cognitive',    color: '#7eb5ff', facets: ['analytical', 'pattern', 'abstract', 'pragmatic'] },
  { id: 'emotional',   name: 'Emotional',    color: '#ff6b8a', facets: ['depth', 'empathy', 'regulation', 'vulnerability'] },
  { id: 'volitional',  name: 'Volitional',   color: '#ffa94d', facets: ['assertion', 'discipline', 'spontaneity', 'patience'] },
  { id: 'relational',  name: 'Relational',   color: '#69db7c', facets: ['bonding', 'social', 'autonomy', 'trust'] },
  { id: 'existential', name: 'Existential',  color: '#b197fc', facets: ['purpose', 'identity', 'mortality', 'transcendence'] },
  { id: 'shadow',      name: 'Shadow',       color: '#868e96', facets: ['anger', 'fear', 'shame', 'desire'] },
];

export const TYPES = {
  1: { name: 'The Reformer',     color: '#e8e8e8', glyph: '\u2694', pop: 14, tagline: 'Principled \u00b7 Purposeful \u00b7 Self-Controlled',
       strengths: ['Moral clarity', 'Systematic improvement', 'Relentless standards', 'Ethical backbone'],
       weaknesses: ['Rigidity under stress', 'Suppressed anger', 'Perfectionism paralysis', 'Judgmental tendencies'],
       society: { leadership: 18, creative: 8, technical: 16, service: 14, entrepreneurial: 10 } },
  2: { name: 'The Helper',       color: '#ff8fa3', glyph: '\u2661', pop: 9,  tagline: 'Generous \u00b7 Demonstrative \u00b7 People-Pleasing',
       strengths: ['Emotional intelligence', 'Relationship building', 'Selfless service', 'Intuitive caregiving'],
       weaknesses: ['Boundary erosion', 'Indirect manipulation', 'Self-neglect', 'Pride in indispensability'],
       society: { leadership: 7, creative: 12, technical: 4, service: 28, entrepreneurial: 6 } },
  3: { name: 'The Achiever',     color: '#ffd43b', glyph: '\u2605', pop: 11, tagline: 'Adaptive \u00b7 Excelling \u00b7 Image-Conscious',
       strengths: ['Goal execution', 'Adaptability', 'Motivating others', 'Efficient systems thinking'],
       weaknesses: ['Identity confusion', 'Workaholism', 'Emotional bypassing', 'Image over substance'],
       society: { leadership: 31, creative: 10, technical: 12, service: 5, entrepreneurial: 28 } },
  4: { name: 'The Individualist', color: '#9775fa', glyph: '\u25c7', pop: 11, tagline: 'Expressive \u00b7 Dramatic \u00b7 Self-Absorbed',
       strengths: ['Emotional authenticity', 'Creative vision', 'Depth perception', 'Identity integrity'],
       weaknesses: ['Melancholic self-absorption', 'Envy of normalcy', 'Emotional volatility', 'Elitist suffering'],
       society: { leadership: 4, creative: 34, technical: 6, service: 12, entrepreneurial: 8 } },
  5: { name: 'The Investigator', color: '#74c0fc', glyph: '\u25ce', pop: 10, tagline: 'Perceptive \u00b7 Cerebral \u00b7 Secretive',
       strengths: ['Deep expertise', 'Independent thinking', 'Objective analysis', 'Innovative synthesis'],
       weaknesses: ['Emotional detachment', 'Social withdrawal', 'Hoarding resources', 'Analysis paralysis'],
       society: { leadership: 6, creative: 11, technical: 35, service: 3, entrepreneurial: 9 } },
  6: { name: 'The Loyalist',     color: '#63e6be', glyph: '\u26e8', pop: 17, tagline: 'Committed \u00b7 Security-Oriented \u00b7 Anxious',
       strengths: ['Loyalty and commitment', 'Risk assessment', 'Institutional building', 'Troubleshooting'],
       weaknesses: ['Chronic anxiety', 'Authority ambivalence', 'Worst-case fixation', 'Projection of fears'],
       society: { leadership: 12, creative: 6, technical: 18, service: 22, entrepreneurial: 7 } },
  7: { name: 'The Enthusiast',   color: '#ffa94d', glyph: '\u2600', pop: 13, tagline: 'Spontaneous \u00b7 Versatile \u00b7 Scattered',
       strengths: ['Visionary ideation', 'Cross-domain thinking', 'Infectious optimism', 'Rapid adaptation'],
       weaknesses: ['Commitment avoidance', 'Pain bypassing', 'Superficial engagement', 'Addictive tendencies'],
       society: { leadership: 10, creative: 22, technical: 8, service: 6, entrepreneurial: 24 } },
  8: { name: 'The Challenger',   color: '#ff6b6b', glyph: '\u2655', pop: 8,  tagline: 'Powerful \u00b7 Dominating \u00b7 Self-Confident',
       strengths: ['Decisive leadership', 'Boundary enforcement', 'Protective instinct', 'Raw willpower'],
       weaknesses: ['Intimidation', 'Control obsession', 'Vulnerability denial', 'Excessive force'],
       society: { leadership: 28, creative: 5, technical: 7, service: 4, entrepreneurial: 22 } },
  9: { name: 'The Peacemaker',   color: '#a9e34b', glyph: '\u262f', pop: 16, tagline: 'Receptive \u00b7 Reassuring \u00b7 Complacent',
       strengths: ['Universal empathy', 'Mediation', 'Conflict resolution', 'Holding complexity'],
       weaknesses: ['Self-neglect', 'Passive aggression', 'Decision avoidance', 'Numbing out'],
       society: { leadership: 8, creative: 14, technical: 10, service: 18, entrepreneurial: 5 } },
};

export function getType(n) {
  return TYPES[n] || null;
}

export function getDomainAvg(facetScores, domainIndex) {
  if (!facetScores) return 0;
  const d = DOMAINS[domainIndex];
  const vals = d.facets.map((f) => facetScores[f] || 0);
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

export function getWing(enneagramType, enneagramScores) {
  if (!enneagramType || !enneagramScores) return null;
  const w1 = enneagramType === 1 ? 9 : enneagramType - 1;
  const w2 = enneagramType === 9 ? 1 : enneagramType + 1;
  return (enneagramScores[w1] || 0) > (enneagramScores[w2] || 0) ? w1 : w2;
}

export function getPercentile(enneagramType) {
  const t = TYPES[enneagramType];
  if (!t) return 0;
  return Math.round((1 - t.pop / 100) * 100);
}

export function getVector(facetScores, enneagramType, wing) {
  if (!facetScores || !enneagramType) return '';
  const FACET_IDS = DOMAINS.flatMap((d) => d.facets);
  return (
    'E' +
    enneagramType +
    'w' +
    (wing || '?') +
    '::' +
    FACET_IDS.map((id) => Math.round((facetScores[id] || 0) * 9)).join('')
  );
}
