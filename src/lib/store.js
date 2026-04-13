// ─────────────────────────────────────────────────────────────
// Engram — local-first store (Zustand + localStorage)
// ─────────────────────────────────────────────────────────────
// Every field in this store is canonical on-device. If Supabase
// env vars are present, a sync layer mirrors it to Postgres —
// but the app works fully offline without any backend.
//
// Schema (versioned so we can migrate safely):
//   entries[]:  { id, day, createdAt, mood, activities, notes[] }
//   notes[]:    { id, kind, text, createdAt }
//   iris:       { facetScores, enneagramType, enneagramScores, takenAt, history[] }
//   profile:    { name, timezone, startedAt, theme }
//   subscription: { tier, status, renewsAt, customerId }
// ─────────────────────────────────────────────────────────────

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { dayKey } from './time.js';
import { ALL_ACTIVITIES } from '../data/activities.js';
import { moodByScore } from '../data/moods.js';

const STORAGE_KEY = 'engram.v1';
const SCHEMA_VERSION = 1;

const uid = () =>
  (crypto && crypto.randomUUID && crypto.randomUUID()) ||
  Math.random().toString(36).slice(2) + Date.now().toString(36);

const initialProfile = () => ({
  name: '',
  timezone:
    (Intl && Intl.DateTimeFormat().resolvedOptions().timeZone) || 'UTC',
  startedAt: new Date().toISOString(),
  theme: 'dark',
});

const initialIris = () => ({
  facetScores: null,
  enneagramType: null,
  enneagramScores: null,
  takenAt: null,
  history: [],
});

const initialSubscription = () => ({
  tier: 'free', // 'free' | 'pro'
  status: 'inactive',
  renewsAt: null,
  customerId: null,
  aiCreditsUsed: 0, // reset monthly
  aiCreditsResetAt: null,
});

export const useStore = create(
  persist(
    (set, get) => ({
      schemaVersion: SCHEMA_VERSION,
      profile: initialProfile(),
      iris: initialIris(),
      subscription: initialSubscription(),
      entries: [],
      insights: [], // cached Claude outputs
      chatThreads: [],

      // ── Onboarding ──
      setName: (name) =>
        set((s) => ({ profile: { ...s.profile, name } })),

      // ── IRIS results ──
      saveIrisResults: ({ facetScores, enneagramType, enneagramScores }) =>
        set((s) => {
          const takenAt = new Date().toISOString();
          const snapshot = {
            facetScores,
            enneagramType,
            enneagramScores,
            takenAt,
          };
          return {
            iris: {
              facetScores,
              enneagramType,
              enneagramScores,
              takenAt,
              history: [...(s.iris.history || []), snapshot].slice(-24),
            },
          };
        }),
      clearIris: () => set({ iris: initialIris() }),

      // ── Entries ──
      /**
       * Upsert today's entry — we allow one entry per day (the
       * classic Daylio model). Multiple check-ins merge.
       */
      upsertEntry: ({ mood, activities = [], note = null }) =>
        set((s) => {
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
        set((s) => ({
          entries: s.entries.map((e) =>
            e.id === id ? { ...e, ...patch, updatedAt: new Date().toISOString() } : e,
          ),
        })),

      deleteEntry: (id) =>
        set((s) => ({ entries: s.entries.filter((e) => e.id !== id) })),

      addNote: (entryId, note) =>
        set((s) => ({
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

      // ── Insights (cached Claude responses) ──
      cacheInsight: (insight) =>
        set((s) => ({
          insights: [
            { id: uid(), createdAt: new Date().toISOString(), ...insight },
            ...s.insights,
          ].slice(0, 60),
        })),

      // ── Chat threads ──
      startChatThread: (title) => {
        const id = uid();
        set((s) => ({
          chatThreads: [
            { id, title, createdAt: new Date().toISOString(), messages: [] },
            ...s.chatThreads,
          ].slice(0, 40),
        }));
        return id;
      },
      appendChatMessage: (threadId, message) =>
        set((s) => ({
          chatThreads: s.chatThreads.map((t) =>
            t.id === threadId
              ? {
                  ...t,
                  messages: [
                    ...t.messages,
                    { id: uid(), createdAt: new Date().toISOString(), ...message },
                  ],
                }
              : t,
          ),
        })),

      // ── Subscription ──
      setSubscription: (patch) =>
        set((s) => ({ subscription: { ...s.subscription, ...patch } })),
      useAiCredit: () =>
        set((s) => ({
          subscription: {
            ...s.subscription,
            aiCreditsUsed: (s.subscription.aiCreditsUsed || 0) + 1,
          },
        })),

      // ── Reset (with confirm in UI) ──
      hardReset: () =>
        set({
          profile: initialProfile(),
          iris: initialIris(),
          subscription: initialSubscription(),
          entries: [],
          insights: [],
          chatThreads: [],
        }),
    }),
    {
      name: STORAGE_KEY,
      version: SCHEMA_VERSION,
      storage: createJSONStorage(() => localStorage),
      migrate: (state, version) => {
        // Future migrations go here — bump SCHEMA_VERSION and handle
        // each step. For v1 just pass through.
        if (version !== SCHEMA_VERSION) {
          return { ...state, schemaVersion: SCHEMA_VERSION };
        }
        return state;
      },
    },
  ),
);

// ─────────────────────────────────────────────────────────────
// Derived selectors — not stored, computed on every call.
// Kept as plain functions so callers can memoize them in useMemo
// with their own dependencies.
// ─────────────────────────────────────────────────────────────

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
