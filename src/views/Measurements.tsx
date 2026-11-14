import { useState } from 'react';
import { INFO, SOURCES } from '../domain/content';
import { FEVER_C, GLUCOSE_FASTING_RANGE, INDICATORS, series } from '../domain/rules';
import { age, clock, missionDay, stamp } from '../domain/time';
import type { Baseline, IndicatorId, Reading, RuleBasis } from '../domain/types';
import { useApp } from '../state/store';
import { BaselineTrack, Btn, BuildingTrack, Chip, NightChart, Prov, SleepTrack, SpeedScale, TrendChart, plain, type TrendPoint } from '../ui/primitives';
import { REFERENCE } from '../domain/pvt';
import { Back, Foot, chipWord, useNav } from '../ui/shared';
import { Tiles } from './Today';

const BASIS: Record<RuleBasis, string> = {
  published: 'Published threshold',
  'team-starting-point': 'Team starting point, not validated',
  'clinical-reference': 'Earth clinical reference',
};

export function Measurements() {
  return (
    <>
      <section className="panel stack-sm">
        <h1 tabIndex={-1}>Measurements</h1>
        <p className="sm muted">Each record shows when it was measured and where it came from. Tap one for its trend, its rule and what it means in space.</p>
      </section>
      <Tiles />
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
      return <TrendChart {...common} kind="bar" scale={[0, 480]} fmt={(v) => `${Math.round(v / 60)} h`} refLine={{ v: 384, label: 'crew average 6.4 h' }} summary={`Sleep per night on a 0 to 8 h scale. ${tail}`} />;
    case 'hrv':
    case 'heartRate':
      return <TrendChart {...common} kind="line" baseline={baseline} summary={`${INFO[id].name} per night${baseline ? `, with your usual range of ${Math.round(baseline.low)} to ${Math.round(baseline.high)} ${INFO[id].unit}` : ''}. ${tail}`} />;
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
  const { ev, readings, now, scenario, sessions, disputed } = useApp();
  const { go } = useNav();
  const info = INFO[id];
  const s = ev.statuses[id];
  const list = series(readings, id);
  const r = s.latest;
  const sess = id === 'alertness' ? ev.sessionToday : null;
  const isNight = r?.provenance === 'recorded' && scenario.nightSeries.length > 0 && (id === 'hrv' || id === 'heartRate');
  return (
    <>
      <Back to={{ view: 'measurements' }} label="Measurements" />
      <div className="split">
        <section className={`panel primary ${s.status === 'watch' || s.status === 'act' || s.status === 'ok' ? s.status : ''} stack`}>
          <h3>{info.name}</h3>
          <div className="title-row">
            <Chip kind={s.status} word={chipWord(id, s)} large />
            <h1 tabIndex={-1}>{sess ? <span className="num">{sess.speed.toFixed(2)} speed</span> : r ? <span className="num">{plain(r)}</span> : 'No reading'}</h1>
          </div>
          <p>{s.summary}</p>
          {r && <p className="cap">{r.window ? `Recorded ${stamp(r.window.from)} to ${clock(r.window.to)}` : `Entered ${stamp(r.at)}`} · {age(r.at, now)} · <Prov p={r.provenance} /> · {r.source}</p>}
          {r?.quality && <p className="cap">Data quality: {r.quality.note}</p>}
          {r && id === 'sleep' && <SleepTrack minutes={r.value} off={disputed.includes(r.id)} />}
          {r && (id === 'hrv' || id === 'heartRate') && (s.baseline ? <BaselineTrack value={r.value} baseline={s.baseline} unit={r.unit} /> : s.baselineNeeded !== undefined ? <BuildingTrack have={7 - s.baselineNeeded} /> : null)}
          {sess && <SpeedScale speed={sess.speed} mean={REFERENCE.mean} sd={REFERENCE.sd} label="reference" />}
          {(id === 'bloodPressure' || id === 'bloodSugar') && <div className="row"><Btn variant="primary" onClick={() => go({ view: 'entry', kind: 'bp' })}>Log blood pressure and blood sugar</Btn></div>}
          {id === 'temperature' && <div className="row"><Btn variant="primary" onClick={() => go({ view: 'entry', kind: 'temp' })}>Log temperature</Btn></div>}
          {id === 'alertness' && <div className="row"><Btn variant="primary" onClick={() => go({ view: 'check' })}>Run alertness check</Btn></div>}
          {(id === 'mood' || id === 'sleepiness') && !(r && r.provenance === 'self-reported' && missionDay(r.at) === missionDay(now)) && <div className="row"><Btn variant="primary" onClick={() => go({ view: 'checkin' })}>Start check-in</Btn></div>}
        </section>
        <aside>
          <section className="panel stack-sm">
            <h2>Why it matters in space</h2>
            <p className="sm">{info.why}</p>
          </section>
          <section className="panel stack-sm">
            <h2>Rule</h2>
            <p className="sm">{s.rule}</p>
            <p className="cap">{s.rule.startsWith('No ') ? 'No rule applied' : BASIS[s.basis]}</p>
          </section>
        </aside>
      </div>

      {id !== 'alertness' && list.length > 0 && (
        <div className={isNight ? 'split even' : ''}>
          <section className="panel stack-sm">
            <h2>Last 8 mission days</h2>
            <div className="chartbox"><Trend id={id} list={list} baseline={s.baseline} /></div>
          </section>
          {isNight && (
            <section className="panel stack-sm right">
              <h2>Across last night · real recording</h2>
              <NightChart series={scenario.nightSeries} pick={id === 'hrv' ? 'rmssd' : 'hr'} unit={id === 'hrv' ? 'ms' : 'bpm'}
                summary={`${id === 'hrv' ? 'RMSSD' : 'Heart rate'} in ${scenario.nightSeries.length} five-minute windows through the night. ${id === 'hrv' ? 'The night value is the median window.' : 'The night value is the mean.'}`} />
            </section>
          )}
        </div>
      )}
      {id === 'alertness' && (
        <section className="panel stack-sm">
          <h2>Sessions</h2>
          {sessions.length ? (
            <table>
              <thead><tr><th>When</th><th>Speed</th><th>vs comparison</th><th>Lapses</th><th>Band</th><th>Source</th></tr></thead>
              <tbody>{[...sessions].reverse().map((x) => (
                <tr key={x.id}>
                  <td className="num"><button className="btn quiet small" onClick={() => go({ view: 'result', id: x.id })}>{stamp(x.at)}</button></td>
                  {x.valid ? <><td className="num">{x.speed.toFixed(2)}</td><td className="num">{x.z.toFixed(1)} SD</td><td className="num">{x.lapses}</td><td><Chip kind={x.band} /></td></> : <td colSpan={4}>Not scored. {x.invalidReason}</td>}
                  <td><Prov p={x.provenance} /></td>
                </tr>
              ))}</tbody>
            </table>
          ) : <p className="sm muted">No session yet. A trend needs 3 or more comparable sessions.</p>}
        </section>
      )}

      <div className="split even">
        <section className="panel stack-sm">
          <h2>How it is measured</h2>
          <p className="sm">{info.how}</p>
          <h2 style={{ marginTop: 8 }}>What this app does not claim</h2>
          <p className="sm">{info.limit}</p>
        </section>
        <section className="panel stack-sm right">
          <h2>Sources</h2>
          <ul className="rows">
            {info.sources.map((k) => (
              <li key={k}>
                <a href={SOURCES[k].url} target="_blank" rel="noopener noreferrer">{SOURCES[k].label}<span className="sr"> (opens in new tab)</span></a>
                {SOURCES[k].nasa && <span className="prov" style={{ marginLeft: 8 }}>NASA</span>}
                <p className="cap">{SOURCES[k].detail}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {id !== 'alertness' && list.length > 0 && (
        <section className="panel tight">
          <details>
            <summary><h2>All readings</h2><span className="cap">{list.length} records</span></summary>
            <div className="body">
              <table>
                <thead><tr><th>When</th><th>Value</th><th>Origin</th><th>Source</th></tr></thead>
                <tbody>{[...list].reverse().map((x) => (
                  <tr key={x.id}><td className="num">{stamp(x.at)}</td><td className="num">{plain(x)}</td><td><Prov p={x.provenance} /></td><td>{x.source}{x.quality ? ` · ${x.quality.note}` : ''}</td></tr>
                ))}</tbody>
              </table>
            </div>
          </details>
        </section>
      )}
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
  const [fasting, setFasting] = useState(true);
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
      list.push({ indicator: 'bloodSugar', value: Math.round(g), unit: 'mg/dL', quality: fasting ? { usable: true, note: 'Fasting reading' } : { usable: false, note: 'Not fasting' } });
      parts.push(`blood sugar ${Math.round(g)} mg/dL${fasting ? ', fasting' : ', not fasting'}`);
    }
    if (!list.length) { setErr('Enter at least one reading.'); return; }
    addReadings(list, `Entered: ${parts.join(', ')}.`);
    go({ view: 'today' });
  };

  return (
    <>
      <Back to={{ view: 'today' }} label="Today" />
      <section className="panel stack">
        <h3>{kind === 'bp' ? 'About 30 seconds' : 'About 10 seconds'}</h3>
        <h1 tabIndex={-1}>{kind === 'bp' ? 'Blood pressure and blood sugar' : 'Body temperature'}</h1>
        <form className="stack" onSubmit={(e) => { e.preventDefault(); submit(); }}>
          {kind === 'bp' ? (
            <>
              <p className="sm muted">Sit still for a minute before the cuff reading. Enter either reading, or both.</p>
              <div className="fields">
                <Field id="sys" label="Systolic (upper)" unit="mmHg" value={sys} onChange={setSys} />
                <Field id="dia" label="Diastolic (lower)" unit="mmHg" value={dia} onChange={setDia} />
                <Field id="glu" label="Blood sugar" unit="mg/dL" value={glu} onChange={setGlu} />
              </div>
              <label className="check"><input type="checkbox" checked={fasting} onChange={(e) => setFasting(e.target.checked)} />Fasting: nothing to eat for 8 hours</label>
              <p className="sm muted">The 65–99 mg/dL range applies to fasting readings only. Blood pressure has no in-flight rule; it is kept for your trend.</p>
            </>
          ) : (
            <>
              <div className="fields"><Field id="temp" label="Temperature" unit="°C" value={temp} onChange={setTemp} /></div>
              <p className="sm muted">A reading at or above 38.0 °C asks for one re-check after 30 minutes.</p>
            </>
          )}
          <p className="err" role="alert">{err}</p>
          <div className="row"><Btn type="submit" variant="primary">Save reading</Btn><Btn variant="quiet" onClick={() => go({ view: 'today' })}>Cancel</Btn></div>
          <p className="sm muted">Nothing you typed is discarded if a value is rejected.</p>
        </form>
      </section>
    </>
  );
}

export { INDICATORS };
