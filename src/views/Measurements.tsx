import { useState, type ReactNode } from 'react';
import { INFO, KSS, MOOD, SOURCES } from '../domain/content';
import { INDICATORS, series } from '../domain/rules';
import { age, clock, missionDay, stamp } from '../domain/time';
import type { Baseline, IndicatorId, Reading } from '../domain/types';
import { useApp } from '../state/store';
import { Btn, Icon, NightChart, Prov, TrendChart, Value, plain, provLabel, type TrendPoint } from '../ui/primitives';
import { Mark } from './Today';
import { Foot, useNav } from '../ui/shared';

/* ---------- Measurements: one stable 3 × 3 inventory ---------- */

const ORDER: IndicatorId[] = ['sleep', 'hrv', 'heartRate', 'sleepiness', 'mood', 'alertness', 'bloodPressure', 'bloodSugar', 'temperature'];

function GridCell({ id }: { id: IndicatorId }) {
  const app = useApp();
  const { ev, now } = app;
  const { go } = useNav();
  const s = ev.statuses[id];
  const flagged = s.status === 'watch' || s.status === 'act';
  const r = s.latest;
  const current = !!r && missionDay(r.at) === missionDay(now);
  const sess = id === 'alertness' ? ev.sessionToday : null;
  let value: ReactNode = null, line = '', meta = '';
  if (sess) {
    value = <span className="big">{sess.z >= 0 ? '+' : '−'}{Math.abs(sess.z).toFixed(1)} <small>SD</small></span>;
    line = sess.band === 'ok' ? 'Within reference band' : 'Slower than the study reference';
    meta = `${clock(sess.at)} · ${sess.provenance === 'synthetic' ? 'Simulated test result' : 'Measured on this tablet'}`;
  } else if (r && current) {
    value = <Value r={r} className="big" />;
    const b = s.baseline;
    if (b) line = `${r.value < b.low ? 'Below' : r.value > b.high ? 'Above' : 'Within'} ${b.synthetic ? 'demo' : 'your'} range: ${Math.round(b.low)}–${Math.round(b.high)} ${r.unit}`;
    else if (s.baselineNeeded !== undefined) line = `Demo baseline: ${7 - s.baselineNeeded} of 7 nights`;
    else if (id === 'sleepiness') line = KSS[r.value];
    else if (id === 'mood') line = MOOD[r.value];
    else line = s.summary;
    meta = `${r.window ? `${clock(r.window.from)}–${clock(r.window.to)}` : clock(r.at)} · ${provLabel(r.provenance)}`;
  } else if (r) {
    value = <span className="na">Last reading</span>;
    line = `${plain(r)} · ${age(r.at, now)}`;
    meta = provLabel(r.provenance);
  } else {
    value = <span className="na">{id === 'alertness' ? 'Not tested today' : 'No reading recorded'}</span>;
  }
  return (
    <button type="button" className="gcell" onClick={() => go({ view: 'indicator', id })}>
      <span className="cell-head"><span className="label">{INFO[id].name}</span>{flagged && <span className={`contrib ${s.status}`}>Flagged by demo rule</span>}</span>
      {value}
      {line && <span className="sm">{line}</span>}
      {meta && <span className="gmeta">{meta}</span>}
    </button>
  );
}

export function Measurements() {
  const { ev, now } = useApp();
  const flagged = ORDER.filter((id) => ev.statuses[id].status === 'watch' || ev.statuses[id].status === 'act').length;
  const current = ORDER.filter((id) => id === 'alertness' ? !!ev.sessionToday : !!ev.statuses[id].latest && missionDay(ev.statuses[id].latest!.at) === missionDay(now)).length;
  return (
    <>
      <section className="mhead">
        <h1 tabIndex={-1}>Measurements</h1>
        <p className="sm muted">{flagged} flagged by demo rules · {current} current reading{current === 1 ? '' : 's'}</p>
      </section>
      <div className="inventory">{ORDER.map((id) => <GridCell key={id} id={id} />)}</div>
      <Foot />
    </>
  );
}

