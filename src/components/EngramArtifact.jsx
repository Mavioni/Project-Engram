/* eslint-disable react/no-unknown-property */
// react/no-unknown-property fires on every R3F intrinsic
// (meshStandardMaterial, pointLight, bufferGeometry, etc.) because
// the rule only knows the DOM/SVG property set. R3F's scene-graph
// elements are first-class inside a <Canvas>; the rule is a false
// positive here.
// ─────────────────────────────────────────────────────────────
// <EngramArtifact /> — the living 3D representation of the user's
// consciousness. An orb. Iris-like. 24 luminous strands radiate
// from a single pupil at the centre.
// ─────────────────────────────────────────────────────────────
// VISUAL METAPHOR
//
//   Pupil (centre)            ← single point of self
//   24 radial strands         ← IRIS facets, each a fibre
//   strand length             ← facet score (high score = long)
//   strand colour             ← owning domain's colour
//   strand glow intensity     ← recent battle wins in that domain
//   outer iris ring           ← enneagram type phase (spun wire)
//   containing sphere (glass) ← the outer shell of the orb
//   particle dust inside      ← journal + ritual volume
//   dust hue                  ← trailing-7d mood (OKLCH uniform)
//   dust drift speed          ← XP-derived level
//   slow rotation on Y        ← the orb is alive
//
// Nothing authored. Everything encoded. Every action the user takes
// changes the artifact.
// ─────────────────────────────────────────────────────────────

