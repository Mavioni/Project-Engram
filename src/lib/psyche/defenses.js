// ─────────────────────────────────────────────────────────────
// defenses.js — signature defence mechanism.
// ─────────────────────────────────────────────────────────────
// Each Enneagram type has a characteristic defence mechanism —
// the unconscious psychological strategy it uses to avoid its
// core fear. These are well-documented in the clinical literature
// (Naranjo, Riso-Hudson, Palmer).
//
// This module maps core type → defence mechanism with a
// plain-English explanation and a reflection question.
//
// Pure data. No computation.
// ─────────────────────────────────────────────────────────────

export const DEFENSES = {
  1: {
    name: 'Reaction Formation',
    short: 'Converting unacceptable impulses into their opposites.',
    desc: 'The Reformer\'s anger at imperfection is transformed into rigorous correctness. The impulse to criticise becomes the impulse to improve. The unacceptable feeling is replaced by its opposite — so thoroughly that even you may not recognise the original.',
    reflection: 'What am I not allowing myself to feel because it doesn\'t meet my standards?',
  },
  2: {
    name: 'Repression',
    short: 'Pushing needs out of awareness to maintain the helper identity.',
    desc: 'The Helper\'s own needs are buried so deeply that "what do you need?" becomes a genuinely difficult question. Giving becomes the only acceptable way to receive. The repressed material doesn\'t disappear — it surfaces as resentment or somatic symptoms.',
    reflection: 'If I stopped giving for one week, what would I discover I actually want?',
  },
  3: {
    name: 'Identification',
    short: 'Becoming the role so completely the self disappears.',
    desc: 'The Achiever shapeshifts so effectively that the performance becomes the person. You become what success requires — and lose track of who you were before the role. The defence is so successful it feels like competence, not coping.',
    reflection: 'Who am I when nothing is being measured and there is no audience?',
  },
  4: {
    name: 'Introjection',
    short: 'Internalising external criticism to maintain a sense of deficient identity.',
    desc: 'The Individualist absorbs negative evaluations and weaves them into identity. "I am flawed" becomes a stable self-concept — painful but known. The defence protects against the terror of being ordinary by making deficiency special.',
    reflection: 'What if my feeling of being different is not a wound but a doorway?',
  },
  5: {
    name: 'Isolation',
    short: 'Separating feeling from thinking to maintain detachment.',
    desc: 'The Investigator splits cognition from emotion so thoroughly that feelings become objects to analyse rather than experiences to inhabit. This creates safety — but at the cost of presence. The world is understood but not felt.',
    reflection: 'What would happen if I let myself feel something without needing to understand it first?',
  },
  6: {
    name: 'Projection',
    short: 'Attributing internal fears and doubts to external sources.',
    desc: 'The Loyalist\'s internal scanning for threat gets projected outward — the danger feels like it\'s coming from others, from institutions, from the future. This creates a world that really does feel hostile, confirming the original fear. The defence is self-reinforcing.',
    reflection: 'How much of what I\'m afraid of is actually in the room right now?',
  },
  7: {
    name: 'Rationalisation',
    short: 'Explaining away pain to maintain optimism.',
    desc: 'The Enthusiast reframes every setback into an opportunity so quickly that grief never lands. "It\'s fine" becomes a reflex. The defence protects against pain but also against depth — you can\'t selectively numb. Joy without sorrow becomes shallow.',
    reflection: 'What am I not allowing myself to grieve because I\'ve already reframed it?',
  },
  8: {
    name: 'Denial',
    short: 'Refusing to acknowledge vulnerability or limitation.',
    desc: 'The Challenger\'s armour is so effective that vulnerability ceases to register. "I\'m fine" is not a performance — you genuinely don\'t feel the wound until it\'s overwhelming. The defence creates extraordinary resilience but isolates you from the tenderness that makes strength worth having.',
    reflection: 'What would happen if I admitted I need help — not strategically, but genuinely?',
  },
  9: {
    name: 'Narcotisation',
    short: 'Numbing out to avoid conflict and maintain inner peace.',
    desc: 'The Peacemaker dissolves into routines, distractions, and other people\'s agendas to avoid the discomfort of asserting a self. "It doesn\'t matter" becomes a way of life. The defence creates harmony but at the cost of presence — you\'re here, but not fully here.',
    reflection: 'What do I actually want — not what keeps the peace, not what others want — what do I want?',
  },
};

/**
 * @param {number} type — core enneagram type (1-9)
 * @returns {object | null}
 */
export function getDefense(type) {
  return DEFENSES[type] || null;
}
