import { describe, it, expect } from 'vitest';
import { createAmbientPlayer } from './ambient-audio.js';

// happy-dom doesn't implement AudioContext. The factory returns a
// no-op player in that case — these smoke tests verify the surface
// stays callable without throwing in any environment.

describe('createAmbientPlayer (no-audio fallback)', () => {
  it('returns an object with the expected shape', () => {
    const p = createAmbientPlayer();
    expect(typeof p.start).toBe('function');
    expect(typeof p.stop).toBe('function');
    expect(typeof p.setVolume).toBe('function');
    expect(typeof p.isPlaying).toBe('function');
  });

  it('start / stop / setVolume are safe to call without crashing', async () => {
    const p = createAmbientPlayer();
    await p.start();
    p.setVolume(0.5);
    p.stop();
    expect(p.isPlaying()).toBe(false);
  });
});
