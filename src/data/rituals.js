// ─────────────────────────────────────────────────────────────
// Rituals — curated short practices.
// ─────────────────────────────────────────────────────────────
// 10 practices grounded in real traditions (pranayama, CBT
// grounding, loving-kindness, ACT, mindfulness). Each ritual is
// intentionally brief (30 seconds to 8 minutes) and designed to
// stand on its own without requiring previous experience.
//
// Shape of a ritual:
//   id          stable string, used as URL slug
//   name        human title
//   kind        one of the KIND ids below — drives color + filter
//   duration    rough minutes (for the list badge)
//   blurb       a single sentence you could read at a glance
//   why         the underlying tradition + what it's good for
//   emoji       Twemoji codepoint for the header
//   steps       array of { kind, text, duration, breathe?: {...} }
//               Each step advances either on a timer (duration) or
//               on tap (tap-advance). Breath steps tell the Sigil
//               backdrop to scale/pulse in sync.
// ─────────────────────────────────────────────────────────────

export const KINDS = {
  breath:     { id: 'breath',     label: 'Breath',     color: '#7eb5ff', emoji: '1f32c' }, // wind face
  meditation: { id: 'meditation', label: 'Meditation', color: '#b197fc', emoji: '1f9d8' }, // person in lotus
  grounding:  { id: 'grounding',  label: 'Grounding',  color: '#69db7c', emoji: '1f333' }, // deciduous tree
  body:       { id: 'body',       label: 'Body',       color: '#ffa94d', emoji: '1f9d8' }, // person in lotus
  gratitude:  { id: 'gratitude',  label: 'Gratitude',  color: '#ffd166', emoji: '1f64f' }, // folded hands
  shadow:     { id: 'shadow',     label: 'Shadow',     color: '#9775fa', emoji: '1f319' }, // crescent moon
  intention:  { id: 'intention',  label: 'Intention',  color: '#ff6b8a', emoji: '1f3af' }, // target
  compassion: { id: 'compassion', label: 'Compassion', color: '#ff8fa3', emoji: '1f495' }, // two hearts
  arrival:    { id: 'arrival',    label: 'Arrival',    color: '#63e6be', emoji: '2728' },  // sparkles
  review:     { id: 'review',     label: 'Review',     color: '#868e96', emoji: '1faa9' }, // mirror
};

// Shorthand for breath instructions. `phase` is one of:
//   'in'    inhale
//   'hold'  hold
//   'out'   exhale
//   'rest'  hold empty
// Seconds is the duration of that phase. Player animates the sigil
// accordingly — `in` scales up, `out` scales down, `hold`/`rest` hold.
const breath = (phase, seconds) => ({ phase, seconds });

