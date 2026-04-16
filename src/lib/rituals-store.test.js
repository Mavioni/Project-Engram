import { describe, it, expect, beforeEach } from 'vitest';
import { useStore, selectRitualStats } from './store.js';
import { suggestRitual, RITUALS } from '../data/rituals.js';

const reset = () => {
  useStore.setState({
    rituals: { last30: [] },
    engram: {
      xp: 0,
      level: 1,
      defeated: [],
      battleHistory: [],
      pendingLevelUp: null,
      dailyChallenge: null,
    },
    settings: { ambientAudio: true },
  });
};

beforeEach(reset);

describe('rituals store — completeRitual', () => {
  it('logs a completion', () => {
    useStore.getState().completeRitual({ id: '4-7-8', durationSeconds: 120 });
    const { rituals } = useStore.getState();
    expect(rituals.last30).toHaveLength(1);
    expect(rituals.last30[0].id).toBe('4-7-8');
  });

  it('awards base XP + duration bonus', () => {
    useStore.getState().completeRitual({ id: '4-7-8', durationSeconds: 120 });
    // 15 base + floor(120/30) = 15 + 4 = 19
    expect(useStore.getState().engram.xp).toBe(19);
  });

  it('caps the duration bonus at 25', () => {
    useStore.getState().completeRitual({ id: 'metta', durationSeconds: 9000 });
    // 15 + 25 (cap) = 40
    expect(useStore.getState().engram.xp).toBe(40);
  });

  it('sets pendingLevelUp when XP crosses a boundary', () => {
    // Nudge XP just below the level-2 boundary
    useStore.setState({
      engram: { ...useStore.getState().engram, xp: 90, level: 1 },
    });
    useStore.getState().completeRitual({ id: '4-7-8', durationSeconds: 120 });
    // 90 + 19 = 109 → level 2
    expect(useStore.getState().engram.level).toBe(2);
    expect(useStore.getState().engram.pendingLevelUp).toBe(2);
  });

  it('caps last30 at 30 entries', () => {
    for (let i = 0; i < 40; i++) {
      useStore.getState().completeRitual({ id: 'arrival', durationSeconds: 30 });
    }
    expect(useStore.getState().rituals.last30).toHaveLength(30);
  });
});

describe('selectRitualStats', () => {
  it('reports zero stats for a fresh user', () => {
    const s = selectRitualStats(useStore.getState());
    expect(s).toEqual({
      total: 0,
      uniqueDays: 0,
      completedToday: false,
      streak: 0,
    });
  });

  it('detects today + streak', () => {
    useStore.getState().completeRitual({ id: 'arrival', durationSeconds: 30 });
    const s = selectRitualStats(useStore.getState());
    expect(s.completedToday).toBe(true);
    expect(s.total).toBe(1);
    expect(s.streak).toBe(1);
  });
});

describe('suggestRitual', () => {
  it('is deterministic per day', () => {
    const a = suggestRitual({ dayKey: '2026-05-01', recentMood: 0.5 });
    const b = suggestRitual({ dayKey: '2026-05-01', recentMood: 0.5 });
    expect(a.id).toBe(b.id);
  });

  it('steers grounding/breath when mood is low', () => {
    const r = suggestRitual({ dayKey: '2026-05-01', recentMood: 0.1 });
    expect(['grounding', 'breath', 'body', 'compassion']).toContain(r.kind);
  });

  it('steers gratitude/intention when mood is high', () => {
    const r = suggestRitual({ dayKey: '2026-05-01', recentMood: 0.9 });
    expect(['gratitude', 'intention', 'compassion', 'review']).toContain(r.kind);
  });

  it('returns an arrival-family ritual when mood is missing', () => {
    const r = suggestRitual({ dayKey: '2026-05-01', recentMood: null });
    expect(['arrival', 'breath']).toContain(r.kind);
  });

  it('always returns a valid ritual from the known list', () => {
    for (let i = 0; i < 30; i++) {
      const d = `2026-01-${String((i % 28) + 1).padStart(2, '0')}`;
      const r = suggestRitual({ dayKey: d, recentMood: Math.random() });
      expect(RITUALS.find((x) => x.id === r.id)).toBeDefined();
    }
  });
});

describe('settings', () => {
  it('defaults ambient audio on', () => {
    expect(useStore.getState().settings.ambientAudio).toBe(true);
  });

  it('setSetting merges patches', () => {
    useStore.getState().setSetting({ ambientAudio: false });
    expect(useStore.getState().settings.ambientAudio).toBe(false);
  });
});
