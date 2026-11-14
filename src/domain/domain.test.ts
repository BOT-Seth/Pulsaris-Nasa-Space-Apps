import { describe, expect, it } from 'vitest';
import { REFERENCE, band, personalBaseline, scoreRun } from './pvt';
import { baselineFor, evaluate, latest } from './rules';
import { SCENARIOS, buildScenario } from './scenario';
import { DAY } from './time';
import type { ActionRecord, PvtSession, Reading } from './types';

const warm = [240, 240, 240];
const run = (rts: number[], falseStarts = 0, interrupted = false) => ({ rts: [...warm, ...rts], falseStarts, interrupted });
const flat = (ms: number, n = 30) => Array.from({ length: n }, () => ms);

describe('alertness scoring', () => {
  it('uses speed = 10 - mean(1/RT) and the Dev et al. reference', () => {
    // 1/0.224 s = 4.464 per s, speed 5.536, (5.536 - 5.25) / 0.24 = 1.19 SD
    const s = scoreRun(run(flat(224)));
    expect(s.valid).toBe(true);
    expect(s.speed).toBeCloseTo(5.536, 2);
    expect(s.z).toBeCloseTo(1.19, 1);
    expect(s.band).toBe('watch');
  });
  it('a reference-speed run with no lapses is OK', () => {
    const s = scoreRun(run(flat(210)));
    expect(Math.abs(s.z)).toBeLessThan(1);
    expect(s.lapses).toBe(0);
    expect(s.band).toBe('ok');
  });
  it('excludes the first 3 trials and counts lapses at 355 ms', () => {
    const s = scoreRun({ rts: [900, 900, 900, ...flat(210, 20), 355, 354], falseStarts: 0, interrupted: false });
    expect(s.trials).toBe(22);
    expect(s.lapses).toBe(1);
  });
  it('band thresholds', () => {
    expect(band(0.99, 2, 0)).toBe('ok');
    expect(band(1.0, 0, 0)).toBe('watch');
    expect(band(0, 3, 0)).toBe('watch');
    expect(band(1.5, 0, 0)).toBe('act');
    expect(band(0, 6, 0)).toBe('act');
    expect(band(0, 0, 4)).toBe('act');
  });
  it('never scores an interrupted, false-start-heavy or too-short run', () => {
    expect(scoreRun(run(flat(210), 0, true)).valid).toBe(false);
    expect(scoreRun(run(flat(210), 9)).valid).toBe(false);
    expect(scoreRun(run(flat(210, 3))).valid).toBe(false);
  });
  it('needs 3 rested sessions for a personal baseline and never tightens below the reference SD', () => {
    expect(personalBaseline([5.2, 5.3])).toBeNull();
    const b = personalBaseline([5.2, 5.21, 5.22])!;
    expect(b.kind).toBe('personal-baseline');
    expect(b.sd).toBe(REFERENCE.sd);
  });
});

function withCheckin(readings: Reading[], at: number, kss: number): Reading[] {
  return [...readings,
    { id: 'm', indicator: 'mood', value: 4, unit: 'of 5', at, provenance: 'self-reported', source: 't' },
    { id: 'k', indicator: 'sleepiness', value: kss, unit: 'of 9', at, provenance: 'self-reported', source: 't' }];
}
const base = { sessions: [] as PvtSession[], disputed: [] as string[], actions: [] as ActionRecord[] };

describe('scenarios and provenance', () => {
  it('every scenario builds, and only last night is recorded', () => {
    for (const def of SCENARIOS) {
      const sc = buildScenario(def.id);
      for (const r of sc.readings) {
        const isToday = Math.floor(r.at / DAY) + 1 === def.missionDay;
        expect(r.provenance).toBe(isToday ? 'recorded' : 'synthetic');
      }
    }
  });
  it('is deterministic', () => {
    expect(buildScenario('short').readings).toEqual(buildScenario('short').readings);
  });
});

