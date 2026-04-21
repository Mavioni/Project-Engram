// ─────────────────────────────────────────────────────────────
// Self Mirror — unlock lifecycle hook.
// ─────────────────────────────────────────────────────────────
// Owns the in-memory CryptoKey closure (held by useRef so it never
// hoists into a module variable), derives the data key on unlock,
// primes the idle watcher, loads or rebuilds all three per-window
// snapshots, and exposes the minimal surface the page + panel need
// per ADR §12.4.
// ─────────────────────────────────────────────────────────────

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  useSelfMirrorStore,
  selectUnlocked,
  startIdleWatch,
} from './store.js';
import { deriveKey } from './storage/crypto.js';
import { loadSnapshot, rebuildAllSnapshots } from './storage/repository.js';
import { getMeta, putMeta } from './storage/db.js';
import { DEFAULT_KDF_PARAMS, WINDOW_IDS } from './model/schema.js';
import { scoreEntropy, MIN_ENTROPY_SCORE } from './privacy/entropy.js';

const META_SALT = 'salt';
const META_KDF_PARAMS = 'kdf-params';
const SALT_LENGTH_BYTES = 16;

/**
 * @typedef {import('./model/schema.js').MirrorSnapshotPayload} SnapshotPayload
 * @typedef {{ recent: SnapshotPayload | null, mid: SnapshotPayload | null, long: SnapshotPayload | null }} SnapshotBundle
 */

/**
 * Primary hook for the Self Mirror feature (ADR §12.4).
 * @returns {{
 *   unlocked: boolean,
 *   unlock: (passphrase: string) => Promise<void>,
 *   lock: () => void,
 *   snapshots: SnapshotBundle | null,
 *   activeWindow: 'recent-30d' | 'mid-90d' | 'long-all',
 *   setActiveWindow: (id: 'recent-30d' | 'mid-90d' | 'long-all') => void,
 *   error: string | null,
 *   busy: boolean,
 * }}
 */
export function useSelfMirror() {
  const unlocked = useSelfMirrorStore(selectUnlocked);
  const setUnlocked = useSelfMirrorStore((s) => s.setUnlocked);
  const setLocked = useSelfMirrorStore((s) => s.setLocked);
  const bumpActivity = useSelfMirrorStore((s) => s.bumpActivity);

  const keyRef = useRef({ current: null });
  const idleCleanupRef = useRef(/** @type {(() => void) | null} */ (null));

  const [snapshots, setSnapshots] = useState(
    /** @type {SnapshotBundle | null} */ (null),
  );
  const [activeWindow, setActiveWindowState] = useState(WINDOW_IDS.MID);
  const [error, setError] = useState(/** @type {string | null} */ (null));
  const [busy, setBusy] = useState(false);

  const lock = useCallback(() => {
    if (idleCleanupRef.current) {
      idleCleanupRef.current();
      idleCleanupRef.current = null;
    }
    setLocked();
    setSnapshots(null);
    setError(null);
  }, [setLocked]);

  const unlock = useCallback(
    /** @param {string} passphrase */
    async (passphrase) => {
      setError(null);
      if (scoreEntropy(passphrase) < MIN_ENTROPY_SCORE) {
        setError('Passphrase too weak.');
        throw new Error('Passphrase too weak.');
      }
      setBusy(true);
      try {
        const salt = await ensureSalt();
        const kdfParams = await ensureKdfParams();
        const key = await deriveKey(passphrase, salt, kdfParams);
        keyRef.current.current = key;

        const [recent, mid, long] = await Promise.all([
          loadSnapshot(WINDOW_IDS.RECENT, key),
          loadSnapshot(WINDOW_IDS.MID, key),
          loadSnapshot(WINDOW_IDS.LONG, key),
        ]);
        let bundle = { recent, mid, long };
        if (!recent || !mid || !long) {
          bundle = await rebuildAllSnapshots(key, new Date().toISOString());
        }

        setSnapshots(bundle);
        setUnlocked(keyRef.current);
        idleCleanupRef.current = startIdleWatch({ onIdle: lock });
      } catch (err) {
        keyRef.current.current = null;
        setError(
          err instanceof Error && err.message === 'Passphrase too weak.'
            ? err.message
            : 'Incorrect passphrase.',
        );
        throw err;
      } finally {
        setBusy(false);
      }
    },
    [lock, setUnlocked],
  );

  const setActiveWindow = useCallback(
    /** @param {'recent-30d' | 'mid-90d' | 'long-all'} id */
    (id) => {
      setActiveWindowState(id);
      bumpActivity();
    },
    [bumpActivity],
  );

  useEffect(
    () => () => {
      if (idleCleanupRef.current) idleCleanupRef.current();
      idleCleanupRef.current = null;
    },
    [],
  );

  return {
    unlocked,
    unlock,
    lock,
    snapshots,
    activeWindow,
    setActiveWindow,
    error,
    busy,
  };
}

/** @returns {Promise<Uint8Array>} */
async function ensureSalt() {
  const row = await getMeta(META_SALT);
  if (row && Array.isArray(row.value)) return new Uint8Array(row.value);
  const salt = globalThis.crypto.getRandomValues(
    new Uint8Array(SALT_LENGTH_BYTES),
  );
  await putMeta({
    id: META_SALT,
    value: Array.from(salt),
    updatedAt: new Date().toISOString(),
  });
  return salt;
}

/** @returns {Promise<typeof DEFAULT_KDF_PARAMS>} */
async function ensureKdfParams() {
  const row = await getMeta(META_KDF_PARAMS);
  if (row && row.value && typeof row.value === 'object') {
    return /** @type {typeof DEFAULT_KDF_PARAMS} */ (row.value);
  }
  const params = { ...DEFAULT_KDF_PARAMS };
  await putMeta({
    id: META_KDF_PARAMS,
    value: params,
    updatedAt: new Date().toISOString(),
  });
  return params;
}