function points(list: Reading[]): TrendPoint[] {
  // One point per mission day: the last reading of that day.
  const byDay = new Map<number, Reading>();
  list.forEach((r) => byDay.set(missionDay(r.at), r));
  return [...byDay.entries()].map(([day, r]) => ({ day, v: r.value, v2: r.value2, prov: r.provenance }));
}

/** Chart-specific legends: only the marks that chart actually shows. */
function Trend({ id, list, baseline }: { id: IndicatorId; list: Reading[]; baseline: Baseline | null }) {
  const { now } = useApp();
  const today = missionDay(now);
  const pts = points(list);
  const latestProv = pts.length ? pts[pts.length - 1].prov : 'synthetic';
  const real = latestProv === 'recorded' ? 'Earth dataset · MMASH' : latestProv === 'self-reported' ? 'Entered by you' : 'Measured on this tablet';
  const common = { points: pts, today, height: 134, compact: true };
  switch (id) {
    case 'sleep':
      return <TrendChart {...common} kind="bar" scale={[0, 480]} fmt={(v) => `${Math.round(v / 60)} h`} refLine={{ v: 384, label: '' }}
        legend={[{ mark: 'bar-syn', label: 'Synthetic history' }, { mark: 'bar-real', label: real }, { mark: 'line', label: 'Study crew average: 6.4 h · descriptive, not a target' }]}
        summary="Sleep per night on a 0 to 8 h scale." />;
    case 'hrv':
    case 'heartRate':
      return <TrendChart {...common} kind="line" baseline={baseline}
        legend={[{ mark: 'syn', label: 'Synthetic history' }, { mark: 'real', label: real }, ...(baseline ? [{ mark: 'band' as const, label: `${baseline.synthetic ? 'Synthetic baseline' : 'Your range'}: ${Math.round(baseline.low)}–${Math.round(baseline.high)} ${INFO[id].unit}` }] : [])]}
        summary={`${INFO[id].name} per night.`} />;
    case 'mood':
      return <TrendChart {...common} kind="dots" scale={[1, 5]} legend={[{ mark: 'syn', label: 'Synthetic history' }, { mark: 'real', label: 'Entered by you' }]} summary="Mood per day, 1 to 5." />;
    case 'sleepiness':
      return <TrendChart {...common} kind="dots" scale={[1, 9]} refLine={{ v: 7, label: '' }}
        legend={[{ mark: 'syn', label: 'Synthetic history' }, { mark: 'real', label: 'Entered by you' }, { mark: 'line', label: 'Demo check threshold: 7' }]}
        summary="Sleepiness per day, 1 to 9." />;
    default:
      return null;
  }
}

/** Rule and limit wording for the rail; synthetic baselines say exactly what they are. */
function railCopy(id: IndicatorId, s: ReturnType<typeof useApp>['ev']['statuses'][IndicatorId]): { rule: string; basis: string; limit: string } {
  const info = INFO[id];
  if ((id === 'hrv' || id === 'heartRate') && (s.baseline?.synthetic || s.baselineNeeded !== undefined)) {
    return {
      rule: id === 'hrv'
        ? 'Demo Watch: nightly RMSSD more than 1 SD below the mean of seven synthetic baseline nights. No comparison until seven baseline nights are available.'
        : 'Demo Watch: sleeping heart rate more than 2 SD from the mean of seven synthetic baseline nights. No comparison until seven baseline nights are available.',
      basis: 'Demo rule · not clinically validated',
      limit: 'This comparison uses a synthetic demo baseline, not your personal recordings. The current value comes from an Earth recording in MMASH. It does not establish an in-flight health finding.',
    };
  }
  if (id === 'bloodPressure') return { rule: 'No interpretation rule is configured.', basis: '', limit: 'This prototype stores blood-pressure readings without assigning a normal or abnormal classification.' };
  if (id === 'temperature') return { rule: 'Demo Watch: entered temperature at or above 38.0 °C.', basis: 'Demo rule · not clinically validated', limit: 'Measurement method and context affect temperature interpretation. This prototype uses a demonstration threshold; one entry is not a diagnosis.' };
  if (id === 'mood') return { rule: 'No rule. Shown for your own trend.', basis: '', limit: info.limit };
  return { rule: s.rule, basis: s.basis === 'clinical-reference' ? 'Earth lab range · applied as a demo rule' : 'Demo rule · not clinically validated', limit: info.limit };
}

