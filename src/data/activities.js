// ─────────────────────────────────────────────────────────────
// Activity catalog — the tags a user picks each day.
// Grouped into meaningful categories so the picker doesn't feel
// like an IKEA manual. Every tag maps to a Twemoji codepoint and
// to an IRIS facet bias (tiny nudge toward which facet this
// activity tends to light up, used for longitudinal insights).
// ─────────────────────────────────────────────────────────────

export const ACTIVITY_GROUPS = [
  {
    id: 'body',
    label: 'Body',
    color: '#69db7c',
    items: [
      { id: 'exercise', label: 'Exercise', emoji: '1f3c3', bias: { discipline: 0.2, regulation: 0.1 } },
      { id: 'walk', label: 'Walk', emoji: '1f6b6', bias: { patience: 0.1, regulation: 0.1 } },
      { id: 'yoga', label: 'Yoga', emoji: '1f9d8', bias: { regulation: 0.2, transcendence: 0.1 } },
      { id: 'sport', label: 'Sport', emoji: '26bd', bias: { assertion: 0.15, social: 0.1 } },
      { id: 'eat-well', label: 'Ate well', emoji: '1f957', bias: { discipline: 0.15 } },
      { id: 'rest', label: 'Rested', emoji: '1f6cc', bias: { patience: 0.15 } },
      { id: 'sleep', label: 'Slept deep', emoji: '1f634', bias: { regulation: 0.15 } },
      { id: 'meds', label: 'Medication', emoji: '1f48a', bias: { discipline: 0.1 } },
    ],
  },
  {
    id: 'mind',
    label: 'Mind',
    color: '#7eb5ff',
    items: [
      { id: 'read', label: 'Read', emoji: '1f4d6', bias: { analytical: 0.15, abstract: 0.15 } },
      { id: 'write', label: 'Wrote', emoji: '270d', bias: { abstract: 0.15, identity: 0.1 } },
      { id: 'study', label: 'Studied', emoji: '1f4da', bias: { discipline: 0.15, analytical: 0.1 } },
      { id: 'deep-work', label: 'Deep work', emoji: '1f9d1-200d-1f4bb', bias: { discipline: 0.2, pattern: 0.1 } },
      { id: 'learn', label: 'Learned', emoji: '1f9e0', bias: { abstract: 0.15 } },
      { id: 'focus', label: 'Focused', emoji: '1f3af', bias: { discipline: 0.15 } },
      { id: 'think', label: 'Thought it through', emoji: '1f4ad', bias: { analytical: 0.15 } },
    ],
  },
  {
    id: 'heart',
    label: 'Heart',
    color: '#ff6b8a',
    items: [
      { id: 'family', label: 'Family', emoji: '1f46a', bias: { bonding: 0.2, empathy: 0.1 } },
      { id: 'friends', label: 'Friends', emoji: '1f91d', bias: { bonding: 0.15, social: 0.15 } },
      { id: 'partner', label: 'Partner', emoji: '1f495', bias: { bonding: 0.2, vulnerability: 0.1 } },
      { id: 'date', label: 'Date', emoji: '1f339', bias: { desire: 0.15, vulnerability: 0.1 } },
      { id: 'therapy', label: 'Therapy', emoji: '1f6cb', bias: { vulnerability: 0.2, depth: 0.15 } },
      { id: 'hugged', label: 'Held someone', emoji: '1f917', bias: { empathy: 0.15, bonding: 0.15 } },
      { id: 'cried', label: 'Cried', emoji: '1f622', bias: { depth: 0.2, vulnerability: 0.15 } },
      { id: 'laughed', label: 'Laughed hard', emoji: '1f602', bias: { spontaneity: 0.15, bonding: 0.1 } },
    ],
  },
  {
    id: 'make',
    label: 'Make',
    color: '#ffa94d',
    items: [
      { id: 'create', label: 'Created', emoji: '1f3a8', bias: { abstract: 0.15, desire: 0.1 } },
      { id: 'build', label: 'Built', emoji: '1f528', bias: { pragmatic: 0.2, discipline: 0.15 } },
      { id: 'code', label: 'Code', emoji: '1f468-200d-1f4bb', bias: { analytical: 0.15, pattern: 0.15 } },
      { id: 'music', label: 'Music', emoji: '1f3b5', bias: { depth: 0.15, transcendence: 0.1 } },
      { id: 'cook', label: 'Cooked', emoji: '1f373', bias: { pragmatic: 0.1, spontaneity: 0.1 } },
      { id: 'garden', label: 'Garden', emoji: '1f331', bias: { patience: 0.15, transcendence: 0.1 } },
      { id: 'ship', label: 'Shipped', emoji: '1f680', bias: { pragmatic: 0.2, assertion: 0.1 } },
    ],
  },
  {
    id: 'world',
    label: 'World',
    color: '#b197fc',
    items: [
      { id: 'work', label: 'Work', emoji: '1f4bc', bias: { discipline: 0.1, purpose: 0.1 } },
      { id: 'meetings', label: 'Meetings', emoji: '1f4c5', bias: { social: 0.1, patience: 0.1 } },
      { id: 'money', label: 'Money stuff', emoji: '1f4b8', bias: { pragmatic: 0.15, fear: 0.1 } },
      { id: 'travel', label: 'Traveled', emoji: '2708', bias: { spontaneity: 0.2, transcendence: 0.1 } },
      { id: 'nature', label: 'Nature', emoji: '1f332', bias: { transcendence: 0.2, regulation: 0.1 } },
      { id: 'errands', label: 'Errands', emoji: '1f6d2', bias: { discipline: 0.05 } },
      { id: 'commute', label: 'Commute', emoji: '1f689', bias: { patience: 0.05 } },
    ],
  },
  {
    id: 'inner',
    label: 'Inner',
    color: '#ffd166',
    items: [
      { id: 'meditate', label: 'Meditated', emoji: '1f9d8-200d-2642', bias: { regulation: 0.2, transcendence: 0.2 } },
      { id: 'pray', label: 'Prayed', emoji: '1f64f', bias: { transcendence: 0.2 } },
      { id: 'journal', label: 'Journaled', emoji: '1f4d4', bias: { depth: 0.15, identity: 0.15 } },
      { id: 'gratitude', label: 'Gratitude', emoji: '1f33b', bias: { empathy: 0.15, transcendence: 0.1 } },
      { id: 'grief', label: 'Sat with grief', emoji: '1f90d', bias: { mortality: 0.2, depth: 0.2 } },
      { id: 'solitude', label: 'Solitude', emoji: '1f319', bias: { autonomy: 0.2, abstract: 0.1 } },
    ],
  },
  {
    id: 'shadow',
    label: 'Shadow',
    color: '#868e96',
    items: [
      { id: 'anxious', label: 'Anxious', emoji: '1f630', bias: { fear: 0.25 } },
      { id: 'angry', label: 'Angry', emoji: '1f621', bias: { anger: 0.25 } },
      { id: 'ashamed', label: 'Ashamed', emoji: '1f633', bias: { shame: 0.25 } },
      { id: 'lonely', label: 'Lonely', emoji: '1f494', bias: { bonding: -0.15 } },
      { id: 'tempted', label: 'Tempted', emoji: '1f608', bias: { desire: 0.25 } },
      { id: 'stuck', label: 'Stuck', emoji: '1faa8', bias: { discipline: -0.1 } },
      { id: 'overwhelm', label: 'Overwhelmed', emoji: '1f635', bias: { fear: 0.2, regulation: -0.1 } },
      { id: 'numb', label: 'Numb', emoji: '1f610', bias: { depth: -0.15 } },
    ],
  },
];

export const ALL_ACTIVITIES = ACTIVITY_GROUPS.flatMap((g) =>
  g.items.map((i) => ({ ...i, group: g.id, groupColor: g.color })),
);

export const activityById = (id) => ALL_ACTIVITIES.find((a) => a.id === id);
