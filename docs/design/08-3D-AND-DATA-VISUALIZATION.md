# 08 — Body Model & Data Visualization

## A. The centerpiece: options compared

The challenge itself suggests "a human figure where each part of the body is clickable and displays information about its function and health status" (S2). The figure must therefore **work as a control**, not just as art.

| Criterion | 1. Interactive WebGL 3D (Three.js / R3F + GLB) | 2. 2.5D layered (several PNG layers + parallax + SVG regions) | 3. Pre-rendered still + SVG hotspots |
|---|---|---|---|
| Visual quality | Highest ceiling, but cheap models look worse than a good render | High: depth from layers (shell, organs, glow) | High: a studio-quality render |
| Dev difficulty | High: loading, lighting, raycast picking, camera limits | Medium | **Low** |
| Mobile performance | Risky: GPU, battery, a 5–20 MB model | Good (≈300–600 KB WebP) | **Best** (≈200–400 KB) |
| Time to build | 1–2 days | ~0.5 day | **2–4 hours** |
| Ties to health data | Good (per-mesh color) | Good (per-region SVG paths) | Good (per-region SVG paths) |
| Accessibility | Hard (canvas); needs a parallel DOM | Easy (SVG buttons) | **Easy** (SVG buttons) |
| Demo suitability | Impressive if it works; a crash ends the demo | Impressive and stable | Stable |

### Recommendation

- **Build option 3 now and upgrade it to option 2 in P1. Treat option 1 as P2 only.**
- The visual "wow" in the reference comes from the render quality and composition, not from real-time 3D.
- A pre-rendered figure with live SVG status regions delivers that look on any judge's laptop or phone.
- It keeps the figure accessible and fits the deadline.
- 3D (P2) may reuse the same asset pipeline: TRELLIS.2 is on the team machine, and it can export a GLB for a `<model-viewer>` or R3F view. That view must sit behind a toggle with the 2D figure as the default.

## B. Figure specification

### B1. Art direction

- **Subject:** an adult figure in a slim, plain flight suit. There are **no patches, flags, logos or mission identifiers** (rule E6).
- **Face:** no identifiable facial detail. It is a smooth, abstract head.
- **Look:**
  - The suit and skin are a translucent pearl shell.
  - Inside are stylized organ systems: the heart and vessels in muted rose, the brain in lavender, the skeleton in warm ivory, the gut in soft peach.
  - The style is close to the reference's anatomical figure, softened and less gory.
- **Pose:** standing, relaxed and slightly turned (3/4), arms a little away from the body so regions don't overlap. A floating microgravity pose is optional and allowed only if every region stays separable.
- **Render:**
  - Soft top-left studio light, no hard shadows.
  - A transparent background.
  - The lower legs fade to transparent over the bottom 20% (as in the reference).
- **Output:**
  - `figure@2x.webp` and `figure@3x.webp` (1200×1800 and 1800×2700).
  - A PNG fallback.
  - P1 adds layer variants: `figure-shell`, `figure-organs`, `figure-glow`.
- **Labeling:**
  - If the figure is AI-generated, show `Badge "AI-generated illustration"` in the HeroStage corner (rule E5).
  - Record the tool and prompt in `REFERENCES.md`.

### B2. Asset pipeline (team machine)

1. **Generate** with local ComfyUI at `E:\AI\ComfyUI`. FLUX.2 klein 4B is fast for iterating; Z-Image Turbo can be used for a final pass.
2. **Remove the background.** There is no background-removal node installed, so add one or use an external tool.
3. **Clean up** in an image editor:
   - Remove any text, logos or extra fingers.
   - Check that the figure looks clearly adult.
4. **Trace the region paths** (see B3) in Figma or Inkscape over the final image. Export them as one SVG with the same viewBox as the image.
5. **Optional P2:** produce a GLB from TRELLIS.2 using the same concept image.

