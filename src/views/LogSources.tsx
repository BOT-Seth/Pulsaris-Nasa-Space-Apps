import { INFO, SOURCES } from '../domain/content';
import { INDICATORS, WEEKLY, latest } from '../domain/rules';
import { REFERENCE } from '../domain/pvt';
import { clock, sameDay } from '../domain/time';
import { useApp } from '../state/store';
import { Btn } from '../ui/primitives';
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
  if (ev.issues.some((i) => i.id === 'temperature') && temp) upcoming.push({ when: clock(temp.at + 30), what: 'Temperature re-check', state: now >= temp.at + 30 ? 'Due now' : `In ${Math.ceil(temp.at + 30 - now)} min`, ...(now >= temp.at + 30 ? { action: () => go({ view: 'entry', kind: 'temp' }), label: 'Enter temperature' } : {}) });
  const days = bp ? Math.ceil((bp.at + WEEKLY - now) / 1440) : 0;
  upcoming.push({ when: days <= 0 ? 'Now' : `In ${days} d`, what: 'Blood pressure + blood sugar', state: days <= 0 ? 'Due' : 'Weekly' });

  const todays = app.sessions.filter((x) => x.valid && sameDay(x.at, now));
  const lastS = todays[todays.length - 1];
  const stateOf: Record<string, string> = {};
  if (ev.issues.some((i) => i.id.startsWith('alertness'))) stateOf.Alertness = 'Open';
  else if (lastS && lastS.band === 'ok' && todays.some((x) => x.band !== 'ok')) stateOf.Alertness = `Closed at ${clock(lastS.at)} by demo rule`;
  if (ev.issues.some((i) => i.id === 'temperature') && temp) stateOf['Symptoms and temperature'] = `Open · re-check ${now >= temp.at + 30 ? 'due now' : `at ${clock(temp.at + 30)}`}`;
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
      <section className="mhead">
        <h1 tabIndex={-1}>Plan and log</h1>
        <p className="sm muted">What is coming up, and what has been recorded on this tablet.</p>
        {!storageOk && <p className="notice warn">This browser is blocking local storage. Records will be lost when the page closes.</p>}
      </section>
      <div className="today fill log">
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
          <section className="panel stack-sm record">
            <h2>Record, by concern</h2>
            {groups.size === 0 && <p className="sm muted">Nothing recorded yet in this scenario.</p>}
            {[...groups.entries()].map(([k, entries]) => (
              <div key={k} className="concern">
                <div><h3 className="concern-h">{k}</h3>{stateOf[k] && <p className="concern-state">{stateOf[k]}</p>}</div>
                <ol className="seq">{entries.map((e, i) => <li key={i}><span className="num">{clock(e.at)}</span><span>{e.text}</span></li>)}</ol>
              </div>
            ))}
          </section>
        </div>
        <aside className="side">
          <section className="panel stack-sm">
            <h2 className="rail-h">Medical review</h2>
            <p className="sm"><FlagLine /></p>
          </section>
          <section className="panel stack-sm">
            <h2 className="rail-h">Your data</h2>
            <p className="sm muted">Stored only in this browser. No account, no server.</p>
            <Btn small onClick={download}>Export records (JSON)</Btn>
          </section>
        </aside>
      </div>
      <Foot kind="records" />
    </>
  );
}

/** Where each rule's numbers come from, kept apart from what a source only supports as background. */
const BASIS_OF: Record<string, string> = {
  sleep: 'Team-selected demo cut-offs. Background only: NASA HRP sleep risk; Dijk et al. 2001 (about 6.5 h sleep in flight). No cited source validates these cut-offs.',
  hrv: 'Team-selected 1 SD threshold and seven-night baseline length (implementation choices). Background only: Chua et al. 2012.',
  heartRate: 'Team-selected 2 SD threshold (implementation choice). Background only: Fritsch-Yelle et al. 1996 (heart rate changes in flight).',
  sleepiness: 'Scale: Åkerstedt & Gillberg 1990 (published). The cut at 7 is a team-selected demo threshold.',
  mood: 'No interpretation rule.',
  alertness: 'Protocol and 355 ms lapse: Basner et al. 2011 (published). Reference mean and SD: Dev et al. 2024 (published). Watch and Act cut-offs: team-selected; the 1.5 SD cut matches the study’s low-score definition.',
  bloodPressure: 'No interpretation rule.',
  bloodSugar: '65–99 mg/dL is an Earth fasting lab interval, used here only as a demo threshold. Not validated for finger-stick readings.',
  temperature: 'Team-selected demo threshold. Background only: Stahn et al. 2017 (core temperature on long missions).',
};

