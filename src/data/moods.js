// ─────────────────────────────────────────────────────────────
// Mood scale — 5 points, Daylio-inspired, but more nuanced copy.
// score is in [0,1] so charts + IRIS scores share a coordinate system.
// emoji codepoints are Twemoji SVG references.
// ─────────────────────────────────────────────────────────────

export const MOODS = [
  {
    id: 'crushed',
    label: 'Crushed',
    score: 0.05,
    emoji: '1f62d', // loudly crying face
    color: '#ff4d6d',
    subtitle: 'heavy, unmoving',
  },
  {
    id: 'low',
    label: 'Low',
    score: 0.25,
    emoji: '1f61e', // disappointed face
    color: '#ff8cc6',
    subtitle: 'drained, but here',
  },
  {
    id: 'neutral',
    label: 'Level',
    score: 0.5,
    emoji: '1f610', // neutral face
    color: '#a8a8bd',
    subtitle: 'steady. nothing breaking',
  },
  {
    id: 'good',
    label: 'Alive',
    score: 0.75,
    emoji: '1f642', // slightly smiling
    color: '#69db7c',
    subtitle: 'moving, light returning',
  },
  {
    id: 'great',
    label: 'Radiant',
    score: 0.95,
    emoji: '1f929', // star-struck
    color: '#ffd166',
    subtitle: 'on fire in the right way',
  },
];

export const moodById = (id) => MOODS.find((m) => m.id === id);
export const moodByScore = (score) => {
  let best = MOODS[0];
  let bestD = Infinity;
  for (const m of MOODS) {
    const d = Math.abs(m.score - score);
    if (d < bestD) {
      best = m;
      bestD = d;
    }
  }
  return best;
};