describe('rules', () => {
  it('ordinary night: check-in is the only task, then sleepiness 7 recommends a check', () => {
    const sc = buildScenario('ordinary');
    const before = evaluate({ ...base, now: sc.startAt, readings: sc.readings });
    expect(before.issues.map((i) => i.id)).toEqual(['checkin']);
    expect(before.statuses.sleep.status).toBe('ok');

    const low = evaluate({ ...base, now: sc.startAt + 1, readings: withCheckin(sc.readings, sc.startAt, 4) });
    expect(low.issues).toHaveLength(0);

    const high = evaluate({ ...base, now: sc.startAt + 1, readings: withCheckin(sc.readings, sc.startAt, 7) });
    expect(high.issues[0].id).toBe('alertness-check');
    expect(high.statuses.sleep.status).toBe('watch'); // under 6 h plus sleepiness 7
  });
  it('short night: under 5 h recommends a check before any check-in', () => {
    const sc = buildScenario('short');
    const ev = evaluate({ ...base, now: sc.startAt, readings: sc.readings });
    expect(ev.issues[0].id).toBe('alertness-check');
    expect(ev.statuses.hrv.status).toBe('watch');
    expect(ev.statuses.hrv.baseline?.synthetic).toBe(true);
  });
  it('flight day 3: no baseline, so HRV is never judged', () => {
    const sc = buildScenario('early');
    const ev = evaluate({ ...base, now: sc.startAt, readings: sc.readings });
    expect(ev.statuses.hrv.status).toBe('none');
    expect(ev.statuses.hrv.baselineNeeded).toBe(5);
    expect(baselineFor(sc.readings, latest(sc.readings, 'hrv')!, true).baseline).toBeNull();
  });
  it('partial recording and sensor gap never default to OK', () => {
    const partial = buildScenario('partial');
    expect(evaluate({ ...base, now: partial.startAt, readings: partial.readings }).statuses.hrv.status).toBe('none');
    const gap = buildScenario('gap');
    const ev = evaluate({ ...base, now: gap.startAt, readings: gap.readings });
    expect(ev.statuses.sleep.status).toBe('none');
    expect(ev.statuses.hrv.status).toBe('none');
    expect(ev.statuses.heartRate.status).toBe('none');
  });
  it('a disputed sleep recording drives no rule', () => {
    const sc = buildScenario('short');
    const sleep = latest(sc.readings, 'sleep')!;
    const ev = evaluate({ ...base, now: sc.startAt, readings: sc.readings, disputed: [sleep.id] });
    expect(ev.statuses.sleep.status).toBe('none');
    expect(ev.triggers.some((t) => t.includes('slept'))).toBe(false);
  });
  it('old cuff and finger-stick readings are never shown as a current OK', () => {
    const sc = buildScenario('ordinary');
    const ev = evaluate({ ...base, now: sc.startAt, readings: sc.readings });
    expect(ev.statuses.bloodSugar.status).toBe('info');
    expect(ev.statuses.bloodPressure.status).toBe('info');
  });
  it('blood sugar: one out-of-range fasting reading asks for a re-check, two confirm', () => {
    const sc = buildScenario('long');
    const now = sc.startAt + 10;
    const g = (id: string, at: number, value: number): Reading => ({ id, indicator: 'bloodSugar', value, unit: 'mg/dL', at, provenance: 'self-reported', source: 't', quality: { usable: true, note: 'Fasting reading' } });
    const one = evaluate({ ...base, now, readings: [...withCheckin(sc.readings, sc.startAt, 3), g('a', now - 5, 112)] });
    expect(one.issues.find((i) => i.id === 'blood-sugar')?.title).toMatch(/Re-check/);
    const two = evaluate({ ...base, now, readings: [...withCheckin(sc.readings, sc.startAt, 3), g('a', now - 5, 112), g('b', now - 1, 115)] });
    expect(two.issues.find((i) => i.id === 'blood-sugar')?.title).toMatch(/twice/);
    const inRange = evaluate({ ...base, now, readings: [...withCheckin(sc.readings, sc.startAt, 3), g('a', now - 5, 112), g('b', now - 1, 92)] });
    expect(inRange.statuses.bloodSugar.status).toBe('ok');
  });
  it('a recorded action does not clear an alertness concern; only an OK re-check does', () => {
    const sc = buildScenario('short');
    const now = sc.startAt + 30;
    const sess = (id: string, at: number, b: 'ok' | 'watch'): PvtSession => ({ id, at, protocol: 'pvt-b-3min', trigger: 'recommended', valid: true, trials: 30, meanRecip: 4.4, speed: 5.6, z: b === 'ok' ? 0.2 : 1.3, medianMs: 230, lapses: 1, falseStarts: 0, band: b, provenance: 'measured-here', rested: false, comparedWith: 'nasa-reference' });
    const open = evaluate({ ...base, now, readings: sc.readings, sessions: [sess('1', sc.startAt + 5, 'watch')] });
    expect(open.issues[0].id).toBe('alertness-result');
    const acted = evaluate({ ...base, now, readings: sc.readings, sessions: [sess('1', sc.startAt + 5, 'watch')], actions: [{ at: sc.startAt + 8, text: 'x', issue: 'alertness-result' }] });
    expect(acted.issues[0].id).toBe('alertness-followup');
    const cleared = evaluate({ ...base, now, readings: sc.readings, sessions: [sess('1', sc.startAt + 5, 'watch'), sess('2', sc.startAt + 25, 'ok')] });
    expect(cleared.issues.some((i) => i.id.startsWith('alertness'))).toBe(false);
  });
  it('temperature at or above 38.0 C raises one issue', () => {
    const sc = buildScenario('long');
    const now = sc.startAt + 10;
    const t: Reading = { id: 't', indicator: 'temperature', value: 38.4, unit: '°C', at: now - 2, provenance: 'self-reported', source: 't' };
    const ev = evaluate({ ...base, now, readings: [...sc.readings, t] });
    expect(ev.issues.some((i) => i.id === 'temperature')).toBe(true);
    expect(ev.statuses.temperature.status).toBe('watch');
  });
});
