# Ambient audio — the procedural pad

## Why this exists

Meditation and breath practices feel measurably different with a soft sonic floor underneath. We wanted that feel without:

- Shipping audio files (30 MB+ for decent quality)
- Licensing headaches
- Network dependencies (breaks offline-first)
- Platform-specific plugins

So we built a **procedural pad generator** that synthesizes a warm, slow-evolving tone in real time using the browser's Web Audio API. Zero bytes of audio ship in the bundle. It works in airplane mode. No copyright holder exists for us to negotiate with.

## What it sounds like

A slow Fmaj7 chord — four notes, each doubled with slight detuning for a chorus feel — routed through a low-pass filter that sweeps gently over time. Pink noise whispers underneath for air. Fade-in and fade-out around two seconds.

Intentionally nothing percussive. No beat. Percussion activates the nervous system; we're trying to settle it.

## The file

**`src/lib/ambient-audio.js`** exports a single factory:

```js
import { createAmbientPlayer } from '../lib/ambient-audio.js';

const player = createAmbientPlayer({ volume: 0.25 });
await player.start();
// ... user practices ...
player.stop();
```

The factory returns `{ start, stop, setVolume, isPlaying }`. Each call creates a fresh AudioContext so multiple instances don't interfere.

## Browser gesture requirement

Modern browsers refuse to play audio until the user has gestured (tapped something). `start()` calls `AudioContext.resume()` which unlocks the context — as long as start() is invoked inside a click/tap handler, it works. We call it from the "Begin" button in the RitualPlayer intro screen. Before that button is tapped, the context doesn't exist.

## Volume

Default volume is 0.25 (quiet). The goal is ambient — present, not foreground. You're supposed to forget it's playing within 30 seconds.

## Mute semantics

Two levels of control:

- **Session mute** — inside the RitualPlayer, the ♪ button in the top-right toggles the audio for the current session only.
- **Global default** — Settings → Ambient music — toggles whether new rituals start with audio on or off.

The global default is stored in `store.settings.ambientAudio`.

## Musical structure (for the curious)

- Four notes: F2 (87.31 Hz), C3 (130.81 Hz), E3 (164.81 Hz), G3 (196.00 Hz)
- Each note split into two sine oscillators detuned ±6 cents for chorus
- Mixed through a low-pass filter (Q = 0.7) whose cutoff oscillates 600–1400 Hz at 0.05 Hz (~20-second sweep)
- Pink noise source (Voss–McCartney algorithm) passed through another low-pass at 2 kHz, mixed in at 8% volume

## Extensibility

Things you could add later, cheap:

- **Preset variations** — currently one pad. Could add "Deep" (lower chord, more filter movement), "Open" (5-voice suspended), "Warmth" (add soft saw with heavy filtering).
- **Binaural beats** — stereo split with a 4–8 Hz difference between channels. Easily done with a second oscillator pair.
- **Bell tones** — periodic soft sine bursts at 30–60 second intervals for "attention bells" in longer meditations.
- **User-selectable tuning** — 432 Hz vs 440 Hz as a Setting for users who care.

None of these have been built. They're all small additions to the existing factory; file an issue if you want one.

## When it won't play

- `AudioContext` not available (very old browser, SSR, tests) — factory returns a no-op object so callers never crash.
- User has not yet interacted with the page — the context stays suspended and produces silence. Tapping the mute toggle from the RitualPlayer is sufficient to unlock it.
- User has muted via the OS / tab — out of our control. The audio is generated but the device doesn't emit it.

All of these fail gracefully. No errors, no broken rituals.
