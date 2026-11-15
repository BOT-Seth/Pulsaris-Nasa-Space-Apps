// Data model. Provenance is a field on every reading, so recorded, synthetic,
// self-reported and reference values can never be confused downstream.

export type Provenance =
  | 'recorded' // computed from the MMASH dataset (real people, on Earth)
  | 'synthetic' // generated for the demo scenario; never a measurement
  | 'self-reported' // typed or tapped in by the user in this app
  | 'measured-here'; // produced by a test run in this app (alertness check)

export type IndicatorId =
  | 'sleep' | 'hrv' | 'heartRate' | 'mood' | 'sleepiness'
  | 'alertness' | 'bloodPressure' | 'bloodSugar' | 'temperature';

/** Mission time in minutes since mission day 1, 00:00. */
export type MissionMin = number;

export interface Quality {
  /** False means the value must not drive a rule. */
  usable: boolean;
  note: string;
}

export interface Reading {
  id: string;
  indicator: IndicatorId;
  value: number;
  /** Diastolic pressure for blood pressure readings. */
  value2?: number;
  unit: string;
  at: MissionMin;
  provenance: Provenance;
  source: string;
  quality?: Quality;
  /** Recording window for overnight values. */
  window?: { from: MissionMin; to: MissionMin };
}

/** ok/watch/act are judgments. none = no data or no baseline. info = recorded, but no rule applies. */
export type Status = 'ok' | 'watch' | 'act' | 'none' | 'info';

/** Where a rule's threshold comes from. Shown next to every rule. */
export type RuleBasis = 'published' | 'team-starting-point' | 'clinical-reference';

export interface Baseline {
  mean: number;
  sd: number;
  n: number;
  /** True when any contributing night is synthetic. */
  synthetic: boolean;
  low: number;
  high: number;
}

export interface IndicatorStatus {
  indicator: IndicatorId;
  status: Status;
  /** One short sentence: what the status means. */
  summary: string;
  /** The rule that produced it, in plain words. */
  rule: string;
  basis: RuleBasis;
  latest: Reading | null;
  baseline: Baseline | null;
  /** Nights still needed before a baseline exists. */
  baselineNeeded?: number;
}

export interface Trial { rtMs: number; scored: boolean }

export type Protocol = 'pvt-b-3min' | 'demo-short';

export interface PvtSession {
  id: string;
  at: MissionMin;
  protocol: Protocol;
  trigger: 'recommended' | 'pre-task' | 're-check';
  valid: boolean;
  invalidReason?: string;
  trials: number;
  meanRecip: number; // mean of 1/RT, per second
  speed: number; // 10 - meanRecip (Dev et al. 2024). Lower is faster.
  z: number; // SD from the reference mean. Positive is slower.
  medianMs: number;
  lapses: number;
  falseStarts: number;
  band: 'ok' | 'watch' | 'act';
  provenance: 'measured-here' | 'synthetic';
  /** Sleepiness 4 or lower and 7 h or more of sleep. Only rested sessions build a personal baseline. */
  rested: boolean;
  comparedWith: 'nasa-reference' | 'personal-baseline';
}

export interface Symptom {
  id: string;
  at: MissionMin;
  region: RegionId;
  side?: string;
  list: string[];
  tempC?: number;
}

export type RegionId = 'head' | 'chest' | 'abdomen' | 'limbs' | 'whole';

export interface ActionRecord { at: MissionMin; text: string; issue: string }
export interface LogEntry { at: MissionMin; text: string }

export type IssueId =
  | 'alertness-result' | 'alertness-followup' | 'alertness-check'
  | 'temperature' | 'blood-sugar' | 'heart-rate' | 'checkin' | 'bp-due';

export interface Issue {
  id: IssueId;
  level: 'act' | 'watch' | 'due';
  title: string;
  why: string;
  /** Interpretation state, kept apart from the task state. */
  state: string;
  evidence: IndicatorId[];
}
