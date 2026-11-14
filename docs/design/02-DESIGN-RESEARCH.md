# 02 — Design Research

This document has three parts: the team's reference screenshot (the primary reference), a pattern audit of shipping health apps, and the adopt/avoid decisions that follow from them.

Research was done 2026-11-14. Each source is tagged:
- **(read)**: we opened the page.
- **(snippet)**: seen only in search results.
- **(not verified)**: general knowledge, not confirmed from a source.

Several official pages blocked automated access with HTTP 403 or render only with JavaScript. Those are listed as gaps at the end.

---

## Part A — Primary reference: the team's screenshot

The screenshot shows two phone screens of a consumer health app: **Home** and **Statistics**. It is the visual anchor for this project.

### A1. What it does well, and why

| Element | Observation | Why it works | Keep for Orion |
|---|---|---|---|
| **Central anatomical figure** | A large, photoreal, semi-transparent figure with muscles and organs visible, running pose, fading into the background at the bottom | Gives the screen one focal point and makes "health" literal | **Keep.** It becomes the clickable body (challenge S2). It must be tied to real status, not just decorate. |
| **Stats stacked beside the figure** | Three big numbers (10,103 / 7.86 / 2,345) with small caps labels, left-aligned, overlapping the figure's space | The figure and numbers share one composition rather than separate boxes | Keep the composition: 3 headline indicators to the left of the body on mobile |
| **Big-number hierarchy** | Numbers about 2× the label size; labels uppercase, light grey, tracked out | Readable at a glance; labels recede | Keep. Use tabular numerals. |
| **Rounded cards rising from the bottom** | A white card with 24px+ radius overlaps the hero area | Layered depth; a clear "scroll for more" cue | Keep as a glass card |
| **Lollipop sleep chart** | Thin stems, round heads, a dashed goal line with a dark "Goal 8h" pill, one highlighted point in accent amber | Minimal axes; the goal is the only reference line; one highlight tells the story | Keep for sleep. Highlight = selected or latest. |
| **Category-tinted cards** | Calories in pale blue, Weight in peach, Stress in lavender | Tint gives each category identity without heavy color | Keep. One tint per body system (doc 04). |
| **Semicircle gauge** | Thick dark navy arc on a dotted track, value centered | Shows progress against a budget | Keep. Use only for bounded quantities (routine completion, readiness). |
| **Huge thin numeral and smooth line** | "74" in a light weight about 64px, with an amber smooth line on a dot-matrix field and a marker on the peak | Elegant, calm, editorial | Keep the numeral style. Keep the dot field as decoration only. Use a **monotone** curve (see A2). |
| **Compact bottom nav** | 4 items, outline icons, label under icon, active item in navy | Familiar, light | Keep 4 tabs |
| **Pill controls** | "Today ⌄" pill, round bell button | Soft, tactile | Keep. The pill becomes the mission-context selector. |

### A2. What we must change

| Issue in the reference | Problem | Orion rule |
|---|---|---|
| The weight curve overshoots above and below its points (a spline) | It invents values between readings, which is misleading in a health app | Use only `monotoneX` interpolation, and show the raw points |
| The sleep chart has no y-axis values | You can't read 6h vs 7h exactly | Keep a minimal axis: 2–3 labeled ticks and a goal line |
| Status is shown by text only ("You slept too little") | No severity system | Status chip = icon + label + color (doc 09) |
| No source, timestamp or units on some metrics | Fails trust (our Validity criterion) | Every value has a unit, timestamp and source badge |
| Fitness metrics (steps, calories, weight) | Not our challenge | Replace with the NASA-named indicators (doc 01 §3.2) |
| The figure is photoreal with a skin-texture face | Rules E5 and E7 (AI watermark, no under-18 likeness) and an uncanny look | A stylized translucent adult figure, no face detail (doc 08) |
| Glass is barely frosted (mostly opaque white) | The team wants more frost | Layered glass on a soft colored background (doc 04 §B) |

### A3. Measured style read-out

