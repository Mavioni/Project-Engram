// ─────────────────────────────────────────────────────────────
// SacredGeometry — hand-built, precise SVG primitives used
// throughout Engram as contemplative illustration.
// ─────────────────────────────────────────────────────────────
//
// Design principles:
//   1. **Geometrically exact.** No eyeballing — every point is
//      computed from ratios. Sacred geometry is about precision.
//   2. **Subtle by default.** Stroke widths are thin, default
//      opacity is low. These are in service of content, not
//      competing with it.
//   3. **Slow, barely-perceptible animation.** Most glyphs
//      rotate once every 60–240 seconds. The eye doesn't catch
//      motion, but the page feels alive.
//   4. **No external deps.** Pure SVG + CSS keyframes.
//
// All components accept: size, color, opacity, strokeWidth, spin.
// `spin` is the period in seconds (0 = no rotation).
// `color` defaults to currentColor so callers can recolor via
// CSS `color` on a wrapping element.
// ─────────────────────────────────────────────────────────────

const TAU = Math.PI * 2;
const polar = (r, theta) => [r * Math.cos(theta), r * Math.sin(theta)];
const fmt = (n) => Math.round(n * 1000) / 1000;

// ─── Base rotating wrapper ────────────────────────────────────
function Rotating({ children, spin, reverse }) {
  if (!spin) return <g>{children}</g>;
  const dir = reverse ? '-' : '';
  return (
    <g
      style={{
        animation: `engramRotate ${spin}s linear infinite ${dir === '-' ? 'reverse' : ''}`,
        transformOrigin: 'center',
      }}
    >
      {children}
    </g>
  );
}

// ─── Sigil: container with a rotating outer ring ─────────────
// Wraps arbitrary children (usually another glyph or an emoji)
// inside a subtle, slowly-rotating circular frame. The
// workhorse of the UI — used around today's mood, around the
// Enneagram number on /you, etc.
export function Sigil({
  size = 120,
  color = 'currentColor',
  opacity = 0.35,
  children,
  spin = 120,
  rings = 3,
}) {
  const r = 48;
  return (
    <div
      style={{
        width: size,
        height: size,
        display: 'grid',
        placeItems: 'center',
        position: 'relative',
      }}
    >
      <svg
        viewBox="-50 -50 100 100"
        width={size}
        height={size}
        style={{ position: 'absolute', inset: 0, color, opacity }}
        aria-hidden="true"
      >
        <Rotating spin={spin}>
          {/* Outermost solid ring */}
          <circle cx="0" cy="0" r={r} fill="none" stroke="currentColor" strokeWidth="0.35" />
          {/* Inner dashed ring */}
          {rings >= 2 && (
            <circle
              cx="0"
              cy="0"
              r={r - 3}
              fill="none"
              stroke="currentColor"
              strokeWidth="0.2"
              strokeDasharray="0.6 2.4"
            />
          )}
          {/* 12 radial tick marks */}
          {rings >= 3 &&
            Array.from({ length: 12 }, (_, i) => {
              const theta = (i / 12) * TAU;
              const [x1, y1] = polar(r - 6, theta);
              const [x2, y2] = polar(r - 1.5, theta);
              return (
                <line
                  key={i}
                  x1={fmt(x1)}
                  y1={fmt(y1)}
                  x2={fmt(x2)}
                  y2={fmt(y2)}
                  stroke="currentColor"
                  strokeWidth="0.22"
                  strokeLinecap="round"
                />
              );
            })}
        </Rotating>
      </svg>
      <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
    </div>
  );
}

// ─── Seed of Life ─────────────────────────────────────────────
// 7 circles — 1 central + 6 at 60° intervals, each intersecting
// the neighbors and the center. The core of the Flower of Life.
export function SeedOfLife({
  size = 140,
  color = 'currentColor',
  opacity = 0.28,
  strokeWidth = 0.4,
  spin = 0,
}) {
  const r = 18;
  const centers = [
    [0, 0],
    ...Array.from({ length: 6 }, (_, i) => polar(r, (i / 6) * TAU)),
  ];
  return (
    <svg
      viewBox="-50 -50 100 100"
      width={size}
      height={size}
      style={{ color, opacity, display: 'block' }}
      aria-hidden="true"
    >
      <Rotating spin={spin}>
        {centers.map(([cx, cy], i) => (
          <circle
            key={i}
            cx={fmt(cx)}
            cy={fmt(cy)}
            r={r}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
          />
        ))}
      </Rotating>
    </svg>
  );
}

