# 07 — Component System

**Conventions:**
- One folder per component: `src/components/<Name>/`.
- CSS Modules using `tokens.css` only.
- **Required states:** default, hover (pointer only), focus-visible (2px `--color-focus-ring`, 2px offset), pressed, disabled.
- **Hit area:** ≥48px.
- Screens compose components. They never style one-off cards.

| Component | Purpose | Spec | Notes |
|---|---|---|---|
| **Toolbar** | Top bar | `.glass`, 64px: "Pulsaris" (`--type-section`) left, settings icon button right | One of only two glass surfaces |
| **StatusHeader** | Overall status + cause + one action | `.glass`, full width: StatusChip `lg` + status word (`--type-status`), cause line (`--type-body`), one primary Button + optional Snooze menu | The second glass surface. Max 1 action. |
| **Card** | Container | `.card`: white, hairline, radius-lg, no shadow | Size cards by content. Don't force equal heights. |
| **DueCard** | Check-in / BP prompt | A Card with a label, "≤60 s" in mono caption, and a Start button | Disappears when done (shows ✓ for the day) |
| **IndicatorRow** | One indicator | 64px min: label (`--type-label`), value + unit (mono), StatusChip `sm`, relative time if older than 24 h, chevron. The whole row is a button. | Hairline dividers between rows |
| **StatusChip** | Status | Soft background + 16px icon in the mark color + word in the text color. Sizes `sm` / `lg`. | Always icon + word |
| **Button** | Actions | Height 52, radius-md, `--type-button`. Variants: `primary` (accent fill, white text), `secondary` (white + hairline, ink text), `quiet` (accent text only), `danger` (Act text color on white + hairline) | One primary per view |
| **Segmented / ScaleSelector** | Mood 1–5 | Inset track, 5 segments of ≥64px, selected = white + accent border; end words at the extremes | `role="radiogroup"` |
| **KssSlider** | Sleepiness 1–9 | Track with 9 stops and a live verbal anchor beside it (mono number + Plex Sans words) | Arrow keys step through values |
| **NumberField** | BP, sugar, temp | 64px tall, mono 22 value, unit suffix in muted, numeric keypad | Unit is part of the accessible name |
| **Sheet** | Check-in, entry | White, radius-xl top (portrait) or centered 640px (landscape), scrim, focus trap, Esc to close | Never glass |
| **MetricHero** | Detail headline | Mono 56 value + unit, chip, cause, baseline, ProvenanceNote | One per screen |
| **TrendChart** | 7-day trend | Spec in doc 08 | One series |
| **ChartSummary** | Takeaway sentence under each chart; also its `aria-label` | Generated from data | Required |
| **Disclosure** | "Why it matters", "How measured" | A row with a chevron; content uses `--type-body` plus a SourceTag | — |
| **SourceTag** | Citation | Mono caption, accent, ↗ | "opens in new tab" in its label |
| **ProvenanceNote** | Data origin | Mono caption in muted: "Recorded · MMASH" / "Self-reported" / "NASA ISS pre-flight reference (Dev 2024)" / "Sample" | Required next to every hero value |
| **CountermeasureCard** | Result action | A Card with a **DO THIS NOW** label, one primary action (`--type-section`), secondary actions (`--type-body-sm`) and a SourceTag | Act variant adds "Crew medical officer flagged" |
| **SignalStimulus** | PVT signal | A 160px cobalt ring with the ms counter in mono 56. No animation in. | The full screen is the tap target |
| **BodyFigure** | Secondary status picture | Doc 08 | Never the only path |
| **StreakLine** | Gamification | Mono caption: "12-day check-in streak" | Completion only, never a score |
| **Toast** | Saved confirmation | Solid ink background, white text, 3 s, `role="status"` | — |
| **EmptyState / NoData** | Missing data | "No data · last seen 2 d ago" + action | Never hide the row |

**Icons:**
- lucide outline, 1.5px stroke, inline with text.
- **Never** inside filled squares or circles.
