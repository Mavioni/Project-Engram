// ─────────────────────────────────────────────────────────────
// Self Mirror — Zustand slice for lock-state + idle watcher.
// ─────────────────────────────────────────────────────────────
// Deliberately NOT persisted. The whole point of the Self Mirror
// unlock flow is that session-key state lives in memory only — no
// localStorage, no sessionStorage, no IndexedDB. Tab close, reload,
// or idle-timeout all revert to the locked state.
//
// State shape:
//   unlocked:        boolean
//   lastActivityAt:  number | null                 unix ms
//   keyRef:          { current: CryptoKey | null } mutable ref,
//                    owned by useSelfMirror but held here so
//                    setLocked can null `.current` in place via
//                    zeroKey() (ADR §7 key-lifecycle doctrine).
// ─────────────────────────────────────────────────────────────

import { create } from 'zustand';
import { zeroKey } from './storage/crypto.js';

/** 30 minutes in ms. Matches ADR §7. */
export const IDLE_TIMEOUT_MS = 30 * 60 * 1000;

/** Default poll cadence for the idle watcher (ADR §12.5 — 1-min). */
export const IDLE_POLL_MS = 60 * 1000;

/** Seed state for both initial construction and setLocked(). */
const LOCKED_STATE = Object.freeze({
  unlocked: false,
  lastActivityAt: null,
  keyRef: Object.freeze({ current: null }),
});

/**
 * Zustand store for Self Mirror lock state. See module header for
 * the doctrine reason this is non-persisted.
 */
export const useSelfMirrorStore = create((set, get) => ({
  ...LOCKED_STATE,

  /**
   * Transition to unlocked. Caller supplies a mutable `keyRef`
   * whose `.current` is a non-extractable CryptoKey. The store
   * holds the ref so `setLocked` can zero the key in place.
   *
   * @param {{ current: CryptoKey | null }} keyRef
   */
  setUnlocked: (keyRef) =>
    set(() => ({
      unlocked: true,
      lastActivityAt: Date.now(),
      keyRef,
    })),

  /**
   * Transition to locked. Zero the held key ref in place, then
   * reset all lock-state fields. Idempotent — safe to call from
   * the idle watcher, explicit "Lock now" button, and unmount.
   */
  setLocked: () =>
    set((s) => {
      if (s.keyRef) {
        try {
          zeroKey(s.keyRef);
        } catch {
          // zeroKey only throws on bad shape; tolerate whatever
          // was handed in so lock semantics stay robust.
        }
      }
      return { ...LOCKED_STATE };
    }),

  /** Refresh lastActivityAt on operator interaction. No-op if locked. */
  bumpActivity: () =>
    set((s) => (s.unlocked ? { lastActivityAt: Date.now() } : {})),

  /**
   * Readback helper — tests and the idle watcher consume this
   * rather than reaching into store internals.
   * @returns {number | null}
   */
  getLastActivity: () => get().lastActivityAt,
}));

// ── Selectors ───────────────────────────────────────────────
/** @param {{ unlocked: boolean }} s */
export const selectUnlocked = (s) => s.unlocked;
/** @param {{ lastActivityAt: number | null }} s */
export const selectLastActivity = (s) => s.lastActivityAt;

/**
 * Start an idle watcher that calls `onIdle` exactly once after
 * `IDLE_TIMEOUT_MS` of no activity, then cleans itself up.
 * Returns a cleanup function the caller must invoke on unmount /
 * explicit lock / tab close.
 *
 * The watcher polls at `IDLE_POLL_MS` (1 min) and reads
 * `lastActivityAt` from the store on each tick. That lets any
 * component call `bumpActivity()` to transparently reset the
 * effective idle clock without reaching into the timer.
 *
 * Phase 1.1 will replace the poll with a debounced setTimeout
 * re-armed on each bumpActivity call (ADR §12.5).
 *
 * @param {{ onIdle: () => void, intervalMs?: number, timeoutMs?: number }} options
 * @returns {() => void} cleanup
 */
export function startIdleWatch({
  onIdle,
  intervalMs = IDLE_POLL_MS,
  timeoutMs = IDLE_TIMEOUT_MS,
}) {
  if (typeof onIdle !== 'function') {
    throw new TypeError('startIdleWatch: onIdle must be a function');
  }
  let fired = false;
  let handle = setInterval(() => {
    if (fired) return;
    const last = useSelfMirrorStore.getState().lastActivityAt;
    if (last == null) return;
    if (Date.now() - last >= timeoutMs) {
      fired = true;
      clearInterval(handle);
      handle = null;
      onIdle();
    }
  }, intervalMs);

  return () => {
    if (handle != null) {
      clearInterval(handle);
      handle = null;
    }
  };
}