// ─── Flower of Life ──────────────────────────────────────────
// 19 circles: Seed of Life (7) + 12 outer circles forming the
// complete pattern. The most recognizable sacred-geometry figure.
export function FlowerOfLife({
  size = 180,
  color = 'currentColor',
  opacity = 0.2,
  strokeWidth = 0.35,
  spin = 0,
  rings = 2,
}) {
  const r = 12;
  // Build by tracing a hex grid out to `rings` rings from center.
  const centers = new Set();
  const add = (x, y) => centers.add(`${fmt(x)},${fmt(y)}`);
  add(0, 0);
  for (let ring = 1; ring <= rings; ring++) {
    for (let i = 0; i < 6; i++) {
      const [cx, cy] = polar(ring * r, (i / 6) * TAU + Math.PI / 6);
      add(cx, cy);
      // Interstitial circles along each edge of the hex ring
      if (ring > 1) {
        for (let k = 1; k < ring; k++) {
          const next = (i + 1) % 6;
          const [nx, ny] = polar(ring * r, (next / 6) * TAU + Math.PI / 6);
          add(cx + (nx - cx) * (k / ring), cy + (ny - cy) * (k / ring));
        }
      }
    }
  }
  return (
    <svg
      viewBox="-50 -50 100 100"
      width={size}
      height={size}
      style={{ color, opacity, display: 'block' }}
      aria-hidden="true"
    >
      <Rotating spin={spin}>
        {[...centers].map((key, i) => {
          const [cx, cy] = key.split(',').map(Number);
          return (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke="currentColor"
              strokeWidth={strokeWidth}
            />
          );
        })}
      </Rotating>
    </svg>
  );
}

// ─── Vesica Piscis ───────────────────────────────────────────
// Two circles of equal radius whose centers lie on each other's
// circumference. The "womb" of sacred geometry.
export function VesicaPiscis({
  size = 120,
  color = 'currentColor',
  opacity = 0.32,
  strokeWidth = 0.5,
  spin = 0,
}) {
  const r = 25;
  return (
    <svg
      viewBox="-50 -50 100 100"
      width={size}
      height={size}
      style={{ color, opacity, display: 'block' }}
      aria-hidden="true"
    >
      <Rotating spin={spin}>
        <circle cx={-r / 2} cy="0" r={r} fill="none" stroke="currentColor" strokeWidth={strokeWidth} />
        <circle cx={r / 2} cy="0" r={r} fill="none" stroke="currentColor" strokeWidth={strokeWidth} />
      </Rotating>
    </svg>
  );
}

// ─── Metatron's Cube ─────────────────────────────────────────
// 13 circles (the "Fruit of Life") connected by every possible
// line between centers — the containing form of every Platonic
// solid in 2D projection.
export function MetatronsCube({
  size = 200,
  color = 'currentColor',
  opacity = 0.22,
  strokeWidth = 0.3,
  spin = 0,
  showCircles = true,
}) {
  const r = 7;
  const d = 16; // center-to-center
  const centers = [
    [0, 0],
    // Inner hexagon
    ...Array.from({ length: 6 }, (_, i) => polar(d, (i / 6) * TAU + Math.PI / 6)),
    // Outer hexagon
    ...Array.from({ length: 6 }, (_, i) => polar(2 * d, (i / 6) * TAU + Math.PI / 6)),
  ];
  return (
    <svg
      viewBox="-50 -50 100 100"
      width={size}
      height={size}
      style={{ color, opacity, display: 'block' }}
      aria-hidden="true"
    >
      <Rotating spin={spin}>
        {/* Connect every pair of centers with a thin line */}
        {centers.map((a, i) =>
          centers.slice(i + 1).map(([bx, by], j) => (
            <line
              key={`${i}-${j}`}
              x1={fmt(a[0])}
              y1={fmt(a[1])}
              x2={fmt(bx)}
              y2={fmt(by)}
              stroke="currentColor"
              strokeWidth={strokeWidth * 0.7}
              opacity="0.5"
            />
          )),
        )}
        {/* The 13 circles on top */}
        {showCircles &&
          centers.map(([cx, cy], i) => (
            <circle
              key={i}
              cx={fmt(cx)}
              cy={fmt(cy)}
              r={r}
              fill="none"
              stroke="currentColor"
              strokeWidth={strokeWidth}
            />
          ))}
      </Rotating>
    </svg>
  );
}

