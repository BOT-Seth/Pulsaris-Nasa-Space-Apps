# 11 — Requirements Traceability

**Legend:**
- **Design:** ✅ specified · ❓ open
- **Built:** tick ☐ when merged

## A. Challenge objectives

| ID | Requirement | Feature | Screen | Check | Design | Built |
|---|---|---|---|---|---|---|
| R1 | Visual tool to assess own health | Status header + indicator rows + figure | S1 | "Am I OK?" readable in ≤5 s | ✅ | ☐ |
| R2 | Guidance on treatment and improvement | One action + countermeasure card + "What to do" | S1, S3, S6 | Every Watch/Act shows an action + source | ✅ | ☐ |
| R3 | Gathers indicators | Passive MMASH replay + check-in + entry sheets | S2, S4 | All 6 named indicators present | ✅ | ☐ |
| R4 | Evaluate and act | Status engine with cause, Signal Lock, escalation | S1, S5, S6 | Cause names the rule that fired | ✅ | ☐ |
| R5 | Any input | Taps, slider, keypad | S2, S4, S5 | Keyboard-only path works | ✅ | ☐ |
| R6 | Indicators with units | Unit on every value | All | No value without a unit | ✅ | ☐ |
| R7 | Clear presentation | Tokens, status words, chart rules | All | Doc 09 §1 checklist | ✅ | ☐ |

## B. "Worth considering" questions

| Question | Answered by | Design |
|---|---|---|
| Which measurements can be done in space? | "How it's measured" (S3); ARCHeR, LSAH (doc 01 §4) | ✅ |
| Why is an exam needed? | "Why it matters in space" (NASA HRP) | ✅ |
| How do hazards affect indicators? | HRP hazard to risk lines per indicator | ✅ (content needed) |
| When should the crew or flight surgeon be told? | Act status + escalation (MINIGAME §4.6) | ✅. Ranges U1 are ❓ |
| What prevents a critical condition? | Countermeasure card + actions | ✅ |

## C. Suggestions and mentor constraints

| ID | Item | Treatment | Design |
|---|---|---|---|
| S2 | Clickable figure | Secondary view (doc 08 §A) | ✅ |
| S4 | Routine prompts | Daily check-in + weekly BP/sugar + triggered Signal Lock | ✅ |
| S5 | Gamification | Check-in streak only | ✅ |
| S6 | Dynamic charts | 7-day trend | ✅ |
| S7 | Color coding | OK/Watch/Act + icon + word | ✅ |
| S8 | Simple instructions | Explainers, one-screen test instructions | ✅ |
| S3 | Environments | Parked (SCOPE) | — |
| M1–M5 | Crew time, simplicity, minimal burden, most important first | ≤60 s/day, 1 action, passive data, prompt rules (doc 09 §4) | ✅ |

## D. Event rules

| ID | Rule | How | Design |
|---|---|---|---|
| E2/E4 | NASA data core, at least one NASA resource | Dev 2024 ISS reference drives scoring; HRP drives guidance; OSD-939, ARCHeR, LSAH (doc 01 §4) | ✅ |
| E5 | AI watermark / acknowledgment | Figure caption; About statement | ✅ |
| E6 | No NASA branding | Imagery rules | ✅ |
| E7 | No under-18 likeness | Adult figure, no photos | ✅ |
| E8 | ≤30 s demo, public link | Doc 10 §3 | ☐ |
| E9 | References | MMASH ODbL credit, all papers | ☐ |

## E. Open items

| ID | Item | Blocks |
|---|---|---|
| U1 | Cited safe ranges for BP, sugar and temperature | Act status for those indicators |
| U2 | Source for the weekly BP+sugar interval (LSAH Cardiovascular documents) | Justification only |
| U3 | Source for the low-HRV threshold | Justification only |
