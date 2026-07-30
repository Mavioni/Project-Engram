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
export const useSelfMirrorStore = create((set) => ({
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
 * Uses a debounced setTimeout (re-armed on every bumpActivity)
 * instead of polling. Subscribes to the store so the timer resets
 * whenever lastActivityAt changes while unlocked.
 *
 * @param {{ onIdle: () => void, timeoutMs?: number }} options
 * @returns {() => void} cleanup
 */
export function startIdleWatch({
  onIdle,
  timeoutMs = IDLE_TIMEOUT_MS,
}) {
  if (typeof onIdle !== 'function') {
    throw new TypeError('startIdleWatch: onIdle must be a function');
  }

  let timer = null;
  let fired = false;

  const schedule = () => {
    if (fired) return;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      fired = true;
      timer = null;
      onIdle();
    }, timeoutMs);
  };

  // Reactively reschedule on every activity bump while unlocked
  const unsub = useSelfMirrorStore.subscribe((state, prev) => {
    if (state.unlocked && state.lastActivityAt !== prev.lastActivityAt) {
      schedule();
    }
    // If locked externally (e.g. explicit lock button), clean up
    if (!state.unlocked && prev.unlocked) {
      fired = true;
      if (timer) { clearTimeout(timer); timer = null; }
    }
  });

  // Initial schedule if already unlocked at call time
  if (useSelfMirrorStore.getState().unlocked) {
    schedule();
  }

  return () => {
    if (timer) clearTimeout(timer);
    unsub();
  };
}
