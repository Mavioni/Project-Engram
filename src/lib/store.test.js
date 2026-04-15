import { describe, it, expect, beforeEach } from 'vitest';
import {
  useStore,
  selectTodayEntry,
  selectLastN,
  selectEntriesByDay,
  selectTotalNoteCount,
  selectMoodSeries,
  selectActivityFrequency,
} from './store.js';
import { dayKey, last } from './time.js';

// Fixed "today" so snapshots are stable across runs.
const TODAY = new Date();
const iso = (d) => dayKey(d);
const daysAgo = (n) => {
  const d = new Date(TODAY);
  d.setDate(TODAY.getDate() - n);
  return d;
};

const seedEntries = (count) => {
  const entries = [];
  for (let i = 0; i < count; i++) {
    entries.push({
      id: 'e' + i,
      day: iso(daysAgo(i)),
      createdAt: daysAgo(i).toISOString(),
      mood: (i % 5) + 1,
      activities: i % 2 === 0 ? ['exercise', 'read'] : ['code'],
      notes:
        i % 3 === 0
          ? [{ id: 'n' + i, kind: 'reflection', body: 'note ' + i, createdAt: daysAgo(i).toISOString() }]
          : [],
    });
  }
  return entries;
};

beforeEach(() => {
  useStore.setState({
    entries: [],
    insights: [],
    chatThreads: [],
  });
});

describe('store selectors', () => {
  describe('selectTodayEntry', () => {
    it('returns null when there are no entries', () => {
      expect(selectTodayEntry({ entries: [] })).toBeNull();
    });

    it("finds today's entry by day key", () => {
      const entries = seedEntries(3);
      expect(selectTodayEntry({ entries })).toEqual(entries[0]);
    });

    it("returns null when there's no entry for today", () => {
      const entries = [
        { id: 'old', day: iso(daysAgo(5)), mood: 3, activities: [], notes: [] },
      ];
      expect(selectTodayEntry({ entries })).toBeNull();
    });
  });

  describe('selectLastN', () => {
    it('returns entries sorted newest-first, limited to n', () => {
      const entries = seedEntries(10);
      const result = selectLastN({ entries }, 3);
      expect(result).toHaveLength(3);
      expect(result[0].day).toBe(iso(daysAgo(0)));
      expect(result[1].day).toBe(iso(daysAgo(1)));
      expect(result[2].day).toBe(iso(daysAgo(2)));
    });

    it('returns all entries if n > length', () => {
      const entries = seedEntries(2);
      expect(selectLastN({ entries }, 10)).toHaveLength(2);
    });

    it('returns empty array for empty input', () => {
      expect(selectLastN({ entries: [] }, 5)).toEqual([]);
    });
  });

  describe('selectEntriesByDay', () => {
    it('builds a Map keyed by day string', () => {
      const entries = seedEntries(5);
      const map = selectEntriesByDay({ entries });
      expect(map).toBeInstanceOf(Map);
      expect(map.size).toBe(5);
      expect(map.get(iso(daysAgo(0)))).toEqual(entries[0]);
    });
  });

  describe('selectTotalNoteCount', () => {
    it('sums notes across all entries', () => {
      const entries = seedEntries(6);
      // i=0,3 → 1 note each = 2 total
      expect(selectTotalNoteCount({ entries })).toBe(2);
    });

    it('returns 0 for empty state', () => {
      expect(selectTotalNoteCount({ entries: [] })).toBe(0);
    });
  });

  describe('selectMoodSeries', () => {
    it('maps over the day window and returns one point per day', () => {
      const entries = seedEntries(7);
      const days = last(7);
      const series = selectMoodSeries({ entries }, days);
      expect(series).toHaveLength(7);
      // Every day in the window has an entry, so nothing should be null.
      expect(series.every((p) => p.raw !== null)).toBe(true);
    });

    it('returns null mood for days without entries', () => {
      const entries = [
        { id: 'only', day: iso(daysAgo(0)), mood: 3, activities: [], notes: [] },
      ];
      const days = last(3);
      const series = selectMoodSeries({ entries }, days);
      const nullCount = series.filter((p) => p.raw === null).length;
      expect(nullCount).toBe(2);
    });
  });

  describe('selectActivityFrequency', () => {
    it('counts activity hits inside the window, sorted descending', () => {
      const entries = seedEntries(6);
      const days = last(6);
      const freq = selectActivityFrequency({ entries }, days);
      // i=0,2,4 → exercise+read (3 each), i=1,3,5 → code (3)
      const byId = Object.fromEntries(freq.map((a) => [a.id, a.count]));
      expect(byId.exercise).toBe(3);
      expect(byId.read).toBe(3);
      expect(byId.code).toBe(3);
      // Sorted
      expect(freq[0].count).toBeGreaterThanOrEqual(freq[freq.length - 1].count);
    });

    it('drops activities outside the window', () => {
      const entries = [
        { id: 'old', day: iso(daysAgo(100)), mood: 3, activities: ['exercise'], notes: [] },
      ];
      const days = last(7);
      expect(selectActivityFrequency({ entries }, days)).toEqual([]);
    });
  });
});
