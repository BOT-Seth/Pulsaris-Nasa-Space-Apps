# 02 — Design Research

Research done 2026-11-14. **(read)** means we opened the page. **(snippet)** means seen only in search results.

## A. Patterns from shipping health apps

| App | Pattern we adopt | Pattern we avoid | Source |
|---|---|---|---|
| Oura | A score always expands into its contributors. Personal baseline ranges. Glance, then focus, then explore. | Vague labels ("Pay attention") for clinical values | ouraring.com/blog/readiness-score (read) |
| WHOOP | Published numeric bands behind every status color. One color = one meaning. A tile opens a detail screen. | Dense near-black UI. Color-only status. | developer.whoop.com/docs/whoop-101 (read); 925studios teardown (read) |
| Apple Health + HIG Charts | Chart title and summary state the takeaway. Don't hide critical info behind interaction. BP uses two point shapes. Unambiguous dates. | Long uncurated lists | HIG charts JSON (read) |
| Withings | A delta since the last reading next to the big number | Smoothing away raw points | App Store listing (read) |
| Garmin | An explicit "no recent data" state | Cards that silently disappear | garmin.com blog (read) |
| Gentler Streak | Calm, non-judgmental copy. A line inside a target band. | Many composite scores | App Store (read) |
| NASA Eyes | Text labels anchored to objects with leader lines | A free-roam camera | science.nasa.gov/eyes (read) |

## B. Why AI-generated designs look generic

- **Root cause: averaging.** With vague direction, image and code models drift to the most common "modern app" in their training data. Adjectives ("premium", "clean", "Dribbble quality") get averaged too. The fix is **concrete decisions**: tokens, real data, a specific concept, and reference designs.
  Sources: vp0.com/blogs/why-does-my-ai-app-look-generic (read); superdesign.dev/blog/why-ai-design-looks-generic (snippet); github.com/Laith0003/ux-skill wiki "Anti AI slop ban list" (snippet).
- **Common tells:**
  - Purple or indigo gradients.
  - Inter or Roboto everywhere.
  - Glassmorphism on everything.
  - Icons inside pastel rounded squares.
  - Three equal cards in a row.
  - The same radius and soft shadow everywhere.
  - Centered symmetric layouts.
  - Glowing 3D hero art.
  - Data that's too tidy.
- **OpenAI image prompting guide** (developers.openai.com cookbook, read):
  - Describe the product "as if it already exists".
  - "Avoid concept art language so the result looks like a usable, shipped interface".
  - Write chart prompts "like an artifact spec rather than an illustration request" with real data.
  - Quote exact text and render it exactly once.
  - Change one thing per iteration.

## C. Lessons from mockup v1 (the Orion glass concept)

`mockups/v1-today-and-bp-detail.jpg` was rendered from our first prompt. It had nearly every tell:
- A lavender and blue gradient wash.
- Glass on every card.
- A glowing anatomy figure.
- Icons in tinted squares.
- Uniform cards.
- A smooth sine-wave sparkline.
- A glossy device render.

Our own prompt caused most of them through adjectives and a global glass instruction. The v2 direction (doc 03) removes each one on purpose.

## D. Decisions

| # | Decision | Driven by |
|---|---|---|
| D1 | Status first. The figure is secondary. | Mentors M4, SCOPE.md |
| D2 | One status + one action on home; details one tap deeper | Oura, WHOOP, SCOPE.md |
| D3 | Big mono numerals + unit + delta + time + source | Withings, WHOOP, Validity |
| D4 | Status = icon + word + color, with published rules | WHOOP, HIG |
| D5 | Personal baseline band on every trend | Oura; Overbey 2024 and Garrett-Bakelman 2019 (SCOPE.md) |
| D6 | No invented composite "health score" | Validity |
| D7 | Monotone curves, raw points, no bridged gaps | v1 flaw, Withings, HIG |
| D8 | "Instrument panel + lab report" look | §B, §C |
