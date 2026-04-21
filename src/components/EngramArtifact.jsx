/* eslint-disable react/no-unknown-property */
// react/no-unknown-property fires on every R3F intrinsic (meshStandardMaterial,
// pointLight, bufferGeometry, sizeAttenuation, etc.) because the rule only
// knows the DOM/SVG property set. R3F's scene graph elements are first-class
// inside a <Canvas>; the rule is a false positive here.
// ─────────────────────────────────────────────────────────────
// <EngramArtifact /> — the living 3D artifactual representation
// of the user's consciousness, rendered at the top of the Player
// Card.
// ─────────────────────────────────────────────────────────────
// Every dot, line, and particle is mapped to the user's data:
//
//   24 anchor points       ← IRIS facet scores (Fibonacci-sphere
//                             distribution; radius = f(score))
//   point colour           ← domain colour of the owning facet
//   edges within domains   ← structural skeleton (4 facets / domain)
//   cross-domain ring      ← the Fibonacci spiral, seeded by
//                             enneagram type (9 distinct phase offsets)
//   particle field density ← journal entries + ritual completions
//   particle field hue     ← recent mood (OKLCH, perceptually uniform)
//   particle drift speed   ← XP-derived level (floor(sqrt(xp/100))+1)
//   facet pulse brightness ← recent battle wins in that domain
//
// Pure procedural — nothing is authored, everything is derived.
// Runs at 60 fps on a mid-range phone (≤24 anchors + ~120 particles).
// ─────────────────────────────────────────────────────────────

