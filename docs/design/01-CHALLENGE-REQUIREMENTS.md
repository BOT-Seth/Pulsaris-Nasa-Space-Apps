# 01 — Challenge Requirements Audit

**Challenge:** Create Health Monitoring Software for Astronauts on Space Missions
**Event:** 2026 NASA Space Apps Challenge (hackathon Nov 14–15, 2026)
**Official URL:** https://www.spaceappschallenge.org/2026/challenges/health-monitoring-software/
**Resources tab:** https://www.spaceappschallenge.org/2026/challenges/health-monitoring-software/?tab=resources
**Difficulty / subjects (official):** Intermediate · Human Exploration · Software · Space Exploration
**Verified:** 2026-11-14, read directly from the official pages in a browser.

Every claim below has a label:

| Label | Meaning |
|---|---|
| **OFFICIAL** | Stated on an official spaceappschallenge.org page. The source passage is quoted. |
| **INFERRED** | A defensible reading of the problem. It is not stated anywhere. |
| **TEAM** | Our recommendation, added to strengthen the product. |
| **UNVERIFIED** | Not yet confirmed. Do not build on it until someone confirms it. |

---

## 1. Official challenge description

> "Long-duration missions expose astronauts to space radiation, isolation and confinement, altered gravity, and a hostile closed environment, which can bring immune changes, bone loss, cardiovascular events, and behavioral health problems. On long missions, astronauts carry much of the responsibility for spotting these changes in themselves. Your challenge is to build a health monitoring software that gathers health indicators and enables astronauts to evaluate and act on the status of their health."

## 2. The problem NASA wants solved (OFFICIAL)

Astronauts on long missions must spot and act on their own health changes, far from medical care. The software must help them **gather** indicators, **evaluate** their status, and **act** on it.

## 3. Requirements and suggestions

### 3.1 Objectives (OFFICIAL, the core of the brief)

| ID | Requirement | Source passage |
|---|---|---|
| R1 | A **visual tool** that helps astronauts **assess their own health** during missions | "Your challenge is to create a visual tool that helps astronauts assess their own health during space missions…" |
| R2 | Provides **guidance on treatments and health improvements** | "…and provides guidance on treatments and health improvements." |
| R3 | **Gathers health indicators** | Summary: "build a health monitoring software that gathers health indicators" |
| R4 | Enables the astronaut to **evaluate and act** on health status | Summary: "enables astronauts to evaluate and act on the status of their health" |
| R5 | Any input method is allowed: keyboard, mouse clicks, camera images, etc. | "You may consider gathering data from the user through any kind of input—keyboard text, mouse clicks, or camera images, for example." |
| R6 | Data must **represent a health indicator** (with units) | "Any kind of data can be used, as long as it represents a health indicator, such as blood sugar levels in mg/dL or ultrasound images." |
| R7 | Clear presentation of metrics and diagnosis | "User interface design plays an important role in presenting metrics and diagnosis clearly." |

### 3.2 Indicators named by NASA (OFFICIAL, given as examples, not a mandatory list)

> "Some useful health indicators are blood pressure, heart rate, blood sugar, body temperature, daily sleep hours, and mood."

### 3.3 Questions NASA says are "worth considering" (OFFICIAL suggestion)

> "Which measurements can be performed in space? Why is an exam needed? How do spaceflight hazards affect these health indicators? When might a result warrant attention from the crew or from flight surgeons on the ground? What actions can be taken to prevent a critical health condition?"

Our product must answer each of these for every indicator it shows (see `11-REQUIREMENTS-TRACEABILITY.md`).

### 3.4 Suggested features (OFFICIAL, all optional)

| ID | Suggestion | Source passage |
|---|---|---|
| S1 | Animations and interactivity | "You may consider taking advantage of animations and interactivity to present the information." |
| S2 | **A clickable human figure** showing each body part's function and health status | "…the software could display a human figure where each part of the body is clickable and displays information about its function and health status." |
| S3 | Different environments: spacecraft, station, rover, planetary base | "Your tool could provide health insights for astronauts in different environments…" |
| S4 | Prompts to take measurements on a routine | "Your tool could prompt astronauts to take measurements or complete specific actions from time to time as a part of the mission routine." |
| S5 | Gamification of health tasks | "A gamification system to help astronauts engage with tasks that support their health" |
| S6 | Dynamic charts over time | "Dynamic charts that show how astronaut's health indicators change over time" |
| S7 | Color coding for at-a-glance status | "Color coding that helps the astronaut interpret the status of a health indicator at a glance" |
| S8 | Simple instructions and explanations | "Do not assume that astronauts know everything about how to assess their health. Your tool could provide simple instructions and explanations covering measurements, health indicators, and risks." |

