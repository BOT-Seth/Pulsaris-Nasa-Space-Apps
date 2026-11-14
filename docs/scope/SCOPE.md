# Project Scope

> **The one rule:** every second of crew time counts. If a feature costs the astronaut time without giving back clearly useful health information, it's out.

This file is the gate for scope creep. Anything not in **In scope** goes to the **Parking lot** until the MVP is done and demoable.

## Where this comes from
**NASA feedback** (two NASA staff we talked ideas through with):
1. Astronaut crew time is precious. Every second counts.
2. Keep the UI and the data load simple. Respect the astronaut's time.
3. Minimal burden, most data. Find the balance.
4. Put the most important thing up front in the UI.
5. Know what matters and keep the end user in mind.

**The challenge asks for:** a visual tool that **gathers health indicators**, lets astronauts **evaluate** their status, and gives **guidance to act**. Example indicators: blood pressure, heart rate, blood sugar, body temperature, daily sleep hours, mood.

## Product in one sentence
A daily health check that takes **under a minute**. It shows **one status and one next action** up front, and runs a **short alertness check only when the data says something's off**.

## Crew-time budget (hard limits)
| Interaction | Max time | How often |
|---|---|---|
| Daily check-in (manual taps) | **60 s** | Once a day |
| Reading the home status | **5 s** to know "am I OK?" | Any time |
| Alertness check (Signal Lock) | **3 min** | **Only when triggered**, or before a critical task |
| Recovery breathing (Orbit Breath) | **2 min**, optional | Only when offered |
| **Worst-case day** | **About 6 min** | Rare |
| **Typical day** | **About 1 min** | |

If a feature would push past these limits, it's out or it replaces something.

## Minimal burden, most data
Collect passively wherever possible. Only ask the astronaut for what a sensor can't measure.

> **No live wearable hookup.** We don't connect to any device. Heart, HRV and sleep data are **pulled from published datasets** (MMASH on PhysioNet) and replayed as if a crew wearable had recorded them. "Wearable" below only describes where the data would come from on a real mission.

| Indicator | Source | Astronaut effort |
|---|---|---|
| Heart rate, HRV | Pulled dataset (MMASH RR intervals). On a mission: crew wearable | **None** |
| Sleep hours | Pulled dataset (MMASH sleep). On a mission: crew wearable (ring sleep *hours* are validated against lab sleep studies; sleep *stages* are not, so we show hours only) | **None** (confirm with 1 tap) |
| Mood | Self-report | **1 tap** (5-point scale) |
| Sleepiness | Self-report | **1 tap** (1–9 slider) |
| Blood pressure | Cuff reading, typed in | About 15 s, **only when prompted** (e.g., weekly or if HR is abnormal) |
| Body temperature | Typed in | About 10 s, **only when prompted** (e.g., feeling unwell) |
| Blood sugar | Typed in. OK band = lab range **65–99 mg/dL**; demo values = real Inspiration4 crew (OSD-575) | About 15 s, **only when prompted**. An out-of-range value asks for **one re-check** before alerting |

**Daily manual input = 2 taps** (mood + sleepiness) plus a sleep confirmation. Everything else is passive or on request.

## In scope (MVP)
1. **Home: one status up front**
   - One overall status (OK / Watch / Act) with a text label + icon, not color alone
   - The **single most important issue** and **one recommended action** under it. The issue names its cause (e.g., "HRV 22% below your baseline")
   - Each indicator is one row: latest value + status. Tap for detail
2. **Daily check-in (≤ 60 s):** mood + sleepiness taps, confirm last night's sleep
3. **On-demand entry** for BP, temperature and blood sugar, prompted only when relevant
4. **Rules that flag issues:** each indicator is compared with the astronaut's own baseline or a safe range → OK / Watch / Act. **Heart rate, HRV and blood pressure are compared with an in-flight baseline, not pre-flight**: all three normally drop in microgravity (Fritsch-Yelle et al. 1996), so a pre-flight baseline would raise false alarms every day
5. **Guidance:** for each flag, one plain-language action, plus "contact flight surgeon" when it's Act-level
6. **Triggered alertness check:** Signal Lock (3-min reaction test), run **only** when HRV/sleep/sleepiness is flagged or before a critical task. One result + one action. See MINIGAME.md
7. **Optional 2-min breathing** (Orbit Breath) offered after a low-HRV flag
8. **One trend view:** 7-day line per indicator, tapped open from its row. Not on the home screen
9. **Demo data:** MMASH replay for HRV/sleep; **real Inspiration4 crew glucose** (OSD-575) for blood sugar; simple labeled sample values for BP and temperature (no open crew data exists for those)