Not verified: whether ComfyUI runs on the team's AMD RX 9070 XT setup, and how fast. Test it before you rely on it. **Fallback:** a CC-licensed anatomy model (e.g. BodyParts3D or Z-Anatomy; **confirm the license** and attribute it), rendered once in Blender.

### B3. Regions

| Region id | System | Anchor (hotspot %, x/y of image) | Path covers |
|---|---|---|---|
| `mind` | Brain, sleep & mood | 50 / 9 | Head |
| `cardio` | Heart & circulation | 47 / 30 | Chest |
| `blood` | Blood (crew labs) | 28 / 42 | Left arm and vessels |
| `metabolic` | Metabolism | 50 / 45 | Abdomen |
| `musculo` | Bones & muscles | 45 / 70 | Legs |
| `thermal` | Temperature & immune | body outline | Whole-silhouette outline glow |

The anchor percentages are starting estimates. Adjust them to the final art and keep them in `content/regions.json`.

### B4. Behavior

| Situation | Behavior |
|---|---|
| Idle | Hotspot dots show status colors. One soft pulse on first load, then none. No continuous animation. |
| Region status | The region path is filled with the status mark color at 18% opacity plus a 1.5px stroke at 60%. `good` regions get **no fill** (only the dot), so attention goes to problems. |
| Hover (pointer) | The region path shows an accent-soft fill and a tooltip label: "Heart & circulation · In range". |
| Tap / Enter | The selected region gets an accent stroke and the System sheet opens. On mobile the figure **scales to 1.25× and pans** so the region sits in the visible top half (`--duration-slow`, standard ease). |
| Selection vs status | Selection is always **accent blue**; status uses status colors. They never share a color. |
| Missing data | Hotspot is `none` gray with a dashed ring. The region gets no fill. The tooltip reads "No recent data". |
| Simulated data | Status displays normally. The header SimulatedRibbon covers it. |
| Touch | 44px hit area per hotspot, plus the SVG path itself. Tapping the background deselects. |
| Keyboard | Regions are `<button>`s in head-to-toe order. Arrow keys move between regions. Enter opens the sheet. |
| Reduced motion | No pulse, no zoom or pan. The sheet opens with no figure transform. |
| P1 parallax (option 2) | Layers shift up to 6px with device tilt or pointer. Off under reduced motion. |
| **Conceptual vs measured** | The figure is **illustrative**. Its coloring reflects computed status. Region shapes do **not** depict the user's anatomy. The About screen says so. |

## C. Chart language

Follow the dataviz rules: thin marks, recessive chrome, one axis, text in ink and never in series color, and color never as the only signal.

### C1. Marks

