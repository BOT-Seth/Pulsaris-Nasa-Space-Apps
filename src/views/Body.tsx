import { useState, type ReactNode } from 'react';
import { INFO, REGIONS, SOURCES, SYMPTOMS } from '../domain/content';
import { INDICATORS } from '../domain/rules';
import { age, clock, sameDay } from '../domain/time';
import type { RegionId } from '../domain/types';
import { useApp } from '../state/store';
import { Body3D, type BodyLabel } from '../ui/Body3D';
import { Btn, Chip, Value, plain } from '../ui/primitives';
import { Back, FlagLine, Foot, chipWord, useNav } from '../ui/shared';

const ORDER: RegionId[] = ['head', 'chest', 'abdomen', 'limbs', 'whole'];

/**
 * A plain pictogram, not an anatomical drawing. Each part is a button.
 * A highlighted outline means a measurement grouped under that system is flagged.
 * It never means the organ itself was assessed.
 */
export function Figure({ selected, flagged, onPick }: { selected: RegionId | null; flagged: RegionId[]; onPick: (r: RegionId) => void }) {
  const part = (id: RegionId, label: string, shapes: ReactNode) => (
    <g role="button" tabIndex={0} aria-label={`${label}${flagged.includes(id) ? ', has a flagged measurement' : ''}`} aria-pressed={selected === id}
      onClick={() => onPick(id)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onPick(id); } }}
      className={`${id === 'whole' ? 'aura' : 'part'}${selected === id ? ' sel' : ''}${flagged.includes(id) ? ' flag' : ''}`}>
      {shapes}
    </g>
  );
  return (
    <svg className="figure" viewBox="0 0 220 430" role="group" aria-label="Body map. Choose a region.">
      {part('whole', 'Whole body', <rect x="6" y="6" width="208" height="418" rx="2" />)}
      {part('limbs', 'Arms and legs', <>
        <rect x="42" y="92" width="26" height="150" rx="13" /><rect x="152" y="92" width="26" height="150" rx="13" />
        <rect x="76" y="232" width="30" height="176" rx="15" /><rect x="114" y="232" width="30" height="176" rx="15" />
      </>)}
      {part('abdomen', 'Abdomen', <path d="M74 158h72v64a14 14 0 0 1-14 14H88a14 14 0 0 1-14-14z" />)}
      {part('chest', 'Chest', <path d="M88 88h44a14 14 0 0 1 14 14v50H74v-50a14 14 0 0 1 14-14z" />)}
      {part('head', 'Head', <><circle cx="110" cy="46" r="26" /><rect x="101" y="70" width="18" height="16" /></>)}
    </svg>
  );
}