S2 matches the reference design's central body model exactly, so the centerpiece is backed by the brief rather than added for decoration.

### 3.5 Resources (OFFICIAL, from the Resources tab)

| Resource | URL | Kind |
|---|---|---|
| 5 Hazards of Human Spaceflight (NASA HRP) | https://www.nasa.gov/hrp/hazards/ | Reference content |
| Risks of Human Spaceflight (NASA HRP) | https://www.nasa.gov/hrp/risks/ | Reference content |
| Ongoing HRP Research in Space | https://www.nasa.gov/hrp/ongoing-hrp-research/ | Reference content |
| CSA: Monitoring Radiation for Astronaut Health | https://www.asc-csa.gc.ca/eng/news/articles/2026/2026-02-26-monitoring-radiation-astronaut-health.asp | Partner reference |
| CSA: Why Do We Conduct Science Experiments in Space? | https://www.asc-csa.gc.ca/eng/iss/science/why-do-we-conduct-science-experiments-in-space.asp | Partner reference |

**Important:** The challenge supplies **no dataset or API**, only reference articles. See §5 for how we fill this gap.

### 3.6 Users and environment

| Item | Label | Detail |
|---|---|---|
| Primary user: an astronaut assessing **their own** health | OFFICIAL | "helps astronauts assess their own health" |
| Secondary: crewmates and ground flight surgeons as escalation targets | OFFICIAL | "warrant attention from the crew or from flight surgeons on the ground" |
| Users are not medical experts | OFFICIAL | "Do not assume that astronauts know everything…" |
| Environment: long missions with limited bandwidth, possibly offline, with communication delay | INFERRED | From the HRP "Distance from Earth" hazard. Design offline-first. |
| Used under time pressure and fatigue, so the app needs glanceable status and few steps | INFERRED | From the HRP sleep and behavioral risks |

## 4. Event-level rules that affect design (OFFICIAL)

Sources:
- Submission guide: https://www.spaceappschallenge.org/resources/project-submission-guide/
- Judging guide: https://www.spaceappschallenge.org/resources/judging-awards-guide/

| ID | Rule | Design consequence |
|---|---|---|
| E1 | Judging is scored **1–5 on Impact, Creativity, Validity, Relevance, Presentation** | Every P0 feature must map to at least one criterion (doc 11) |
| E2 | Relevance: "**meaningfully integrates NASA data, utilizing it as a core component** of the proposed solution rather than a superficial addition" | NASA data must drive real screens, not sit in a footer |
| E3 | Validity: "grounded in scientific principles… **usability and user-friendliness**" | Cite sources and show provenance. The UX has to be good. |
| E4 | "To be eligible for a Global Award, you must use **at least one NASA data or resource**" | Hard gate. Satisfied by OSDR plus HRP (§5). |
| E5 | AI-generated images and video "**Must include a visible watermark** to indicate SI generation"; code and data must acknowledge SI in text and metadata | Any AI-generated body render or art carries a visible "AI-generated" mark |
| E6 | Generated content "may not use, contain, or modify any **NASA branding**" (logos, flags, mission identifiers) | No meatball logos, flags or mission patches on the model or the UI |
| E7 | No "images, video, audio, or other likeness to **persons under 18**" | Use only adult figures and adult avatars |
| E8 | Demo: **≤30 s video or ≤7 slides**, in English, publicly accessible | Design must read clearly in a 30 s screen recording |
| E9 | All external code, text and images must be listed in References; no unlicensed copyrighted material | Keep `REFERENCES.md` and record a license for every asset |
| E10 | Submission closes **Sun Nov 15, 11:59 p.m. local time** | Roadmap is challenge-first (doc 10) |

