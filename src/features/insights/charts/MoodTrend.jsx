// ─────────────────────────────────────────────────────────────
// MoodTrend — Area chart of mood score over the selected window.
// Gaps render as nulls (no line through unlogged days).
// ─────────────────────────────────────────────────────────────

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ReferenceLine,
} from 'recharts';
import { format } from 'date-fns';

export default function MoodTrend({ data, height = 220 }) {
  const clean = data.map((d) => ({
    ...d,
    label: format(d.date, 'M/d'),
    moodPct: d.raw == null ? null : Math.round(d.raw * 100),
  }));

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <AreaChart data={clean} margin={{ top: 10, right: 10, left: -24, bottom: 0 }}>
          <defs>
            <linearGradient id="moodFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffd166" stopOpacity={0.45} />
              <stop offset="50%" stopColor="#ff6b8a" stopOpacity={0.25} />
              <stop offset="100%" stopColor="#7eb5ff" stopOpacity={0.05} />
            </linearGradient>
            <linearGradient id="moodStroke" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#7eb5ff" />
              <stop offset="50%" stopColor="#ff6b8a" />
              <stop offset="100%" stopColor="#ffd166" />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: '#555', fontSize: 10, fontFamily: 'DM Mono, monospace' }}
            axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fill: '#555', fontSize: 10, fontFamily: 'DM Mono, monospace' }}
            axisLine={false}
            tickLine={false}
            width={36}
          />
          <ReferenceLine y={50} stroke="rgba(255,255,255,0.08)" strokeDasharray="4 4" />
          <Tooltip
            contentStyle={{
              background: '#0b0b17',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 8,
              fontFamily: 'DM Mono, monospace',
              fontSize: 11,
              color: '#e6e6f0',
            }}
            labelStyle={{ color: '#888' }}
            formatter={(v) => (v == null ? '—' : `${v}`)}
          />
          <Area
            type="monotone"
            dataKey="moodPct"
            stroke="url(#moodStroke)"
            strokeWidth={2.5}
            fill="url(#moodFill)"
            connectNulls={false}
            dot={{ fill: '#fff', stroke: 'none', r: 3 }}
            activeDot={{ r: 5 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
