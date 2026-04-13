// ─────────────────────────────────────────────────────────────
// Note kinds — the different "catalogs" a user can capture to.
// Each note kind has its own place in the insights pipeline:
//   - idea: surfaces in the weekly review as "what you dreamed up"
//   - dream: night-log; feeds symbolic analysis
//   - gratitude: lights up empathy/transcendence facets
//   - win:      fuels self-efficacy graphs
//   - struggle: grouped into pattern detection
//   - question: becomes chat seed for "Chat with your IRIS"
//   - quote:    external signal, not scored
//   - reflection: free-form, the default
// ─────────────────────────────────────────────────────────────

export const NOTE_KINDS = [
  {
    id: 'reflection',
    label: 'Reflection',
    emoji: '1faa9', // mirror
    color: '#aaaabb',
    prompt: "What's alive in you right now?",
  },
  {
    id: 'idea',
    label: 'Idea',
    emoji: '1f4a1', // light bulb
    color: '#ffd166',
    prompt: 'What did you just think of?',
  },
  {
    id: 'dream',
    label: 'Dream',
    emoji: '1f319', // crescent moon
    color: '#b197fc',
    prompt: 'What did you see in the night?',
  },
  {
    id: 'gratitude',
    label: 'Gratitude',
    emoji: '1f64f', // folded hands
    color: '#ffd166',
    prompt: 'Three things worth keeping.',
  },
  {
    id: 'win',
    label: 'Win',
    emoji: '1f3c6', // trophy
    color: '#63e6be',
    prompt: 'Small or large — what counted?',
  },
  {
    id: 'struggle',
    label: 'Struggle',
    emoji: '26f0', // mountain
    color: '#ff8cc6',
    prompt: 'What is refusing to move?',
  },
  {
    id: 'question',
    label: 'Question',
    emoji: '2753', // red question mark
    color: '#7eb5ff',
    prompt: 'What are you still asking?',
  },
  {
    id: 'quote',
    label: 'Quote',
    emoji: '1f4ac', // speech balloon
    color: '#aaaabb',
    prompt: 'Words worth remembering.',
  },
  {
    id: 'goal',
    label: 'Goal',
    emoji: '1f3af', // direct hit
    color: '#ffa94d',
    prompt: 'What are you aiming at?',
  },
];

export const noteKindById = (id) =>
  NOTE_KINDS.find((n) => n.id === id) || NOTE_KINDS[0];
