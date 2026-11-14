# 06 — Screen Blueprints

Every approved screen follows the same template:
1. Goal
2. Requirements served
3. Hierarchy
4. Wireframe (mobile)
5. Components
6. Data
7. Primary interactions
8. Secondary interactions
9. Navigation
10. Empty, loading and error states
11. Tablet/desktop
12. Accessibility

Component names refer to doc 07. Requirement IDs (R, S, E) refer to doc 01.

**Wireframe legend:**
- `[ ]` is a glass card.
- `( )` is a pill or button.
- `◉` is a status chip.
- `~~` is a chart.
- Dimensions are for a 390px-wide phone.

---

## S1. Today (Home) — **the first screen to prototype**

1. **Goal:** "Am I OK today? What changed? What should I do next?" Answer in under 10 seconds.
2. **Serves:** R1, R3, R4, R7, S2 (clickable figure), S4 (routine), S7 (color coding), E2 (NASA-sourced context line).
3. **Hierarchy:**
   1. Body figure with region status.
   2. Three headline indicators.
   3. Routine and next action.
   4. The most important change.
   5. System cards.
4. **Wireframe:**
```
┌──────────────────────────────────────┐
│ (AV)     ( ISS · Day 42 ⌄ )     (🔔•)│  AppHeader 56px
│                                      │
│ RESTING HR         ╭─────╮           │  HeroStage (glass, radius-xl)
│ 64 bpm   ◉ In range│ (o) │  ← body   │  left: 3 × SideStat (metric-lg)
│                    │ /|\ │  figure   │  right: BodyFigure 60% width,
│ BLOOD PRESSURE     │  |  │  6 hot-   │  fades out at the bottom
│ 118/76 mmHg ◉ Watch│ / \ │  spots    │  RegionHotspot dots pulse once
│                    ╰─────╯           │  on load only
│ SLEEP                                │
│ 6 h 11 m ◉ Watch          [AI-gen]   │  Badge in stage corner (E5)
│ See all data ›                       │
├──────────────────────────────────────┤
│[ Today's routine        3 of 5  ◔   ]│  RoutineCard: SemiGauge + next
│[ Next: Blood pressure · 2 min (Log) ]│  action button
├──────────────────────────────────────┤
│[ ◉ Watch  Sleep below your baseline ]│  InsightHighlight (1 item, highest
│[ 3 nights < 6.5 h. Why it matters › ]│  severity) → Insight detail
├──────────────────────────────────────┤
│ Your systems                         │  SectionHeader
│[ ♥ Heart & circulation   ◉ In range ]│  SystemCard × 6, each tinted,
│[   HR 64 · BP 118/76   ~~~~~~~~~~   ]│  with a 7-day Sparkline
│[ ☾ Brain, sleep & mood   ◉ Watch    ]│
│ …                                    │
├──────────────────────────────────────┤
│  Today   Trends   Insights   Science │  BottomNav (glass, 64px)
└──────────────────────────────────────┘
                          (+ Log) FAB, above nav, right
```
5. **Components:**
   - `AppHeader`, `MissionPill`, `HeroStage`, `BodyFigure`, `RegionHotspot`, `SideStat`, `StatusChip`
   - `RoutineCard` (`SemiGauge`), `InsightHighlight`, `SystemCard` (`Sparkline`)
   - `BottomNav`, `Fab`, `Badge` (AI-generated, Simulated)
6. **Data:**
   - Latest `Reading` per indicator.
   - `IndicatorStatus` for 6 systems.
   - Routine schedule (which check-ins are due).
   - The single top insight.
   - Mission context.
7. **Primary interactions:**
   - Tap a region or a SystemCard to open the **System sheet**.
   - Tap a SideStat to open **Metric detail**.
   - Tap Log (FAB or routine) to open the **Check-in sheet**.
8. **Secondary interactions:**
   - Mission pill opens a menu: phase and environment.
   - Bell opens Insights.
   - Pull to refresh recomputes statuses.
9. **Navigation:** Root of Tab 1. Sheets overlay it, and closing restores scroll position.
10. **States:**
    - *Loading:* skeleton numbers and a figure silhouette with no hotspots.
    - *Empty (first run):* the figure shows all regions `none`. The stats area shows "Set your baseline: 3 quick check-ins" and a primary button. Routine shows 0 of 5.
    - *Stale:* a SideStat older than its expected interval shows a `none` chip reading "Last: 2 d ago".
    - *Error (corrupt local data):* an inline banner reading "Some readings couldn't be loaded" with a Retry button. Show what loaded.
    - *Simulated mode:* a persistent `Badge` in the header reading "Simulated demo data".
