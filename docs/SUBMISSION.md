# Space Apps 2026 — project page, field by field

Deadline: **Submit for Judging** before **Sunday Nov 15, 11:59 p.m.** (Local Event time zone).
Where: spaceappschallenge.org → profile icon → **My Team** → **Project** tab → **Edit**.

---

## Project Name
Pulsaris

## Summary (139 words; limit 50–200)
Pulsaris is an offline health self-assessment app for astronauts. In one screen it tells a crew member what needs attention, why, and what to do next. A 30-second check-in (mood, sleepiness) joins sleep and heart data and entered readings (blood pressure, blood sugar, temperature). Explicit rules flag each indicator as no flag, Watch or Act; when fatigue signs appear, a 3-minute reaction-time test checks alertness. The app then suggests a concrete countermeasure, records what the crew member did and schedules a re-check. This matters because on Mars-class missions medical advice from Earth can lag up to 24 minutes each way, and sleep loss, the most common risk, is quiet: ISS astronauts in a NASA-funded study averaged about 6 hours of sleep against 8.5 scheduled. Pulsaris turns readings into a decision the crew can act on without a network.

## Project Demonstration
https://orion-nasa-space-apps.vercel.app/pulsaris-deck.pdf

## Project
https://orion-nasa-space-apps.vercel.app

## Project Details
**What it does.** Pulsaris covers all six indicators the challenge names (blood pressure, heart rate, blood sugar, body temperature, sleep hours, mood) plus heart rate variability, sleepiness (Karolinska Sleepiness Scale) and a 3-minute reaction-time test. The Today screen shows one status (no flag, Watch or Act), the reason, the readings behind it and one next step. Measurements shows every indicator color-coded (green no flag, amber Watch, red Act) with its trend, rule and source. A 3D body map groups readings by body system; flags point to the region and open an explanation, and symptoms are reported there. Plan & log keeps a timestamped record and JSON export.

**How it works.** Each indicator has an explicit, visible rule (for example: Watch when sleep is under 5 h; Watch when the reaction test is at least 1 SD slower than the comparison, Act at 1.5 SD or 6+ lapses). Heart data are compared with the crew member's own in-flight baseline, because heart rate and blood pressure change in microgravity. The reaction test follows the 3-minute PVT design NASA uses on the ISS (Reaction Self Test) and is compared on a scale informed by ISS astronaut data from NASA's Human Research Program (Dev et al., 2024). Recording an action never clears a concern; only a re-check does. A crew member can mark a record for medical review.

**Benefits and impact.** Less crew time spent interpreting numbers, earlier and more consistent attention to fatigue, and a clean record a flight surgeon can review when contact returns. It targets NASA's goal of Earth-independent medical operations on Mars-class missions.

**Trust.** Every value is tagged with its origin: Earth recording, generated example, crew entry or device measurement. Flags come from deterministic rules, never from Super Intelligence. It runs fully offline from a single HTML file on tablet and phone, and no data leaves the device. It is a prototype: not a medical device, not tested with astronauts, and its thresholds are labeled "not clinically validated."

**Creativity and design factors.** One decision per screen instead of a dashboard; color always paired with a word; an honest provenance tag on every number; a body map whose flags point to the region instead of covering it; designed for crew time (30-second check-in, test only when needed) and for no network.