// ─── Enneagram Glyph ─────────────────────────────────────────
// 9 points on a circle with the classic inner connection path
// (1→4→2→8→5→7→1) + equilateral triangle (3-6-9). Ties directly
// to the IRIS Enneagram output.
export function EnneagramGlyph({
  size = 140,
  color = 'currentColor',
  opacity = 0.4,
  strokeWidth = 0.5,
  highlightType = null,
  showNumbers = false,
  spin = 0,
}) {
  const r = 40;
  // Points are placed clockwise starting from the top (9 at top)
  const pts = Array.from({ length: 9 }, (_, i) => {
    const theta = -Math.PI / 2 + ((i + 1) / 9) * TAU;
    return polar(r, theta);
  });
  // Enneagram type numbering: index 0 is type 1, index 8 is type 9
  const byType = (t) => pts[(t - 1) % 9];
  const hex = ['M', byType(1), 'L', byType(4), byType(2), byType(8), byType(5), byType(7), byType(1)]
    .map((p) => (typeof p === 'string' ? p : `${fmt(p[0])},${fmt(p[1])}`))
    .join(' ');
  const tri = ['M', byType(3), 'L', byType(6), byType(9), byType(3)]
    .map((p) => (typeof p === 'string' ? p : `${fmt(p[0])},${fmt(p[1])}`))
    .join(' ');

  return (
    <svg
      viewBox="-50 -50 100 100"
      width={size}
      height={size}
      style={{ color, opacity, display: 'block' }}
      aria-hidden="true"
    >
      <Rotating spin={spin}>
        {/* Outer circle */}
        <circle cx="0" cy="0" r={r} fill="none" stroke="currentColor" strokeWidth={strokeWidth * 0.8} />
        {/* Inner hexagram path */}
        <path d={hex} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinejoin="round" />
        {/* Triangle 3-6-9 */}
        <path d={tri} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinejoin="round" />
        {/* Points */}
        {pts.map(([x, y], i) => {
          const type = i + 1;
          const isHighlight = highlightType === type;
          return (
            <g key={i}>
              <circle
                cx={fmt(x)}
                cy={fmt(y)}
                r={isHighlight ? 2.4 : 1.4}
                fill="currentColor"
                opacity={isHighlight ? 1 : 0.8}
              />
              {showNumbers && (
                <text
                  x={fmt(x * 1.18)}
                  y={fmt(y * 1.18 + 2)}
                  textAnchor="middle"
                  fontSize="5"
                  fontFamily="DM Mono, monospace"
                  fill="currentColor"
                  opacity={isHighlight ? 1 : 0.55}
                >
                  {type}
                </text>
              )}
            </g>
          );
        })}
      </Rotating>
    </svg>
  );
}

// ─── Merkaba (Star Tetrahedron, 2D) ──────────────────────────
// Two interlocking equilateral triangles — the 2D shadow of
// two interpenetrating tetrahedra.
export function Merkaba({
  size = 140,
  color = 'currentColor',
  opacity = 0.35,
  strokeWidth = 0.5,
  spin = 0,
}) {
  const r = 38;
  const up = Array.from({ length: 3 }, (_, i) => polar(r, -Math.PI / 2 + (i / 3) * TAU));
  const down = Array.from({ length: 3 }, (_, i) => polar(r, Math.PI / 2 + (i / 3) * TAU));
  const toPath = (arr) =>
    ['M', ...arr, arr[0], 'Z']
      .map((p) => (typeof p === 'string' ? p : `${fmt(p[0])},${fmt(p[1])}`))
      .join(' ')
      .replace(/([0-9]),([A-Z])/g, '$1 $2')
      .replace('M ', 'M')
      .replace('Z M', 'Z L')
      .replace(/([A-Z])([0-9])/g, '$1 $2');
  // Simpler: write both triangles by hand
  const upPath = `M ${fmt(up[0][0])} ${fmt(up[0][1])} L ${fmt(up[1][0])} ${fmt(up[1][1])} L ${fmt(up[2][0])} ${fmt(up[2][1])} Z`;
  const downPath = `M ${fmt(down[0][0])} ${fmt(down[0][1])} L ${fmt(down[1][0])} ${fmt(down[1][1])} L ${fmt(down[2][0])} ${fmt(down[2][1])} Z`;
  return (
    <svg
      viewBox="-50 -50 100 100"
      width={size}
      height={size}
      style={{ color, opacity, display: 'block' }}
      aria-hidden="true"
    >
      <Rotating spin={spin}>
        <path d={upPath} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinejoin="round" />
        <path d={downPath} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinejoin="round" />
        <circle cx="0" cy="0" r={r} fill="none" stroke="currentColor" strokeWidth={strokeWidth * 0.5} opacity="0.5" />
      </Rotating>
    </svg>
  );
}

