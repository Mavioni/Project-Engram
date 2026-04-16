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

// Engram replica: the user's evolving stats — XP, level, and
// the archetypes they've defeated in the arena.
const initialEngram = () => ({
  xp: 0,
  level: 1,
  defeated: [], // array of archetype type numbers (1..9) bested in the arena
  battleHistory: [], // last ~30 battles: { archetype, won, rounds: [{domain, user, opp, winner}], at }
  pendingLevelUp: null, // set to the new level number when awardXp crosses a boundary; cleared by acknowledgeLevelUp
  dailyChallenge: null, // { day, archetype, completed } — one per local day, surfaced on Dashboard
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

      // ── Engram (replica / arena) ──
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
      recordBattle: (result) =>
        set((s) => {
          const defeated = result.won
            ? Array.from(new Set([...(s.engram.defeated || []), result.archetype]))
            : s.engram.defeated || [];
          const history = [
            { ...result, at: new Date().toISOString() },
            ...(s.engram.battleHistory || []),
          ].slice(0, 30);
          const xpDelta = result.won ? 100 : 25;
          const prevLevel = s.engram.level || levelFromXp(s.engram.xp);
          const nextXp = (s.engram.xp || 0) + xpDelta;
          const nextLevel = levelFromXp(nextXp);
          // A won battle against the daily challenge target flips
          // the challenge's `completed` flag.
          const dc = s.engram.dailyChallenge;
          const nextDaily =
            dc && !dc.completed && result.won && dc.archetype === result.archetype
              ? { ...dc, completed: true }
              : dc;
          return {
            engram: {
              ...s.engram,
              xp: nextXp,
              level: nextLevel,
              defeated,
              battleHistory: history,
              pendingLevelUp:
                nextLevel > prevLevel ? nextLevel : s.engram.pendingLevelUp,
              dailyChallenge: nextDaily,
            },
          };
        }),
      acknowledgeLevelUp: () =>
        set((s) => ({ engram: { ...s.engram, pendingLevelUp: null } })),
      // Called by the Dashboard on mount — if today doesn't yet
      // have a challenge, pick one. The archetype is chosen from
      // the set the user hasn't defeated yet (or cycles through
      // all 9 if they've already sealed everyone).
      ensureDailyChallenge: () =>
        set((s) => {
          const day = dayKey();
          if (s.engram.dailyChallenge?.day === day) return {};
          const userType = s.iris?.enneagramType;
          const allTypes = [1, 2, 3, 4, 5, 6, 7, 8, 9].filter((t) => t !== userType);
          const undefeated = allTypes.filter(
            (t) => !(s.engram.defeated || []).includes(t),
          );
          const pool = undefeated.length > 0 ? undefeated : allTypes;
          // Deterministic-per-day: hash the day key so the user
          // sees the same challenge all day, even across refreshes.
          let h = 0;
          for (let i = 0; i < day.length; i++) h = ((h << 5) - h + day.charCodeAt(i)) | 0;
          const archetype = pool[Math.abs(h) % pool.length];
          return {
            engram: {
              ...s.engram,
              dailyChallenge: { day, archetype, completed: false },
            },
          };
        }),

      // ── Reset (with confirm in UI) ──
      hardReset: () =>
        set((s) => ({
          // Theme preference survives a hard reset — it's a UI choice,
          // not user content.
          theme: s.theme,
          profile: initialProfile(),
          iris: initialIris(),
          subscription: initialSubscription(),
          engram: initialEngram(),
          entries: [],
          insights: [],
          chatThreads: [],
        })),
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