export const RITUALS = [
  // ── Breath ──
  {
    id: '4-7-8',
    name: 'Four · Seven · Eight',
    kind: 'breath',
    duration: 2,
    blurb: 'Inhale for 4, hold for 7, exhale for 8. Eight cycles.',
    why: 'From pranayama via Andrew Weil — the long exhale is what tells your parasympathetic nervous system the threat is gone. Works in traffic, in bed, before hard conversations.',
    emoji: '1f32c',
    ambient: true,
    steps: [
      { kind: 'arrival', text: 'Sit comfortably. Let your tongue rest on the roof of your mouth, behind the front teeth.', duration: 8 },
      { kind: 'arrival', text: 'Exhale completely through your mouth, with a soft sound.', duration: 6 },
      ...Array.from({ length: 8 }, (_, i) => ({
        kind: 'breath',
        text: `Cycle ${i + 1} of 8`,
        breathe: [breath('in', 4), breath('hold', 7), breath('out', 8)],
      })),
      { kind: 'close', text: 'Notice what changed. Open your eyes when you are ready.', duration: 8 },
    ],
  },
  {
    id: 'box-breath',
    name: 'Box Breath',
    kind: 'breath',
    duration: 3,
    blurb: 'Inhale 4 · hold 4 · exhale 4 · hold 4. Ten cycles.',
    why: 'Used by Navy SEALs and trauma therapists for rapid nervous-system regulation without bias toward either activation or rest. Balanced, portable, invisible.',
    emoji: '1f532',
    ambient: true,
    steps: [
      { kind: 'arrival', text: 'Find a posture you can hold for three minutes without fidgeting.', duration: 6 },
      ...Array.from({ length: 10 }, (_, i) => ({
        kind: 'breath',
        text: `Cycle ${i + 1} of 10`,
        breathe: [breath('in', 4), breath('hold', 4), breath('out', 4), breath('rest', 4)],
      })),
      { kind: 'close', text: 'Return to your natural breath. Stay a moment.', duration: 6 },
    ],
  },

  // ── Meditation ──
  {
    id: 'simple-sitting',
    name: 'Simple Sitting',
    kind: 'meditation',
    duration: 5,
    blurb: 'Five minutes. Just be with your breath. Ambient music optional.',
    why: 'The shortest formal meditation in this collection. No technique beyond returning attention to the breath when it wanders. 5 minutes isn\u2019t a warmup — it\u2019s a real practice. Traditional zazen starts here.',
    emoji: '1f9d8',
    ambient: true,
    steps: [
      { kind: 'arrival', text: 'Sit with a straight but unforced spine. Eyes open and soft, or closed.', duration: 15 },
      { kind: 'arrival', text: 'Notice you are breathing. Don\u2019t adjust it.', duration: 15 },
      { kind: 'prompt', text: 'When the mind wanders — and it will — gently return to the breath. That is the whole practice.', duration: 270 },
      { kind: 'close', text: 'Come back. Notice how five minutes feels different from zero.', duration: 10 },
    ],
  },
  {
    id: 'breath-awareness',
    name: 'Breath Awareness',
    kind: 'meditation',
    duration: 10,
    blurb: 'Ten minutes. Longer container. Ambient music flows underneath.',
    why: 'A longer version of Simple Sitting. Ten minutes crosses a threshold — research on mindfulness benefits mostly starts at this duration. The extra time is where the real shift happens.',
    emoji: '1f9d8',
    ambient: true,
    steps: [
      { kind: 'arrival', text: 'Settle. Spine upright, shoulders soft. Three slow breaths to arrive.', duration: 20 },
      { kind: 'prompt', text: 'Find the breath wherever it\u2019s most vivid — the belly, the chest, the nostrils. Rest there.', duration: 180 },
      { kind: 'prompt', text: 'If the mind strays, no judgment. Note "thinking" and return.', duration: 240 },
      { kind: 'prompt', text: 'Soften the attention now. Breath is just one thing arising and passing. Let everything be as it is.', duration: 150 },
      { kind: 'close', text: 'Wiggle your fingers. Ease back into the room.', duration: 15 },
    ],
  },
  {
    id: 'sky-mind',
    name: 'Sky Mind',
    kind: 'meditation',
    duration: 8,
    blurb: 'Thoughts as clouds. You are the sky they pass through.',
    why: 'A visualization from the Dzogchen and Tibetan Buddhist traditions, adapted for secular practice. The insight: you are not your thoughts. They arise, move across, dissolve. The awareness that sees them is something else.',
    emoji: '2601',
    ambient: true,
    steps: [
      { kind: 'arrival', text: 'Sit or lie down. Let the eyes close.', duration: 15 },
      { kind: 'prompt', text: 'Imagine a vast, open sky. Not a picture — a felt sense of spaciousness.', duration: 60 },
      { kind: 'prompt', text: 'Notice that thoughts arise in this sky, like clouds. You don\u2019t have to chase them. You don\u2019t have to push them away.', duration: 120 },
      { kind: 'prompt', text: 'Some clouds are dense. Some are wisps. All of them pass.', duration: 120 },
      { kind: 'prompt', text: 'What stays? The sky. You are that sky — not the clouds.', duration: 120 },
      { kind: 'prompt', text: 'Let the thoughts come and go. The sky doesn\u2019t hold them and doesn\u2019t resist them.', duration: 60 },
      { kind: 'close', text: 'Come back slowly. Bring some of that spaciousness with you.', duration: 15 },
    ],
  },

  // ── Grounding ──
  {
    id: '5-4-3-2-1',
    name: 'Five · Four · Three · Two · One',
    kind: 'grounding',
    duration: 4,
    blurb: 'Senses back into the room. One of the oldest anxiety tools.',
    why: 'A CBT grounding technique — when the mind spirals into past or future, naming sensory input anchors you in the present body. Most effective when you actually look, not guess.',
    emoji: '1f333',
    steps: [
      { kind: 'prompt', text: 'Name five things you can see right now. Really look.', tapAdvance: true },
      { kind: 'prompt', text: 'Name four things you can hear. Not guess — hear.', tapAdvance: true },
      { kind: 'prompt', text: 'Name three things you can physically feel. The chair. Your breath. The fabric.', tapAdvance: true },
      { kind: 'prompt', text: 'Name two things you can smell. If nothing stands out, move closer to something.', tapAdvance: true },
      { kind: 'prompt', text: 'Name one thing you can taste. Even if it is just the inside of your mouth.', tapAdvance: true },
      { kind: 'close', text: 'You are here. That is the whole practice.', duration: 8 },
    ],
  },
  {
    id: 'arrival',
    name: 'Arrival',
    kind: 'arrival',
    duration: 1,
    blurb: 'Three breaths. Thirty seconds. Before anything else.',
    why: 'The shortest practice in this collection. Designed as the "before" — before a conversation, a decision, opening your laptop. Does nothing on its own and everything as a habit.',
    emoji: '2728',
    steps: [
      { kind: 'breath', text: 'Breath one.',   breathe: [breath('in', 4), breath('out', 6)] },
      { kind: 'breath', text: 'Breath two.',   breathe: [breath('in', 4), breath('out', 6)] },
      { kind: 'breath', text: 'Breath three.', breathe: [breath('in', 4), breath('out', 6)] },
      { kind: 'close', text: 'Now.', duration: 4 },
    ],
  },

  // ── Body ──
  {
    id: 'body-scan',
    name: 'Body Scan',
    kind: 'body',
    duration: 7,
    blurb: 'Toes to crown. Sixty seconds per region. Kindness, not fixing.',
    why: 'From Jon Kabat-Zinn\u2019s MBSR program. Brings awareness back into the body without trying to change anything. Particularly good for people who live in their heads.',
    emoji: '1f9d8',
    ambient: true,
    steps: [
      { kind: 'arrival', text: 'Lie down if you can. Close your eyes if it feels right.', duration: 12 },
      { kind: 'prompt', text: 'Feet. Feel them. Weight. Temperature. Tingles or nothing at all.', duration: 60 },
      { kind: 'prompt', text: 'Legs. Calves, knees, thighs. Let attention pool there for a full minute.', duration: 60 },
      { kind: 'prompt', text: 'Belly and lower back. What is here right now?', duration: 60 },
      { kind: 'prompt', text: 'Chest, shoulders, upper back. Notice tension without trying to release it.', duration: 60 },
      { kind: 'prompt', text: 'Arms and hands. All the way to the fingertips.', duration: 60 },
      { kind: 'prompt', text: 'Neck, jaw, face. The small muscles. The forehead. The space behind the eyes.', duration: 60 },
      { kind: 'prompt', text: 'Crown. The whole head. The whole body, now. One thing.', duration: 45 },
      { kind: 'close', text: 'Come back when you are ready. No rush.', duration: 10 },
    ],
  },

  // ── Gratitude ──
  {
    id: 'three-gratitudes',
    name: 'Three Gratitudes',
    kind: 'gratitude',
    duration: 3,
    blurb: 'Three specific things. The specificity is the medicine.',
    why: 'One of the most studied positive psychology interventions (Seligman\u2019s research). Vague gratitude doesn\u2019t work; specific gratitude does. "Grateful for family" won\u2019t shift your mood. "Grateful for the way my partner listened without fixing" will.',
    emoji: '1f64f',
    steps: [
      { kind: 'prompt', text: 'One specific thing from the last 24 hours you are grateful for. Not a category \u2014 a moment.', tapAdvance: true },
      { kind: 'prompt', text: 'One person you are grateful for today. Name the thing they did or simply are.', tapAdvance: true },
      { kind: 'prompt', text: 'One thing about yourself you are grateful for. This one is usually the hardest. That\u2019s why it counts.', tapAdvance: true },
      { kind: 'close', text: 'Notice how your body feels compared to a minute ago.', duration: 8 },
    ],
  },

  // ── Shadow ──
  {
    id: 'shadow-check',
    name: 'Shadow Check-in',
    kind: 'shadow',
    duration: 4,
    blurb: 'Three questions that go where you would rather not look.',
    why: 'Jungian shadow work, stripped to its essentials. What you refuse to see runs you. You don\u2019t have to fix what surfaces \u2014 just acknowledge it exists.',
    emoji: '1f319',
    steps: [
      { kind: 'arrival', text: 'Breathe in slowly. Breathe out more slowly.', duration: 10 },
      { kind: 'prompt', text: 'What am I avoiding right now? Name it. You don\u2019t have to do anything about it.', tapAdvance: true },
      { kind: 'prompt', text: 'What am I pretending not to feel? Anger, jealousy, shame, desire — which one is here?', tapAdvance: true },
      { kind: 'prompt', text: 'If I was being really honest, what would I say out loud?', tapAdvance: true },
      { kind: 'close', text: 'What you named lost some of its grip in the naming. That is the only result this practice promises.', duration: 10 },
    ],
  },

  // ── Intention ──
  {
    id: 'morning-intention',
    name: 'Intention for the Day',
    kind: 'intention',
    duration: 2,
    blurb: 'One sentence. Present tense. Specific.',
    why: 'Intentions differ from goals: goals are about outcome, intentions are about posture. "I will be patient in the meeting" is an intention; "I will close the deal" is a goal. Intentions survive contact with reality.',
    emoji: '1f3af',
    steps: [
      { kind: 'arrival', text: 'Close your eyes for three breaths. Let the day rise in your mind.', duration: 12 },
      { kind: 'prompt', text: 'What kind of person do I want to be today? Not what I want to do \u2014 how I want to be while doing it.', tapAdvance: true },
      { kind: 'prompt', text: 'Now finish this sentence: "Today I will be ____ with ____."', tapAdvance: true },
      { kind: 'prompt', text: 'Say it out loud. Twice.', tapAdvance: true },
      { kind: 'close', text: 'Carry it. Check back at the end of the day.', duration: 6 },
    ],
  },

  // ── Compassion ──
  {
    id: 'metta',
    name: 'Loving-Kindness',
    kind: 'compassion',
    duration: 5,
    blurb: 'May I be safe. May I be happy. May I be well. Then outward.',
    why: 'From the Theravada metta bhavana tradition — repeatable phrases, offered first to yourself, then to people you love, then to people you feel neutral about, then to people you struggle with. Softens the heart without requiring belief in anything.',
    emoji: '1f495',
    ambient: true,
    steps: [
      { kind: 'arrival', text: 'Settle. Let your attention rest in the center of your chest.', duration: 15 },
      { kind: 'prompt', text: 'Offer these to yourself, three times, slowly: "May I be safe. May I be happy. May I be healthy. May I be at ease."', duration: 40 },
      { kind: 'prompt', text: 'Bring to mind someone you love easily. Offer the same four phrases to them.', duration: 40 },
      { kind: 'prompt', text: 'Now a neutral person \u2014 a stranger, a coworker you don\u2019t know well. Same four phrases.', duration: 40 },
      { kind: 'prompt', text: 'Someone you find difficult. Offer the phrases as best you can. "As best you can" is enough.', duration: 50 },
      { kind: 'prompt', text: 'All beings, everywhere. "May all beings be safe. May all beings be happy. May all beings be healthy. May all beings be at ease."', duration: 40 },
      { kind: 'close', text: 'Return to yourself. Notice the quality of your heart now.', duration: 15 },
    ],
  },

  // ── Evening review ──
  {
    id: 'evening-review',
    name: 'Evening Review',
    kind: 'review',
    duration: 3,
    blurb: 'Three questions at the end of the day. Loose, not rigorous.',
    why: 'A hybrid of Jesuit examen and CBT thought review. The goal isn\u2019t to grade yourself — it\u2019s to notice patterns that would otherwise dissolve into tomorrow.',
    emoji: '1faa9',
    steps: [
      { kind: 'prompt', text: 'What surprised me today? Any size. Small counts.', tapAdvance: true },
      { kind: 'prompt', text: 'What drained me? Name it without judgment.', tapAdvance: true },
      { kind: 'prompt', text: 'What energized me? Go look for it if nothing comes up.', tapAdvance: true },
      { kind: 'close', text: 'That\u2019s the whole review. Good sleep.', duration: 6 },
    ],
  },
];