11. **Tablet/desktop:**
    - **md:** the HeroStage is 2 columns (stats | figure) and system cards form a 2-column grid.
    - **lg:** a 12-column layout. HeroStage spans 7 columns. A right column of 5 holds Routine, the Insight highlight and the latest readings. System cards form a 3-column grid below.
12. **Accessibility:**
    - The figure has `role="group"` with the label "Body systems".
    - Each hotspot is a `<button>` labeled with name and status, e.g. "Heart and circulation, In range".
    - Tab order: stats, regions (head to feet), routine, insights, systems.
    - The SystemCard list duplicates every region, so the figure is never the only path.

---

## S2. Check-in sheet (overlay)

1. **Goal:** Log one or more readings in under 30 seconds each, with guidance on how to measure.
2. **Serves:** R3, R5, R6 (units), S4, S8 (instructions).
3. **Hierarchy:**
   1. What to log.
   2. The input.
   3. How to measure.
   4. Save.
4. **Wireframe:**
```
┌──────────────── sheet (radius-xl top, solid surface) ┐
│  ───  (grabber)                                       │
│  Log a reading                              ( ✕ )     │
│  ( HR )( BP )( Sugar )( Temp )( Sleep )( Mood )       │  Segmented/Chip row
│                                                       │
│  Blood pressure                                       │
│  [ 118 ] / [ 76 ]  mmHg                               │  NumberField × 2
│  Posture  ( Seated | Standing | Supine )              │  SegmentedControl
│  ▸ How to measure in microgravity  (expand)           │  Disclosure
│                                                       │
│  Taken  ( Now ⌄ )                                     │
│  ( Save reading )                       primary, full │
└───────────────────────────────────────────────────────┘
```
   **Mood** uses 5 large face-free tiles labeled 1–5 ("Very low" to "Very good"). **Sleep** uses an hours/minutes stepper.
5. **Components:** `Sheet`, `ChipGroup`, `NumberField`, `SegmentedControl`, `Disclosure`, `Button`.
6. **Data:** Writes a `Reading` with `provenance: "self-reported"`. Reads the last value as a placeholder.
7. **Primary:** Enter the value and save. A toast says "Saved · BP 118/76". The sheet stays open on the next due indicator when entered from Routine.
8. **Secondary:**
   - Add context (after exercise, note).
   - Change the time taken.
9. **Navigation:** Opens from the FAB, Routine, an Insight's "Re-measure", or Metric detail's "Log". Closing returns to the origin.
10. **States:**
    - *Validation:* a physiologically impossible value (e.g. HR 400) shows an inline error and blocks saving.
    - *Unusual but possible* values show a confirm step.
    - *Save error:* an inline retry. Never discard the input.
11. **Tablet/desktop:** A right-side panel 420px wide (`--shadow-raised`) instead of a bottom sheet.
12. **A11y:**
    - Focus moves to the sheet title and is trapped while open.
    - Esc closes.
    - Each input has a label plus a unit in its accessible name ("Systolic, millimeters of mercury").
    - Errors use `aria-describedby`.

---

## S3. System sheet (overlay)

1. **Goal:** Understand one body system: its status, its indicators and why it matters in space.
2. **Serves:** S2 (figure shows function and health status), R2, S8, E2/E3 (cited HRP).
3. **Hierarchy:**
   1. System name and status.
   2. Its indicator rows.
   3. Function and why it matters in space.
   4. What to do.
4. **Wireframe:**
```
┌──────────── sheet over Today (figure zooms to region) ┐
│  ♥ Heart & circulation            ◉ In range          │
│  Pumps blood and oxygen to every tissue.              │  function, 1 line
│  [ Heart rate      64 bpm   ◉ In range   ~~~~  › ]    │  MetricRow × n
│  [ Blood pressure  118/76   ◉ Watch      ~~~~  › ]    │
│  Why it matters in space                              │
│  In weightlessness, fluids shift toward the head and  │
│  the heart adapts… [NASA HRP ↗]                       │  SourceTag
│  What you can do                                      │
│  • Keep up daily aerobic exercise …                   │
│  ( Log a reading )   ( See trends )                   │
└───────────────────────────────────────────────────────┘
```
5. **Components:** `Sheet`, `StatusChip`, `MetricRow` (`Sparkline`), `ExplainerBlock`, `SourceTag`, `Button`.
6. **Data:**
   - `IndicatorStatus` per indicator in the system.
   - Content entry from `content/systems.json`: function, hazard, risk, countermeasures, source URLs.
