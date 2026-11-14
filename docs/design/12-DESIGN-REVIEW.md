# 12 — Critical Design Review

This is a self-review of docs 01–11, written to find weak spots rather than to approve the plan.

| # | Question | Verdict | Notes |
|---|---|---|---|
| 1 | Does the app address every verified NASA requirement? | **Yes, by design.** | R1–R7 and S1–S8 all map to features (doc 11). The weak point is content: guidance quality depends on P0-3 being written well and cited. |
| 2 | Is anything important missing? | **Two gaps.** | (a) Cited alert thresholds (U1). Without them, the "when to contact a flight surgeon" answer is generic. (b) There is no real long-duration data. OSDR Inspiration4 is a 3-day mission. We label this honestly, but a judge may notice. |
| 3 | Is navigation clear to a first-time user? | **Mostly.** | 4 tabs + the figure. **Risk:** "Crew Science" is an unfamiliar label. If testers hesitate, rename it "NASA Data". |
| 4 | Does it capture the reference's qualities? | **Yes.** | Figure centerpiece with side stats, big numerals, tinted rounded cards, lollipop sleep chart, semicircle gauge, pill controls, 4-tab bottom bar. All are specified. |
| 5 | Is the frost tasteful and readable? | **Yes on paper; needs a visual check.** | Contrast is computed against the worst case. Glass only reads as "frosted" if orbs sit behind cards. Check this on a real screen; if cards look flat, raise orb saturation rather than lowering card opacity. |
| 6 | Does the model serve a purpose? | **Yes.** | It is the challenge's own suggested clickable figure, it shows status, and it is the main way into each system. **Weak spot:** a "thermal" region drawn as a whole-body outline is the least intuitive. Consider moving temperature under the head region if testing shows confusion. |
| 7 | Are the graphs useful, accurate and consistent? | **Yes.** | Monotone curves, raw points, gap breaks, cited bands, one axis, summaries and table views. **Weak idea removed:** gauges for physiological values. |
| 8 | Can developers build screens without competing styles? | **Yes, if the rules are enforced.** | Tokens-only, the component list and PR screenshots. **Risk:** AI coding agents default to Tailwind or random hex. Point every agent prompt at docs 04 and 07. |
| 9 | Feasible for our tech and time? | **P0 is tight but feasible** with 4–5 people in parallel. | P1 is partial. P2 likely won't happen. That's fine. |
| 10 | Distinctive without hurting usability? | **Yes.** | The light "cosmic dawn" glass + figure is uncommon for space hackathon entries, which usually go dark and neon, and it follows proven health-app patterns. |
| 11 | Are demo-only and simulated parts clearly identified? | **Yes.** | Provenance badges, Simulated ribbon, hollow markers, the illustrative-figure note, and the AI-generated badge. |

## Three biggest risks

1. **The figure asset is late or poor.**
   - The whole look depends on one image.
   - **Mitigation:**
     - Start generating it in hour 1.
     - Accept an "80% good" figure.
     - The hotspot SVG is independent, so the image can be swapped late.
     - The CC-licensed anatomy model is the fallback.
2. **Scope creep into P1 and P2 before P0 works.**
   - The visual polish is tempting.
   - **Mitigation:**
     - Freeze P0 at the scope in doc 10.
     - Have a deployed demo link by Sunday noon.
     - Polish only after that.
3. **Health-content credibility.**
   - Uncited ranges or diagnosis-sounding copy would damage the Validity score.
   - **Mitigation:**
     - Content owner cites every range (U1).
     - Run the copy review against doc 09 §5.
     - Ship `watch` (baseline-based) even if `alert` thresholds stay unresolved.

## Ideas rejected during review

| Idea | Why rejected |
|---|---|
| Composite "Health score" (0–100) | It would be an invented metric with no NASA basis. It hurts Validity. |
| Dark sci-fi theme | It goes against the brief and the reference, and makes contrast harder. |
| Full 3D as default | Mobile and performance risk; accessibility cost; P2 only |
| Mission dashboard tab | Decorative; context lives in a pill |
| Dotted gridlines | Reads as noise. Dots are allowed only as a background texture. |
| Spline curves (as in the reference) | They overshoot and invent values |