export function IndicatorDetail({ id }: { id: IndicatorId }) {
  const app = useApp();
  const { ev, readings, now, scenario, sessions } = app;
  const { go } = useNav();
  const info = INFO[id];
  const s = ev.statuses[id];
  const list = series(readings, id);
  const r = s.latest;
  const current = !!r && missionDay(r.at) === missionDay(now);
  const sess = id === 'alertness' ? ev.sessionToday : null;
  const judged = s.status === 'watch' || s.status === 'act';
  const isNight = r?.provenance === 'recorded' && scenario.nightSeries.length > 0 && (id === 'hrv' || id === 'heartRate');
  const pts = points(list);
  const rail = railCopy(id, s);
  const alertIssue = ev.issues.some((i) => i.id.startsWith('alertness'));
  const tempIssue = ev.issues.some((i) => i.id === 'temperature');
  const recent = pts.filter((p) => p.day > missionDay(now) - 8).length;

  let hero: ReactNode;
  if (id === 'alertness') {
    hero = sess ? (
      <>
        {sess.band === 'ok'
          ? <Mark kind="clear" word="Within reference band" scope={`Alertness check · ${sess.provenance === 'synthetic' ? 'Simulated result' : 'Measured on this tablet'}`} large />
          : <Mark kind={sess.band} scope={`Alertness check${sess.provenance === 'synthetic' ? ' · Simulated result' : ''}`} large />}
        <h1 id="det-h" tabIndex={-1} className="value-h">{sess.z >= 0 ? '+' : '−'}{Math.abs(sess.z).toFixed(1)} <small>SD</small></h1>
        <p className="reason">{sess.z >= 0 ? 'Slower' : 'Faster'} than the study reference{sess.band === 'ok' ? '; within the displayed ±1 SD band.' : '.'}</p>
        <p className="limit">Completed {clock(sess.at)} · {sess.provenance === 'synthetic' ? 'Simulated test result' : 'Measured on this tablet'}</p>
        <div className="row actions"><Btn variant="primary" onClick={() => go({ view: 'result', id: sess.id })}>View latest result</Btn><Btn variant="quiet" onClick={() => go({ view: 'check' })}>Start another check</Btn></div>
        <p className="limit">{sess.band === 'ok' ? 'Demo classification' : 'Demo rule'} · not clinically validated</p>
      </>
    ) : (
      <>
        <p className="mark lg task"><b>{info.name}</b></p>
        <h1 id="det-h" tabIndex={-1} className="value-h"><span className="na">Not tested today</span></h1>
        <div className="row actions"><Btn variant="primary" onClick={() => go({ view: 'check' })}>Start alertness check</Btn></div>
      </>
    );
  } else {
    hero = (
      <>
        {judged ? <Mark kind={s.status as 'watch' | 'act'} scope={info.name} large /> : <p className="mark lg task"><b>{info.name}</b></p>}
        <h1 id="det-h" tabIndex={-1} className="value-h">
          {r ? <Value r={r} className="bigval" /> : <span className="na">No reading recorded</span>}
        </h1>
        {r && current && (
          <p className="reason">{id === 'sleepiness' ? KSS[r.value] : id === 'mood' ? MOOD[r.value] : s.baseline
            ? `${r.value < s.baseline.low ? 'Below' : r.value > s.baseline.high ? 'Above' : 'Within'} ${s.baseline.synthetic ? 'demo' : 'your'} range: ${Math.round(s.baseline.low)}–${Math.round(s.baseline.high)} ${r.unit}${s.status === 'watch' ? ` · ${s.summary.replace(/\.$/, '')}` : ''}`
            : s.baselineNeeded !== undefined ? `Demo baseline: ${7 - s.baselineNeeded} of 7 nights · no comparison yet` : s.summary}</p>
        )}
        {r && <p className="limit">{current ? (r.window ? `${clock(r.window.from)}–${clock(r.window.to)}` : `Entered ${clock(r.at)}`) : `Last reading · ${stamp(r.at)} · ${age(r.at, now)}`} · <Prov p={r.provenance} />{r.quality && !r.quality.usable ? <> · <b>{r.quality.note}</b></> : null}</p>}
        {id === 'temperature' && tempIssue && r && <p className="followup"><b>Re-check scheduled for {clock(r.at + 30)}</b> · In {Math.max(1, Math.ceil(r.at + 30 - now))} min</p>}
        <div className="row actions">
          {judged && alertIssue && (id === 'sleep' || id === 'hrv' || id === 'sleepiness' || id === 'heartRate') && <Btn variant="primary" onClick={() => go({ view: 'today' })}>View alertness follow-up</Btn>}
          {id === 'temperature' && (tempIssue
            ? <><Btn variant="primary" onClick={() => go({ view: 'today' })}>View temperature follow-up</Btn><Btn variant="quiet" onClick={() => go({ view: 'entry', kind: 'temp' })}>Enter another reading</Btn></>
            : <Btn variant="primary" onClick={() => go({ view: 'entry', kind: 'temp' })}>Enter a reading</Btn>)}
          {(id === 'bloodPressure' || id === 'bloodSugar') && <Btn variant="primary" onClick={() => go({ view: 'entry', kind: 'bp' })}>Enter blood pressure and sugar</Btn>}
          {(id === 'mood' || id === 'sleepiness') && !(r && r.provenance === 'self-reported' && current) && <Btn variant="primary" onClick={() => go({ view: 'checkin' })}>Start check-in</Btn>}
        </div>
        {judged && <p className="limit">{rail.basis}</p>}
      </>
    );
  }

  return (
    <>
      <div className="today fixed">
        <div className="main-col">
          <section className={`decision detail ${judged ? s.status : id === 'alertness' && sess?.band === 'ok' ? 'clear' : ''}`} aria-labelledby="det-h">
            {hero}
          </section>
          <section className="pband" aria-labelledby="band-h">
            {id === 'alertness' ? (
              <>
                <h2 id="band-h" className="rail-h">Latest sessions</h2>
                {sessions.length ? (
                  <table className="compact">
                    <thead><tr><th>When</th><th>Result</th><th>Lapses</th><th>Band</th><th>Source</th></tr></thead>
                    <tbody>{[...sessions].reverse().slice(0, 3).map((x) => (
                      <tr key={x.id}>
                        <td className="num"><button className="btn quiet small" onClick={() => go({ view: 'result', id: x.id })}>{stamp(x.at)}</button></td>
                        {x.valid ? <><td className="num">{x.z >= 0 ? '+' : '−'}{Math.abs(x.z).toFixed(1)} SD</td><td className="num">{x.lapses}</td><td className={`bandtxt ${x.band}`}>{x.band === 'ok' ? 'Within band' : x.band === 'watch' ? 'Watch' : 'Act'}</td></> : <td colSpan={3}>Not scored</td>}
                        <td><Prov p={x.provenance} test /></td>
                      </tr>
                    ))}</tbody>
                  </table>
                ) : <p className="sm muted">No session recorded.</p>}
              </>
            ) : recent >= 3 && (id === 'sleep' || id === 'hrv' || id === 'heartRate' || id === 'sleepiness' || id === 'mood') ? (
              <>
                <h2 id="band-h" className="rail-h">Demo history · 8 days</h2>
                <Trend id={id} list={list} baseline={s.baseline} />
              </>
            ) : (
              <>
                <h2 id="band-h" className="rail-h">{list.length ? `${list.length} ${list.every((x) => x.provenance === 'synthetic') ? 'historical' : 'recorded'} entr${list.length === 1 ? 'y' : 'ies'}` : 'No entries'}</h2>
                {list.length > 0 && <ul className="rows records">{[...list].reverse().slice(0, 4).map((x) => (
                  <li key={x.id}><span className="num">{stamp(x.at)}</span><b className="num">{plain(x)}</b><Prov p={x.provenance} /></li>
                ))}</ul>}
              </>
            )}
          </section>
          <section className="panel tight disclosures onerow">
            <details>
              <summary><h2>Method, sources and records</h2></summary>
              <div className="body">
                <h3 className="sub-h">Why it matters in space</h3>
                <p>{info.why}</p>
                <h3 className="sub-h">How it is measured</h3>
                <p>{info.how}</p>
                {isNight && (
                  <>
                    <h3 className="sub-h">Across last night · Earth dataset, {scenario.nightSeries.length} five-minute windows</h3>
                    <NightChart series={scenario.nightSeries} pick={id === 'hrv' ? 'rmssd' : 'hr'} unit={id === 'hrv' ? 'ms' : 'bpm'}
                      summary={`${id === 'hrv' ? 'RMSSD' : 'Heart rate'} in ${scenario.nightSeries.length} five-minute windows through the night. ${id === 'hrv' ? 'The night value is the median window.' : 'The night value is the mean.'}`} />
                  </>
                )}
                <h3 className="sub-h">Sources</h3>
                <ul className="rows">
                  {info.sources.map((k) => (
                    <li key={k}>
                      <a href={SOURCES[k].url} target="_blank" rel="noopener noreferrer">{SOURCES[k].label}<span className="sr"> (opens in new tab)</span></a>
                      {SOURCES[k].nasa && <span className="prov" style={{ marginLeft: 8 }}>NASA</span>}
                      <p className="cap">{SOURCES[k].detail}</p>
                    </li>
                  ))}
                </ul>
                {list.length > 0 && (
                  <>
                    <h3 className="sub-h">All records · {list.length}</h3>
                    <table>
                      <thead><tr><th>When</th><th>Value</th><th>Origin</th><th>Note</th></tr></thead>
                      <tbody>{[...list].reverse().map((x) => (
                        <tr key={x.id}><td className="num">{stamp(x.at)}</td><td className="num">{plain(x)}</td><td><Prov p={x.provenance} /></td><td>{x.quality ? x.quality.note : x.source}</td></tr>
                      ))}</tbody>
                    </table>
                  </>
                )}
              </div>
            </details>
          </section>
        </div>
        <aside className="side">
          <section className="panel stack-sm">
            <h2 className="rail-h">Rule</h2>
            <p className="sm">{rail.rule}</p>
            {rail.basis && <p className="basis team-starting-point">{rail.basis}</p>}
          </section>
          <section className="panel stack-sm">
            <h2 className="rail-h">Limits</h2>
            <p className="sm">{rail.limit}</p>
          </section>
        </aside>
      </div>
      <Foot />
    </>
  );
}

