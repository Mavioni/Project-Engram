/* eslint-disable react/no-unknown-property */
// react/no-unknown-property fires on every R3F intrinsic — the rule
// only knows DOM/SVG. R3F scene-graph elements are first-class inside
// a <Canvas>; disable it file-wide.
// ─────────────────────────────────────────────────────────────
// <EngramArtifact /> — the living 3D orb. Every atom of it is a
// reading of the user's own data.
// ─────────────────────────────────────────────────────────────
//
// WHAT IT IS
//   A personal consciousness instrument. 24 luminous strands
//   radiate from a pupil, threaded by concentric iris rings, held
//   inside a breathing wireframe shell, alive with drifting dust.
//   Neural pulses travel outward along strands at random intervals.
//   Emissive bloom, a starfield backdrop, and orbit controls so
//   the user can inspect it from any angle.
//
// DATA → GEOMETRY (canonical)
//   24 strands            ← IRIS facets; length = score, hue = domain
//   tip beads             ← glowing termini, brightness scales w/ domain wins
//   per-strand phase      ← index-seeded breath offset (no rigid sync)
//   neural pulses         ← one firing every 2-4s, random strand, travels tip-ward
//   pupil breath          ← gentle scale pulse + accent emissive halo
//   multi-ring iris       ← 3 concentric rings, tilts phase-shifted by enneagram type
//   dust particle count   ← journal entries + ritual completions
//   dust hue              ← trailing-7d mood, OKLCH-uniform
//   dust flow speed       ← XP-derived level
//   dust motion           ← toroidal swirl, not random drift
//   starfield             ← depth cue; subtle, never competes
//   bloom                 ← perceptual glow on emissive surfaces
//
// USER AFFORDANCES
//   - Orbit / zoom / auto-rotate
//   - Download as GLB (3D model), PNG (snapshot), or standalone HTML
//     (interactive viewer with data baked in)
// ─────────────────────────────────────────────────────────────

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import { DOMAINS } from '../data/enneagram.js';
import { useStore } from '../lib/store.js';
import { exportEngramGLB, exportEngramPNG, exportEngramHTML } from '../lib/engramExport.js';

const FACETS = DOMAINS.flatMap((d, di) =>
  d.facets.map((name) => ({ name, domain: di })),
);
const FACET_COUNT = FACETS.length; // 24

const SHELL_RADIUS = 1.6;
const CORE_RADIUS = 0.14;
const STRAND_REACH = 1.32;

// ─── Math helpers ──────────────────────────────────────────

function fibonacciDirection(i, n, phaseOffset = 0) {
  const golden = Math.PI * (3 - Math.sqrt(5));
  const y = 1 - (i / (n - 1)) * 2;
  const r = Math.sqrt(1 - y * y);
  const theta = golden * i + phaseOffset;
  return [Math.cos(theta) * r, y, Math.sin(theta) * r];
}

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

