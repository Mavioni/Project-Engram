// ─────────────────────────────────────────────────────────────
// tokenize.test.js — normalization, stopwords, n-gram windowing.
// ─────────────────────────────────────────────────────────────
// Pure string → string[] transforms. No storage, no crypto.

import { describe, expect, it } from 'vitest';
import { tokenize, bigrams, trigrams } from '../analysis/tokenize.js';

describe('self-mirror/analysis/tokenize :: tokenize()', () => {
  it('lowercases, strips ASCII punctuation, splits on whitespace', () => {
    expect(tokenize('Hello, World! Foo.Bar')).toEqual(['hello', 'world', 'foo', 'bar']);
  });

  it('removes stopwords', () => {
    // 'the', 'a', 'is', 'on' are common stopwords.
    expect(tokenize('the cat is on a mat')).toEqual(['cat', 'mat']);
  });

  it('drops single-character tokens', () => {
    expect(tokenize('a b c dog')).toEqual(['dog']);
  });

  it('preserves intra-word apostrophes', () => {
    expect(tokenize("don't shout")).toEqual(["don't", 'shout']);
  });

  it('strips leading/trailing apostrophes but keeps internal', () => {
    expect(tokenize("'hello' it's 'world'")).toEqual(['hello', "it's", 'world']);
  });

  it('handles unicode punctuation and symbols', () => {
    // em-dash + smart quotes + heart symbol.
    expect(tokenize('deadline—soon. “focus” ♥ work')).toEqual([
      'deadline',
      'soon',
      'focus',
      'work',
    ]);
  });

  it('returns [] on empty or whitespace-only input', () => {
    expect(tokenize('')).toEqual([]);
    expect(tokenize('   \t\n   ')).toEqual([]);
  });

  it('returns [] when every token is a stopword or single char', () => {
    expect(tokenize('the a is')).toEqual([]);
  });
});

describe('self-mirror/analysis/tokenize :: bigrams()', () => {
  it('returns adjacent pairs joined by a space', () => {
    expect(bigrams(['alpha', 'beta', 'gamma'])).toEqual(['alpha beta', 'beta gamma']);
  });

  it('returns [] for fewer than 2 tokens', () => {
    expect(bigrams([])).toEqual([]);
    expect(bigrams(['alpha'])).toEqual([]);
  });
});

describe('self-mirror/analysis/tokenize :: trigrams()', () => {
  it('returns adjacent triples joined by spaces', () => {
    expect(trigrams(['a', 'b', 'c', 'd'])).toEqual(['a b c', 'b c d']);
  });

  it('returns [] for fewer than 3 tokens', () => {
    expect(trigrams(['a', 'b'])).toEqual([]);
  });
});