// ─── Sri Yantra (simplified) ────────────────────────────────
// 4 upward + 5 downward interlocking triangles inside concentric
// circles. This is a simplified rendering — the full Sri Yantra
// has precise ratios that take careful construction.
export function SriYantra({
  size = 160,
  color = 'currentColor',
  opacity = 0.3,
  strokeWidth = 0.4,
  spin = 0,
}) {
  const sizes = [42, 36, 30, 24, 18, 14, 10, 6, 3];
  return (
    <svg
      viewBox="-50 -50 100 100"
      width={size}
      height={size}
      style={{ color, opacity, display: 'block' }}
      aria-hidden="true"
    >
      <Rotating spin={spin}>
        <circle cx="0" cy="0" r="46" fill="none" stroke="currentColor" strokeWidth={strokeWidth * 0.6} />
        {sizes.map((s, idx) => {
          const flip = idx % 2 === 0;
          const pts = [0, 1, 2].map((i) => polar(s, (flip ? -Math.PI / 2 : Math.PI / 2) + (i / 3) * TAU));
          const d = `M ${fmt(pts[0][0])} ${fmt(pts[0][1])} L ${fmt(pts[1][0])} ${fmt(pts[1][1])} L ${fmt(pts[2][0])} ${fmt(pts[2][1])} Z`;
          return (
            <path
              key={idx}
              d={d}
              fill="none"
              stroke="currentColor"
              strokeWidth={strokeWidth}
              opacity={0.5 + (idx / sizes.length) * 0.5}
            />
          );
        })}
        <circle cx="0" cy="0" r="1.5" fill="currentColor" />
      </Rotating>
    </svg>
  );
}

// ─── Ornamental Divider ──────────────────────────────────────
// A replacement for the flat .divider class. Two gradient lines
// flanking a small rotating glyph.
export function Divider({
  color = 'currentColor',
  opacity = 0.4,
  glyph = 'vesica',
  glyphSize = 28,
  margin = '28px 0',
}) {
  const Glyph =
    {
      vesica: VesicaPiscis,
      seed: SeedOfLife,
      merkaba: Merkaba,
      enneagram: EnneagramGlyph,
    }[glyph] || VesicaPiscis;

  return (
    <div
      aria-hidden="true"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        margin,
        color,
        opacity,
      }}
    >
      <div
        style={{
          flex: 1,
          height: 1,
          background: 'linear-gradient(90deg, transparent, currentColor)',
          opacity: 0.5,
        }}
      />
      <Glyph size={glyphSize} color="currentColor" opacity={1} spin={240} strokeWidth={0.6} />
      <div
        style={{
          flex: 1,
          height: 1,
          background: 'linear-gradient(90deg, currentColor, transparent)',
          opacity: 0.5,
        }}
      />
    </div>
  );
}

// ─── Golden Spiral ───────────────────────────────────────────
// Logarithmic spiral based on the golden ratio, rendered as a
// path. Used as a subtle corner ornament on some cards.
export function GoldenSpiral({
  size = 120,
  color = 'currentColor',
  opacity = 0.3,
  strokeWidth = 0.5,
  spin = 0,
  turns = 3,
}) {
  const phi = 1.618033988749;
  const points = [];
  const steps = 240;
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * turns * TAU;
    const r = 0.5 * Math.pow(phi, t / (Math.PI / 2));
    points.push(polar(r, t));
  }
  // Normalize so it fits -40..40
  const max = Math.max(...points.flat().map(Math.abs));
  const scale = 40 / max;
  const d =
    'M ' +
    points.map(([x, y]) => `${fmt(x * scale)} ${fmt(y * scale)}`).join(' L ');
  return (
    <svg
      viewBox="-50 -50 100 100"
      width={size}
      height={size}
      style={{ color, opacity, display: 'block' }}
      aria-hidden="true"
    >
      <Rotating spin={spin}>
        <path d={d} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
      </Rotating>
    </svg>
  );
}