7. **Primary:** Tap a MetricRow to open Metric detail.
8. **Secondary:** The Log and See trends buttons.
9. **Navigation:** Opens from a figure region or a SystemCard. On mobile the figure behind it scales and pans so the region stays visible (doc 08 §B).
10. **States:**
    - *No readings:* rows show "No data yet" and a Log button.
    - *Content missing:* hide that section. Never show placeholder lorem.
11. **Desktop:** A right panel. The figure stays visible and highlighted on the left.
12. **A11y:** Opening announces "Heart and circulation, In range, 2 indicators".

---

## S4. Trends (list)

1. **Goal:** Scan all indicators over time and pick one to explore.
2. **Serves:** S6, R1.
3. **Hierarchy:**
   1. Range control.
   2. Indicator rows grouped by system.
4. **Wireframe:**
```
│ Trends                                  ( Week ⌄ ) │
│ HEART & CIRCULATION                                 │
│ [ Heart rate   64 bpm  ▲ 3 vs baseline  ~~~~~~~ › ] │  TrendRow: value, TrendDelta,
│ [ Blood press. 118/76  ● stable         ~~~~~~~ › ] │  Sparkline with baseline band
│ BRAIN, SLEEP & MOOD                                 │
│ [ Sleep        6 h 11  ▼ 0.9 h          ▮▮▮▯▮▮▮ › ] │  bars for sleep
│ …                                                   │
```
5. **Components:** `PageHeader`, `RangeSelect`, `SectionHeader`, `TrendRow` (`TrendDelta`, `Sparkline`).
6. **Data:** All `Reading`s in range. Baseline per indicator.
7. **Primary:** Tap a row to open Metric detail.
8. **Secondary:** Change the range.
9. **Navigation:** Root of Tab 2.
10. **States:**
    - *Empty:* "No readings yet. Log your first check-in." with a button.
    - *Loading:* row skeletons.
    - An indicator with fewer than 3 readings shows "Not enough data for a trend" instead of a sparkline.
11. **Desktop:** A 2-column grid of rows. Metric detail opens in the right column (master–detail).
12. **A11y:** Each sparkline is `aria-hidden`. The row's accessible name includes "up 3 beats per minute versus baseline this week".

---

## S5. Metric detail — **second screen to prototype**

1. **Goal:** Understand one indicator: the current value, its trend, why it matters, how to measure it and how it compares with real crew data.
2. **Serves:** R1, R2, R6, R7, S6, S7, S8, E2, E3, and NASA's "worth considering" questions (doc 01 §3.3).
3. **Hierarchy:**
   1. Headline value and status.
   2. The chart.
   3. "What this means".
   4. Readings.
   5. Explainers.
   6. NASA comparison.
4. **Wireframe:**
```
│ ‹ Trends                  Blood pressure     ( Log ) │
│ ┌───────────────────────────────────────────────┐   │
│ │ 118/76 mmHg      ◉ Watch                      │   │  MetricHero (display type)
│ │ ▲ 6 systolic vs your baseline · 08:12 today   │   │  TrendDelta + timestamp
│ │ Self-reported                                 │   │  ProvenanceBadge
│ └───────────────────────────────────────────────┘   │
│ ( Day | Week | Mission | All )                      │  SegmentedControl
│ [ ~~~~ chart: baseline band, reference band,      ] │  TimeSeriesChart / RangeBarChart
│ [      raw points, monotone line, goal/threshold  ] │  (BP = range bars, 2 point shapes)
│ [ Avg 116/75 · 2 readings above your range        ] │  chart summary sentence
│ What this means                                      │  StatusExplanation: why status,
│ Your systolic has been above your usual range for   │  rule that fired, next step
│ 2 days. Re-measure seated after 5 min rest.         │
│ ▸ Why it matters in space   [NASA HRP ↗]            │  Disclosure × 3
│ ▸ How to measure                                    │
│ ▸ When to contact your flight surgeon               │
│ Readings                                             │  ReadingList (time, value,
│ 08:12  118/76  Seated  Self-reported                │  context, provenance)
│ [ Compare with real crew data (NASA OSDR) › ]       │  only for indicators with crew labs
```
5. **Components:**
   - `PageHeader` (back), `MetricHero`, `StatusChip`, `TrendDelta`, `ProvenanceBadge`, `SegmentedControl`
   - `TimeSeriesChart` / `RangeBarChart` / `LollipopChart`, `ChartSummary`, `StatusExplanation`
   - `Disclosure`, `ReadingList`, `LinkCard`
