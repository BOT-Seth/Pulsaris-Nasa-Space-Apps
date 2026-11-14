# 03 — Design Vision: "Orbital Health — Soft Cosmic Glass"

*"Orbital Health" is the working name of the design direction, not the product.*

## One-sentence direction

**A premium, light, calm health app made for the space age.** Frosted glass cards float over a pale, softly lit "cosmic dawn" background. One translucent human figure anchors the screen, and every number is precise, sourced and easy to read.

## Personality

| We are | We are not |
|---|---|
| Scientific, precise, sourced | A sci-fi cockpit |
| Calm, reassuring, non-judgmental | Alarmist, gamer-neon |
| Premium consumer polish (Oura, Apple Health level) | A generic admin dashboard |
| Space-aware: orbital curves, mission context, astronaut figure | Black screens, starfields, glowing borders |
| Honest about uncertainty and simulated data | A device that "diagnoses" |

## Five design principles (mandatory)

1. **The body is the interface.** Home starts from the body figure. Tapping a region leads to that system's indicators. This answers challenge suggestion S2, so it is not decoration.
2. **Every number earns its place.** We show only indicators the challenge names, ones HRP links to a hazard, or ones NASA data supports. There is no filler.
3. **Glance, then focus, then explore.** Status is readable in 2 seconds. Detail is one tap away. History is one more tap.
4. **Trust is visible.** Every value has a unit, a timestamp and a source. Simulated data is always labeled. Status always uses an icon plus a word, never color alone.
5. **Glass carries content, not effects.** Frost exists to create depth and calm. Readability beats translucency every time.

## Visual ingredients

| Ingredient | Use | Never |
|---|---|---|
| **Cosmic-dawn background:** a pale pearl base with 3 large blurred color orbs (sky, lavender, peach) and 1–2 hairline orbital ellipses | Behind every screen. The orbs make the glass visibly frosted. | Stars, nebula photos, dark gradients |
| **Frosted glass cards** | All content containers | Text directly on the background without a surface (except the hero numbers beside the body) |
| **Translucent human figure** (adult, flight suit with no insignia, organ systems faintly visible) | Home hero, Body sheet | Faces with identifiable features, NASA logos, flags, patches |
| **System tints:** each body system has one pastel tint used on its cards | Card backgrounds and region highlights | Data encoding; tints never mean status |
| **Navy ink and one interactive blue** | Text and interactive elements | Colored body text |
| **Orbital motif:** thin ellipses and arcs (gauges, background lines, loading spinner) | Sparingly, max 1 decorative ellipse per screen | Rotating planets or decorative animation loops |

## Tone of voice

- **Second person, calm, specific:** "Your resting heart rate is 9 bpm above your baseline for 3 days."
- **Action first:** "Log a blood pressure reading," not "BP data required."
- **Never diagnose:**
  - Write "may be worth a check," "consider," "talk to your flight surgeon."
  - Never write "you have…"
- **Cite:** short "Why this matters in space" lines that end with a source tag such as `NASA HRP`.
- **Label simulated data plainly:** "Simulated demo data."

## Mood references

- The team screenshot (primary; see doc 02 Part A).
- Oura (calm, baselines).
- Apple Health (structure, charts).
- Gentler Streak (friendly guidance, target corridor).
- NASA Eyes (labels anchored to a 3D object; a time scrubber).

## What success looks like

- A judge watching a 30-second demo can say what the app does, see real NASA crew data, and remember the body figure.
- A crew member can answer three questions in under 10 seconds: Am I OK today? What changed? What should I do?
- Any teammate or AI coding agent can build a new card using only docs 04 and 07, and it looks native.