import { Suspense, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { DOMAINS } from '../data/enneagram.js';
import { useStore } from '../lib/store.js';

// Facets flattened in the canonical DOMAINS order → 24.
const FACETS = DOMAINS.flatMap((d, di) =>
  d.facets.map((name) => ({ name, domain: di })),
);
const FACET_COUNT = FACETS.length; // 24

// Outer sphere radius (local units) — the eyeball's shell.
const SHELL_RADIUS = 1.6;
// Pupil radius.
const CORE_RADIUS = 0.12;
// Max strand length — reserves a gap inside the shell.
const STRAND_REACH = 1.35;

/**
 * Fibonacci-sphere direction for the i-th strand. Gives visually-even
 * coverage for any count. Deterministic per facet index.
 */
function fibonacciDirection(i, n, phaseOffset = 0) {
  const golden = Math.PI * (3 - Math.sqrt(5));
  const y = 1 - (i / (n - 1)) * 2;
  const r = Math.sqrt(1 - y * y);
  const theta = golden * i + phaseOffset;
  return [Math.cos(theta) * r, y, Math.sin(theta) * r];
}

/**
 * OKLCH → linear RGB. Inlined so the hue mapping is identical in the
 * browser and in happy-dom tests (where CSS oklch isn't parseable).
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

function moodToOklch(score) {
  const m = typeof score === 'number' ? score : 2;
  const t = Math.max(0, Math.min(4, m)) / 4;
  const L = 0.58 + t * 0.18;
  const C = 0.1 + t * 0.08;
  const H = 240 - t * 200;
  return oklchToRgb(L, C, H);
}

/**
 * A single radial strand — a cylinder from just outside the pupil
 * out to `length` along direction `dir`. End-capped with a small
 * glowing bead so each facet has a distinct terminus.
 */
function Strand({ direction, length, color, pulse }) {
  const group = useRef();
  const bead = useRef();

  // Orient the cylinder along `direction`. Cylinders default to +Y,
  // so rotate from (0,1,0) to our direction.
  const { position, quaternion, strandLen } = useMemo(() => {
    const dir = new THREE.Vector3(direction[0], direction[1], direction[2]).normalize();
    const outerLen = Math.max(0.15, length);
    const mid = dir.clone().multiplyScalar((CORE_RADIUS + 0.02 + outerLen) / 2);
    const q = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      dir,
    );
    return { position: mid, quaternion: q, strandLen: outerLen };
  }, [direction, length]);

  useFrame((state) => {
    // Breath the strand gently; brighten on pulse.
    const t = state.clock.getElapsedTime();
    const breath = 0.9 + Math.sin(t * 1.2 + direction[0] * 4 + direction[2] * 2) * 0.08;
    if (group.current) {
      group.current.scale.setScalar(breath);
    }
    if (bead.current) {
      const boost = 1 + pulse * 0.5 * Math.abs(Math.sin(t * 2.2));
      bead.current.scale.setScalar(boost);
    }
  });

  const tipPos = useMemo(() => {
    const d = new THREE.Vector3(direction[0], direction[1], direction[2]).normalize();
    return d.multiplyScalar(CORE_RADIUS + 0.02 + strandLen);
  }, [direction, strandLen]);

  return (
    <group ref={group}>
      {/* Fibre */}
      <mesh position={position} quaternion={quaternion}>
        <cylinderGeometry args={[0.005, 0.018, strandLen, 6, 1, true]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.55 + pulse * 0.35}
          toneMapped={false}
        />
      </mesh>
      {/* Tip bead */}
      <mesh ref={bead} position={tipPos}>
        <sphereGeometry args={[0.032, 10, 10]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.9 + pulse * 1.2}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

/**
 * Pupil — dense, dark core at centre. Breathes slowly.
 */
function Pupil({ accent }) {
  const mesh = useRef();
  useFrame((state) => {
    if (!mesh.current) return;
    const t = state.clock.getElapsedTime();
    mesh.current.scale.setScalar(1 + Math.sin(t * 0.8) * 0.04);
  });
  return (
    <mesh ref={mesh}>
      <sphereGeometry args={[CORE_RADIUS, 24, 24]} />
      <meshStandardMaterial
        color="#0a0a10"
        emissive={accent}
        emissiveIntensity={0.35}
        roughness={0.4}
        metalness={0.2}
        toneMapped={false}
      />
    </mesh>
  );
}

/**
 * Outer iris ring — a wire circle tilted by the enneagram type's
 * phase offset. Nine archetypes = nine distinct ring orientations,
 * so type-4 and type-8 read as visually distinct at a glance even
 * at identical facet scores.
 */
function IrisRing({ enneagramType, accent }) {
  const ref = useRef();
  const { geometry, tilt } = useMemo(() => {
    const segs = 128;
    const positions = new Float32Array((segs + 1) * 3);
    const r = SHELL_RADIUS * 0.98;
    for (let i = 0; i <= segs; i += 1) {
      const a = (i / segs) * Math.PI * 2;
      positions[i * 3] = Math.cos(a) * r;
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = Math.sin(a) * r;
    }
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const phase = ((enneagramType || 1) - 1) / 9;
    return {
      geometry: geom,
      tilt: [phase * Math.PI * 0.6, phase * Math.PI * 1.2, phase * Math.PI * 0.4],
    };
  }, [enneagramType]);

  useFrame((_, delta) => {
    if (!ref.current) return;
    ref.current.rotation.y += delta * 0.04;
  });

  return (
    <group ref={ref} rotation={tilt}>
      <line geometry={geometry}>
        <lineBasicMaterial color={accent} transparent opacity={0.22} />
      </line>
    </group>
  );
}

/**
 * Outer glass shell — wireframe icosphere, very subtle, suggests
 * the orb contains something rather than is something.
 */
function Shell() {
  return (
    <mesh>
      <icosahedronGeometry args={[SHELL_RADIUS, 2]} />
      <meshBasicMaterial
        color="#ffffff"
        transparent
        opacity={0.04}
        wireframe
        toneMapped={false}
      />
    </mesh>
  );
}

/**
 * Particle dust inside the shell — the atmosphere of the orb.
 * Count = journal + ritual volume. Hue = recent mood.
 */
function Dust({ count, hue, driftSpeed }) {
  const ref = useRef();
  const { positions, speeds } = useMemo(() => {
    const n = Math.max(40, Math.min(260, count));
    const p = new Float32Array(n * 3);
    const s = new Float32Array(n);
    // Seeded mulberry32 so particle layout is pure (react-hooks/purity).
    let seed = 0x9e3779b9 ^ (n * 0x85ebca77);
    const rand = () => {
      seed |= 0;
      seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    for (let i = 0; i < n; i += 1) {
      // Uniform in a ball of radius just inside the shell.
      const r = (0.3 + rand() * (SHELL_RADIUS - 0.35)) * (0.5 + rand() * 0.5);
      const theta = rand() * Math.PI * 2;
      const phi = Math.acos(2 * rand() - 1);
      p[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      p[i * 3 + 1] = r * Math.cos(phi);
      p[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
      s[i] = 0.4 + rand() * 1.6;
    }
    return { positions: p, speeds: s };
  }, [count]);

  useFrame((state) => {
    if (!ref.current) return;
    const pos = ref.current.geometry.attributes.position.array;
    const t = state.clock.getElapsedTime();
    for (let i = 0; i < pos.length / 3; i += 1) {
      const si = speeds[i] * driftSpeed * 0.01;
      pos[i * 3] += Math.sin(t * speeds[i] + i) * si;
      pos[i * 3 + 1] += Math.cos(t * speeds[i] * 0.8 + i) * si * 0.9;
      pos[i * 3 + 2] += Math.sin(t * speeds[i] * 0.6 + i * 0.3) * si * 0.8;
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
        size={0.025}
        transparent
        opacity={0.55}
        sizeAttenuation
        toneMapped={false}
      />
    </points>
  );
}

/**
 * Scene composer — slow Y rotation gives the orb life without
 * demanding attention. Reduced-motion clients still get the scene,
 * but with autorotate disabled.
 */
function Scene({ strands, enneagramType, particleCount, moodHue, driftSpeed, level, accent, reducedMotion }) {
  const group = useRef();
  useFrame((state, _delta) => {
    if (!group.current) return;
    if (!reducedMotion) {
      group.current.rotation.y += _delta * 0.12;
    }
    const t = state.clock.getElapsedTime();
    const s = 1 + Math.sin(t * 0.5) * 0.015 + level * 0.002;
    group.current.scale.setScalar(s);
  });
  return (
    <>
      <ambientLight intensity={0.6} />
      <pointLight position={[3, 3, 3]} intensity={0.4} color="#ffffff" />
      <pointLight position={[-2, -2, -2]} intensity={0.3} color={accent} />
      <group ref={group}>
        <Pupil accent={accent} />
        {strands.map((s, i) => (
          <Strand
            key={i}
            direction={s.direction}
            length={s.length}
            color={s.color}
            pulse={s.pulse}
          />
        ))}
        <IrisRing enneagramType={enneagramType} accent={accent} />
        <Shell />
        <Dust count={particleCount} hue={moodHue} driftSpeed={driftSpeed} />
      </group>
    </>
  );
}

/**
 * Derive every input the scene needs from the store. Single place
 * where store → geometry mapping lives.
 */
function useEngramEncoding() {
  const iris = useStore((s) => s.iris);
  const engram = useStore((s) => s.engram);
  const entries = useStore((s) => s.entries);
  const rituals = useStore((s) => s.rituals);

  return useMemo(() => {
    const facetScores = iris?.facetScores || {};
    const enneagramType = iris?.enneagramType || 1;

    // Per-domain recent-win pulse.
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

    // One strand per facet. Length scales with the score inside a
    // sensible floor so empty scores still have presence.
    const strands = FACETS.map(({ name, domain }, i) => {
      const score = typeof facetScores[name] === 'number' ? facetScores[name] : 0.5;
      return {
        direction: fibonacciDirection(i, FACET_COUNT, 0),
        length: 0.3 + score * STRAND_REACH,
        color: DOMAINS[domain].color,
        pulse: normPulse[domain],
      };
    });

    const entryCount = (entries || []).length;
    const ritualCount = (rituals?.last30 || []).length;
    const particleCount = Math.min(240, 50 + entryCount * 2 + ritualCount * 4);

    const recent = (entries || []).slice(0, 7);
    const moodScore =
      recent.length > 0
        ? recent.reduce((a, e) => a + (e.mood ?? 2), 0) / recent.length
        : 2;
    const moodHue = moodToOklch(moodScore);

    const level = Math.floor(Math.sqrt((engram?.xp || 0) / 100)) + 1;
    const driftSpeed = 0.6 + Math.min(1.4, level * 0.1);

    return { strands, enneagramType, particleCount, moodHue, driftSpeed, level };
  }, [iris, engram, entries, rituals]);
}

/**
 * CSS-only fallback when WebGL is unavailable (happy-dom, ancient
 * browsers, corporate GPU disable). A quiet concentric orb so the
 * hero region still has presence.
 */
function Fallback({ accentColor }) {
  return (
    <div
      role="img"
      aria-label="Engram artifact (static fallback)"
      style={{
        width: '100%',
        aspectRatio: '16 / 10',
        position: 'relative',
        borderRadius: 12,
        overflow: 'hidden',
        background: `radial-gradient(circle at 50% 55%, color-mix(in srgb, ${accentColor} 35%, transparent) 0%, color-mix(in srgb, ${accentColor} 8%, transparent) 45%, transparent 75%)`,
        display: 'grid',
        placeItems: 'center',
      }}
    >
      <div
        aria-hidden="true"
        style={{
          width: 90,
          height: 90,
          borderRadius: '50%',
          background: `radial-gradient(circle at 50% 50%, color-mix(in srgb, ${accentColor} 50%, transparent), transparent 70%)`,
          border: `1px solid color-mix(in srgb, ${accentColor} 30%, transparent)`,
        }}
      />
    </div>
  );
}

/**
 * Public surface. Mounted at the top of <PlayerCard />. Returns the
 * fallback when IRIS isn't complete or WebGL is unavailable so the
 * hero region never goes empty.
 */
export default function EngramArtifact({ accentColor = '#7eb5ff' }) {
  const iris = useStore((s) => s.iris);
  const encoding = useEngramEncoding();

  if (!iris?.facetScores) return <Fallback accentColor={accentColor} />;

  const hasWebGL =
    typeof window !== 'undefined' &&
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

  const reducedMotion =
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return (
    <div
      role="img"
      aria-label="Your engram — a living 3D orb that represents your consciousness"
      style={{
        width: '100%',
        aspectRatio: '1 / 1',
        maxHeight: 320,
        position: 'relative',
        borderRadius: 12,
        overflow: 'hidden',
        background: `radial-gradient(circle at 50% 55%, color-mix(in srgb, ${accentColor} 22%, transparent) 0%, color-mix(in srgb, ${accentColor} 6%, transparent) 55%, transparent 80%)`,
      }}
    >
      <Canvas
        camera={{ position: [0, 0.2, 3.8], fov: 42 }}
        dpr={[1, 2]}
        frameloop={reducedMotion ? 'demand' : 'always'}
      >
        <Suspense fallback={null}>
          <Scene {...encoding} accent={accentColor} reducedMotion={reducedMotion} />
        </Suspense>
      </Canvas>
    </div>
  );
}
