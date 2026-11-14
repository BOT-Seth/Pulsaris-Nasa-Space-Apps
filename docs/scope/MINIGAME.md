# Cognitive Minigame: Ideas and Mechanics

> **Scope (see [SCOPE.md](SCOPE.md)):** MVP = **Signal Lock (triggered only) + optional 2-min Orbit Breath**. Concepts C, D, E, the radiation trigger, routine daily checks and extra gamification are in the parking lot. Those parts are kept below for reference but marked ⏸.
>
> **Status:** Ideas and mechanics only. **Visuals follow the team design system** in `docs/design/` (on the `mohammed-altaie` branch); nothing here sets colors, art, layout or animation style. Names below are working titles.

Part of the astronaut health monitoring app for the 2026 NASA Space Apps challenge "Create Health Monitoring Software for Astronauts on Space Missions". The challenge suggests prompting astronauts to "take measurements or complete specific actions from time to time", adding "a gamification system", and using color coding so a status reads at a glance. This minigame covers all three for fatigue and stress.

## 1. What the minigame is for

When the health app sees signs of **sleepiness** or **poor HRV** (heart rate variability), it offers a short session (about 5–7 minutes, touch tablet) that:

1. **Assesses** how alert the astronaut is right now, compared with their own rested baseline.
2. **Recovers** with an activity matched to the problem: paced breathing for low HRV and stress, or fatigue countermeasures for sleepiness.
3. **Logs** the result back to the health app, where it shows up in trend charts and color-coded status, and escalates if needed.

What it should **not** do: claim a game cures sleep debt. For real sleepiness the game's job is to measure honestly and point to real countermeasures (sleep, a nap, light, putting off critical tasks). A short burst of engagement only masks fatigue for a while.

## 2. Triggers (when the app offers a session)

All thresholds are **starting points** to tune later. They are compared with the astronaut's **personal baseline**, not population norms.

| Trigger | Suggested rule | Routes to |
|---|---|---|
| Low HRV | **Sleep-window** RMSSD (or ln RMSSD) more than 1 SD below the 7-day rolling mean. Measured during sleep so exercise and posture don't skew it | Stress / recovery branch |
| Short sleep | **< 5 h** alone, **or** < 6 h *plus* low HRV or sleepiness ≥ 7. Astronauts average ~6.4 h a night in flight (Dev et al. 2024), so "< 6 h" alone would fire too often for the crew-time budget | Sleepiness branch |
| Long wakefulness | Awake more than 16 h | Sleepiness branch |
| Self-report | Sleepiness check-in at 7 or higher on the 1–9 scale (Karolinska-style) | Sleepiness branch |
| Before a critical task | Scheduled before EVA, docking, robotics, and similar | Assessment only, then report |
| ⏸ Radiation event | Solar particle event or dosimeter alert logged (simulated in demo) | Assessment only, then daily checks for 7 days to watch for attention loss (based on OSDR OSD-939, see RESEARCH.md) |
| ⏸ Routine | Once a day at a fixed time, to build the baseline and trend | Parked: costs 3 min a day of crew time. The baseline builds from triggered and pre-task sessions instead |

Rules to stop nagging:
- At most one *prompted* session every 3 h unless the last result was red.
- The astronaut can snooze (15 / 30 / 60 min). Snoozes are logged.
- Never interrupt during a flagged critical activity. Queue the prompt instead.

## 3. Concept shortlist

### A. Signal Lock (vigilance / reaction time) ⭐ recommended assessment
A **Psychomotor Vigilance Task (PVT)** in a game wrapper. The astronaut "holds a comms link". At random moments a signal appears, and they tap anywhere on the screen as fast as possible. A counter shows their reaction time.
- **Measures:** sustained attention and reaction speed. This is the most sensitive standard measure of sleep loss. A 3-minute PVT (PVT-B) has been used in spaceflight research and in NASA's Cognition test battery.
- **Space evidence (OSDR):** OSD-939 used a rat version of this exact test and found that space-type radiation lowered accuracy and increased impulsive early responses.
- **Pros:** Validated, short, almost no learning curve, easy to compare with a baseline, works with a tap anywhere (good in microgravity).
- **Cons:** Repetitive. The game wrapper and feedback have to carry the engagement.

### B. Orbit Breath (paced breathing) ⭐ recommended recovery
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

**Recommendation:** build **A + B as one session flow** (spec below). C, D and E are parked (each adds crew time). If one comes back later, D goes first because it adds an impulse-control signal.

## 4. Deep spec: the "Recalibrate" session (Signal Lock + Orbit Breath)

### 4.1 Session flow

