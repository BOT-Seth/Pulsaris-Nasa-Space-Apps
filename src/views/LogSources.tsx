import { INFO, SOURCES } from '../domain/content';
import { INDICATORS, WEEKLY, latest } from '../domain/rules';
import { REFERENCE } from '../domain/pvt';
import { clock, sameDay, stamp } from '../domain/time';
import type { RuleBasis } from '../domain/types';
import { useApp } from '../state/store';
import { Btn, Chip, Prov } from '../ui/primitives';
import { FlagLine, Foot, useNav } from '../ui/shared';

export function LogView() {
  const app = useApp();
  const { go } = useNav();
  const { log, ev, now, readings, recheckAt, deferUntil, storageOk } = app;
  const mood = latest(readings, 'mood');
  const checkedIn = mood && sameDay(mood.at, now) && mood.provenance === 'self-reported';
  const bp = latest(readings, 'bloodPressure');
  const download = () => {
    const url = URL.createObjectURL(new Blob([app.exportJson()], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url; a.download = 'pulsaris-records.json'; a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <>
      <section className="panel stack-sm">
        <h1 tabIndex={-1}>Plan and log</h1>
        <p className="sm muted">What is due, and what has been recorded. Records are kept on this tablet and survive a restart.</p>
        {!storageOk && <p className="notice warn">This browser is blocking local storage. Records will be lost when the page closes.</p>}
      </section>
      <div className="split">
        <section className="panel stack-sm">
          <h2>Log, newest first</h2>
          {log.length ? (
            <ul className="rows log">{log.map((e, i) => <li key={i}><span className="num cap">{stamp(e.at)}</span><span>{e.text}</span></li>)}</ul>
          ) : <p className="sm muted">Nothing recorded yet in this scenario.</p>}
        </section>
        <aside>
          <section className="panel stack-sm">
            <h2>Plan</h2>
            <ul className="rows">
              <li><b>Daily check-in</b><p className="sm muted">{checkedIn ? `Done ${clock(mood.at)}` : 'Due now'}</p></li>
              {ev.issues.filter((i) => i.id !== 'checkin' && i.id !== 'bp-due').map((i) => (
                <li key={i.id}>
                  <div className="title-row"><Chip kind={i.level} /><b>{i.title}</b></div>
                  <p className="sm muted">
                    {i.id === 'alertness-check' ? (deferUntil === null ? 'Pending. Not assessed.' : `Deferred to ${clock(deferUntil)}. Still not assessed.`)
                      : i.id === 'alertness-followup' ? (recheckAt === null ? 'No re-check time chosen. Concern open.' : `Re-check due ${clock(recheckAt)}. Concern open.`)
                        : i.state}
                  </p>
                </li>
              ))}
              <li><b>Blood pressure + blood sugar</b><p className="sm muted">{!bp ? 'No entry yet. Due.' : now - bp.at >= WEEKLY ? 'Weekly entry due.' : `Next weekly entry in ${Math.ceil((bp.at + WEEKLY - now) / 1440)} d.`}</p></li>
            </ul>
            <div className="row"><Btn variant="quiet" onClick={() => go({ view: 'today' })}>Open today</Btn></div>
          </section>
          <section className="panel stack-sm">
            <h2>Sharing</h2>
            <p className="sm"><FlagLine /></p>
            <p className="cap">A real system would show sent, delivered and acknowledged. This prototype cannot send anything.</p>
          </section>
          <section className="panel stack-sm">
            <h2>Your data</h2>
            <p className="sm muted">Stored only in this browser. No account, no server, no analytics.</p>
            <div className="row"><Btn small onClick={download}>Export records as JSON</Btn></div>
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
  'clinical-reference': 'Earth clinical reference',
};

export function SourcesView() {
  const { ev, scenario, readings } = useApp();
  const counts = { recorded: 0, synthetic: 0, 'self-reported': 0, 'measured-here': 0 };
  readings.forEach((r) => { counts[r.provenance]++; });
  return (
    <>
      <section className="panel stack-sm">
        <h1 tabIndex={-1}>Sources and method</h1>
        <p>Pulsaris is an educational prototype for the 2026 NASA Space Apps Challenge, “Create Health Monitoring Software for Astronauts on Space Missions”. It is not a medical device, is not clinically validated, and has not been tested with astronauts.</p>
      </section>

      <div className="split even">
        <section className="panel stack-sm">
          <h2>What the data is</h2>
          <ul className="rows">
            <li><Prov p="recorded" /> <b>Last night</b><p className="sm">Sleep duration, HRV and heart rate are computed from MMASH: real people, 24 h each, on Earth. Not astronauts, not in flight. Current scenario uses {scenario.def.user.replace('_', ' ')}.</p></li>
            <li><Prov p="synthetic" /> <b>Earlier nights and earlier entries</b><p className="sm">Generated by a seeded script so baselines and trends exist. Sleep is centred on the 6.4 h in-flight average. Never shown without the Synthetic tag.</p></li>
            <li><Prov p="self-reported" /> <b>What you type or tap</b><p className="sm">Mood, sleepiness, blood pressure, blood sugar, temperature, symptoms.</p></li>
            <li><Prov p="measured-here" /> <b>Alertness check</b><p className="sm">Reaction times measured by this tablet. Scored against the NASA reference: speed {REFERENCE.mean} ± {REFERENCE.sd}, N = {REFERENCE.n}.</p></li>
          </ul>
          <p className="cap">In this scenario: {counts.recorded} recorded, {counts.synthetic} synthetic, {counts['self-reported']} self-reported readings.</p>
        </section>
        <section className="panel stack-sm right">
          <h2>How HRV is computed</h2>
          <p className="sm">RMSSD of beat-to-beat intervals inside the sleep window only. Intervals outside 0.30–2.00 s are dropped, as are intervals that differ by more than 20 % from the one before. RMSSD is taken per 5-minute window with at least 100 successive differences; the night value is the median window.</p>
          <p className="sm">A night with under 50 % sensor coverage is shown but never compared.</p>
          <h2 style={{ marginTop: 8 }}>How NASA resources are used</h2>
          <p className="sm">The alertness score is computed with the formula and the pre-flight astronaut reference from a NASA Human Research Program study. The HRP hazard and risk pages are the basis for each “Why it matters in space” text and for the countermeasure wording.</p>
        </section>
      </div>

      <section className="panel stack-sm">
        <h2>Every rule, and where its threshold comes from</h2>
        <table>
          <thead><tr><th>Indicator</th><th>Rule</th><th>Basis</th></tr></thead>
          <tbody>{INDICATORS.map((i) => <tr key={i}><td><b>{INFO[i].name}</b></td><td>{ev.statuses[i].rule}</td><td>{/^(No rule|This prototype)/.test(ev.statuses[i].rule) ? 'No rule applied' : BASIS[ev.statuses[i].basis]}</td></tr>)}</tbody>
        </table>
        <p className="sm muted">“Demo rule” means a first value chosen by the team from the cited literature. It is not validated and would need review by flight surgeons before any real use. Heart rate, HRV and blood pressure are compared only with in-flight nights, never with pre-flight values, because all three fall in microgravity.</p>
      </section>

      <section className="panel stack-sm">
        <h2>References</h2>
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
          <h2>What Pulsaris does not do</h2>
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