**Hardware.** Any browser on the tablets crews already use (iPads on the ISS); built for wrist actigraphy (as in NASA's ARCHeR study on Artemis II) and the CSA Bio-Monitor shirt as data sources. Not yet connected to live devices.

**Next steps.** Review the rules with a flight surgeon, run a supervised usability study in a simulated mission, validate device timing and thresholds, then connect live wearables with delay-tolerant sync.

**Tools.** React 19, TypeScript, Vite, Three.js (3D body), Vitest (17 automated tests), Python and Node scripts for data preparation, Blender; hosted on Vercel, code on GitHub.

## Use of Super Intelligence (SI) — tick these boxes
- Code — yes (Anthropic Claude via Claude Code; OpenAI Codex)
- Text / written content — yes (interface text, documentation, pitch deck)
- Images — yes (SI-generated 3D body figure; marked "SI-generated figure" on screen and in the deck)
- Data — yes, if offered (the generated example history comes from a script written with SI help; tagged "synthetic" in the app)
- Audio / Video — only if you submit the video instead of the deck (video made with SI assistance; music and sound effects are human-made, licensed)

If there is a free-text box: "Code, interface text and the pitch deck were written with SI assistance (Anthropic Claude via Claude Code, OpenAI Codex) and reviewed by the team. The 3D body figure is SI-generated (local FLUX.2 Klein image, TRELLIS 2 mesh, Blender finishing) and carries a visible 'SI-generated figure' mark. The example history is generated by a script and tagged 'synthetic'. All health flags come from explicit rules chosen by the team, not from SI. Disclosure also in the README and the app's Sources page."

## NASA Data — Link Text | Link Url
- NASA HRP Standard Measures: Dev et al. 2024, ISS astronaut PVT reference | https://doi.org/10.3389/fphys.2024.1451269
- NASA Reaction Self Test (3-minute PVT on the ISS), NASA Spinoff 2013 | https://spinoff.nasa.gov/Spinoff2013/hm_1.html
- NASA HRP: Risk from Inadequate Sleep and Irregular Schedules | https://www.nasa.gov/reference/risk-from-inadequate-sleep-and-irregular-schedules/
- NASA HRP: 5 Hazards of Human Spaceflight | https://www.nasa.gov/hrp/hazards/
- NASA Earth-Independent Medical Operations Concept of Operations (2024) | https://ntrs.nasa.gov/citations/20240001402
- Fritsch-Yelle et al. 1996, cardiovascular changes in spaceflight (NASA JSC) | https://doi.org/10.1152/jappl.1996.80.3.910
- NASA ARCHeR: Artemis II crew health and readiness study | https://www.nasa.gov/reference/archer
- NASA technical report: iPads for ISS crew procedures | https://ntrs.nasa.gov/citations/20130000791

## Space Agency Partner & Other Data — Link Text | Link Url
- CSA Bio-Monitor (Astroskin), Canadian Space Agency | https://asc-csa.gc.ca/eng/sciences/astroskin.asp
- MMASH dataset v1.0.0 (PhysioNet, ODbL) | https://physionet.org/content/mmash/1.0.0/
- Barger et al. 2014, Lancet Neurology: astronaut sleep study | https://doi.org/10.1016/S1474-4422(14)70122-X
- Basner et al. 2011, brief PVT (PVT-B) validity, Acta Astronautica | https://doi.org/10.1016/j.actaastro.2011.07.015
- Karolinska Sleepiness Scale (Åkerstedt & Gillberg 1990) | https://doi.org/10.3109/00207459008994241
- React (MIT) | https://react.dev
- Vite (MIT) | https://vite.dev
- Three.js (MIT) | https://threejs.org
- Vitest (MIT) | https://vitest.dev
- IBM Plex Sans and Mono fonts (SIL OFL) | https://github.com/IBM/plex
- FLUX.2 Klein (SI image model, used locally for the 3D figure reference) | https://bfl.ai/models/flux-2
- TRELLIS 2 (SI image-to-3D model, Microsoft) | https://github.com/microsoft/TRELLIS
- Blender (3D finishing) | https://www.blender.org
- Anthropic Claude / Claude Code (SI coding assistant) | https://www.anthropic.com/claude-code
- OpenAI Codex (SI coding assistant) | https://openai.com/codex
- Project source code (GitHub) | https://github.com/BOT-Seth/orion-nasa-space-apps
- Only if you submit the video: Music "Happy Beats / Business Moves Vol. 11" by Sascha Ende (CC BY 4.0) | https://ende.app/en
- Only if you submit the video: Kenney sound effects (CC0) | https://kenney.nl/assets
- Only if you submit the video: HyperFrames video renderer | https://hyperframes.heygen.com

## Before you click Submit
- All three members on the Members tab, same Local Event, not waitlisted.
- Open both links in a private window: they must load with no login.
- Tick **Agree to Terms and Conditions** and **Confirm All Work is Original**, then **Submit for Judging**; wait for the banner.
