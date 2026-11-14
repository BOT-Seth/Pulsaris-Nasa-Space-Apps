# 11 — Requirements Traceability & Compliance Checklist

**Legend:**
- **Status:** ✅ designed (spec complete) · 🛠 planned in build · ❓ unresolved
- **Priority:** P0, P1 or P2 (doc 10)

Implementation status is tracked in the PRs. Tick the **Built** box when a feature merges.

## A. Challenge objectives (OFFICIAL)

| ID | Requirement | Features | Screens | Visualizations | Validation criterion | Pri | Design | Built |
|---|---|---|---|---|---|---|---|---|
| R1 | Visual tool to assess own health | Body figure status, system cards, status engine | Today, System sheet, Metric detail | Figure regions, StatusChips | A tester answers "Am I OK today?" in under 10 s on Today | P0 | ✅ | ☐ |
| R2 | Guidance on treatments and improvements | "What you can do", Insight steps, cited HRP countermeasures | System sheet, Metric detail, Insights | — | Every non-good status shows at least 1 actionable step + a source | P0 | ✅ | ☐ |
| R3 | Gathers health indicators | Check-in sheet, local storage | Check-in | — | All 6 NASA-named indicators can be logged with units | P0 | ✅ | ☐ |
| R4 | Evaluate and act on status | Status engine with reasons, re-measure flow, escalation rule | Metric detail, Insights | StatusExplanation | Each status shows "why" + "what next" | P0 | ✅ | ☐ |
| R5 | Any input type (keyboard, clicks, camera) | Keyboard and clicks (number fields, tiles). Camera is out of scope. | Check-in | — | Keyboard-only logging works | P0 | ✅ | ☐ |
| R6 | Data represents a health indicator with units | Unit on every value; data contract `unit` field | All | Unit spans, axis units | No value is rendered without a unit (code review) | P0 | ✅ | ☐ |
| R7 | Clear presentation of metrics and diagnosis | Type hierarchy, StatusChip, chart rules, no diagnosis copy | All | All charts | Doc 09 §1 checks pass; copy review against §5 | P0 | ✅ | ☐ |

## B. NASA's "worth considering" questions (OFFICIAL suggestions)

| Question | Where it is answered | Pri | Design |
|---|---|---|---|
| Which measurements can be performed in space? | "How to measure" ExplainerBlock per indicator | P0 | ✅ (content 🛠) |
| Why is an exam needed? | "Why it matters in space" (HRP-cited) | P0 | ✅ (content 🛠) |
| How do spaceflight hazards affect these indicators? | System sheet hazard → risk mapping (doc 05 §1) | P0 | ✅ (content 🛠) |
| When might a result warrant crew or flight-surgeon attention? | "When to contact your flight surgeon" + alert rule | P0 | ✅. Alert thresholds are ❓ until cited (U1). |
| What actions can prevent a critical condition? | "What you can do" + Insight steps | P0 | ✅ (content 🛠) |

## C. Suggested features (OFFICIAL, optional)

| ID | Suggestion | Our feature | Pri | Design |
|---|---|---|---|---|
| S1 | Animations and interactivity | Region zoom, chart scrub, draw-in (reduced-motion safe) | P0/P1 | ✅ |
| S2 | Clickable human figure | BodyFigure + RegionHotspot + System sheet | P0 | ✅ |
| S3 | Different environments | Mission pill + Profile environment (spacecraft / station / rover / base). Affects copy and context only. | P1 | ✅ |
| S4 | Routine prompts | RoutineCard, due check-ins, Insights | P0/P1 | ✅ |
| S5 | Gamification | Streak card, badges | P1 | ✅ |
| S6 | Dynamic charts over time | TimeSeries / RangeBar / Lollipop / Crew charts + ranges | P0 | ✅ |
| S7 | Color coding at a glance | Status system (icon + label + color) | P0 | ✅ |
| S8 | Simple instructions | How to measure, why it matters, plain copy | P0 | ✅ |

## D. Event rules and judging (OFFICIAL)

| ID | Rule | How we comply | Pri | Design |
|---|---|---|---|---|
| E1 | Judged on Impact, Creativity, Validity, Relevance, Presentation | Doc 01 §6 mapping; demo path in doc 10 §4 | P0 | ✅ |
| E2 | NASA data is a core component | Crew Science tab; "Compare with real crew data" on Metric detail | P0 | ✅ |
| E4 | Uses at least 1 NASA data or resource | OSDR OSD-569/575 + NASA HRP | P0 | ✅ |
| E5 | Visible watermark on AI images; acknowledge AI-made code and data | AI-generated Badge; AI-use statement in About + README | P0 | ✅ |
| E6 | No NASA branding in generated content | Imagery rules (doc 04 §F, doc 08 §B1) | P0 | ✅ |
| E7 | No likeness of people under 18 | Adult figure; initials avatars | P0 | ✅ |
| E8 | ≤30 s video or ≤7 slides, English, public link | Demo path; deploy as a public static site | P0 | 🛠 |
| E9 | All external resources referenced; no unlicensed material | `REFERENCES.md`; license recorded for each asset | P0 | 🛠 |
| E10 | Deadline Nov 15, 11:59 p.m. local | Roadmap P0 scope | P0 | 🛠 |

## E. Unresolved

| ID | Item | Blocks | Owner |
|---|---|---|---|
| U1 | Cited general reference ranges and critical (alert) thresholds | `caution` and `alert` statuses (until then: baseline-only `watch` + "reference range pending" note) | Content |
| U2 | OSD-569 hemoglobin unit label | Crew Science unit display for hemoglobin | Data |
| U3 | RadLab availability | P2 radiation layer only | Data |
| U4 | Figure asset license or AI watermark | Today hero | Design |
| U5 | Research-journal DOIs verified | Citing papers in Crew Science explainers | Research |
