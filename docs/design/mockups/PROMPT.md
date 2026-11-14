# Mockup Prompt (v2, tablet)

This prompt is for ChatGPT image generation. Attach nothing; the spec is self-contained. Ask for **high** quality so small text stays legible.

**Iterate one change at a time:** *"Same image. Change only X. Keep everything else identical."* If text drifts, restate the exact strings. Any mockup used in the demo must keep a visible "AI-generated" label (rule E5).

```
Flat UI screenshots of a shipped tablet health app called "Pulsaris", 1536x1024, on a plain light-grey canvas (#E7E5E0). Left: a tablet in LANDSCAPE showing the Home screen. Right: a smaller tablet in PORTRAIT showing the alertness-check Result screen. Each screen sits in a thin, flat, matte-black tablet outline: no reflections, no perspective, no shadow, straight-on like an App Store screenshot export. Describe nothing else in the scene.

PRODUCT
Pulsaris is a daily health check for astronauts on long missions. It must be read in 5 seconds: one status, its cause, one action. Visual concept: a spacecraft instrument panel printed onto a clean medical lab report.

DESIGN SPEC (apply exactly)
- Page background: flat warm paper #F4F2EE. No gradients, no color orbs, no glow, no texture.
- Cards: solid white #FFFFFF, 1px border #D8D3C8, corner radius 14px, NO drop shadows. Cards have different heights based on content.
- Frosted glass ONLY on two surfaces: the top toolbar and the status header (white at 70% with background blur, 1px hairline bottom border). Nothing else is glass.
- Text: ink navy #14213D; secondary #4A5266; small labels #5F6577.
- One accent color only: cobalt #1D4ED8, used ONLY for the primary button, links and the single highlighted chart point.
- Status pills: small pill with a soft tint, a thin outline icon and a word. OK = green #256B42 on #E6EFEA, check-circle icon. Watch = brown-amber #7D5200 on #F6EFE4, eye icon. No data = grey #5F6577 on #F1F2F3, dashed-circle icon.
- Typography: IBM Plex Sans for words; IBM Plex Mono for EVERY number, unit and time. Small labels in uppercase with wide letter spacing.
- Icons: thin 1.5px outline icons placed inline beside text, never inside colored squares or circles.
- Left-aligned layout on a strict grid. Generous but not empty spacing.

LEFT TABLET (landscape): "Home"
- Toolbar (glass): "Pulsaris" at left in Plex Sans semibold; a gear outline icon at right.
- Status header (glass), full width, left-aligned:
  a large Watch pill and the word "Watch" in 32px semibold;
  below it, the line "HRV 22% below your baseline (sleep window, last night)";
  below that, a cobalt button "Start 3-min alertness check" and a text link "Snooze".
- Left column (two thirds width), a card titled "Today":
  first a slim row card: "Daily check-in · 3 taps" with a secondary button "Start";
  then a list of rows separated by hairlines. Each row has an uppercase label on the left, a mono value, a status pill, and a chevron:
  "HRV" "41 ms" Watch
  "SLEEP" "5 h 48 m" Watch
  "RESTING HR" "62 bpm" OK
  "SLEEPINESS" "6 / 9" OK
  "MOOD" "3 / 5" OK
  "BLOOD PRESSURE" "118/76 mmHg" OK, with small grey mono text "6 d ago"
  "BLOOD SUGAR" "94 mg/dL" OK, with small grey mono text "6 d ago"
  "TEMPERATURE" "—" No data
  Under the card, small grey mono caption: "Recorded data · MMASH (PhysioNet, ODbL)".
- Right column (one third width):
  a card titled "Body" containing a small fine-line technical anatomical drawing of an adult human, front view, drawn like a medical textbook plate with thin navy ink lines and light hatching, no face detail, no glow, no 3D. Thin leader lines from the head to the label "Head · Watch" (head area lightly tinted amber) and from the chest to "Chest · OK". Tiny grey caption: "AI-generated illustration".
  below the card, small mono text "12-day check-in streak";
  below that, a secondary outlined button "Feeling unwell".

RIGHT TABLET (portrait): "Alertness check result"
- Toolbar (glass): "‹ Home" at left.
- Status header (glass): a Watch pill and the words "Watch · Reduced alertness".
- Card: the large mono number "224 ms" with the small label "MEDIAN REACTION TIME"; below it mono text "4 lapses (≥355 ms) · 1 false start"; below that "Speed 1.2 SD slower than NASA ISS pre-flight reference (Dev 2024)".
- Card with the uppercase label "DO THIS NOW":
  primary text in 18px semibold: "Take a short movement break in bright light.";
  secondary text below: "Also: caffeine only if it fits your plan and is not close to your next sleep. Double-check critical tasks today.";
  a small cobalt link "Source: NASA HRP ↗".
- Two buttons side by side: cobalt "Done" and outlined "Re-check in 60 min".
- A collapsed row at the bottom: "Details: speed vs baseline · lapses · false starts" with a chevron.
- Card "Last 7 sessions": a minimal chart with a thin graphite line (#5A6478) through 7 dots, values 205, 199, 211, 208, 216, 210, 224 ms, a pale band labeled "Your usual range", the last dot cobalt, 3 small mono y-ticks (190, 210, 230 ms), no other decoration.

TEXT RULES
Render every quoted string exactly once, spelled exactly as written. No other text, no lorem ipsum, no watermarks, no logos.

AVOID
Purple or blue gradients, glow, neon, bokeh, color orbs, drop shadows on cards, glass on cards, icons inside colored rounded squares, identical card sizes, centered symmetric layouts, smooth decorative wave lines, 3D or glossy body renders, reflective device mockups, perspective angles, stock people, emoji, NASA logos, flags or mission patches, concept-art styling. It must look like a real shipped app screenshot, not a Dribbble concept.
```
