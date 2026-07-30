// ─────────────────────────────────────────────────────────────
// arrows.js — integration and disintegration paths.
// ─────────────────────────────────────────────────────────────
// The Enneagram symbol has inner lines connecting each type to
// two others:
//   Integration (growth / security): the type you move toward
//     when healthy, secure, and growing.
//   Disintegration (stress): the type you take on qualities of
//     under pressure or when your core strategy fails.
//
// This module provides the arrow targets and plain-English
// descriptions for each type. Pure data — no computation.
// ─────────────────────────────────────────────────────────────

export const ARROWS = {
  1: {
    integration: { type: 7, label: 'moves toward 7', desc: 'Under growth, the rigid Reformer loosens — becomes spontaneous, joyful, open to experience without needing to control it. The inner critic quiets. Life becomes something to savour, not just perfect.' },
    disintegration: { type: 4, label: 'moves toward 4', desc: 'Under stress, the principled Reformer becomes moody, self-critical, and convinced of their own inadequacy. The same voice that drives excellence turns inward as relentless self-judgment.' },
  },
  2: {
    integration: { type: 4, label: 'moves toward 4', desc: 'Under growth, the Helper stops performing care and learns to want for themselves. Creativity, authenticity, and emotional honesty emerge — giving without transaction.' },
    disintegration: { type: 8, label: 'moves toward 8', desc: 'Under stress, the generous Helper becomes controlling, aggressive, and demanding. "I gave you everything" becomes a weapon. The need to be needed curdles into resentment.' },
  },
  3: {
    integration: { type: 6, label: 'moves toward 6', desc: 'Under growth, the Achiever stops performing and starts belonging. Loyalty replaces image management. The drive to win becomes the courage to commit — to people, to values, to truth.' },
    disintegration: { type: 9, label: 'moves toward 9', desc: 'Under stress, the driven Achiever disengages, numbs out, and goes through motions. The engine stalls. Success feels hollow, and the machinery of achievement stops convincing.' },
  },
  4: {
    integration: { type: 1, label: 'moves toward 1', desc: 'Under growth, the turbulent Individualist finds structure. Emotional intensity channels into disciplined creation. Feeling everything doesn\'t mean being consumed by it — principles become containers.' },
    disintegration: { type: 2, label: 'moves toward 2', desc: 'Under stress, the authentic Individualist becomes clingy, manipulative, and desperate for reassurance. "See me" becomes "need me" — trading uniqueness for attachment.' },
  },
  5: {
    integration: { type: 8, label: 'moves toward 8', desc: 'Under growth, the withdrawn Investigator steps into power. Knowledge becomes action. The observer becomes the leader — decisive, protective, fully embodied.' },
    disintegration: { type: 7, label: 'moves toward 7', desc: 'Under stress, the focused Investigator scatters — chasing ideas without depth, consuming without integrating. The cathedral of mind becomes a carnival of distraction.' },
  },
  6: {
    integration: { type: 9, label: 'moves toward 9', desc: 'Under growth, the anxious Loyalist finds peace. Trust replaces suspicion. The constant scanning stops — not because threats disappeared, but because you trust yourself to handle them.' },
    disintegration: { type: 3, label: 'moves toward 3', desc: 'Under stress, the committed Loyalist becomes performative — working frantically, seeking external validation, losing the internal compass that makes them trustworthy.' },
  },
  7: {
    integration: { type: 5, label: 'moves toward 5', desc: 'Under growth, the scattered Enthusiast goes deep. Novelty-chasing becomes genuine curiosity. The breadth of experience gains the weight of understanding — joy with substance.' },
    disintegration: { type: 1, label: 'moves toward 1', desc: 'Under stress, the joyful Enthusiast becomes rigid, critical, and perfectionistic. Freedom curdles into rules. The open horizon becomes a cage of shoulds.' },
  },
  8: {
    integration: { type: 2, label: 'moves toward 2', desc: 'Under growth, the powerful Challenger softens. Strength becomes service. Protection extends beyond the inner circle — the fortress opens. Vulnerability is no longer a threat but a gift.' },
    disintegration: { type: 5, label: 'moves toward 5', desc: 'Under stress, the assertive Challenger withdraws — becomes secretive, paranoid, and isolated. The commanding presence retreats into strategic silence. The world becomes hostile.' },
  },
  9: {
    integration: { type: 3, label: 'moves toward 3', desc: 'Under growth, the passive Peacemaker engages. Energy wakes up. The merged self differentiates — your voice, your ambition, your presence in the world. Peace without self-erasure.' },
    disintegration: { type: 6, label: 'moves toward 6', desc: 'Under stress, the harmonious Peacemaker becomes anxious, suspicious, and reactive. The calm surface cracks. Peacekeeping becomes catastrophising — everything feels like a threat to stability.' },
  },
};

/**
 * @param {number} type — the user's core enneagram type (1-9)
 * @returns {{ integration: object, disintegration: object } | null}
 */
export function getArrows(type) {
  return ARROWS[type] || null;
}