## Out of scope: Parking lot (only after the MVP is demoable)
| Idea | Why parked |
|---|---|
| Clickable human body figure | The challenge mentions it as an example. It looks great, but a list reads faster. Add only if time allows, as a *view* of the same data |
| Docking Drift, Systems Check, Star Sequence games | Each adds crew time. Signal Lock alone covers the alertness check |
| Routine daily alertness checks | Costs 3 min a day. Triggered-only respects crew time |
| Radiation-event trigger | Needs dosimeter data we don't have. Easy to add later as one more trigger |
| Gamification beyond a simple check-in streak | Badges, crew goals and personal records don't help health status |
| Messaging flight surgeons / ground | Show a "flag for flight surgeon" state only. No real comms |
| Multiple crew members, crew dashboard | One astronaut first. Crew view later |
| Resonance-breathing personalization, HRV live during breathing | Would need a live sensor, which is excluded |
| Post-flight recovery tracking | The research supports it, but our scope is in-mission self-assessment |
| Detailed score breakdowns on the main screen | Details stay one tap deep |

## Not doing (excluded, not parked)
| Item | Why |
|---|---|
| **Live wearable / device hookup** (Bluetooth, camera pulse, vendor APIs) | Team decision: we only **pull data** from published datasets. No hardware or device integration |
| Building sensors or hardware (vest, EEG headband) | Out of a software challenge's scope |
| Diagnosing conditions (anemia, bone loss, radiation injury) | The app screens and points to follow-up. It doesn't diagnose (see RESEARCH.md) |

## Evidence base: what the scope stands on
These are the **only** sources the MVP's design decisions rest on. Each one was checked on 2026-11-14:
- Its citation is confirmed in **Crossref** (the official DOI registry).
- The finding we use was checked in the paper's **abstract or full text**, or comes from the official data repository itself.

Full detail, plus sources we reviewed but **don't** use in the MVP, is in [RESEARCH.md](RESEARCH.md).

**Why a source counts as usable:**
1. It is **peer-reviewed and published** in a recognized journal, or it's an official agency or academic data repository.
2. It is about **humans** (animal studies only as labeled supporting evidence).
3. It directly supports an **in-scope** feature or number.
4. We say its **limits** openly.

