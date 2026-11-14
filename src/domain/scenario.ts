// Builds a demo scenario: ONE real recorded night from MMASH, placed on a mission day,
// plus a synthetic history so baselines and trends have something to work with.
// Every synthetic reading carries provenance 'synthetic'. Nothing here is astronaut data.

import raw from '../data/mmash.json';
import { clamp, gauss, mulberry32 } from './stats';
import { DAY } from './time';
import type { MissionMin, Reading } from './types';

interface MmashUser {
  id: string;
  sleep: { tstMin: number; inBed: string; outBed: string; periods: number; efficiencyPct: number; awakenings: number } | null;
  hrv: { rmssdMs: number; windows: number; beatsKeptPct: number; coveragePct: number; series: { t: string; rmssd: number; hr: number }[] } | null;
  heart: { sleepMeanBpm: number; sleepLowestBpm: number } | null;
}
const USERS = (raw as { users: MmashUser[] }).users;

export interface ScenarioDef {
  id: string;
  name: string;
  blurb: string;
  user: string;
  /** Mission day of "today". Fewer than 8 means the 7-night baseline is still building. */
  missionDay: number;
  /** Synthetic HRV history is centred on recorded value x this factor. */
  hrvHistoryFactor: number;
}

export const SCENARIOS: ScenarioDef[] = [
  { id: 'ordinary', name: 'Ordinary night', blurb: 'Recorded night of 5 h 48 min. What happens next depends on your check-in.', user: 'user_5', missionDay: 12, hrvHistoryFactor: 1.02 },
  { id: 'short', name: 'Short night', blurb: 'Recorded night of 4 h 07 min, with HRV below the synthetic history.', user: 'user_13', missionDay: 12, hrvHistoryFactor: 1.24 },
  { id: 'long', name: 'Rested night', blurb: 'Recorded night of 6 h 24 min. Nothing should be flagged.', user: 'user_20', missionDay: 12, hrvHistoryFactor: 1.0 },
  { id: 'early', name: 'Flight day 3', blurb: 'Only 2 earlier nights exist, so no baseline yet.', user: 'user_12', missionDay: 3, hrvHistoryFactor: 1.0 },
  { id: 'partial', name: 'Partial recording', blurb: 'Heart sensor covered 9 % of the night. HRV is shown but not used.', user: 'user_9', missionDay: 12, hrvHistoryFactor: 1.0 },
  { id: 'gap', name: 'Sensor gap', blurb: 'No sleep or heart recording exists for last night.', user: 'user_11', missionDay: 12, hrvHistoryFactor: 1.0 },
];

export interface Scenario {
  def: ScenarioDef;
  startAt: MissionMin;
  readings: Reading[];
  /** Real 5-minute HRV and heart-rate windows across the recorded night. */
  nightSeries: { t: string; rmssd: number; hr: number }[];
  sleepDetail: MmashUser['sleep'];
}

const toMin = (hhmm: string): number => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5));
const dayStart = (day: number): MissionMin => (day - 1) * DAY;

