# 04 — Design Tokens

**Single source of truth:** [`tokens.css`](./tokens.css). Copy it into the app unchanged as `src/styles/tokens.css`. These rules are mandatory:

- **Use semantic tokens only.** Never write a raw hex, px value or blur value in a component file.
- **Missing a token?** Add it here and to `tokens.css` in the same PR (see README "Changing the system").
- **Theme:** light only for the hackathon. Dark mode is P2 and must get its own validated values; never auto-invert.

---

## A. Color

### A1. Background ("cosmic dawn")

| Token | Value | Use |
|---|---|---|
| `--color-bg-canvas` | `#F3F5FA` | Page base |
| `--color-bg-canvas-alt` | `#E9EDF7` | Lower-page gradient stop |
| `--color-bg-orb-sky` | `#C9D7F7` | Blurred orb, top-right |
| `--color-bg-orb-lavender` | `#DCD3F6` | Blurred orb, mid-left |
| `--color-bg-orb-peach` | `#F6DFCF` | Blurred orb, bottom-right |
| `--color-bg-orbit-line` | `rgba(14, 26, 58, 0.06)` | 1px decorative orbital ellipse |

**Orb rules:**
- Draw orbs as `radial-gradient` circles 360–520px wide, blurred 80px, on a fixed layer behind the app.
- Max 3 orbs per screen.
- Orbs never animate faster than one 30-second drift, and never under `prefers-reduced-motion`.

### A2. Surfaces

| Token | Value | Use |
|---|---|---|
| `--color-surface-solid` | `#FFFFFF` | Inputs, sheets on mobile, fallback |
| `--color-surface-glass` | `rgba(255, 255, 255, 0.55)` | Hero/decorative glass, nav bar |
| `--color-surface-glass-strong` | `rgba(255, 255, 255, 0.72)` | **Default for data cards** and anything with body text |
| `--color-surface-glass-fallback` | `rgba(250, 251, 254, 0.94)` | When `backdrop-filter` is unsupported or `prefers-reduced-transparency` is set |
| `--color-surface-inset` | `rgba(14, 26, 58, 0.04)` | Segmented-control track, chips, input fill |
| `--color-surface-scrim` | `rgba(14, 26, 58, 0.28)` | Behind modals and sheets |

**System tints:** layered under glass on cards of that system. Tint = identity, never status.

| Token | Value | System |
|---|---|---|
| `--tint-cardio` | `rgba(250, 222, 214, 0.55)` | Heart & circulation (HR, BP) |
| `--tint-metabolic` | `rgba(214, 228, 250, 0.55)` | Metabolism (blood sugar) |
| `--tint-mind` | `rgba(228, 222, 250, 0.55)` | Brain, sleep & mood |
| `--tint-thermal` | `rgba(214, 240, 232, 0.55)` | Temperature & immune |
| `--tint-blood` | `rgba(246, 220, 230, 0.55)` | Blood (crew lab data) |
| `--tint-musculo` | `rgba(240, 232, 214, 0.55)` | Bones & muscles |

### A3. Text (ink)

All values were checked against the **worst-case** glass composite: 55% white over the darkest orb, which resolves to `#E7EBF9`.

| Token | Value | Contrast on worst glass | Use |
|---|---|---|---|
| `--color-ink-primary` | `#0E1A3A` | 14.4:1 | Headings, metric values |
| `--color-ink-secondary` | `#465170` | 6.6:1 | Body, card subtitles |
| `--color-ink-muted` | `#5D6785` | 4.7:1 (AA) | Labels, axis text, timestamps |
| `--color-ink-inverse` | `#FFFFFF` | — | On accent/navy fills |

**Rule:** No text lighter than `--color-ink-muted`. Placeholder text uses `--color-ink-muted` too.

### A4. Brand and interaction