6. **Data:**
   - Readings and the baseline.
   - The cited reference range (`reference.source`).
   - Content for explainers.
   - Crew-lab availability.
7. **Primary:**
   - Change the range.
   - Scrub the chart: a tooltip shows value, time and provenance.
   - Log a reading.
8. **Secondary:**
   - Expand explainers.
   - Open Crew Science.
   - Tap a reading to edit or delete it.
9. **Navigation:** Pushed route `/trends/:id`. Back returns to the origin (Trends, System sheet or Today).
10. **States:**
    - *Fewer than 3 readings:* the chart shows the points only, plus "Log 3+ readings to see your baseline".
    - *No baseline:* the status uses the reference range only, labeled "Reference range only".
    - *Gaps:* the line breaks (doc 08).
    - *Stale:* the hero shows the timestamp in caution text, "Last reading 3 days ago", with a Log button.
11. **Desktop:** A 2-column layout. Hero and chart on the left (7 columns). Explanation, readings and explainers on the right (5 columns).
12. **A11y:**
    - The chart has `role="img"` with `aria-label` set to the ChartSummary sentence.
    - A "View as table" toggle shows an accessible table.
    - Dates are written unambiguously ("Nov 14, 08:12").

---

## S6. Insights (+ Insight detail)

1. **Goal:**
   - See everything that needs attention, ranked.
   - Know exactly what to do and when to escalate.
   - Stay engaged with the routine.
2. **Serves:** R2, R4, S4, S5 (gamification), NASA's "when warrant attention… what actions".
3. **Hierarchy:**
   1. Active items, sorted alert, then caution, then watch.
   2. Routine and streak.
   3. History.
4. **Wireframe:**
```
│ Insights                                            │
│ [ ◉ Contact flight surgeon                        ] │  InsightCard (solid surface for
│ [ Temperature 38.4 °C, 2 readings, 1 h apart      ] │  alert severity, never glass)
│ [ What to do now ›                                ] │
│ [ ◉ Watch · Sleep below baseline 3 nights         ] │
│ Routine                                              │
│ [ 🔥 5-day check-in streak   ●●●●●○○             ] │  StreakCard (S5)
│ [ Badges: Baseline set · 7-day streak (locked)    ] │
│ History ›                                            │
```
   **Insight detail** answers four questions, in this order:
   1. **What happened** (with data).
   2. **Why it matters in space** (HRP, cited).
   3. **What to do now** (numbered steps).
   4. **When to escalate** (the explicit rule).

   It also has buttons: Re-measure, Mark as handled, Share with flight surgeon (P2, export).
5. **Components:** `PageHeader`, `InsightCard`, `StatusChip`, `StreakCard`, `BadgeTile`, `StepList`, `Button`.
6. **Data:** Insights generated by the rules engine (doc 09 §4). Routine completion history.
7. **Primary:** Open an insight and follow its steps.
8. **Secondary:** Mark as handled (it moves to History). View History.
9. **Navigation:** Tab 3. The bell in the header also opens it.
10. **States:**
    - *Nothing active:* "All clear. Nothing needs your attention." The Routine section still shows.
    - *Loading:* card skeletons.
11. **Desktop:** List on the left, detail on the right.
12. **A11y:**
    - New alert-level insights are announced through a polite `aria-live` region.
    - Severity is in the text, not only the color.

---

## S7. Crew Science (NASA data)

1. **Goal:** See how real astronauts' blood markers changed before and after spaceflight, and how that relates to your indicators.
2. **Serves:** **E2 Relevance and E4 NASA data**, E3 Validity, S6.
3. **Hierarchy:**
   1. What this data is.
   2. Marker picker.
   3. Trajectory chart.
   4. Interpretation.
   5. Caveats and sources.
