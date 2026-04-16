// ─────────────────────────────────────────────────────────────
// ambient-audio.js — procedural ambient pad for meditations.
// ─────────────────────────────────────────────────────────────
//
// What it is: a zero-byte, offline-first ambient music generator
// built on the Web Audio API. No audio files shipped, no network
// calls, no copyright concerns. Works in airplane mode.
//
// What it sounds like: a warm, slow-evolving major-7th pad with
// gentle filter movement and a whisper of pink noise underneath.
// Intentionally nothing percussive — percussion is activating and
// we're trying to deactivate.
//
// How: three detuned sine oscillators (the chord), routed through
// a low-pass filter whose cutoff sweeps slowly via an LFO, mixed
// with soft pink noise. One master gain for fade in/out. One
// AudioContext. Resumes on user gesture (browsers require this).
//
// Public surface:
//   const player = createAmbientPlayer();
//   await player.start();       // fades in over ~2s
//   player.setVolume(0.7);       // 0..1
//   player.stop();               // fades out over ~2s then tears down
//   player.isPlaying();          // bool
//
// Typical usage (see RitualPlayer.jsx): start on mount, stop on
// unmount, offer a mute toggle.
//
// ─────────────────────────────────────────────────────────────

const FADE_IN_SECONDS = 2.0;
const FADE_OUT_SECONDS = 1.8;
const DEFAULT_VOLUME = 0.25;

// Fmaj7 — soft, open, doesn't push emotion in any direction.
// Tuned down an octave so the pad sits in the sub-melodic range.
// Frequencies in Hz.
const CHORD_HZ = [
  87.31,  // F2
  130.81, // C3
  164.81, // E3
  196.00, // G3
];

const DETUNE_CENTS = 6; // subtle chorus feel via slight detune

/**
 * Create a white-noise buffer once, reuse for the noise source.
 * Browser-cached; ~2s buffer at ctx.sampleRate is plenty.
 */
function createNoiseBuffer(ctx, seconds = 2) {
  const length = ctx.sampleRate * seconds;
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  // Pink-ish noise via the Voss-McCartney algorithm (simple + quick).
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  for (let i = 0; i < length; i++) {
    const white = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.969 * b2 + white * 0.153852;
    b3 = 0.8665 * b3 + white * 0.3104856;
    b4 = 0.55 * b4 + white * 0.5329522;
    b5 = -0.7616 * b5 - white * 0.016898;
    data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
    b6 = white * 0.115926;
  }
  return buffer;
}

/**
 * Factory — creates an ambient player bound to a fresh AudioContext.
 */
export function createAmbientPlayer({ volume = DEFAULT_VOLUME } = {}) {
  // SSR / non-browser guard — calling code already gates on window,
  // but this keeps tests happy with node happy-dom (which has audio
  // context as a stub).
  if (typeof window === 'undefined' || typeof window.AudioContext === 'undefined') {
    return {
      start: async () => {},
      stop: () => {},
      setVolume: () => {},
      isPlaying: () => false,
    };
  }

  let ctx = null;
  let master = null;
  let nodes = []; // keeps refs so we can stop them explicitly
  let playing = false;
  let targetVolume = volume;

  async function start() {
    if (playing) return;
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    // Browsers auto-suspend AudioContext until a user gesture. Caller
    // should invoke start() from a click/tap handler; resume() is
    // idempotent if the context is already running.
    try {
      if (ctx.state === 'suspended') await ctx.resume();
    } catch {
      /* some browsers throw before any gesture — swallow and continue */
    }

    const now = ctx.currentTime;

    // ── Master gain ── fade in from 0 to targetVolume over FADE_IN_SECONDS
    master = ctx.createGain();
    master.gain.setValueAtTime(0, now);
    master.gain.linearRampToValueAtTime(targetVolume, now + FADE_IN_SECONDS);
    master.connect(ctx.destination);

    // ── Global low-pass filter for warmth ──
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, now);
    filter.Q.setValueAtTime(0.7, now);

    // Slow filter sweep — cutoff between 600 and 1400 Hz at ~0.05 Hz.
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.setValueAtTime(0.05, now);
    lfoGain.gain.setValueAtTime(400, now);
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    lfo.start(now);

    filter.connect(master);

    // ── Chord oscillators ──
    const chordOscs = [];
    CHORD_HZ.forEach((hz, i) => {
      // Two detuned sines per note for a subtle chorus.
      [-1, 1].forEach((dir) => {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(hz, now);
        osc.detune.setValueAtTime(dir * DETUNE_CENTS * (1 + i * 0.15), now);

        const noteGain = ctx.createGain();
        // Each note ~0.18; the 8 oscillators sum to a full pad without
        // clipping.
        noteGain.gain.setValueAtTime(0.18 / 2, now);

        osc.connect(noteGain);
        noteGain.connect(filter);
        osc.start(now);
        chordOscs.push(osc);
      });
    });

    // ── Pink noise layer ── very quiet, gives the air texture
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = createNoiseBuffer(ctx, 3);
    noiseSource.loop = true;
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.setValueAtTime(2000, now);
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.08, now);
    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(master);
    noiseSource.start(now);

    nodes = [lfo, noiseSource, ...chordOscs];
    playing = true;
  }

  function stop() {
    if (!playing || !ctx || !master) return;
    const now = ctx.currentTime;
    try {
      master.gain.cancelScheduledValues(now);
      master.gain.setValueAtTime(master.gain.value, now);
      master.gain.linearRampToValueAtTime(0, now + FADE_OUT_SECONDS);
    } catch {
      /* ignored */
    }
    playing = false;

    const localCtx = ctx;
    const localNodes = nodes;
    // Tear down after the fade completes so we don't click.
    setTimeout(() => {
      try {
        localNodes.forEach((n) => {
          try {
            if (typeof n.stop === 'function') n.stop();
          } catch {
            /* ignored */
          }
        });
        localCtx.close();
      } catch {
        /* ignored */
      }
    }, Math.ceil(FADE_OUT_SECONDS * 1000) + 50);

    ctx = null;
    master = null;
    nodes = [];
  }

  function setVolume(v) {
    const next = Math.max(0, Math.min(1, v));
    targetVolume = next;
    if (playing && ctx && master) {
      const now = ctx.currentTime;
      master.gain.cancelScheduledValues(now);
      master.gain.setValueAtTime(master.gain.value, now);
      master.gain.linearRampToValueAtTime(next, now + 0.3);
    }
  }

  function isPlaying() {
    return playing;
  }

  return { start, stop, setVolume, isPlaying };
}