import { Suspense, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { DOMAINS } from '../data/enneagram.js';
import { useStore } from '../lib/store.js';

// Facet → domain index map (same order as DOMAINS[].facets concat).
const FACETS = DOMAINS.flatMap((d, di) =>
  d.facets.map((name) => ({ name, domain: di })),
);
const FACET_COUNT = FACETS.length; // 24

/**
 * Fibonacci-sphere sampling: gives visually-even coverage at any count.
 * Deterministic — facet index → fixed sphere position — so the skeleton
 * only moves when the score changes, never just because.
 */
function fibonacciSpherePoint(i, n, phaseOffset = 0) {
  const golden = Math.PI * (3 - Math.sqrt(5));
  const y = 1 - (i / (n - 1)) * 2; // [-1, 1]
  const r = Math.sqrt(1 - y * y);
  const theta = golden * i + phaseOffset;
  return [Math.cos(theta) * r, y, Math.sin(theta) * r];
}

/**
 * OKLCH → RGB conversion via a compact reference implementation so
 * mood colour shifts are perceptually uniform. Happy-dom doesn't have
 * CSS.supports('color', 'oklch(...)') so we can't offload to the
 * browser; this is ~20 lines and runs once per render.
 */
function oklchToRgb(L, C, H) {
  const hRad = (H * Math.PI) / 180;
  const a = C * Math.cos(hRad);
  const b = C * Math.sin(hRad);
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;
  const l = l_ ** 3;
  const m = m_ ** 3;
  const s = s_ ** 3;
  const r = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const b2 = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;
  return [r, g, b2].map((v) => Math.min(1, Math.max(0, v)));
}

/**
 * Mood score (0..4) → OKLCH triple. Lower mood = cooler/darker,
 * higher mood = warmer/brighter. Hue sweeps 240° (cyan) → 40° (amber)
 * across the five-emoji scale.
 */
function moodToOklch(score, fallback = 2) {
  const m = typeof score === 'number' ? score : fallback;
  const t = Math.max(0, Math.min(4, m)) / 4; // 0..1
  const L = 0.55 + t * 0.2;
  const C = 0.1 + t * 0.08;
  const H = 240 - t * 200; // 240→40
  return oklchToRgb(L, C, H);
}

/**
 * Anchor — a facet's vertex in 3D space. Opacity/emissive intensity
 * encodes recent activity on that domain (battles won, check-ins).
 */
function Anchor({ position, color, score, pulse }) {
  const mesh = useRef();
  useFrame((state) => {
    if (!mesh.current) return;
    // Breathe gently; pulse harder when the domain has recent wins.
    const t = state.clock.getElapsedTime();
    const breath = 1 + Math.sin(t * 1.2 + position[0] * 3) * 0.05;
    const boost = 1 + pulse * 0.3 * Math.abs(Math.sin(t * 2.5));
    mesh.current.scale.setScalar((0.012 + score * 0.028) * breath * boost);
  });
  return (
    <mesh ref={mesh} position={position}>
      <sphereGeometry args={[1, 12, 12]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.4 + pulse * 0.6}
        toneMapped={false}
      />
    </mesh>
  );
}

/**
 * Edges — structural skeleton. Within-domain edges connect the four
 * facets of each domain into a tetrahedron. A thin Fibonacci spiral
 * threads all 24 anchors in order to hint at the full shape.
 */
function Skeleton({ anchors, enneagramType }) {
  const { domainLines, spiralLine } = useMemo(() => {
    // Within-domain edges: 4 facets form 6 pairs per domain.
    const byDomain = new Map();
    anchors.forEach((a, i) => {
      if (!byDomain.has(a.domain)) byDomain.set(a.domain, []);
      byDomain.get(a.domain).push(i);
    });
    const dl = [];
    byDomain.forEach((indices, domain) => {
      for (let i = 0; i < indices.length; i += 1) {
        for (let j = i + 1; j < indices.length; j += 1) {
          dl.push({
            a: anchors[indices[i]].pos,
            b: anchors[indices[j]].pos,
            color: DOMAINS[domain].color,
            strength: (anchors[indices[i]].score + anchors[indices[j]].score) / 2,
          });
        }
      }
    });
    // Fibonacci spiral: enneagram type shifts the phase so each
    // archetype reads as a distinct curve wrapping the skeleton.
    const spiralPositions = [];
    const phase = ((enneagramType || 1) - 1) * ((2 * Math.PI) / 9);
    for (let i = 0; i < FACET_COUNT; i += 1) {
      spiralPositions.push(
        ...fibonacciSpherePoint(i, FACET_COUNT, phase).map((v) => v * 0.72),
      );
    }
    return {
      domainLines: dl,
      spiralLine: new Float32Array(spiralPositions),
    };
  }, [anchors, enneagramType]);

  return (
    <group>
      {domainLines.map((ln, i) => (
        <EdgeLine key={i} from={ln.a} to={ln.b} color={ln.color} opacity={0.25 + ln.strength * 0.55} />
      ))}
      {/* Spiral thread — lineBasicMaterial on a bufferGeometry */}
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={FACET_COUNT}
            array={spiralLine}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#ffffff" transparent opacity={0.12} />
      </line>
    </group>
  );
}

function EdgeLine({ from, to, color, opacity }) {
  const positions = useMemo(
    () => new Float32Array([...from, ...to]),
    [from, to],
  );
  return (
    <line>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={2}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <lineBasicMaterial color={color} transparent opacity={opacity} />
    </line>
  );
}

/**
 * Particle field — cloud of points around the skeleton. Count encodes
 * total user activity (journal entries + rituals), hue encodes recent
 * mood. Drifts slowly; faster for higher levels.
 */
function Particles({ count, hue, driftSpeed }) {
  const ref = useRef();
  const { positions, speeds } = useMemo(() => {
    const n = Math.max(24, Math.min(240, count));
    const p = new Float32Array(n * 3);
    const s = new Float32Array(n);
    // Seeded PRNG (mulberry32) so particle positions are reproducible
    // per-count — also keeps this useMemo pure per the react-hooks
    // purity rule. Seed derives from count so fields of different
    // sizes don't collide visually.
    let seed = 0x9e3779b9 ^ (n * 0x85ebca77);
    const rand = () => {
      seed |= 0;
      seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    for (let i = 0; i < n; i += 1) {
      const r = 1.3 + rand() * 0.6;
      const theta = rand() * Math.PI * 2;
      const phi = Math.acos(2 * rand() - 1);
      p[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      p[i * 3 + 1] = r * Math.cos(phi);
      p[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
      s[i] = 0.5 + rand() * 1.5;
    }
    return { positions: p, speeds: s };
  }, [count]);

  useFrame((state, delta) => {
    if (!ref.current) return;
    const pos = ref.current.geometry.attributes.position.array;
    const t = state.clock.getElapsedTime();
    for (let i = 0; i < pos.length / 3; i += 1) {
      const si = speeds[i] * driftSpeed;
      pos[i * 3] += Math.sin(t * si + i) * delta * 0.015;
      pos[i * 3 + 1] += Math.cos(t * si * 0.7 + i) * delta * 0.012;
    }
    ref.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        color={new THREE.Color(hue[0], hue[1], hue[2])}
        size={0.02}
        transparent
        opacity={0.7}
        sizeAttenuation
        toneMapped={false}
      />
    </points>
  );
}

/**
 * Scene root — auto-rotate, ambient lighting, composition.
 */
function Scene({ anchors, enneagramType, particleCount, moodHue, driftSpeed, level }) {
  const group = useRef();
  useFrame((state, delta) => {
    if (!group.current) return;
    group.current.rotation.y += delta * 0.08;
    // Subtle level-driven scale breath.
    const t = state.clock.getElapsedTime();
    const s = 1 + Math.sin(t * 0.6) * 0.02 + level * 0.004;
    group.current.scale.setScalar(s);
  });
  return (
    <>
      <ambientLight intensity={0.45} />
      <pointLight position={[3, 3, 3]} intensity={0.7} />
      <group ref={group} rotation={[0.25, 0, 0]}>
        <Skeleton anchors={anchors} enneagramType={enneagramType} />
        {anchors.map((a, i) => (
          <Anchor
            key={i}
            position={a.pos}
            color={a.color}
            score={a.score}
            pulse={a.pulse}
          />
        ))}
        <Particles count={particleCount} hue={moodHue} driftSpeed={driftSpeed} />
      </group>
    </>
  );
}

/**
 * Derive all the encoding inputs from the store in one memoised pass.
 * This is the single place that knows how data → artifact geometry.
 */
function useEngramEncoding() {
  const iris = useStore((s) => s.iris);
  const engram = useStore((s) => s.engram);
  const entries = useStore((s) => s.entries);
  const rituals = useStore((s) => s.rituals);

  return useMemo(() => {
    const facetScores = iris?.facetScores || {};
    const enneagramType = iris?.enneagramType || 1;

    // Domain-level recent-win pulse: +1 for each winning-round the
    // user took in that domain across the recent battle history.
    const domainPulse = new Array(DOMAINS.length).fill(0);
    const history = engram?.battleHistory || [];
    history.slice(0, 10).forEach((b) => {
      (b.rounds || []).forEach((r) => {
        if (r.winner === 'user') {
          const di = DOMAINS.findIndex((d) => d.id === r.domain);
          if (di >= 0) domainPulse[di] += 1;
        }
      });
    });
    const maxPulse = Math.max(1, ...domainPulse);
    const normPulse = domainPulse.map((p) => p / maxPulse);

    const anchors = FACETS.map(({ name, domain }, i) => ({
      pos: fibonacciSpherePoint(i, FACET_COUNT, 0),
      color: DOMAINS[domain].color,
      score: typeof facetScores[name] === 'number' ? facetScores[name] : 0.5,
      pulse: normPulse[domain],
      domain,
    }));

    // Activity volume → particle count.
    const entryCount = (entries || []).length;
    const ritualCount = (rituals?.last30 || []).length;
    const particleCount = Math.min(220, 40 + entryCount * 2 + ritualCount * 4);

    // Recent mood → hue. Average the last 7 entries' mood scores.
    const recent = (entries || []).slice(0, 7);
    const moodScore =
      recent.length > 0
        ? recent.reduce((a, e) => a + (e.mood ?? 2), 0) / recent.length
        : 2;
    const moodHue = moodToOklch(moodScore, 2);

    // Level from XP (replicated formula — no import cycle).
    const level = Math.floor(Math.sqrt((engram?.xp || 0) / 100)) + 1;
    const driftSpeed = 0.6 + Math.min(1.4, level * 0.1);

    return { anchors, enneagramType, particleCount, moodHue, driftSpeed, level };
  }, [iris, engram, entries, rituals]);
}

/**
 * Fallback when WebGL is unavailable (happy-dom, very old browsers).
 * A static CSS-only rendition so the card still has a hero region.
 */
function Fallback({ accentColor }) {
  return (
    <div
      role="img"
      aria-label="Engram artifact (static fallback)"
      style={{
        width: '100%',
        aspectRatio: '16 / 10',
        background: `radial-gradient(circle at 50% 55%, color-mix(in srgb, ${accentColor} 35%, transparent) 0%, transparent 65%)`,
        display: 'grid',
        placeItems: 'center',
      }}
    >
      <div
        className="mono"
        style={{
          fontSize: 9,
          letterSpacing: '0.3em',
          textTransform: 'uppercase',
          color: 'var(--ink-dim)',
        }}
      >
        engram
      </div>
    </div>
  );
}

/**
 * Public component. Renders inside a fixed-aspect wrapper at the top
 * of the Player Card. Returns null when IRIS hasn't been run yet —
 * upstream <PlayerCard /> already early-returns in that case, but
 * we double-check so this stays safe in isolation.
 */
export default function EngramArtifact({ accentColor = '#7eb5ff' }) {
  const iris = useStore((s) => s.iris);
  const encoding = useEngramEncoding();

  if (!iris?.facetScores) return <Fallback accentColor={accentColor} />;

  // Detect WebGL once at mount. Avoid a Canvas error boundary cascade
  // in test env where WebGL isn't wired up.
  const hasWebGL = typeof window !== 'undefined' &&
    !!(window.WebGLRenderingContext || window.WebGL2RenderingContext) &&
    (() => {
      try {
        const c = document.createElement('canvas');
        return !!(c.getContext('webgl2') || c.getContext('webgl'));
      } catch {
        return false;
      }
    })();

  if (!hasWebGL) return <Fallback accentColor={accentColor} />;

  return (
    <div
      role="img"
      aria-label="Your engram — a living 3D representation of your consciousness"
      style={{
        width: '100%',
        aspectRatio: '16 / 10',
        position: 'relative',
        borderRadius: 12,
        overflow: 'hidden',
        background: `radial-gradient(circle at 50% 55%, color-mix(in srgb, ${accentColor} 18%, transparent) 0%, transparent 70%)`,
      }}
    >
      <Canvas
        camera={{ position: [0, 0.4, 3.2], fov: 45 }}
        dpr={[1, 2]}
        frameloop="always"
      >
        <Suspense fallback={null}>
          <Scene {...encoding} />
        </Suspense>
      </Canvas>
    </div>
  );
}
