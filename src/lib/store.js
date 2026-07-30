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

// Engram replica: the user's evolving stats — XP, level, growth.
// XP is earned through reflection: journal entries, rituals, IRIS
// re-runs, and check-ins. Growth stays; combat is gone.
const initialEngram = () => ({
  xp: 0,
  level: 1,
  pendingLevelUp: null, // set to the new level number when awardXp crosses a boundary; cleared by acknowledgeLevelUp
});

// Rituals: the user's practice history + streak.
// Each completion: { id, day, at, durationSeconds }
// `last30` keeps only the 30 most recent completions so the store
// doesn't grow unbounded. The count + unique-days derivation is
// computed by selectors.
const initialRituals = () => ({
  last30: [],
});

// Settings: user preferences that don't fit elsewhere.
const initialSettings = () => ({
  ambientAudio: true, // default-on; muting respects user choice and persists
});

// Level from XP. Mirrors src/features/engram/rewards.js:levelFromXp,
// duplicated here so the store has no feature-folder import cycles.
const levelFromXp = (xp) => {
  if (!Number.isFinite(xp) || xp <= 0) return 1;
  return Math.floor(Math.sqrt(xp / 100)) + 1;
};

export const useStore = create(
  persist(
    (set, _get) => ({
      schemaVersion: SCHEMA_VERSION,
      theme: 'light', // 'light' | 'dark' — app-wide UI theme
      profile: initialProfile(),
      iris: initialIris(),
      subscription: initialSubscription(),
      engram: initialEngram(),
      rituals: initialRituals(),
      settings: initialSettings(),
      entries: [],
      insights: [], // cached Claude outputs
      chatThreads: [],

      // ── Theme ──
      setTheme: (theme) =>
        set(() => ({ theme: theme === 'dark' ? 'dark' : 'light' })),

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

      // ── Engram (replica / growth) ──
      // Every XP award checks whether the level boundary was
      // crossed; if so, `pendingLevelUp` is set and the Dashboard
      // surfaces a celebration toast on the user's next render.
      awardXp: (amount) =>
        set((s) => {
          const delta = Math.max(0, amount | 0);
          if (delta === 0) return {};
          const prevLevel = s.engram.level || levelFromXp(s.engram.xp);
          const nextXp = (s.engram.xp || 0) + delta;
          const nextLevel = levelFromXp(nextXp);
          return {
            engram: {
              ...s.engram,
              xp: nextXp,
              level: nextLevel,
              pendingLevelUp:
                nextLevel > prevLevel ? nextLevel : s.engram.pendingLevelUp,
            },
          };
        }),
      acknowledgeLevelUp: () =>
        set((s) => ({ engram: { ...s.engram, pendingLevelUp: null } })),

      // ── Rituals ──
      // Log a completed ritual. Award XP (scaled by duration, capped
      // so long rituals don't dominate). Flags a level-up if crossed,
      // using the same mechanism as awardXp.
      completeRitual: ({ id, durationSeconds }) =>
        set((s) => {
          const now = new Date().toISOString();
          const day = dayKey();
          const completion = {
            id,
            day,
            at: now,
            durationSeconds: durationSeconds | 0,
          };
          const next30 = [completion, ...(s.rituals.last30 || [])].slice(0, 30);

          // XP: +15 base, +1 per 30s of actual practice, capped at +40
          const durationBonus = Math.min(
            25,
            Math.floor((durationSeconds | 0) / 30),
          );
          const delta = 15 + durationBonus;
          const prevLevel = s.engram.level || 1;
          const nextXp = (s.engram.xp || 0) + delta;
          const nextLevel = Math.floor(Math.sqrt(nextXp / 100)) + 1;

          return {
            rituals: { ...s.rituals, last30: next30 },
            engram: {
              ...s.engram,
              xp: nextXp,
              level: nextLevel,
              pendingLevelUp:
                nextLevel > prevLevel ? nextLevel : s.engram.pendingLevelUp,
            },
          };
        }),

      // ── Settings ──
      setSetting: (patch) =>
        set((s) => ({ settings: { ...s.settings, ...patch } })),

      // ── Reset (with confirm in UI) ──
      hardReset: () =>
        set((s) => ({
          // Theme + audio preference survive a hard reset — UI
          // choices, not user content.
          theme: s.theme,
          settings: s.settings,
          profile: initialProfile(),
          iris: initialIris(),
          subscription: initialSubscription(),
          engram: initialEngram(),
          rituals: initialRituals(),
          entries: [],
          insights: [],
          chatThreads: [],
        })),
    }),
    {
      name: STORAGE_KEY,
      version: SCHEMA_VERSION,
      storage: createJSONStorage(() => localStorage),
      // CRITICAL: without `merge`, zustand's persist does a shallow
      // replace on hydration — any slice that's absent from the
      // persisted blob (because it was added in a later release:
      // engram, rituals, settings, chatThreads, etc.) ends up as
      // `undefined` on reload, causing null-deref crashes across
      // the Dashboard, Arena, and Chat screens.
      //
      // This merge keeps every NEW slice's default while overlaying
      // whatever the user actually has persisted.
      merge: (persisted, current) => {
        if (!persisted || typeof persisted !== 'object') return current;
        return { ...current, ...persisted };
      },
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

export function selectRitualStats(state) {
  const last30 = state.rituals?.last30 || [];
  const uniqueDays = new Set(last30.map((c) => c.day));
  const total = last30.length;
  // Was today touched?
  const todayKey = dayKey();
  const completedToday = last30.some((c) => c.day === todayKey);
  // Consecutive-day streak counted backward from today.
  let streak = 0;
  const now = new Date();
  for (let i = 0; i < 30; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const k = dayKey(d);
    if (uniqueDays.has(k)) {
      streak += 1;
    } else if (i === 0) {
      continue; // grace: no ritual yet today, don't break yesterday's streak
    } else {
      break;
    }
  }
  return { total, uniqueDays: uniqueDays.size, completedToday, streak };
}