export function buildScenario(id: string): Scenario {
  const def = SCENARIOS.find((s) => s.id === id) ?? SCENARIOS[0];
  const user = USERS.find((u) => u.id === def.user)!;
  const today = def.missionDay;
  const readings: Reading[] = [];
  const mmash = `MMASH ${user.id.replace('_', ' ')} (PhysioNet, ODbL)`;

  // --- The recorded night -------------------------------------------------
  let startAt = dayStart(today) + 6 * 60 + 30;
  if (user.sleep) {
    const out = toMin(user.sleep.outBed);
    const inBed = toMin(user.sleep.inBed);
    const to = dayStart(today) + out;
    const from = dayStart(today) + inBed - (inBed > out ? DAY : 0);
    startAt = to + 20;
    const window = { from, to };
    readings.push({
      id: `${def.id}-sleep-${today}`, indicator: 'sleep', value: user.sleep.tstMin, unit: 'min', at: to, window,
      provenance: 'recorded', source: mmash,
      quality: { usable: true, note: `Wrist actigraphy, ${user.sleep.efficiencyPct} % sleep efficiency, ${user.sleep.awakenings} awakenings` },
    });
    if (user.hrv && user.heart) {
      const partial = user.hrv.coveragePct < 50;
      readings.push({
        id: `${def.id}-hrv-${today}`, indicator: 'hrv', value: user.hrv.rmssdMs, unit: 'ms', at: to, window,
        provenance: 'recorded', source: mmash,
        quality: {
          usable: !partial,
          note: partial
            ? `Sensor covered ${Math.round(user.hrv.coveragePct)} % of the night. Too little to compare.`
            : `${user.hrv.beatsKeptPct} % of beats kept, ${Math.round(user.hrv.coveragePct)} % of the night covered`,
        },
      });
      readings.push({
        id: `${def.id}-hr-${today}`, indicator: 'heartRate', value: Math.round(user.heart.sleepMeanBpm), unit: 'bpm', at: to, window,
        provenance: 'recorded', source: mmash,
        quality: { usable: !partial, note: partial ? `Sensor covered ${Math.round(user.hrv.coveragePct)} % of the night.` : 'Mean over the sleep window, chest strap' },
      });
    }
  }

  // --- Synthetic history (seeded, labeled) --------------------------------
  const rand = mulberry32(def.id.split('').reduce((s, c) => s * 31 + c.charCodeAt(0), 7));
  const nights = Math.min(7, today - 1);
  const hrvCentre = (user.hrv?.rmssdMs ?? 48) * def.hrvHistoryFactor;
  const hrCentre = user.heart?.sleepMeanBpm ?? 58;
  const synthetic = 'Synthetic scenario history';
  for (let k = nights; k >= 1; k--) {
    const day = today - k;
    const at = dayStart(day) + 6 * 60 + 20 + Math.round(rand() * 40);
    // Sleep is centred on the in-flight average of about 6.4 h (Dev et al. 2024).
    const tst = Math.round(clamp(384 + gauss(rand) * 34, 290, 470));
    const window = { from: at - tst - 35, to: at };
    readings.push({ id: `${def.id}-sleep-${day}`, indicator: 'sleep', value: tst, unit: 'min', at, window, provenance: 'synthetic', source: synthetic });
    readings.push({ id: `${def.id}-hrv-${day}`, indicator: 'hrv', value: Math.round(clamp(hrvCentre * (1 + gauss(rand) * 0.08), 12, 140) * 10) / 10, unit: 'ms', at, window, provenance: 'synthetic', source: synthetic });
    readings.push({ id: `${def.id}-hr-${day}`, indicator: 'heartRate', value: Math.round(hrCentre + gauss(rand) * 2.2), unit: 'bpm', at, window, provenance: 'synthetic', source: synthetic });
    const checkAt = at + 25;
    readings.push({ id: `${def.id}-mood-${day}`, indicator: 'mood', value: clamp(Math.round(3.6 + gauss(rand) * 0.6), 2, 5), unit: 'of 5', at: checkAt, provenance: 'synthetic', source: synthetic });
    readings.push({ id: `${def.id}-kss-${day}`, indicator: 'sleepiness', value: clamp(Math.round(4 + gauss(rand) * 1), 2, 6), unit: 'of 9', at: checkAt, provenance: 'synthetic', source: synthetic });
  }
  // One earlier cuff and finger-stick entry, so the weekly cadence has a starting point.
  const entryDay = Math.max(1, today - 6);
  if (entryDay < today) {
    const at = dayStart(entryDay) + 7 * 60 + 10;
    readings.push({ id: `${def.id}-bp-${entryDay}`, indicator: 'bloodPressure', value: 118, value2: 76, unit: 'mmHg', at, provenance: 'synthetic', source: synthetic });
    readings.push({ id: `${def.id}-glu-${entryDay}`, indicator: 'bloodSugar', value: 94, unit: 'mg/dL', at, provenance: 'synthetic', source: synthetic });
  }

  return { def, startAt, readings, nightSeries: user.hrv?.series ?? [], sleepDetail: user.sleep };
}
