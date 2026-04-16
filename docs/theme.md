# Theme — how light and dark modes work

## The basics

Engram has two themes: **light** (default) and **dark**. The user toggles in **Settings → Appearance**.

The choice is stored in the app's store under `theme`. When it changes, a React effect sets `data-theme="light"` or `data-theme="dark"` on the root `<html>` element. That attribute is what CSS reads to decide which palette to use.

## How we avoid the "flash of wrong theme"

When the page first loads, there's a tiny window before React mounts. If we waited for React to pick up the theme, the page would briefly flash light-mode before switching to dark (or vice versa).

The fix lives in `src/main.jsx` — before React renders, we read the saved theme straight from `localStorage` and set `data-theme` on `<html>` ourselves. By the time any pixel paints, the correct theme is already active.

## Where the palettes live

`src/styles/global.css` has all the color definitions as CSS variables:

```css
:root[data-theme='light'] {
  --bg: #f5f4ee;
  --ink: #141420;
  --border: rgba(17, 17, 30, 0.08);
  ...
}

:root[data-theme='dark'] {
  --bg: #06060e;
  --ink: #e6e6f0;
  --border: rgba(255, 255, 255, 0.08);
  ...
}
```

Every component that cares about theming uses these variables:

```jsx
<div style={{ background: 'var(--bg-raised)', color: 'var(--ink)' }}>
```

Switching themes is literally just swapping the `data-theme` attribute. The browser repaints using the other palette.

## Variables you'll see referenced

### Surface
- `--bg` — the page background
- `--bg-soft` — slightly raised (rarely used)
- `--bg-raised` — cards, inputs, chips
- `--border` — default border color
- `--border-strong` — inputs under focus, selected states

### Ink (text)
- `--ink` — primary text
- `--ink-soft` — secondary prose
- `--ink-dim` — labels, chrome
- `--ink-faint` — barely-there disclaimers

### Domains (the 6 IRIS domains)
- `--d-cog` (Cognitive — blue)
- `--d-emo` (Emotional — pink)
- `--d-vol` (Volitional — orange)
- `--d-rel` (Relational — green)
- `--d-exi` (Existential — purple)
- `--d-sha` (Shadow — gray)

### Semantic
- `--accent` — gold in dark mode, amber in light
- `--good` — success green
- `--bad` — error red

## Brand colors (archetype + mood colors)

Each of the 9 archetypes has its own color. Each of the 5 moods has its own color. These are **hardcoded hex values** in `src/data/enneagram.js` and `src/data/moods.js`. We don't theme them.

Why? They're saturated enough to read well on both light and dark backgrounds. Trying to make them theme-aware would mean maintaining two shades of every color and picking the "wrong" one half the time.

When we need a brand color to fade into the background, we use `color-mix`:

```jsx
background: `color-mix(in srgb, ${t.color} 18%, transparent)`
```

This mixes the archetype color at 18% opacity with transparency — lets the page's `--bg` show through. Works cleanly on both themes.

## Adding a new color

If you're introducing something with a semantic meaning (like a "warning" amber), add it as a CSS variable in both palettes. If it's just a brand accent (like a new archetype color), add it as a hex value to the relevant data file.
