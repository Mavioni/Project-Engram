// ─────────────────────────────────────────────────────────────
// schema.test.js — static constants + shape guarantees.
// ─────────────────────────────────────────────────────────────
// Pure constant assertions. No crypto, no storage.

import { describe, expect, it } from 'vitest';
import {
  SCHEMA_VERSION,
  KEY_VERSION_INITIAL,
  DEFAULT_KDF_PARAMS,
  WINDOW_IDS,
  SOURCE_KINDS,
} from '../model/schema.js';

describe('self-mirror/model/schema', () => {
  it('SCHEMA_VERSION is a positive integer', () => {
    expect(Number.isInteger(SCHEMA_VERSION)).toBe(true);
    expect(SCHEMA_VERSION).toBeGreaterThan(0);
  });

  it('KEY_VERSION_INITIAL is a positive integer', () => {
    expect(Number.isInteger(KEY_VERSION_INITIAL)).toBe(true);
    expect(KEY_VERSION_INITIAL).toBeGreaterThan(0);
  });

  it('DEFAULT_KDF_PARAMS contains the five required fields', () => {
    expect(DEFAULT_KDF_PARAMS).toEqual(
      expect.objectContaining({
        kdf: expect.any(String),
        hash: expect.any(String),
        iterations: expect.any(Number),
        aes: expect.any(String),
        keyLength: expect.any(Number),
      }),
    );
    expect(DEFAULT_KDF_PARAMS.iterations).toBeGreaterThanOrEqual(600000);
    expect(Object.isFrozen(DEFAULT_KDF_PARAMS)).toBe(true);
  });

  it('WINDOW_IDS is frozen and enumerates recent/mid/long', () => {
    expect(Object.isFrozen(WINDOW_IDS)).toBe(true);
    expect(WINDOW_IDS.RECENT).toBe('recent-30d');
    expect(WINDOW_IDS.MID).toBe('mid-90d');
    expect(WINDOW_IDS.LONG).toBe('long-all');
    expect(Object.values(WINDOW_IDS)).toHaveLength(3);
  });

  it('SOURCE_KINDS is frozen and matches the ADR §3 enumeration', () => {
    expect(Object.isFrozen(SOURCE_KINDS)).toBe(true);
    expect([...SOURCE_KINDS].sort()).toEqual(
      ['checkin', 'iris-note', 'journal', 'manual'].sort(),
    );
  });
});
