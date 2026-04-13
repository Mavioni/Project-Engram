// ─────────────────────────────────────────────────────────────
// Time helpers — tiny layer on top of date-fns for local-date
// bucketing. Everything is keyed by YYYY-MM-DD in the user's
// local time, not UTC, so "today" means the day the user sees.
// ─────────────────────────────────────────────────────────────

import {
  differenceInCalendarDays,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  parseISO,
  startOfMonth,
  startOfWeek,
  subDays,
} from 'date-fns';

export function dayKey(date = new Date()) {
  return format(date, 'yyyy-MM-dd');
}

export function fromDayKey(key) {
  return parseISO(key + 'T00:00:00');
}

export function prettyDate(date) {
  return format(date, 'EEEE, MMMM d');
}

export function shortDate(date) {
  return format(date, 'MMM d');
}

export function timeOfDay(date = new Date()) {
  const h = date.getHours();
  if (h < 5) return 'night';
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  if (h < 21) return 'evening';
  return 'night';
}

export function greeting() {
  const t = timeOfDay();
  return (
    {
      morning: 'Good morning',
      afternoon: 'Good afternoon',
      evening: 'Good evening',
      night: 'Good evening',
    }[t] || 'Hello'
  );
}

export function last(n, from = new Date()) {
  return eachDayOfInterval({ start: subDays(from, n - 1), end: from });
}

export function monthGrid(anchor = new Date()) {
  const start = startOfWeek(startOfMonth(anchor), { weekStartsOn: 0 });
  const end = endOfWeek(endOfMonth(anchor), { weekStartsOn: 0 });
  return eachDayOfInterval({ start, end });
}

/**
 * Current consecutive-day streak given a list of entries with .day keys.
 * Counts back from today; stops at the first missed day.
 */
export function currentStreak(entries) {
  if (!entries || entries.length === 0) return 0;
  const keys = new Set(entries.map((e) => e.day));
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 3650; i++) {
    const d = subDays(today, i);
    if (keys.has(dayKey(d))) {
      streak += 1;
    } else if (i === 0) {
      // No entry today — give yesterday the benefit of the doubt.
      continue;
    } else {
      break;
    }
  }
  return streak;
}

export function daysBetween(a, b) {
  return differenceInCalendarDays(a, b);
}

export { format, isSameDay, parseISO, eachDayOfInterval };