// Seeded PRNG so pulse timing is stable per-render — no Math.random()
// inside useMemo (react-hooks/purity) and no mid-frame surprises.
function mulberry32(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ─── Scene components ─────────────────────────────────────

/**
 * A single radial strand — cylinder fibre + tip bead. Each has its own
 * breath phase so the whole set doesn't pulse in unison, and carries a
 * "pulseEnergy" uniform that lights up when a neural firing travels it.
 */
function Strand({ direction, length, color, pulse, phaseSeed, fireRef }) {
  const group = useRef();
  const bead = useRef();
  const fibre = useRef();

  const { position, quaternion, tipPos } = useMemo(() => {
    const dir = new THREE.Vector3(direction[0], direction[1], direction[2]).normalize();
    const outer = Math.max(0.18, length);
    const mid = dir.clone().multiplyScalar((CORE_RADIUS + 0.02 + outer) / 2);
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
    const tip = dir.clone().multiplyScalar(CORE_RADIUS + 0.02 + outer);
    return { position: mid, quaternion: q, tipPos: tip };
  }, [direction, length]);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const breath = 0.92 + Math.sin(t * 1.1 + phaseSeed) * 0.08;
    // Neural firing energy (0..1) maintained by parent via fireRef.
    const energy = fireRef.current?.[phaseSeed % 24] || 0;
    if (group.current) group.current.scale.setScalar(breath);
    if (bead.current) {
      const mat = bead.current.material;
      mat.emissiveIntensity = 0.9 + pulse * 1.1 + energy * 2.5;
      const boost = 1 + (pulse * 0.4 + energy * 0.9) * Math.abs(Math.sin(t * 2.2 + phaseSeed));
      bead.current.scale.setScalar(boost);
    }
    if (fibre.current) {
      fibre.current.material.opacity = 0.55 + pulse * 0.25 + energy * 0.35;
    }
  });

  return (
    <group ref={group}>
      <mesh ref={fibre} position={position} quaternion={quaternion}>
        <cylinderGeometry args={[0.004, 0.02, Math.max(0.18, length), 8, 1, true]} />
        <meshBasicMaterial color={color} transparent opacity={0.6} toneMapped={false} />
      </mesh>
      <mesh ref={bead} position={tipPos}>
        <sphereGeometry args={[0.036, 14, 14]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={1}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

/** Pupil — dense dark core. Breathes. Halo glow in accent. */
function Pupil({ accent }) {
  const core = useRef();
  const halo = useRef();
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (core.current) core.current.scale.setScalar(1 + Math.sin(t * 0.9) * 0.05);
    if (halo.current) {
      halo.current.scale.setScalar(1 + Math.sin(t * 0.5 + 1) * 0.1);
      halo.current.material.opacity = 0.18 + Math.sin(t * 0.7) * 0.05;
    }
  });
  return (
    <group>
      <mesh ref={halo}>
        <sphereGeometry args={[CORE_RADIUS * 1.8, 24, 24]} />
        <meshBasicMaterial color={accent} transparent opacity={0.2} toneMapped={false} />
      </mesh>
      <mesh ref={core}>
        <sphereGeometry args={[CORE_RADIUS, 32, 32]} />
        <meshStandardMaterial
          color="#05050a"
          emissive={accent}
          emissiveIntensity={0.7}
          roughness={0.35}
          metalness={0.25}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

/**
 * Concentric iris rings — three rings at staggered tilts, each
 * rotating at slightly different speeds. Enneagram type seeds the
 * base phase so types 4 and 8 look distinctly different.
 */
function IrisRings({ enneagramType, accent }) {
  const group = useRef();
  const rings = useMemo(() => {
    const phase = ((enneagramType || 1) - 1) / 9;
    const list = [];
    for (let r = 0; r < 3; r += 1) {
      const segs = 128;
      const radius = SHELL_RADIUS * (0.97 - r * 0.02);
      const positions = new Float32Array((segs + 1) * 3);
      for (let i = 0; i <= segs; i += 1) {
        const a = (i / segs) * Math.PI * 2;
        positions[i * 3] = Math.cos(a) * radius;
        positions[i * 3 + 1] = 0;
        positions[i * 3 + 2] = Math.sin(a) * radius;
      }
      const geom = new THREE.BufferGeometry();
      geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      list.push({
        geometry: geom,
        tilt: [
          phase * Math.PI * 0.6 + r * 0.28,
          phase * Math.PI * 1.2 + r * 0.55,
          phase * Math.PI * 0.4 + r * 0.17,
        ],
        speed: 0.03 + r * 0.015,
        opacity: 0.22 - r * 0.05,
      });
    }
    return list;
  }, [enneagramType]);

  useFrame((_, delta) => {
    if (!group.current) return;
    group.current.children.forEach((ring, i) => {
      ring.rotation.y += delta * rings[i].speed;
      ring.rotation.x += delta * rings[i].speed * 0.3;
    });
  });

  return (
    <group ref={group}>
      {rings.map((r, i) => (
        <line key={i} geometry={r.geometry} rotation={r.tilt}>
          <lineBasicMaterial color={accent} transparent opacity={r.opacity} />
        </line>
      ))}
    </group>
  );
}

/** Wireframe shell — icosahedron pulsing slowly. */
function Shell() {
  const ref = useRef();
  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.getElapsedTime();
    ref.current.scale.setScalar(1 + Math.sin(t * 0.3) * 0.015);
    ref.current.material.opacity = 0.05 + Math.sin(t * 0.5) * 0.015;
  });
  return (
    <mesh ref={ref}>
      <icosahedronGeometry args={[SHELL_RADIUS, 2]} />
      <meshBasicMaterial color="#ffffff" transparent opacity={0.06} wireframe toneMapped={false} />
    </mesh>
  );
}

/**
 * Dust particles — toroidal swirl around the orb. Count scales with
 * the user's activity. Hue is mood-mapped.
 */
