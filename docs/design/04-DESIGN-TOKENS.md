# 04 — Design Tokens

**Source of truth:** [`tokens.css`](./tokens.css). Copy it unchanged to `src/styles/tokens.css`. Components use `var(--…)` only. The theme is light only (no dark mode in the MVP).

## A. Color

All contrast values below were computed 2026-11-14 with the dataviz skill's `contrast()` function.

### A1. Surfaces

| Token | Value | Use |
|---|---|---|
| `--color-bg` | `#F4F2EE` | Page: warm paper, flat |
| `--color-surface` | `#FFFFFF` | Cards, sheets, inputs |
| `--color-surface-inset` | `#EBE8E1` | Segmented-control track, input fill, chips |
| `--color-glass` | `rgba(255,255,255,0.70)` + `blur(16px)` | **Only** the status header and the toolbar. Composite ≈ `#FCFBFA`. |
| `--color-hairline` | `#D8D3C8` | All card borders, dividers (decorative, 1.3:1) |
| `--color-scrim` | `rgba(20,33,61,0.32)` | Behind sheets |

### A2. Ink

| Token | Value | On paper | On card | Use |
|---|---|---|---|---|
| `--color-ink` | `#14213D` | 14.3 | 16.0 | Headings, numbers |
| `--color-ink-2` | `#4A5266` | 7.0 | 7.8 | Body, secondary |
| `--color-ink-muted` | `#5F6577` | 5.2 | 5.8 | Labels, ticks, timestamps (lightest allowed text) |
| `--color-ink-inverse` | `#FFFFFF` | — | — | On accent and Act fills |

### A3. Accent (one only)

| Token | Value | Contrast | Use |
|---|---|---|---|
| `--color-accent` | `#1D4ED8` (cobalt) | 6.0 on paper; white on it 6.7 | Primary buttons, links, focus ring, selected state, the one highlighted chart point |
| `--color-accent-hover` / `-pressed` | `#1A43BC` / `#163A9F` | — | States |
| `--color-accent-soft` | `rgba(29,78,216,0.10)` | — | Selected chip, hover wash |

**Why cobalt and not signal orange:**
- The user-preferred orange **failed** the validator against the status colors:
  - `#C2410C` vs Watch `#A16207`: CVD ΔE **0.6**.
  - `#C2410C` vs Act `#B42318`: normal-vision ΔE **6.0**.
  - The floors are CVD ≥ 6 and normal ≥ 15.
- Any orange collides with amber Watch and red Act. A button would read as a warning.
- Cobalt passes every hard check (§A5). It reads as engineering-drawing ink, not as an AI gradient.

### A4. Status (reserved; always icon + word)

| Status | Word | Mark | Text (on soft bg) | Soft bg | Icon (lucide) |
|---|---|---|---|---|---|
| ok | **OK** | `#2E7D4F` | `#256B42` (5.5) | `#E6EFEA` | `circle-check` |
| watch | **Watch** | `#B7791F` | `#7D5200` (6.0) | `#F6EFE4` | `eye` |
| act | **Act** | `#B42318` | `#9F1D14` (6.5) | `#F6E5E3` | `triangle-alert` |
| none | **No data** | `#8A8F9C` | `#5F6577` (5.2) | `#F1F2F3` | `circle-dashed` |

**Meanings** (rules in SCOPE.md and MINIGAME.md):
- **OK:** within your baseline or safe range.
- **Watch:** drifting; re-check or apply the countermeasure.
- **Act:** outside the safe range or an Act rule fired. Follow the action; the crew medical officer is flagged.

### A5. Validator output (`validate_palette.js --mode light --surface #f4f2ee --pairs all`)

```
accent+status  "#1D4ED8,#2E7D4F,#B7791F,#B42318"
  [WARN] CVD separation   worst all-pairs #B42318↔#2E7D4F ΔE 6.5 (deutan) · tritan 5.8
  [PASS] Normal-vision    worst all-pairs #B42318↔#B7791F ΔE 17.4
  [PASS] Contrast         all 4 >= 3:1
  → ALL CHECKS PASS (6–8 band legal only with secondary encoding → status always has icon + word)
chart line vs highlight "#5A6478,#1D4ED8" on #ffffff
  [PASS] CVD 16.9 · [PASS] Normal 18.3 · [PASS] Contrast
  (band/chroma checks fail by design: graphite is a single "ink" series, not a categorical palette)
```

### A6. Charts

