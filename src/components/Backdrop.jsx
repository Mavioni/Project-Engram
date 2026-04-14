// ─────────────────────────────────────────────────────────────
// <Backdrop /> — the persistent ambient layer behind the app.
// ─────────────────────────────────────────────────────────────
// A single fixed-position SVG layer rendered once, sitting below
// every screen. It shows an enormous Flower of Life + Metatron's
// Cube composition at ~0.05 opacity that rotates once every ~4
// minutes. On most pages you don't see it consciously — you just
// feel that the background "holds" the content.
//
// Performance:
//   - position: fixed, inset: 0, pointer-events: none (never
//     intercepts clicks)
//   - one SVG, ~40 elements total (tiny DOM cost)
//   - CSS animation uses transform, runs on the compositor
//   - aria-hidden (pure decoration)
// ─────────────────────────────────────────────────────────────

import { FlowerOfLife, MetatronsCube } from './SacredGeometry.jsx';

export default function Backdrop() {
  return (
    <div
      aria-hidden="true"
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
      {/* Outer layer — slow, big, very faint */}
      <div
        style={{
          position: 'absolute',
          width: 'min(120vmin, 900px)',
          height: 'min(120vmin, 900px)',
          color: '#7eb5ff',
          animation: 'engramRotate 360s linear infinite',
          transformOrigin: 'center',
          opacity: 0.08,
        }}
      >
        <FlowerOfLife size="100%" rings={3} strokeWidth={0.22} opacity={1} />
      </div>

      {/* Middle layer — slightly smaller, counter-rotating */}
      <div
        style={{
          position: 'absolute',
          width: 'min(80vmin, 600px)',
          height: 'min(80vmin, 600px)',
          color: '#b197fc',
          animation: 'engramRotate 240s linear infinite reverse',
          transformOrigin: 'center',
          opacity: 0.07,
        }}
      >
        <MetatronsCube size="100%" strokeWidth={0.25} opacity={1} />
      </div>

      {/* Film-grain vignette on top to darken edges */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(circle at center, transparent 35%, rgba(6,6,14,0.7) 100%)',
        }}
      />
    </div>
  );
}
