# Cognitive Minigame: Ideas and Mechanics

> **Scope (see [SCOPE.md](SCOPE.md)):** MVP = **Signal Lock (triggered only) + countermeasure card**. Orbit Breath is ⏸ stretch (an option on the card later). Concepts C, D, E, the radiation trigger, routine daily checks and extra gamification are in the parking lot. Those parts are kept below for reference but marked ⏸.
>
> **Status:** **Built** as a drop-in module: `minigame/src/signal-lock/` (see §8). **Visuals follow the team design system** in `docs/design/` (on the `mohammed-altaie` branch). Status words everywhere: **OK / Watch / Act / No data**.

Part of the astronaut health monitoring app for the 2026 NASA Space Apps challenge "Create Health Monitoring Software for Astronauts on Space Missions". The challenge suggests prompting astronauts to "take measurements or complete specific actions from time to time", adding "a gamification system", and using color coding so a status reads at a glance. This minigame covers all three for fatigue and stress.

## 1. What the minigame is for

When the health app sees signs of **sleepiness** or **poor HRV** (heart rate variability), it offers a short session (about **3.5 minutes**, touch tablet) that:

1. **Assesses** how alert the astronaut is right now, compared with their own rested baseline.
2. **Recovers** with one evidence-backed next action (the countermeasure card), chosen by the result.
3. **Logs** the result back to the health app, where it shows up in trend charts and color-coded status, and escalates if needed.

What it should **not** do: claim a game cures sleep debt. For real sleepiness the game's job is to measure honestly and point to real countermeasures (sleep, a nap, light, putting off critical tasks). A short burst of engagement only masks fatigue for a while.

## 2. Triggers (when the app offers a session)

All thresholds are **starting points** to tune later. They are compared with the astronaut's **personal baseline**, not population norms.

| Trigger | Suggested rule | Routes to |
|---|---|---|
| Low HRV | **Sleep-window** RMSSD (or ln RMSSD) more than 1 SD below the **in-flight** 7-day rolling mean. Measured during sleep so exercise and posture don't skew it. **Never compared with pre-flight HRV**: HRV normally drops in microgravity (Fritsch-Yelle et al. 1996), so that would flag every astronaut every day. In the first 7 days of flight, while the rolling baseline builds, this trigger is off and the sleep, sleepiness and pre-task triggers still run | Stress / recovery branch |
| Short sleep | **< 5 h** alone, **or** < 6 h *plus* low HRV or sleepiness ≥ 7. Astronauts average ~6.4 h a night in flight (Dev et al. 2024), so "< 6 h" alone would fire too often for the crew-time budget | Sleepiness branch |
| Long wakefulness | Awake more than 16 h | Sleepiness branch |
| Self-report | Sleepiness check-in at 7 or higher on the 1–9 scale (Karolinska-style) | Sleepiness branch |
| Before a critical task | Scheduled before EVA, docking, robotics, and similar | Assessment only, then report |
| ⏸ Radiation event | Solar particle event or dosimeter alert logged (simulated in demo) | Assessment only, then daily checks for 7 days to watch for attention loss (based on OSDR OSD-939, see RESEARCH.md) |
| ⏸ Routine | Once a day at a fixed time, to build the baseline and trend | Parked: costs 3 min a day of crew time. The baseline builds from triggered and pre-task sessions instead |

Rules to stop nagging:
- At most one *prompted* session every 3 h unless the last result was Act.
- The astronaut can snooze (15 / 30 / 60 min). Snoozes are logged.
- Never interrupt during a flagged critical activity. Queue the prompt instead.

## 3. Concept shortlist

### A. Signal Lock (vigilance / reaction time) ⭐ recommended assessment
A **Psychomotor Vigilance Task (PVT)** in a game wrapper. The astronaut "holds a comms link". At random moments a signal appears, and they tap anywhere on the screen as fast as possible. A counter shows their reaction time.
- **Measures:** sustained attention and reaction speed. This is the most sensitive standard measure of sleep loss. A 3-minute PVT (PVT-B) has been used in spaceflight research and in NASA's Cognition test battery.
- **Space evidence (OSDR):** OSD-939 used a rat version of this exact test and found that space-type radiation lowered accuracy and increased impulsive early responses.
- **Pros:** Validated, short, almost no learning curve, easy to compare with a baseline, works with a tap anywhere (good in microgravity).
- **Cons:** Repetitive. The game wrapper and feedback have to carry the engagement.

