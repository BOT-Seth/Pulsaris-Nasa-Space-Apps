# 05 — Information Architecture

The scope comes from `docs/scope/SCOPE.md`. This doc turns it into screens and flows.

## 1. Indicators

| Indicator | How it gets in | Astronaut effort | Unit | Shown on Home |
|---|---|---|---|---|
| Heart rate (resting) | Passive. Replayed MMASH recording. | None | bpm | Row |
| HRV (RMSSD, sleep window) | Passive (MMASH RR intervals) | None | ms | Row |
| Sleep (total hours) | Passive (MMASH actigraphy) + 1-tap confirm in check-in | Confirm | h min | Row |
| Mood | Daily check-in | 1 tap (1–5) | score | Row |
| Sleepiness | Daily check-in | 1 tap (KSS 1–9) | KSS | Row |
| Alertness | Signal Lock result (triggered only) | 3 min, rare | ms / band | Row (last result) |
| Blood pressure + blood sugar | **One combined prompt**: weekly, or early when resting HR is flagged | ~30 s | mmHg, mg/dL | Rows |
| Body temperature | Only after tapping **"Feeling unwell"** | ~10 s | °C | Row |

**Not in the app:** exercise, radiation, crew data, postflight data (SCOPE.md parking lot).

## 2. Screen map

There is no tab bar. Home is the hub, and everything opens from it and returns to it.

```
Home
├── Status header (glass): overall status · top issue (names its cause) · ONE action button
├── [Due] Daily check-in card ──► Check-in sheet (≤60 s)
├── [Due] BP + blood sugar prompt card ──► Entry sheet
├── Indicator list (rows: label · value · status) ──► Indicator detail (7-day trend)
├── Body figure (small, secondary; mirrors row statuses; tap region = same as tapping its row)
├── Streak line ("12-day check-in streak")
├── "Feeling unwell" button ──► Temperature entry sheet
└── Toolbar (glass): "Pulsaris" · settings icon ──► Settings & About

Signal Lock flow (opened by a trigger prompt or the status action):
Prompt (why now · 3 min · Start / Snooze 15·30·60) ──► Sleepiness slider (skipped if logged <2 h ago)
──► Instructions (one screen) ──► Test (full-screen, 3 min) ──► Result + countermeasure card ──► Home
```

## 3. Routes

| Route | Screen |
|---|---|
| `/` | Home |
| `/indicator/:id` | Indicator detail (`heart-rate`, `hrv`, `sleep`, `mood`, `sleepiness`, `alertness`, `blood-pressure`, `blood-sugar`, `temperature`) |
| `/check/signal-lock` | Signal Lock flow |
| `/check/result/:sessionId` | Result + countermeasure card |
| `/settings` | Settings & About |
| `?sheet=checkin` · `?sheet=bp-glucose` · `?sheet=temperature` | Sheets |

## 4. Top issue selection (Home header)

1. Collect every indicator's status.
2. If any is **Act**, the overall status is Act. Otherwise, if any is **Watch**, it's Watch. Otherwise it's OK. If every indicator is No data, it's No data.
3. The **top issue** is the worst indicator. Break ties in this order: alertness, HRV, sleep, sleepiness, BP, blood sugar, temperature, heart rate, mood.
4. The issue text names its cause, e.g. *"HRV 22% below your baseline (sleep window)"* (Tjoa & Guan 2021; SCOPE.md).
5. The **one action** comes from the trigger table (MINIGAME §2). Examples: "Start 3-min alertness check", "Log blood pressure + blood sugar", "Follow rest plan".

## 5. Data contract

```ts
type Provenance = "self-reported" | "recorded-dataset" | "sample" | "nasa-reference";
// recorded-dataset = MMASH replay (ODbL, credit shown). nasa-reference = Dev et al. 2024 PVT preset.

interface Reading {
  id: string;
  indicator: IndicatorId;
  value: number | { systolic: number; diastolic: number };
  unit: string;                 // "bpm" | "ms" | "h" | "score" | "KSS" | "mmHg" | "mg/dL" | "°C"
  takenAt: string;              // ISO 8601
  provenance: Provenance;
  source?: string;              // e.g. "MMASH user_7" | "Dev et al. 2024"
}

interface IndicatorStatus {
  indicator: IndicatorId;
  status: "ok" | "watch" | "act" | "none";
  cause: string;                // shown verbatim as the top-issue line
  rule: string;                 // which SCOPE/MINIGAME rule fired
  baseline?: { mean: number; sd: number; n: number; label: string };
  lastReadingAt?: string;
}
// Signal Lock sessions: schema in MINIGAME.md §4.6, unchanged.
```
