# 05 — Information Architecture

## 1. The data model the IA is built on

The UI is organized by **body system**, which is what the clickable figure shows. Each system groups the **indicators** that HRP links to a hazard.

| System (region on figure) | Indicators: P0 core | Indicators: P1/P2 | HRP hazard → risk (source: nasa.gov/hrp) |
|---|---|---|---|
| **Heart & circulation** (chest) | Heart rate (bpm), Blood pressure (mmHg) | HRV (ms), P2 | Gravity fields → Cardiovascular adaptations |
| **Metabolism** (abdomen) | Blood sugar (mg/dL) | Calcium and sodium from crew labs (Crew Science) | Hostile/closed environment → Inadequate food & nutrition |
| **Brain, sleep & mood** (head) | Sleep (h), Mood (1–5 scale) | Cognitive check (reaction time), P2 | Isolation & confinement → Inadequate sleep; Behavioral conditions |
| **Temperature & immune** (whole-body outline) | Body temperature (°C) | — | Hostile/closed environment → Altered immune response |
| **Blood** (arm/vessels) | — (lab-only) | Hemoglobin, RBC, WBC from NASA OSDR crew labs | Gravity / radiation → space anemia evidence (OSD-569) |
| **Bones & muscles** (legs) | Exercise minutes (logged) | Calcium (crew labs) | Gravity fields → Bone changes; Reduced fitness |

- The six P0 indicators are exactly the ones NASA names: BP, HR, blood sugar, body temperature, sleep hours, mood. Exercise minutes is added because HRP names exercise as the main countermeasure for bone and muscle loss. Blood labs come from the NASA dataset.
- **Radiation** is a hazard, not a body system. It appears as a P2 environment layer (doc 10).

## 2. Navigation model

```
App shell
├── Header ── [Avatar → Profile]   [Mission pill: "ISS · Day 42 ⌄"]   [Bell → Insights]
│
├── Tab 1  TODAY  (home)
│     ├── Body figure (6 regions) ──tap──► System sheet ──► Metric detail
│     ├── Side stats (3 headline indicators) ──tap──► Metric detail
│     ├── Routine card ("3 of 5 check-ins done") ──► Check-in sheet
│     ├── Latest-change highlight ──► Insight detail
│     └── System cards (6) ──► System sheet
│
├── Tab 2  TRENDS
│     ├── Indicator list (grouped by system, each with a sparkline) ──► Metric detail
│     └── Metric detail  [Day | Week | Mission | All]
│           ├── Chart + baseline band + reference band
│           ├── Readings list (with source + time)
│           ├── "Why this matters in space" (HRP)
│           ├── "How to measure" instructions
│           └── "Compare with real crew data" ──► Crew Science (filtered)
│
├── Tab 3  INSIGHTS
│     ├── Active items (sorted by severity) ──► Insight detail (what, why, what to do, escalation)
│     ├── Routine & streaks (gamification, S5)
│     └── History
│
├── Tab 4  CREW SCIENCE  (NASA data)
│     ├── Dataset intro (Inspiration4, OSDR, caveats)
│     ├── Lab marker picker (Hemoglobin, Glucose, Calcium, WBC …)
│     ├── Crew trajectories chart (L-92 → R+194) with lab reference band
│     └── Sources & references
│
├── Global overlays
│     ├── Check-in sheet (multi-step, any time, from FAB/Routine/Insight)
│     ├── System sheet (from figure or system card)
│     └── Onboarding / baseline setup (first run)
│
└── Profile (from avatar)
      ├── Baseline (view and re-establish)
      ├── Mission context: environment (spacecraft / station / rover / surface base), mission phase (preflight / in-flight / postflight)
      ├── Units (°C/°F; mg/dL/mmol/L)
      ├── Data & privacy (export, clear, simulated-data toggle)
      └── About, disclaimer, references, AI-use statement
```

## 3. Why four tabs, and what we cut

| Candidate from the brief | Decision | Reason |
|---|---|---|
| Home / Health overview | **Tab: Today** | Core (R1, R4) |
| Detailed monitoring | **Merged into Trends → Metric detail** | Overview and detail are one list-detail flow |
| Body / physiological systems | **Not a tab.** It is the Today hero plus the System sheet | The body is the entry point; a separate tab would duplicate Today |
| Trends / analytics | **Tab: Trends** | S6 dynamic charts |
| Alerts / insights | **Tab: Insights** | R2 guidance, S4 prompts, S5 gamification, escalation |
| Mission dashboard | **Cut** as a screen. Mission context is a header pill and a Profile setting. | Avoid space theming for its own sake; S3 environments are just context |
| Profile / settings | **From avatar**, not a tab | Rarely used |
| NASA data view | **Tab: Crew Science** | The Relevance criterion requires NASA data to be core and visible |

## 4. Navigation rules

1. Use 4 tabs. Never add a 5th without updating this doc.
2. Every screen is **at most 2 taps** from Today.
3. Sheets (Check-in, System) open over the current tab. Closing returns to the exact scroll position.
4. Metric detail is a pushed route (`/trends/:indicatorId`) with a back button. It is deep-linkable for the demo.
5. The mission pill changes **context** (phase and environment) and never navigates away.
6. Desktop (≥1024px): a left rail replaces the bottom bar. Sheets become a right-side panel 420px wide. Metric detail opens in place within the content column.

## 5. Routes

| Route | Screen |
|---|---|
| `/` | Today |
| `/trends` | Trends list |
| `/trends/:indicatorId` | Metric detail (`heart-rate`, `blood-pressure`, `blood-sugar`, `temperature`, `sleep`, `mood`, `exercise`) |
| `/insights` | Insights |
| `/insights/:insightId` | Insight detail |
| `/science` | Crew Science |
| `/science/:marker` | Crew Science with a marker preselected |
| `/profile` | Profile & settings |
| `?sheet=checkin` / `?sheet=system&id=heart` | Overlays (URL-addressable for the demo) |

## 6. Core data contract (shared by all screens)

Agree on this before splitting the work.

```ts
type Provenance = "self-reported" | "simulated" | "nasa-osdr" | "device";

interface Reading {
  id: string;
  indicator: IndicatorId;          // "heart-rate" | "blood-pressure" | ...
  value: number | { systolic: number; diastolic: number };
  unit: string;                    // "bpm", "mmHg", "mg/dL", "°C", "h", "score"
  takenAt: string;                 // ISO 8601
  provenance: Provenance;
  context?: { posture?: "seated" | "standing" | "supine"; afterExercise?: boolean; note?: string };
}

interface IndicatorStatus {
  indicator: IndicatorId;
  status: "good" | "watch" | "caution" | "alert" | "none";
  reasons: string[];               // human-readable "why this status" lines
  baseline?: { mean: number; low: number; high: number; n: number };
  reference?: { low: number; high: number; source: string };   // cited range
  lastReadingAt?: string;
}
```

**Simulated data has `provenance: "simulated"` and is always rendered with the Simulated badge.** No exceptions.
