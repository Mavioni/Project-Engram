# Ideas — the Engram scratchpad

> **A living doc. Both Mavioni and Claude write here.** No pressure, no
> formatting rules, no "is this ready?" gate. If an idea shows up, it
> goes in. We review the list whenever we need direction.

---

## How to read this

- **Now** — actively being worked on. Max 1–3 items.
- **Next** — the best guess at what comes after Now. Reorderable.
- **Later** — real ideas with real merit, not imminent.
- **Wild** — speculative, unvetted, might never happen. Totally fine.
- **Decided against** — things we tried, considered, or rejected. Kept here so we remember why.

Mavioni: drop things anywhere. Claude: promote them up the list when we pick them up; cross them out with ~~strikethrough~~ + a short note when they ship or get rejected.

---

## Now

- _(nothing active — waiting for the next brief)_

---

## Next

- **Archetype-colored Dashboard tint.** When the user has an IRIS result, softly tint the ambient backdrop and accents to their archetype's color. Big atmospheric payoff, zero added complexity. (_proposed by Claude, 2026-04-14_)
- **First-run onboarding polish.** Right now a brand-new user lands on the Dashboard with an "Map yourself first" CTA. That's fine but could be warmer — a single welcome line ("Hi. This is Engram. It learns you.") + one softly highlighted action.
- **Level-up sound.** A single, short, tasteful chime on level-up. Respect `prefers-reduced-motion` and a mute toggle in Settings.

## Later

- **Engram evolution over time.** Your replica should reflect *recent* you, not just your IRIS snapshot. Idea: weighted blend of last N IRIS snapshots + derived signals from journal entries (anger tag → +shadow, deep notes → +depth). Surface the evolution curve somewhere.
- **Archetype-vs-archetype battles.** Let users watch two archetypes battle each other — not their own replica. Maybe part of the Coliseum.
- **Player Card sharing.** "Share my Player Card" → generates a static image + optional public URL. Requires backend; deferred.
- **Streak recovery mechanic.** If you miss a day, the streak breaks, but you can "redeem" with a thoughtful journal entry the next day. Rewards reflection, not mechanical consistency.
- **Weekly Claude review.** Pro feature: every Sunday, Claude reads your week and writes one page reflecting it back.
- **Goals module.** Set one intention per week; the Dashboard tracks whether you honored it.
- **Dream log shape.** The "dream" note kind deserves a dedicated night-logging flow with quieter visuals.
- **Ritual reminders.** Optional 6pm nudge to check in. Platform-native, respects Do Not Disturb.
- **Engram-to-Engram battles** (real, between users). Requires backend, auth, matchmaking. The "battle network" concept.

## Wild

- **Replica voice.** Your engram talks back to you — not just in the Chat tab, but as an ambient narrator: one-line observations when you open the app on a Monday morning after a rough weekend. Low-volume presence.
- **Constellation view.** Your IRIS history over time, plotted as a 3D constellation — each facet a star, brightness = current score, trail = history.
- **Archetype mirror game.** A mini-game where you're shown a stranger's anonymized Player Card and have to guess their archetype. Trains archetype-recognition intuition.
- **Sacred-geometry unlocks.** Reaching level milestones unlocks new ambient glyphs in the Backdrop (pentagram at level 5, dodecahedron at 10, etc.).
- **Daily oracle card.** A pulled-at-dawn archetype card — today's archetype to "live as" — with a short prompt.
- **Engram export as token.** Metadata file / JSON / maybe IPFS. Your replica as a portable artifact.

## Decided against (for now)

- ~~**Bubblewrap / Play Store TWA wrap right now.**~~ Deferred until a custom domain is in place — GitHub Pages project sites can't serve `/.well-known/assetlinks.json` at the root, which breaks TWA verification. Revisit when we have `engram.app`.

---

## Scratchpad (unstructured)

_(Drop raw thoughts here. Claude will harvest them into the sections above when we review.)_

- 
- 
- 
