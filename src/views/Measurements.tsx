import { useState } from 'react';
import { INFO, SOURCES } from '../domain/content';
import { FEVER_C, GLUCOSE_FASTING_RANGE, INDICATORS, series } from '../domain/rules';
import { age, clock, missionDay, stamp } from '../domain/time';
import type { Baseline, IndicatorId, Reading, RuleBasis } from '../domain/types';
import { useApp } from '../state/store';
import { Btn, Chip, Icon, NightChart, Prov, TrendChart, Value, plain, type TrendPoint } from '../ui/primitives';
import { Cell, Mark, explain } from './Today';
import { Foot, useNav } from '../ui/shared';

const BASIS: Record<RuleBasis, string> = {
  published: 'Published threshold',
  'team-starting-point': 'Demo rule · not validated',
  'clinical-reference': 'Earth clinical reference',
};

export function Measurements() {
  const app = useApp();
  const { ev, now } = app;
  const current = (id: IndicatorId) => id === 'alertness' ? !!ev.sessionToday : !!ev.statuses[id].latest && missionDay(ev.statuses[id].latest!.at) === missionDay(now);
  const flagged = INDICATORS.filter((id) => ev.statuses[id].status === 'watch' || ev.statuses[id].status === 'act');
  const today = INDICATORS.filter((id) => !flagged.includes(id) && current(id));
  const rest = INDICATORS.filter((id) => !flagged.includes(id) && !current(id));
  const group = (title: string, note: string, ids: IndicatorId[], past?: boolean) => ids.length > 0 && (
    <section className="mgroup" aria-label={title}>
      <h2 className="mgroup-h">{title} <span className="sm muted">· {note}</span></h2>
      <div className={`grid3${past ? " compact" : ""}`}>{ids.map((id) => <Cell key={id} id={id} showLast={past} />)}</div>
    </section>
  );
  return (
    <>
      <section className="panel pagehead">
        <h1 tabIndex={-1}>Measurements</h1>
        <p className="sm muted">Tap a reading for its trend, its rule and its sources.</p>
      </section>
      {group('Flagged by demo rule', `${flagged.length} reading${flagged.length === 1 ? '' : 's'}`, flagged)}
      {group('Today’s readings', 'no rule triggered', today)}
      {group('Not current or not recorded', 'not used for today', rest, true)}
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

function Trend({ id, list, baseline }: { id: IndicatorId; list: Reading[]; baseline: Baseline | null }) {
  const { now } = useApp();
  const today = missionDay(now);
  const pts = points(list);
  const recent = pts.filter((p) => p.day > today - 8);
  const syn = recent.filter((p) => p.prov === 'synthetic').length;
  const tail = `${recent.length} reading${recent.length === 1 ? '' : 's'} in the last 8 days${syn ? `, ${syn} synthetic` : ''}.`;
  const common = { points: pts, today };
  switch (id) {
    case 'sleep':
      return <TrendChart {...common} kind="bar" scale={[0, 480]} fmt={(v) => `${Math.round(v / 60)} h`} refLine={{ v: 384, label: 'study crew average 6.4 h · not a target' }} summary={`Sleep per night on a 0 to 8 h scale. ${tail}`} />;
    case 'hrv':
    case 'heartRate':
      return <TrendChart {...common} kind="line" baseline={baseline} bandLabel={baseline?.synthetic ? 'Demo baseline · synthetic nights' : 'Your 7-night range'} summary={`${INFO[id].name} per night${baseline ? `, against ${baseline.synthetic ? 'a demo baseline built from synthetic nights' : 'your 7-night range'} of ${Math.round(baseline.low)} to ${Math.round(baseline.high)} ${INFO[id].unit}` : ''}. ${tail}`} />;
    case 'mood':
      return <TrendChart {...common} kind="dots" scale={[1, 5]} summary={`Mood per day, 1 to 5. ${tail}`} />;
    case 'sleepiness':
      return <TrendChart {...common} kind="dots" scale={[1, 9]} refLine={{ v: 7, label: 'check recommended at 7' }} summary={`Sleepiness per day, 1 to 9. ${tail}`} />;
    case 'bloodPressure':
      return <TrendChart {...common} kind="range" summary={`Systolic (circle) and diastolic (diamond) pressure. ${tail}`} />;
    case 'bloodSugar':
      return <TrendChart {...common} kind="dots" baseline={{ mean: 82, sd: 17, n: 0, synthetic: false, low: GLUCOSE_FASTING_RANGE.low, high: GLUCOSE_FASTING_RANGE.high }} bandLabel="Fasting lab range 65–99 mg/dL" summary={`Blood sugar readings against the fasting lab range. ${tail}`} />;
    case 'temperature':
      return <TrendChart {...common} kind="dots" scale={[35, 40]} fmt={(v) => v.toFixed(1)} refLine={{ v: FEVER_C, label: '38.0 °C' }} summary={`Temperature readings. ${tail}`} />;
    default:
      return null;
  }
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
  const noRule = s.rule.startsWith('This prototype') || s.rule.startsWith('No rule');
  const action =
    id === 'bloodPressure' || id === 'bloodSugar' ? <Btn variant="primary" onClick={() => go({ view: 'entry', kind: 'bp' })}>Log blood pressure and blood sugar</Btn>
      : id === 'temperature' ? <Btn variant="primary" onClick={() => go({ view: 'entry', kind: 'temp' })}>Log temperature</Btn>
        : id === 'alertness' ? <Btn variant="primary" onClick={() => go({ view: 'check' })}>Run alertness check</Btn>
          : (id === 'mood' || id === 'sleepiness') && !(r && r.provenance === 'self-reported' && current) ? <Btn variant="primary" onClick={() => go({ view: 'checkin' })}>Start check-in</Btn>
            : null;
  return (
    <>
      <div className="today">
        <div className="main-col">
          <section className={`decision detail ${judged ? s.status : ''}`} aria-labelledby="det-h">
            {judged ? <Mark kind={s.status as 'watch' | 'act'} scope={info.name} large /> : <p className="mark lg task"><b>{info.name}</b></p>}
            <h1 id="det-h" tabIndex={-1} className="value-h">
              {sess ? <>{Math.abs(sess.z).toFixed(1)} <small>SD {sess.z >= 0 ? 'slower than reference' : 'faster than reference'}</small></>
                : r && current ? <Value r={r} className="bigval" />
                  : r ? <span className="na">{id === 'sleep' || id === 'hrv' || id === 'heartRate' ? 'No overnight recording' : 'No current reading'}</span>
                    : <span className="na">No reading yet</span>}
            </h1>
            {(current || !r) && <p className="reason">{s.summary}</p>}
            {r && (
              <p className="limit">
                {current ? (r.window ? `${clock(r.window.from)}–${clock(r.window.to)}` : `Entered ${clock(r.at)}`) : `Last available: ${plain(r)} · ${stamp(r.at)}`} · {age(r.at, now)} · <Prov p={r.provenance} />
                {r.quality && !r.quality.usable ? <> · <b>{r.quality.note}</b></> : null}
              </p>
            )}
            {r && current && s.baseline && <p className="sm muted">{s.baseline.synthetic ? 'Demo range' : 'Your range'}: {Math.round(s.baseline.low)}–{Math.round(s.baseline.high)} {r.unit}{r.indicator === 'hrv' || r.indicator === 'heartRate' ? ` · ${explain(id, app).split('\n')[0]}` : ''}</p>}
            {r && current && !s.baseline && s.baselineNeeded !== undefined && <p className="sm muted">Demo baseline: {7 - s.baselineNeeded} of 7 nights · no comparison yet</p>}
            {judged && <p className="limit">{s.basis === 'clinical-reference' ? 'Earth clinical reference · applied as a demo rule' : 'Demo rule · not clinically validated'}</p>}
            {action && <div className="row actions">{action}</div>}
          </section>

          {id !== 'alertness' && (
            <section className="panel stack-sm">
              <h2>Last 8 mission days</h2>
              {pts.filter((p) => p.day > missionDay(now) - 8).length >= 3
                ? <div className="chartbox"><Trend id={id} list={list} baseline={s.baseline} /></div>
                : (
                  <>
                    <p className="sm muted">Fewer than 3 readings, so no trend is drawn.</p>
                    <ul className="rows records">{[...list].reverse().slice(0, 4).map((x) => (
                      <li key={x.id}><span className="num">{stamp(x.at)}</span><b className="num">{plain(x)}</b><Prov p={x.provenance} /></li>
                    ))}</ul>
                  </>
                )}
            </section>
          )}
          {id === 'alertness' && (
            <section className="panel stack-sm">
              <h2>Sessions</h2>
              {sessions.length ? (
                <table>
                  <thead><tr><th>When</th><th>Result</th><th>Lapses</th><th>Band</th><th>Source</th></tr></thead>
                  <tbody>{[...sessions].reverse().map((x) => (
                    <tr key={x.id}>
                      <td className="num"><button className="btn quiet small" onClick={() => go({ view: 'result', id: x.id })}>{stamp(x.at)}</button></td>
                      {x.valid ? <><td className="num">{Math.abs(x.z).toFixed(1)} SD {x.z >= 0 ? 'slower' : 'faster'}</td><td className="num">{x.lapses}</td><td><Chip kind={x.band} /></td></> : <td colSpan={3}>Not scored. {x.invalidReason}</td>}
                      <td><Prov p={x.provenance} /></td>
                    </tr>
                  ))}</tbody>
                </table>
              ) : <p className="sm muted">No session yet. A trend needs 3 or more comparable sessions.</p>}
            </section>
          )}

          <section className="panel tight disclosures onerow">
            <details>
              <summary><h2>Background, sources and readings</h2></summary>
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
                    <h3 className="sub-h">All readings · {list.length} record{list.length === 1 ? '' : 's'}</h3>
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
            <h2>Rule</h2>
            <p className="sm">{s.rule}</p>
            <p className={`basis ${noRule ? '' : s.basis}`}>{noRule ? 'No rule applied' : BASIS[s.basis]}</p>
          </section>
          <section className="panel stack-sm">
            <h2>Limits</h2>
            <p className="sm">{info.limit}</p>
            {s.baseline?.synthetic && <p className="sm"><b>Demo baseline.</b> Built from {s.baseline.n} synthetic nights, not from your own recordings.</p>}
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