### ⏸ B. Orbit Breath (paced breathing): stretch, offered from the countermeasure card later
A guided breathing pacer at about **6 breaths per minute** (resonance-frequency breathing). This pace reliably raises short-term HRV and calms the body. The astronaut **holds a finger on the screen while inhaling and lifts it to exhale**, so the app can measure how well they follow the rhythm.
- **Measures:** how closely they follow the rhythm. HRV isn't measured during breathing (no live sensor hookup).
- **Pros:** Strong evidence, no equipment needed, doubles as a stress tool any time.
- **Cons:** Calms rather than wakes, so it's the wrong tool for pure sleepiness.

### ⏸ C. Docking Drift (continuous tracking)
Drag a reticle to keep it on a target that drifts unpredictably, like manual docking. Measures average tracking error and how it gets worse over the 90 s.
- **Space evidence (OSDR):** OSD-1018 found that isolation and radiation affected motor learning in rats, and differently depending on how stress-resilient each rat was.
- **Pros:** Feels like real operations. Measures fine motor control and attention together.
- **Cons:** Touch dragging is noisy in microgravity (hand and arm drift). Harder to baseline. Strong practice effect.

### ⏸ D. Systems Check (go / no-go, impulse control)
Panel lights flash quickly. Tap for "nominal" lights and **hold back** on "fault" lights. Measures wrong taps (impulsivity) and misses.
- **Space evidence (OSDR):** In OSD-939, the main radiation effect was *more premature responding*. That's an impulse-control problem, which is exactly what this game measures.
- **Pros:** Catches the "careless" side of fatigue that reaction time alone misses. Fast-paced and fun.
- **Cons:** Needs tuning so it isn't too easy. Must not rely on telling colors apart alone (accessibility), so it also needs shapes or symbols. That ties into the pending design.

### ⏸ E. Star Sequence (working memory)
Stars in a constellation light up in order, and the astronaut repeats the order. The sequence gets longer each round until two misses (Corsi-style span).
- **Space evidence (OSDR):** OSD-479 and OSD-618 found spatial learning and memory deficits in mice after simulated cosmic radiation, made worse by isolation or unloading.
- **Pros:** Intuitive and on-theme. Working memory matters for following procedures.
- **Cons:** Less sensitive to sleep loss than PVT. Sessions vary in length.

**Decision (2026-11-14):** build **A + the countermeasure card**. B (Orbit Breath) is stretch: it adds up to 2 min of crew time, and without live sensors we can't show it improves HRV. C, D and E are parked (each adds crew time). If one comes back later, D goes first because it adds an impulse-control signal.

## 4. Deep spec: the Signal Lock session (as built)

### 4.1 Session flow (fewest taps)

```
Trigger / manual start
   │
   ▼
[1] Prompt (≈5 s) ── why now + the one rule ("tap when a ring appears") · Start / Snooze 15·30·60
   │                 (skipped when the astronaut started the check themselves)
   ▼
[2] Sleepiness (≈3 s) ── one tap on 1–9 picks AND continues
   │                 (skipped if logged in the check-in < 2 h ago)
   ▼
[3] "Tap anywhere to begin" ── the tap also puts the finger in place
   │
   ▼
[4] Signal Lock test (3 min)
   │
   ▼
[5] Result + countermeasure card ── status + ONE action up front; details one tap deep
       Done · Re-check in 60 min (Watch/Act) · Try again (if not scored)
```

The astronaut can pause or quit at any step. Partial data is saved and marked incomplete, never scored.

**Time budget:** about 10 s of taps + 3 min test + about 10 s to read the card ≈ **3.5 min**, only when triggered.

### 4.2 Step 2: Sleepiness
- Nine large stops (Karolinska anchors). One tap picks and moves on: no slider dragging, no separate "Next".
- Stored with the session so the details can show self-rated vs. measured alertness. Self-ratings don't reliably track measured performance (Dev et al. 2024), so **only the test decides the band**.
- Mood isn't asked here; it belongs to the daily check-in.

