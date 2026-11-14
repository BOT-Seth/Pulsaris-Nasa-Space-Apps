# 10 — Implementation Roadmap

**Deadline:** submission closes **Sun Nov 15, 2026, 11:59 p.m.** in our Local Event's time zone. That leaves about 1.5 days. The plan is challenge-first.

## 1. Technology decision

The repo was empty when we started (README + `assets/icon.svg`), so there is no prior decision to preserve.

| Choice | Decision | Why |
|---|---|---|
| Framework | **React + TypeScript + Vite** (current stable releases; pin at scaffold) | The team and our AI tools know it best. It deploys as a static site for free. It has the component model that doc 07 needs. |
| Styling | **CSS Modules + `tokens.css`** (CSS custom properties) | One token source. Glass needs real CSS (`backdrop-filter`). **No Tailwind**, to avoid a second, competing token system. |
| Charts | **Recharts** (`type="monotone"` = monotoneX), wrapped in our own chart components | Fast to build. Our wrappers enforce doc 08. Screens never import Recharts directly. |
| Icons | **lucide-react** | Matches the reference's outline icons |
| Routing | **react-router** | The routes in doc 05 §5 |
| State | React context + `localStorage` (or `idb-keyval`) | Local-first, no backend |
| NASA data | Build-time script `scripts/fetch-osdr.mjs`, which writes `public/data/osdr/{cbc,cmp}.json` | Offline-capable, fast, avoids CORS and API outages during judging |
| Hosting | GitHub Pages or Netlify | A public link with no login (rule E8) |
| 3D (P2 only) | `<model-viewer>` or `@react-three/fiber`, lazy-loaded | Never in the critical path |

## 2. Priorities

Complexity: S = under 2 h · M = 2–5 h · L = more than 5 h.

### P0 — Challenge-essential (must ship)

| # | Item | Complexity | Depends on | Covers |
|---|---|---|---|---|
| P0-1 | Scaffold: Vite + TS + router + `tokens.css` + fonts + `AppShell` + `CosmicBackground` + `BottomNav` | S | — | Foundation |
| P0-2 | Data contract (`Reading`, `IndicatorStatus`) + local storage + seed of **simulated** demo data (14 days, labeled) | S | P0-1 | R3, trust |
| P0-3 | Content files: `indicators.json` (units, intervals, cited ranges), `systems.json` (function, HRP hazard/risk text + URLs, countermeasures), `rules.json` | M | Research (U1) | R2, S8, E3 |
| P0-4 | Status engine `evaluate.ts` (doc 09 §4) with `reasons[]` | M | P0-2, P0-3 | R1, R4, S7 |
| P0-5 | Core components: GlassCard, StatusChip, ProvenanceBadge, Button, SegmentedControl, MetricRow, Sheet | M | P0-1 | All screens |
| P0-6 | **Today** screen: HeroStage + figure (still image) + 6 SVG hotspots + SideStats + SystemCards | M | P0-4, P0-5, figure asset | R1, S2, S7 |
| P0-7 | **Check-in sheet** (all 6 indicators + exercise, validation, how-to-measure) | M | P0-5 | R3, R5, S8 |
| P0-8 | **Metric detail** with TimeSeriesChart (baseline + reference bands, gaps, tooltip, summary) | L | P0-4, P0-5 | R7, S6, R2 |
| P0-9 | **Crew Science**: OSDR fetch script + CrewTrajectoryChart + caveats + sources | M | P0-1 | **E2, E4** |
| P0-10 | System sheet (function, why in space, what to do, cited) | S | P0-3, P0-5 | S2, R2 |
| P0-11 | Disclaimer, About, AI-use statement, `REFERENCES.md`, AI watermark badge on generated art | S | — | E5, E6, E9 |
| P0-12 | Deploy + public link + **≤30 s demo video** or ≤7 slides | M | Everything above | E8, Presentation |

### P1 — Core experience and visual quality

| # | Item | Complexity | Depends on |
|---|---|---|---|
| P1-1 | Trends list with sparklines + range control | M | P0-8 |
| P1-2 | Insights tab: ranked insights, insight detail, streak card (gamification S5) | M | P0-4 |
| P1-3 | RangeBarChart (BP), LollipopChart (sleep), MoodStrip | M | P0-8 |
| P1-4 | Profile: mission phase + environment, units, export/clear, demo toggle | S | P0-2 |
| P1-5 | Onboarding (3 cards + "Explore with demo data") | S | P0-2 |
| P1-6 | Figure upgrade to 2.5D layers + parallax + region zoom | M | Layered asset |
| P1-7 | Desktop layouts (rail, master–detail, side panel) | M | P0 screens |
| P1-8 | Accessibility pass (doc 09 §7 checklist) + table views | M | P0 screens |

### P2 — Premium enhancements

| # | Item | Complexity |
|---|---|---|
| P2-1 | Interactive 3D figure (TRELLIS.2 GLB) behind a toggle | L |
| P2-2 | Cognitive check mini-game (reaction time), triggered by a sleep "watch" | M |
| P2-3 | Radiation environment layer (DONKI space weather, CSA radiation context) | M |
| P2-4 | Mission-day scrubber replaying body status (NASA Eyes pattern) | M |
| P2-5 | Status modes (EVA day, Illness, Rest) adjusting expectations | M |
| P2-6 | Dark mode with separately validated tokens | M |
| P2-7 | "Share with flight surgeon" summary export (PDF/JSON) | S |

## 3. Suggested team split (P0)

| Person | Owns |
|---|---|
| Lead dev | P0-1, P0-2, P0-4, then P0-8 |
| Frontend dev | P0-5, P0-6, P0-7, P0-10 |
| Data dev | P0-9 (OSDR script + chart), then P1-3 |
| Research / content (the research-journal author is a good fit) | P0-3 content and cited ranges, P0-11 references, U1/U5 verification |
| Design / demo | Figure asset (doc 08 §B2), P0-12 demo, slides |

**Merge order to avoid blocking:** P0-1 and the data contract (doc 05 §6) first. Then all P0 items run in parallel against the contract.

## 4. Demo path (30 seconds, designed now)

1. **0–3 s:** Today. The figure shows a "watch" glow on the head. The voice-over gives the team name and the challenge.
2. **3–10 s:** Tap the head to open the System sheet: "Sleep below your baseline", with "Why it matters in space · NASA HRP".
3. **10–17 s:** Metric detail. Scrub the chart: baseline band, a raw point, and the Simulated badge visible.
4. **17–25 s:** Crew Science. Four real Inspiration4 crew lines from NASA OSDR, before and after flight.
5. **25–30 s:** Log a reading in the Check-in sheet; the status updates. Closing line about long missions and Earth analogs.

English subtitles. The Simulated badge stays visible throughout. The AI-generated badge is visible on the figure.

## 5. Definition of done (per screen)

- [ ] Uses only components from doc 07 and tokens from doc 04.
- [ ] All states from its blueprint (doc 06) are implemented.
- [ ] Passes the doc 09 §7 checklist items that apply to it.
- [ ] Every value shows unit, timestamp and provenance.
- [ ] A screenshot is attached to the PR and reviewed by one teammate.
