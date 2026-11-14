# 07 — Component System

Build screens by assembling these components. **Don't style a one-off "card" inside a screen file.** If you need something new, see the "Adding a component" section at the end.

## Conventions

- **Naming:** `PascalCase` component names with one folder each: `src/components/<Name>/<Name>.tsx` plus `<Name>.module.css`.
- **Props:**
  - `variant` for visual variants.
  - `size` for `sm | md | lg`.
  - `status` for health status (`good | watch | caution | alert | none`).
  - `tint` for system identity (`cardio | metabolic | mind | thermal | blood | musculo`).
- **Styling:** CSS Modules that reference `tokens.css` variables only. No inline styles except computed chart geometry.
- **States** every interactive component must implement:
  - `default`, `hover` (pointer devices only, `@media (hover:hover)`), `focus-visible`, `pressed`, `disabled`.
  - `loading` where it applies.
- **Shared rules:**
  - Focus ring: `outline: 2px solid var(--color-focus-ring); outline-offset: 2px`.
  - Hit area: ≥44×44px even when the visual is smaller (use padding or a pseudo-element).
- **Reusable vs one-off:**
  - Reusable components live in `src/components/`.
  - Screen-specific compositions (e.g. the Today hero layout) live in `src/screens/<Screen>/` and may only compose components and use layout tokens.

---

## 1. Layout components

| Component | Purpose | Spec | Variants / sizes | Responsive | A11y |
|---|---|---|---|---|---|
| **AppShell** | Background, nav and content frame | Fixed `CosmicBackground` layer, then `AppHeader`, then `<main>`, then `BottomNav` (sm/md) or `NavRail` (lg+) | — | Switches nav at 1024px | `<main id="content">`; a skip link to `#content` |
| **CosmicBackground** | Pearl base, 3 blurred orbs, 1 orbit ellipse | Tokens in doc 04 §A1. `position: fixed; inset: 0; z-index: var(--z-background)` | `orbs: "default" \| "quiet"` (quiet: 1 orb, for dense screens) | Orbs scale with the viewport | `aria-hidden="true"`; no motion when reduced |
| **PageContainer** | Gutters and max width | `padding-inline: var(--page-gutter); max-width: var(--content-max); margin-inline: auto` | — | Gutter tokens per breakpoint | — |
| **Grid** | 4/8/12 columns | CSS grid; `gap: var(--card-gap)` | `cols` per breakpoint | — | DOM order = reading order |
| **AppHeader** | Avatar, MissionPill, bell | 56px tall, transparent; becomes `glass` after 8px of scroll | — | lg: inside the content column | Bell: `aria-label="Insights, 2 new"` |
| **BottomNav** | 4 tabs | `glass` (55%, blur-strong), pill radius, floating 8px above the safe area, 64px tall; icon 24 + `--type-nav` label; active = accent icon and label plus a 4px accent dot | — | Hidden at lg+ | `<nav aria-label="Primary">`; `aria-current="page"` |
| **NavRail** | Desktop nav | 88px wide, glass, vertical icon + label | — | lg+ only | Same as BottomNav |
| **SectionHeader** | Section title + optional action | `--type-section-title`; action is a `Button variant="ghost" size="sm"` on the right | — | — | `<h2>` |
| **PageHeader** | Screen title or back button | Title in `--type-page-title`, or a back chevron with the parent label | `variant: "root" \| "pushed"` | — | `<h1>`; back is `<a>` with the parent's name |

## 2. Surfaces

