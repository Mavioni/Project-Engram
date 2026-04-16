// ─────────────────────────────────────────────────────────────
// patterns.js — turning journal data into insight.
// ─────────────────────────────────────────────────────────────
//
// Everything here is pure math over the entries array. No store,
// no fetches. Designed for dashboard cards that surface discoveries
// like: "When you exercise, you feel 18% better than average."
//
// Two primary exports:
//   computeActivityLift(entries)  → ranked list of activity → mood
//                                   correlations with confidence
//   computeStreak(entries)        → { current, longest, recentlyHot }
//
// Both are called inside useMemo so they stay stable across renders.
// ─────────────────────────────────────────────────────────────

const MIN_SAMPLES_PER_ACTIVITY = 3;
const MIN_BASELINE_ENTRIES = 14;

/**
 * Average a flat array of numbers. Returns null on empty.
 */
function avg(xs) {
  if (xs.length === 0) return null;
  let s = 0;
  for (const x of xs) s += x;
  return s / xs.length;
}

/**
 * Given the entries array, compute per-activity mood lift.
 * Returns [] if there isn't enough data to say anything honest
 * (< 14 entries, or no activity has ≥ 3 appearances).
 *
 * Return shape:
 *   [{ activityId, name, mean, overallMean, lift, count }, ...]
 *   lift = (mean - overallMean) — absolute mood delta on days with tag
 *   sorted by |lift| descending
 */
export function computeActivityLift(entries) {
  if (!entries || entries.length < MIN_BASELINE_ENTRIES) return [];

  const overallMoods = entries
    .map((e) => e.mood)
    .filter((m) => Number.isFinite(m));
  const overallMean = avg(overallMoods);
  if (overallMean == null) return [];

  // Group moods by activity tag.
  const byActivity = new Map(); // id → number[]
  for (const e of entries) {
    if (!Number.isFinite(e.mood)) continue;
    for (const id of e.activities || []) {
      if (!byActivity.has(id)) byActivity.set(id, []);
      byActivity.get(id).push(e.mood);
    }
  }

  const rows = [];
  for (const [id, moods] of byActivity.entries()) {
    if (moods.length < MIN_SAMPLES_PER_ACTIVITY) continue;
    const mean = avg(moods);
    rows.push({
      activityId: id,
      mean,
      overallMean,
      lift: mean - overallMean,
      count: moods.length,
    });
  }

  return rows.sort((a, b) => Math.abs(b.lift) - Math.abs(a.lift));
}

/**
 * Consecutive-day streak from the entries array.
 * - current: today + any trailing days; today is optional (grace day)
 * - longest: best streak in the whole history
 * - recentlyHot: true if current >= 3
 */
export function computeStreak(entries) {
  if (!entries || entries.length === 0) {
    return { current: 0, longest: 0, recentlyHot: false };
  }
  const days = new Set(entries.map((e) => e.day));
  const toKey = (d) => {
    // inline so we don't import time.js (keeps this file pure)
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
  };

  // Current streak counting back from today, with a one-day grace.
  let current = 0;
  const today = new Date();
  for (let i = 0; i < 3650; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const k = toKey(d);
    if (days.has(k)) {
      current += 1;
    } else if (i === 0) {
      continue;
    } else {
      break;
    }
  }

  // Longest streak — walk sorted day keys, count consecutive runs.
  const sortedKeys = [...days].sort();
  let longest = 0;
  let run = 0;
  let prev = null;
  for (const k of sortedKeys) {
    if (prev === null) {
      run = 1;
    } else {
      const prevDate = new Date(prev + 'T00:00:00');
      const curDate = new Date(k + 'T00:00:00');
      const diffDays = Math.round(
        (curDate.getTime() - prevDate.getTime()) / (24 * 3600 * 1000),
      );
      run = diffDays === 1 ? run + 1 : 1;
    }
    if (run > longest) longest = run;
    prev = k;
  }

  return { current, longest, recentlyHot: current >= 3 };
}

/**
 * Given IRIS history (array of snapshots), compute per-domain
 * drift from first snapshot to latest. Positive = grew; negative
 * = softened. Used to tell a user "your shadow has softened this
 * month" or similar.
 *
 * Returns null if there are fewer than 2 snapshots.
 */
export function computeIrisDrift(history) {
  if (!history || history.length < 2) return null;
  const first = history[0]?.facetScores;
  const last = history[history.length - 1]?.facetScores;
  if (!first || !last) return null;

  const DOMAINS = {
    cognitive:   ['analytical', 'pattern', 'abstract', 'pragmatic'],
    emotional:   ['depth', 'empathy', 'regulation', 'vulnerability'],
    volitional:  ['assertion', 'discipline', 'spontaneity', 'patience'],
    relational:  ['bonding', 'social', 'autonomy', 'trust'],
    existential: ['purpose', 'identity', 'mortality', 'transcendence'],
    shadow:      ['anger', 'fear', 'shame', 'desire'],
  };

  const out = {};
  for (const [domain, facets] of Object.entries(DOMAINS)) {
    const firstAvg = avg(facets.map((f) => first[f] ?? 0));
    const lastAvg = avg(facets.map((f) => last[f] ?? 0));
    out[domain] = { first: firstAvg, last: lastAvg, delta: lastAvg - firstAvg };
  }
  return out;
}