/* ---------- Typed entries ---------- */

function Field({ id, label, unit, value, onChange }: { id: string; label: string; unit: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="field">
      <label htmlFor={id} className="label">{label}</label>
      <div className="in"><input id={id} inputMode="decimal" autoComplete="off" value={value} onChange={(e) => onChange(e.target.value)} aria-label={`${label} in ${unit}`} /><span>{unit}</span></div>
    </div>
  );
}
const num = (s: string): number | null => { const t = s.trim().replace(',', '.'); if (t === '') return null; const v = Number(t); return Number.isFinite(v) ? v : NaN; };

export function Entry({ kind }: { kind: 'bp' | 'temp' }) {
  const { addReadings } = useApp();
  const { go } = useNav();
  const [sys, setSys] = useState(''); const [dia, setDia] = useState(''); const [glu, setGlu] = useState(''); const [temp, setTemp] = useState('');
  const [fasting, setFasting] = useState<'yes' | 'no' | 'unsure' | null>(null);
  const [err, setErr] = useState('');

  const submit = () => {
    if (kind === 'temp') {
      const t = num(temp);
      if (t === null || Number.isNaN(t) || t < 30 || t > 45) { setErr('Enter a temperature between 30 and 45 °C.'); return; }
      addReadings([{ indicator: 'temperature', value: Math.round(t * 10) / 10, unit: '°C' }], `Temperature entered: ${t.toFixed(1)} °C.`);
      go({ view: 'today' });
      return;
    }
    const s = num(sys), d = num(dia), g = num(glu);
    const list: Parameters<typeof addReadings>[0] = [];
    const parts: string[] = [];
    if (s !== null || d !== null) {
      if (s === null || d === null || Number.isNaN(s) || Number.isNaN(d) || s < 60 || s > 250 || d < 30 || d > 150 || d >= s) { setErr('Enter both pressures. Systolic 60–250, diastolic 30–150, and systolic must be the higher one.'); return; }
      list.push({ indicator: 'bloodPressure', value: Math.round(s), value2: Math.round(d), unit: 'mmHg' });
      parts.push(`blood pressure ${Math.round(s)}/${Math.round(d)} mmHg`);
    }
    if (g !== null) {
      if (Number.isNaN(g) || g < 20 || g > 600) { setErr('Enter a blood sugar between 20 and 600 mg/dL.'); return; }
      if (fasting === null) { setErr('Answer whether this is a fasting reading. The lab range applies to fasting readings only.'); return; }
      list.push({ indicator: 'bloodSugar', value: Math.round(g), unit: 'mg/dL', quality: fasting === 'yes' ? { usable: true, note: 'Fasting reading' } : { usable: false, note: fasting === 'no' ? 'Not fasting' : 'Fasting not known' } });
      parts.push(`blood sugar ${Math.round(g)} mg/dL, ${fasting === 'yes' ? 'fasting' : fasting === 'no' ? 'not fasting' : 'fasting not known'}`);
    }
    if (!list.length) { setErr('Enter at least one reading.'); return; }
    addReadings(list, `Entered: ${parts.join(', ')}.`);
    go({ view: 'today' });
  };

  const bp = kind === 'bp';
  return (
    <form className="today form" onSubmit={(e) => { e.preventDefault(); submit(); }}>
      <div className="main-col">
        <section className="decision task formhead" aria-labelledby="en-h">
          <p className="mark lg task">{Icon.due}<b>{bp ? 'Weekly entry' : 'Entry'}</b><span className="scope">{bp ? 'about 30 seconds' : 'about 10 seconds'}</span></p>
          <h1 id="en-h" tabIndex={-1}>{bp ? 'Blood pressure and blood sugar' : 'Body temperature'}</h1>
        </section>
        {bp ? (
          <>
            <section className="panel q">
              <fieldset className="plainset">
                <legend>Blood pressure</legend>
                <p className="sm muted">Sit still for a minute before the cuff reading.</p>
                <div className="fields">
                  <Field id="sys" label="Systolic (upper)" unit="mmHg" value={sys} onChange={setSys} />
                  <Field id="dia" label="Diastolic (lower)" unit="mmHg" value={dia} onChange={setDia} />
                </div>
              </fieldset>
            </section>
            <section className="panel q">
              <fieldset className="plainset">
                <legend>Blood sugar</legend>
                <div className="fields"><Field id="glu" label="Finger-stick reading" unit="mg/dL" value={glu} onChange={setGlu} /></div>
              </fieldset>
              <fieldset className="choices words">
                <legend>Fasting? Nothing to eat for 8 hours</legend>
                {(['yes', 'no', 'unsure'] as const).map((v) => <label key={v}><input type="radio" name="fasting" checked={fasting === v} onChange={() => setFasting(v)} />{v === 'yes' ? 'Yes' : v === 'no' ? 'No' : 'Unsure'}</label>)}
              </fieldset>
            </section>
          </>
        ) : (
          <section className="panel q">
            <div className="fields"><Field id="temp" label="Temperature" unit="°C" value={temp} onChange={setTemp} /></div>
          </section>
        )}
      </div>
      <aside className="side">
        <section className="panel stack-sm sticky">
          <h2 className="rail-h">{bp ? 'Enter either reading, or both' : 'One reading'}</h2>
          <p className="err" role="alert">{err}</p>
          <Btn type="submit" variant="primary">Save reading</Btn>
          <Btn variant="quiet" onClick={() => go({ view: 'today' })}>Cancel</Btn>
          <p className="sm muted">{bp
            ? 'The 65–99 mg/dL fasting lab range is applied as a demo rule, to fasting readings only. This prototype does not interpret blood pressure.'
            : 'At or above this demo’s 38.0 °C threshold, you are asked to re-check after 30 minutes.'}</p>
          <p className="sm muted">Nothing you typed is discarded if a value is rejected.</p>
        </section>
      </aside>
      <div className="formfoot"><Foot /></div>
    </form>
  );
}

export { INDICATORS };
