# Pulsaris judging audit and Claude handoff

Audited 14 November 2026. Read-only implementation review; no app fixes made. Reasoning setting verified xhigh. Current working tree includes the approved solid-blue body model; do not restart anatomical refinement.

## Verdict

**Provisional holistic prototype rating: 3/5.** Useful working concept, not yet an exemplary submission. This is an independent assessment, not an official judge score or a prediction of winning. Submission eligibility remains unverified.

| Diagnostic criterion | Rating | Evidence and limitation |
|---|---:|---|
| Impact | 3/5 | Addresses crew fatigue and limited crew time with a check-in/action/recheck loop. No user trial, measured time savings or demonstrated improvement yet. |
| Creativity | 3/5 | Combines personal trends, provenance and offline workflow thoughtfully. Health dashboards, reaction tests and rotating bodies are established ideas; the distinctive operational benefit needs demonstration. |
| Validity | 3/5 | Real MMASH recording, traceable NASA reference, explicit synthetic history and 17 passing domain tests. Browser rendering failure and demo/scoring separation weaken feasibility and trust. |
| Relevance | 4/5 | Directly matches visual astronaut health self-assessment and includes requested indicators. NASA resources affect the reaction comparison and explanations. Most physiological example data are Earth recordings or synthetic; do not present them as spaceflight measurements. |
| Presentation | 2/5 | Legible, restrained interface and useful explanations, but dense screens, broken body rendering in the audited browser, stale disclosure, and no verified final public demo/pitch package. |

These five numbers are diagnostic, **not an official weighted total out of 25**. The verified official 2025 judging instructions require a holistic 1–5 rating guided by these five criteria. A current 2026 official local-event page lists the same five criteria, but the current global judging-guide URL could not be retrieved. Confirm the 2026/local rules before submitting.