| Token | Value | Use |
|---|---|---|
| `--chart-line` | `#5A6478` (graphite) | The single "you" series, like pen on a lab report |
| `--chart-highlight` | `= --color-accent` | Latest or selected point (one per chart) |
| `--chart-baseline-band` | `rgba(20,33,61,0.07)` | Personal baseline corridor ("Your usual range") |
| `--chart-limit` | `#9F1D14` at 1px dashed | A cited Act limit line, if one exists |
| `--chart-grid` | `#E6E2D9` | 1px solid horizontal gridlines |
| `--chart-axis` | `#CFC9BD` | Axis line |

**Rules:**
- MVP charts have **one series**. BP uses one color with two point shapes.
- If a second series is ever needed, re-run the validator.

## B. Glass

Glass appears on exactly two surfaces: the **status header** (the top of Home) and the **toolbar**.

**Recipe:**
- Background `--color-glass`, `backdrop-filter: blur(16px) saturate(140%)`.
- Border `1px solid rgba(255,255,255,0.8)` plus a bottom hairline `--color-hairline`.
- No shadow.

**Fallback:** solid `#FCFBFA` under any of these:
- `@supports not (backdrop-filter: …)`
- `prefers-reduced-transparency`
- `forced-colors`

## C. Typography

Fonts (Google Fonts):
- **IBM Plex Sans** 400/500/600 for all text.
- **IBM Plex Mono** 400/500 for every number, unit, time and code.

| Token | Font | Size/line | Weight | Use |
|---|---|---|---|---|
| `--type-status` | Plex Sans | 32/38 | 600 | Overall status word on Home ("Watch") |
| `--type-hero-number` | Plex Mono | 56/60 | 400 | One per screen (e.g. "118/76", "286 ms") |
| `--type-title` | Plex Sans | 24/30 | 600 | Screen title |
| `--type-section` | Plex Sans | 18/24 | 600 | Card and section titles |
| `--type-body` | Plex Sans | 17/24 | 400 | Body and guidance (tablet reading distance) |
| `--type-body-sm` | Plex Sans | 15/20 | 400 | Secondary text |
| `--type-label` | Plex Sans | 13/16 | 500, +0.08em, UPPERCASE | Row and field labels |
| `--type-value` | Plex Mono | 22/28 | 500 | Row values |
| `--type-unit` | Plex Mono | 14/18 | 400 | Units, in ink-muted |
| `--type-caption` | Plex Mono | 12/16 | 400 | Timestamps, sources, chart ticks |
| `--type-button` | Plex Sans | 17/22 | 600 | Buttons |

**Rules:**
- A unit is a separate span after a thin space: `64 bpm`.
- Min 12px.
- Text must reflow at 200% zoom.

## D. Spacing, geometry, layout

- **Spacing (4-pt):** 4, 8, 12, 16, 20, 24, 32, 40, 48, 64 (`--space-1` … `--space-16`).
- **Card padding:** 24.
- **Card gap:** 16.
- **Page gutter:** 32 (portrait), 40 (landscape).

**Radii:**

| Token | Value | Use |
|---|---|---|
| `--radius-sm` | 6 | Chips, inputs |
| `--radius-md` | 10 | Buttons, segmented controls |
| `--radius-lg` | 14 | Cards |
| `--radius-xl` | 20 | Sheets |

Smaller radii than the v1 bubble look; this reads as an instrument.

**Tablet layout:**

| Orientation | Width | Grid | Content max |
|---|---|---|---|
| Portrait | 744–1024 | 8 columns, gutter 24 | 100% |
| Landscape | 1024–1366 | 12 columns, gutter 24 | 1240 |

**Touch:**
- Min target **48×48** with 12px spacing (gloves, microgravity drift; MINIGAME §4.8).
- Signal Lock uses the **whole screen** as its target.

**Icons:**
- lucide, 1.5px stroke, 20px (24px in the toolbar).
- Inline beside text. **Never** in filled shapes.

## E. Motion

| Token | Value |
|---|---|
| `--duration-fast` | 120ms |
| `--duration-base` | 180ms |
| `--ease` | `cubic-bezier(0.2,0,0,1)` |

**Rules:**
- No decorative animation.
- Chart lines appear instantly. A 150ms fade on first load is allowed.
- Under `prefers-reduced-motion`: no motion at all.
- **Signal Lock exception:** the stimulus appears with no transition (timing accuracy).

## F. Imagery

| Asset | Rule |
|---|---|
| Body figure | A fine-line technical drawing (doc 08). If AI-generated, it carries a visible "AI-generated illustration" label (E5). |
| Photos | None |
| Avatars | Initials only |
| NASA branding | Never (E6). Name sources in text only. |