function Dust({ count, hue, driftSpeed }) {
  const ref = useRef();
  const { positions, phases } = useMemo(() => {
    const n = Math.max(40, Math.min(260, count));
    const p = new Float32Array(n * 3);
    const ph = new Float32Array(n);
    const rand = mulberry32(0x9e3779b9 ^ (n * 0x85ebca77));
    for (let i = 0; i < n; i += 1) {
      const r = 0.42 + rand() * (SHELL_RADIUS - 0.55);
      const theta = rand() * Math.PI * 2;
      const phi = Math.acos(2 * rand() - 1);
      p[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      p[i * 3 + 1] = r * Math.cos(phi);
      p[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
      ph[i] = rand() * Math.PI * 2;
    }
    return { positions: p, phases: ph };
  }, [count]);

  useFrame((state) => {
    if (!ref.current) return;
    const pos = ref.current.geometry.attributes.position.array;
    const t = state.clock.getElapsedTime();
    for (let i = 0; i < pos.length / 3; i += 1) {
      const a = phases[i];
      const d = driftSpeed * 0.013;
      // Toroidal swirl — each particle traces a lissajous-like loop
      // around its seed position instead of random-walking.
      pos[i * 3] += Math.sin(t * 0.6 + a) * d;
      pos[i * 3 + 1] += Math.cos(t * 0.5 + a * 1.3) * d * 0.85;
      pos[i * 3 + 2] += Math.sin(t * 0.7 + a * 0.6) * d * 0.9;
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
        size={0.028}
        transparent
        opacity={0.6}
        sizeAttenuation
        toneMapped={false}
      />
    </points>
  );
}

/**
 * Neural firings — at random intervals, one strand briefly lights up
 * with a travelling pulse. Parent-owned refs so every strand can
 * read its current energy without re-rendering.
 */
function NeuralPulses({ fireRef }) {
  // Keep a ref array keyed by strand index; each value is 0..1.
  useEffect(() => {
    fireRef.current = new Array(FACET_COUNT).fill(0);
  }, [fireRef]);

  useFrame((_, delta) => {
    const arr = fireRef.current;
    if (!arr) return;
    // Decay all.
    for (let i = 0; i < arr.length; i += 1) {
      arr[i] = Math.max(0, arr[i] - delta * 1.8);
    }
    // Occasionally ignite a random strand (~every 2-4s on average).
    if (Math.random() < delta * 0.4) {
      const idx = Math.floor(Math.random() * arr.length);
      arr[idx] = 1;
    }
  });
  return null;
}

/** Capture the THREE scene object so the parent can export it. */
function SceneCapture({ onReady }) {
  const { scene, gl } = useThree();
  useEffect(() => {
    onReady({ scene, gl });
  }, [scene, gl, onReady]);
  return null;
}

/** The whole scene — wrapped in a group so the export includes everything. */
function Scene({ strands, enneagramType, particleCount, moodHue, driftSpeed, level, accent, reducedMotion, fireRef }) {
  const group = useRef();
  useFrame((state, delta) => {
    if (!group.current) return;
    if (!reducedMotion) group.current.rotation.y += delta * 0.1;
    const t = state.clock.getElapsedTime();
    group.current.scale.setScalar(1 + Math.sin(t * 0.45) * 0.015 + level * 0.002);
  });
  return (
    <group ref={group} name="engram-root">
      <Pupil accent={accent} />
      {strands.map((s, i) => (
        <Strand
          key={i}
          direction={s.direction}
          length={s.length}
          color={s.color}
          pulse={s.pulse}
          phaseSeed={i}
          fireRef={fireRef}
        />
      ))}
      <IrisRings enneagramType={enneagramType} accent={accent} />
      <Shell />
      <Dust count={particleCount} hue={moodHue} driftSpeed={driftSpeed} />
    </group>
  );
}

// ─── Data mapping ────────────────────────────────────────

function useEngramEncoding() {
  const iris = useStore((s) => s.iris);
  const engram = useStore((s) => s.engram);
  const entries = useStore((s) => s.entries);
  const rituals = useStore((s) => s.rituals);

  return useMemo(() => {
    const facetScores = iris?.facetScores || {};
    const enneagramType = iris?.enneagramType || 1;

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

    const strands = FACETS.map(({ name, domain }, i) => {
      const score = typeof facetScores[name] === 'number' ? facetScores[name] : 0.5;
      return {
        direction: fibonacciDirection(i, FACET_COUNT, 0),
        length: 0.32 + score * STRAND_REACH,
        color: DOMAINS[domain].color,
        pulse: normPulse[domain],
      };
    });

    const entryCount = (entries || []).length;
    const ritualCount = (rituals?.last30 || []).length;
    const particleCount = Math.min(240, 55 + entryCount * 2 + ritualCount * 4);

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

// ─── Fallback (WebGL-unavailable) ──────────────────────

function Fallback({ accentColor }) {
  return (
    <div
      role="img"
      aria-label="Engram artifact (static fallback)"
      style={{
        width: '100%',
        aspectRatio: '1 / 1',
        maxHeight: 320,
        borderRadius: 12,
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

// ─── Download menu ────────────────────────────────────

function DownloadMenu({ onGLB, onPNG, onHTML, accent }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const handle = async (fn) => {
    setOpen(false);
    setBusy(true);
    try {
      await fn();
    } finally {
      setBusy(false);
    }
  };
  return (
    <div
      style={{
        position: 'absolute',
        top: 10,
        right: 10,
        zIndex: 3,
      }}
    >
      <button
        type="button"
        aria-label="Download engram"
        onClick={() => setOpen((v) => !v)}
        disabled={busy}
        style={{
          width: 36,
          height: 36,
          borderRadius: '50%',
          display: 'grid',
          placeItems: 'center',
          background: 'color-mix(in srgb, var(--bg) 70%, transparent)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          border: `1px solid color-mix(in srgb, ${accent} 40%, transparent)`,
          color: accent,
          cursor: busy ? 'progress' : 'pointer',
          transition: 'all 180ms ease',
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 4v12M6 10l6 6 6-6M4 20h16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <div
          role="menu"
          style={{
            position: 'absolute',
            top: 44,
            right: 0,
            minWidth: 180,
            padding: 6,
            borderRadius: 12,
            background: 'color-mix(in srgb, var(--bg-raised) 92%, transparent)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            border: '1px solid var(--border)',
            boxShadow: '0 12px 40px -10px rgba(0,0,0,0.45)',
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          <MenuItem label="3D model (.glb)" hint="Blender / Unity / 3D-print" onClick={() => handle(onGLB)} />
          <MenuItem label="Snapshot (.png)" hint="Current frame" onClick={() => handle(onPNG)} />
          <MenuItem label="Interactive (.html)" hint="Standalone viewer, works offline" onClick={() => handle(onHTML)} />
        </div>
      )}
    </div>
  );
}

function MenuItem({ label, hint, onClick }) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      style={{
        textAlign: 'left',
        padding: '8px 12px',
        background: 'transparent',
        border: 'none',
        color: 'var(--ink)',
        borderRadius: 8,
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'var(--bg)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent';
      }}
    >
      <span style={{ fontSize: 13, color: 'var(--ink)' }}>{label}</span>
      <span style={{ fontSize: 10, color: 'var(--ink-dim)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{hint}</span>
    </button>
  );
}

// ─── Public component ────────────────────────────────

export default function EngramArtifact({ accentColor = '#7eb5ff' }) {
  const iris = useStore((s) => s.iris);
  const encoding = useEngramEncoding();
  const sceneApiRef = useRef(null); // { scene, gl }
  const fireRef = useRef(null);

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

  const handleGLB = async () => {
    const api = sceneApiRef.current;
    if (!api?.scene) return;
    const root = api.scene.getObjectByName('engram-root') || api.scene;
    await exportEngramGLB(root, 'engram.glb');
  };
  const handlePNG = () => {
    const api = sceneApiRef.current;
    if (!api?.gl) return;
    exportEngramPNG(api.gl, 'engram.png');
  };
  const handleHTML = () => {
    exportEngramHTML(
      encoding,
      {
        enneagramType: iris.enneagramType,
        accentColor,
        typeName: iris.typeName || '',
        takenAt: iris.takenAt || null,
      },
      'engram.html',
    );
  };

  return (
    <div
      role="img"
      aria-label="Your engram — a living 3D orb of your consciousness"
      style={{
        width: '100%',
        aspectRatio: '1 / 1',
        maxHeight: 340,
        position: 'relative',
        borderRadius: 12,
        overflow: 'hidden',
        background: `radial-gradient(circle at 50% 55%, color-mix(in srgb, ${accentColor} 22%, transparent) 0%, color-mix(in srgb, ${accentColor} 6%, transparent) 55%, transparent 80%)`,
      }}
    >
      <DownloadMenu
        onGLB={handleGLB}
        onPNG={handlePNG}
        onHTML={handleHTML}
        accent={accentColor}
      />
      <Canvas
        camera={{ position: [0, 0.3, 3.8], fov: 42 }}
        dpr={[1, 2]}
        gl={{ preserveDrawingBuffer: true, antialias: true, alpha: true }}
        frameloop={reducedMotion ? 'demand' : 'always'}
      >
        <SceneCapture onReady={(api) => { sceneApiRef.current = api; }} />
        <Suspense fallback={null}>
          <color attach="background" args={['#05050a']} />
          <Stars radius={40} depth={40} count={800} factor={3} saturation={0.1} fade speed={0.6} />
          <ambientLight intensity={0.55} />
          <pointLight position={[3, 3, 3]} intensity={0.5} color="#ffffff" />
          <pointLight position={[-2, -2, -2]} intensity={0.35} color={accentColor} />
          <NeuralPulses fireRef={fireRef} />
          <Scene {...encoding} accent={accentColor} reducedMotion={reducedMotion} fireRef={fireRef} />
          <EffectComposer>
            <Bloom
              intensity={0.9}
              luminanceThreshold={0.18}
              luminanceSmoothing={0.35}
              mipmapBlur
            />
            <Vignette eskil={false} offset={0.2} darkness={0.65} />
          </EffectComposer>
          <OrbitControls
            enablePan={false}
            enableZoom
            minDistance={2.8}
            maxDistance={6}
            autoRotate={!reducedMotion}
            autoRotateSpeed={0.55}
            enableDamping
            dampingFactor={0.08}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
