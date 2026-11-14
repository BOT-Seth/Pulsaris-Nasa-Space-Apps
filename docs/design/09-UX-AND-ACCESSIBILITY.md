# 09 — UX Quality, Trust & Accessibility

## 1. Accessibility baseline (mandatory, WCAG 2.2 AA)

| Area | Rule |
|---|---|
| Contrast | Body text ≥4.5:1 and large text or UI marks ≥3:1, measured against the **worst-case glass composite** (doc 04 §A3). Status text uses the `*-text` tokens. |
| Text size | Min 11px (captions only), body 15px. Supports 200% zoom and OS large text with no clipping or truncation. |
| Touch targets | ≥44×44px (`--touch-target-min`), with ≥8px between adjacent targets. |
| Keyboard | Every action is reachable. Visible `:focus-visible` ring. Logical order. Sheets trap focus and restore it on close. No keyboard traps. |
| Screen readers | Semantic HTML first. Each screen has one `<h1>`. Icon buttons have `aria-label`. Charts use `role="img"` + summary + table view. Figure regions are buttons. Status is announced in words. |
| Color independence | Status = icon + label + color. Chart series are direct-labeled (up to 4), and BP uses two marker shapes. |
| Motion | Respect `prefers-reduced-motion`. Nothing flashes more than 3 times a second. No auto-playing loops. |
| Transparency | Respect `prefers-reduced-transparency` and `forced-colors` (glass falls back to solid). |
| Language | `lang="en"` (submission must be English, rule E8). Plain language at about grade 8. |

## 2. Trust: provenance, freshness, uncertainty

| Rule | Implementation |
|---|---|
| Every displayed value has a **unit, timestamp and source** | MetricHero, tooltips and ReadingList show all three. Rows show the unit + a relative time ("2 h ago"). |
| Simulated data is **always** labeled | A `Simulated` ProvenanceBadge per value + a header ribbon while demo mode is on. Hollow markers on mixed charts. The demo script states it out loud. |
| NASA data is labeled with its dataset ID | `NASA OSDR · OSD-569` with a link |
| Real vs illustrative | The body figure is illustrative (doc 08 §B4). The About screen says so. |
| Uncertainty | With fewer than 3 readings: "Not enough readings to judge." A baseline from under 3 days is labeled "Provisional baseline". |
| Reference ranges are cited | Each range carries `source` (e.g. "AHA"). It is shown in "Why this status". There are no uncited thresholds. |
| No diagnosis | Copy never names a disease as the user's condition. See §5. |
| Disclaimer | First run, About, and the footer of every Insight detail: "Educational prototype for NASA Space Apps 2026. Not a medical device and not medical advice." |

## 3. Freshness (expected intervals)

These are the team's routine design, not NASA rules. They are editable in `content/indicators.json`.

| Indicator | Expected | "Stale" after |
|---|---|---|
| Heart rate | 2× daily | 24 h |
| Blood pressure | 1× daily | 48 h |
| Blood sugar | 1× daily (fasting) | 48 h |
| Body temperature | 1× daily | 48 h |
| Sleep | 1× daily (morning) | 36 h |
| Mood | 1× daily (evening) | 36 h |
| Exercise | 1× daily | 36 h |

## 4. Status logic (how the color is chosen)

The status engine is deterministic and explainable. The rules live in `content/rules.json` and are evaluated in `evaluate.ts`. Order of evaluation:

1. **none:** no reading within the stale window.
2. **alert:** an escalation rule hits. Each indicator has one or two explicit rules, e.g. "value outside the critical range **on 2 readings at least 15 min apart**." The critical ranges must be **cited** (U1 in doc 01). Until they are cited, the alert rule is disabled and the UI shows caution instead.
3. **caution:** the latest reading is outside the cited reference range.
4. **watch:** within the reference range, but outside the personal baseline band (mean ± 2 SD) on 2 or more of the last 3 readings, **or** a trend of 3 consecutive moves in one direction totaling more than 1 SD.
5. **good:** otherwise.

Each status ships with `reasons[]`: human-readable lines that say which rule fired. These lines feed StatusExplanation ("Why this status").

**Baseline:**
- Built from the first 3 days of readings, or from the preflight phase when the mission phase is set.
- Re-establishable in Profile.
- Postflight phase compares against the **preflight** baseline. This follows the team's research journal (NASA Twins Study; SOMA). Recovery is tracked rather than reset.

## 5. Copy patterns

| Situation | Pattern | Example |
|---|---|---|
| Good | Observation + reassurance | "Within your usual range." |
| Watch | Observation + data + simple action | "Sleep has been under your usual range for 3 nights (avg 5 h 50 m). Try to protect your scheduled sleep window tonight." |
| Caution | Observation + range + steps + when to re-check | "Blood pressure 142/91 is above the reference range (source: AHA). Sit quietly for 5 minutes and measure again. If it stays high, log it and tell your crew medical officer." |
| Alert | Plain instruction first, then why | "Contact your flight surgeon. Your temperature has been 38.4 °C or higher on 2 readings an hour apart." |
| Never | Diagnoses, predictions, blame | "You have hypertension" ✗ · "You will develop…" ✗ · "You failed your routine" ✗ |

**Escalation targets** (from the challenge's wording): "your crew" and "flight surgeons on the ground". The P2 "Share with flight surgeon" exports a summary; it does not send anything automatically.

## 6. Privacy

| Rule | Implementation |
|---|---|
| Local-first | All personal readings stay in `localStorage` or IndexedDB on the device. No backend, no analytics. |
| No identities | A callsign or initials avatar. No photos, names or dates of birth. Crew data stays de-identified (C001–C004). |
| Export and clear | JSON export. "Clear all data" requires a typed confirmation. |
| Glanceable privacy | The P2 "Discreet mode" toggle hides values on Today and shows status only. |

## 7. Accessibility test checklist (run before the demo)

- [ ] Keyboard-only run: Today, then region, sheet, Metric detail, Log, back.
- [ ] Screen reader (NVDA or VoiceOver) reads status words and chart summaries.
- [ ] 200% zoom on a 390px viewport: no horizontal scroll.
- [ ] OS reduced motion: no zoom, pulse or draw-in.
- [ ] Glass fallback: test with `backdrop-filter` disabled in DevTools.
- [ ] Grayscale screenshot: every status is still distinguishable by icon and label.
