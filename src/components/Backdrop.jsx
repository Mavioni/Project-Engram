// ─────────────────────────────────────────────────────────────
// <Backdrop /> — persistent ambient sacred-geometry layer.
// ─────────────────────────────────────────────────────────────
// Renders behind every screen at very low opacity. Theme-aware:
// dark mode shows cosmic blues/purples; light mode uses muted
// warm ink that barely registers — enough to give texture but
// nowhere near enough to distract.
//
// Once the user has an IRIS result, the outer vignette picks up
// their archetype's signature color — a soft atmospheric tint,
// not a spotlight. The geometries stay neutral so the brand
// texture is consistent across archetypes.
// ─────────────────────────────────────────────────────────────

import { FlowerOfLife, MetatronsCube } from './SacredGeometry.jsx';
import { useTheme } from '../lib/theme.js';
import { useStore } from '../lib/store.js';
import { getType } from '../data/enneagram.js';

export default function Backdrop() {
  const { theme } = useTheme();
  const dark = theme === 'dark';
  const enneagramType = useStore((s) => s.iris?.enneagramType);
  const archetypeColor = enneagramType ? getType(enneagramType)?.color : null;

  // Base fog color per theme. When an archetype is present, blend
  // a small amount of its hue into the edge — enough to register
  // as atmosphere, not enough to compete with page content.
  const fogDark = 'rgba(6,6,14,0.7)';
  const fogLight = 'rgba(245,244,238,0.7)';
  const edge = archetypeColor
    ? `color-mix(in srgb, ${archetypeColor} ${dark ? 22 : 14}%, ${dark ? fogDark : fogLight})`
    : dark
      ? fogDark
      : fogLight;

  return (
    <div
      aria-hidden="true"
      data-archetype={archetypeColor || ''}
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 0,
        overflow: 'hidden',
        display: 'grid',
        placeItems: 'center',
      }}
    >
      <div
        style={{
          position: 'absolute',
          width: 'min(120vmin, 900px)',
          height: 'min(120vmin, 900px)',
          color: dark ? '#7eb5ff' : '#4a4a58',
          animation: 'engramRotate 360s linear infinite',
          transformOrigin: 'center',
          opacity: dark ? 0.08 : 0.04,
        }}
      >
        <FlowerOfLife size="100%" rings={3} strokeWidth={0.22} opacity={1} />
      </div>

      <div
        style={{
          position: 'absolute',
          width: 'min(80vmin, 600px)',
          height: 'min(80vmin, 600px)',
          color: dark ? '#b197fc' : '#7c3aed',
          animation: 'engramRotate 240s linear infinite reverse',
          transformOrigin: 'center',
          opacity: dark ? 0.07 : 0.03,
        }}
      >
        <MetatronsCube size="100%" strokeWidth={0.25} opacity={1} />
      </div>

      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(circle at center, transparent ${dark ? 35 : 40}%, ${edge} 100%)`,
        }}
      />
    </div>
  );
}
