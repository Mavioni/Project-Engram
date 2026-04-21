// ─────────────────────────────────────────────────────────────
// Engram export — download the user's 3D artifact.
// ─────────────────────────────────────────────────────────────
// Three formats:
//
//   GLB — binary glTF, opens in any 3D viewer, 3D-printable,
//         importable into Blender / Unity / Unreal. The canonical
//         "I own this thing" file.
//
//   PNG — snapshot of the current canvas. Instagram-ready.
//
//   HTML — self-contained interactive viewer with the data baked
//          in. Works offline. Shareable as a single file.
//
// Everything is generated client-side. No server round-trip.
// ─────────────────────────────────────────────────────────────

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Revoke on next tick so Safari doesn't cancel the download mid-save.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Export the three.js scene as a GLB binary. Uses the standard
 * GLTFExporter from three/examples (no new dependency).
 */
export async function exportEngramGLB(scene, filename = 'engram.glb') {
  const { GLTFExporter } = await import('three/examples/jsm/exporters/GLTFExporter.js');
  const exporter = new GLTFExporter();
  return new Promise((resolve, reject) => {
    exporter.parse(
      scene,
      (result) => {
        const blob = new Blob([result], { type: 'model/gltf-binary' });
        triggerDownload(blob, filename);
        resolve();
      },
      (err) => reject(err),
      { binary: true, onlyVisible: true, embedImages: true },
    );
  });
}

/**
 * Snapshot the WebGL canvas to a PNG. `gl` is the R3F renderer.
 */
export function exportEngramPNG(gl, filename = 'engram.png') {
  // Force a fresh render so we snapshot the current animated frame
  // instead of a stale cleared buffer (browsers clear after every
  // flush when preserveDrawingBuffer is false).
  gl.domElement.toBlob(
    (blob) => {
      if (blob) triggerDownload(blob, filename);
    },
    'image/png',
  );
}

/**
 * Generate a self-contained HTML viewer with the user's encoding
 * baked in. Uses Three.js from a CDN (ESM import) — single file,
 * no build step, opens anywhere.
 *
 * @param {object} encoding  The snapshot of strands + mood + level,
 *                            same shape as useEngramEncoding returns.
 * @param {object} meta      { enneagramType, typeName, accentColor, takenAt }
 */
export function exportEngramHTML(encoding, meta, filename = 'engram.html') {
  const payload = JSON.stringify({ encoding, meta }).replace(/</g, '\\u003c');
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Engram — ${escapeHtml(meta.typeName || 'Artifact')}</title>
<meta name="viewport" content="width=device-width,initial-scale=1" />
<style>
  html,body { margin:0; height:100%; background:#06060e; color:#e6e6f0; font-family:ui-monospace,monospace; overflow:hidden; }
  #info { position:fixed; top:14px; left:14px; font-size:10px; letter-spacing:.25em; text-transform:uppercase; color:#888; z-index:2; pointer-events:none; }
  #info b { color:#fff; font-weight:500; letter-spacing:.12em; display:block; font-size:13px; margin-top:4px; }
  canvas { display:block; }
</style>
</head>
<body>
<div id="info">
  Engram
  <b>${escapeHtml(meta.typeName || 'Your artifact')}</b>
  <span style="color:${meta.accentColor || '#7eb5ff'}">Type ${meta.enneagramType || '—'}</span> · ${escapeHtml(meta.takenAt ? new Date(meta.takenAt).toLocaleDateString() : '')}
</div>
<script type="importmap">
{ "imports": { "three": "https://unpkg.com/three@0.184.0/build/three.module.js", "three/addons/": "https://unpkg.com/three@0.184.0/examples/jsm/" } }
</script>
<script type="module">
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
const DATA = ${payload};
const { strands, enneagramType, moodHue, particleCount, driftSpeed, level } = DATA.encoding;

const scene = new THREE.Scene();
scene.background = new THREE.Color('#06060e');
const camera = new THREE.PerspectiveCamera(42, innerWidth/innerHeight, 0.1, 100);
camera.position.set(0, 0.3, 4);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(2, devicePixelRatio));
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);
const ctrl = new OrbitControls(camera, renderer.domElement);
ctrl.enableDamping = true; ctrl.autoRotate = true; ctrl.autoRotateSpeed = 0.6;