### 4.3 Step 2: Signal Lock (assessment)

| Parameter | Value |
|---|---|
| Duration | 3 min (PVT-B style) |
| Gap before each signal | Random, 1–4 s (uniform), so it can't be predicted |
| Response | Tap **anywhere** on screen (no aiming, works with hand drift in microgravity) |
| Feedback per trial | Show the RT in ms for about 1 s after each tap |
| Lapse | RT ≥ 355 ms (the PVT-B threshold; the 10-min PVT uses 500 ms) |
| Personal lapse | RT > 2× the astronaut's own baseline median RT (definition from OSDR OSD-939). Tracked alongside the fixed threshold, so naturally slow or fast responders are judged fairly |
| False start | Tap before the signal, or RT < 100 ms. Show a short "too early" message, then restart the gap timer |
| No response | Signal times out at 30 s, counts as a lapse, and shows "Tap as soon as the ring appears." (No sound: shared quarters) |
| Warm-up | First 3 trials are not scored |
| Finger bounce | A second tap within 150 ms of a response is ignored, not counted as a false start |
| Extra fingers / palm | Only the first finger counts |
| Keyboard | Space or Enter also responds (accessibility, desktop testing) |
| Screen | Kept awake during the test where the browser allows it |

**Metrics recorded:** scored trials, mean RT, median RT, mean 1/RT (speed, the most sensitive to sleep loss), lapses, personal lapses, false starts, false-start % (the "premature responding" measure from OSD-939), and slowing across the test (ms per minute).