export const ritualById = (id) => RITUALS.find((r) => r.id === id);

export function ritualsByKind(kind) {
  return RITUALS.filter((r) => r.kind === kind);
}

/**
 * Pick a suggested ritual for a given day + mood context.
 * Deterministic per day so the Dashboard shows the same suggestion
 * all day, but it nudges based on the user's most recent mood:
 *   low mood → grounding or breath
 *   high mood → gratitude or intention
 *   missing  → arrival (shortest, safest entry)
 */
export function suggestRitual({ dayKey, recentMood } = {}) {
  const pool = (() => {
    if (recentMood == null) return RITUALS.filter((r) => r.kind === 'arrival' || r.kind === 'breath');
    if (recentMood < 0.35) return RITUALS.filter((r) => ['grounding', 'breath', 'body', 'compassion'].includes(r.kind));
    if (recentMood > 0.65) return RITUALS.filter((r) => ['gratitude', 'intention', 'compassion', 'review'].includes(r.kind));
    return RITUALS.filter((r) => ['arrival', 'breath', 'grounding', 'review'].includes(r.kind));
  })();
  if (pool.length === 0) return RITUALS[0];
  // Stable daily hash
  const key = dayKey || new Date().toISOString().slice(0, 10);
  let h = 0;
  for (let i = 0; i < key.length; i++) h = ((h << 5) - h + key.charCodeAt(i)) | 0;
  return pool[Math.abs(h) % pool.length];
}
