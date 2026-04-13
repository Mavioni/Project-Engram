// ─────────────────────────────────────────────────────────────
// Engram — design tokens (JS mirror of CSS custom properties).
// Used when we need values in JSX (inline styles, three.js, charts).
// ─────────────────────────────────────────────────────────────

export const colors = {
  bg: '#06060e',
  bgSoft: '#0b0b17',
  bgRaised: '#111122',
  border: 'rgba(255,255,255,0.08)',
  borderStrong: 'rgba(255,255,255,0.22)',

  ink: '#e6e6f0',
  inkSoft: '#aaaabb',
  inkDim: '#666677',
  inkFaint: '#333344',

  accent: '#ffd166',
  good: '#63e6be',
  bad: '#ff6b6b',
};

export const domainColors = {
  cognitive: '#7eb5ff',
  emotional: '#ff6b8a',
  volitional: '#ffa94d',
  relational: '#69db7c',
  existential: '#b197fc',
  shadow: '#868e96',
};

export const fonts = {
  serif: "'Cormorant Garamond', Georgia, 'Times New Roman', serif",
  mono: "'DM Mono', ui-monospace, 'SF Mono', Menlo, monospace",
};

export const shadows = {
  soft: '0 4px 24px rgba(0,0,0,0.4)',
  glow: (hex) => `0 0 24px ${hex}33, 0 0 60px ${hex}18`,
};

export const radii = {
  sm: 4,
  md: 8,
  lg: 16,
  pill: 999,
};
