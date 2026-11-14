/**
 * Beacon: public types.
 * Mechanics source: docs/scope/MINIGAME.md (§2 triggers, §4 session).
 */

/** Result band. Shown to the astronaut as OK / Watch / Act (design doc 09 §2). */
export type Band = "ok" | "watch" | "act" | "baseline" | "invalid";

/** PVT-BA performance category (Basner 2022). HIGH → OK, MEDIUM → Watch, LOW → Act. */
export type Category = "high" | "medium" | "low";

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

/** One scoring event: a response to the beacon, a timeout, or a false start. */
export interface ScoreEvent {
  atMs: number;
  /** Lapse or false start ("LpFS" in Basner 2022). */
  lpfs: boolean;
}

/** Raw output of one test run. */
export interface TestRun {
  trials: Trial[];
  falseStarts: number;
  /** Test time actually run, ms (pauses excluded). */
  elapsedMs: number;
  complete: boolean;
  endedReason: "decided" | "time-cap" | "too-many-false-starts" | "quit" | "paused-too-long";
  /** Set when the adaptive rule stopped the test early. */
  decided: Category | null;
}

export interface PvtMetrics {
  /** Responses + timeouts. */
  trials: number;
  medianRtMs: number;
  meanRtMs: number;
  /** Mean response speed, 1/RT in s⁻¹ (higher = faster). */
  meanSpeed: number;
  /** RT at or over the lapse line, or no response. */
  lapses: number;
  falseStarts: number;
  /** Lapses + false starts, the PVT-BA outcome. */
  lpfs: number;
  /** Lapse line used, ms: 355 + device/personal offset from the baseline. */
  lapseLineMs: number;
}

/** A person's normal, measured on the same device. */
export interface Baseline {
  meanSpeed: number;
  medianRtMs: number;
  /** Number of rested sessions it came from. */
  n: number;
  source: "own" | "sample";
  label: string;
}

export interface Classification {
  band: Band;
  category: Category | null;
  /** Speed vs baseline in SDs (negative = slower). Info only. Null without a baseline. */
  vsBaselineSd: number | null;
  /** Plain-language reason for the result. */
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
    stoppedEarly: boolean;
    band: Band;
    category: Category | null;
    vsBaselineSd: number | null;
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
