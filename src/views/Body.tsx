import { useState, type ReactNode } from 'react';
import { INFO, REGIONS, SOURCES, SYMPTOMS } from '../domain/content';
import { INDICATORS } from '../domain/rules';
import { age, clock, sameDay } from '../domain/time';
import type { IndicatorId, RegionId } from '../domain/types';
import { useApp } from '../state/store';
import { Body3D } from '../ui/Body3D';
import { Btn, Icon, plain, provLabel } from '../ui/primitives';
import { Field, tempError } from './Measurements';
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

const SHORT: Record<string, string> = { hazards: 'NASA HRP: 5 hazards', risks: 'NASA HRP: Risks', sleepRisk: 'NASA HRP: Sleep risk', fritsch1996: 'Fritsch-Yelle et al., 1996', stahn2017: 'Stahn et al., 2017', hughson2016: 'Hughson et al., 2016' };

/** Scrolls a section to 12 px below the sticky header (phones). */
function jumpTo(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  const bar = document.querySelector<HTMLElement>('.toolbar')?.offsetHeight ?? 0;
  window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - bar - 12, behavior: 'smooth' });
}

/** What one region's measurements say right now, in the words the rest of the app uses. */
function regionState(ids: IndicatorId[], ev: ReturnType<typeof useApp>['ev'], now: number): { text: string; tone: 'watch' | 'act' | '' } {
  if (!ids.length) return { text: 'Not measured here', tone: '' };
  const hit = ids.filter((i) => ev.statuses[i].status === 'watch' || ev.statuses[i].status === 'act');
  if (hit.length) {
    const act = hit.some((i) => ev.statuses[i].status === 'act');
    return { text: `${hit.length > 1 ? `${hit.length} measurements` : INFO[hit[0]].name} · ${act ? 'Act' : 'Watch'}`, tone: act ? 'act' : 'watch' };
  }
  const current = ids.some((i) => { const x = ev.statuses[i].latest; return x && sameDay(x.at, now); });
  return { text: current ? 'No flags' : 'No reading today', tone: '' };
}

