# 09 — UX, Trust & Accessibility

## 1. Accessibility (WCAG 2.2 AA, mandatory)

| Area | Rule |
|---|---|
| Contrast | Body text ≥4.5:1 and marks ≥3:1. Measured values are in doc 04 §A. |
| Text | Min 12px, body 17px. Reflows at 200% zoom with no truncation. |
| Touch | ≥48×48 targets with ≥12px spacing. Signal Lock uses the whole screen. Built for gloves, a thigh-strapped or wall-mounted tablet, and microgravity drift (MINIGAME §4.8). |
| Orientation | Portrait and landscape both supported. No feature is locked to one orientation. |
| Keyboard / screen reader | Everything reachable. Semantic HTML, one `<h1>` per screen. Status read as words. Charts have a summary and a table. |
| Color independence | Status = icon + word + color. BP = two point shapes. |
| Motion / transparency | Respect `prefers-reduced-motion`, `prefers-reduced-transparency` and `forced-colors`. |
| Sound / haptics | Optional, off by default (crewmates may be sleeping). |

## 2. Status words (one vocabulary everywhere)

**OK · Watch · Act · No data.**
- The rules come from SCOPE.md and MINIGAME.md (bands, triggers, escalation).
- The design never invents thresholds.
- Signal Lock's green / yellow / red bands display as OK / Watch / Act.

## 3. Trust and provenance

| Rule | How |
|---|---|
| Every value shows unit, time and source | ProvenanceNote on the hero. Tooltips and readings list carry provenance. |
| Recorded data is labeled | "Recorded · MMASH (PhysioNet, ODbL)". Attribution also in About (license requirement). |
| NASA reference is labeled | "NASA ISS pre-flight reference (Dev et al. 2024)" until the astronaut has their own baseline |
| Sample values are labeled | "Sample" for BP, sugar and temperature demo values |
| No diagnosis | The app screens and points to follow-up (Afshinnekoo 2020). It never names a disease. |
| Explainable alerts | Every Watch or Act names its cause and the rule that fired (Tjoa & Guan 2021) |
| Uncertainty | "Building your baseline" until enough data exists. No band shown before then. |
| Disclaimer | About + first run: "Educational prototype for NASA Space Apps 2026. Not a medical device." |

## 4. Respecting crew time (UX rules)

1. Home answers "Am I OK?" in ≤5 s: status + cause + one action, above the fold in both orientations.
2. Max **one** prompted Signal Lock per 3 h unless the last result was Act. Snooze 15, 30 or 60 min. **Never prompt during a flagged critical task.**
3. Bundle prompts: BP and blood sugar are always asked together.
4. A prompt never stacks on another prompt. Show at most one due card at a time, highest priority first.
5. Any flow can be quit with one tap. Partial data is saved and marked incomplete.

## 5. Copy patterns

| Case | Pattern | Example |
|---|---|---|
| OK | Short reassurance | "OK · Nothing needs your attention." |
| Watch | Cause + one action | "HRV 22% below your baseline. Start a 3-min alertness check." |
| Act | Action first, then why, then escalation | "Nap 20–30 min if your schedule allows. Alertness well below your baseline. Crew medical officer flagged." |
| Never | Diagnoses, blame, hype | ✗ "You have anemia" · ✗ "You failed" · ✗ "Optimize your wellness" |

## 6. Privacy

- **Local-first:** no backend, no analytics.
- **Identity:** initials only.
- **Data controls:** JSON export, and clearing data requires typing a confirmation.
