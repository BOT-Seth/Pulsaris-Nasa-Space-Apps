import { useCallback, useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { SOURCES } from '../domain/content';
import {
  DURATION_MS, FALSE_START_MS, LAPSE_MS, MAX_FALSE_STARTS, REFERENCE, TIMEOUT_MS, WARMUP_TRIALS,
  personalBaseline, scoreRun, type Comparison, type RawRun,
} from '../domain/pvt';
import { latest } from '../domain/rules';
import { clock, sameDay } from '../domain/time';
import type { Protocol, PvtSession } from '../domain/types';
import { useApp } from '../state/store';
import { Btn, Icon, Prov } from '../ui/primitives';
import { Mark } from './Today';
import { Back, Foot, RecheckControls, useNav } from '../ui/shared';

const PAUSE_LIMIT_MS = 120000;

function useComparison(): Comparison {
  const { sessions } = useApp();
  const rested = sessions.filter((s) => s.valid && s.rested && s.protocol === 'pvt-b-3min' && s.provenance === 'measured-here').map((s) => s.speed);
  return personalBaseline(rested) ?? { ...REFERENCE, kind: 'nasa-reference' };
}

/* ---------- The timed test ---------- */

type Phase = 'waiting' | 'stimulus' | 'feedback' | 'early' | 'paused';

function PvtTest({ protocol, onDone }: { protocol: Protocol; onDone: (run: RawRun) => void }) {
  const [phase, setPhase] = useState<Phase>('waiting');
  const [shown, setShown] = useState('');
  const [left, setLeft] = useState(DURATION_MS[protocol]);
  const msRef = useRef<HTMLSpanElement>(null);
  const st = useRef({ start: 0, onset: 0, rts: [] as number[], falseStarts: 0, timer: 0, raf: 0, pausedAt: 0, phase: 'waiting' as Phase, done: false });

  const finish = useCallback((interrupted: boolean) => {
    const s = st.current;
    if (s.done) return;
    s.done = true;
    window.clearTimeout(s.timer); cancelAnimationFrame(s.raf);
    onDone({ rts: s.rts, falseStarts: s.falseStarts, interrupted });
  }, [onDone]);

  const set = (p: Phase) => { st.current.phase = p; setPhase(p); };

  const nextGap = useCallback(() => {
    const s = st.current;
    if (performance.now() - s.start >= DURATION_MS[protocol]) { finish(false); return; }
    set('waiting');
    // Gap before each signal: uniform 1-4 s, so it cannot be predicted (Basner et al. 2011).
    s.timer = window.setTimeout(() => {
      // Commit the signal to the DOM now, so the next frame is the one that paints it.
      flushSync(() => set('stimulus'));
      // Provisional onset, in case no animation frame arrives (hidden or throttled tab).
      // It can only make a reaction time read longer, never shorter.
      s.onset = performance.now();
      s.raf = requestAnimationFrame((t) => {
        // Onset is stamped on the frame that paints the signal.
        if (t > s.onset) s.onset = t;
        const loop = (now: number) => {
          if (st.current.phase !== 'stimulus') return;
          if (msRef.current) msRef.current.textContent = String(Math.max(0, Math.round(now - s.onset)));
          s.raf = requestAnimationFrame(loop);
        };
        s.raf = requestAnimationFrame(loop);
      });
      // No response within 30 s counts as a lapse. A timer, so it does not depend on frames.
      s.timer = window.setTimeout(() => {
        if (st.current.phase !== 'stimulus') return;
        cancelAnimationFrame(s.raf);
        s.rts.push(TIMEOUT_MS); setShown('No response'); feedback();
      }, TIMEOUT_MS);
    }, 1000 + Math.random() * 3000);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [protocol, finish]);

  const feedback = () => {
    const s = st.current;
    set('feedback');
    s.timer = window.setTimeout(nextGap, 1000);
  };

  const respond = useCallback((timeStamp: number) => {
    const s = st.current;
    if (s.done || s.phase === 'paused' || s.phase === 'feedback' || s.phase === 'early') return;
    const rt = s.phase === 'stimulus' ? timeStamp - s.onset : -1;
    if (s.phase === 'waiting' || rt < FALSE_START_MS) {
      s.falseStarts++;
      window.clearTimeout(s.timer); cancelAnimationFrame(s.raf);
      if (s.falseStarts > MAX_FALSE_STARTS) { finish(false); return; }
      set('early');
      s.timer = window.setTimeout(nextGap, 1000);
      return;
    }
    window.clearTimeout(s.timer); cancelAnimationFrame(s.raf);
    s.rts.push(rt);
    setShown(`${Math.round(rt)} ms`);
    feedback();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finish, nextGap]);

  useEffect(() => {
    const s = st.current;
    s.start = performance.now();
    if (document.hidden) { s.pausedAt = performance.now(); set('paused'); } else nextGap();
    const tick = window.setInterval(() => {
      if (st.current.phase !== 'paused') setLeft(Math.max(0, DURATION_MS[protocol] - (performance.now() - s.start)));
    }, 500);
    const key = (e: KeyboardEvent) => { if (e.code === 'Space' || e.code === 'Enter') { e.preventDefault(); if (!e.repeat) respond(e.timeStamp); } };
    const vis = () => {
      if (document.hidden && st.current.phase !== 'paused') {
        window.clearTimeout(s.timer); cancelAnimationFrame(s.raf);
        s.pausedAt = performance.now();
        set('paused');
      }
    };
    window.addEventListener('keydown', key);
    document.addEventListener('visibilitychange', vis);
    return () => { window.clearInterval(tick); window.clearTimeout(s.timer); cancelAnimationFrame(s.raf); window.removeEventListener('keydown', key); document.removeEventListener('visibilitychange', vis); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resume = () => {
    const s = st.current;
    const away = performance.now() - s.pausedAt;
    if (away > PAUSE_LIMIT_MS) { finish(true); return; }
    s.start += away; // paused time does not count toward the test
    nextGap();
  };

  const sec = Math.ceil(left / 1000);
  return (
    <div className="pvt" onPointerDown={(e) => { if (!(e.target as HTMLElement).closest('button')) respond(e.timeStamp); }} aria-label="Alertness test. Tap anywhere, or press Space, when the signal appears.">
      <div className="left cap"><span className="num">{Math.floor(sec / 60)}:{String(sec % 60).padStart(2, '0')}</span> left</div>
      {phase === 'paused' ? (
        <div className="stack" style={{ justifyItems: 'center' }}>
          <p className="big">Paused</p>
          <p className="sm muted">The test stopped because the screen was hidden. Resume within 2 minutes, or it is not scored.</p>
          <div className="row"><Btn variant="primary" onClick={resume}>Resume</Btn><Btn onClick={() => finish(true)}>Stop. Not scored</Btn></div>
        </div>
      ) : (
        <div className={`ring${phase === 'stimulus' ? ' on' : ''}`} aria-live="off">
          {phase === 'stimulus' && <span className="ms" ref={msRef}>0</span>}
          {phase === 'feedback' && <span className="ms" style={{ fontSize: 34 }}>{shown}</span>}
          {phase === 'early' && <span className="big">Too early</span>}
          {phase === 'waiting' && <span className="muted">Wait for the signal</span>}
        </div>
      )}
      {phase !== 'paused' && (
        <div className="hint row" style={{ justifyContent: 'center' }}>
          <span className="sm muted">Tap anywhere, or press Space</span>
          <Btn small onClick={() => finish(true)}>Stop. Not scored</Btn>
        </div>
      )}
    </div>
  );
}

/* ---------- Instructions, test, hand-off to the result ---------- */

export function Check() {
  const app = useApp();
  const { go } = useNav();
  const [running, setRunning] = useState(false);
  const against = useComparison();
  const { readings, now, ev, shortTest, recheckAt } = app;
  const kss = latest(readings, 'sleepiness');
  const kssToday = kss && sameDay(kss.at, now) && now - kss.at < 120 ? kss : null;
  const sleep = latest(readings, 'sleep');
  const protocol: Protocol = shortTest ? 'demo-short' : 'pvt-b-3min';
  const trigger: PvtSession['trigger'] = recheckAt !== null || ev.issues.some((i) => i.id === 'alertness-followup') ? 're-check'
    : ev.issues.some((i) => i.id === 'alertness-check') ? 'recommended' : 'pre-task';
  const rested = !!kss && sameDay(kss.at, now) && kss.value <= 4 && !!sleep && sameDay(sleep.at, now) && sleep.value >= 420;

  const save = (run: RawRun, provenance: PvtSession['provenance'], proto: Protocol) => {
    const scored = scoreRun(run, against);
    const id = app.addSession({ ...scored, protocol: proto, trigger, provenance, rested });
    go({ view: 'result', id });
  };
  // Sample outcomes for demos and video. Stored as synthetic, never as a measurement.
  const SAMPLES = {
    // 21 responses near 210 ms plus 4 lapses: about 1.2 SD slower than the reference. Band: Watch.
    watch: { rts: [212, 205, 218, 209, 214, 361, 207, 216, 211, 204, 358, 213, 208, 219, 206, 364, 215, 210, 203, 217, 357, 209, 212, 206, 214], fs: 1 },
    // Clearly slowed, 7 lapses. Band: Act.
    act: { rts: [246, 262, 239, 371, 255, 248, 402, 259, 244, 366, 251, 268, 243, 389, 257, 249, 372, 261, 245, 254, 418, 247, 258, 363, 252], fs: 2 },
    // Near the reference, 1 lapse. Band: OK.
    ok: { rts: [208, 221, 199, 214, 226, 205, 217, 211, 230, 202, 219, 209, 224, 213, 207, 361, 216, 204, 222, 210, 218, 206, 215, 212, 220], fs: 0 },
  } as const;
  const sample = (kind: keyof typeof SAMPLES) => {
    app.jump(3);
    save({ rts: [240, 230, 235, ...SAMPLES[kind].rts], falseStarts: SAMPLES[kind].fs, interrupted: false }, 'synthetic', 'pvt-b-3min');
  };

  if (running) return <PvtTest protocol={protocol} onDone={(run) => save(run, 'measured-here', protocol)} />;
  return (
    <>
      <Back to={{ view: 'today' }} label="Today. The check stays pending" />
      <section className="panel stack">
        <h3>Alertness check · {shortTest ? '45 seconds, demo length' : '3 minutes'}</h3>
        <h1 tabIndex={-1}>Before you start</h1>
        <ol className="steps"><li>1 Sleepiness</li><li aria-current="step">2 Instructions</li><li>3 Test</li><li>4 Result</li></ol>
        <p className="sm muted">{kssToday ? `Sleepiness already logged at ${clock(kssToday.at)} (${kssToday.value} of 9). Not asked again within 2 h.` : 'Sleepiness not logged in the last 2 h. Add it in the daily check-in for context; the test decides the result.'}</p>
        <p>A signal appears at random moments. Tap anywhere, or press Space, as soon as you see it.</p>
        <p>The first {WARMUP_TRIALS} taps are practice. A response of {LAPSE_MS} ms or slower counts as a lapse. If you are interrupted for more than 2 minutes, the session is not scored.</p>
        {shortTest && <p className="notice warn">Demo length is on. A 45-second run is not the validated 3-minute test. Its result is labeled and is indicative only.</p>}
        <div className="row"><Btn variant="primary" onClick={() => setRunning(true)}>Start test</Btn></div>
        <p className="state">Compared with {against.kind === 'nasa-reference' ? 'the NASA ISS pre-flight reference (24 astronauts). Your own baseline needs 3 rested sessions.' : 'your own baseline of rested sessions.'}</p>
      </section>
      <section className="panel">
        <div className="demo">
          <div className="cap" style={{ letterSpacing: '0.08em' }}>DEMO · SKIP THE TEST WITH A SAMPLE OUTCOME</div>
          <p className="sm">Loads a synthetic session, stored and labeled as synthetic. The clock jumps 3 minutes.</p>
          <div className="row"><Btn small onClick={() => sample('watch')}>Load slower sample</Btn><Btn small onClick={() => sample('act')}>Load much slower sample</Btn><Btn small onClick={() => sample('ok')}>Load normal sample</Btn></div>
        </div>
      </section>
    </>
  );
}

/* ---------- Result: plain-language result, the step, then the evidence ---------- */

/** Compact comparison plot: the reading against the reference band and the band rule cut-offs. */
function ComparePlot({ s }: { s: PvtSession }) {
  const ref = s.comparedWith === 'nasa-reference';
  const mean = s.speed - s.z * REFERENCE.sd, sd = REFERENCE.sd;
  const lo = mean - 2.5 * sd, hi = mean + 3 * sd;
  const W = 520, L = 16, R = 16, Y = 54;
  const x = (v: number) => L + ((Math.min(hi, Math.max(lo, v)) - lo) / (hi - lo)) * (W - L - R);
  const over = s.speed > hi, under = s.speed < lo;
  const tone = s.band === 'act' ? 'var(--act)' : s.band === 'watch' ? 'var(--watch)' : 'var(--ink)';
  const label = `${Math.abs(s.z).toFixed(1)} SD ${s.z >= 0 ? 'slower' : 'faster'}`;
  return (
    <figure className="compare">
      <svg viewBox={`0 0 ${W} 112`} role="img" aria-label={`Speed score ${s.speed.toFixed(2)}, ${label} than ${ref ? 'the NASA ISS pre-flight reference' : 'your baseline'} of ${mean.toFixed(2)} plus or minus ${sd.toFixed(2)}. Watch from 1 SD slower, Act from 1.5 SD slower.`}>
        <rect x={x(mean - sd)} y={Y - 14} width={x(mean + sd) - x(mean - sd)} height={28} fill="rgba(20,21,23,0.08)" />
        <line x1={L} x2={W - R} y1={Y} y2={Y} stroke="var(--rail)" strokeWidth="2" />
        <line x1={x(mean)} x2={x(mean)} y1={Y - 14} y2={Y + 14} stroke="var(--ink)" strokeWidth="1.5" />
        <line x1={x(mean + sd)} x2={x(mean + sd)} y1={Y - 20} y2={Y + 20} stroke="var(--watch)" strokeWidth="1.5" strokeDasharray="3 3" />
        <line x1={x(mean + 1.5 * sd)} x2={x(mean + 1.5 * sd)} y1={Y - 20} y2={Y + 20} stroke="var(--act)" strokeWidth="1.5" strokeDasharray="3 3" />
        <text x={x(mean)} y={Y + 34} textAnchor="middle">{ref ? 'Reference' : 'Baseline'} {mean.toFixed(2)}</text>
        <text x={x(mean + sd) - 5} y={Y - 26} textAnchor="end" fill="var(--watch-text)">Watch</text>
        <text x={x(mean + 1.5 * sd) + 5} y={Y - 26} textAnchor="start" fill="var(--act-text)">Act</text>
        <text x={L} y={Y + 34}>← faster</text>
        <text x={W - R} y={Y + 34} textAnchor="end">slower →</text>
        <circle cx={x(s.speed)} cy={Y} r="8" fill={tone} stroke="var(--bg)" strokeWidth="2.5" />
        {(over || under) && <path d={over ? `M${W - R - 2} ${Y - 6} l8 6 -8 6z` : `M${L + 2} ${Y - 6} l-8 6 8 6z`} fill={tone} />}
        <text x={x(s.speed)} y={Y + 56} textAnchor={over ? 'end' : under ? 'start' : 'middle'} className="strong">This check {s.speed.toFixed(2)}{over || under ? ' (off scale)' : ''}</text>
      </svg>
      <figcaption className="cap">Speed score = 10 − mean(1/RT). Lower is faster. Band: {ref ? 'NASA ISS astronauts before flight, N = 24 (Dev et al. 2024)' : 'your rested sessions'}, ±1 SD.</figcaption>
    </figure>
  );
}

const STEPS = ['Result', 'Do the step', 'Record it', 'Re-check'];

export function Result({ id }: { id: string }) {
  const app = useApp();
  const { go } = useNav();
  const s = app.sessions.find((x) => x.id === id);
  if (!s) return <><Back to={{ view: 'today' }} label="Today" /><section className="panel"><h1 tabIndex={-1}>Result not found</h1></section></>;
  const ref = s.comparedWith === 'nasa-reference';
  const refText = ref ? 'the NASA ISS pre-flight reference' : 'your own rested baseline';
  const isOpen = app.ev.sessionToday?.id === s.id && s.band !== 'ok';
  const acted = app.actions.filter((a) => a.issue === 'alertness-result' && a.at >= s.at).slice(-1)[0];
  const earlier = app.sessions.filter((x) => x.valid && x.at < s.at && sameDay(x.at, s.at) && x.band !== 'ok').slice(-1)[0];
  const demo = s.protocol === 'demo-short' ? ' Demo length, 45 s, indicative only.' : '';

  if (!s.valid) {
    return (
      <>
        <Back to={{ view: 'today' }} label="Today" />
        <section className="decision" aria-labelledby="res-h">
          <p className="mark lg task">{Icon.none}<b>Not scored</b><span className="scope">Alertness check · {clock(s.at)}</span></p>
          <h1 id="res-h" tabIndex={-1}>This session was not scored</h1>
          <p className="reason">{s.invalidReason} No result was recorded, so your alertness is still not assessed.</p>
          <div className="row actions"><Btn variant="primary" onClick={() => go({ view: 'check' })}>Run it again</Btn><Btn variant="quiet" onClick={() => go({ view: 'today' })}>Back to Today</Btn></div>
        </section>
        <Foot />
      </>
    );
  }

  const cmp = `${Math.abs(s.z).toFixed(1)} SD ${s.z >= 0 ? 'slower' : 'faster'}`;
  const act = s.band === 'act';
  const stage = s.band === 'ok' ? 4 : acted ? 3 : 1;
  const headline = s.band === 'ok' ? 'Alertness within the reference range' : act ? 'Rest now if your schedule allows' : 'Take a short movement break';
  const stepText = act ? 'Nap 20 to 30 minutes if the schedule allows. Postpone or double-check critical tasks.' : 'A few minutes of movement. Then double-check critical tasks today.';
  return (
    <>
      <Back to={{ view: 'today' }} label="Today" />
      <div className="today">
        <div className="main-col">
          <section className={`decision ${s.band}`} aria-labelledby="res-h">
            <Mark kind={s.band} scope={`Alertness check · ${clock(s.at)}`} large />
            <h1 id="res-h" tabIndex={-1}>{headline}</h1>
            <p className="reason">
              This check was {cmp} than {refText}, with {s.lapses} lapse{s.lapses === 1 ? '' : 's'} in {s.trials} responses.
              {s.band === 'ok' && earlier ? <> It is new evidence after the <span className="num">{clock(earlier.at)}</span> result, so the alertness concern from that check is closed.</> : null}
            </p>
            {s.band === 'ok' && <div className="row actions"><Btn variant="primary" onClick={() => go({ view: 'today' })}>Return to Today</Btn></div>}
            {isOpen && !acted && (
              <div className="row actions">
                <Btn variant="primary" onClick={() => app.recordAction('alertness-result', act ? 'Rest taken.' : 'Movement break taken.')}>{act ? 'Record completed rest' : 'Record completed break'}</Btn>
                {act && !app.flag && <Btn onClick={() => go({ view: 'flag' })}>Flag crew medical officer</Btn>}
              </div>
            )}
            {isOpen && acted && <div className="stack-sm"><p className="sm">Recorded <span className="num">{clock(acted.at)}</span>: {acted.text} The concern stays open until the re-check.</p><RecheckControls /></div>}
            <p className="limit">{s.band === 'ok' ? 'Covers alertness only. Sleep, sleepiness and other readings are unchanged by this check. ' : 'Do the step first, then record it. Recording does not close the concern. '}A screening result, not a fitness-for-duty decision.{demo}</p>
          </section>

          <section className="panel stack-sm">
            <h2>How this check compares</h2>
            <div className="evid">
              <ComparePlot s={s} />
              <dl className="facts">
                <dt>Lapses</dt><dd><span className="num">{s.lapses}</span> of <span className="num">{s.trials}</span> · {LAPSE_MS} ms or slower</dd>
                <dt>False starts</dt><dd className="num">{s.falseStarts}</dd>
                <dt>Median response</dt><dd className="num">{s.medianMs} ms</dd>
                <dt>Source</dt><dd><Prov p={s.provenance} /></dd>
              </dl>
            </div>
          </section>

          {s.band !== 'ok' && (
            <section className="panel stack-sm">
              <h2>Fatigue steps <span className="sm muted">· draft, not medically reviewed</span></h2>
              <ol className="steplist">
                <li>{stepText}</li>
                <li>Bright light and caffeine only as your flight surgeon’s plan allows, and not close to your next sleep. No plan is loaded in this prototype.</li>
                <li>Re-check alertness 30 to 60 minutes after the step.</li>
              </ol>
              <p className="cap">Based on <a href={SOURCES.sleepRisk.url} target="_blank" rel="noopener noreferrer">{SOURCES.sleepRisk.label}<span className="sr"> (opens in new tab)</span></a>. A general risk page, not a validated procedure.</p>
            </section>
          )}

          <section className="panel tight">
            <details>
              <summary><h2>Numbers and method</h2><span className="cap">Speed score {s.speed.toFixed(2)} · {cmp}</span></summary>
              <div className="body">
                <dl className="kv">
                  <dt>Speed score</dt><dd><span className="num">{s.speed.toFixed(2)}</span> · 10 − mean(1/RT) · lower is faster</dd>
                  <dt>Comparison</dt><dd><span className="num">{(s.speed - s.z * REFERENCE.sd).toFixed(2)} ± {REFERENCE.sd.toFixed(2)}</span> · difference ÷ SD = <span className="num">{s.z.toFixed(2)}</span> SD</dd>
                  <dt>Mean response speed</dt><dd><span className="num">{s.meanRecip.toFixed(2)} per s</span></dd>
                  <dt>Protocol</dt><dd>{s.protocol === 'pvt-b-3min' ? '3 minutes, 1–4 s random gaps, first 3 trials not scored' : '45 seconds, demo length. Not the validated protocol.'}</dd>
                  <dt>Band rule</dt><dd>Watch: 1 to 1.5 SD slower, or 3 to 5 lapses. Act: 1.5 SD or more, 6 or more lapses, or 4 or more false starts. Demo rule, not validated.</dd>
                </dl>
                <p className="cap">Tablet display and touch latency are not benchmarked, so the comparison is indicative only. Lapse threshold: Basner et al. 2011 (PVT-B).</p>
              </div>
            </details>
          </section>
        </div>
        <aside className="side">
          <section className="panel stack-sm">
            <h2>What happens next</h2>
            <ol className="flow">
              {STEPS.map((t, i) => <li key={t} className={i < stage ? 'done' : i === stage ? 'now' : ''}><span className="num">{i + 1}</span>{t}</li>)}
            </ol>
            <p className="sm muted">{s.band === 'ok' ? 'No step needed from this check.' : acted ? 'Step recorded. Choose or wait for the re-check.' : 'Do the step, then record it here.'}</p>
          </section>
          <section className="panel stack-sm">
            <h2>Symptoms and support</h2>
            <p className="sm muted">Feeling unwell is worth reporting whatever this result says.</p>
            <div className="row"><Btn onClick={() => go({ view: 'symptom' })}>Report a symptom</Btn></div>
          </section>
        </aside>
      </div>
      <Foot />
    </>
  );
}
