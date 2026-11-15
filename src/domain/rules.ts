// Health interpretation. Pure functions: readings in, statuses and open issues out.
// No component decides a status. Every rule names its basis, and thresholds marked
// 'team-starting-point' are unvalidated starting values from docs/scope/MINIGAME.md.

import { mean, sd } from './stats';
import { DAY, clock, duration, sameDay } from './time';
import type {
  ActionRecord, Baseline, IndicatorId, IndicatorStatus, Issue, MissionMin, PvtSession, Reading, RuleBasis, Status,
} from './types';

export const BASELINE_NIGHTS = 7;
export const GLUCOSE_FASTING_RANGE = { low: 65, high: 99 } as const; // mg/dL, clinical lab fasting range
export const FEVER_C = 38.0; // clinical definition of fever on Earth
export const KSS_TRIGGER = 7;
export const SHORT_SLEEP_ALONE_MIN = 300; // under 5 h
export const SHORT_SLEEP_COMBINED_MIN = 360; // under 6 h, plus low HRV or sleepiness 7+
export const WEEKLY = 7 * DAY;

export interface RuleInput {
  now: MissionMin;
  readings: Reading[];
  sessions: PvtSession[];
  /** Ids of recordings the user marked as wrong. They never drive a rule. */
  disputed: string[];
  actions: ActionRecord[];
}

export interface Evaluation {
  statuses: Record<IndicatorId, IndicatorStatus>;
  issues: Issue[];
  /** Reasons an alertness check is recommended today, in plain words. */
  triggers: string[];
  /** Latest valid alertness session today, if any. */
  sessionToday: PvtSession | null;
}

const ORDER: IndicatorId[] = ['sleep', 'hrv', 'heartRate', 'sleepiness', 'mood', 'alertness', 'bloodPressure', 'bloodSugar', 'temperature'];
export const INDICATORS = ORDER;

export function series(readings: Reading[], indicator: IndicatorId): Reading[] {
  return readings.filter((r) => r.indicator === indicator).sort((a, b) => a.at - b.at);
}
export function latest(readings: Reading[], indicator: IndicatorId): Reading | null {
  const s = series(readings, indicator);
  return s.length ? s[s.length - 1] : null;
}

/**
 * In-flight rolling baseline: the 7 nights before the given reading.
 * HR, HRV and BP drop in microgravity (Fritsch-Yelle et al. 1996), so a pre-flight
 * baseline is never used. `log` compares ln(value), the usual choice for RMSSD.
 */
export function baselineFor(readings: Reading[], target: Reading, log = false): { baseline: Baseline | null; have: number } {
  const prior = series(readings, target.indicator)
    .filter((r) => r.at < target.at && r.quality?.usable !== false)
    .slice(-BASELINE_NIGHTS);
  if (prior.length < BASELINE_NIGHTS) return { baseline: null, have: prior.length };
  const vals = prior.map((r) => (log ? Math.log(r.value) : r.value));
  const m = mean(vals), s = sd(vals);
  const back = (v: number) => (log ? Math.exp(v) : v);
  return {
    have: prior.length,
    baseline: { mean: m, sd: s, n: prior.length, synthetic: prior.some((r) => r.provenance === 'synthetic'), low: back(m - s), high: back(m + s) },
  };
}

function st(indicator: IndicatorId, status: Status, summary: string, rule: string, basis: RuleBasis, latestReading: Reading | null, baseline: Baseline | null = null, baselineNeeded?: number): IndicatorStatus {
  return { indicator, status, summary, rule, basis, latest: latestReading, baseline, baselineNeeded };
}

