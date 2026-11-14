# 06 — Screen Blueprints (tablet, portrait and landscape)

Each screen lists:
- goal and requirements served;
- portrait and landscape wireframes;
- components (doc 07);
- states;
- accessibility notes.

Crew-time limits come from SCOPE.md. **Wireframe legend:** `[ ]` = solid card · `≋ ≋` = glass · `( )` = button · `◉` = status chip.

---

## S1. Home (prototype first)

**Goal:** Status and one action readable in **5 s**.
**Serves:** R1, R4, R7, S7, M4.

**Landscape (1194×834):**
```
≋ Pulsaris                                                        ⚙ ≋   Toolbar 64px
≋──────────────────────────────────────────────────────────────────────≋
≋ ◉ WATCH                                                             ≋   Status header
≋ HRV 22% below your baseline (sleep window, last night)              ≋   (glass)
≋ ( Start 3-min alertness check )      Snooze ▾                       ≋
≋──────────────────────────────────────────────────────────────────────≋
┌ Today ─────────────────────────────────────┐ ┌ Body ───────────────┐
│ [ Daily check-in · due · 3 taps   (Start) ]│ │  fine-line figure    │
│ HRV            41 ms     ◉ Watch       ›   │ │  head ── Watch       │
│ Sleep          5 h 48 m  ◉ Watch       ›   │ │  heart ── OK         │
│ Resting HR     62 bpm    ◉ OK          ›   │ │  (secondary view)    │
│ Sleepiness     6 / 9     ◉ OK          ›   │ │  AI-generated illus. │
│ Mood           3 / 5     ◉ OK          ›   │ └──────────────────────┘
│ Alertness      —         ◉ No data     ›   │ 12-day check-in streak
│ Blood pressure 118/76    ◉ OK  6 d ago ›   │ ( Feeling unwell )
│ Blood sugar    94 mg/dL  ◉ OK  6 d ago ›   │
│ Temperature    —         ◉ No data     ›   │
└────────────────────────────────────────────┘
 Recorded data · MMASH (PhysioNet, ODbL)        captions in mono
```
The list takes 8 columns and the side column takes 4.

**Portrait (834×1194):**
- The toolbar and status header span the full width.
- The check-in card is full width.
- The indicator list is full width.
- Below it, a row with the body figure (left, 4 cols), then the streak and "Feeling unwell" (right, 4 cols).

**Components:** `Toolbar`, `StatusHeader`, `StatusChip`, `Button`, `DueCard`, `IndicatorRow`, `BodyFigure` (secondary), `StreakLine`, `ProvenanceNote`.

**States:**
- **Baseline building** (first run): the header reads "Building your baseline · 2 of 3 rested sessions".
- **All OK:** "OK · Nothing needs your attention". There is no action button, only "Daily check-in done ✓".
- **Act:** the header uses the Act chip. The action is the countermeasure. The line "Crew medical officer flagged" appears.
- **No data:** a row shows "No data" with its last-seen time.
- **Loading:** skeleton rows, with no spinner on the header.

**Accessibility:**
- Reading order: status header first, then the action, then the list.
- The status word and the cause are read together in one sentence.
- Each row is one button.

## S2. Daily check-in sheet

**Goal:** Finish in ≤60 s with 3 taps.
**Serves:** R3, R5, S4, M3.
```
┌ Daily check-in ─────────────────────────────── ✕ ┐
│ 1  MOOD                                          │
│ ( 1 Very low )( 2 )( 3 )( 4 )( 5 Very good )     │   5 large segments, words on ends
│ 2  SLEEPINESS  (Karolinska 1–9)                  │
│ [1 ··· 9] slider · "6 — Some signs of sleepiness" │   live verbal anchor
│ 3  LAST NIGHT'S SLEEP                            │
│ 5 h 48 m  · recorded 23:40 → 05:52   ( Correct ) ( Edit ) │
│                                    ( Done )      │
└──────────────────────────────────────────────────┘
```
- **Layout:** a bottom sheet in portrait, a centered sheet 640px wide in landscape.
- **Behavior:** Done saves all three answers. A sleepiness ≥7 can trigger the Signal Lock prompt (MINIGAME §2).
- **Accessibility:**
  - The slider is also keyboard-steppable.
  - The KSS anchor words are read aloud.

