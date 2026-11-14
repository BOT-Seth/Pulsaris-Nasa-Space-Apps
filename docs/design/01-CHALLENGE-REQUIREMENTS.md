# 01 — Challenge Requirements

**Challenge:** Create Health Monitoring Software for Astronauts on Space Missions (2026 NASA Space Apps, Nov 14–15)
**URL:** https://www.spaceappschallenge.org/2026/challenges/health-monitoring-software/
**Verified:** 2026-11-14, read directly from the official pages.

Scope decisions built on these requirements live in `docs/scope/SCOPE.md`. This doc lists the requirements themselves and how the design meets them.

**Labels:**
- **OFFICIAL:** quoted from the official pages.
- **INFERRED:** our reasonable reading of them.
- **MENTOR:** feedback from NASA staff, recorded in SCOPE.md.

## 1. Objectives (OFFICIAL)

| ID | Requirement | Source passage |
|---|---|---|
| R1 | A visual tool that helps astronauts assess their own health | "create a visual tool that helps astronauts assess their own health during space missions" |
| R2 | Guidance on treatments and improvements | "…and provides guidance on treatments and health improvements" |
| R3 | Gathers health indicators | "build a health monitoring software that gathers health indicators" |
| R4 | Evaluate and act on status | "enables astronauts to evaluate and act on the status of their health" |
| R5 | Any input type | "any kind of input—keyboard text, mouse clicks, or camera images" |
| R6 | Data must be a health indicator, with units | "as long as it represents a health indicator, such as blood sugar levels in mg/dL" |
| R7 | Metrics and diagnosis presented clearly | "User interface design plays an important role in presenting metrics and diagnosis clearly" |

- **Named indicators:** blood pressure, heart rate, blood sugar, body temperature, daily sleep hours, mood.
- **Questions "worth considering":**
  - Which measurements can be performed in space?
  - Why is an exam needed?
  - How do hazards affect the indicators?
  - When should a result go to the crew or flight surgeons?
  - What actions prevent a critical condition?
- **Optional suggestions:**
  - S1: animations and interactivity.
  - S2: a clickable human figure.
  - S3: different environments.
  - S4: routine prompts.
  - S5: gamification.
  - S6: dynamic charts.
  - S7: color coding.
  - S8: simple instructions.

## 2. Mentor constraints (MENTOR, recorded in SCOPE.md)

- **M1:** Crew time is precious. Every second counts.
- **M2:** Keep the UI and the data load simple.
- **M3:** Minimal burden, most data.
- **M4:** Put the most important thing up front.
- **M5:** Know what matters and keep the end user in mind.

These constraints outrank the optional suggestions. For example, the clickable figure (S2) is kept only as a secondary picture (doc 08).

## 3. Event rules that shape the design (OFFICIAL)

Sources:
- Project submission guide: https://www.spaceappschallenge.org/resources/project-submission-guide/
- Judging and awards guide: https://www.spaceappschallenge.org/resources/judging-awards-guide/

| ID | Rule | Design consequence |
|---|---|---|
| E1 | Scored 1–5 on **Impact, Creativity, Validity, Relevance, Presentation** | Every MVP feature maps to a criterion (doc 11) |
| E2 | Relevance: NASA data must be "a core component… rather than a superficial addition" | See §4 |
| E3 | Validity: "grounded in scientific principles… usability and user-friendliness" | Cited sources, provenance on every number, fast UX |
| E4 | At least one NASA data or resource is required for Global Awards | §4 |
| E5 | AI-generated images need a **visible watermark**; AI-generated code and data must be acknowledged in text | "AI-generated illustration" label on the figure. AI-use statement in About and the README. |
| E6 | No NASA branding in generated content | No meatball, worm, flags or mission patches |
| E7 | No likeness of anyone under 18 | Adult figure only; no photos |
| E8 | Demo is ≤30 s video or ≤7 slides, in English, at a public link | Demo path in doc 10 |
| E9 | Every external resource is listed in References | MMASH (ODbL, credit required) and every paper |
| E10 | Submission closes Nov 15, 11:59 p.m. local time | Lean MVP |

## 4. How NASA data is core (Relevance)

The challenge supplies no dataset. NASA OSDR holds no human HRV, sleep or cognitive data (RESEARCH.md). NASA sources therefore drive the app's **scoring and explanations** instead of supplying raw data streams.

| NASA source | Role in the app | Where it shows |
|---|---|---|
| **ISS pre-flight PVT reference**: Dev et al. 2024, *Frontiers in Physiology*, data from NASA HRP Standard Measures. PVT speed "calculated as 10 minus the reciprocal of the response time"; pre-flight **5.25 ± 0.24, N = 24** (formula verified against the full text). | **Scores the alertness check** (Signal Lock) until the astronaut has their own baseline. The 1.5 SD cutoff is the paper's low-score line. | Signal Lock result, labeled "NASA ISS pre-flight reference" |
| **NASA HRP Risks & Hazards**, incl. *Risk from Inadequate Sleep and Irregular Schedules* | Every "why this matters in space" line and the countermeasure card wording | Indicator detail, countermeasure card |
| **NASA OSDR OSD-939** (Davis et al. 2015) | Evidence that space-type radiation impairs sustained attention (rat PVT) | About / evidence |
| **ARCHeR** (NASA HRP, Artemis) | NASA tracks crew sleep with actigraphy plus brief surveys. Our passive-sleep + 2-tap design mirrors it. | Pitch, About |
| **LSAH medical requirements** | NASA's own in-flight monitoring (heart rate monitoring, neurocognitive assessment MR085L). Answers "which measurements can be performed in space". | Pitch, About |

**Not NASA, labeled as such:** MMASH (PhysioNet) is used as recorded HR, HRV and sleep data, replayed to stand in for a crew wearable.

## 5. Open items

| # | Item | Owner |
|---|---|---|
| U1 | Cited safe ranges for BP, blood sugar and temperature (the Act thresholds) | Content |
| U2 | A source for the weekly BP + blood sugar prompt interval. Check the LSAH Cardiovascular requirement documents. | Content |
| U3 | A source for the low-HRV threshold (1 SD below baseline is borrowed from athlete monitoring) | Research |
