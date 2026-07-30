// ─────────────────────────────────────────────────────────────
// Engram — local-first store (Zustand + localStorage).
// ─────────────────────────────────────────────────────────────
// Split into domain slices (profile, journal, ai, growth, iris)
// combined under a single persist call for backward compatibility.
// ─────────────────────────────────────────────────────────────

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import { createProfileSlice, initialProfile } from './slices/profileSlice.js';
import { createJournalSlice } from './slices/journalSlice.js';
import { createAISlice } from './slices/aiSlice.js';
import { createGrowthSlice, initialEngram, initialRituals } from './slices/growthSlice.js';
import { createIrisSlice, initialIris, initialSubscription } from './slices/irisSlice.js';

const STORAGE_KEY = 'engram.v1';
const SCHEMA_VERSION = 1;

export const useStore = create(
  persist(
    (...args) => ({
      schemaVersion: SCHEMA_VERSION,

      ...createProfileSlice(...args),
      ...createJournalSlice(...args),
      ...createAISlice(...args),
      ...createGrowthSlice(...args),
      ...createIrisSlice(...args),

      // ── Reset (with confirm in UI) ──
      hardReset: () =>
        args[0]((s) => ({
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
      merge: (persisted, current) => {
        if (!persisted || typeof persisted !== 'object') return current;
        return { ...current, ...persisted };
      },
      migrate: (state, version) => {
        if (version !== SCHEMA_VERSION) {
          return { ...state, schemaVersion: SCHEMA_VERSION };
        }
        return state;
      },
    },
  ),
);

// ── Re-export selectors from slices ─────────────────────────
export {
  selectTodayEntry,
  selectEntriesByDay,
  selectLastN,
  selectMoodSeries,
  selectActivityFrequency,
  selectTotalNoteCount,
} from './slices/journalSlice.js';

export {
  selectRitualStats,
} from './slices/growthSlice.js';