## 5. NASA data we will use (TEAM recommendation, verified to exist)

The challenge gives only HRP articles. To score on **Relevance (E2)**, real NASA data will drive one screen and the baselines.

| Dataset | What it is | Verified fields | Use |
|---|---|---|---|
| **NASA OSDR OSD-569**, Inspiration4 whole blood, file `LSDS-7_Complete_Blood_Count_CBC_TRANSFORMED.csv` | Complete blood count for **4 crew × 7 timepoints** (L-92, L-44, L-3, R+1, R+45, R+82, R+194) with lab reference min/max | hemoglobin, hematocrit, RBC, WBC, platelets, lymphocytes, etc. Each has `_value`, `_range_min`, `_range_max`. | Crew Science screen; "space anemia" storyline; pre-flight to post-flight recovery pattern |
| **NASA OSDR OSD-575**, Inspiration4 serum, file `LSDS-8_Comprehensive_Metabolic_Panel_CMP_TRANSFORMED.csv` | Comprehensive metabolic panel, 28 rows (same crew and timepoints) | **glucose (mg/dL)**, which NASA names as an indicator; calcium (bone); sodium; potassium; creatinine; etc. | Blood sugar reference context; bone and calcium; kidney |
| OSD-575 cardiovascular cytokine panel | `LSDS-8_Multiplex_serum_cardiovascular_EvePanel_TRANSFORMED.csv` | Not inspected | P2 only |
| NASA HRP hazards and risks pages | Official risk narratives | — | Every "why this matters in space" explanation |

Download pattern, tested 2026-11-14:
`https://osdr.nasa.gov/geode-py/ws/studies/OSD-569/download?source=datamanager&file=<file_name>`
File list: `https://osdr.nasa.gov/osdr/data/osd/files/569`

**Data caveats (show these in the UI):**
- Inspiration4 was a **3-day** orbital mission. It is real human spaceflight data, but it does **not** represent a long-duration mission. Label it as such.
- 4 crew is a tiny sample. Show **individual trajectories**, never "population norms".
- The OSD-569 column `hemoglobin_value_percent` holds values like `14.7` with a range of `13.2–17.1`. These look like **g/dL**, not percent. This is **UNVERIFIED**: confirm against the study metadata before displaying units.
- The crew are de-identified (`C001`–`C004`). Never attach names or photos.

## 6. Judging criteria and how we target them

| Criterion (OFFICIAL wording, abridged) | Our design lever |
|---|---|
| **Impact:** addresses a significant problem; broad reach | Self-monitoring for long missions, with Earth analogs (remote workers, Antarctic crews) in the pitch |
| **Creativity:** novel concept or meaningful improvement | Body-centered "systems" interface linked to hazards; real crew trajectories compared with your own baseline |
| **Validity:** scientifically grounded, feasible, usable | Personal baselines, cited ranges, triage not diagnosis, provenance on every number |
| **Relevance:** directly addresses the challenge; NASA data is core | Every OFFICIAL objective is covered (doc 11). OSDR drives baselines and the Crew Science screen. HRP drives all guidance. |
| **Presentation:** clear, compelling storytelling | A premium visual identity and a 30 s demo path designed from the start (doc 10 §4) |

## 7. Unverified items and open questions

| # | Item | Owner |
|---|---|---|
| U1 | General-population reference ranges for BP, HR, glucose, temperature and sleep must come from cited medical sources (e.g. AHA, ADA, NIH/NHLBI). Do not use values from memory. | Content lead |
| U2 | OSD-569 hemoglobin unit (see §5) | Data lead |
| U3 | Whether RadLab (ISS dosimetry, https://visualization.osdr.nasa.gov/radlab/) is reachable. It returned HTTP 500 and connection errors on 2026-11-14. | Data lead; P2 only |
| U4 | Licenses for any anatomical 3D model we don't generate ourselves | Design lead |
| U5 | Citations from the team's research journal: every DOI must be opened and confirmed before it is cited | Research lead |

**We will not claim:**
- NASA-specific clinical thresholds (none were published in the challenge).
- Diagnoses.
- Predictions.
- That the Inspiration4 data represents long missions.
