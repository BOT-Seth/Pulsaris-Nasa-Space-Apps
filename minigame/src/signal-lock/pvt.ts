/**
 * Signal Lock scoring. Pure functions, no React.
 * Every constant traces to docs/scope/MINIGAME.md §4.3 and SCOPE.md "Evidence base".
 */
import type { Band, Baseline, Classification, PvtMetrics, Trial } from "./types";

export const PVT = {
  /** 3-min PVT-B (Basner, Mollicone & Dinges 2011). */
  durationMs: 180_000,
  isiMinMs: 1_000,
  isiMaxMs: 4_000,
  /** PVT-B lapse threshold. */
  lapseMs: 355,
  /** Faster than this is a false start (anticipation). */
  falseStartMinRtMs: 100,
  /** No response by then = lapse, then move on. */
  timeoutMs: 30_000,
  /** First trials are practice and not scored. */
  warmupTrials: 3,
  /** How long the frozen RT stays on screen. */
  feedbackMs: 1_000,
  /** Taps this soon after a response are ignored (finger bounce, double tap). */
  bounceMs: 150,
  /** More false starts than this = session invalid. */
  invalidFalseStarts: 8,
  /** Pause longer than this ends the session as incomplete. */
  maxPauseMs: 120_000,
} as const;

/**
 * Spread used to judge "how far from normal".
 * Dev et al. 2024 (Front Physiol, Table 1): ISS astronauts' pre-flight PVT speed SD = 0.24
 * on the 10 − 1/RT scale, which is the same SD as mean 1/RT in s⁻¹.
 * It is a between-person SD, so using it for within-person change is deliberately conservative.
 */
export const NASA_REFERENCE = {
  speedSd: 0.24,
  meanSpeed: 4.75,
  n: 24,
  label: "NASA ISS pre-flight reference (Dev et al. 2024)",
} as const;

/** Band cutoffs (MINIGAME.md §4.3; 1.5 SD = Dev et al. 2024 low-score line). */
export const BANDS = {
  watchSd: -1,
  actSd: -1.5,
  watchExcessLapses: 3,
  actExcessLapses: 6,
  actFalseStarts: 4,
} as const;

/** "3 min" or "30 s". */
export function formatLength(ms: number): string {
  return ms >= 60_000 ? `${Math.round(ms / 60_000)} min` : `${Math.round(ms / 1000)} s`;
}

/** Random gap before the next stimulus, uniform 1–4 s. */
export function nextIsiMs(random: () => number = Math.random): number {
  return PVT.isiMinMs + random() * (PVT.isiMaxMs - PVT.isiMinMs);
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

function round(n: number, dp = 2): number {
  const f = 10 ** dp;
  return Math.round(n * f) / f;
}

/** Least-squares slope of RT against time, ms per minute. */
function slope(points: { x: number; y: number }[]): number {
  if (points.length < 2) return 0;
  const mx = points.reduce((a, p) => a + p.x, 0) / points.length;
  const my = points.reduce((a, p) => a + p.y, 0) / points.length;
  let num = 0;
  let den = 0;
  for (const p of points) {
    num += (p.x - mx) * (p.y - my);
    den += (p.x - mx) ** 2;
  }
  return den === 0 ? 0 : num / den;
}

export function computeMetrics(
  allTrials: Trial[],
  falseStarts: number,
  baseline: Baseline | null,
): PvtMetrics {
  const scored = allTrials.slice(PVT.warmupTrials);
  // Timeouts count as the timeout length so they still pull speed down.
  const rts = scored.map((t) => t.rtMs ?? PVT.timeoutMs);
  const lapses = scored.filter((t) => t.rtMs === null || t.rtMs >= PVT.lapseMs).length;
  const personalLapses = baseline
    ? scored.filter((t) => t.rtMs === null || t.rtMs > 2 * baseline.medianRtMs).length
    : null;
  const totalResponses = scored.length + falseStarts;

  return {
    trials: scored.length,
    medianRtMs: round(median(rts), 0),
    meanRtMs: rts.length ? round(rts.reduce((a, b) => a + b, 0) / rts.length, 0) : 0,
    meanSpeed: rts.length ? round(rts.reduce((a, rt) => a + 1000 / rt, 0) / rts.length, 3) : 0,
    lapses,
    personalLapses,
    falseStarts,
    falseStartPct: totalResponses ? round((falseStarts / totalResponses) * 100, 1) : 0,
    slopeMsPerMin: round(
      slope(scored.map((t, i) => ({ x: t.onsetMs / 60_000, y: rts[i] }))),
      1,
    ),
  };
}

/** Minimum scored trials for a result to mean anything (about a quarter of a normal 3-min run). */
export const MIN_SCORED_TRIALS = 15;

/** Scales the minimum for shortened DEV runs so they can still be scored. */
export function minTrialsFor(durationMs: number): number {
  return Math.max(3, Math.round(MIN_SCORED_TRIALS * (durationMs / PVT.durationMs)));
}

export function classify(
  m: PvtMetrics,
  baseline: Baseline | null,
  minTrials: number = MIN_SCORED_TRIALS,
): Classification {
  if (m.falseStarts > PVT.invalidFalseStarts) {
    return {
      band: "invalid",
      vsBaselineSd: null,
      excessLapses: null,
      reasons: [`${m.falseStarts} taps before the signal. Try again when ready.`],
    };
  }
  if (m.trials < minTrials) {
    return {
      band: "invalid",
      vsBaselineSd: null,
      excessLapses: null,
      reasons: ["Too few signals to score. The check was too short."],
    };
  }
  if (!baseline) {
    return { band: "baseline", vsBaselineSd: null, excessLapses: null, reasons: [] };
  }

  // Same device, same person: device touch/screen delay cancels out.
  const sd = round((m.meanSpeed - baseline.meanSpeed) / NASA_REFERENCE.speedSd, 1);
  const excess = round(m.lapses - baseline.meanLapses, 1);
  const reasons: string[] = [];
  const slower = (x: number) => `Speed ${Math.abs(x).toFixed(1)} SD slower than your baseline`;
  const extraLapses = (x: number) => `${Math.round(x)} more lapses than usual`;

  let band: Band = "ok";
  if (sd <= BANDS.actSd || excess >= BANDS.actExcessLapses || m.falseStarts >= BANDS.actFalseStarts) {
    band = "act";
  } else if (sd <= BANDS.watchSd || excess >= BANDS.watchExcessLapses) {
    band = "watch";
  }

  if (sd <= BANDS.watchSd) reasons.push(slower(sd));
  if (excess >= BANDS.watchExcessLapses) reasons.push(extraLapses(excess));
  if (m.falseStarts >= BANDS.actFalseStarts) reasons.push(`${m.falseStarts} taps before the signal`);

  return { band, vsBaselineSd: sd, excessLapses: excess, reasons };
}

/** Map a band to the app-wide status word (design doc 09 §2). */
export function toIndicatorStatus(band: Band): "ok" | "watch" | "act" | "none" {
  if (band === "ok" || band === "watch" || band === "act") return band;
  return "none";
}