**Personal baseline (decided 2026-11-14: score against the astronaut's own baseline):**
- **Why:** tablets add touch and screen delay that NASA's lab laptops didn't. Comparing tablet taps straight against NASA numbers would make everyone look slow. Measuring the baseline **on the same device** cancels that delay out.
- Built from **3 rested sessions** (sleepiness ≤ 4 and slept ≥ 7 h), ideally before the mission. Until then the result is "Building your baseline", with no OK/Watch/Act judgement.
- Rolling: the last 10 rested, complete, valid sessions.
- **How far from normal counts as "slow":** 1 SD = **0.24 s⁻¹**, the spread of ISS astronauts' pre-flight PVT speed (Dev et al. 2024, Table 1). It's a between-person spread, so it's deliberately conservative for within-person change (fewer false alarms).
- **Demo:** a **sample** baseline (about 280 ms, labeled "Sample demo baseline (not a real person)"). It's not NASA data. The NASA reference is shown as the source of the SD, not as anyone's baseline.

**No score number.** A 0–100 score adds nothing the band and one action don't already say. Dropped to keep the screen to what matters.

**Bands** (shown as OK / Watch / Act with icon + word):

| Band | Rule | Meaning |
|---|---|---|
| OK | Speed within 1 SD of baseline **and** fewer than 3 extra lapses | Alert |
| Watch | Speed 1–1.5 SD below baseline **or** 3–5 more lapses than usual | Reduced, take a countermeasure |
| Act | Speed **≥ 1.5 SD** below baseline **or** 6+ more lapses than usual **or** ≥ 4 false starts | Impaired, put off critical tasks and rest |
| Building baseline | Fewer than 3 rested sessions | No judgement yet |
| Not scored | > 8 false starts, fewer than 15 scored signals, or ended early | Try again when ready |

**Lapses are compared with your usual count, not used raw.** The 355 ms line is a lab number. On a tablet, device delay pushes some normal taps over it. So the band uses **lapses above the baseline's average** ("extra lapses"). The 3 and 6 cutoffs are the original MINIGAME numbers (≤ 2 OK, 3–5 Watch, ≥ 6 Act). The raw 355 ms count is still shown in the details.

The 1.5 SD cutoff matches the "low score" line NASA's ISS cognition study used. In that study, 20% of in- and post-flight PVT speed scores crossed it (Dev et al. 2024).

### ⏸ 4.4 Orbit Breath (stretch: not built)

| Parameter | Value |
|---|---|
| Pace | 6 breaths/min by default: **4 s inhale / 6 s exhale** (a longer exhale is more calming) |
| Duration | 2 min default, skippable (crew-time budget in SCOPE.md) |
| Input | **Hold** a finger on the screen to inhale, **lift** to exhale |
| Pacer | A visual that grows and shrinks (look TBD), plus optional haptic or sound cues so eyes can close |
| Adherence metric | Average gap between their hold/lift timing and the pacer, as "% in sync" |
**HRV during breathing:** not measured. There's no live sensor hookup (excluded in SCOPE.md). Log adherence only, and **never** show made-up HRV numbers.

### 4.5 Countermeasure card (the MVP recovery step)
One primary action in large text, at most two lines below it, and the source. About 10 s to read.

| Band | Primary action | Also | Flags |
|---|---|---|---|
| OK | "You're alert. No action needed." | — | — |
| Watch | "Take a short movement break in bright light." (Before a critical task: "Double-check each step of the task before you start.") | Caffeine only if it fits your plan and isn't close to your next sleep · Double-check critical tasks today | — |
| Act | "Nap 20–30 min if your schedule allows." (Before a critical task: "Postpone the task, or have each step double-checked.") | Postpone or double-check critical tasks · Re-check after rest | **Crew medical officer flagged.** Plus "Marked for flight surgeon review" when escalated |

Source shown on Watch/Act: NASA HRP *Risk from Inadequate Sleep and Irregular Schedules*.

### 4.6 Result, record, escalation
**Up front:** status chip + headline, the cause ("Speed 1.6 SD slower than your baseline"), one mono line (median · lapses · false starts), then the card.
**One tap deeper (Details):** speed vs. baseline in SD, lapses vs. usual, personal lapses, false starts, slowing across the test, signals scored, self-rated sleepiness, baseline source, and how "normal" is measured.

**Record handed to the app** (`SessionRecord` in `minigame/src/signal-lock/types.ts`):
```json
{
  "sessionId": "uuid",
  "timestamp": "ISO-8601",
  "trigger": "low_hrv | short_sleep | long_wake | self_report | pre_task | manual",
  "checkIn": { "sleepiness": 1, "sleepinessReused": false },
  "rested": true,
  "pvt": {
    "durationSec": 180, "trials": 0, "medianRtMs": 0, "meanRtMs": 0,
    "meanSpeed": 0.0, "lapses": 0, "personalLapses": 0, "falseStarts": 0,
    "falseStartPct": 0.0, "slopeMsPerMin": 0.0,
    "band": "ok | watch | act | baseline | invalid",
    "vsBaselineSd": 0.0, "excessLapses": 0, "baselineSource": "own | sample | null"
  },
  "recovery": { "type": "countermeasure | none" },
  "recommendation": "the card's primary action",
  "cmoFlagged": false,
  "escalated": false,
  "complete": true
}
```

**Escalation rules:**
- Any **Act** → crew medical officer flagged (`cmoFlagged`).
- 2 Acts within 24 h, **or** Act right before a critical task → also marked for flight surgeon review in the next downlink (`escalated`). In the demo this is a logged flag only; no real messages.
- The app should say that ground replies may be delayed, from seconds near the Moon to as much as about 20 min each way at Mars, so local advice must stand on its own.

### 4.7 Gamification (rewards that don't backfire)
> **MVP:** a check-in streak only. Badges, personal records and crew goals are ⏸ parked.

The challenge suggests gamification, but rewarding a **high score** can push a tired astronaut to "power through" and hide impairment. So:
- **Reward completion and honesty**, not performance. Streaks come from completing scheduled checks and recovery sessions.
- **Personal records** are shown only for OK sessions, and only for consistency (for example, fewest lapses), never as the main goal.
- **Breathing badges** come from minutes of practice and sync %, not HRV values.
- **Optional crew-level goals** ("crew completed 90% of checks this week") with **no** individual leaderboard of alertness scores.

### 4.8 Touch and microgravity considerations
- Tap anywhere for Signal Lock, so the astronaut doesn't have to aim while their body drifts.
- Large touch targets everywhere else. Assume the tablet may be held, strapped to a thigh, or Velcroed to a wall.
- Hold-and-lift for breathing is chosen because it's forgiving of imprecise touches.
- Sound and haptics should be optional (shared quarters, sleeping crewmates).
- Orientation-agnostic if possible, since "up" is arbitrary in microgravity.

### 4.9 Edge cases
- **Interrupted session** (alarm, comms call): pause, then resume if within 2 min, otherwise mark incomplete and don't score.
- **Too many false starts** (> 8): stop and show "session invalid, try again when ready" rather than a misleading score.
- **Baseline drift** over a long mission: only rested sessions update the baseline, so gradual decline isn't hidden.
- **Practice effect:** early sessions improve just from practice. The warm-up trials and the pre-flight baseline sessions absorb most of this.

## 5. Hackathon scope

**MVP (built):**
- Prompt → sleepiness → test → result + countermeasure card
- Own-baseline scoring, sample demo baseline, escalation flags
- Session record handed to the app (the app stores it)

**Stretch:**
- Orbit Breath, offered from the countermeasure card
- Systems Check (go/no-go) as a second assessment

## 6. Open questions for the team
1. **Thresholds:** the bands are starting points. Tune after a few real sessions on the demo tablet.
2. **Crew medical officer / flight surgeon flagging:** a logged flag only in the demo (no real messages).

## 7. Background references
- NASA Human Research Program: *5 Hazards of Human Spaceflight* and *Risks of Human Spaceflight* (linked on the challenge Resources tab)
- Basner, Mollicone & Dinges (2011): validation of the 3-min PVT-B and its 355 ms lapse threshold
- Basner et al. (2015): NASA "Cognition" test battery for spaceflight
- Lehrer & Gevirtz (2014): HRV biofeedback / resonance-frequency breathing, about 6 breaths/min
- Karolinska Sleepiness Scale (1–9) for the self-report check-in
- Dev et al. (2024), *Frontiers in Physiology*: NASA Cognition battery in 25 ISS astronauts; source of the 1.5 SD cutoff, the pre-flight PVT reference, and in-flight sleep hours
- NASA OSDR studies OSD-939 (rat PVT after proton radiation), OSD-618 and OSD-479 (combined space stressors → cognitive deficits), OSD-1018 (isolation + radiation → motor learning). See RESEARCH.md for what each contains and how to use it

## 8. Build and integration
**Where:** `minigame/` is a small Vite + React + TypeScript project (the roadmap stack). **The drop-in module is `minigame/src/signal-lock/`**. The rest (`DevHarness.tsx`, `main.tsx`, `styles/base.css`) is a dev page that stands in for the app.

**Run it:**
```bash
cd minigame
npm install
npm run dev      # dev page at http://localhost:5173 (also reachable from a tablet on the same Wi-Fi)
npm test         # scoring rules
```

**Put it in the app (roadmap items 7–8):**
1. Copy `minigame/src/signal-lock/` to `src/features/signal-lock/`. It needs `react`, `lucide-react` and `tokens.css` loaded globally, nothing else.
2. Route `/check/signal-lock` renders `<SignalLockFlow …/>`:
   ```tsx
   <SignalLockFlow
     trigger="low_hrv"                       // from the status engine
     triggerCause="HRV 22% below your baseline (sleep window)"
     recentSleepiness={checkIn.sleepiness}    // { value, loggedAt } or null
     sleepHoursLastNight={sleep.hours}
     baseline={computeBaseline(sessions)}     // or SAMPLE_BASELINE in demo mode
     history={sessions}
     onComplete={(record) => saveSession(record)}
     onExit={() => navigate("/")}
     onSnooze={(min) => snoozePrompt(min)}
     onRecheck={(min) => scheduleRecheck(min)}
   />
   ```
3. Home's **Alertness** row: `toIndicatorStatus(last.pvt.band)` for the chip, `causeLine(last, [])` for the text.
4. `StatusChip` and the buttons inside the module are stand-ins. Swap them for the app's components when those exist (same tokens, same look).

**Design-doc differences to know about:** design doc 06 S6 shows "Speed 1.2 SD slower than NASA ISS pre-flight reference". The built version says "**than your baseline**" (own-baseline decision). The NASA reference appears in Details as the source of the SD. The separate Instructions screen (S5) is folded into the prompt and the "Tap anywhere to begin" screen, which saves a tap.
