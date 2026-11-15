// App state: persisted locally, no network. Readings from the scenario and readings
// entered here are merged, then handed to the rules. Components never compute a status.

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { evaluate, type Evaluation } from '../domain/rules';
import { buildScenario, type Scenario } from '../domain/scenario';
import { clock, missionDay } from '../domain/time';
import type { ActionRecord, IssueId, LogEntry, MissionMin, PvtSession, Reading, RegionId, Symptom } from '../domain/types';

const KEY = 'pulsaris.v1';

export interface Draft { mood: number | null; kss: number | null; sleep: 'yes' | 'no' | null }
export interface SymptomDraft { region: RegionId | null; list: string[]; temp: string }

interface Persisted {
  scenarioId: string;
  /** Mission clock = anchorMission + real minutes elapsed since anchorReal. */
  anchorReal: number;
  anchorMission: MissionMin;
  link: boolean;
  shortTest: boolean;
  userReadings: Reading[];
  disputed: string[];
  confirmed: string[];
  draft: Draft;
  symptomDraft: SymptomDraft;
  sessions: PvtSession[];
  actions: ActionRecord[];
  deferUntil: MissionMin | null;
  recheckAt: MissionMin | null;
  symptoms: Symptom[];
  flag: { queuedAt: MissionMin; deliveredAt: MissionMin | null } | null;
  log: LogEntry[];
}

function fresh(scenarioId: string): Persisted {
  const sc = buildScenario(scenarioId);
  return {
    scenarioId: sc.def.id, anchorReal: Date.now(), anchorMission: sc.startAt, link: false, shortTest: false,
    userReadings: [], disputed: [], confirmed: [], draft: { mood: null, kss: null, sleep: null },
    symptomDraft: { region: null, list: [], temp: '' }, sessions: [], actions: [], deferUntil: null, recheckAt: null,
    symptoms: [], flag: null, log: [],
  };
}

function load(): Persisted {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const p = JSON.parse(raw) as Persisted;
      if (p && typeof p.scenarioId === 'string' && Array.isArray(p.userReadings)) return { ...fresh(p.scenarioId), ...p };
    }
  } catch { /* storage blocked or corrupt: start clean, the app still works */ }
  return fresh('ordinary');
}

export interface App extends Persisted {
  scenario: Scenario;
  now: MissionMin;
  readings: Reading[];
  ev: Evaluation;
  storageOk: boolean;
  setDraft: (d: Draft) => void;
  setSymptomDraft: (d: SymptomDraft) => void;
  saveCheckin: () => void;
  addReadings: (list: Omit<Reading, 'id' | 'at' | 'provenance' | 'source'>[], what: string) => void;
  addSession: (s: Omit<PvtSession, 'id' | 'at'>) => string;
  recordAction: (issue: IssueId, text: string) => void;
  setDefer: (minutes: number | null) => void;
  setRecheck: (minutes: number | null) => void;
  saveSymptom: (tempC?: number) => void;
  sendFlag: () => void;
  jump: (minutes: number) => void;
  toggleLink: () => void;
  setShortTest: (v: boolean) => void;
  setScenario: (id: string) => void;
  resetAll: () => void;
  exportJson: () => string;
}

