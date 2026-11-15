import { INFO, SOURCES } from '../domain/content';
import { INDICATORS, WEEKLY, latest } from '../domain/rules';
import { REFERENCE } from '../domain/pvt';
import { clock } from '../domain/time';
import type { RuleBasis } from '../domain/types';
import { useApp } from '../state/store';
import { Btn, Prov } from '../ui/primitives';
import { FlagLine, Foot, useNav } from '../ui/shared';

/** Which concern a log line belongs to, so the record reads as a sequence per concern. */
function concernOf(text: string): string {
  if (/alertness|re-check|movement break|rest/i.test(text)) return 'Alertness';
  if (/check-in/i.test(text)) return 'Daily check-in';
  if (/symptom|temperature/i.test(text)) return 'Symptoms and temperature';
  if (/medical review|flag/i.test(text)) return 'Medical review';
  if (/blood|entered/i.test(text)) return 'Entries';
  return 'Other';
}

export function LogView() {
  const app = useApp();
  const { go } = useNav();
  const { log, ev, now, readings, recheckAt, deferUntil, storageOk } = app;
  const bp = latest(readings, 'bloodPressure');
  const temp = latest(readings, 'temperature');
  const upcoming: { when: string; what: string; state: string; action?: () => void; label?: string }[] = [];
  if (ev.issues.some((i) => i.id === 'checkin')) upcoming.push({ when: 'Now', what: 'Daily check-in', state: 'Due', action: () => go({ view: 'checkin' }), label: 'Start' });
  if (ev.issues.some((i) => i.id === 'alertness-check')) upcoming.push({ when: deferUntil !== null && now < deferUntil ? clock(deferUntil) : 'Now', what: 'Alertness check', state: deferUntil !== null && now < deferUntil ? 'Reminder set' : 'Recommended', action: () => go({ view: 'check' }), label: 'Start' });
  if (recheckAt !== null) upcoming.push({ when: clock(recheckAt), what: 'Alertness re-check', state: now >= recheckAt ? 'Due now' : `In ${Math.ceil(recheckAt - now)} min`, ...(now >= recheckAt ? { action: () => go({ view: 'check' }), label: 'Start' } : {}) });
  if (ev.issues.some((i) => i.id === 'temperature') && temp) upcoming.push({ when: clock(temp.at + 30), what: 'Temperature re-check', state: now >= temp.at + 30 ? 'Due now' : `In ${Math.ceil(temp.at + 30 - now)} min` });
  const days = bp ? Math.ceil((bp.at + WEEKLY - now) / 1440) : 0;
  upcoming.push({ when: days <= 0 ? 'Now' : `In ${days} d`, what: 'Blood pressure + blood sugar', state: days <= 0 ? 'Due' : 'Weekly' });

  const groups = new Map<string, typeof log>();
  [...log].reverse().forEach((e) => { const k = concernOf(e.text); groups.set(k, [...(groups.get(k) ?? []), e]); });
  const download = () => {
    const url = URL.createObjectURL(new Blob([app.exportJson()], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url; a.download = 'pulsaris-records.json'; a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <>
      <section className="panel pagehead">
        <h1 tabIndex={-1}>Plan and log</h1>
        <p className="sm muted">What is coming up, and what has been recorded. Kept on this tablet.</p>
        {!storageOk && <p className="notice warn">This browser is blocking local storage. Records will be lost when the page closes.</p>}
      </section>
      <div className="today fill">
        <div className="main-col">
          <section className="panel stack-sm">
            <h2>Upcoming</h2>
            <ul className="plan">
              {upcoming.map((u) => (
                <li key={u.what}>
                  <span className="num when">{u.when}</span>
                  <b>{u.what}</b>
                  <span className="sm muted">{u.state}</span>
                  {u.action ? <Btn small onClick={u.action}>{u.label}</Btn> : <span />}
                </li>
              ))}
            </ul>
          </section>
          <section className="panel stack-sm">
            <h2>Medical review</h2>
            <p className="sm"><FlagLine /></p>
          </section>
        </div>
        <aside className="side">
          <section className="panel stack-sm">
            <h2 className="rail-h">Record, by concern</h2>
            {groups.size === 0 && <p className="sm muted">Nothing recorded yet in this scenario.</p>}
            {[...groups.entries()].map(([k, entries]) => (
              <div key={k} className="concern">
                <h3 className="concern-h">{k}</h3>
                <ol className="seq">{entries.map((e, i) => <li key={i}><span className="num">{clock(e.at)}</span><span className="sm">{e.text}</span></li>)}</ol>
              </div>
            ))}
          </section>
          <section className="panel stack-sm">
            <h2 className="rail-h">Your data</h2>
            <p className="sm muted">Stored only in this browser. No account, no server.</p>
            <Btn small onClick={download}>Export records (JSON)</Btn>
          </section>
        </aside>
      </div>
      <Foot />
    </>
  );
}

const BASIS: Record<RuleBasis, string> = {
  published: 'Published threshold',
  'team-starting-point': 'Demo rule · not validated',
  'clinical-reference': 'Earth lab range · demo rule',
};

export function SourcesView() {
  const { ev, scenario, readings } = useApp();
  const counts = { recorded: 0, synthetic: 0, 'self-reported': 0, 'measured-here': 0 };
  readings.forEach((r) => { counts[r.provenance]++; });
  return (
    <>
      <section className="panel stack-sm">
        <h1 tabIndex={-1}>Sources and method</h1>
        <nav className="jumps" aria-label="On this page">
          {[['data', 'Data'], ['rules', 'Rules'], ['method', 'Test method'], ['refs', 'References'], ['limits', 'Limitations']].map(([id, t]) => (
            <a key={id} href={`#${id}`} onClick={(e) => { e.preventDefault(); document.getElementById(id)?.scrollIntoView({ block: 'start' }); }}>{t}</a>
          ))}
        </nav>
        <p>Pulsaris is an educational prototype for the 2026 NASA Space Apps Challenge, “Create Health Monitoring Software for Astronauts on Space Missions”. It is not a medical device, is not clinically validated, and has not been tested with astronauts.</p>
      </section>

      <div className="split even">
        <section className="panel stack-sm">
          <h2 id="data">What the data is</h2>
          <ul className="rows">
            <li><Prov p="recorded" /> <b>Last night</b><p className="sm">Sleep duration, HRV and heart rate are computed from MMASH: real people, 24 h each, on Earth. Not astronauts, not in flight. Current scenario uses {scenario.def.user.replace('_', ' ')}.</p></li>
            <li><Prov p="synthetic" /> <b>Earlier nights and earlier entries</b><p className="sm">Generated by a seeded script so baselines and trends exist. Sleep is centred on the 6.4 h in-flight average. Never shown without the Synthetic tag.</p></li>
            <li><Prov p="self-reported" /> <b>What you type or tap</b><p className="sm">Mood, sleepiness, blood pressure, blood sugar, temperature, symptoms.</p></li>
            <li><Prov p="measured-here" /> <b>Alertness check</b><p className="sm">Reaction times measured by this tablet. Scored against the NASA reference: speed {REFERENCE.mean} ± {REFERENCE.sd}, N = {REFERENCE.n}.</p></li>
          </ul>
          <p className="cap">In this scenario: {counts.recorded} recorded, {counts.synthetic} synthetic, {counts['self-reported']} self-reported readings.</p>
        </section>
        <section className="panel stack-sm right">
          <h2 id="method">How HRV and the test are computed</h2>
          <p className="sm">RMSSD of beat-to-beat intervals inside the sleep window only. Intervals outside 0.30–2.00 s are dropped, as are intervals that differ by more than 20 % from the one before. RMSSD is taken per 5-minute window with at least 100 successive differences; the night value is the median window.</p>
          <p className="sm">A night with under 50 % sensor coverage is shown but never compared.</p>
          <h2 style={{ marginTop: 8 }}>How NASA resources are used</h2>
          <p className="sm">The alertness score is computed with the formula and the pre-flight astronaut reference from a NASA Human Research Program study. The HRP hazard and risk pages are the basis for each “Why it matters in space” text and for the countermeasure wording.</p>
        </section>
      </div>

      <section className="panel stack-sm">
        <h2 id="rules">Every rule, and where its threshold comes from</h2>
        <table>
          <thead><tr><th>Indicator</th><th>Rule</th><th>Basis</th></tr></thead>
          <tbody>{INDICATORS.map((i) => <tr key={i}><td><b>{INFO[i].name}</b></td><td>{ev.statuses[i].rule}</td><td>{/^(No rule|This prototype)/.test(ev.statuses[i].rule) ? 'No rule applied' : BASIS[ev.statuses[i].basis]}</td></tr>)}</tbody>
        </table>
        <p className="sm muted">“Demo rule” means a first value chosen by the team from the cited literature. It is not validated and would need review by flight surgeons before any real use. Heart rate, HRV and blood pressure are compared only with in-flight nights, never with pre-flight values, because all three fall in microgravity.</p>
      </section>

      <section className="panel stack-sm">
        <h2 id="refs">References</h2>
        <ul className="rows">
          {Object.values(SOURCES).map((s) => (
            <li key={s.id}>
              <a href={s.url} target="_blank" rel="noopener noreferrer">{s.label}<span className="sr"> (opens in new tab)</span></a>
              {s.nasa && <span className="prov" style={{ marginLeft: 8 }}>NASA</span>}
              <p className="cap">{s.detail}</p>
            </li>
          ))}
        </ul>
      </section>

      <div className="split even">
        <section className="panel stack-sm">
          <h2 id="limits">What Pulsaris does not do</h2>
          <ul className="rows">
            <li className="sm">It does not diagnose. It screens and points to a next step.</li>
            <li className="sm">It does not connect to a sensor. No live measurement is taken except the reaction test.</li>
            <li className="sm">It does not send anything. “Flag for crew medical officer” is a local state.</li>
            <li className="sm">It does not cover radiation, bone, muscle, vision or nutrition intake.</li>
            <li className="sm">It is designed for an unsuited crew member at a cabin tablet, not for gloves or suit displays.</li>
          </ul>
        </section>
        <section className="panel stack-sm right">
          <h2>Use of AI</h2>
          <p className="sm">Code, interface text and the synthetic history generator were written with AI assistance (Claude). The body figure is a hand-coded vector pictogram. No AI-generated images are shown in the app.</p>
          <h2 style={{ marginTop: 8 }}>License and credit</h2>
          <p className="sm">MMASH v1.0.0 © Rossi et al., Open Database License v1.0, via PhysioNet. Derived values in this app are made available under the same license.</p>
        </section>
      </div>
      <Foot />
    </>
  );
}
