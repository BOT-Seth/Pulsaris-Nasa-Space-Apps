# 03 — Design Vision: "Instrument panel + printed lab report"

## 1. Direction in one sentence

Pulsaris looks like a **precise flight instrument printed onto a clean medical lab report**:
- warm paper, ink-navy type, monospaced numbers;
- hairline rules and one cobalt accent;
- calm, exact and fast to read.

It is space-aware through its content and precision, not through decoration.

## 2. Why this direction

- **Speed for crew:** high contrast and clear structure make status readable in under 5 seconds (mentors M1, M4).
- **Trust:** it borrows the visual language of documents people already trust with numbers, like lab reports and instrument readouts.
- **Distinctive:** it is the opposite of the averaged AI look (doc 02 §B).
- **Uniform:** a small set of tokens means every teammate's screen comes out looking the same.

## 3. Principles (mandatory)

1. **One status, one action, up front.** Everything else is one tap deeper.
2. **Numbers are the hero.** They use IBM Plex Mono, always carry their unit, and always show time and source.
3. **Every pixel justifies crew time.** If it doesn't help answer "Am I OK? What do I do?", it goes.
4. **Trust is visible.** Recorded, sample and NASA-reference data are labeled where they appear.
5. **Restraint is the style.**
   - One accent.
   - Solid surfaces.
   - Glass in exactly two places: the status header and the toolbar.

## 4. Anti-slop rules (apply to code and generated images)

| Never | Instead |
|---|---|
| Purple, indigo or blue gradients; color orbs; glow; neon; bokeh | Flat warm paper `--color-bg` |
| Glass on every card | Glass only on the status header and the toolbar |
| Drop shadows on cards | A 1px hairline border |
| Icons inside colored rounded squares | Inline 1.5px outline icons beside the text |
| Inter or Roboto everywhere | IBM Plex Sans (text) + IBM Plex Mono (numbers) |
| Identical cards in a uniform grid | Varied card sizes, sized by how important their content is |
| Centered, symmetric layouts | Left-aligned, on a 12-column tablet grid |
| Glowing 3D anatomy hero | A small fine-line technical drawing (doc 08) |
| Tidy fake data (equal bars, sine waves) | Real or realistic irregular values (MMASH, Dev 2024) |
| Adjectives in prompts ("premium", "sleek", "Dribbble") | Concrete specs: tokens, exact text, real numbers |
| Decorative wave sparklines | Real 7-day data or nothing |
| Emoji or mascots | Words |

## 5. Tone of voice

- **Plain and specific:** "HRV 22% below your baseline." Not "Your recovery could be better."
- **Action first:** "Nap 20–30 min if your schedule allows."
- **Never diagnose:** "may be worth a check", "flagged for your crew medical officer".
- **Cite briefly:** a short source tag such as `NASA HRP` or `Dev 2024`.

## 6. What success looks like

- An astronaut opens the app and knows their status and next action in **5 s**.
- The daily check-in takes **≤60 s**.
- A judge sees real NASA-derived scoring in a 30-second demo.
- Any teammate builds a screen from docs 04, 06 and 07, and it matches the rest.
