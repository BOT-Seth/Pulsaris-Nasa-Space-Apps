# 08 — Body Figure & Data Visualization

## A. Body figure (secondary status picture)

The challenge suggests a clickable figure (S2). The mentors and SCOPE.md put status first. So the figure is a **small secondary view**: never the centerpiece, never the only path to anything.

| Aspect | Spec |
|---|---|
| Placement | Home side column (landscape) or below the list (portrait). Max ~320px tall. |
| Style | **A fine-line technical anatomical drawing**, like a medical textbook plate or an engineering diagram. 1px ink lines on transparent, light hatching, front view, adult, no face detail, no insignia. **No glow, no 3D render, no gradients.** |
| Status | **Leader lines** run from regions to small labels at the edge ("Head · Watch"). A region gets a 15% fill of its status mark only when it's Watch or Act. OK regions stay plain ink. |
| Regions | Head = sleep, sleepiness, mood, alertness · Chest = heart rate, HRV, blood pressure · Abdomen = blood sugar · Whole outline = temperature |
| Interaction | Tapping a region opens the same Indicator detail as its row. Regions are `<button>`s, in the same order as the list. |
| Assets | SVG preferred (hand-traced or vector). If AI-generated, it shows a visible "AI-generated illustration" caption (E5) and is listed in References. |
| Not | A centerpiece, a 3D model, an animation |

## B. Chart rules

These follow the dataviz method:
- one axis;
- thin marks;
- text in ink, never in series color;
- color never the only signal.

| Element | Spec |
|---|---|
| Range | **7 days** only (SCOPE.md). No range control. |
| Series | One. `--chart-line` graphite, 2px, `monotoneX` curve. **Never** a cardinal or spline curve, because those overshoot and invent values. |
| Points | Every reading drawn as an 8px dot with a 2px white ring. The latest point is `--chart-highlight` cobalt. |
| Baseline band | `--chart-baseline-band`, labeled "Your usual range", from the personal baseline (mean ± 1 SD) |
| Limit line | Only for a **cited** Act limit: 1px `--chart-limit` dashed, labeled with its source |
| Grid / axis | Max 4 horizontal 1px solid gridlines. Mono 12 ticks in ink-muted. Unit in the first tick. |
| Gaps | Never bridge missing days. Break the line and show a small "No data" tick. |
| Y domain | HR, HRV, BP, sugar and temperature may use a non-zero baseline (padded 10%). Sleep bars start at 0. Never clip data. |
| Sleep | Bars ≤24px wide, 4px rounded top, square at the base, graphite. The latest bar is cobalt. Goal line "Goal 8 h" is 1px dashed ink at 50%. |
| BP | A vertical line per reading from diastolic to systolic, with ● systolic and ◆ diastolic |
| Mood / sleepiness | Ordinal dots on fixed rows (1–5, 1–9). No line. |
| Alertness | One point per session (median RT), with lapse count as a caption. Band shown via StatusChip, not chart color. |
| Interaction | Tap or hover snaps to the nearest point. A solid ink tooltip shows value + unit, date and time, and provenance. "View as table" toggle. |
| Summary | One generated sentence under each chart, also used as `aria-label`. Example: "HRV averaged 47 ms this week, below your usual range of 47–59 ms on 3 nights." |
| Motion | None, or a 150ms fade on first load |
| Decoration | No dot fields, wave lines or gradients |
