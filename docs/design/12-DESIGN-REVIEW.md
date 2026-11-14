# 12 — Design Review

| Question | Verdict |
|---|---|
| Does it meet every verified requirement? | **Yes** (doc 11). The guidance quality depends on cited content (U1). |
| Does it respect crew time? | **Yes.** Typical day ≈1 min; worst case ≈5 min (SCOPE.md). One action up front. Prompts bundled and rate-limited. |
| Is the most important thing up front? | **Yes.** Status + cause + action in the header, in both orientations. |
| Is the research justified? | **Yes.** Every rule cites SCOPE/RESEARCH sources. NASA sources score and explain, not decorate. |
| Is the visual direction uniform and non-generic? | **Yes on paper.** One accent, solid cards, two glass surfaces, Plex type. Verify with a mockup (`mockups/PROMPT.md`). |
| Is the figure purposeful? | It's a secondary mirror of the row statuses. Low cost, never required. |
| Are demo and simulated data identified? | **Yes.** Recorded / Sample / NASA-reference labels everywhere. |

## Three biggest risks

1. **NASA data reads as "light" to judges.** No raw NASA stream exists for these indicators.
   - **Mitigation:** say in the pitch and in About that NASA ISS reference data scores the alertness check and NASA HRP drives the guidance.
2. **Uncited thresholds (U1).**
   - **Mitigation:** ship baseline-based Watch. Enable Act for BP, sugar and temperature only once a range is cited.
3. **MMASH covers only 24 h per person.** A 7-day trend needs stitching or sample days.
   - **Mitigation:** label stitched or sample days clearly, and use the night-time reference as the HRV baseline (RESEARCH.md).

## Rejected ideas

| Idea | Why |
|---|---|
| Body figure as the centerpiece | Status first (mentors M4) |
| Crew Science screen (Inspiration4 labs) | Doesn't help an astronaut check their own health; costs build time |
| Signal orange accent | Failed the validator against Watch and Act (doc 04 §A3) |
| Glass on every card, gradients, glow | Generic AI look (doc 02 §B) |
| Range controls (Day/Week/Mission/All) | SCOPE says 7 days |
| Badges, composite health score | No health value; invents metrics |
| Tab bar | Home + drill-downs is faster; fewer places to look |
