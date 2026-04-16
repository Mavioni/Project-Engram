import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Home from '../features/home/Home.jsx';
import Calendar from '../features/calendar/Calendar.jsx';
import Insights from '../features/insights/Insights.jsx';
import Engram from '../features/engram/Engram.jsx';
import Settings from '../features/settings/Settings.jsx';
import { useStore } from '../lib/store.js';
import { dayKey } from '../lib/time.js';

// These tests exercise every store-connected surface. They would have caught
// the zustand 4→5 infinite re-render regression; if any selector allocates a
// new reference on each call, React exhausts its update slots and the test
// fails with "Maximum update depth exceeded".

const withRouter = (ui) => <MemoryRouter>{ui}</MemoryRouter>;

const seed = (patch = {}) => {
  useStore.setState({
    entries: [],
    insights: [],
    chatThreads: [],
    profile: { name: '', createdAt: new Date().toISOString() },
    iris: {
      facetScores: null,
      enneagramType: null,
      enneagramScores: null,
      takenAt: null,
      history: [],
    },
    subscription: { tier: 'free', aiCreditsUsed: 0, aiCreditsResetAt: null },
    engram: {
      xp: 0,
      level: 1,
      defeated: [],
      battleHistory: [],
      pendingLevelUp: null,
      dailyChallenge: null,
    },
    rituals: { last30: [] },
    settings: { ambientAudio: true },
    theme: 'light',
    ...patch,
  });
};

const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
};

const SCORES = [0.05, 0.25, 0.5, 0.75, 0.95];
const fakeEntry = (offset) => ({
  id: 'e' + offset,
  day: dayKey(daysAgo(offset)),
  createdAt: daysAgo(offset).toISOString(),
  mood: SCORES[offset % SCORES.length],
  activities: ['exercise', 'read'],
  notes: [],
});

// A minimal IRIS snapshot to flip the `hasIris` branch.
const fakeIris = {
  facetScores: {
    analytical: 0.7, pattern: 0.6, abstract: 0.5, pragmatic: 0.7,
    depth: 0.5, empathy: 0.4, regulation: 0.7, vulnerability: 0.3,
    assertion: 0.7, discipline: 0.8, spontaneity: 0.4, patience: 0.5,
    bonding: 0.5, social: 0.5, autonomy: 0.6, trust: 0.5,
    purpose: 0.8, identity: 0.7, mortality: 0.4, transcendence: 0.5,
    anger: 0.6, fear: 0.4, shame: 0.5, desire: 0.4,
  },
  enneagramType: 1,
  enneagramScores: { 1: 0.9, 2: 0.4, 3: 0.5, 4: 0.5, 5: 0.6, 6: 0.5, 7: 0.4, 8: 0.6, 9: 0.4 },
  takenAt: new Date().toISOString(),
  history: [],
};

beforeEach(() => {
  seed();
});

describe('Home — render smoke', () => {
  it('mounts with no entries + no IRIS', () => {
    render(withRouter(<Home />));
    // IRIS CTA heading
    expect(screen.getByText(/map yourself first/i)).toBeInTheDocument();
  });

  it('mounts with IRIS + 10 entries', () => {
    seed({
      entries: Array.from({ length: 10 }, (_, i) => fakeEntry(i)),
      iris: fakeIris,
    });
    render(withRouter(<Home />));
    // Stats row is always present once entries exist
    expect(screen.getByText(/streak/i)).toBeInTheDocument();
  });
});

describe('Calendar — render smoke', () => {
  it('mounts with no entries', () => {
    render(withRouter(<Calendar />));
    expect(screen.getByText(/^sun$/i)).toBeInTheDocument();
  });

  it('mounts with seeded entries', () => {
    seed({ entries: Array.from({ length: 5 }, (_, i) => fakeEntry(i)) });
    render(withRouter(<Calendar />));
    expect(screen.getByText(/^sun$/i)).toBeInTheDocument();
  });
});

describe('Insights — render smoke', () => {
  it('shows the empty state with no entries', () => {
    render(withRouter(<Insights />));
    expect(screen.getByText(/nothing to read yet/i)).toBeInTheDocument();
  });

  it('mounts with seeded entries', () => {
    seed({ entries: Array.from({ length: 10 }, (_, i) => fakeEntry(i)) });
    render(withRouter(<Insights />));
    expect(screen.getByText(/^30d$/i)).toBeInTheDocument();
  });
});

describe('Engram — render smoke', () => {
  it('gates on missing IRIS', () => {
    render(withRouter(<Engram />));
    expect(screen.getByText(/no replica yet/i)).toBeInTheDocument();
  });

  it('mounts with IRIS + stats tab visible', () => {
    seed({ iris: fakeIris });
    render(withRouter(<Engram />));
    expect(screen.getByText(/level 1 replica/i)).toBeInTheDocument();
    expect(screen.getByText(/domain attributes/i)).toBeInTheDocument();
  });
});

describe('Settings — render smoke', () => {
  it('mounts and shows theme + audio switches', () => {
    render(withRouter(<Settings />));
    expect(screen.getByText(/appearance/i)).toBeInTheDocument();
    expect(screen.getByText(/ambient music/i)).toBeInTheDocument();
    // Two role="switch" elements: theme toggle + ambient audio
    expect(screen.getAllByRole('switch')).toHaveLength(2);
  });

  it('reflects the current theme', () => {
    seed({ theme: 'dark' });
    render(withRouter(<Settings />));
    expect(screen.getByText(/dark mode/i)).toBeInTheDocument();
  });
});
