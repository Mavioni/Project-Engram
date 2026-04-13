// ─────────────────────────────────────────────────────────────
// StreakGrid — GitHub-style contribution grid for the last N weeks.
// Cell color = mood score; empty = unlogged.
// ─────────────────────────────────────────────────────────────

import { subDays } from 'date-fns';
import { dayKey, eachDayOfInterval } from '../../../lib/time.js';
import { moodByScore } from '../../../data/moods.js';

export default function StreakGrid({ byDay, weeks = 14 }) {
  const today = new Date();
  // Align to Saturday so the rightmost column ends today.
  const totalDays = weeks * 7;
  const days = eachDayOfInterval({
    start: subDays(today, totalDays - 1),
    end: today,
  });
  // Reshape into [col][row]
  const cols = [];
  for (let i = 0; i < weeks; i++) {
    cols.push(days.slice(i * 7, (i + 1) * 7));
  }

  return (
    <div style={{ display: 'flex', gap: 3 }}>
      {cols.map((col, ci) => (
        <div key={ci} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {col.map((d) => {
            const e = byDay.get(dayKey(d));
            const mood = e ? moodByScore(e.mood) : null;
            return (
              <div
                key={d.toISOString()}
                title={dayKey(d) + (mood ? ' · ' + mood.label : '')}
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: 3,
                  background: mood ? mood.color : 'rgba(255,255,255,0.035)',
                  opacity: mood ? 0.85 : 1,
                  border: '1px solid rgba(255,255,255,0.04)',
                }}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}
