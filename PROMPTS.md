# Prompt templates

> **Copy any of these, fill in the bracketed bits, send to Claude.**
> Good briefs get good code. You can always just talk normally — these
> are for when you want structure or feel stuck.

---

## Feature

```
Feature.

On the [screen name], I want [feature].

When I [action], [outcome].

Style-wise it should feel like [reference, adjective, or mood].

[Anything else Claude should know.]
```

**Example:**
> Feature.
>
> On the Dashboard, I want a streak reminder.
>
> When my streak is one day from breaking, the streak number should softly pulse.
>
> Style-wise it should feel like a gentle nudge, not an alarm. Still quiet.
>
> Don't add a modal or a popup.

---

## Bug

```
Bug.

On [screen], when I [action], I see [what happens].

I expected [what should happen].

I'm on [device / browser]. Happens [every time / sometimes].

[Console errors, if you can see them: paste the red text.]
```

**Example:**
> Bug.
>
> On the Engram page, when I tap The Challenger to battle, I see a blank card.
>
> I expected the battle result to show.
>
> I'm on desktop Chrome. Every time.

---

## Polish

```
Polish.

The [thing] feels [off adjective] when [situation].

Can it feel [better adjective] instead?

[Any specific thing you're trying to preserve / avoid.]
```

**Example:**
> Polish.
>
> The Player Card feels cramped in light mode.
>
> Can it feel more airy — more room to breathe, softer borders?
>
> Keep the seals row.

---

## Rethink

```
Rethink.

Let's rethink [feature / screen].

The goal is [underlying goal, not the mechanism].

What would make it feel [adjective]?

Tell me 2 options before you build anything.
```

**Example:**
> Rethink.
>
> Let's rethink Chat.
>
> The goal is that it feels like a trusted friend, not a chatbot.
>
> What would make it feel warmer? Tell me 2 options before you build anything.

---

## Research / explore

```
Research.

I'm thinking about [idea]. Before we build anything:

- What does this replace or sit next to in the current app?
- What's the smallest version that proves it works?
- What would kill it?

Just report back — don't code yet.
```

**Example:**
> Research.
>
> I'm thinking about letting users battle each other's Engrams, not just the 9 archetypes.
>
> Before we build anything:
> - What does this replace or sit next to in the current app?
> - What's the smallest version that proves it works?
> - What would kill it?

---

## Direction reset

```
Forget that, let's do this instead.

The new goal is [goal].

What's the first small move?
```

**Example:**
> Forget that, let's do this instead.
>
> The new goal is to make the Dashboard feel more like a sanctuary and less like a tool.
>
> What's the first small move?

---

## Status check

```
Show me where we are.
```

Claude will give you: what's shipped recently, what's in flight, what's in `IDEAS.md`'s Now/Next, and what it thinks the natural next move is. You pick.

---

## Safe continue

```
Continue.
```

Claude picks the highest-value next thing from the current state, ships it, reports. Use this when you trust Claude's judgment.

---

## Prescriptive continue

```
Continue with [specific thing].
```

Claude ships exactly that thing. Use this when you know what you want but don't feel like writing a full brief.

---

## Revert / undo

```
Undo the last commit.
```

or

```
Roll back to [description of when things worked].
```

Claude will figure out what commit to roll back to, explain what it'll un-do, and ask before actually doing it.

---

## Sharing something you saw elsewhere

```
I saw [site / app] do [thing]. It felt [adjective]. Can we do something similar on [screen]?
```

**Example:**
> I saw Linear do that little subtle spring when a todo completes. It felt satisfying. Can we do something similar when a check-in saves?

---

## When something feels "off" but you can't name it

```
Something feels off about [screen / flow]. Poke at it. Tell me what you notice.
```

Claude will open the screen, look at it critically, and come back with 2–4 observations + recommendations. You pick.

---

## The golden rule

If you can describe **what it should feel like**, Claude can build it. You don't need to know **how**.
