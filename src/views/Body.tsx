import { useState, type ReactNode } from 'react';
import { INFO, REGIONS, SOURCES, SYMPTOMS } from '../domain/content';
import { INDICATORS } from '../domain/rules';
import { age, clock, sameDay } from '../domain/time';
import type { RegionId } from '../domain/types';
import { useApp } from '../state/store';
import { Body3D, type BodyLabel } from '../ui/Body3D';
import { Btn, Chip, Value, plain } from '../ui/primitives';
import { Foot, chipWord, useNav } from '../ui/shared';

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

const SIDES = ['Left', 'Right', 'Both', 'Centre', 'Not sure'] as const;

export function SymptomForm({ region }: { region?: RegionId }) {
  const { symptomDraft: d, setSymptomDraft, saveSymptom } = useApp();
  const { go } = useNav();
  const [err, setErr] = useState('');
  const sel = d.region ?? region ?? null;
  const set = (patch: Partial<typeof d>) => setSymptomDraft({ ...d, region: sel, ...patch });
  const toggle = (s: string) => set({ list: d.list.includes(s) ? d.list.filter((x) => x !== s) : d.list.length < 5 ? [...d.list, s] : d.list });
  const ready = !!(sel && d.list.length);
  const submit = () => {
    const t = d.temp.trim().replace(',', '.');
    if (t !== '' && !(Number(t) >= 30 && Number(t) <= 45)) { setErr('Enter a temperature between 30 and 45 °C, or leave it empty.'); return; }
    if (d.region === null && sel) setSymptomDraft({ ...d, region: sel });
    saveSymptom(t === '' ? undefined : Math.round(Number(t) * 10) / 10);
    go({ view: 'today' });
  };
  return (
    <form className="today form" onSubmit={(e) => { e.preventDefault(); submit(); }}>
      <div className="main-col">
        <section className="decision task formhead" aria-labelledby="sy-h">
          <p className="mark lg task"><b>Symptom report</b><span className="scope">kept on this tablet</span></p>
          <h1 id="sy-h" tabIndex={-1}>What do you notice?</h1>
        </section>
        <section className="panel q">
          <fieldset className="choices words">
            <legend>1. Where</legend>
            {ORDER.map((r) => <label key={r}><input type="radio" name="region" checked={sel === r} onChange={() => set({ region: r })} />{REGIONS[r].name}</label>)}
          </fieldset>
          <fieldset className="choices words">
            <legend className="sub">Side, optional</legend>
            {SIDES.map((v) => <label key={v}><input type="radio" name="side" checked={d.side === v} onChange={() => set({ side: v })} />{v}</label>)}
          </fieldset>
        </section>
        <section className="panel q">
          <fieldset className="choices words">
            <legend>2. What · up to 5</legend>
            {SYMPTOMS.map((s) => <label key={s}><input type="checkbox" checked={d.list.includes(s)} onChange={() => toggle(s)} />{s}</label>)}
          </fieldset>
        </section>
        <section className="panel q">
          <div className="field">
            <label htmlFor="stemp" className="label">3. Temperature, optional</label>
            <div className="in"><input id="stemp" inputMode="decimal" autoComplete="off" value={d.temp} onChange={(e) => set({ temp: e.target.value })} aria-label="Temperature in degrees Celsius, optional" /><span>°C</span></div>
          </div>
        </section>
      </div>
      <aside className="side">
        <section className="panel stack-sm sticky">
          <h2 className="rail-h">Tap where you feel it</h2>
          <div className="locator"><Figure selected={sel} flagged={[]} onPick={(r) => set({ region: r })} /></div>
          <p className="err" role="alert">{err}</p>
          <Btn type="submit" variant="primary" disabled={!ready}>Save report</Btn>
          <Btn variant="quiet" onClick={() => go({ view: 'today' })}>Close, keep draft</Btn>
          <p className="sm muted">Saved on this tablet only. To have it reviewed, use Mark for medical review.</p>
        </section>
      </aside>
      <div className="formfoot"><Foot /></div>
    </form>
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
  const n = items.length;
  return (
    <>
      <div className="today">
        <div className="main-col">
          <section className="decision task" aria-labelledby="fl-h">
            <p className="mark lg task"><b>Medical review</b><span className="scope">local only</span></p>
            <h1 id="fl-h" tabIndex={-1}>Mark these records for medical review</h1>
            <p className="reason">{n ? `${n} record${n === 1 ? '' : 's'} from today.` : 'Nothing recorded yet today; the flag would carry no records.'}</p>
            <p className="notice warn"><b>No notification will be sent.</b> This prototype only saves the flag on this tablet.</p>
            <div className="row actions"><Btn variant="primary" onClick={() => { app.sendFlag(); go({ view: 'today' }); }}>Save flag locally</Btn><Btn variant="quiet" onClick={() => go({ view: 'today' })}>Cancel</Btn></div>
          </section>
          <section className="panel stack-sm">
            <h2>Records included</h2>
            {n ? <ul className="rows quiet">{items.map((t) => <li key={t}><span>{t}</span></li>)}</ul> : <p className="sm muted">None.</p>}
          </section>
        </div>
        <aside className="side">
          <section className="panel stack-sm">
            <h2 className="rail-h">On board</h2>
            <p className="sm">Tell the crew medical officer directly. Onboard help does not depend on the ground link.</p>
          </section>
          <section className="panel stack-sm">
            <h2 className="rail-h">Ground · intended workflow</h2>
            <p className="sm">The flight surgeon would see a flag at the next downlink. Ground link now: {link ? 'available' : 'none'}. A reply can take seconds near the Moon and up to about 20 minutes each way at Mars.</p>
            <p className="sm muted">Not built in this prototype.</p>
          </section>
        </aside>
      </div>
      <Foot />
    </>
  );
}
