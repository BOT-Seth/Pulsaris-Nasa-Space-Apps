# Decisions Log

Newest at the top. Record what was decided, why, and by whom. Open questions live in [MINIGAME.md §6](MINIGAME.md#6-open-questions-for-the-team).

| Date | Decision | Why | Status |
|---|---|---|---|
| 2026-11-14 | Minigame renamed **Beacon** (was Signal Lock) | Team decision (Aileen) | **Decided** |
| 2026-11-14 | Test length is **adaptive (PVT-BA, Basner 2022)**: stops once 99.619% sure, 3 min max; about 1 min 45 s on average. Baseline-setting checks run the full 3 min | A fixed 3 min was too much crew time; fixed short tests miss moderate tiredness (Roach 2006). Team decision (Aileen) | **Decided** |
| 2026-11-14 | OK / Watch / Act = PVT-BA's **HIGH / MEDIUM / LOW** (≤ 6, 7–16, 17+ lapses + false starts). Replaces the 1.5 SD speed rule | Validated categories, unlike our own speed rule; follows from the adaptive decision | **Decided** |
| 2026-11-14 | Scoring uses the astronaut's **own baseline on the same device**. Lapse line = 355 ms + (baseline median − 211 ms NASA reference), never below 355 | Tablets add touch/screen delay that lab hardware didn't. Team decision (Aileen) for own baseline; the lapse-line formula is ours | Own baseline **Decided**; formula proposed, needs team OK |
| 2026-11-14 | PVT-BA likelihood ratios use the **conservative end** of the ranges in the paper's text; first-30-s events count half | Exact values are only in a chart; conservative values can only lengthen tests, not decide sooner | Proposed, needs team OK |
| 2026-11-14 | Recovery step = **countermeasure card**; Orbit Breath moved to stretch | Saves up to 2 min; breathing has the weakest evidence without live sensors. Team decision (Aileen), from Mohammed's suggestion | **Decided** |
| 2026-11-14 | Minigame built as a **self-contained module** (`minigame/src/beacon/`) with its own dev page | Drops into the app by copying one folder; no clash with the lead dev's scaffold. Team decision (Aileen) | **Decided** |
| 2026-11-14 | No 0–100 score; Details trimmed to what an astronaut can act on | Every element on screen must matter (NASA feedback) | Proposed, needs team OK |
| 2026-11-14 | Blood sugar: demo values = **real Inspiration4 crew glucose** (OSD-575); OK band = lab range **65–99 mg/dL**; an out-of-range typed value prompts **one re-check** before alerting | The only open human clinical data in OSDR matching a challenge indicator. Single readings swing widely (56–100 in one person pre-flight), so a re-check is cheaper than a false alarm | Proposed, needs team OK |
| 2026-11-14 | HR, HRV and BP rules compare with an **in-flight rolling baseline**, never pre-flight. The low-HRV trigger is off for the first 7 days of flight while that baseline builds | HR, diastolic BP and HRV all normally drop in microgravity (Fritsch-Yelle et al. 1996; NASA DSO 602/463), so pre-flight comparisons would flag everyone daily | Proposed, needs team OK |
| 2026-11-14 | NLSP is used as **evidence, not demo data** | In-flight cardiovascular recordings there are restricted or were never archived | Decided (no data available) |
| 2026-11-14 | **No live wearable hookup.** Data is only pulled from published datasets. Moved from "parked" to "not doing" | Team decision (Aileen) | **Decided** |
| 2026-11-14 | Source rule: only peer-reviewed journals (plus labeled peer-reviewed conference papers) and official data repositories | Team decision (Aileen) | **Decided** |
| 2026-11-14 | Red band at **≥ 1.5 SD** below baseline (was > 2 SD); yellow at 1–1.5 SD | Matches the low-score cutoff in NASA's ISS cognition study (Dev et al. 2024) | **Superseded** by PVT-BA bands (above) |
| 2026-11-14 | Short-sleep trigger: **< 5 h alone, or < 6 h plus low HRV / sleepiness ≥ 7** (was < 6 h alone) | Astronauts average ~6.4 h in flight, so < 6 h alone would fire too often for the crew-time budget | Proposed, needs team OK |
| 2026-11-14 | Low-HRV trigger uses **sleep-window** HRV | Exercise and posture confound daytime HRV (Can et al. 2019 survey) | Proposed, needs team OK |
| 2026-11-14 | Demo baseline preset = **real pre-flight PVT data from 24 ISS astronauts** (Dev et al. 2024) | Real NASA numbers instead of invented ones | Proposed, needs team OK |
| 2026-11-14 | Adopt **SCOPE.md**: one status + one action up front, ≤ 60 s daily check-in, passive data first, alertness check **only when triggered**, everything else parked | NASA staff feedback: crew time is precious; minimal burden, most data; most important thing up front | Proposed, needs team OK |
| 2026-11-14 | Signal Lock baseline comes from **3 pre-flight rested sessions** instead of 5 in-mission ones | Triggered-only checks mostly happen when tired, so in-mission sessions can't build a rested baseline | Proposed, needs team OK |
| 2026-11-14 | Orbit Breath cut to **2 min, optional**; gamification cut to a **check-in streak** | Crew-time budget | Proposed, needs team OK |
| 2026-11-14 | Use OSDR studies (OSD-939, 618, 479, 1018) as **evidence and metric definitions**, not as scoring norms. Added a personal-lapse metric (RT > 2× own median), false-start %, and a radiation-event trigger | OSDR has no human HRV/sleep/cognitive data; the rodent data doesn't transfer to human reaction times | Proposed, needs team OK |
| 2026-11-14 | Demo HRV and sleep data come from **PhysioNet MMASH** (real RR intervals + sleep + mood/stress, 22 people, 24 h), replayed and labeled "recorded". Supersedes "simulated only" | Real human data makes the demo credible; OSDR has none. License ODbL v1.0 needs attribution (citations in RESEARCH.md) | Proposed, needs team OK |
| 2026-11-14 | Visual design is owned by the team design system (`docs/design/` on the `mohammed-altaie` branch). These docs cover scope, mechanics and evidence only | The design was being finalized separately; it now exists | Active |
| 2026-11-14 | Minigame **assesses then recovers** (not one or the other) | Measuring alone doesn't help; recovering alone gives no data | Decided |
| 2026-11-14 | Target platform: **touch tablet** | Similar to the tablets crews use on the ISS | Decided |
| 2026-11-14 | Docs deliverable: 3–5 concepts + 1 fully specced | Gives the team options plus a buildable spec | Done (MINIGAME.md) |
| 2026-11-14 | Recommended build: **Signal Lock (PVT-B) + Orbit Breath (paced breathing)** as one "Recalibrate" session | Validated, short, works with touch | Proposed, needs team OK |
| 2026-11-14 | Rewards are based on **completion, not score** | High-score rewards push tired crew to "power through" | Proposed, needs team OK |
| 2026-11-14 | Results compared with a **personal baseline**, not population norms | Individual differences are large; long missions drift | Proposed, needs team OK |