| Token | Value | Contrast (worst glass) | Use |
|---|---|---|---|
| `--color-accent` | `#2F54D6` | 5.3:1 | Links, primary buttons, focus, active nav, selection |
| `--color-accent-hover` | `#2546B8` | — | Hover |
| `--color-accent-pressed` | `#1E3A9C` | — | Pressed |
| `--color-accent-soft` | `rgba(47, 84, 214, 0.12)` | — | Selected chip, hover wash, region selection glow |
| `--color-navy` | `#1B2559` | — | Gauge fill, dark tooltip and goal pill (reference "Goal 8h" pill) |
| `--color-highlight` | `#E0A23A` | marks only | The **one** highlighted data point per chart (reference amber dot) |
| `--color-focus-ring` | `#2F54D6` | — | 2px ring, 2px offset |

**Rule:** Brand has **one** interactive color (accent). Teal and lavender are not tokens on purpose: they would compete with chart series and status colors.

### A5. Health status (reserved; never used for anything else)

Status always ships as **icon + label + color**.

| Status | Label (UI copy) | Mark color | Text color (AA on glass) | Icon (lucide) | Meaning |
|---|---|---|---|---|---|
| `good` | In range | `#0CA30C` | `#13762A` (4.8:1) | `circle-check` | Within the personal baseline and the reference range |
| `watch` | Watch | `#FAB219` | `#8A5A00` (5.0:1) | `eye` | Drifting from baseline; re-measure |
| `caution` | Out of range | `#EC835A` | `#B2431C` (4.8:1) | `triangle-alert` | Outside the reference range; follow the guidance |
| `alert` | Contact flight surgeon | `#D03B3B` | `#C53030` (4.6:1) | `octagon-alert` | Escalation rule hit (doc 09 §4) |
| `none` | No recent data | `#8C93A8` | `#5D6785` | `circle-dashed` | Stale or missing |

Each status also has a soft background: the mark color at 12% alpha (`--status-*-soft`).

Mark colors come from the dataviz skill's validated status palette. Warning and serious marks are under 3:1 on light surfaces by design, which is why the icon and label are mandatory.

### A6. Chart series (validated)

Run with `validate_palette.js --mode light --surface #f7f8fc` on the adjacent pairlist (lines). **ALL CHECKS PASS.** Worst adjacent CVD ΔE is 9.2 and worst normal-vision ΔE is 27.6.

| Token | Value | Typical use |
|---|---|---|
| `--chart-series-1` | `#2A78D6` (blue) | "You" / primary series / Crew C001 |
| `--chart-series-2` | `#EB6834` (orange) | Comparison / C002 / diastolic |
| `--chart-series-3` | `#1BAF7A` (aqua) | C003. Below 3:1 contrast, so **must** be direct-labeled. |
| `--chart-series-4` | `#6250D6` (violet) | C004 |
| `--chart-baseline-band` | `rgba(47, 84, 214, 0.10)` | Personal baseline corridor |
| `--chart-reference-band` | `rgba(14, 26, 58, 0.05)` | Lab or reference range corridor |
| `--chart-grid` | `#E1E4EE` | 1px solid hairline gridlines |
| `--chart-axis` | `#C3C8D6` | Baseline/axis line |
| `--chart-dot-texture` | `rgba(14, 26, 58, 0.07)` | Decorative dot field (doc 08 §C) |

**Chart color rules:**
- **4 series max per chart.** This order passes for **lines only**. For scatter or overlapping-point charts, use 3 series max (an all-pairs check of 4 fails: blue vs violet ΔE 10.5).
- **Fixed order, never cycled.** Color follows the entity (C001 is always blue).
- **No chart text in series color.** Labels use ink; a colored key-dot carries identity.
- **Status colors never encode a series.** Series colors never encode status.

---

## B. Glass (frost) specification

The frost is **stronger than the reference** but still readable.

