# Suggestions for the Scope (from Mohammed)

Aileen, these are suggestions for you to review. Nothing here changes `SCOPE.md`, `DECISIONS.md` or `MINIGAME.md`. **Your scope docs take priority** over `docs/design/`, which is being rewritten to match them. Take what's useful.

App name: **Pulsaris**.

---

## 1. Countermeasure card in the MVP; Orbit Breath as a stretch goal

**Suggestion:**
- Make the **countermeasure card** (MINIGAME.md §4.5) the MVP recovery step after Signal Lock.
- Move **Orbit Breath** to stretch, and offer it later as one option on the card.

**Why:**
- The card is one text screen. It's cheap to build and costs the astronaut about 10 seconds to read. Every line can cite a source.
- Orbit Breath is a full interactive activity. Live sensors are excluded, so we can't show that it improves HRV. That makes it the weakest-evidence feature in the MVP, and it adds up to 2 min of crew time.

**Card content (draft, by result band):**

| Band | What the card says | Source |
|---|---|---|
| OK | "You're alert. No action needed." | — |
| Watch | 1. Short movement break and bright light. 2. Caffeine only if it fits your plan and isn't close to your next sleep. 3. Double-check critical tasks today. | NASA HRP sleep risk page (LED lighting that simulates day and night; light and caffeine affect the body clock) |
| Act | 1. Nap 20–30 min if your schedule allows. 2. Postpone or double-check critical tasks. 3. Your crew medical officer has been flagged. Re-check after rest. | MINIGAME.md §4.5; escalation rule §4.6 |

The card shows **one primary action** in large text, with the others below it. That follows the NASA staff feedback: put the most important thing up front.

## 2. Trigger rules for on-demand entries

The scope says blood pressure, temperature and blood sugar are entered "only when prompted", but it doesn't say when the app prompts.

| Indicator | Suggested rule | Needs a source? |
|---|---|---|
| Blood pressure **+ blood sugar** | Asked **together** in one prompt, **once a week**, or early when resting HR is flagged | Yes, for the weekly interval. See §3 (LSAH medical requirements) |
| Body temperature | Only when the astronaut taps **"Feeling unwell"** on the home screen | Yes |

Bundling blood pressure and blood sugar means **one** interruption instead of two (Mohammed's decision).

## 3. NASA sources that strengthen "why this research is useful"

None of these is a downloadable dataset. They do give official NASA backing for design decisions already in the scope. Checked 2026-11-14.

| Source | What it says | What it supports in our scope |
|---|---|---|
| **ARCHeR: Artemis Research for Crew Health & Readiness** (NASA HRP), https://www.nasa.gov/reference/archer/ | NASA measures Artemis astronauts' "well-being, activity, sleep patterns, and interactions" using **actigraphy** (a wrist activity and sleep tracker) and **behavioral performance surveys**. Actigraphy is also collected **during** the mission. | Our approach of **passive sleep data + a few quick self-report taps** matches what NASA itself does on Artemis. MMASH's sleep data also comes from a wrist actigraph (ActiGraph), the same kind of device. |
| **Risk from Inadequate Sleep and Irregular Schedules** (NASA HRP), https://www.nasa.gov/reference/risk-from-inadequate-sleep-and-irregular-schedules/ | Stressors include "work overload, irregular light-dark cycles, and sleep-pattern disruptions". Countermeasures named: LED lighting that simulates Earth's day/night, research on light and **caffeine** timing, and **designated relaxation time**. ISS crews see 16 sunrises a day. Links to the Human Research Roadmap evidence: https://humanresearchroadmap.nasa.gov/Risks/risk.aspx?i=100 | Why sleep and alertness are the core of the app. The countermeasure card wording (§1). |
| **LSAH: Lifetime Surveillance of Astronaut Health**, https://nlsp.nasa.gov/resources/lsah | NASA's medical monitoring program. It publishes the **medical requirements** for crew, by body system. The requirement list (https://nlsp.nasa.gov/doc/mrid_book.pdf) includes in-flight heart rate monitoring, an in-flight 30-day health status check, a resting ECG for long-duration crew, and a neurocognitive assessment (MR085L). **The data itself is restricted.** | Answers the challenge question "which measurements can be performed in space?". MR085L supports the claim that NASA already runs in-flight cognitive checks (alongside Basner 2015). The individual requirement documents may give **in-flight measurement frequencies**, which could be the source for the weekly BP rule in §2. Worth one teammate checking the Cardiovascular documents. |
| **HRP Risks** and **5 Hazards** pages | Already in RESEARCH.md | — |

**On NASA data for the judging (Relevance):** the screen showing Inspiration4 lab data was cut (Mohammed's decision). In the lean scope, NASA's contribution is:
- the **ISS astronaut pre-flight PVT reference** (Dev et al. 2024, NASA HRP Standard Measures data), which drives Signal Lock scoring;
- the **HRP risk content** behind every explanation;
- **OSD-939** as evidence;
- ARCHeR and LSAH as backing for design decisions.

Say this clearly in the submission's "NASA Data" field.

## 4. Verified: the Dev et al. 2024 PVT speed formula

Checked against the full text (PMC11614644):

> "Speed outcomes for each task are represented as the average response time (in milliseconds), except for the PVT, which was calculated as 10 minus the reciprocal of the response time."

The pre-flight PVT speed in Table 1 is **N = 24, mean 5.25, SD 0.24 (range 4.75–5.73)**. The numbers and interpretation in RESEARCH.md are correct.

## 5. Approvals

Mohammed approves all items in `DECISIONS.md` marked **"Proposed, needs team OK"**, as of 2026-11-14. Update their status to **Decided** when you next edit the file.

## 6. Small inconsistencies to tidy

| File | Issue |
|---|---|
| MINIGAME.md §1 | Says a session takes "about 5–7 minutes". The scope and §4.1 say about 3 min (+ an optional 2), about 5 min worst case. |
| RESEARCH.md, challenge mapping table | Says "Completion-based streaks **and badges**". The scope says streak only. |
| MINIGAME.md §5 Stretch | Lists the trend chart, which SCOPE.md already has in scope (one 7-day view). |
| Status words | SCOPE uses OK / Watch / Act; MINIGAME uses green / yellow / red. Suggest **OK / Watch / Act** everywhere, plus **No data** for missing readings. Colors come from the design system. |
