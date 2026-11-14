# Pulsaris — Design System

**Pulsaris** is a daily health check for astronauts that takes under a minute. It answers "Am I OK?" in 5 seconds and runs a short alertness check only when the data says something is off.

It is built for the **2026 NASA Space Apps Challenge**, *Create Health Monitoring Software for Astronauts on Space Missions* ([challenge page](https://www.spaceappschallenge.org/2026/challenges/health-monitoring-software/)).

## Source of truth

| Question | Where the answer lives |
|---|---|
| **What** we build, the crew-time budget, what's in and out of scope, evidence, thresholds | **`docs/scope/SCOPE.md`** (Aileen). This wins every conflict. Also see `MINIGAME.md`, `RESEARCH.md`, `DECISIONS.md` and `SUGGESTIONS.md`. |
| **How** it looks and behaves: tokens, screens, components, charts, accessibility | `docs/design/` (this folder) |

If a design doc disagrees with `SCOPE.md`, the design doc is wrong. Fix it.

## Read in this order

| Doc | Answers |
|---|---|
| [01 Challenge requirements](./01-CHALLENGE-REQUIREMENTS.md) | What NASA asks for, event rules, judging, how we use NASA data |
| [02 Design research](./02-DESIGN-RESEARCH.md) | Reference apps, the reasons designs look AI-generated, lessons from mockup v1 |
| [03 Design vision](./03-DESIGN-VISION.md) | "Instrument panel + printed lab report" direction, principles, anti-slop rules |
| [04 Design tokens](./04-DESIGN-TOKENS.md) + [`tokens.css`](./tokens.css) | Colors (validated), type, spacing, glass, motion |
| [05 Information architecture](./05-INFORMATION-ARCHITECTURE.md) | Screens, flows, data contract |
| [06 Screen blueprints](./06-SCREEN-BLUEPRINTS.md) | Every screen on a tablet, in portrait and landscape |
| [07 Component system](./07-COMPONENT-SYSTEM.md) | Reusable components |
| [08 Figure & data viz](./08-3D-AND-DATA-VISUALIZATION.md) | Secondary body figure, chart rules |
| [09 UX & accessibility](./09-UX-AND-ACCESSIBILITY.md) | Accessibility, trust, status words, copy |
| [10 Roadmap](./10-IMPLEMENTATION-ROADMAP.md) | Stack, build order, demo path |
| [11 Traceability](./11-REQUIREMENTS-TRACEABILITY.md) | Requirement → feature → check |
| [12 Design review](./12-DESIGN-REVIEW.md) | Risks, rejected ideas |
| [mockups/PROMPT.md](./mockups/PROMPT.md) | Image prompt for tablet mockups |

## Mandatory rules (people and AI coding agents)

1. **Crew time first.** Every screen exists to serve SCOPE.md's budget: 60 s check-in, 5 s to read status, 3 min alertness check only when triggered.
2. **Tokens only.** Use `var(--…)` from `tokens.css`. No raw hex, px, shadow or blur values in components.
3. **One accent** (`--color-accent`, cobalt), and it's for interactive things only. Status colors mean status only. No new colors.
4. **Status** is always icon + word + color: **OK / Watch / Act / No data**.
5. **Numbers** use IBM Plex Mono with their unit, and every value shows its time and source. Recorded and sample data are always labeled.
6. **Solid cards, hairline borders, no drop shadows.** Frosted glass only on the status header and the toolbar.
7. **No diagnoses, no uncited thresholds.** Every rule points to SCOPE.md, RESEARCH.md or a cited source.
8. **Accessibility:** ≥48px touch targets, keyboard reachable, reduced motion respected.
9. **Anti-slop rules** (doc 03 §4) apply to every screen and every generated image.

**When prompting an AI coding agent,** add: *"Follow docs/scope/SCOPE.md for scope and docs/design/04, 06, 07 for UI. Use tokens.css variables only. No Tailwind, no gradients, no shadows on cards."*

## Changing the system

Open a PR that edits the doc and the code together. Include a screenshot. Get one reviewer. For a color change, re-run the palette validator and paste its output.