export function BodyMap({ region }: { region?: RegionId }) {
  const { ev, symptoms, now } = useApp();
  const { go } = useNav();
  const [sel, setSel] = useState<RegionId>(region ?? 'head');
  const info = REGIONS[sel];
  const inRegion = (r: RegionId) => INDICATORS.filter((i) => INFO[i].region === r);
  const flagged = ORDER.filter((r) => inRegion(r).some((i) => ev.statuses[i].status === 'watch' || ev.statuses[i].status === 'act'));
  const here = symptoms.filter((s) => s.region === sel && sameDay(s.at, now));
  // Leader-line labels: the region's live values, or an honest "not measured".
  const labels: BodyLabel[] = (['head', 'chest', 'abdomen', 'limbs'] as const).map((r) => {
    const withValue = inRegion(r).filter((i) => { const x = ev.statuses[i].latest; return x && sameDay(x.at, now); }).slice(0, 2);
    return {
      id: r, title: REGIONS[r].name, flagged: flagged.includes(r),
      lines: withValue.length
        ? withValue.map((i) => `${INFO[i].short} ${plain(ev.statuses[i].latest!)}`)
        : [inRegion(r).length ? 'No reading today' : 'Not measured here'],
    };
  });
  return (
    <>
      <section className="panel stack-sm">
        <h1 tabIndex={-1}>Body map</h1>
        <p className="sm muted">Measurements grouped by body system. A highlighted region means one of its measurements is flagged. It is not a finding about the organ.</p>
      </section>
      <div className="split even">
        <section className="panel stack">
          <div className="body3d-wrap">
            <Body3D selected={sel} flagged={flagged} onPick={setSel} labels={labels} fallback={<Figure selected={sel} flagged={flagged} onPick={setSel} />} />
          </div>
          <p className="cap">Drag to spin 360°. Tap a region. AI-generated visualization.</p>
          <div className="regions" role="group" aria-label="Regions">
            {ORDER.map((r) => <Btn key={r} small pressed={sel === r} onClick={() => setSel(r)}>{REGIONS[r].name}{flagged.includes(r) ? ' · flagged' : ''}</Btn>)}
          </div>
        </section>
        <div className="right">
          <section className="panel stack-sm">
            <h3>{info.name}</h3>
            <h2 className="big">{info.system}</h2>
            <p>{info.fn}</p>
            <p className="state">In space: {info.inSpace}</p>
            <p className="cap">{info.sources.map((k, i) => <span key={k}>{i > 0 && ' · '}<a href={SOURCES[k].url} target="_blank" rel="noopener noreferrer">{SOURCES[k].label}<span className="sr"> (opens in new tab)</span></a></span>)}</p>
          </section>
          <section className="panel stack-sm">
            <h2>Measurements here</h2>
            {inRegion(sel).length ? (
              <ul className="rows">
                {inRegion(sel).map((i) => {
                  const s = ev.statuses[i];
                  return (
                    <li key={i}>
                      <button type="button" className="tile plain" onClick={() => go({ view: 'indicator', id: i })}>
                        <span className="tile-head"><b>{INFO[i].name}</b><Chip kind={s.status} word={chipWord(i, s)} /></span>
                        <span className="sm">{s.latest ? <><Value r={s.latest} className="num" /> · {age(s.latest.at, now)} · </> : null}{s.summary}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : <p className="sm muted">Pulsaris measures nothing here. Muscle and bone are managed by the exercise program, outside this app.</p>}
          </section>
          <section className="panel stack-sm">
            <h2>Symptoms here today</h2>
            {here.length ? <ul className="rows">{here.map((s) => <li key={s.id}><p>{s.list.join(', ')}</p><p className="cap">Reported {clock(s.at)}</p></li>)}</ul> : <p className="sm muted">None reported.</p>}
            <div className="row"><Btn variant="primary" onClick={() => go({ view: 'symptom', region: sel })}>Report a symptom here</Btn></div>
          </section>
        </div>
      </div>
      <Foot />
    </>
  );
}

export function SymptomForm({ region }: { region?: RegionId }) {
  const { symptomDraft: d, setSymptomDraft, saveSymptom } = useApp();
  const { go } = useNav();
  const [err, setErr] = useState('');
  const sel = d.region ?? region ?? null;
  const set = (patch: Partial<typeof d>) => setSymptomDraft({ ...d, region: sel, ...patch });
  const toggle = (s: string) => set({ list: d.list.includes(s) ? d.list.filter((x) => x !== s) : d.list.length < 5 ? [...d.list, s] : d.list });
  const submit = () => {
    const t = d.temp.trim().replace(',', '.');
    if (t !== '' && !(Number(t) >= 30 && Number(t) <= 45)) { setErr('Enter a temperature between 30 and 45 °C, or leave it empty.'); return; }
    if (d.region === null && sel) setSymptomDraft({ ...d, region: sel });
    saveSymptom(t === '' ? undefined : Math.round(Number(t) * 10) / 10);
    go({ view: 'today' });
  };
  return (
    <>
      <Back to={{ view: 'today' }} label="Today. Draft is kept" />
      <div className="split even">
        <section className="panel stack">
          <h3>Symptom report</h3>
          <h1 tabIndex={-1}>What do you notice?</h1>
          <form className="stack" onSubmit={(e) => { e.preventDefault(); submit(); }}>
            <fieldset className="choices words">
              <legend>Where</legend>
              {ORDER.map((r) => <label key={r}><input type="radio" name="region" checked={sel === r} onChange={() => set({ region: r })} />{REGIONS[r].name}</label>)}
            </fieldset>
            <fieldset className="choices words">
              <legend>What, up to 5</legend>
              {SYMPTOMS.map((s) => <label key={s}><input type="checkbox" checked={d.list.includes(s)} onChange={() => toggle(s)} />{s}</label>)}
            </fieldset>
            <div className="field">
              <label htmlFor="stemp" className="label">Temperature, optional</label>
              <div className="in"><input id="stemp" inputMode="decimal" autoComplete="off" value={d.temp} onChange={(e) => set({ temp: e.target.value })} aria-label="Temperature in degrees Celsius, optional" /><span>°C</span></div>
            </div>
            <p className="err" role="alert">{err}</p>
            <div className="row">
              <Btn type="submit" variant="primary" disabled={!(sel && d.list.length)}>Save report</Btn>
              <Btn variant="quiet" onClick={() => go({ view: 'today' })}>Close, keep draft</Btn>
            </div>
            <p className="sm muted">Saved on this tablet. Not shared unless you flag it for the crew medical officer.</p>
          </form>
        </section>
        <section className="panel stack right">
          <h2>Tap where you feel it</h2>
          <div className="body3d-wrap">
            <Body3D selected={sel} flagged={[]} onPick={(r) => set({ region: r })} height={420} fallback={<Figure selected={sel} flagged={[]} onPick={(r) => set({ region: r })} />} />
          </div>
        </section>
      </div>
    </>
  );
}

export function FlagView() {
  const app = useApp();
  const { go } = useNav();
  const { now, readings, sessions, symptoms, actions, link } = app;
  const items: string[] = [];
  if (readings.some((r) => r.provenance === 'self-reported' && r.indicator === 'mood' && sameDay(r.at, now))) items.push('Today’s check-in: mood and sleepiness');
  readings.filter((r) => r.provenance === 'self-reported' && r.indicator !== 'mood' && r.indicator !== 'sleepiness' && sameDay(r.at, now))
    .forEach((r) => items.push(`${INFO[r.indicator].name} entered ${clock(r.at)}`));
  sessions.filter((s) => s.valid && sameDay(s.at, now)).forEach((s) => items.push(`Alertness check result from ${clock(s.at)}`));
  symptoms.filter((s) => sameDay(s.at, now)).forEach((s) => items.push(`Symptom report from ${clock(s.at)}`));
  actions.filter((a) => sameDay(a.at, now)).forEach((a) => items.push(`Recorded action from ${clock(a.at)}`));
  return (
    <>
      <Back to={{ view: 'today' }} label="Today" />
      <section className="panel stack">
        <h3>Share</h3>
        <h1 tabIndex={-1}>Flag for crew medical officer</h1>
        <dl className="kv">
          <dt>Intended recipient</dt><dd>Crew medical officer on board. The flight surgeon on the ground would see it at the next downlink.</dd>
          <dt>What is shared</dt><dd>{items.length ? items.map((t) => <div key={t}>{t}</div>) : 'Nothing recorded yet today. The flag would carry no records.'}</dd>
          <dt>Ground link</dt><dd>{link ? 'Available.' : 'None right now.'} Onboard help does not depend on it: tell the crew medical officer directly.</dd>
          <dt>Reply time</dt><dd>Not immediate. A ground reply can take seconds near the Moon and up to about 20 minutes each way at Mars, so the steps on this tablet stand on their own.</dd>
        </dl>
        <p className="notice warn"><b>No notification will be sent.</b> This prototype only saves the flag on this tablet, with the records listed above.</p>
        <div className="row"><Btn variant="primary" onClick={() => { app.sendFlag(); go({ view: 'today' }); }}>Save flag locally</Btn><Btn variant="quiet" onClick={() => go({ view: 'today' })}>Cancel</Btn></div>
        <p className="cap"><FlagLine /></p>
      </section>
    </>
  );
}
