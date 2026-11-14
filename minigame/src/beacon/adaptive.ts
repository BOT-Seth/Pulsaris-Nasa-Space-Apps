/**
 * Adaptive stopping: PVT-BA (Basner M. 2022, Sleep Advances 3(1):zpac038, doi:10.1093/sleepadvances/zpac038).
 *
 * After every event the odds of a HIGH / MEDIUM / LOW test are updated (Bayes with likelihood
 * ratios). The test stops as soon as one passes 99.619%. In the paper this averaged 1 min 43 s
 * and agreed "almost perfectly" with the full 3-min PVT-B (kappa 0.85 on validation data).
 *
 * The paper publishes its exact likelihood ratios only in a chart (Figure 1). Its text gives
 * ranges, and we use the CONSERVATIVE end of each (smallest change per event), which can only
 * make tests run longer, not decide sooner. In the first 30 s the paper's ratios are "closer
 * to 1"; we halve their strength (square root). These are our approximations, not the paper's values.
 */
import type { Category, ScoreEvent } from "./types";

export const PVT_BA = {
  threshold: 0.99619,
  /** HIGH ≤ 6 lapses + false starts, MEDIUM 7–16, LOW > 16 (full 3-min PVT-B). */
  highMaxLpfs: 6,
  mediumMaxLpfs: 16,
  earlyWindowMs: 30_000,
  lr: {
    /** "increased the likelihood of being a HIGH performer only by 22–40%" → 1.22 */
    highNoLpfs: 1.22,
    /** "decreased the likelihood of being a LOW performer only by 22–43%" → 0.78 */
    lowNoLpfs: 0.78,
    /** "lowered the likelihood of being a HIGH performer by 75–85%" → 0.25 */
    highLpfs: 0.25,
    /** "increased the likelihood of being a LOW performer 3- to 5-fold" → 3 */
    lowLpfs: 3,
  },
} as const;

const toOdds = (p: number) => p / (1 - p);
const toProb = (o: number) => o / (1 + o);

export interface AdaptiveState {
  pHigh: number;
  pMedium: number;
  pLow: number;
  lpfs: number;
}

/** Category from the full count (used when the 3-min cap is reached). */
export function categoryFromCount(lpfs: number): Category {
  if (lpfs <= PVT_BA.highMaxLpfs) return "high";
  if (lpfs <= PVT_BA.mediumMaxLpfs) return "medium";
  return "low";
}

/** Replays all events from equal priors (1/3 each). Cheap: a test has under ~80 events. */
export function adaptiveState(events: ScoreEvent[]): AdaptiveState {
  let pHigh = 1 / 3;
  let pLow = 1 / 3;
  let lpfs = 0;
  for (const e of events) {
    const k = e.atMs < PVT_BA.earlyWindowMs ? 0.5 : 1; // early events count half (log scale)
    if (e.lpfs) lpfs += 1;
    const lrHigh = (e.lpfs ? PVT_BA.lr.highLpfs : PVT_BA.lr.highNoLpfs) ** k;
    const lrLow = (e.lpfs ? PVT_BA.lr.lowLpfs : PVT_BA.lr.lowNoLpfs) ** k;
    pHigh = pHigh === 0 ? 0 : toProb(toOdds(pHigh) * lrHigh);
    pLow = toProb(toOdds(pLow) * lrLow);
    if (lpfs > PVT_BA.highMaxLpfs && pHigh > 0) {
      // Paper eq. 4–5: HIGH is ruled out; renormalise MEDIUM and LOW.
      const pMed = Math.max(0, 1 - pHigh - pLow);
      const sum = pMed + pLow;
      pHigh = 0;
      pLow = sum > 0 ? pLow / sum : 1;
    }
  }
  const pMedium = Math.max(0, 1 - pHigh - pLow);
  return { pHigh, pMedium, pLow, lpfs };
}

/** The category once the test can stop, or null to keep going. */
export function adaptiveDecision(events: ScoreEvent[]): Category | null {
  const s = adaptiveState(events);
  if (s.lpfs > PVT_BA.mediumMaxLpfs) return "low";
  if (s.pHigh > PVT_BA.threshold) return "high";
  if (s.pLow > PVT_BA.threshold) return "low";
  if (s.pMedium > PVT_BA.threshold) return "medium";
  return null;
}