```
Trigger / manual start
   │
   ▼
[1] Check-in (≈15 s)  ── sleepiness 1–9, optional mood tag
   │
   ▼
[2] Signal Lock (3 min) ── alertness assessment
   │
   ▼
[3] Result + branch
   ├── Low-HRV / stress trigger ──► [4a] Orbit Breath (2 min, optional)
   ├── Sleepiness trigger ────────► [4b] Countermeasure card (+ optional 1–2 min breathing)
   └── Routine / pre-task ────────► skip to [5]
   │
   ▼
[5] Summary + log to health app (+ escalation if needed)
   │
   ▼
[6] Follow-up re-check scheduled (sleepiness branch: 30–60 min after nap/rest)
```

The astronaut can quit at any step. Partial data is saved and marked incomplete.

**Time budget:** check-in ≤ 15 s + Signal Lock 3 min + breathing ≤ 2 min (optional) ≈ **5 min worst case**, and it only happens when triggered.

### 4.2 Step 1: Check-in
- One slider: sleepiness 1 (extremely alert) to 9 (fighting sleep).
- Optional quick mood tag (calm / stressed / irritable / low / fine).
- Takes 15 seconds or less. It is stored with the session and shows how well the astronaut's own sense matches their measured performance. Fatigued people tend to underrate their impairment, which is useful to show them.

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
| No response | Signal times out at 30 s, counts as a lapse, and gives a stronger prompt (sound or haptic) |
| Warm-up | First 3 trials are not scored |

**Metrics recorded:** trial count, mean RT, median RT, mean 1/RT (speed, the most sensitive to sleep loss), fastest and slowest 10%, lapse count, personal-lapse count, false-start count, false-start % (the "premature responding" measure from OSD-939), and the slope (did they get worse across the 3 min?).

**Personal baseline:**
- Set **before the mission** from **3 rested sessions** (sleepiness ≤ 4 and slept ≥ 7 h the night before). Pre-flight baselines are standard for spaceflight cognitive testing, and this keeps in-mission crew time to triggered checks only. Until then, results are shown as "building baseline" with no red/yellow judgment.
- In the mission, any session that happens to be rested (e.g., a pre-task check) updates a rolling baseline of the last 10 rested sessions.
- **Demo:** a preset baseline built from **real NASA data**: pre-flight PVT scores from 24 ISS astronauts (speed 5.25, SD 0.24; accuracy 0.97, SD 0.04; Dev et al. 2024, Table 1). It's labeled as a reference baseline, not the user's own.
- **Why self-report isn't enough:** in the same study, astronauts' self-rated sleep and alertness had **no clear link** to their test scores. The check-in slider gives context, but only the measured test decides the band.

**Alertness score (0–100), first version:**
- Start at 100.
- Subtract points for speed below baseline (in baseline SDs), for each lapse, and for each false start.
- Exact weights are for the team to tune with playtest data. Show the parts of the score, not just the number.

**Status bands** (the colors themselves wait for the design):

| Band | Rule (starting point) | Meaning |
|---|---|---|
| Green | Speed within 1 SD of baseline **and** lapses ≤ 2 | Alert |
| Yellow | Speed 1–1.5 SD below baseline **or** 3–5 lapses | Reduced, consider countermeasures |
| Red | Speed **≥ 1.5 SD** below baseline **or** ≥ 6 lapses **or** ≥ 4 false starts | Impaired, put off critical tasks and rest |

The 1.5 SD cutoff matches the "low score" line NASA's ISS cognition study used. In that study, 20% of in- and post-flight PVT speed scores crossed it (Dev et al. 2024).

Every band must also carry a text label and an icon, not just a color.

### 4.4 Step 4a: Orbit Breath (recovery for low HRV and stress)

| Parameter | Value |
|---|---|
| Pace | 6 breaths/min by default: **4 s inhale / 6 s exhale** (a longer exhale is more calming) |
| Duration | 2 min default, skippable (crew-time budget in SCOPE.md) |
| Input | **Hold** a finger on the screen to inhale, **lift** to exhale |
| Pacer | A visual that grows and shrinks (look TBD), plus optional haptic or sound cues so eyes can close |
| Adherence metric | Average gap between their hold/lift timing and the pacer, as "% in sync" |
**HRV during breathing:** not measured. There's no live sensor hookup (excluded in SCOPE.md). Log adherence only, and **never** show made-up HRV numbers.