| Element | Spec |
|---|---|
| Line | `2px`, round cap and join, `curve = monotoneX` (d3 `curveMonotoneX` / Recharts `type="monotone"`). **Never** cardinal, basis or natural curves: they overshoot and invent values. |
| Raw points | Always drawn: 8px (r=4) dots in the series color with a 2px ring in the surface color. They may be hidden when there are more than 60 points in view; they then reappear in the tooltip and on scrub. |
| Highlight point | The latest or selected point: 10px dot in `--color-highlight` (amber) with a 2px ring. Only one per chart (the reference's amber marker). |
| Baseline band | The personal baseline corridor (mean ± 1 SD of the baseline period, labeled "Your usual range"). Filled with `--chart-baseline-band` and no stroke. |
| Reference band | The cited reference range (e.g. a lab range in OSDR data). Filled with `--chart-reference-band` with 1px `--chart-axis` edges. Labeled at the right edge: "Lab range". |
| Threshold / goal line | 1px `--color-navy` at 50% opacity, dashed 4/4. Labeled with a navy pill such as "Goal 8 h" (reference style). Dashes are allowed **only** for goal and threshold lines, never for gridlines. |
| Gridlines | Horizontal only, 1px solid `--chart-grid`, max 4. No vertical gridlines. |
| Axis | The baseline axis is 1px `--chart-axis`. Ticks are `--type-caption` in ink-muted. Max 3–5 y-ticks at round values. |
| Dot texture | Decorative dot matrix (2px dots, 12px pitch, `--chart-dot-texture`), allowed **only** in the plot background of hero charts (MetricHero card). It is never used as a gridline and never carries data. It is the reference's dotted field. |
| Bars (sleep, sparkline bars) | Max 24px wide, 4px rounded top, square at the baseline, 2px gap between bars |
| Lollipop (sleep) | 2px stem in `--color-ink-secondary` at 60% + an 8px head. Today's head uses `--color-highlight`. |
| BP range bar | 4px-wide vertical bar from diastolic to systolic in series-1 at 40%. ● systolic and ◆ diastolic markers. |

### C2. Data honesty rules (mandatory)

1. **Never bridge a gap.**
   - If consecutive readings are more than 1.5× the expected interval apart (doc 09 §3), break the line.
   - Draw a small `--chart-axis` tick at the gap with the tooltip "No readings".
2. **Never smooth or average values in the line.** If you show a moving average (P2), draw it as a separate, labeled series, and keep the raw points.
3. **Y-axis:**
   - Heart rate, BP, glucose and temperature may use a non-zero baseline. Pad the domain 10% around the larger of the data or the reference band.
   - Sleep bars **start at 0**.
   - Never clip data. The domain always includes every point.
4. **Units** appear in the axis title or the first tick label ("bpm").
5. **Simulated series** are drawn the same way but always come with a `Simulated` ProvenanceBadge in the chart header. On mixed charts, simulated points use a hollow marker.
6. **One y-axis per chart.** For two measures with different units, use two stacked charts with a shared x-axis.
7. **Time:**
   - The x-axis uses local mission time.
   - Ticks look like "Nov 12" or "08:00".
   - Crew Science uses "days relative to flight" with launch (L) and return (R) markers and a shaded flight period.

### C3. Color mapping

| Chart | Series colors |
|---|---|
| Any single-indicator chart ("you") | series-1 blue |
| BP | series-1 (systolic marker) / series-2 (diastolic marker), with shapes distinct |
| Crew Science | C001 = series-1, C002 = series-2, C003 = series-3, C004 = series-4. Fixed, direct-labeled at the line ends. A legend is also present. |
| Status | Never in series. Status shows only in StatusChips and figure regions. |

### C4. Interaction

- **Hover / scrub:**
  - A vertical crosshair (1px `--chart-axis`) snaps to the nearest point.
  - A solid navy tooltip shows the value + unit, date and time, provenance, and the context note.
  - The whole plot area is the hit target.
- **Range control:** a SegmentedControl above the chart (Day | Week | Mission | All). Changing the range **keeps series colors**.
- **Keyboard:**
  - The chart is focusable.
  - ← and → step through points, announcing values through `aria-live="polite"`.
- **Table:** a "View as table" toggle under each chart.

### C5. Animation

- **First render only:**
  - Lines draw in left to right over `--duration-chart`.
  - The gauge sweeps from 0.
  - Points fade in after the line.
- **No animation on data refresh** beyond a 120ms crossfade.
- **Reduced motion:** nothing animates.

### C6. Chart summaries (required)

Every chart has one data-generated sentence under it. It is also the chart's accessible name. Examples:
- "Resting heart rate averaged 64 bpm this week, within your usual range of 58–68."
- "Hemoglobin stayed within the lab range for all four crew. The largest change was C002 one day after return."

Generate these from the data with templates. Never hand-write them for a specific dataset.

## D. Circular indicators

- **Use SemiGauge only for bounded, goal-type quantities** (routine completion, days in baseline).
- **Never use rings** for physiological values. A heart rate "73% full" is meaningless.
- **Gauge spec:**
  - A 180° arc with a 12px stroke and round caps.
  - Track `--color-surface-inset`, fill `--color-navy`.
  - The value is centered in `--type-metric-md` with a label under it.
