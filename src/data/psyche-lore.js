// ─────────────────────────────────────────────────────────────
// psyche-lore.js — absorbed Coliseum narratives + sub-archetype
// descriptions, presented in personal context.
// ─────────────────────────────────────────────────────────────
// Previously this data lived inside IRIS.jsx as an encyclopaedic
// browser called "The Coliseum." The Psyche Engine absorbs it:
// each type's history, strengths, weaknesses, and notable figures
// are now surfaced on the user's own type, wing, and tritype
// components — not as a detached reference but as direct context
// for understanding yourself.
//
// Pure data. No computation.
// ─────────────────────────────────────────────────────────────

export const TYPE_LORE = {
  1: {
    era: 'The Judge-Kings',
    history: 'Throughout history, Type 1s have been the moral architects — the lawmakers, the quality controllers, the voices saying "this is not good enough." From Confucius codifying ethical conduct to Florence Nightingale reforming healthcare, Ones channel anger into systematic improvement. In modern society, they populate standards bodies, quality assurance, judicial systems, and reform movements. Their shadow across history is fundamentalism — when the inner standard becomes an outer weapon.',
    figures: 'Confucius · Gandhi · Martha Graham',
  },
  2: {
    era: 'The Healers',
    history: 'Type 2s are the invisible infrastructure of every civilization. They are the caretakers, the community builders, the people who remember your birthday and show up with food when you\'re grieving. Historically they\'ve powered charitable movements, nursing, education, and social work. Their influence is often unrecorded because they operate through others. The shadow is codependency — when giving becomes a transaction for love.',
    figures: 'Mother Teresa · Mr. Rogers · Desmond Tutu',
  },
  3: {
    era: 'The Architects of Success',
    history: 'Type 3s built the modern meritocracy. They are the CEOs, the Olympic athletes, the self-made founders who turn vision into measurable reality. American culture is essentially a Type 3 culture — optimistic, achievement-oriented, and performance-driven. Historically, they\'ve been the empire builders, the brand creators, and the people who make things scale. Their shadow is the empty trophy room — achievement without meaning.',
    figures: 'Oprah · Muhammad Ali · Tony Robbins',
  },
  4: {
    era: 'The Romantic Visionaries',
    history: 'Type 4s gave humanity its art, its poetry, and its permission to feel. Every Romantic movement, every artistic revolution, every cultural moment that said "authenticity matters more than conformity" was 4-energy. They populate the arts, therapy, design, and anywhere that emotional truth is the product. Their historical gift is making the interior visible. Their shadow is the belief that suffering is identity.',
    figures: 'Frida Kahlo · Edgar Allan Poe · Prince',
  },
  5: {
    era: 'The Knowledge Architects',
    history: 'Type 5s built the intellectual infrastructure of civilization. They are the scientists, the researchers, the systems thinkers who observe the world from enough distance to see its actual structure. From Newton to Einstein to modern AI researchers, Fives trade social currency for cognitive capital. They populate academia, R&D, engineering, and anywhere that deep expertise is valued over social skill. Their shadow is detachment from the embodied world.',
    figures: 'Einstein · Bill Gates · Jane Goodall',
  },
  6: {
    era: 'The Guardians',
    history: 'Type 6s are the most common type and the backbone of institutional stability. They are the firefighters, the soldiers, the risk managers, and the people who actually read the safety manual. Every functioning democracy, every insurance system, every emergency protocol exists because Sixes built it. They trust systems over individuals and test everything before relying on it. Their shadow is the paralysis of perpetual doubt.',
    figures: 'J.R.R. Tolkien · Robert F. Kennedy · Ellen DeGeneres',
  },
  7: {
    era: 'The Renaissance Minds',
    history: 'Type 7s are civilization\'s optimists and innovators. They connect ideas across domains, generate possibilities faster than anyone can execute them, and maintain an almost religious faith that the best is yet to come. They are the entrepreneurs, the comedians, the travel writers, and the people who turn any crisis into a brainstorming session. Their historical gift is making the future feel exciting. Their shadow is the flight from pain.',
    figures: 'Leonardo da Vinci · Robin Williams · Richard Branson',
  },
  8: {
    era: 'The Sovereigns',
    history: 'Type 8s are the rarest type and the most immediately impactful. They are the founders, the generals, the revolutionaries who reshape reality through sheer force of will. History\'s great liberators, its most effective leaders, and its most terrifying tyrants have all been Eights. They hold power naturally and use it to protect or to dominate. In modern society, they run companies, lead movements, and set the terms. Their shadow is the vulnerability they refuse to show.',
    figures: 'Martin Luther King Jr. · Ernest Hemingway · Serena Williams',
  },
  9: {
    era: 'The Harmonizers',
    history: 'Type 9s are the second most common type and the most underestimated. They are the mediators, the diplomats, the people who hold contradictions without breaking. Every peace treaty, every successful merger, every family that stayed together through crisis had Nine energy at the center. They see all perspectives simultaneously, which is both their gift and their paralysis. Their shadow is self-erasure — disappearing into other people\'s agendas.',
    figures: 'Abraham Lincoln · Carl Jung · Audrey Hepburn',
  },
};