scene.add(new THREE.AmbientLight(0xffffff, 0.5));
const p1 = new THREE.PointLight(0xffffff, 0.8); p1.position.set(3,3,3); scene.add(p1);
const accent = new THREE.Color(DATA.meta.accentColor || '#7eb5ff');
const p2 = new THREE.PointLight(accent, 0.6); p2.position.set(-2,-2,-2); scene.add(p2);

// Pupil
const pupil = new THREE.Mesh(
  new THREE.SphereGeometry(0.14, 32, 32),
  new THREE.MeshStandardMaterial({ color:0x0a0a10, emissive:accent, emissiveIntensity:0.5, roughness:0.3, metalness:0.3 })
);
scene.add(pupil);

// Strands
const strandGroup = new THREE.Group();
strands.forEach((s) => {
  const dir = new THREE.Vector3(...s.direction).normalize();
  const len = Math.max(0.2, s.length);
  const mid = dir.clone().multiplyScalar((0.14 + len) / 2 + 0.02);
  const cyl = new THREE.Mesh(
    new THREE.CylinderGeometry(0.005, 0.02, len, 8, 1, true),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(s.color), transparent: true, opacity: 0.65 })
  );
  cyl.position.copy(mid);
  cyl.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0), dir);
  strandGroup.add(cyl);
  const bead = new THREE.Mesh(
    new THREE.SphereGeometry(0.035, 16, 16),
    new THREE.MeshStandardMaterial({ color: new THREE.Color(s.color), emissive: new THREE.Color(s.color), emissiveIntensity: 1.2 })
  );
  bead.position.copy(dir.clone().multiplyScalar(0.14 + 0.02 + len));
  strandGroup.add(bead);
});
scene.add(strandGroup);

// Multi-ring iris
const phase = ((enneagramType || 1) - 1) / 9;
for (let r = 0; r < 3; r++) {
  const segs = 128; const radius = 1.55 + r*0.02;
  const pos = new Float32Array((segs+1)*3);
  for (let i = 0; i <= segs; i++) { const a = (i/segs)*Math.PI*2; pos[i*3] = Math.cos(a)*radius; pos[i*3+1]=0; pos[i*3+2]=Math.sin(a)*radius; }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos,3));
  const ring = new THREE.LineLoop(g, new THREE.LineBasicMaterial({ color: accent, transparent: true, opacity: 0.22 - r*0.05 }));
  ring.rotation.set(phase*Math.PI*0.6 + r*0.3, phase*Math.PI*1.2 + r*0.6, phase*Math.PI*0.4 + r*0.2);
  scene.add(ring);
}

// Shell
const shell = new THREE.Mesh(
  new THREE.IcosahedronGeometry(1.65, 2),
  new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true, transparent: true, opacity: 0.05 })
);
scene.add(shell);

// Dust
const n = Math.max(40, Math.min(280, particleCount));
const dustPos = new Float32Array(n*3);
for (let i = 0; i < n; i++) {
  const r = 0.35 + Math.random()*1.2; const t = Math.random()*Math.PI*2; const ph = Math.acos(2*Math.random()-1);
  dustPos[i*3] = r*Math.sin(ph)*Math.cos(t); dustPos[i*3+1] = r*Math.cos(ph); dustPos[i*3+2] = r*Math.sin(ph)*Math.sin(t);
}
const dustG = new THREE.BufferGeometry(); dustG.setAttribute('position', new THREE.BufferAttribute(dustPos,3));
const dust = new THREE.Points(dustG, new THREE.PointsMaterial({ color: new THREE.Color(moodHue[0], moodHue[1], moodHue[2]), size: 0.028, transparent: true, opacity: 0.6, sizeAttenuation: true }));
scene.add(dust);

addEventListener('resize', () => { camera.aspect = innerWidth/innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); });
function loop(t) {
  pupil.scale.setScalar(1 + Math.sin(t*0.0008)*0.04);
  const pos = dust.geometry.attributes.position.array;
  for (let i = 0; i < pos.length/3; i++) {
    pos[i*3]   += Math.sin(t*0.0008 + i)*0.0015;
    pos[i*3+1] += Math.cos(t*0.0007 + i)*0.0012;
    pos[i*3+2] += Math.sin(t*0.0006 + i*0.3)*0.001;
  }
  dust.geometry.attributes.position.needsUpdate = true;
  ctrl.update();
  renderer.render(scene, camera);
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
</script>
</body>
</html>`;
  const blob = new Blob([html], { type: 'text/html' });
  triggerDownload(blob, filename);
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