### 4.5 Step 4b: Countermeasure card (sleepiness branch)
A short list of next actions, chosen by the result band and the mission schedule (if it's available):
- **Green/Yellow:** short movement break, bright light, water, and caffeine **only if it fits the flight surgeon's plan and is far enough from the next sleep period**.
- **Yellow/Red:** take a nap if the schedule allows (keep it short, about 20–30 min, to avoid grogginess). Put off or double-check critical tasks.
- **Red:** advise rest. Flag it to the crew medical officer. Offer a re-check after rest.
- An optional 1–2 min Orbit Breath is offered for winding down before a nap.

The wording of countermeasures should be reviewed against NASA HRP fatigue and sleep resources before the demo.

### 4.6 Step 5: Summary, logging, escalation
**Summary screen shows, up front:** the band + label and **one recommended next action**. That's it.
**One tap deeper:** score, its parts (speed vs. baseline, lapses, false starts), self-rated vs. measured sleepiness, and recovery adherence or HRV change.

**Record saved to the health app (draft schema):**
```json
{
  "sessionId": "uuid",
  "timestamp": "ISO-8601",
  "trigger": "low_hrv | short_sleep | long_wake | self_report | pre_task | radiation_event | routine | manual",
  "checkIn": { "sleepiness": 1-9, "mood": "string|null" },
  "pvt": {
    "durationSec": 180, "trials": 0, "medianRtMs": 0, "meanRtMs": 0,
    "meanSpeed": 0.0, "lapses": 0, "personalLapses": 0, "falseStarts": 0,
    "falseStartPct": 0.0, "slope": 0.0,
    "vsBaselineSd": 0.0, "score": 0, "band": "green|yellow|red|baseline"
  },
  "recovery": {
    "type": "breath | countermeasure | none",
    "durationSec": 0, "adherencePct": 0,
    "hrvSource": "replay_mmash | none | simulated"
  },
  "recommendation": "string",
  "escalated": false,
  "complete": true
}
```

**Escalation rules (starting point):**
- 2 red results within 24 h, **or** red right before a critical task → flag to the crew medical officer and mark for flight surgeon review in the next downlink.
- The app should say that ground replies may be delayed, from seconds near the Moon to as much as about 20 min each way at Mars, so local advice must stand on its own.

### 4.7 Gamification (rewards that don't backfire)
> **MVP:** a check-in streak only. Badges, personal records and crew goals are ⏸ parked.

The challenge suggests gamification, but rewarding a **high score** can push a tired astronaut to "power through" and hide impairment. So:
- **Reward completion and honesty**, not performance. Streaks come from completing scheduled checks and recovery sessions.
- **Personal records** are shown only for green-band sessions, and only for consistency (for example, fewest lapses), never as the main goal.
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

**MVP (must have):**
- Manual start, plus a demo trigger driven by **replayed real HRV and sleep data from MMASH** (PhysioNet), labeled as "recorded data, not live". Simple simulated values are the fallback
- Check-in → Signal Lock → branch → Orbit Breath or countermeasure card → summary
- Baseline logic (with a "demo baseline" preset so judges see bands right away)
- Session record saved locally in the schema above

**Stretch:**
- Systems Check (go/no-go) as a second assessment
- Trend chart of score, lapses, and HRV over days, inside the main app

## 6. Open questions for the team
1. **HRV source:** NASA OSDR (the challenge data source) has **no human HRV or sleep data**. **Proposed:** replay real heartbeat and sleep data from the PhysioNet **MMASH** dataset (22 people, 24 h, beat-to-beat RR + sleep + mood/stress) as recorded sensor data. **Decided: no live wearable hookup** (data is only pulled). Gaps and license terms are in RESEARCH.md.
2. **Thresholds:** keep the starting rules above or change them? Who signs off?
3. **Crew medical officer / flight surgeon flagging:** in the demo, real notification or just a logged flag?
4. **Design hand-off:** once the design is finalized, the pacer, signal, band colors, icons, and summary layout get styled. No styling until then.
5. **Name:** keep the working titles ("Recalibrate", "Signal Lock", "Orbit Breath") or rename to match the app's branding?

## 7. Background references
- NASA Human Research Program: *5 Hazards of Human Spaceflight* and *Risks of Human Spaceflight* (linked on the challenge Resources tab)
- Basner, Mollicone & Dinges (2011): validation of the 3-min PVT-B and its 355 ms lapse threshold
- Basner et al. (2015): NASA "Cognition" test battery for spaceflight
- Lehrer & Gevirtz (2014): HRV biofeedback / resonance-frequency breathing, about 6 breaths/min
- Karolinska Sleepiness Scale (1–9) for the self-report check-in
- Dev et al. (2024), *Frontiers in Physiology*: NASA Cognition battery in 25 ISS astronauts; source of the 1.5 SD cutoff, the pre-flight PVT reference, and in-flight sleep hours
- NASA OSDR studies OSD-939 (rat PVT after proton radiation), OSD-618 and OSD-479 (combined space stressors → cognitive deficits), OSD-1018 (isolation + radiation → motor learning). See RESEARCH.md for what each contains and how to use it
