// ─────────────────────────────────────────────────────────────
// Self Mirror — public barrel.
// ─────────────────────────────────────────────────────────────
// Single entry point for consumers outside this feature. The page
// is the default export for lazy-route wiring in App.jsx; panel +
// hook + store selectors are named exports for tests and for any
// future place (e.g. Journal) that embeds a mini-mirror surface.
// ─────────────────────────────────────────────────────────────

export { default } from './SelfMirrorPage.jsx';
export { default as SelfMirrorPage } from './SelfMirrorPage.jsx';
export { default as SelfMirrorPanel } from './SelfMirrorPanel.jsx';
export { useSelfMirror } from './useSelfMirror.js';
export {
  useSelfMirrorStore,
  startIdleWatch,
  selectUnlocked,
  selectLastActivity,
  IDLE_TIMEOUT_MS,
} from './store.js';