export function BodyMap({ region }: { region?: RegionId }) {
  const { ev, symptoms, now } = useApp();
  const { go } = useNav();
  const [sel, setSel] = useState<RegionId>(region ?? 'head');
  const [flat, setFlat] = useState(false);
  const info = REGIONS[sel];
  const inRegion = (r: RegionId) => INDICATORS.filter((i) => INFO[i].region === r);
  const flagged = ORDER.filter((r) => inRegion(r).some((i) => ev.statuses[i].status === 'watch' || ev.statuses[i].status === 'act'));
  const here = symptoms.filter((s) => s.region === sel && sameDay(s.at, now));
  const ids = inRegion(sel);
  const actRegions = ORDER.filter((r) => inRegion(r).some((i) => ev.statuses[i].status === 'act'));
  return (
    <>
      <section className="mhead">
        <h1 tabIndex={-1}>Body map</h1>
        <p className="sm muted">Measurements grouped by body region. A flagged region has a measurement flagged by a demo rule; it is not a finding about that organ.</p>
      </section>
      <div className="today fill bodymap">
        <div className="main-col bm-main">
          {/* Model slot: corrected 3D model B; the 2D figure takes over if WebGL or the shader fails. */}
          <div className="bm-figure">
            <div className="bm-slot" id="bm-figure"><Body3D selected={sel} flagged={flagged} act={actRegions} onPick={setSel} height="100%" onFallback={setFlat} fallback={<Figure selected={sel} flagged={flagged} onPick={setSel} />} /></div>
            <button type="button" className="bm-jump" onClick={() => jumpTo('bm-detail')}>View {info.name} details ↓</button>
            {flagged.includes('whole') && <p className="bm-whole">Whole body · {regionState(inRegion('whole'), ev, now).text}</p>}
            <p className="bm-key" aria-hidden="true"><span><i className={`k sel${flat ? ' flat' : ''}`} />Selected region</span>{flat ? <><span><i className="k watch" />Watch</span><span><i className="k act" />Act</span></> : <><span className="kb watch">{Icon.watch}Watch</span><span className="kb act">{Icon.act}Act</span></>}</p>
            <p className="bm-help">{flat ? 'Tap a region or choose it from the list. 2D navigation aid, not anatomy.' : 'Drag to turn. Tap a region or choose it from the list. AI-generated figure; a navigation aid, not anatomy.'}</p>
          </div>
          <ul className="bm-regions" aria-label="Regions">
            {ORDER.map((r) => {
              const s = regionState(inRegion(r), ev, now);
              return (
                <li key={r}>
                  <button type="button" className={`bm-row${sel === r ? ' sel' : ''}`} aria-pressed={sel === r} onClick={() => setSel(r)}>
                    <span className="bm-name">{REGIONS[r].name}</span>
                    <span className="bm-sys">{REGIONS[r].system}</span>
                    <span className={`bm-state ${s.tone}`}>{s.text}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
        <aside className="side bm-side">
          <div className="bm-scroll">
          <section className="panel stack-sm">
            <h2 className="rail-h" id="bm-detail">{info.name} · {info.system}</h2>
            <button type="button" className="bm-jump back" onClick={() => jumpTo('bm-figure')}>Back to body map ↑</button>
            <p className="sm">{info.fn}</p>
            <p className="sm"><b>In space.</b> {info.inSpace}</p>
            <p className="bm-cite">{info.sources.map((k, i) => <span key={k}>{i > 0 && ' · '}<a href={SOURCES[k].url} target="_blank" rel="noopener noreferrer">{SHORT[k] ?? SOURCES[k].label.split(',')[0]}<span className="sr"> (opens in new tab)</span></a></span>)}</p>
          </section>
          <section className="panel stack-sm">
            <h2 className="rail-h">Measurements here</h2>
            {ids.length ? (
              <ul className="bm-meas">
                {ids.map((i) => {
                  const s = ev.statuses[i];
                  const tone = s.status === 'watch' || s.status === 'act' ? s.status : '';
                  const word = tone ? (tone === 'act' ? 'Act' : 'Watch') : chipWord(i, s) ?? (i === 'alertness' && s.status === 'ok' ? 'Within demo band' : s.status === 'ok' ? 'No flag' : s.status === 'info' ? 'Logged' : '');
                  return (
                    <li key={i}>
                      <button type="button" className="bm-mrow" onClick={() => go({ view: 'indicator', id: i })}>
                        <span className="bm-mname">{INFO[i].name}</span>
                        <span className={`bm-state ${tone}`}>{word}</span>
                        <span className="bm-mval">{i === 'alertness' ? (ev.sessionToday ? <>{ev.sessionToday.z >= 0 ? '+' : '−'}{Math.abs(ev.sessionToday.z).toFixed(1)} demo SD · {clock(ev.sessionToday.at)}</> : 'Not tested today') : s.latest ? <>{plain(s.latest)} · {sameDay(s.latest.at, now) ? clock(s.latest.at) : age(s.latest.at, now)}</> : 'No reading'}</span>
                        {i === 'alertness' ? (ev.sessionToday && <span className="bm-src">{ev.sessionToday.provenance === 'synthetic' ? 'Simulated test result' : 'Measured on this device'}</span>) : s.latest && <span className="bm-src">{provLabel(s.latest.provenance)}</span>}
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : <p className="sm muted">This app does not measure muscle strength or bone density. You can report symptoms in this region.</p>}
          </section>
          <section className="panel stack-sm">
            <h2 className="rail-h">Symptoms here today</h2>
            {here.length ? <ul className="bm-meas">{here.map((s) => <li key={s.id} className="sm">{clock(s.at)} · {s.list.join(', ')}{s.tempC !== undefined ? ` · ${s.tempC.toFixed(1)} °C` : ''}</li>)}</ul> : <p className="sm muted">None reported.</p>}
          </section>
          </div>
          <div className="bm-action"><Btn onClick={() => go({ view: 'symptom', region: sel })}>Report a symptom here</Btn></div>
        </aside>
      </div>
      <Foot />
    </>
  );
}

const SIDES = ['Left', 'Right', 'Both', 'Centre', 'Not sure'] as const;

export function SymptomForm({ region }: { region?: RegionId }) {
  const { symptomDraft: d, setSymptomDraft, saveSymptom } = useApp();
  const { go } = useNav();
  const sel = d.region ?? region ?? null;
  const set = (patch: Partial<typeof d>) => setSymptomDraft({ ...d, region: sel, ...patch });
  const toggle = (s: string) => set({ list: d.list.includes(s) ? d.list.filter((x) => x !== s) : d.list.length < 5 ? [...d.list, s] : d.list });
  const tErr = tempError(d.temp);
  const ready = !!(sel && d.list.length) && !tErr;
  const summary = [sel ? REGIONS[sel].name + (d.side && d.side !== 'Not sure' ? ` (${d.side.toLowerCase()})` : '') : '', d.list.join(', '), d.temp.trim() && !tErr ? `${d.temp.trim().replace(',', '.')} °C` : ''].filter(Boolean).join(' · ');
  const submit = () => {
    if (!ready) return;
    const t = d.temp.trim().replace(',', '.');
    if (d.region === null && sel) setSymptomDraft({ ...d, region: sel });
    saveSymptom(t === '' ? undefined : Math.round(Number(t) * 10) / 10);
    go({ view: 'today' });
  };
  return (
    <form className="today form" onSubmit={(e) => { e.preventDefault(); submit(); }}>
      <div className="main-col">
        <section className="decision task formhead" aria-labelledby="sy-h">
          <p className="mark lg task"><b>Symptom report</b><span className="scope">kept on this device</span></p>
          <h1 id="sy-h" tabIndex={-1}>What do you notice?</h1>
        </section>
        <section className="panel q">
          <fieldset className="choices words">
            <legend>1. Location <span className="qsub">— choose one</span></legend>
            {ORDER.map((r) => <label key={r}><input type="radio" name="region" checked={sel === r} onChange={() => set({ region: r })} />{REGIONS[r].name}</label>)}
          </fieldset>
          <fieldset className="choices words">
            <legend className="sub">Your side — optional</legend>
            {SIDES.map((v) => <label key={v}><input type="radio" name="side" checked={d.side === v} onChange={() => set({ side: v })} />{v}</label>)}
          </fieldset>
        </section>
        <section className="panel q">
          <fieldset className="choices words">
            <legend>2. Symptoms <span className="qsub">— choose up to 5</span></legend>
            {SYMPTOMS.map((s) => <label key={s}><input type="checkbox" checked={d.list.includes(s)} onChange={() => toggle(s)} />{s}</label>)}
          </fieldset>
        </section>
        <section className="panel q">
          <Field id="stemp" label={<span className="qlabel">3. Temperature <span className="qsub">— optional</span></span>} unit="°C" value={d.temp} onChange={(v) => set({ temp: v })} error={tErr} />
        </section>
      </div>
      <aside className="side">
        <section className="panel stack-sm sticky">
          <p className={`ready${ready ? ' ok' : ''}`} aria-live="polite">{tErr ? 'Correct the highlighted value.' : ready ? summary : 'Choose a location and at least one symptom.'}</p>
          <Btn type="submit" variant="primary" disabled={!ready}>Save report</Btn>
          <Btn variant="quiet" onClick={() => go({ view: 'today' })}>Close, keep draft</Btn>
          <p className="sm muted">Draft kept on this device. Save adds it to your record. Saving does not notify the crew medical officer.</p>
        </section>
        <section className="panel preview-loc" aria-hidden="true">
            <h2 className="rail-h">Location preview</h2>
            <p className="sm">{sel ? REGIONS[sel].name : 'No location selected'}</p>
            <div className="locator"><Figure selected={sel} flagged={[]} onPick={() => undefined} /></div>
        </section>
      </aside>
      <div className="formfoot"><Foot kind="entry" /></div>
    </form>
  );
}

const actionLabel = (text: string) => { const t = text.replace(/\.$/, '').replace(/ taken$/i, ''); return t.charAt(0).toUpperCase() + t.slice(1); };

export function FlagView() {
  const app = useApp();
  const { go } = useNav();
  const { now, readings, sessions, symptoms, actions } = app;
  const items: { at: number; what: string; meta: string }[] = [];
  const mood = readings.find((r) => r.provenance === 'self-reported' && r.indicator === 'mood' && sameDay(r.at, now));
  const kss = readings.find((r) => r.provenance === 'self-reported' && r.indicator === 'sleepiness' && sameDay(r.at, now));
  if (mood || kss) items.push({ at: (mood ?? kss)!.at, what: `Check-in: ${[mood ? `mood ${mood.value} of 5` : '', kss ? `sleepiness ${kss.value} of 9` : ''].filter(Boolean).join(' · ')}`, meta: 'Entered by you' });
  readings.filter((r) => r.provenance === 'self-reported' && r.indicator !== 'mood' && r.indicator !== 'sleepiness' && sameDay(r.at, now))
    .forEach((r) => items.push({ at: r.at, what: `${INFO[r.indicator].name}: ${plain(r)}`, meta: 'Entered by you' }));
  sessions.filter((s) => s.valid && sameDay(s.at, now)).forEach((s) => items.push({
    at: s.at, what: `Alertness check: ${s.z >= 0 ? '+' : '−'}${Math.abs(s.z).toFixed(1)} demo SD · ${s.band === 'ok' ? 'Within demo band' : s.band === 'watch' ? 'Watch' : 'Act'}`,
    meta: s.provenance === 'synthetic' ? 'Simulated test result' : 'Measured on this device',
  }));
  symptoms.filter((s) => sameDay(s.at, now)).forEach((s) => items.push({ at: s.at, what: `Symptom report: ${s.region ? REGIONS[s.region].name : 'No location'} · ${s.list.join(', ')}`, meta: 'Entered by you' }));
  actions.filter((a) => sameDay(a.at, now)).forEach((a) => items.push({ at: a.at, what: `Recorded action: ${actionLabel(a.text)}`, meta: 'Entered by you' }));
  items.sort((x, y) => x.at - y.at);
  const n = items.length;
  return (
    <>
      <div className="today fill flagpage">
        <div className="main-col">
          <section className="decision task" aria-labelledby="fl-h">
            <p className="mark lg task"><b>Medical review</b><span className="scope">local only</span></p>
            <h1 id="fl-h" tabIndex={-1}>Mark these records for medical review</h1>
            <p className="reason">{n ? `${n} record${n === 1 ? '' : 's'} from today, as of ${clock(now)}.` : 'Nothing recorded yet today; the flag would carry no records.'}</p>
            <p className="notice warn"><b>No notification will be sent.</b> This prototype only saves the flag on this device.</p>
            <div className="row actions"><Btn variant="primary" onClick={() => { app.sendFlag(); go({ view: 'today' }); }}>Save flag locally</Btn><Btn variant="quiet" onClick={() => go({ view: 'today' })}>Cancel</Btn></div>
          </section>
          <section className="panel preview-recs" aria-labelledby="recs-h">
            <h2 id="recs-h">Records included</h2>
            {n ? (
              <ul className="recs">{items.map((x, i) => (
                <li key={i}><span className="what">{x.what}</span><span className="meta">{clock(x.at)} · {x.meta}</span></li>
              ))}</ul>
            ) : <p className="sm muted">None.</p>}
          </section>
        </div>
        <aside className="side">
          <section className="panel stack-sm">
            <h2 className="rail-h">On board</h2>
            <p>Tell the crew medical officer directly. Onboard help does not depend on the ground link.</p>
          </section>
          <section className="panel stack-sm">
            <h2 className="rail-h">Planned ground workflow — not implemented</h2>
            <p className="sm">Share locally flagged records with ground medical staff when a connection is available. No delivery or response time is guaranteed.</p>
          </section>
        </aside>
      </div>
      <Foot kind="records" />
    </>
  );
}
