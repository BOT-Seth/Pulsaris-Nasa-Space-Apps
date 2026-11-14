# Orion — Design System & Product Architecture

**Product:** an astronaut self-monitoring health app for the **2026 NASA Space Apps Challenge, "Create Health Monitoring Software for Astronauts on Space Missions"** ([challenge page](https://www.spaceappschallenge.org/2026/challenges/health-monitoring-software/)).

**Visual direction:** *Orbital Health — Soft Cosmic Glass*. A light, premium health app for the space age, built around a clickable translucent body figure.

These docs are the **single source of truth** for how the app looks and behaves. Read them before building anything.

## Read in this order

| Doc | What it answers | Read it if you're… |
|---|---|---|
| [01 Challenge requirements](./01-CHALLENGE-REQUIREMENTS.md) | What NASA actually asks for, rules, judging, NASA data we use | Everyone |
| [02 Design research](./02-DESIGN-RESEARCH.md) | Reference screenshot analysis + Oura, WHOOP, Apple Health, etc. | Designing anything new |
| [03 Design vision](./03-DESIGN-VISION.md) | Personality, principles, tone | Everyone |
| [04 Design tokens](./04-DESIGN-TOKENS.md) + [`tokens.css`](./tokens.css) | Colors, glass, type, spacing, motion, imagery | Writing any CSS |
| [05 Information architecture](./05-INFORMATION-ARCHITECTURE.md) | Systems → indicators, navigation, routes, **data contract** | Building screens or data |
| [06 Screen blueprints](./06-SCREEN-BLUEPRINTS.md) | Every screen: layout, components, states, a11y | Building a screen |
| [07 Component system](./07-COMPONENT-SYSTEM.md) | Every reusable component and its spec | Building UI |
| [08 Body model & data viz](./08-3D-AND-DATA-VISUALIZATION.md) | Figure approach, asset pipeline, chart language | Figure or charts |
| [09 UX & accessibility](./09-UX-AND-ACCESSIBILITY.md) | A11y rules, trust, status logic, copy patterns, privacy | Everyone |
| [10 Roadmap](./10-IMPLEMENTATION-ROADMAP.md) | Tech stack, P0/P1/P2, team split, demo path | Planning |
| [11 Traceability](./11-REQUIREMENTS-TRACEABILITY.md) | Requirement → feature → screen → validation | Before submitting |
| [12 Design review](./12-DESIGN-REVIEW.md) | Critique, risks, rejected ideas | Leads |

## Mandatory rules (all contributors, including AI coding agents)

1. **Tokens only.** Use `var(--…)` from `tokens.css`. No raw hex, px, blur or shadow values in components.
2. **Reuse components** from doc 07. A new component or variant means a doc 07 update in the same PR.
3. **Spacing** comes only from the 4-pt scale. **Cards** always use `--radius-lg` and `--card-padding`.
4. **Charts** use our chart wrappers and follow doc 08 §C:
   - monotone curves, raw points, no gap bridging, one axis, a summary sentence.
5. **Status** is always icon + label + color. Status colors mean status only. Series colors never mean status.
6. **No new accent colors.** One interactive color (`--color-accent`).
7. **Every value** shows a unit, timestamp and provenance. **Simulated data is always labeled.**
8. **No diagnoses, no invented thresholds.** Every range needs a cited `source`.
9. **Compliance:**
   - AI-generated images carry the visible "AI-generated" badge.
   - No NASA logos, flags or patches.
   - No likeness of anyone under 18.
10. **Accessibility:** keyboard reachable, ≥44px targets, reduced-motion and reduced-transparency respected.
11. **Don't invent screens.** New screens or patterns are documented in docs 05 and 06 first.

**When prompting an AI coding agent,** include: *"Follow docs/design/04-DESIGN-TOKENS.md, 07-COMPONENT-SYSTEM.md and 08-3D-AND-DATA-VISUALIZATION.md. Use tokens.css variables only. No Tailwind."*

## Changing the system

1. Open a PR that edits the doc **and** `tokens.css` or the component in the same change.
2. Write one line on *why* and attach a before/after screenshot.
3. Get one reviewer from another sub-team. The design lead breaks ties.
4. For color changes, re-run the palette validator and paste the result into the PR.

## Status of this foundation

- **Done:** research, tokens, IA, blueprints, components, viz rules, roadmap, traceability.
- **Not done:** app code (deliberately). The figure asset. Cited reference ranges (U1). See doc 11 §E for the open items.
- **First screen to prototype:** **Today** (doc 06 S1), then **Metric detail** (S5).