## S3. Indicator detail

**Goal:** Why this status, what the trend is, and what to do. Opens in 1 tap.
**Serves:** R2, R6, R7, S6, S8 and the challenge's "worth considering" questions.
```
‹ Home                     HRV
[ 41 ms   ◉ Watch                                   ]   hero (mono 56)
[ 22% below your baseline · 53 ± 6 ms (7 nights)    ]   cause + baseline
[ Sleep window 23:40–05:52 · Recorded · MMASH        ]   provenance
[ 7-day chart: graphite line, raw points, baseline   ]   one series, one highlight
[ band, latest point cobalt. Summary sentence.        ]
[ What to do      Start 3-min alertness check  (Go) ]   one action
[ Why it matters in space  · NASA HRP ↗             ]   disclosure
[ How it's measured · Can et al. 2019 ↗             ]   disclosure
[ Readings: Nov 14 05:52  41 ms · Nov 13 06:10 49 ms … ]
```
- **Landscape:** the hero and chart sit on the left (7 cols). The action, explainers and readings sit on the right (5 cols).
- **Blood pressure:** one color with two point shapes (● systolic, ◆ diastolic).
- **Alertness:** a lapse and speed chart of past sessions.

## S4. Entry sheets (on demand)

| Sheet | Opens from | Fields | Time |
|---|---|---|---|
| **BP + blood sugar** | Weekly prompt, or the resting-HR flag | Systolic / diastolic (mmHg), blood sugar (mg/dL), "fasting?" toggle | ~30 s |
| **Temperature** | The "Feeling unwell" button | Temperature (°C) + optional symptom chips (max 5) | ~10 s |

- **Inputs:** number fields 64px tall with Plex Mono values and a unit suffix, and a numeric keypad.
- **Validation:** impossible values are blocked inline.
- **Errors:** never discard input on error.

## S5. Signal Lock flow (triggered only; MINIGAME §4)

| Step | Screen | Time |
|---|---|---|
| Prompt | Why now (the trigger cause), "3 min", (Start) / Snooze 15·30·60. Never shown during a flagged critical task. | 5 s |
| Sleepiness | KSS slider. Skipped if logged <2 h ago. | ≤15 s |
| Instructions | "Tap anywhere as soon as the signal appears." One screen with a Start button. | 10 s |
| Test | Full-screen `--color-bg`. The stimulus is a cobalt ring with the ms counter. Any tap counts. Shows "Too early" on a false start. A 3:00 countdown sits in the corner in mono. Works in any orientation. | 3 min |

**Accessibility and environment:**
- The stimulus has an optional sound and haptic.
- Pause and resume within 2 min (MINIGAME §4.9).

## S6. Result + countermeasure card (MVP recovery step)

```
◉ WATCH  ·  Reduced alertness
Median 224 ms · 4 lapses (≥355 ms) · 1 false start
Speed 1.2 SD slower than NASA ISS pre-flight reference (Dev 2024)

[ DO THIS NOW                                     ]
[ Take a short movement break in bright light.    ]   one primary action, large
[ Also: caffeine only if it fits your plan and is ]
[ not close to your next sleep · double-check     ]
[ critical tasks today.        Source: NASA HRP ↗ ]
( Done )   ( Re-check in 60 min )
▸ Details: speed vs baseline · lapses · false starts · self-rated vs measured
```
- **Act:** the primary action is "Nap 20–30 min if your schedule allows", and the line "Crew medical officer flagged" appears (SUGGESTIONS §1).
- **OK:** "You're alert. No action needed."
- **Baseline building:** "No rating yet. Building your baseline."

## S7. Settings & About

A single card list with:
- **Baseline:** the PVT baseline source (NASA ISS reference preset or own sessions).
- **Data & credits:**
  - "Heart, HRV and sleep data replayed from MMASH v1.0.0 (PhysioNet), ODbL v1.0".
  - Dev et al. 2024.
  - NASA HRP.
- Disclaimer: "Educational prototype. Not a medical device."
- AI-use statement (E5).
- **Demo controls:** replay day and force trigger (labeled DEMO).
