# Working with Claude on Engram

**This file is for you, Mavioni.** Everything here is in plain English. No code, no jargon. Read it once; come back when you're stuck.

---

## Starting a new session (the only thing you need to remember)

**Say anything. Even "hi."**

That's it. Every Claude session on this repo has a protocol (in `CLAUDE.md`) that tells it to orient itself *before* responding to your first message. Claude will:

1. Run `npm run status` automatically
2. Read the recent commits, `IDEAS.md`, and `CHANGELOG.md`
3. Open its reply with a tight status summary + one proposed next move
4. Wait for you to nod or redirect

You don't need to re-brief it on what we've been building. You don't need to say "here's where we are." You can literally say "hi," "continue," "what's next?", or jump straight to a brief — all four paths end with you and Claude on the same page inside one message.

If you want to see the status yourself at any time, run `npm run status` in the terminal. Same output Claude sees.

---

## The mental model

You are the **creative director**. Claude is the **engineer-on-staff**.

- **You decide**: what the app should feel like, what it should do, what's missing, what's wrong.
- **Claude does**: translates your ideas to code, runs the tests, ships it, explains what happened.

You never need to know what JSX, Zustand, or Vite are. You *can* learn them through the comments Claude leaves in the code if you want — but you don't have to.

---

## The site is live

Every time Claude says "pushed to main," GitHub Actions builds the app and publishes it. ~90 seconds later, **https://mavioni.github.io/Project-Engram/** is updated.

If something you asked for isn't there yet, refresh the page after ~2 minutes. If it's still not there, check the **Actions** tab on GitHub — a red ✗ means the build failed. Tell Claude, paste the error line, and it'll fix it.

---

## The vocabulary

When you say any of these words, Claude knows exactly what you mean. **Use them** — they keep us in sync.

| Your word | What it means in the code |
|---|---|
| **Dashboard** or **home** | The first screen. `/` or the Dashboard nav tab. |
| **IRIS** | The 24-facet personality simulation (16 scenarios + results). `/iris`. |
| **Player Card** | The live summary of your IRIS results + seals. Appears at the top of the Dashboard. |
| **Engram** or **replica** | Your personal personality replica — the thing you level up and battle with. `/engram`. |
| **Arena** | The battle screen inside Engram. |
| **Seal** | What you collect when you beat an archetype. 9 to collect total. |
| **Coliseum** | The historical-archetypes browser inside IRIS. |
| **Chat** or **chat with my IRIS** | The Claude-powered conversation. `/chat`. |
| **Settings** | Theme toggle, account, subscription, reset. `/settings`. The gear in the top-right. |
| **Theme** | Light or dark mode. |
| **Check-in** | The daily mood + activities + note flow. `/checkin`. |
| **Streak** | How many consecutive days you've checked in. |
| **Facets** | The 24 personality dimensions IRIS measures. |
| **Domains** | The 6 groupings of facets (Cognitive, Emotional, Volitional, Relational, Existential, Shadow). |
| **Archetype** or **type** | One of the 9 Enneagram types. |

---

## How to brief Claude (templates)

Good briefs get good code. Copy any of these templates from `PROMPTS.md` and fill in the blanks. Or just talk normally — but if you're stuck, templates work.

### Asking for a new feature
> "On the **[screen]**, I want **[thing]**. When I **[action]**, **[outcome]**. Style-wise it should feel like **[reference or adjective]**."

Example:
> "On the Dashboard, I want a streak reminder. When my streak is about to break, show me a soft pulse near the streak number. Style-wise it should feel like a gentle nudge, not an alarm."

### Reporting a bug
> "On **[screen]**, when I **[action]**, I see **[what happens]**. I expected **[what should happen]**. I'm on **[device/browser]**."

Example:
> "On the Engram page, when I tap an archetype, I see a blank card. I expected the battle to start. I'm on iPhone Safari."

### Asking for polish
> "The **[thing]** feels **[off adjective]** when **[situation]**. Can it feel **[better adjective]** instead?"

Example:
> "The Player Card feels cramped when I'm in light mode. Can it feel more airy, more room to breathe?"

### Asking for a rethink
> "Let's rethink **[feature]**. The goal is **[goal]**. What would make it feel **[adjective]**?"

Example:
> "Let's rethink Chat. The goal is that it feels like a trusted friend, not a chatbot. What would make it feel warmer?"

---

## How to review what Claude did

After any change, Claude will tell you:

1. **What shipped** — a short list of what's now different in the app.
2. **How to see it** — which URL or flow to open.
3. **What broke or almost broke** — if anything.
4. **What's next** — sometimes. You're not obligated to follow.

**Your job as reviewer:**

- **Open the live site** and poke at the thing that changed. Does it feel right?
- **If yes**: move on. Say "good" or "continue" or brief the next thing.
- **If no**: describe what's off. Use the bug / polish templates above.

You don't need to look at the code. Ever. Unless you want to learn — in which case, comments in the files are written *for you*.

---

## Files to know about

These files live at the top level of the project. You never have to edit any of them — but knowing what they are makes conversations smoother.

| File | What it's for |
|---|---|
| **`README.md`** | The public project overview. Auto-generated in parts. |
| **`DEV_GUIDE.md`** | This file. Your onramp. |
| **`CLAUDE.md`** | Rules Claude follows when working on this repo. Read it if you want to know how Claude thinks here. |
| **`IDEAS.md`** | Our shared scratchpad. Ideas, decisions, and what's parked for later. **Add to it anytime.** |
| **`PROMPTS.md`** | Copy-paste brief templates. |
| **`CHANGELOG.md`** | Auto-updated record of every change, in plain English. |
| **`docs/`** | Deeper explainers for each subsystem. Read-only for you. |

---

## Safety rails (what not to say)

A few things that will make Claude push back (correctly):

- **"Delete everything and start over"** — it will ask if you're sure. The app has real work in it.
- **"Skip the tests"** — it won't. Tests are the only reason we can move fast.
- **"Just force push"** — it won't. That destroys history.
- **"Commit this secret"** — `.env` files are gitignored; Claude will refuse to commit API keys.

These aren't you being wrong; they're Claude's guardrails protecting you. Trust them.

---

## What "done" looks like

When Claude says "shipped as `abc1234`," four things are true:

1. ✅ **Lint is clean** (no code style warnings)
2. ✅ **Every test passes** (the current count is in `README.md` → Stats)
3. ✅ **Build is clean** (the site will deploy)
4. ✅ **Docs are current** (README was regenerated from the new code)

You don't need to verify any of that. Claude does, every time. If a single one fails, Claude won't commit.

---

## If Claude ever seems lost

Three phrases that reset things:

- **"Continue"** — pick up where we left off, make your best guess about what's next.
- **"Show me where we are"** — give me a tight status: what's shipped, what's in flight, what's parked.
- **"Forget that, let's do this instead"** — hard reset the direction. Tell Claude what the new goal is.

---

## One more thing

This project is alive. It deploys on every push. Real people (you, for now) actually use it. That means:

- Big ideas stay in `IDEAS.md` until we're ready.
- Small changes ship the moment they're ready.
- Every commit is a real checkpoint — you can always roll back.

You're not risking the world by asking Claude to try something. Try things.
