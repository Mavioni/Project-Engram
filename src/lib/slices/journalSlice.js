// ─────────────────────────────────────────────────────────────
// Journal slice — entries, moods, notes, activities.
// ─────────────────────────────────────────────────────────────

import { dayKey } from '../time.js';
import { ALL_ACTIVITIES } from '../../data/activities.js';
import { moodByScore } from '../../data/moods.js';

const uid = () =>
  (crypto && crypto.randomUUID && crypto.randomUUID()) ||
  Math.random().toString(36).slice(2) + Date.now().toString(36);

export function createJournalSlice(_set, _get) {
  return {
    entries: [],

    /**
     * Upsert today's entry — one entry per day. Multiple check-ins merge.
     */
    upsertEntry: ({ mood, activities = [], note = null }) =>
      _set((s) => {
        const day = dayKey();
        const now = new Date().toISOString();
        const existing = s.entries.find((e) => e.day === day);
        if (existing) {
          const merged = {
            ...existing,
            mood: mood ?? existing.mood,
            activities: Array.from(
              new Set([...(existing.activities || []), ...activities]),
            ),
            notes: note
              ? [
                  ...(existing.notes || []),
                  { id: uid(), createdAt: now, ...note },
                ]
              : existing.notes || [],
            updatedAt: now,
          };
          return {
            entries: s.entries.map((e) => (e.day === day ? merged : e)),
          };
        }
        return {
          entries: [
            ...s.entries,
            {
              id: uid(),
              day,
              createdAt: now,
              updatedAt: now,
              mood: mood ?? 0.5,
              activities: activities || [],
              notes: note ? [{ id: uid(), createdAt: now, ...note }] : [],
            },
          ],
        };
      }),

    updateEntry: (id, patch) =>
      _set((s) => ({
        entries: s.entries.map((e) =>
          e.id === id ? { ...e, ...patch, updatedAt: new Date().toISOString() } : e,
        ),
      })),

    deleteEntry: (id) =>
      _set((s) => ({ entries: s.entries.filter((e) => e.id !== id) })),

    addNote: (entryId, note) =>
      _set((s) => ({
        entries: s.entries.map((e) =>
          e.id === entryId
            ? {
                ...e,
                notes: [
                  ...(e.notes || []),
                  { id: uid(), createdAt: new Date().toISOString(), ...note },
                ],
                updatedAt: new Date().toISOString(),
              }
            : e,
        ),
      })),
  };
}

// ── Selectors ───────────────────────────────────────────────

export function selectTodayEntry(state) {
  const key = dayKey();
  return state.entries.find((e) => e.day === key) || null;
}

export function selectEntriesByDay(state) {
  const map = new Map();
  for (const e of state.entries) map.set(e.day, e);
  return map;
}

export function selectLastN(state, n) {
  return [...state.entries]
    .sort((a, b) => (a.day < b.day ? 1 : -1))
    .slice(0, n);
}

export function selectMoodSeries(state, days) {
  const byDay = selectEntriesByDay(state);
  return days.map((d) => {
    const key = dayKey(d);
    const e = byDay.get(key);
    return {
      day: key,
      date: d,
      mood: e ? moodByScore(e.mood).score : null,
      raw: e ? e.mood : null,
    };
  });
}

export function selectActivityFrequency(state, days) {
  const keys = new Set(days.map((d) => dayKey(d)));
  const counts = new Map();
  for (const e of state.entries) {
    if (!keys.has(e.day)) continue;
    for (const id of e.activities || []) {
      counts.set(id, (counts.get(id) || 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([id, count]) => {
      const meta = ALL_ACTIVITIES.find((a) => a.id === id);
      return meta ? { ...meta, count } : null;
    })
    .filter(Boolean)
    .sort((a, b) => b.count - a.count);
}

export function selectTotalNoteCount(state) {
  return state.entries.reduce((n, e) => n + (e.notes?.length || 0), 0);
}