| Component | Purpose | Spec | Variants | Rules |
|---|---|---|---|---|
| **GlassCard** | The standard container | `.glass` recipe (tokens.css); radius-lg; padding `--card-padding` | `surface: "glass" \| "strong"` (default strong) · `tint` · `interactive` (whole card clickable: hover lifts with shadow-raised, pressed scales to 0.99) | The tint is layered as a background gradient under the glass fill. **Text always on `strong`.** |
| **HeroStage** | Home figure area | GlassCard `surface="glass"`, radius-xl, min-height 420px (sm); optional sheen overlay | — | One per app (Today). Contains `BodyFigure` and `SideStat`s. |
| **Sheet** | Bottom sheet (sm/md) or side panel (lg) | **Solid** surface, radius-xl top, grabber 36×4, `--shadow-raised`, scrim | `size: "auto" \| "tall"` | Focus trap; Esc and swipe-down close; restores focus |
| **Popover / Menu** | Mission pill menu, range menu | Solid surface, radius-md, shadow-raised | — | Arrow-key navigation; `role="menu"` |
| **Tooltip (chart)** | Value on hover or scrub | **Solid navy** (`--color-navy`), ink-inverse text, radius-xs, `--type-caption` + `--type-body-sm` value | — | Never glass. Never covers the hovered point. |
| **Toast** | Confirmations | Solid navy, bottom center above the nav, 4 s | `status` icon | `role="status"` |
| **Banner** | Persistent notice (stale data, load error) | Solid, status-soft background + status icon + text + action | `status` | `role="alert"` only for `alert` severity |

## 3. Health data display

| Component | Purpose | Spec | Variants / sizes | Notes |
|---|---|---|---|---|
| **SideStat** | Big number beside the body | `--type-label` label, then `--type-metric-lg` value + `--type-unit`, then StatusChip `size="sm"` | — | Max 3 per HeroStage |
| **MetricHero** | Headline on Metric detail | `--type-display` value + unit; StatusChip; TrendDelta; timestamp; ProvenanceBadge | — | One per screen |
| **MetricRow** | Indicator row inside cards and sheets | 56px min height: label, value + unit, StatusChip, Sparkline (64×24), chevron | `compact` | Whole row is a link |
| **TrendRow** | Row on Trends | Like MetricRow, plus TrendDelta and a 96×32 Sparkline with baseline band | — | — |
| **SystemCard** | One body system on Today | GlassCard with `tint` + `interactive`: IconTile, system name (`--type-card-title`), StatusChip, 1–2 inline values, Sparkline | — | Mirrors a figure region (a11y parity) |
| **StatusChip** | Status at a glance | Pill: status-soft background, 16px icon in the status mark color, label in status text color, `--type-caption` (sm) or `--type-body-sm` (md) | `status` × `size: sm \| md` | **Icon + label always.** Never color only. |
| **TrendDelta** | Change vs baseline or last reading | Arrow icon (▲▼●) + signed value + unit + comparison ("vs baseline"). Ink-secondary. | — | **Not** green or red. Direction ≠ good or bad; status carries the judgment. |
| **ProvenanceBadge** | Where a number came from | Small pill with icon + text: `Self-reported` (user icon), `Simulated` (dashed border + flask icon), `NASA OSDR` (database icon), `Device` (P2) | `provenance` | Required next to every hero value and in every tooltip |
| **Badge** | Generic label (AI-generated, New) | `--type-caption`, inset surface, radius-xs | `tone: neutral \| accent` | The "AI-generated illustration" badge is mandatory on generated art (rule E5) |
| **IconTile** | Card icon (reference style) | 40×40, radius-sm, `--color-surface-solid` at 70%, 20px lucide icon in ink-primary | `tint` | — |
| **SourceTag** | Inline citation | `[NASA HRP ↗]`: caption text, accent color, external-link icon | — | Opens in a new tab; `aria-label` includes "opens in new tab" |
| **StatusExplanation** | "What this means" | Body text: the rule that fired + next step + escalation line | — | Copy pattern in doc 09 §5 |
| **ExplainerBlock** | Why it matters, how to measure | Title + body + SourceTag(s) | Inside a `Disclosure` | — |
| **DatasetCard** | NASA dataset intro | GlassCard tint `blood`: mission, crew count, timepoints, OSD IDs, caveat line | — | — |
| **CaveatList** | Limitations | Bullets with an info icon | — | Always shown with NASA data |

## 4. Charts (spec in doc 08)

