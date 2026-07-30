// ─────────────────────────────────────────────────────────────
// Growth slice — Engram replica (XP/level), rituals, settings.
// ─────────────────────────────────────────────────────────────

import { dayKey } from '../time.js';

const levelFromXp = (xp) => {
  if (!Number.isFinite(xp) || xp <= 0) return 1;
  return Math.floor(Math.sqrt(xp / 100)) + 1;
};

export function initialEngram() {
  return {
    xp: 0,
    level: 1,
    pendingLevelUp: null,
  };
}

export function initialRituals() {
  return { last30: [] };
}

export function initialSettings() {
  return { ambientAudio: true };
}

export function createGrowthSlice(_set, _get) {
  return {
    engram: initialEngram(),
    rituals: initialRituals(),
    settings: initialSettings(),

    // ── Engram (replica / growth) ──
    awardXp: (amount) =>
      _set((s) => {
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
      _set((s) => ({ engram: { ...s.engram, pendingLevelUp: null } })),

    // ── Rituals ──
    completeRitual: ({ id, durationSeconds }) =>
      _set((s) => {
        const now = new Date().toISOString();
        const day = dayKey();
        const completion = {
          id,
          day,
          at: now,
          durationSeconds: durationSeconds | 0,
        };
        const next30 = [completion, ...(s.rituals.last30 || [])].slice(0, 30);

        const durationBonus = Math.min(25, Math.floor((durationSeconds | 0) / 30));
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
      _set((s) => ({ settings: { ...s.settings, ...patch } })),
  };
}

// ── Selectors ───────────────────────────────────────────────

export function selectRitualStats(state) {
  const last30 = state.rituals?.last30 || [];
  const uniqueDays = new Set(last30.map((c) => c.day));
  const todayKey = dayKey();
  const completedToday = last30.some((c) => c.day === todayKey);

  let streak = 0;
  const now = new Date();
  for (let i = 0; i < 30; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const k = dayKey(d);
    if (uniqueDays.has(k)) {
      streak += 1;
    } else if (i === 0) {
      continue;
    } else {
      break;
    }
  }
  return { total: last30.length, uniqueDays: uniqueDays.size, completedToday, streak };
}