4. **Wireframe:**
```
│ Crew Science                                         │
│ [ Real data from NASA OSDR · Inspiration4 (2021)  ] │  DatasetCard: mission, 4 crew,
│ [ 4 crew · 3-day orbital flight · 7 blood draws   ] │  timepoints, OSD IDs, caveat
│ ( Hemoglobin | Glucose | Calcium | WBC | … )         │  ChipGroup (marker)
│ [ ~~ 4 crew lines, L-92 → R+194, launch/return     ] │  CrewTrajectoryChart: x = days
│ [    markers, lab reference band, direct labels    ] │  relative to flight, gap for flight
│ [ "Hemoglobin was within the lab range for all 4   ] │  ChartSummary (data-driven)
│ [  crew; C00x changed most at R+1."               ] │
│ What this suggests                                   │  ExplainerBlock (cited papers,
│ …space anemia research [source ↗]                    │  verified DOIs only)
│ Limitations                                           │  CaveatList (short mission,
│ • 3-day mission, not long-duration  • n = 4          │  n=4, unit notes)
│ Sources: OSD-569 ↗  OSD-575 ↗                        │
```
5. **Components:** `PageHeader`, `DatasetCard`, `ChipGroup`, `CrewTrajectoryChart`, `ChartSummary`, `ExplainerBlock`, `CaveatList`, `SourceTag`.
6. **Data:** `data/osdr/cbc.json` and `data/osdr/cmp.json`, produced at build time from OSD-569 and OSD-575 (doc 10).
7. **Primary:** Pick a marker. Hover or tap a point for crew ID, timepoint, value and lab range.
8. **Secondary:**
   - Toggle "Show my readings" to overlay the user's glucose or temperature on a separate, aligned small multiple. **Never** on the same axis as lab data from a different context.
   - Open the OSDR source.
9. **Navigation:** Tab 4. It also opens from Metric detail's "Compare with real crew data" with the marker preselected.
10. **States:**
    - *Data file missing:* "NASA data couldn't be loaded" with a link to the source. The rest of the app is unaffected.
    - *Marker with no data at a timepoint:* break the line.
11. **Desktop:** The chart takes 8 columns. The interpretation and caveats sit beside it in 4 columns.
12. **A11y:**
    - The chart has a data-table alternative.
    - Crew lines are direct-labeled (C001–C004) as well as color-coded.
    - Timepoints are read out as "3 days before launch" rather than "L-3".

---

## S8. Profile & settings

1. **Goal:** Set the context that changes how status is computed, and control the data.
2. **Serves:** S3 (environments), Validity (baselines), privacy, E5 and E9 (AI-use and references statements).
3. **Hierarchy:**
   1. Identity (initials avatar, callsign).
   2. Mission context.
   3. Baseline.
   4. Units.
   5. Data and privacy.
   6. About.
4. **Wireframe:** A grouped settings list (`SettingsGroup` of `SettingsRow`s) on glass-strong.
5. **Components:** `PageHeader`, `Avatar`, `SettingsGroup`, `SettingsRow`, `SegmentedControl`, `Toggle`, `Button` (destructive variant).
6. **Data:** Mission context, baseline summary per indicator, unit preferences, simulated-data flag.
7. **Primary:**
   - Set environment: spacecraft, station, rover or surface base.
   - Set phase: preflight, in-flight or postflight.
8. **Secondary:**
   - Re-establish the baseline.
   - Export JSON.
   - Clear data, behind a confirm dialog.
   - Turn demo data on or off.
9. **Navigation:** From the avatar. Back returns to the origin.
10. **States:** Clearing data needs a typed confirmation.
11. **Desktop:** A centered column, max 640px.
12. **A11y:**
    - Toggles are labeled switches.
    - The destructive action is described in text.

---

## S9. Onboarding & baseline (first run)

1. **Goal:** Explain the app in 3 cards, then collect the baseline: the first 3 days of check-ins, or "Load demo crew data".
2. **Serves:** Validity (personal baselines), E8 (a judge can start the demo in one tap).
3. **Wireframe:** 3 full-screen glass cards over the background:
   1. **Card 1:** The body figure. "Your health, by body system."
   2. **Card 2:** "Log a few readings a day. We learn your normal."
   3. **Card 3:** Disclaimer, plus two buttons: "Start my baseline" and "Explore with demo data" (sets the simulated flag).
4. **A11y:** The disclaimer text is focusable and read before the buttons.
5. **States:** Skippable. The demo-data path sets `provenance: "simulated"` on every generated reading.

---

## Screens deliberately NOT built

| Idea | Why not |
|---|---|
| Mission dashboard | It's decoration. Mission context is a pill and settings. |
| Community / social | Not in the brief. Health data privacy. |
| Separate Body tab | Duplicates Today |
| Device pairing | No hardware in scope. Shown as a "Future sensors" slide in the demo instead. |