### Papers
| Source | Credibility | What we use it for in the MVP | Limits |
|---|---|---|---|
| **Dev SI, et al. (2024).** Cognitive performance in ISS astronauts on 6-month low Earth orbit missions. *Frontiers in Physiology*. doi:10.3389/fphys.2024.1451269 | Peer-reviewed. Data from **NASA's Human Research Program** Standard Measures; 25 professional ISS astronauts | **Why Signal Lock (PVT)** is the one test: sustained attention was one of the scores that most often dropped low in flight. **1.5 SD "low score" cutoff** for the red band. **Real pre-flight PVT numbers** for the demo baseline. **~6.4 h in-flight sleep**, which sets the sleep trigger. Self-rated alertness didn't predict scores, which is **why we measure instead of just asking** | Small, highly selected group; low Earth orbit only |
| **Basner M, Mollicone D, Dinges DF (2011).** Validity and sensitivity of a brief psychomotor vigilance test (PVT-B) to total and partial sleep deprivation. *Acta Astronautica*. doi:10.1016/j.actaastro.2011.07.015 | Peer-reviewed validation study; the authors built NASA's cognitive tests | **3-minute test length**, 1–4 s random waits, **355 ms lapse** threshold | Validated on Earth sleep-loss studies, not in flight |
| **Basner M, et al. (2015).** Development and validation of the Cognition test battery for spaceflight. *Aerospace Medicine and Human Performance*. doi:10.3357/AMHP.4343.2015 | Peer-reviewed; the battery NASA uses with ISS crews | Confirms the PVT is a **standard NASA in-flight measure**, so Signal Lock mirrors real practice | The battery has 10 tests; we use only the PVT |
| **Chua EC-P, et al. (2012).** Heart rate variability can be used to estimate sleepiness-related decrements in psychomotor vigilance during total sleep deprivation. *Sleep*. doi:10.5665/sleep.1688 | Peer-reviewed; leading sleep journal | **Why low HRV triggers the alertness check**: HRV tracked PVT performance during sleep loss | Lab sleep deprivation, healthy men, not spaceflight |
| **de Zambotti M, et al. (2019).** The sleep of the ring: comparison of the ŌURA sleep tracker against polysomnography. *Behavioral Sleep Medicine*. doi:10.1080/15402002.2017.1300587 | Peer-reviewed validation against lab polysomnography (the clinical gold standard) | **Sleep hours from a wearable are trustworthy, sleep stages aren't.** So we show hours only | 41 young healthy people; one night; on Earth |
| **Lehrer PM, Gevirtz R (2014).** Heart rate variability biofeedback: how and why does it work? *Frontiers in Psychology*. doi:10.3389/fpsyg.2014.00756 | Peer-reviewed review by the field's leading researchers | **Orbit Breath pace (~6 breaths/min)** | Review; benefits shown on Earth |
| **Åkerstedt T, Gillberg M (1990).** Subjective and objective sleepiness in the active individual. *International Journal of Neuroscience*. doi:10.3109/00207459008994241 | Peer-reviewed; origin of the widely used Karolinska Sleepiness Scale | **1–9 sleepiness tap** in the check-in | Self-report only; that's why it's paired with the test |
| **Can YS, Arnrich B, Ersoy C (2019).** Stress detection in daily life scenarios using smart phones and wearable sensors: a survey. *Journal of Biomedical Informatics*. doi:10.1016/j.jbi.2019.103139 | Peer-reviewed survey | Daytime stress detection is unreliable, so **HRV is read during sleep** | Survey of terrestrial studies |
| **Tjoa E, Guan C (2021).** A survey on explainable AI: toward medical XAI. *IEEE Transactions on Neural Networks and Learning Systems*. doi:10.1109/TNNLS.2020.3027314 | Peer-reviewed; top IEEE journal | Every alert **names its cause** ("HRV 22% below your baseline") | General medical AI, not astronaut-specific |
| **Overbey EG, et al. (2024).** The Space Omics and Medical Atlas (SOMA)… *Nature*. doi:10.1038/s41586-024-07639-y, and **Garrett-Bakelman FE, et al. (2019).** The NASA Twins Study. *Science*. doi:10.1126/science.aau8650 | Peer-reviewed; *Nature* and *Science*; NASA-involved consortia | Responses differ by person, so we use **personal baselines**, not one cutoff for everyone | Very small crews; molecular focus |
| **Afshinnekoo E, et al. (2020).** Fundamental biological features of spaceflight. *Cell*. doi:10.1016/j.cell.2020.10.050 | Peer-reviewed; *Cell* | The app **screens and points to follow-up; it doesn't diagnose** | Synthesis paper, not a device study |
| **Fritsch-Yelle JM, Charles JB, Jones MM, Wood ML (1996).** Microgravity decreases heart rate and arterial pressure in humans. *Journal of Applied Physiology* 80(3):910–914. doi:10.1152/jappl.1996.80.3.910 | Peer-reviewed; NASA JSC study (DSO 602/463 in NASA's Life Sciences Portal); **24-h in-flight Holter + BP** during normal routines | In flight, **heart rate, diastolic BP and their variability all drop** compared with pre-flight. So HR, HRV and BP rules use an **in-flight baseline**, and the app tells the astronaut a lower in-flight heart rate is normal. Arrhythmias didn't rise during routine flight, so arrhythmia detection stays out of scope | Short Shuttle flights (4–14 days); 1990s equipment |
| **Dijk DJ, et al. (2001).** Sleep, performance, circadian rhythms, and light-dark cycles during two space shuttle flights. *Am J Physiol Regul Integr Comp Physiol* 281(5):R1647. doi:10.1152/ajpregu.2001.281.5.r1647 | Peer-reviewed; astronauts measured in flight on two Shuttle missions (actigraphy + polysomnography) | **Independent confirmation of ~6.5 h in-flight sleep** (matches Dev et al.'s 6.4 h), plus measured performance drops with sleep loss in space. Supports the sleep trigger and the alertness check | 5 astronauts; Shuttle missions |

### Data sources
| Source | Credibility | What we use it for | Limits |
|---|---|---|---|
| **MMASH** on PhysioNet (Rossi A, et al. 2020, *Data* 5(4):91, doi:10.3390/data5040091; dataset doi:10.13026/cerq-fc86) | Published, peer-reviewed data paper; hosted on **PhysioNet** (MIT / NIH-funded repository) | **Real beat-to-beat heart data (for HRV) and sleep data** replayed in the demo. License ODbL v1.0: must credit it | 22 young men, 24 h each, on Earth |
| **NASA OSDR** OSD-575: Inspiration4 metabolic panel (part of SOMA, Overbey et al. 2024, *Nature*) | NASA's official repository; clinical lab (Quest Diagnostics) results from real crew | **Real crew blood glucose** for the demo's blood-sugar row, and the lab's **65–99 mg/dL** range as the OK band. The only human clinical value in OSDR that matches a challenge indicator | 4 crew, 3-day flight, pre/post-flight only; unexplained low readings at 45 days after landing are excluded |
| **NASA OSDR** OSD-939 (Davis CM, et al. 2015, *PLOS ONE*, doi:10.1371/journal.pone.0144556) | NASA's official repository + peer-reviewed paper | **Supporting evidence only:** space-type radiation impaired a rat version of the PVT. No rat numbers are used in scoring | Rats, not humans |
| **NASA Life Sciences Portal (NLSP)**: human cardiovascular experiments, ISS + Shuttle | NASA's official archive of crew experiments | **Evidence only.** Points us to the peer-reviewed results above (DSO 602/463). The in-flight heart and BP numbers themselves are **restricted** (formal data request), so they're not demo data | Of 106 experiments, 7 are fully public and 16 partly; 37 international ones never archived data |
| **NASA Human Research Program** (5 Hazards; Risks of Human Spaceflight) | Official NASA, linked by the challenge | Framing: which hazards the app addresses | Overview pages, not data |

## Open conflicts with the design docs (team to decide)
The design system in `docs/design/` (on the `mohammed-altaie` branch) and this scope disagree on a few points. Neither file has been changed to match the other. The team should pick one answer for each:

| Topic | Design docs say | This scope says | Why it matters |
|---|---|---|---|
| Home screen | **Body figure is the centerpiece** (6 tappable regions, mirrored by a list) | Status + top issue + one action up front; body figure parked | NASA feedback: most important thing up front. A list reads faster than a figure |
| Check-in | Check-in sheet logs **all 6 indicators + exercise** (P0); "3 of 5 check-ins" routine | **2 taps a day** (mood + sleepiness, confirm sleep). BP, temperature and glucose only when prompted. HR, HRV and sleep pulled from data | Crew-time budget (≤ 60 s a day) |
| Cognitive check | Mini-game is **P2** (later) | **In MVP**, triggered only | It's the evidence-backed fatigue check (Dev et al. 2024) |
| Gamification | Streak + **badges** (P1) | Streak only | Badges add nothing to health status |
| Baseline | First **3 days** of check-ins | **3 pre-flight rested sessions** for the alertness check | In-mission checks mostly happen when tired |

Where they already agree: camera input out of scope, 3D only as an optional extra behind a toggle, "Am I OK?" answerable in seconds, streak-based gamification.

## How to decide on a new idea
Ask these in order. Any "no" sends it to the parking lot:
1. **Does it answer a challenge question** (gather, evaluate, act, or when to escalate)?
2. **Does it stay inside the crew-time budget**, or replace something that costs more?
3. **Is it the most important thing on that screen**, or can it live one tap deeper?
4. **Can we build and demo it with the time we have left?**

## What "done" looks like for the demo
- [ ] Open app → status + top issue + action visible in under 5 s
- [ ] Daily check-in completed in under 60 s
- [ ] A low-HRV moment in replayed MMASH data triggers the alertness check
- [ ] Signal Lock result → one action (breathing / rest / flag flight surgeon)
- [ ] Tap any indicator → 7-day trend
- [ ] All demo data clearly labeled as recorded/sample