| Component | Use |
|---|---|
| **TimeSeriesChart** | HR, glucose, temperature: line + raw points + baseline band + reference band |
| **RangeBarChart** | BP: vertical bar from diastolic to systolic, two point shapes (● systolic, ◆ diastolic) |
| **LollipopChart** | Sleep: daily stems + heads + goal line (the reference style) |
| **MoodStrip** | Mood: a 1–5 dot per day on 5 rows (ordinal; no line) |
| **CrewTrajectoryChart** | OSDR crew labs: 4 direct-labeled lines over days relative to flight, flight-gap band, lab reference band |
| **Sparkline** | 7-day mini line or bars inside rows and cards; no axes; latest point marked |
| **SemiGauge** | Bounded progress (routine completion): 180° arc, 12px stroke, navy fill on a track |
| **ChartSummary** | One generated sentence under every chart. Also the chart's `aria-label`. |

## 5. Interactive controls

| Component | Spec | Variants | A11y |
|---|---|---|---|
| **Button** | Height 48 (md) / 40 (sm); radius-pill; `--type-button`; icon optional (20) | `primary` (accent fill, inverse text), `secondary` (glass-strong + hairline, ink-primary), `ghost` (text only, accent), `destructive` (alert-text color, solid-white fill) · `loading` (spinner replaces icon; width fixed) | `<button>`; disabled uses `aria-disabled` + a reason tooltip |
| **IconButton** | 44×44 circle; glass-strong; 20px icon | `variant: glass \| ghost` | `aria-label` required |
| **Fab** | 56×56, accent fill, `plus` icon + "Log" label at md+ | — | `aria-label="Log a reading"` |
| **SegmentedControl** | Inset track (radius-pill), selected segment = solid white + shadow-glass, 36px tall | 2–5 segments | `role="radiogroup"`; arrow keys |
| **ChipGroup** | Horizontal scroll of chips; selected = accent-soft background + accent text | single / multi | `role="radiogroup"` or `group` |
| **MissionPill** | "ISS · Day 42 ⌄": glass-strong pill (the reference's "Today ⌄") | — | `aria-haspopup="menu"` |
| **RangeSelect** | Range menu in a pill (compact form of SegmentedControl) | — | — |
| **NumberField** | 56px tall, solid white, radius-sm, `--type-metric-md` value, unit suffix in ink-muted, inline stepper on touch | `error` | Label above; unit in the accessible name |
| **Toggle** | 51×31 switch; on = accent | — | `role="switch"` |
| **Disclosure** | Row with a chevron; expands content (`--duration-base`) | — | `<details>/<summary>` or `aria-expanded` |
| **Tooltip (UI)** | For icon-only controls on desktop | — | Shown on focus too |
| **RegionHotspot** | Tappable region on the figure: a 12px status-colored dot with a 2px white ring, sitting in a 44px transparent hit area. Selected: accent ring + accent-soft halo. | `status`, `selected` | `<button aria-label="Brain, sleep and mood, Watch">` |
| **ModelControls** (P2, 3D only) | Reset view, rotate left and right | — | Buttons; no drag-only control |

## 6. App states

| Component | When | Spec |
|---|---|---|
| **Skeleton** | Loading under 1 s is usually instant locally. Show skeletons only past 300 ms. | Inset surface blocks matching the final layout; shimmer only when motion is allowed |
| **EmptyState** | No data yet | Monoline illustration (orbit + dot), title, one-line body, one primary action |
| **StaleIndicator** | Last reading older than the indicator's expected interval (doc 09 §3) | StatusChip `none` with "Last: 2 d ago" + a Log action |
| **ErrorState** | Load or parse failure | Banner with retry; keep showing whatever did load |
| **SimulatedRibbon** | Demo mode on | Persistent Badge in the header: "Simulated demo data" |

*Sensor-disconnected states are **not** built. There is no hardware in scope.*

## Adding a component

1. Check this list first. Most needs are a variant of an existing component.
2. If it's really new, add a row to this doc in the same PR as the code, with purpose, spec, variants and a11y.
3. Use tokens only. If you need a new token, add it to doc 04 and `tokens.css`.
4. Get one teammate's review on the visual result: a screenshot in the PR.
