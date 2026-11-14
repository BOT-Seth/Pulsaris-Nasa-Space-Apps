/**
 * Signal Lock: public types.
 * Mechanics source: docs/scope/MINIGAME.md (§2 triggers, §4 session).
 */

/** Result band. Shown to the astronaut as OK / Watch / Act (design doc 09 §2). */
export type Band = "ok" | "watch" | "act" | "baseline" | "invalid";

/** Status vocabulary used by the rest of the app (design doc 05 §5). */
export type IndicatorStatusValue = "ok" | "watch" | "act" | "none";

/** Why the check was started (MINIGAME.md §2). */
export type Trigger =
  | "low_hrv"
  | "short_sleep"
  | "long_wake"
  | "self_report"
  | "pre_task"
  | "manual";

/** One stimulus. `rtMs` is null when the astronaut never responded (timeout). */
export interface Trial {
  /** Stimulus onset, ms since the test started (pauses excluded). */
  onsetMs: number;
  rtMs: number | null;
}

/** Raw output of one test run. */
export interface TestRun {
  trials: Trial[];
  falseStarts: number;
  /** Test time actually run, ms (pauses excluded). */
  elapsedMs: number;
  complete: boolean;
  endedReason: "finished" | "quit" | "paused-too-long";
}

export interface PvtMetrics {
  /** Scored trials (warm-up excluded, timeouts included). */
  trials: number;
  medianRtMs: number;
  meanRtMs: number;
  /** Mean response speed, 1/RT in s⁻¹ (higher = faster). Same scale as Dev et al. 2024 SD. */
  meanSpeed: number;
  /** RT ≥ 355 ms or no response (PVT-B, Basner et al. 2011). */
  lapses: number;
  /** RT > 2× own baseline median (OSDR OSD-939 definition). Null without a baseline. */
  personalLapses: number | null;
  falseStarts: number;
  falseStartPct: number;
  /** Change in RT across the test, ms per minute (positive = slowing down). */
  slopeMsPerMin: number;
}

/** A person's normal, measured on the same device. */
export interface Baseline {
  meanSpeed: number;
  meanLapses: number;
  medianRtMs: number;
  /** Number of rested sessions it came from. */
  n: number;
  source: "own" | "sample";
  label: string;
}

export interface Classification {
  band: Band;
  /** Speed vs baseline in SDs (negative = slower). Null without a baseline. */
  vsBaselineSd: number | null;
  /** Lapses above the baseline's average. Null without a baseline. */
  excessLapses: number | null;
  /** Plain-language reasons, worst first. Used for the cause line. */
  reasons: string[];
}

export interface CountermeasureCardContent {
  primary: string;
  secondary: string[];
  flags: string[];
  source?: { label: string; url: string };
}

/** Session record handed to the app (MINIGAME.md §4.6). */
export interface SessionRecord {
  sessionId: string;
  timestamp: string;
  trigger: Trigger;
  checkIn: { sleepiness: number | null; sleepinessReused: boolean };
  /** Rested sessions (sleepiness ≤ 4 and ≥ 7 h sleep) can update the own baseline. */
  rested: boolean;
  pvt: PvtMetrics & {
    durationSec: number;
    band: Band;
    vsBaselineSd: number | null;
    excessLapses: number | null;
    baselineSource: Baseline["source"] | null;
  };
  recovery: { type: "countermeasure" | "none" };
  recommendation: string;
  /** Crew medical officer flagged (any Act result). */
  cmoFlagged: boolean;
  /** Marked for flight-surgeon review: 2 Acts in 24 h, or Act before a critical task. */
  escalated: boolean;
  complete: boolean;
}
