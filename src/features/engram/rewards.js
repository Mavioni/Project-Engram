// ─────────────────────────────────────────────────────────────
// Engram rewards — pure XP + level arithmetic.
// ─────────────────────────────────────────────────────────────
// `awardXp` and `recordBattle` in the Zustand store use these
// formulas. Kept here (not inline) so they're unit-testable.
// ─────────────────────────────────────────────────────────────

/** XP amounts per action. Tweak for game balance. */
export const XP = {
  checkIn: 10,
  streakDay: 5,
  irisComplete: 50,
  note: 25,
  battleWin: 100,
  battleLoss: 25,
};

/** Level from total XP. Each level costs `level * 100` XP. */
export function levelFromXp(xp) {
  if (!Number.isFinite(xp) || xp <= 0) return 1;
  return Math.floor(Math.sqrt(xp / 100)) + 1;
}

/** XP needed to reach the next level. */
export function xpToNext(xp) {
  const lv = levelFromXp(xp);
  const nextLevelXp = lv * lv * 100;
  return Math.max(0, nextLevelXp - xp);
}

/** 0..1 progress inside the current level. */
export function levelProgress(xp) {
  const lv = levelFromXp(xp);
  const floor = (lv - 1) * (lv - 1) * 100;
  const ceil = lv * lv * 100;
  const span = Math.max(1, ceil - floor);
  return Math.min(1, Math.max(0, (xp - floor) / span));
}