/** Personalised descriptions for sub-archetypes (wing, tritype).
 *  These are surfaced when the user's data supports them. */
export const SUB_LORE = {
  wing: {
    1: { 9: 'The Idealist — Reformer softened by Peacemaker patience. High standards held with grace rather than rigidity.', 2: 'The Advocate — Reformer energised by Helper warmth. Moral clarity expressed through service rather than judgment.' },
    2: { 1: 'The Servant — Helper structured by Reformer principles. Care delivered with integrity and clear boundaries.', 3: 'The Host — Helper amplified by Achiever visibility. Generosity expressed through impact and recognition.' },
    3: { 2: 'The Charmer — Achiever warmed by Helper attunement. Success achieved through relationships, not just metrics.', 4: 'The Professional — Achiever deepened by Individualist authenticity. Excellence with substance, not just surface.' },
    4: { 3: 'The Aristocrat — Individualist driven by Achiever ambition. Authenticity expressed through accomplishment.', 5: 'The Bohemian — Individualist intellectualised by Investigator analysis. Feeling examined with conceptual rigour.' },
    5: { 4: 'The Iconoclast — Investigator intensified by Individualist depth. Knowledge pursued with emotional urgency.', 6: 'The Problem Solver — Investigator grounded by Loyalist practicality. Analysis directed at real threats and systems.' },
    6: { 5: 'The Defender — Loyalist sharpened by Investigator perception. Threat detection with intellectual precision.', 7: 'The Buddy — Loyalist lightened by Enthusiast optimism. Trust built through joy and shared experience.' },
    7: { 6: 'The Entertainer — Enthusiast anchored by Loyalist commitment. Freedom expressed within chosen containers.', 8: 'The Realist — Enthusiast powered by Challenger decisiveness. Optimism backed by action and force.' },
    8: { 7: 'The Maverick — Challenger expanded by Enthusiast vision. Power expressed through possibility and movement.', 9: 'The Bear — Challenger softened by Peacemaker receptivity. Strength directed at protection rather than domination.' },
    9: { 8: 'The Referee — Peacemaker energised by Challenger assertion. Harmony achieved through active intervention, not passive merging.', 1: 'The Dreamer — Peacemaker structured by Reformer principles. Peace pursued with integrity and clear ideals.' },
  },
};

/**
 * Get lore for a specific type.
 * @param {number} type — enneagram type 1-9
 * @returns {object | null}
 */
export function getTypeLore(type) {
  return TYPE_LORE[type] || null;
}

/**
 * Get wing lore for a specific core type + wing combination.
 * @param {number} coreType
 * @param {number} wingType
 * @returns {string | null}
 */
export function getWingLore(coreType, wingType) {
  return SUB_LORE.wing[coreType]?.[wingType] || null;
}