Official sources:
- [2025 official judging instructions](https://spaceapps-v2-staging.s3.amazonaws.com/media/documents/Final_Space_Apps_2025_Judging_Guidelines_for_web.pdf)
- [2026 official Ajmer event: five criteria](https://www.spaceappschallenge.org/2026/local-events/ajmer/)
- [2026 selected challenge](https://www.spaceappschallenge.org/2026/challenges/health-monitoring-software/)
- [Current judging guide URL; retrieval unsuccessful during audit](https://www.spaceappschallenge.org/resources/judging-awards-guide/)

The 2025 guide first checks eligibility: public unrestricted links, NASA resources, English, AI disclosure and a demo of at most 30 seconds or seven slides including title/end. It directs a score of 1 if a minimum requirement fails. These are a **historical official checklist pending 2026 confirmation**, not a claim that the current project has already been disqualified. No submitted project form or final pitch was reviewed.

## What the HTML app is

README and build scripts intentionally package a React/TypeScript app into `dist/pulsaris.html`, a self-contained offline interactive prototype. HTML is the distribution format, not evidence of a throwaway mockup. This can be the working hackathon demo. It is not production medical software and does not alone constitute the submission: public access, project narrative, references, credits, AI disclosure and the required pitch still matter. Do not rebuild it in another stack merely to look like an end product.

## Verified evidence

- Browser tested the built HTML at 1280×800 and 390×844 in an isolated incognito session. Entered mood 4, sleepiness 7, confirmed sleep, saved check-in, observed Watch and a pending alertness check. Opened Measurements, HRV detail and Body map.
- HRV detail correctly labels 7 synthetic historical nights and a recorded Earth MMASH night, provides units, trend summaries and source links.
- Mobile Today had no measured horizontal overflow (390 CSS-pixel viewport); the mission header/navigation occupies about 264 pixels on Body map. Primary content therefore gets little first-screen space. Mobile was a CSS viewport test, not a physical phone/touch test.
- `npm test -- --run`: 17/17 passed. `npm run build`: passed typecheck/build and generated 1,855 kB offline HTML. Bundle-size warning remains. Passing these checks did not detect the shader failure.
- No complete timed 3-minute run, real device timing calibration, offline file-open cross-browser matrix, clinical validation, user study, hosted deployment or submission form was verified. Do not imply otherwise.

## Ordered handoff: fix before polishing

### P0 — body rendering regression

`src/ui/Body3D.tsx:93–94` declares GLSL variable `active`. Browser console: `Illegal use of reserved word`, fragment shader fails compilation, model is blank while region labels remain. WebGL2 was available, so this was not simply an unsupported browser. This regression is in the recently simplified model shader.

Acceptance: rename the variable; rebuild; visually inspect the **built offline HTML**, confirm visible opaque blue model, rotation in both directions, region selection, and no shader errors. Preserve the approved shape/material. Add a readable fallback for rendering failure. Do not commission new imagery.

### P0 — correct disclosure and submission package

README:87 and `src/views/LogSources.tsx:145` still say hand-coded vector/no AI-generated images. Body page correctly says AI-generated visualization. Update all credits to match actual local image/3D generation and AI-assisted coding, including Codex contributions. Review applicable generated-image/video watermark rules for any screenshots, textures or demo frames; do not assume the 3D caption settles every submission requirement.

Acceptance: consistent disclosure in app, README and project submission; public no-login URL tested on a separate device; finished pitch within confirmed current limits; all references and asset/license credits present. No deployment URL or finished pitch was verified in this audit. The prior Claude handoff also marked those outstanding; verify current external state before claiming they are absent.

### P1 — isolate demonstration data from health assessment

`src/domain/rules.ts:140` accepts every valid session today, with no protocol or provenance filter. A 45-second `demo-short` run, and synthetic sample outcomes, can therefore influence the same overall assessment as a full run. Result labels warn about demo length, but the status engine still consumes it. `src/state/store.tsx` also clears recheck reminders on any valid run.

Acceptance: separate a clearly labeled simulation mode from crew assessment. A short/synthetic sample must not resolve a real pending check or replace a full measured result outside that mode. Add domain tests for this separation. Keep a fast judge demonstration, clearly marked as simulated.

### P1 — make scientific claims internally consistent

- The Dev et al. paper really reports PVT speed 5.25, SD 0.24, N=24 in Table 1; these are **pre-flight descriptive baselines**, not validated clinical Watch/Act thresholds. Code comments and result wording recognize pre-flight; preserve this distinction in the pitch. Study: https://www.frontiersin.org/journals/physiology/articles/10.3389/fphys.2024.1451269/full
- Existing team-starting-point labels are a strength. Keep them. Provide a compact rule/source/assumption/limitation table, including glucose and temperature cutoffs, rather than imply NASA validated the whole decision engine.
- `Measurements.tsx:91` always plots the NASA reference even when a session may have been scored against a personal baseline. Result view also reconstructs personal mean using the fixed reference SD. Store and consistently display the exact comparison mean/SD used for each scored session.
- Blood pressure is logged with **no interpretation rule**, while Sources says BP is compared with in-flight nights. Correct that inconsistency. Do not invent urgent-care thresholds during a presentation polish pass.
- Baseline helper uses seven readings, not seven distinct nights. Enforce night/day uniqueness or correct the wording and assumptions.

Acceptance: every label and graph agrees with stored scoring inputs; tests cover personal comparison and duplicate-night cases; no unsupported diagnostic claim. NASA reference dependence must be explainable in one sentence.

### P1 — demonstrate usefulness with people

Run at least three cold walkthroughs with teammates/new users: find the main issue, complete check-in, interpret synthetic versus recorded evidence, find the next action, and explain whether a flag actually sends anything. Record completion time, mistakes and exact confusion. This is usability evidence, not astronaut or clinical validation.

Acceptance: report actual observed results and fix the largest misunderstandings. Use the measured results in the pitch only with participant/context qualifiers.

### P2 — focused presentation and navigation

- Put status, key reason and one primary next action into a compact tablet first screen. Today repeats evidence and nine indicators; detailed scientific explanations belong behind drill-downs. Do not add new visual features until the story reads quickly.
- Reduce mobile mission-band height while retaining mission context. Keep the tablet target explicit.
- Browser routing initializes from hash then uses replaceState; no hashchange/popstate handling was found. Make browser Back/Forward behave predictably without breaking reload/deep links.
- Flag delivery is a local simulation. Plan view discloses that no message leaves the tablet, but store/log wording says delivered when the demo ground link changes. Keep simulation wording adjacent to the status and never present it as actual communications.
- Traceability checkboxes are stale and referenced `docs/scope/SCOPE.md`, `RESEARCH.md`, `MINIGAME.md` are missing from this checkout. Repair the handoff documentation using implemented behavior, not planned behavior.

## Suggested pitch

One crew member after a short night, one clearly stated concern, one check-in, a visibly simulated jump to a reaction-test result, one practical next action and recheck, then the specific NASA reference and offline capability. Show what the software helps the crew do. The body is supporting navigation, not the principal innovation. Do not claim the prototype diagnoses illness, proves flight readiness, or transmits to a medical officer.

Freeze new features. Fix rendering and truthfulness, isolate demo scoring, verify the end-to-end loop, test with people, then finish the public submission and concise pitch. Re-audit those concrete artifacts before assigning a higher score.