| Property | Token | Value |
|---|---|---|
| Blur | `--glass-blur` | `24px` (hero/nav `--glass-blur-strong: 32px`) |
| Saturation boost | `--glass-saturate` | `160%` |
| Fill | `--color-surface-glass-strong` / `--color-surface-glass` | 72% / 55% white |
| Border | `--glass-border` | `1px solid rgba(255, 255, 255, 0.70)` |
| Outer hairline | `--glass-hairline` | `0 0 0 1px rgba(14, 26, 58, 0.06)`, part of the shadow stack so it doesn't double the border |
| Top highlight | `--glass-highlight` | `inset 0 1px 0 rgba(255, 255, 255, 0.85)` |
| Shadow | `--shadow-glass` | `0 1px 2px rgba(16, 24, 48, 0.04), 0 12px 32px -12px rgba(16, 24, 48, 0.14)` |
| Raised shadow (sheets, popovers) | `--shadow-raised` | `0 2px 4px rgba(16, 24, 48, 0.06), 0 24px 48px -16px rgba(16, 24, 48, 0.22)` |
| Sheen (optional, hero card only) | — | `linear-gradient(135deg, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0) 40%)` overlay |

**Layering rules:**
1. Max **two glass layers stacked** (card on page; popover on card). A third layer must be solid.
2. Text always sits on `glass-strong` (72%) or solid. `glass` (55%) is only for the nav bar, hero ring and figure stage.
3. Never put glass on glass of the **same** blur. The upper layer uses `--glass-blur-strong`.
4. Fallbacks are mandatory:
   - `@supports not (backdrop-filter: blur(1px))` uses `--color-surface-glass-fallback`.
   - `@media (prefers-reduced-transparency: reduce)` uses the same fallback.
   - Windows High Contrast (`forced-colors: active`) uses system colors with a 1px border.
5. **Never** use glass for: form inputs, tooltips (use solid navy), data tables, toasts or alert banners. These are always solid.

---

## C. Typography

**Fonts (Google Fonts):**
- **Manrope** (300/500/600/700) for display, headings and hero numbers.
- **Inter** (400/500/600) for UI, body, labels and chart text.
- Fallback stack: `ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif`.

Numbers that update or sit in columns use `font-variant-numeric: tabular-nums` (Inter supports this). **Verify Manrope's tabular figures at scaffold time.** If they're missing, render hero numbers in Inter at the same size and weight.

| Token | Font | Size / line-height | Weight | Tracking | Use |
|---|---|---|---|---|---|
| `--type-hero-number` | Manrope | 64 / 64 | 300 | −0.02em | The one hero value per screen ("74") |
| `--type-display` | Manrope | 40 / 44 | 300 | −0.02em | Metric detail headline value |
| `--type-page-title` | Manrope | 28 / 34 | 600 | −0.01em | Screen titles |
| `--type-section-title` | Manrope | 20 / 26 | 600 | −0.005em | Section headers |
| `--type-metric-lg` | Manrope | 32 / 36 | 500 | −0.01em | Side stats beside the body |
| `--type-metric-md` | Inter | 24 / 28 | 600 | −0.01em | Card values |
| `--type-card-title` | Inter | 16 / 22 | 600 | 0 | Card titles |
| `--type-body` | Inter | 15 / 22 | 400 | 0 | Body copy, guidance |
| `--type-body-sm` | Inter | 13 / 18 | 400 | 0 | Card subtitles, helper text |
| `--type-label` | Inter | 12 / 16 | 500 | +0.06em, UPPERCASE | Metric labels ("RESTING HR") |
| `--type-unit` | Inter | 13 / 16 | 500 | 0 | Units after numbers ("bpm"), in ink-muted |
| `--type-caption` | Inter | 11 / 14 | 500 | +0.02em | Chart ticks, timestamps, source badges |
| `--type-nav` | Inter | 11 / 14 | 500 | +0.01em | Bottom nav labels |
| `--type-button` | Inter | 15 / 20 | 600 | 0 | Buttons |

**Rules:**
- A unit is always a separate, smaller span after the value with a thin space: `72 bpm`, `118/76 mmHg`, `98 mg/dL`.
- Use one hero number per screen at most.
- Use minimum 11px anywhere, and 13px for anything that must be read rather than scanned.
- Text supports 200% zoom without clipping. Cards grow vertically, and text never truncates silently.

---

## D. Spacing, geometry, layout