export function SourcesView() {
  const { ev, scenario, readings, sessions, symptoms } = useApp();
  const counts = { recorded: 0, synthetic: 0, 'self-reported': 0, 'measured-here': 0 };
  readings.forEach((r) => { counts[r.provenance]++; });
  const measured = sessions.filter((x) => x.provenance === 'measured-here').length;
  const simulated = sessions.filter((x) => x.provenance === 'synthetic').length;
  const nr = (n: number, w: string) => `${n} ${w}${n === 1 ? '' : 's'}`;
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
          <ul className="srcs">
            <li><span className="src-h">Earth dataset · MMASH</span><span className="src-m">Last night · {nr(counts.recorded, 'reading')} in this scenario</span><p className="sm">Sleep duration, HRV and sleeping heart rate computed from MMASH: healthy men, 24 h each, on Earth. Not astronauts, not in flight. This scenario uses {scenario.def.user.replace('_', ' ')}.</p></li>
            <li><span className="src-h">Synthetic history</span><span className="src-m">Earlier nights and earlier entries · {nr(counts.synthetic, 'reading')}</span><p className="sm">Generated by a seeded script so baselines and trends exist. Sleep is centred on the 6.4 h in-flight average reported by Dev et al. 2024. Always labelled.</p></li>
            <li><span className="src-h">Entered by you</span><span className="src-m">{nr(counts['self-reported'], 'reading')} · {nr(symptoms.length, 'symptom report')}</span><p className="sm">Mood, sleepiness, blood pressure, blood sugar, temperature and symptoms typed or tapped on this tablet.</p></li>
            <li><span className="src-h">Measured on this tablet</span><span className="src-m">{nr(measured, 'alertness session')}</span><p className="sm">Reaction times from an alertness check taken on this tablet. Method below.</p></li>
            <li><span className="src-h">Simulated test result</span><span className="src-m">{nr(simulated, 'alertness session')}</span><p className="sm">Sample alertness sessions loaded from the demo controls. A subtype of synthetic data. Never counted or described as a tablet measurement.</p></li>
          </ul>
        </section>
        <section className="panel stack-sm right">
          <h2>HRV and sleeping heart rate</h2>
          <p className="sm">RMSSD of beat-to-beat intervals inside the sleep window only. Intervals outside 0.30–2.00 s are dropped, as are intervals that differ by more than 20 % from the one before. RMSSD is taken per 5-minute window with at least 100 successive differences; the night value is the median window. Sleeping heart rate is the mean over the same windows.</p>
          <p className="sm">A night with under 50 % sensor coverage is shown but never compared.</p>
        </section>
      </div>

      <section className="panel stack-sm">
        <h2 id="method">Alertness test method</h2>
        <ol className="method-list">
          <li><b>Sequence.</b> Three practice responses, then a timed test of 3 minutes (3-minute psychomotor vigilance test, as in the Cognition battery used by Dev et al. 2024). The demo controls also offer a 45 s length, which is labelled wherever it is used.</li>
          <li><b>Stimulus.</b> After a random gap drawn uniformly between 2 and 5 s (the interstimulus interval Dev et al. 2024 report, Section 2.2), the black signal appears with a running millisecond counter.</li>
          <li><b>Response time.</b> Milliseconds from the display frame that paints the signal to the touch or key event. No response within 30 s is recorded as 30 000 ms.</li>
          <li><b>Responses scored.</b> Only timed responses; the three practice responses are excluded.</li>
          <li><b>Score.</b> Response times are converted to seconds. Score = 10 − mean(1 / response time). A higher score is slower.</li>
          <li><b>Reference metric.</b> Dev et al. 2024 define PVT speed as “10 minus the reciprocal of the response time” (Section 2.3, Cognitive performance). Their Table 1 gives the pre-flight PVT Speed raw score for ISS astronauts: mean {REFERENCE.mean}, SD {REFERENCE.sd}, N = {REFERENCE.n}, range 4.75–5.73. <span className="cite">The app averages reciprocal response times in seconds. This is an implementation assumption compatible with the scale of the published values; the paper excerpt does not establish the aggregation method. The app also omits the study’s practice and stimulus-set corrections. Equivalence to the published reference metric has therefore not been established, so the app reports differences in “demo SD” on a demo comparison scale.</span></li>
          <li><b>Difference.</b> (score − {REFERENCE.mean}) / {REFERENCE.sd}, shown as “demo SD”. The app uses the opposite sign convention to the paper: positive means slower. Its 1.5 SD demonstration boundary uses the same numerical magnitude as the paper’s low-score threshold (z ≤ −1.5). Equivalent classification has not been established.</li>
          <li><b>Differences that remain.</b> The study’s raw scores include the Cognition battery’s practice and stimulus-set corrections (Basner et al. 2020, cited by Dev et al.), which the app does not apply. The study used its own test hardware; this tablet’s timing is not benchmarked. Comparisons are therefore indicative, not a measurement against the astronaut cohort.</li>
          <li><b>Lapse.</b> A response of 355 ms or longer, including a 30 s timeout.</li>
          <li><b>False start.</b> A tap before the signal, or within 100 ms of it. More than 8 false starts end the attempt.</li>
          <li><b>Not scored.</b> Fewer than 5 timed responses, more than 8 false starts, or a pause longer than 2 minutes. An unscored attempt leaves alertness unassessed.</li>
          <li><b>Classification (demo rule).</b> Watch: 1 ≤ difference &lt; 1.5 SD, or 3 to 5 lapses. Act: difference ≥ 1.5 SD, 6 or more lapses, or 4 or more false starts. Act takes precedence.</li>
          <li><b>Closing a follow-up (demo rule).</b> After a Watch or Act result, a recorded action does not close the follow-up. A later scored check on the same day that is within the demo band closes it. Other flagged readings stay flagged.</li>
          <li><b>Timing limit.</b> Display and touch latency of this tablet are not benchmarked, so a comparison with the reference is indicative only.</li>
        </ol>
      </section>

      <section className="panel stack-sm">
        <h2 id="rules">Every rule, and where its numbers come from</h2>
        <table className="ruletable">
          <thead><tr><th>Indicator</th><th>Rule</th><th>Source / implementation basis</th></tr></thead>
          <tbody>{INDICATORS.map((i) => <tr key={i}><td><b>{INFO[i].name}</b></td><td className="rule-col">{ev.statuses[i].rule}</td><td className="basis-col">{BASIS_OF[i] ?? 'Team-selected demo threshold.'}</td></tr>)}</tbody>
        </table>
        <p className="sm muted">Demo rules are team-configured examples. A source may support a measurement or background claim without validating the app’s threshold or follow-up instruction.</p>
      </section>

      <section className="panel stack-sm">
        <h2 id="refs">References</h2>
        <ul className="rows">
          {Object.values(SOURCES).map((s) => (
            <li key={s.id}>
              <a href={s.url} target="_blank" rel="noopener noreferrer">{s.label}<span className="sr"> (opens in new tab)</span></a>
              {/nasa\.gov/.test(s.url) && <span className="reflabel">NASA resource</span>}
              <p className="cap">{s.detail}</p>
            </li>
          ))}
        </ul>
      </section>

      <div className="split even">
        <section className="panel stack-sm">
          <h2 id="limits">What Pulsaris does not do</h2>
          <ul className="rows">
            <li className="sm">It does not diagnose. It applies demo rules and points to a next step.</li>
            <li className="sm">It does not connect to a sensor. The only live measurement is the alertness check on this tablet.</li>
            <li className="sm">It does not send anything. Marking records for medical review saves a local flag; no notification is sent.</li>
            <li className="sm">It does not cover radiation, bone, muscle, vision or nutrition intake.</li>
            <li className="sm">It is designed for a crew member at a cabin tablet, not for suit displays.</li>
          </ul>
        </section>
        <section className="panel stack-sm right">
          <h2>Use of AI</h2>
          <p className="sm">Code, interface text and the synthetic history generator were written with AI assistance (Claude). The 3D body figure is AI-generated: a local FLUX.2 Klein reference image, a TRELLIS 2 mesh, then Blender finishing and targeted corrections. It is illustrative, not validated anatomy, and serves only as navigation.</p>
          <h2 style={{ marginTop: 8 }}>License and credit</h2>
          <p className="sm">MMASH v1.0.0 © Rossi et al., Open Database License v1.0, via PhysioNet. Derived values in this app are made available under the same license.</p>
        </section>
      </div>
      <Foot />
    </>
  );
}
