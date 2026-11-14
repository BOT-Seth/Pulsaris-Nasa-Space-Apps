/**
 * Baseline, escalation, countermeasure card and session record.
 * Pure functions: the host app owns storage and passes history in.
 */
import { classify, computeMetrics, lapseLineFor } from "./pvt";
import type {
  Band,
  Baseline,
  Classification,
  CountermeasureCardContent,
  SessionRecord,
  TestRun,
  Trigger,
} from "./types";

/** Rested = can update the own baseline (MINIGAME.md §4.3). */
export function isRested(sleepiness: number | null, sleepHours: number | null): boolean {
  return sleepiness !== null && sleepiness <= 4 && sleepHours !== null && sleepHours >= 7;
}

export const BASELINE_MIN_SESSIONS = 3;
export const BASELINE_MAX_SESSIONS = 10;

/**
 * Own baseline from the last ≤10 complete, valid, rested, full-length sessions.
 * Null until 3 exist, and the app shows "Building your baseline".
 */
export function computeBaseline(history: SessionRecord[]): Baseline | null {
  const usable = history
    .filter((s) => s.complete && s.rested && s.pvt.band !== "invalid" && !s.pvt.stoppedEarly)
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    .slice(0, BASELINE_MAX_SESSIONS);
  if (usable.length < BASELINE_MIN_SESSIONS) return null;
  const avg = (f: (s: SessionRecord) => number) =>
    usable.reduce((a, s) => a + f(s), 0) / usable.length;
  return {
    meanSpeed: Math.round(avg((s) => s.pvt.meanSpeed) * 1000) / 1000,
    medianRtMs: Math.round(avg((s) => s.pvt.medianRtMs)),
    n: usable.length,
    source: "own",
    label: `Your baseline · ${usable.length} rested checks on this device`,
  };
}

/**
 * Sample baseline for demos only, clearly labeled. Not NASA data, not a real person.
 * About 275 ms median, a typical tablet value once touch and screen delay are included.
 */
export const SAMPLE_BASELINE: Baseline = {
  meanSpeed: 3.6,
  medianRtMs: 275,
  n: 0,
  source: "sample",
  label: "Sample demo baseline (not a real person)",
};

const DAY_MS = 24 * 60 * 60 * 1000;

/** Flight-surgeon review: Act twice within 24 h, or Act right before a critical task (MINIGAME.md §4.6). */
export function shouldEscalate(
  band: Band,
  trigger: Trigger,
  history: SessionRecord[],
  now: Date,
): boolean {
  if (band !== "act") return false;
  if (trigger === "pre_task") return true;
  return history.some(
    (s) => s.pvt.band === "act" && now.getTime() - new Date(s.timestamp).getTime() <= DAY_MS,
  );
}

const NASA_SLEEP_RISK = {
  label: "NASA HRP: Risk from inadequate sleep",
  url: "https://www.nasa.gov/reference/risk-from-inadequate-sleep-and-irregular-schedules/",
};

/** Countermeasure card: one primary action up front (MINIGAME.md §4.5; SUGGESTIONS.md §1). */
export function countermeasureCard(
  band: Band,
  trigger: Trigger,
  escalated: boolean,
): CountermeasureCardContent {
  switch (band) {
    case "ok":
      return { primary: "You're alert. No action needed.", secondary: [], flags: [] };
    case "watch":
      return {
        primary:
          trigger === "pre_task"
            ? "Double-check each step of the task before you start."
            : "Take a short movement break in bright light.",
        secondary: [
          "Caffeine only if it fits your plan and isn't close to your next sleep.",
          "Double-check critical tasks today.",
        ],
        flags: [],
        source: NASA_SLEEP_RISK,
      };
    case "act":
      return {
        primary:
          trigger === "pre_task"
            ? "Postpone the task, or have each step double-checked."
            : "Nap 20–30 min if your schedule allows.",
        secondary: ["Postpone or double-check critical tasks.", "Re-check after rest."],
        flags: [
          "Crew medical officer flagged.",
          ...(escalated ? ["Marked for flight surgeon review in the next downlink."] : []),
        ],
        source: NASA_SLEEP_RISK,
      };
    case "baseline":
      return {
        primary: "No rating yet. Building your baseline.",
        secondary: ["Rested checks (sleepiness 4 or lower, 7 h+ sleep) set your normal."],
        flags: [],
      };
    case "invalid":
      return {
        primary: "This check couldn't be scored. Try again when ready.",
        secondary: [],
        flags: [],
      };
  }
}

function newId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `bc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export interface BuildSessionInput {
  run: TestRun;
  trigger: Trigger;
  sleepiness: number | null;
  sleepinessReused: boolean;
  sleepHours: number | null;
  baseline: Baseline | null;
  history: SessionRecord[];
  now?: Date;
}

export function buildSession(input: BuildSessionInput): {
  record: SessionRecord;
  card: CountermeasureCardContent;
  reasons: string[];
} {
  const now = input.now ?? new Date();
  const metrics = computeMetrics(input.run.trials, input.run.falseStarts, lapseLineFor(input.baseline));
  const cls: Classification = input.run.complete
    ? classify(metrics, input.baseline, input.run.decided, input.run.elapsedMs)
    : { band: "invalid", category: null, vsBaselineSd: null, reasons: ["Check ended early."] };
  const escalated = shouldEscalate(cls.band, input.trigger, input.history, now);
  const card = countermeasureCard(cls.band, input.trigger, escalated);

  const record: SessionRecord = {
    sessionId: newId(),
    timestamp: now.toISOString(),
    trigger: input.trigger,
    checkIn: { sleepiness: input.sleepiness, sleepinessReused: input.sleepinessReused },
    rested: isRested(input.sleepiness, input.sleepHours),
    pvt: {
      ...metrics,
      durationSec: Math.round(input.run.elapsedMs / 1000),
      stoppedEarly: input.run.endedReason === "decided",
      band: cls.band,
      category: cls.category,
      vsBaselineSd: cls.vsBaselineSd,
      baselineSource: input.baseline?.source ?? null,
    },
    recovery: { type: cls.band === "watch" || cls.band === "act" ? "countermeasure" : "none" },
    recommendation: card.primary,
    cmoFlagged: cls.band === "act",
    escalated,
    complete: input.run.complete,
  };
  return { record, card, reasons: cls.reasons };
}

/** Full-length runs are needed while the baseline is being built. */
export function usesAdaptiveStop(baseline: Baseline | null): boolean {
  return baseline !== null;
}

/** One-line cause for the Home header / alertness row (design doc 05 §4). */
export function causeLine(record: SessionRecord, reasons: string[]): string {
  const b = record.pvt.band;
  if (b === "baseline") return "Alertness: building your baseline";
  if (b === "invalid") return "Alertness check couldn't be scored";
  if (b === "ok") return "Alertness normal for you";
  return `Alertness ${b === "act" ? "low" : "reduced"}${reasons[0] ? ` · ${reasons[0]}` : ""}`;
}