**Spacing scale (4-pt):** `--space-0_5: 2px`, `--space-1: 4px`, `--space-2: 8px`, `--space-3: 12px`, `--space-4: 16px`, `--space-5: 20px`, `--space-6: 24px`, `--space-8: 32px`, `--space-10: 40px`, `--space-12: 48px`, `--space-16: 64px`.

| Use | Token |
|---|---|
| Card padding (mobile / ≥md) | `--space-5` / `--space-6` |
| Gap between cards (mobile / ≥md) | `--space-3` / `--space-4` |
| Gap inside card: title to content | `--space-4` |
| Section spacing | `--space-8` |
| Page side gutter (mobile / md / lg) | `--space-4` / `--space-6` / `--space-8` |
| Label to value | `--space-1` |

**Radii:**

| Token | Value | Use |
|---|---|---|
| `--radius-xs` | `8px` | Chips, tooltips |
| `--radius-sm` | `12px` | Inputs, small buttons, icon tiles |
| `--radius-md` | `16px` | Nested panels inside cards |
| `--radius-lg` | `24px` | **All cards** |
| `--radius-xl` | `32px` | Bottom sheets (top corners), hero stage |
| `--radius-pill` | `999px` | Pills, segmented controls, nav bar |

**Nested radius rule:** inner radius = outer radius − padding. A panel inside a 24px card with 8px inset uses 16px.

**Breakpoints and grid:**

| Name | Min width | Columns | Max content width | Nav |
|---|---|---|---|---|
| `sm` (phone) | 0 | 4 | 100% | Bottom bar |
| `md` (tablet) | 600px | 8 | 760px | Bottom bar |
| `lg` (laptop) | 1024px | 12 | 1200px | Left rail |
| `xl` | 1440px | 12 | 1280px | Left rail |

**Fixed dimensions:**

| Token | Value |
|---|---|
| `--nav-bottom-height` | `64px` + `env(safe-area-inset-bottom)` |
| `--nav-rail-width` | `88px` |
| `--header-height` | `56px` |
| `--touch-target-min` | `44px` |
| `--icon-sm` | `16px` (inline) |
| `--icon-md` | `20px` (default, in buttons and cards) |
| `--icon-lg` | `24px` (nav) |
| `--icon-tile` | `40px` square tile with a 20px icon (the reference's card icon tiles) |

**Icons:** use [lucide](https://lucide.dev) outline icons at 1.75px stroke. Do not mix icon sets. Do not use emoji in the UI.

---

## E. Motion

| Token | Value | Use |
|---|---|---|
| `--ease-standard` | `cubic-bezier(0.2, 0, 0, 1)` | Most transitions |
| `--ease-emphasized` | `cubic-bezier(0.3, 0, 0, 1.2)` | Sheet entry (slight settle) |
| `--duration-fast` | `120ms` | Hover, press |
| `--duration-base` | `200ms` | Toggles, tab change |
| `--duration-slow` | `320ms` | Sheets, region focus |
| `--duration-chart` | `600ms` | Line draw-in, gauge sweep (first render only) |

Under `prefers-reduced-motion: reduce`:
- All durations drop to 0, except opacity fades of 120ms or less.
- No figure parallax and no orb drift.

---

## F. Imagery rules

| Asset | Rule |
|---|---|
| Body figure | Adult, androgynous or neutral proportions, translucent shell, stylized organ systems, no facial detail, flight suit without patches, flags or logos. Soft studio light from the top-left. Pearl/blue palette with organs in muted rose. Delivered as transparent PNG/WebP at 2× and 3×. Details in doc 08. |
| AI-generated art | Carries a visible "AI-generated" mark (rule E5): a `Badge` in the stage corner reading "AI-generated illustration". Logged in `REFERENCES.md`. |
| Avatars | Initials in a tinted circle. No photos of real people. Never anyone under 18 (rule E7). |
| Planets and orbits | Line art only (1px ellipses). No photo planets. |
| NASA branding | Never. No meatball, worm, flags or mission patches (rule E6). Name data sources in text only ("NASA OSDR"). |
| Illustrations | Monoline, 1.75px stroke, matching lucide icons. |