These values are estimated from the screenshot to calibrate our tokens. They are not exact.
- **Corner radius:** large cards about 24–28px; pills fully rounded; device-safe gutter about 16–20px.
- **Type:** a geometric grotesque. Numerals are medium about 28px (stats) and light about 64px (hero). Labels about 12px uppercase with wide tracking.
- **Palette:** off-white background (#EEEEEE-ish), white cards, navy ink (#1B2240-ish), accent amber (#E0A040-ish), pastel tints.
- **Density:** about 3 data blocks per viewport. Lots of air.

---

## Part B — Pattern audit of shipping apps

### B1. Oura
**Sources:**
- https://ouraring.com/blog/readiness-score/ (read)
- https://ouraring.com/blog/new-oura-app-experience/ (read)
- https://instrument.com/work/oura-app (read)

- **Score model:** a 0–100 score with bands (85+ Optimal, 70–84 Good, <70 Pay attention). Nine contributors in three pillars. Contributors that need attention show a red bar.
- **Navigation:** reduced from 5 to 3 tabs (Today, Vitals, My Health). Vitals shows **personal baseline ranges** for each metric.
- **Three visualization tiers:** glance, focus, explore. One semantic color system for "supports" vs "strains".
- **Adopt:**
  - A score must always expand into its contributors.
  - Draw the personal baseline band on every vital.
  - Use three-tier disclosure.
  - Use a time-aware "highlight" slot on Today.
- **Avoid:** vague wellness labels for clinical values (BP, glucose) that need explicit units and ranges.

### B2. WHOOP
**Sources:**
- https://developer.whoop.com/docs/whoop-101 (read)
- https://www.925studios.co/blog/whoop-design-breakdown (read, third-party)
- https://the5krunner.com/2025/10/15/whoop-homescreen-gets-a-revamp/ (read)
- whoop.com/thelocker pages (403)

- **Recovery:** 0–100% with fixed color bands (green 67–100, yellow 34–66, red 0–33). Strain 0–21. A 2025 home screen with 3 dials, each opening its own page.
- **Teardown:** one color = one meaning, app-wide. Hero numeral about 72pt. "Each tile is a doorway, not a destination."
- **Adopt:**
  - Publish the numeric bands behind every status color.
  - One color, one meaning.
  - A hero numeral of 64px or more.
  - Tapping a tile opens a detail screen.
- **Avoid:**
  - The near-black dense style, which clashes with our light direction.
  - Red/yellow/green alone without icon and label.

### B3. Apple Health and the HIG Charts guidance
**Sources:**
- https://support.apple.com/104997 (read)
- HIG Charts JSON: https://developer.apple.com/tutorials/data/design/human-interface-guidelines/charts.json (read)
- https://9to5mac.com/2026/03/23/apple-health-best-features/ (read)

- **Summary:** user-pinned metrics, plus Highlights that describe change over time ("fewer steps than usual by now").
- **HIG Charts (read):**
  - Lines for trends, bars for sums, points for discrete readings.
  - A non-zero baseline is allowed for heart rate.
  - **Title and summary state the main message.**
  - Don't require interaction to reveal critical info.
  - Don't rely on color alone. BP uses **different point shapes** for systolic and diastolic.
  - Audio Graphs; unambiguous dates ("June 6", not "6/6").
- **Range control:** D/W/M/6M/Y segmented control (not verified on the live app this session).
- **Adopt:**
  - A range control on each metric page, adapted as Day / Week / Mission / All.
  - **BP as a vertical range mark** (systolic top, diastolic bottom) with two point shapes.
  - A chart subtitle that states the takeaway; it doubles as the screen-reader label.
- **Avoid:** long "Show all data" lists. Our indicator set is small, so curate it.

### B4. Withings
**Sources:**
- App Store listing https://apps.apple.com/us/app/withings/id542701020 (read)
- Support and community (snippet)
- withings.com pages (403)

- **Layout:** Home shows Health Score cards that open into their measurements. Each value shows the **change since the last measurement** and a reference range.
- **Complaint:** the averaged trend line drifts from the points, and the raw-point view was removed (community, snippet).
- **Adopt:**
  - A delta-since-last-reading next to every big number.
  - Grouped system cards (Cardio = HR + BP).
- **Avoid:** smoothing away raw points. Always show the raw dots.

### B5. Fitbit and Garmin Connect
**Sources:**
- https://9to5google.com/2025/08/20/fitbit-app-coach-redesign/ (read)
- https://www.garmin.com/en-MY/blog/general/unlocking-the-potential-of-garmin-connect/ (read)
- Garmin forums (snippet)

- **Fitbit:** 4 tabs (Today, Fitness, Sleep, Health). The top shows one hero ring with 3 side stats.
- **Garmin "My Day":** a reorderable card stack with today plus 7 days, and a "Reports" shortcut on each card. Forum complaint: cards silently appear and disappear.
- **Adopt:**
  - The "hero + 3 side stats" composition (it matches our reference).
  - A 7-day sparkline on each card.
- **Avoid:** silent card disappearance. Show an explicit "No recent data" state.

### B6. Gentler Streak and Bevel
**Sources:**
- https://apps.apple.com/us/app/gentler-streak-fitness-tracker/id1576857102 (read)
- https://gentlerstories.com/gentlerstreak/ (read)
- https://apps.apple.com/us/app/bevel-all-in-one-health-app/id6456176249 (read)

- **Gentler Streak:**
  - A line kept inside a shaded "good" corridor.
  - Plain-language, non-judgmental guidance.
  - Status modes (Sick, Injured, On a break) change expectations.
  - Declares VoiceOver, Larger Text, Differentiate Without Color and Reduced Motion support.
  - 2024 Apple Design Award, Social Impact (snippet).
- **Bevel:** 5+ composite scores; a habit journal correlated to sleep; reorderable sections. Declares no accessibility features. A reviewer called its guidance "vague".
- **Adopt:**
  - A **target-band chart** (line inside a corridor).
  - **Mission status modes** (e.g. EVA day, Illness, Rest) that change expectations and suppress false alarms. P2.
  - Calm microcopy.
- **Avoid:** many composite scores. Cap at one, with contributors visible.

### B7. NASA Eyes
**Sources:**
- https://science.nasa.gov/eyes/ (read)
- https://www.jpl.nasa.gov/news/explore-the-solar-system-with-nasas-new-and-improved-3d-eyes/ (read)
- https://science.nasa.gov/blogs/eyes/2026/06/02/may_release_notes/ (read)

- **Structure:** browser 3D with time controls and playback. "Scrolly-telling" guided journeys. Copy moved from icons to words ("What am I looking at?" became "Did you know?"; "LEARN MORE+" replaced "+").
- **Adopt:**
  - A **mission-day scrubber** that replays body status over time (P2).
  - Text labels anchored to body regions.
  - A short guided tour for first-time users and judges.
- **Avoid:** a free-roam camera. Constrain the body view.

### B8. 3D anatomy viewers (BioDigital)
**Sources:** support pages (snippet; 403 on direct open).

- **Behavior:** selecting a structure in a list highlights it in the model. Over 8,000 selectable structures.
- **Adopt:**
  - **Synced list and model.** Every body region is also reachable from a list, which gives keyboard and screen-reader parity.
  - A selection highlight that is distinct from status colors.
- **Avoid:** anatomical depth (layers, dissection). Keep 6–8 tappable zones.

---

## Part C — Decisions

| # | Decision | Driven by |
|---|---|---|
| D1 | Light, airy, glass UI. Not dark sci-fi. | Reference; team brief; WHOOP "avoid" |
| D2 | **Body figure is the Home centerpiece** with 6 tappable systems, mirrored by a list | Challenge S2; BioDigital; reference |
| D3 | Every metric = big tabular numeral + unit + delta + timestamp + source | Withings, WHOOP, Validity criterion |
| D4 | Status = icon + word + color, with published bands | WHOOP, HIG, a11y |
| D5 | Personal baseline band on every time-series chart; deviation-from-baseline drives status | Oura; team research journal (SOMA and Twins findings) |
| D6 | At most one composite ("Routine" completion). **No invented "health score".** | Bevel "avoid"; Validity |
| D7 | `monotoneX` curves, raw points visible, gaps never bridged | Reference flaw; Withings complaint; HIG |
| D8 | 4-tab nav: Today, Trends, Insights, Crew Science | Oura/Fitbit 3–4 tabs; Relevance criterion |
| D9 | Glance, then focus, then explore: Today card, then Metric detail, then range control | Oura tiers |
| D10 | Real NASA crew data (OSDR Inspiration4) on its own screen and as context on metric pages | Relevance criterion E2 |

## Research gaps

These pages could not be read this session:
- whoop.com/thelocker (403)
- withings.com and support.withings.com (403)
- developer.apple.com HIG HTML pages (JavaScript-only; the JSON source was read instead)
- support.biodigital.com (403)
- support.apple.com iPhone guide page (JavaScript-only)

Claims from those sources are marked (snippet) or (not verified) above. No screenshots of competitor apps were captured. Visual-style statements about them are general knowledge unless marked (read).
