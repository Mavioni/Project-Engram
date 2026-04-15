import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Home from '../features/home/Home.jsx';
import Calendar from '../features/calendar/Calendar.jsx';
import Insights from '../features/insights/Insights.jsx';
import { useStore } from '../lib/store.js';
import { dayKey } from '../lib/time.js';

// These are the tests that would have caught the zustand 4→5 infinite
// re-render regression. Each mounts a real store-connected screen; if a
// selector returns a new reference every call, React runs out of update
// slots and throws "Maximum update depth exceeded" — which @testing-library
// bubbles up and fails the test.

const withRouter = (ui) => <MemoryRouter>{ui}</MemoryRouter>;

const seed = (entries) => {
  useStore.setState({
    entries,
    insights: [],
    chatThreads: [],
    profile: { name: '', createdAt: new Date().toISOString() },
    iris: { results: null, attempts: [] },
    subscription: { tier: 'free', aiCreditsUsed: 0, aiCreditsResetAt: null },
  });
};

const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
};

// Mood scores in [0,1] — matches CheckIn's storage shape (mood.score).
const SCORES = [0.05, 0.25, 0.5, 0.75, 0.95];
const fakeEntry = (offset) => ({
  id: 'e' + offset,
  day: dayKey(daysAgo(offset)),
  createdAt: daysAgo(offset).toISOString(),
  mood: SCORES[offset % SCORES.length],
  activities: ['exercise', 'read'],
  notes: [],
});

beforeEach(() => {
  seed([]);
});

describe('Home — render smoke', () => {
  it('mounts with no entries without looping or throwing', () => {
    render(withRouter(<Home />));
    // Empty-state copy should be visible
    expect(screen.getByText(/today is unwritten/i)).toBeInTheDocument();
  });

  it('mounts with 10 entries', () => {
    seed(Array.from({ length: 10 }, (_, i) => fakeEntry(i)));
    render(withRouter(<Home />));
    // Streak header is still there
    expect(screen.getByText(/streak/i)).toBeInTheDocument();
  });
});

describe('Calendar — render smoke', () => {
  it('mounts with no entries', () => {
    render(withRouter(<Calendar />));
    // Day-of-week headers are uppercased via CSS — the DOM still says "Sun".
    expect(screen.getByText(/^sun$/i)).toBeInTheDocument();
  });

  it('mounts with seeded entries (exercises selectEntriesByDay)', () => {
    seed(Array.from({ length: 5 }, (_, i) => fakeEntry(i)));
    render(withRouter(<Calendar />));
    expect(screen.getByText(/^sun$/i)).toBeInTheDocument();
  });
});

describe('Insights — render smoke', () => {
  it('shows the empty state with no entries', () => {
    render(withRouter(<Insights />));
    expect(screen.getByText(/nothing to read yet/i)).toBeInTheDocument();
  });

  it('mounts with seeded entries (exercises selectEntriesByDay + useMemo path)', () => {
    seed(Array.from({ length: 10 }, (_, i) => fakeEntry(i)));
    render(withRouter(<Insights />));
    // Window selector chip "30d" is always present on the loaded page —
    // CSS uppercases it so match the raw DOM text.
    expect(screen.getByText(/^30d$/i)).toBeInTheDocument();
  });
});
