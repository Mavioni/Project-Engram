// ─────────────────────────────────────────────────────────────
// redact.test.js — display-layer redaction.
// ─────────────────────────────────────────────────────────────

import { describe, it, expect } from 'vitest';
import { redactForDisplay, PLACEHOLDERS } from '../privacy/redact.js';
import { normaliseRules, EMPTY_RULES } from '../privacy/rules.js';

describe('self-mirror/privacy/redact — mechanical rules', () => {
  it('redacts a bare email address', () => {
    const out = redactForDisplay('email me at jane.doe@example.com today');
    expect(out).toContain(PLACEHOLDERS.email);
    expect(out).not.toContain('jane.doe@example.com');
  });

  it('redacts plus-addressed and dotted-local emails', () => {
    const out = redactForDisplay(
      'routes: first.last+tag@mail.example.co.uk and a.b.c+x@dev.example.io',
    );
    expect(out).not.toContain('first.last+tag@mail.example.co.uk');
    expect(out).not.toContain('a.b.c+x@dev.example.io');
    const hits = out.match(new RegExp(escapeRegex(PLACEHOLDERS.email), 'g')) || [];
    expect(hits.length).toBe(2);
  });

  it('redacts international phone numbers with + prefix', () => {
    const out = redactForDisplay('ring me at +1 415 555 0199 later');
    expect(out).toContain(PLACEHOLDERS.phone);
    expect(out).not.toContain('415 555 0199');
  });

  it('redacts phone numbers with (area-code) formatting', () => {
    const out = redactForDisplay('call (415) 555-0199 or skip it');
    expect(out).toContain(PLACEHOLDERS.phone);
    expect(out).not.toContain('(415) 555-0199');
  });

  it('redacts http, https, ws, wss, and www-prefixed URLs', () => {
    const out = redactForDisplay(
      'links: http://a.example.com https://b.example.com wss://c.example.com ws://d.example.com www.e.example.com',
    );
    expect(out).not.toMatch(/https?:\/\//);
    expect(out).not.toMatch(/wss?:\/\//);
    expect(out).not.toContain('www.e.example.com');
    const hits = out.match(new RegExp(escapeRegex(PLACEHOLDERS.url), 'g')) || [];
    expect(hits.length).toBe(5);
  });

  it('does not redact plain text without matches', () => {
    const plain = 'nothing to redact here, just reflection notes.';
    expect(redactForDisplay(plain)).toBe(plain);
  });

  it('applies URL before email before phone (order matters)', () => {
    const out = redactForDisplay(
      'visit https://example.com/reset?email=jane@example.com for recovery',
    );
    expect(out).toContain(PLACEHOLDERS.url);
    expect(out).not.toContain(PLACEHOLDERS.email);
    expect(out).not.toContain('jane@example.com');
  });

  it('returns "" for non-string and empty inputs', () => {
    expect(redactForDisplay('')).toBe('');
    expect(redactForDisplay(null)).toBe('');
    expect(redactForDisplay(undefined)).toBe('');
    expect(redactForDisplay(1234)).toBe('');
  });

  it('does not eat trailing sentence punctuation after URLs', () => {
    const out = redactForDisplay('we shipped https://example.com.');
    expect(out.endsWith('.')).toBe(true);
    expect(out).toContain(PLACEHOLDERS.url);
  });

  it('redacts multiple emails on one line', () => {
    const out = redactForDisplay(
      'cc: alpha@x.com, beta@y.io, gamma@z.net — all ignore me please',
    );
    expect(out).not.toContain('alpha@x.com');
    expect(out).not.toContain('beta@y.io');
    expect(out).not.toContain('gamma@z.net');
    const hits = out.match(new RegExp(escapeRegex(PLACEHOLDERS.email), 'g')) || [];
    expect(hits.length).toBe(3);
  });
});

describe('self-mirror/privacy/redact — operator rules (synthetic tokens)', () => {
  // Synthetic tokens never correspond to real operator identities.
  // This is deliberate — real tokens live only in the encrypted
  // runtime store, never in test fixtures or source control.
  const SYN_FAMILY = ['alphasurname', 'betaname'];
  const SYN_LOCATION = ['neutralcity', 'placeholderstreet'];
  const SYN_IRIS = ['fakefacet', 'testtype-7'];
  const rules = { familyNames: SYN_FAMILY, locations: SYN_LOCATION, irisSensitive: SYN_IRIS };

  it('does not redact operator tokens when rules are empty', () => {
    const out = redactForDisplay('alphasurname lives in neutralcity');
    expect(out).toContain('alphasurname');
    expect(out).toContain('neutralcity');
  });

  it('redacts a family-name token when provided in rules', () => {
    const out = redactForDisplay('met with alphasurname today', rules);
    expect(out).toContain(PLACEHOLDERS.identity);
    expect(out).not.toContain('alphasurname');
  });

  it('redacts a location token when provided in rules', () => {
    const out = redactForDisplay('walked through neutralcity again', rules);
    expect(out).toContain(PLACEHOLDERS.location);
    expect(out).not.toContain('neutralcity');
  });

  it('redacts an IRIS-sensitive token when provided in rules', () => {
    const out = redactForDisplay('felt my fakefacet surface hard', rules);
    expect(out).toContain(PLACEHOLDERS.iris);
    expect(out).not.toContain('fakefacet');
  });

  it('applies operator rules case-insensitively', () => {
    const out = redactForDisplay('BETANAME and AlphaSurname both', rules);
    const hits = out.match(new RegExp(escapeRegex(PLACEHOLDERS.identity), 'g')) || [];
    expect(hits.length).toBe(2);
  });

  it('respects word boundaries so substring matches do not redact', () => {
    // "betaname" is a family token; "betanameless" must NOT be redacted.
    const out = redactForDisplay('betanameless context; betaname explicit', rules);
    expect(out).toContain('betanameless');
    expect(out).toContain(PLACEHOLDERS.identity);
  });

  it('does not redact when a category is empty, only active categories', () => {
    const partial = { familyNames: SYN_FAMILY }; // others omitted
    const out = redactForDisplay(
      'alphasurname lives in neutralcity with fakefacet energy',
      partial,
    );
    expect(out).toContain(PLACEHOLDERS.identity);
    expect(out).toContain('neutralcity');
    expect(out).toContain('fakefacet');
  });

  it('redacts across all six categories in a single pass', () => {
    const out = redactForDisplay(
      'alphasurname emailed jane@example.com from neutralcity re: fakefacet at https://site.example with +1 415 555 0199',
      rules,
    );
    expect(out).toContain(PLACEHOLDERS.identity);
    expect(out).toContain(PLACEHOLDERS.email);
    expect(out).toContain(PLACEHOLDERS.location);
    expect(out).toContain(PLACEHOLDERS.iris);
    expect(out).toContain(PLACEHOLDERS.url);
    expect(out).toContain(PLACEHOLDERS.phone);
  });

  it('accepts EMPTY_RULES without error', () => {
    const plain = 'alphasurname neutralcity fakefacet';
    // Defensive copy — redactForDisplay must not try to mutate the frozen default.
    const out = redactForDisplay(plain, EMPTY_RULES);
    expect(out).toBe(plain);
  });
});

describe('self-mirror/privacy/rules — normaliseRules', () => {
  it('returns a clean shape for a valid payload', () => {
    const r = normaliseRules({
      familyNames: ['a', 'b'],
      locations: ['x'],
      irisSensitive: [],
    });
    expect(r.familyNames).toEqual(['a', 'b']);
    expect(r.locations).toEqual(['x']);
    expect(r.irisSensitive).toEqual([]);
  });

  it('trims whitespace and drops empty entries', () => {
    const r = normaliseRules({ familyNames: [' a ', '', '   ', 'b'] });
    expect(r.familyNames).toEqual(['a', 'b']);
  });

  it('deduplicates case-insensitively', () => {
    const r = normaliseRules({ familyNames: ['Alpha', 'alpha', 'ALPHA', 'beta'] });
    expect(r.familyNames.length).toBe(2);
  });

  it('fills missing categories with empty arrays', () => {
    const r = normaliseRules({ familyNames: ['a'] });
    expect(r.locations).toEqual([]);
    expect(r.irisSensitive).toEqual([]);
  });

  it('throws on non-object input', () => {
    expect(() => normaliseRules(null)).toThrow(TypeError);
    expect(() => normaliseRules('nope')).toThrow(TypeError);
    expect(() => normaliseRules(42)).toThrow(TypeError);
  });

  it('throws when a category is not an array', () => {
    expect(() => normaliseRules({ familyNames: 'alpha' })).toThrow(TypeError);
  });

  it('throws when an entry is not a string', () => {
    expect(() => normaliseRules({ familyNames: ['ok', 42] })).toThrow(TypeError);
  });
});

/**
 * Escape a fixed string so it can be interpolated into a RegExp as a
 * literal pattern. Only used by the assertion helpers above.
 *
 * @param {string} s
 * @returns {string}
 */
function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
