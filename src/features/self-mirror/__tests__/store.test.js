// ─────────────────────────────────────────────────────────────
// store.test.js — Self Mirror lock-state Zustand slice.
// ─────────────────────────────────────────────────────────────
// The store owns only the *lock state* — not the CryptoKey itself.
// useSelfMirror owns the closure-held key; the store owns a mutable
// ref so setLocked can zero it. These tests cover the reducers and
// the idle-watch cadence (setInterval-based per ADR §12.5).

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  useSelfMirrorStore,
  startIdleWatch,
  selectUnlocked,
  selectLastActivity,
  IDLE_TIMEOUT_MS,
} from '../store.js';

// Reset the zustand slice to initial state between tests so one
// test's unlock doesn't bleed into the next.
const resetStore = () => {
  useSelfMirrorStore.getState().setLocked();
};

describe('self-mirror/store — reducers', () => {
  beforeEach(() => {
    resetStore();
  });

  it('starts in the locked state', () => {
    const s = useSelfMirrorStore.getState();
    expect(selectUnlocked(s)).toBe(false);
    expect(selectLastActivity(s)).toBeNull();
  });

  it('setUnlocked flips unlocked=true and stamps lastActivityAt', () => {
    const before = Date.now();
    const fakeKeyRef = { current: /** @type {unknown} */ ({ kty: 'fake' }) };
    useSelfMirrorStore.getState().setUnlocked(fakeKeyRef);
    const s = useSelfMirrorStore.getState();
    expect(s.unlocked).toBe(true);
    expect(s.keyRef).toBe(fakeKeyRef);
    expect(typeof s.lastActivityAt).toBe('number');
    expect(s.lastActivityAt).toBeGreaterThanOrEqual(before);
  });

  it('bumpActivity advances lastActivityAt when unlocked', () => {
    const fakeKeyRef = { current: /** @type {unknown} */ ({ kty: 'fake' }) };
    useSelfMirrorStore.getState().setUnlocked(fakeKeyRef);
    const first = useSelfMirrorStore.getState().lastActivityAt;
    // Spin briefly so wall-clock Date.now() advances monotonically.
    const spinUntil = Date.now() + 5;
    while (Date.now() <= spinUntil) {
      /* intentional tight spin */
    }
    useSelfMirrorStore.getState().bumpActivity();
    const next = useSelfMirrorStore.getState().lastActivityAt;
    expect(next).toBeGreaterThan(first);
  });

  it('bumpActivity is a no-op when locked', () => {
    useSelfMirrorStore.getState().bumpActivity();
    expect(useSelfMirrorStore.getState().lastActivityAt).toBeNull();
  });

  it('setLocked nulls keyRef.current, clears unlocked, clears lastActivityAt', () => {
    const fakeKeyRef = { current: /** @type {unknown} */ ({ kty: 'fake' }) };
    useSelfMirrorStore.getState().setUnlocked(fakeKeyRef);
    useSelfMirrorStore.getState().setLocked();
    const s = useSelfMirrorStore.getState();
    expect(s.unlocked).toBe(false);
    expect(s.lastActivityAt).toBeNull();
    // zeroKey(keyRef) semantic: the ref handed in is mutated in place.
    expect(fakeKeyRef.current).toBeNull();
  });

  it('exposes IDLE_TIMEOUT_MS at 30 minutes per ADR §7', () => {
    expect(IDLE_TIMEOUT_MS).toBe(30 * 60 * 1000);
  });
});

describe('self-mirror/store — idle watcher', () => {
  beforeEach(() => {
    resetStore();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    resetStore();
  });

  it('does not call onIdle before the timeout elapses', () => {
    const onIdle = vi.fn();
    const fakeKeyRef = { current: /** @type {unknown} */ ({ kty: 'fake' }) };
    useSelfMirrorStore.getState().setUnlocked(fakeKeyRef);
    const cleanup = startIdleWatch({ onIdle });
    vi.advanceTimersByTime(5 * 60 * 1000); // 5 minutes — well under 30.
    expect(onIdle).not.toHaveBeenCalled();
    cleanup();
  });

  it('calls onIdle exactly once after the timeout elapses', () => {
    const onIdle = vi.fn();
    const fakeKeyRef = { current: /** @type {unknown} */ ({ kty: 'fake' }) };
    useSelfMirrorStore.getState().setUnlocked(fakeKeyRef);
    const cleanup = startIdleWatch({ onIdle });
    // Advance past the 30-minute idle window in 1-minute ticks.
    vi.advanceTimersByTime(IDLE_TIMEOUT_MS + 60 * 1000);
    expect(onIdle).toHaveBeenCalledTimes(1);
    cleanup();
  });

  it('cleanup function cancels the interval — no onIdle after cleanup', () => {
    const onIdle = vi.fn();
    const fakeKeyRef = { current: /** @type {unknown} */ ({ kty: 'fake' }) };
    useSelfMirrorStore.getState().setUnlocked(fakeKeyRef);
    const cleanup = startIdleWatch({ onIdle });
    cleanup();
    vi.advanceTimersByTime(IDLE_TIMEOUT_MS * 2);
    expect(onIdle).not.toHaveBeenCalled();
  });

  it('bumpActivity resets the effective idle clock', () => {
    const onIdle = vi.fn();
    const fakeKeyRef = { current: /** @type {unknown} */ ({ kty: 'fake' }) };
    useSelfMirrorStore.getState().setUnlocked(fakeKeyRef);
    const cleanup = startIdleWatch({ onIdle });
    // 20 min pass, then activity; 20 more minutes should NOT trip idle.
    vi.advanceTimersByTime(20 * 60 * 1000);
    useSelfMirrorStore.getState().bumpActivity();
    vi.advanceTimersByTime(20 * 60 * 1000);
    expect(onIdle).not.toHaveBeenCalled();
    cleanup();
  });
});