export function evaluate(input: RuleInput): Evaluation {
  const { now, readings, sessions, disputed, actions } = input;
  const today = (r: Reading | null): r is Reading => !!r && sameDay(r.at, now);
  const fresh = (r: Reading | null): r is Reading => !!r && now - r.at < DAY && now >= r.at;
  const S = {} as Record<IndicatorId, IndicatorStatus>;

  // ---- HRV: more than 1 SD below the 7-night in-flight mean of ln(RMSSD) ----
  const hrvRule = 'Watch when sleep-window RMSSD is more than 1 SD below your 7-night in-flight average. Off until 7 nights exist.';
  const hrv = latest(readings, 'hrv');
  let lowHrv = false;
  if (!today(hrv)) S.hrv = st('hrv', 'none', 'No recording for last night.', hrvRule, 'team-starting-point', hrv);
  else if (hrv.quality?.usable === false) S.hrv = st('hrv', 'none', hrv.quality.note + ' Not used.', hrvRule, 'team-starting-point', hrv);
  else {
    const { baseline, have } = baselineFor(readings, hrv, true);
    if (!baseline) S.hrv = st('hrv', 'none', `Baseline building: ${have} of ${BASELINE_NIGHTS} nights. Not compared yet.`, hrvRule, 'team-starting-point', hrv, null, BASELINE_NIGHTS - have);
    else {
      const z = (Math.log(hrv.value) - baseline.mean) / (baseline.sd || 1);
      const pct = Math.round((1 - hrv.value / Math.exp(baseline.mean)) * 100);
      lowHrv = z < -1;
      S.hrv = st('hrv', lowHrv ? 'watch' : 'ok',
        lowHrv ? `${pct}% below the ${baseline.synthetic ? 'demo mean' : '7-night average'}.` : `Within the ${baseline.synthetic ? 'demo baseline' : 'usual range'}.`, hrvRule, 'team-starting-point', hrv, baseline);
    }
  }

  // ---- Sleepiness: Karolinska scale, 7 or higher ----
  const kssRule = 'Watch at 7 or higher on the Karolinska Sleepiness Scale.';
  const kss = latest(readings, 'sleepiness');
  const kssHigh = today(kss) && kss.value >= KSS_TRIGGER;
  S.sleepiness = !today(kss)
    ? st('sleepiness', 'none', 'Not entered today.', kssRule, 'team-starting-point', kss)
    : st('sleepiness', kssHigh ? 'watch' : 'ok', kssHigh ? 'You rated yourself sleepy.' : 'Below the level that asks for a check.', kssRule, 'team-starting-point', kss);

  // ---- Sleep duration ----
  const sleepRule = 'Watch under 5 h alone, or under 6 h together with low HRV or sleepiness 7 or higher.';
  const sleep = latest(readings, 'sleep');
  let shortSleep = false;
  if (!today(sleep)) S.sleep = st('sleep', 'none', 'No recording for last night.', sleepRule, 'team-starting-point', sleep);
  else if (disputed.includes(sleep.id)) S.sleep = st('sleep', 'none', 'Marked wrong by you. Not used.', sleepRule, 'team-starting-point', sleep);
  else {
    shortSleep = sleep.value < SHORT_SLEEP_ALONE_MIN || (sleep.value < SHORT_SLEEP_COMBINED_MIN && (lowHrv || kssHigh));
    const pending = !shortSleep && sleep.value < SHORT_SLEEP_COMBINED_MIN && !today(kss);
    S.sleep = st('sleep', shortSleep ? 'watch' : pending ? 'info' : 'ok',
      shortSleep ? (sleep.value < SHORT_SLEEP_ALONE_MIN ? 'Under 5 h.' : kssHigh ? 'Under 6 h, with reported sleepiness.' : 'Under 6 h, with low HRV.')
        : sleep.value < SHORT_SLEEP_COMBINED_MIN ? (today(kss) ? 'Under 6 h, with no other sign of fatigue.' : 'Under 6 h; today’s sleepiness is not entered.') : 'No short-sleep demo rule triggered.',
      sleepRule, 'team-starting-point', sleep);
  }

  // ---- Heart rate during sleep: outside mean +/- 2 SD of the in-flight baseline ----
  const hrRule = 'Watch when sleeping heart rate is more than 2 SD from your 7-night in-flight average.';
  const hr = latest(readings, 'heartRate');
  let hrFlag = false;
  if (!today(hr)) S.heartRate = st('heartRate', 'none', 'No recording for last night.', hrRule, 'team-starting-point', hr);
  else if (hr.quality?.usable === false) S.heartRate = st('heartRate', 'none', hr.quality.note + ' Not used.', hrRule, 'team-starting-point', hr);
  else {
    const { baseline, have } = baselineFor(readings, hr);
    if (!baseline) S.heartRate = st('heartRate', 'none', `Baseline building: ${have} of ${BASELINE_NIGHTS} nights. Not compared yet.`, hrRule, 'team-starting-point', hr, null, BASELINE_NIGHTS - have);
    else {
      hrFlag = Math.abs(hr.value - baseline.mean) > 2 * (baseline.sd || 1);
      S.heartRate = st('heartRate', hrFlag ? 'watch' : 'ok', hrFlag ? `Outside the ${baseline.synthetic ? 'demo baseline' : 'usual range'}.` : `Within the ${baseline.synthetic ? 'demo baseline' : 'usual range'}.`, hrRule, 'team-starting-point', hr, baseline);
    }
  }

  // ---- Mood: recorded, no rule ----
  const mood = latest(readings, 'mood');
  S.mood = today(mood)
    ? st('mood', 'info', 'Logged. No rule uses mood alone.', 'No rule. Shown for your own trend.', 'team-starting-point', mood)
    : st('mood', 'none', 'Not entered today.', 'No rule. Shown for your own trend.', 'team-starting-point', mood);

  // ---- Alertness: latest valid session today ----
  const pvtRule = 'Watch: 1 to 1.5 SD slower than the comparison, or 3 to 5 lapses. Act: 1.5 SD or more, 6 or more lapses, or 4 or more false starts.';
  const validToday = sessions.filter((s) => s.valid && sameDay(s.at, now)).sort((a, b) => a.at - b.at);
  const sessionToday = validToday.length ? validToday[validToday.length - 1] : null;
  S.alertness = sessionToday
    ? st('alertness', sessionToday.band,
      sessionToday.band === 'ok' ? 'Within the comparison range.' : 'Slower than the comparison.', pvtRule, 'team-starting-point', null)
    : st('alertness', 'none', 'No check run today.', pvtRule, 'team-starting-point', null);

  // ---- Blood pressure: recorded, no in-flight rule ----
  const bp = latest(readings, 'bloodPressure');
  S.bloodPressure = !bp
    ? st('bloodPressure', 'none', 'No reading yet.', 'This prototype does not interpret blood pressure. Readings are kept for your trend.', 'team-starting-point', null)
    : st('bloodPressure', 'info', fresh(bp) ? 'Logged. This prototype does not interpret blood pressure.' : 'Not a current reading.', 'This prototype does not interpret blood pressure. Readings are kept for your trend.', 'team-starting-point', bp);

  // ---- Blood sugar: fasting lab range, only for a fresh fasting reading ----
  const gluRule = `Fasting reading outside ${GLUCOSE_FASTING_RANGE.low}-${GLUCOSE_FASTING_RANGE.high} mg/dL asks for one re-check before anything else.`;
  const glu = latest(readings, 'bloodSugar');
  const outOfRange = (r: Reading) => r.value < GLUCOSE_FASTING_RANGE.low || r.value > GLUCOSE_FASTING_RANGE.high;
  const notFasting = (r: Reading) => r.quality?.usable === false;
  let gluIssue: 'recheck' | 'confirmed' | null = null;
  if (!glu) S.bloodSugar = st('bloodSugar', 'none', 'No reading yet.', gluRule, 'clinical-reference', null);
  else if (!fresh(glu)) S.bloodSugar = st('bloodSugar', 'info', outOfRange(glu) ? 'Outside the fasting range when measured. Not a current reading.' : 'Inside the fasting range when measured. Not a current reading.', gluRule, 'clinical-reference', glu);
  else if (notFasting(glu)) S.bloodSugar = st('bloodSugar', 'info', 'Not a fasting reading. The fasting range does not apply.', gluRule, 'clinical-reference', glu);
  else if (!outOfRange(glu)) S.bloodSugar = st('bloodSugar', 'ok', 'Inside the fasting lab range.', gluRule, 'clinical-reference', glu);
  else {
    const todays = series(readings, 'bloodSugar').filter((r) => fresh(r) && !notFasting(r));
    const prev = todays.length >= 2 ? todays[todays.length - 2] : null;
    gluIssue = prev && outOfRange(prev) ? 'confirmed' : 'recheck';
    S.bloodSugar = st('bloodSugar', 'watch', gluIssue === 'confirmed' ? 'Outside the fasting range on two readings.' : 'Outside the fasting range. One re-check asked.', gluRule, 'clinical-reference', glu);
  }

  // ---- Temperature: fresh reading at or above 38.0 C ----
  const tempRule = `Demo Watch: entered temperature at or above ${FEVER_C.toFixed(1)} °C.`;
  const temp = latest(readings, 'temperature');
  const fever = fresh(temp) && temp.value >= FEVER_C;
  S.temperature = !temp
    ? st('temperature', 'none', 'Not measured. Asked when you report a symptom.', tempRule, 'team-starting-point', null)
    : !fresh(temp) ? st('temperature', 'info', 'Not a current reading.', tempRule, 'team-starting-point', temp)
      : st('temperature', fever ? 'watch' : 'ok', fever ? `At or above this demo’s ${FEVER_C.toFixed(1)} °C threshold.` : `Below ${FEVER_C.toFixed(1)} °C.`, tempRule, 'team-starting-point', temp);

  // ---- Triggers for an alertness check ----
  const triggers: string[] = [];
  let triggerAt = -Infinity;
  if (S.sleep.status === 'watch' && today(sleep)) {
    triggers.push(sleep.value < SHORT_SLEEP_ALONE_MIN ? `You slept ${duration(sleep.value)}, under 5 h.` : `You slept ${duration(sleep.value)}, under 6 h.`);
    triggerAt = Math.max(triggerAt, sleep.at);
  }
  if (lowHrv && today(hrv)) { triggers.push(`Overnight HRV was ${S.hrv.summary.replace(/\.$/, '').toLowerCase()}.`); triggerAt = Math.max(triggerAt, hrv.at); }
  if (kssHigh && today(kss)) { triggers.push(`You rated sleepiness ${kss.value} of 9.`); triggerAt = Math.max(triggerAt, kss.at); }

  // ---- Open issues, highest priority first ----
  const issues: Issue[] = [];
  if (sessionToday && sessionToday.band !== 'ok') {
    const acted = actions.some((a) => a.issue === 'alertness-result' && a.at >= sessionToday.at);
    const slower = `${sessionToday.z.toFixed(1)} SD slower than the ${sessionToday.comparedWith === 'nasa-reference' ? 'NASA ISS pre-flight reference' : 'your own baseline'}`;
    issues.push(acted
      ? { id: 'alertness-followup', level: sessionToday.band, title: 'Alertness re-check', why: `The ${clock(sessionToday.at)} check was ${slower}.`, state: 'Concern still open. A recorded action does not clear it. Only a re-check does.', evidence: ['alertness', 'sleepiness', 'sleep'] }
      : { id: 'alertness-result', level: sessionToday.band, title: `Slower than reference on the ${clock(sessionToday.at)} check`, why: `${slower.charAt(0).toUpperCase() + slower.slice(1)}, with ${sessionToday.lapses} lapse${sessionToday.lapses === 1 ? '' : 's'}.`, state: 'Concern open. No action recorded yet.', evidence: ['alertness', 'sleepiness', 'sleep'] });
  } else if (triggers.length && (!sessionToday || sessionToday.at < triggerAt)) {
    issues.push({ id: 'alertness-check', level: 'watch', title: 'Alertness check recommended', why: triggers.join(' '), state: 'Current alertness: not assessed.', evidence: ['sleepiness', 'sleep', 'hrv'] });
  }
  if (fever && fresh(temp)) {
    issues.push({ id: 'temperature', level: 'watch', title: `Temperature ${temp.value.toFixed(1)} °C`, why: `At or above this demo’s ${FEVER_C.toFixed(1)} °C threshold.`, state: 'One reading. Not a diagnosis. Re-check in 30 min and flag the crew medical officer if it holds.', evidence: ['temperature'] });
  }
  if (gluIssue && glu) {
    issues.push({ id: 'blood-sugar', level: 'watch', title: gluIssue === 'confirmed' ? 'Blood sugar outside range twice' : 'Re-check blood sugar once', why: `${glu.value} mg/dL is outside the fasting lab range of ${GLUCOSE_FASTING_RANGE.low}-${GLUCOSE_FASTING_RANGE.high} mg/dL.`, state: gluIssue === 'confirmed' ? 'Two readings agree. Flag the crew medical officer.' : 'Single readings swing widely. One re-check comes before any alert.', evidence: ['bloodSugar'] });
  }
  if (hrFlag && !(bp && fresh(bp))) {
    issues.push({ id: 'heart-rate', level: 'watch', title: 'Log blood pressure and blood sugar', why: 'Sleeping heart rate was outside your usual range.', state: 'One night. Not a diagnosis. A cuff reading adds context.', evidence: ['heartRate', 'bloodPressure'] });
  }
  if (!today(mood) || mood.provenance !== 'self-reported') {
    issues.push({ id: 'checkin', level: 'due', title: 'Daily check-in', why: 'A few taps, under 1 minute. Today’s summary needs your sleepiness and mood.', state: 'Today’s self-report: not entered yet.', evidence: ['sleep', 'hrv', 'heartRate'] });
  }
  if (!bp || now - bp.at >= WEEKLY) {
    issues.push({ id: 'bp-due', level: 'due', title: 'Weekly blood pressure and blood sugar', why: bp ? 'The last entry is 7 or more days old.' : 'No entry exists yet.', state: 'Routine entry. About 30 seconds.', evidence: ['bloodPressure', 'bloodSugar'] });
  }
  const rank = { act: 0, watch: 1, due: 2 } as const;
  issues.sort((a, b) => rank[a.level] - rank[b.level]);

  return { statuses: S, issues, triggers, sessionToday };
}
