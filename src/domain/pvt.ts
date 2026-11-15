// Alertness check scoring. Pure functions, no UI.
//
// Protocol: 3-minute psychomotor vigilance test (PVT-B), 2-5 s random gap (as used by Dev et al. 2024), lapse at 355 ms or slower
//   Basner, Mollicone & Dinges 2011, Acta Astronautica, doi:10.1016/j.actaastro.2011.07.015
// Speed score: 10 - mean(1/RT), RT in seconds. Lower is faster.
// Reference: NASA ISS astronauts pre-flight, N = 24, mean 5.25, SD 0.24
//   Dev et al. 2024, Frontiers in Physiology, doi:10.3389/fphys.2024.1451269 (Table 1)
// Bands: team starting points from docs/scope/MINIGAME.md 4.3. The 1.5 SD cut matches Dev et al.'s "low score".
//
// This is a browser prototype. Display and touch latency are not benchmarked, so a comparison
// with the reference is indicative only.

import { mean, median, sd } from './stats';
import type { Protocol, PvtSession } from './types';

export const REFERENCE = { mean: 5.25, sd: 0.24, n: 24 } as const;
export const LAPSE_MS = 355;
export const FALSE_START_MS = 100;
export const WARMUP_TRIALS = 3;
export const TIMEOUT_MS = 30000;
export const MAX_FALSE_STARTS = 8;
export const DURATION_MS: Record<Protocol, number> = { 'pvt-b-3min': 180000, 'demo-short': 45000 };

export interface RawRun {
  /** Reaction times in ms, in order, including warm-up trials. A timeout is recorded as TIMEOUT_MS. */
  rts: number[];
  falseStarts: number;
  /** True if the run was cut short or resumed too late. */
  interrupted: boolean;
}

export interface Comparison { mean: number; sd: number; kind: 'nasa-reference' | 'personal-baseline' }

export function band(z: number, lapses: number, falseStarts: number): 'ok' | 'watch' | 'act' {
  if (z >= 1.5 || lapses >= 6 || falseStarts >= 4) return 'act';
  if (z >= 1 || lapses >= 3) return 'watch';
  return 'ok';
}

export type Scored = Pick<PvtSession,
  'valid' | 'invalidReason' | 'trials' | 'meanRecip' | 'speed' | 'z' | 'medianMs' | 'lapses' | 'falseStarts' | 'band' | 'comparedWith'>;

export function scoreRun(run: RawRun, against: Comparison = { ...REFERENCE, kind: 'nasa-reference' }): Scored {
  const scored = run.rts.slice(WARMUP_TRIALS);
  const invalid = (invalidReason: string): Scored => ({
    valid: false, invalidReason, trials: scored.length, meanRecip: 0, speed: 0, z: 0, medianMs: 0,
    lapses: 0, falseStarts: run.falseStarts, band: 'ok', comparedWith: against.kind,
  });
  if (run.interrupted) return invalid('Interrupted. Not scored.');
  if (run.falseStarts > MAX_FALSE_STARTS) return invalid('Too many early taps. Not scored.');
  if (scored.length < 5) return invalid('Too few responses to score.');

  const meanRecip = mean(scored.map((rt) => 1000 / rt));
  const speed = 10 - meanRecip;
  const z = (speed - against.mean) / against.sd;
  const lapses = scored.filter((rt) => rt >= LAPSE_MS).length;
  return {
    valid: true, trials: scored.length, meanRecip, speed, z, medianMs: Math.round(median(scored)),
    lapses, falseStarts: run.falseStarts, band: band(z, lapses, run.falseStarts), comparedWith: against.kind,
  };
}

/**
 * A personal baseline needs 3 rested, valid, full-length sessions (MINIGAME.md 4.3).
 * "Rested" is decided by the caller (sleepiness 4 or lower and 7 h or more of sleep).
 */
export function personalBaseline(restedSpeeds: number[]): Comparison | null {
  if (restedSpeeds.length < 3) return null;
  const s = sd(restedSpeeds);
  // With 3 sessions the SD is unstable; never go tighter than the reference SD.
  return { mean: mean(restedSpeeds), sd: Math.max(s, REFERENCE.sd), kind: 'personal-baseline' };
}
