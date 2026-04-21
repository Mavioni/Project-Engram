// ─────────────────────────────────────────────────────────────
// Self Mirror — shared test fixtures.
// ─────────────────────────────────────────────────────────────
// Used by repository.test.js and export.test.js. Deriving the
// data key per-suite is expensive (PBKDF2 @ 600k), so suites that
// need a key cache the result of deriveTestKey() per run.

import { deriveKey } from '../storage/crypto.js';
import { DEFAULT_KDF_PARAMS } from '../model/schema.js';

/** Fixed 16-byte salt — tests only, not persisted. */
export const TEST_SALT = new Uint8Array([
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16,
]);

export const TEST_PASSPHRASE = 'correct-horse-battery-staple';
export const WRONG_PASSPHRASE = 'wrong-horse-battery-staple';

/**
 * Lightweight KDF params for the test suite. Repository tests don't
 * need full 600k iterations — they exercise orchestration, not KDF
 * hardness — so we keep the shape identical but drop iterations to
 * keep each test under a second. (Crypto round-trip under OWASP-
 * floor iterations is still exercised by crypto.test.js.)
 */
export const TEST_KDF_PARAMS = Object.freeze({
  ...DEFAULT_KDF_PARAMS,
  iterations: 1000,
});

/**
 * Derive a CryptoKey from the test passphrase + salt under the
 * cheaper TEST_KDF_PARAMS.
 *
 * @param {string} [passphrase]
 * @returns {Promise<CryptoKey>}
 */
export async function deriveTestKey(passphrase = TEST_PASSPHRASE) {
  return deriveKey(passphrase, TEST_SALT, TEST_KDF_PARAMS);
}

/**
 * Build a plain MirrorEntryPayload + envelope-contributing fields.
 * `createdAt` defaults so tests can call makePlainEntry() with a
 * single override (text) and still get an ISO timestamp.
 *
 * @param {Partial<{
 *   id: string,
 *   createdAt: string,
 *   mood: number,
 *   text: string,
 *   tags: string[],
 *   sourceKind: string,
 * }>} overrides
 */
export function makePlainEntry(overrides = {}) {
  return {
    createdAt: '2026-04-17T12:00:00.000Z',
    mood: 0.5,
    text: 'reflection entry body',
    tags: ['probe'],
    sourceKind: 'journal',
    ...overrides,
  };
}