const Ctx = createContext<App | null>(null);
export const useApp = (): App => {
  const v = useContext(Ctx);
  if (!v) throw new Error('useApp outside provider');
  return v;
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [p, setP] = useState<Persisted>(load);
  const [tick, setTick] = useState(0);
  const [storageOk, setStorageOk] = useState(true);

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(p)); setStorageOk(true); } catch { setStorageOk(false); }
  }, [p]);
  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 10000);
    return () => window.clearInterval(id);
  }, []);

  const scenario = useMemo(() => buildScenario(p.scenarioId), [p.scenarioId]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const now = useMemo(() => p.anchorMission + (Date.now() - p.anchorReal) / 60000, [p.anchorMission, p.anchorReal, tick, p]);
  const readings = useMemo(() => [...scenario.readings, ...p.userReadings], [scenario, p.userReadings]);
  const ev = useMemo(
    () => evaluate({ now, readings, sessions: p.sessions, disputed: p.disputed, actions: p.actions }),
    [now, readings, p.sessions, p.disputed, p.actions],
  );

  const nowOf = (s: Persisted) => s.anchorMission + (Date.now() - s.anchorReal) / 60000;
  const withLog = (s: Persisted, text: string): LogEntry[] => [{ at: nowOf(s), text }, ...s.log];
  const uid = () => Math.random().toString(36).slice(2, 10);

  const api = useMemo(() => ({
    setDraft: (draft: Draft) => setP((s) => ({ ...s, draft })),
    setSymptomDraft: (symptomDraft: SymptomDraft) => setP((s) => ({ ...s, symptomDraft })),
    saveCheckin: () => setP((s) => {
      const { mood, kss, sleep } = s.draft;
      if (mood === null || kss === null) return s;
      const at = nowOf(s);
      const sc = buildScenario(s.scenarioId);
      const night = sc.readings.find((r) => r.indicator === 'sleep' && missionDay(r.at) === missionDay(at));
      const mk = (indicator: 'mood' | 'sleepiness', value: number, unit: string): Reading => ({ id: uid(), indicator, value, unit, at, provenance: 'self-reported', source: 'Daily check-in' });
      return {
        ...s,
        userReadings: [...s.userReadings, mk('mood', mood, 'of 5'), mk('sleepiness', kss, 'of 9')],
        disputed: night && sleep === 'no' ? [...s.disputed.filter((d) => d !== night.id), night.id] : s.disputed.filter((d) => d !== night?.id),
        confirmed: night && sleep === 'yes' ? [...s.confirmed, night.id] : s.confirmed,
        draft: { mood: null, kss: null, sleep: null },
        log: withLog(s, `Check-in saved: mood ${mood} of 5, sleepiness ${kss} of 9${night ? `, sleep recording ${sleep === 'no' ? 'marked wrong' : 'confirmed'}` : ''}.`),
      };
    }),
    addReadings: (list: Omit<Reading, 'id' | 'at' | 'provenance' | 'source'>[], what: string) => setP((s) => {
      const at = nowOf(s);
      return { ...s, userReadings: [...s.userReadings, ...list.map((r) => ({ ...r, id: uid(), at, provenance: 'self-reported' as const, source: 'Typed in' }))], log: withLog(s, what) };
    }),
    addSession: (sess: Omit<PvtSession, 'id' | 'at'>) => {
      const id = uid();
      setP((s) => {
        const at = nowOf(s);
        const full: PvtSession = { ...sess, id, at };
        const text = full.valid
          ? `Alertness check completed: ${full.z.toFixed(1)} SD vs ${full.comparedWith === 'nasa-reference' ? 'reference' : 'own baseline'}, ${full.lapses} lapse${full.lapses === 1 ? '' : 's'}, ${full.falseStarts} false start${full.falseStarts === 1 ? '' : 's'}. Band: ${full.band === 'ok' ? 'OK' : full.band === 'watch' ? 'Watch' : 'Act'}.${full.protocol === 'demo-short' ? ' Demo length, 45 s.' : ''}`
          : `Alertness check not scored: ${full.invalidReason}`;
        return { ...s, sessions: [...s.sessions, full], deferUntil: null, recheckAt: full.valid ? null : s.recheckAt, log: withLog(s, text) };
      });
      return id;
    },
    recordAction: (issue: IssueId, text: string) => setP((s) => ({ ...s, actions: [...s.actions, { at: nowOf(s), text, issue }], log: withLog(s, `Action recorded: ${text} Concern still open.`) })),
    setDefer: (minutes: number | null) => setP((s) => minutes === null ? { ...s, deferUntil: null }
      : { ...s, deferUntil: nowOf(s) + minutes, log: withLog(s, `Alertness check deferred to ${clock(nowOf(s) + minutes)}. Still not assessed.`) }),
    setRecheck: (minutes: number | null) => setP((s) => minutes === null ? { ...s, recheckAt: null }
      : { ...s, recheckAt: nowOf(s) + minutes, log: withLog(s, `Re-check scheduled for ${clock(nowOf(s) + minutes)}.`) }),
    saveSymptom: (tempC?: number) => setP((s) => {
      const d = s.symptomDraft;
      if (!d.region || !d.list.length) return s;
      const at = nowOf(s);
      const temp: Reading[] = tempC === undefined ? [] : [{ id: uid(), indicator: 'temperature', value: tempC, unit: '°C', at, provenance: 'self-reported', source: 'Typed in with a symptom report' }];
      return {
        ...s,
        symptoms: [...s.symptoms, { id: uid(), at, region: d.region, list: d.list, tempC }],
        userReadings: [...s.userReadings, ...temp],
        symptomDraft: { region: null, list: [], temp: '' },
        log: withLog(s, `Symptom reported: ${d.list.join(', ')}${tempC === undefined ? '' : `, ${tempC.toFixed(1)} °C`}. Not shared.`),
      };
    }),
    sendFlag: () => setP((s) => {
      const at = nowOf(s);
      return { ...s, flag: { queuedAt: at, deliveredAt: null }, log: withLog(s, 'Flag for crew medical officer saved on this tablet. No notification sent (prototype).') };
    }),
    jump: (minutes: number) => setP((s) => ({ ...s, anchorMission: s.anchorMission + minutes })),
    toggleLink: () => setP((s) => {
      const link = !s.link;
      return { ...s, link };
    }),
    setShortTest: (shortTest: boolean) => setP((s) => ({ ...s, shortTest })),
    setScenario: (id: string) => setP(() => fresh(id)),
    resetAll: () => setP((s) => fresh(s.scenarioId)),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), []);

  const exportJson = useCallback(() => JSON.stringify({
    exportedAt: new Date().toISOString(),
    note: 'Pulsaris prototype export. Scenario readings are recorded (MMASH) or synthetic; see provenance on each reading.',
    scenario: scenario.def, readings, sessions: p.sessions, symptoms: p.symptoms, actions: p.actions, log: p.log,
  }, null, 2), [scenario, readings, p.sessions, p.symptoms, p.actions, p.log]);

  const value: App = { ...p, ...api, scenario, now, readings, ev, storageOk, exportJson };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
