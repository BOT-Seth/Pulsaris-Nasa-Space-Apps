/**
 * Beacon scoring. Pure functions, no React.
 * Every constant traces to docs/scope/MINIGAME.md §4.3 and SCOPE.md "Evidence base".
 */
import { categoryFromCount } from "./adaptive";
import type { Band, Baseline, Category, Classification, PvtMetrics, ScoreEvent, Trial } from "./types";

export const PVT = {
  /** Cap: the full PVT-B (Basner, Mollicone & Dinges 2011). Adaptive stopping usually ends sooner. */
  durationMs: 180_000,
  isiMinMs: 1_000,
  isiMaxMs: 4_000,
  /** PVT-B lapse threshold on lab hardware. */
  lapseMs: 355,
  /** Faster than this is a false start (anticipation). */
  falseStartMinRtMs: 100,
  /** No response by then = lapse, then move on. */
  timeoutMs: 30_000,
  /** How long the frozen RT stays on screen. */
  feedbackMs: 1_000,
  /** Taps this soon after a response are ignored (finger bounce, double tap). */
  bounceMs: 150,
  /** More false starts than this = not engaged, session not scored. */
  invalidFalseStarts: 8,
  /** Pause longer than this ends the session as incomplete. */
  maxPauseMs: 120_000,
} as const;

/**
 * NASA ISS astronaut pre-flight PVT reference (Dev et al. 2024, Front Physiol, Table 1, N = 24).
 * Speed on the paper's 10 − 1/RT scale: mean 5.25, SD 0.24 → mean 1/RT = 4.75 s⁻¹ (≈ 211 ms).
 */
export const NASA_REFERENCE = {
  speedSd: 0.24,
  meanSpeed: 4.75,
  typicalRtMs: 211,
  n: 24,
  label: "NASA ISS pre-flight reference (Dev et al. 2024)",
} as const;

/** OK / Watch / Act from the PVT-BA category. */
const BAND_OF: Record<Category, Band> = { high: "ok", medium: "watch", low: "act" };

/** "3 min" or "30 s". */
export function formatLength(ms: number): string {
  return ms >= 60_000 ? `${Math.round(ms / 60_000)} min` : `${Math.round(ms / 1000)} s`;
}

/** Random gap before the next stimulus, uniform 1–4 s. */
export function nextIsiMs(random: () => number = Math.random): number {
  return PVT.isiMinMs + random() * (PVT.isiMaxMs - PVT.isiMinMs);
}

/**
 * Lapse line for this person on this device.
 * 355 ms is a lab number. A tablet adds touch/screen delay, and people differ in pace. Both show up
 * in the rested baseline, so we add how much slower the baseline is than the NASA reference.
 */
export function lapseLineFor(baseline: Baseline | null): number {
  if (!baseline) return PVT.lapseMs;
  return Math.round(PVT.lapseMs + Math.max(0, baseline.medianRtMs - NASA_REFERENCE.typicalRtMs));
}

/** Scoring events in time order: responses, timeouts and false starts. */
export function scoreEvents(
  trials: Trial[],
  falseStartTimes: number[],
  lapseLineMs: number,
): ScoreEvent[] {
  return [
    ...trials.map((t) => ({ atMs: t.onsetMs, lpfs: t.rtMs === null || t.rtMs >= lapseLineMs })),
    ...falseStartTimes.map((atMs) => ({ atMs, lpfs: true })),
  ].sort((a, b) => a.atMs - b.atMs);
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

const round = (n: number, dp = 2) => Math.round(n * 10 ** dp) / 10 ** dp;

export function computeMetrics(trials: Trial[], falseStarts: number, lapseLineMs: number): PvtMetrics {
  // Timeouts count as the timeout length so they still pull speed down.
  const rts = trials.map((t) => t.rtMs ?? PVT.timeoutMs);
  const lapses = trials.filter((t) => t.rtMs === null || t.rtMs >= lapseLineMs).length;
  return {
    trials: trials.length,
    medianRtMs: round(median(rts), 0),
    meanRtMs: rts.length ? round(rts.reduce((a, b) => a + b, 0) / rts.length, 0) : 0,
    meanSpeed: rts.length ? round(rts.reduce((a, rt) => a + 1000 / rt, 0) / rts.length, 3) : 0,
    lapses,
    falseStarts,
    lpfs: lapses + falseStarts,
    lapseLineMs,
  };
}

/**
 * Band for a finished run.
 * - Adaptive stop → the PVT-BA category. Reaching the 3-min cap → category from the full count.
 * - No baseline yet → "Building your baseline" (no judgement; these runs are always full length).
 */
export function classify(
  m: PvtMetrics,
  baseline: Baseline | null,
  decided: Category | null,
  elapsedMs: number,
): Classification {
  if (m.falseStarts > PVT.invalidFalseStarts) {
    return {
      band: "invalid",
      category: null,
      vsBaselineSd: null,
      reasons: [`${m.falseStarts} taps before the beacon. Try again when ready.`],
    };
  }
  if (!baseline) {
    return { band: "baseline", category: null, vsBaselineSd: null, reasons: [] };
  }
  const category = decided ?? categoryFromCount(m.lpfs);
  const band = BAND_OF[category];
  const vsBaselineSd = round((m.meanSpeed - baseline.meanSpeed) / NASA_REFERENCE.speedSd, 1);
  const when = elapsedMs < PVT.durationMs - 1_000 ? ` in ${formatClock(elapsedMs)}` : "";
  const reasons =
    band === "ok"
      ? []
      : [`${m.lpfs} lapse${m.lpfs === 1 ? "" : "s"} or early tap${m.lpfs === 1 ? "" : "s"}${when}`];
  return { band, category, vsBaselineSd, reasons };
}

/** 1:43 style. */
export function formatClock(ms: number): string {
  const s = Math.round(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/** Map a band to the app-wide status word (design doc 09 §2). */
export function toIndicatorStatus(band: Band): "ok" | "watch" | "act" | "none" {
  if (band === "ok" || band === "watch" || band === "act") return band;
  return "none";
}
