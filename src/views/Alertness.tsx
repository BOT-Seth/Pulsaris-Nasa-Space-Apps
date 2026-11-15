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
import { Foot, useNav } from '../ui/shared';

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
  const [count, setCount] = useState(0);
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
    if (s.start >= 0 && performance.now() - s.start >= DURATION_MS[protocol]) { finish(false); return; }
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
    setCount(s.rts.length);
    // The timed test begins once the practice responses are done.
    if (s.start < 0 && s.rts.length >= WARMUP_TRIALS) s.start = performance.now();
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
    document.body.classList.add('testing');
    return () => document.body.classList.remove('testing');
  }, []);

  useEffect(() => {
    const s = st.current;
    s.start = -1;
    if (document.hidden) { s.pausedAt = performance.now(); set('paused'); } else nextGap();
    const tick = window.setInterval(() => {
      if (st.current.phase !== 'paused') setLeft(s.start < 0 ? DURATION_MS[protocol] : Math.max(0, DURATION_MS[protocol] - (performance.now() - s.start)));
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
    if (s.start >= 0) s.start += away; // paused time does not count toward the test
    nextGap();
  };

  const sec = Math.ceil(left / 1000);
  const practice = count < WARMUP_TRIALS;
  return (
    <div className="testmode">
      <div className="testbar">
        <span className="phase">{phase === 'paused' ? 'Paused' : practice ? `Practice · ${Math.min(count + 1, WARMUP_TRIALS)} of ${WARMUP_TRIALS}` : 'Timed test'}</span>
        <span className="num">{practice ? 'Timed test starts after practice' : `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')} left`}</span>
      </div>
      <div className="pvt" onPointerDown={(e) => { if (phase !== 'paused') respond(e.timeStamp); }} aria-label="Response area. Tap here, or press Space, when the signal appears.">
        {phase === 'paused' ? (
          <div className="stack" style={{ justifyItems: 'center' }} onPointerDown={(e) => e.stopPropagation()}>
            <p className="big">Paused</p>
            <p className="sm muted">The screen was hidden. Resume within 2 minutes, or this attempt is not scored.</p>
            <div className="row"><Btn variant="primary" onClick={resume}>Resume</Btn></div>
          </div>
        ) : (
          <div className={`ring${phase === 'stimulus' ? ' on' : ''}`} aria-live="off">
            {phase === 'stimulus' && <span className="ms" ref={msRef}>0</span>}
            {phase === 'feedback' && <span className="ms" style={{ fontSize: 34 }}>{shown}</span>}
            {phase === 'early' && <span className="big">Too early</span>}
            {phase === 'waiting' && <span className="muted">Wait for the signal</span>}
          </div>
        )}
        <p className="hint sm muted">Tap this area, or press Space</p>
      </div>
      <div className="teststrip"><Btn onClick={() => finish(true)}>End test · no score</Btn></div>
    </div>
  );
}

/* ---------- Instructions, test, hand-off to the result ---------- */

/** Saves a run as a session and opens its result. Shared by the test and the demo drawer. */
export function useRunSaver() {
  const app = useApp();
  const { go } = useNav();
  const against = useComparison();
  const { readings, now, ev, recheckAt } = app;
  const kss = latest(readings, 'sleepiness');
  const sleep = latest(readings, 'sleep');
  const trigger: PvtSession['trigger'] = recheckAt !== null || ev.issues.some((i) => i.id === 'alertness-followup') ? 're-check'
    : ev.issues.some((i) => i.id === 'alertness-check') ? 'recommended' : 'pre-task';
  const rested = !!kss && sameDay(kss.at, now) && kss.value <= 4 && !!sleep && sameDay(sleep.at, now) && sleep.value >= 420;
  const save = (run: RawRun, provenance: PvtSession['provenance'], proto: Protocol) => {
    const scored = scoreRun(run, against);
    const id = app.addSession({ ...scored, protocol: proto, trigger, provenance, rested });
    go({ view: 'result', id });
  };
  // Sample outcomes for demos and video. Stored as simulated, never as a measurement.
  const SAMPLES = {
    // 21 responses near 210 ms plus 4 lapses: about 1.3 SD slower than the reference. Band: Watch.
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
  return { save, sample, against };
}

export function Check() {
  const app = useApp();
  const { go } = useNav();
  const [running, setRunning] = useState(false);
  const { save, against } = useRunSaver();
  const { readings, now, shortTest } = app;
  const kss = latest(readings, 'sleepiness');
  const kssToday = kss && sameDay(kss.at, now) && now - kss.at < 120 ? kss : null;
  const protocol: Protocol = shortTest ? 'demo-short' : 'pvt-b-3min';

  if (running) return <PvtTest protocol={protocol} onDone={(run) => save(run, 'measured-here', protocol)} />;
  return (
    <>
      <div className="today fixed">
        <div className="main-col">
          <section className="decision task" aria-labelledby="chk-h">
            <p className="mark lg task">{Icon.due}<b>Alertness check</b><span className="scope">{shortTest ? '3 practice + 45 s, demo length' : '3 practice responses + 3 min'}</span></p>
            <h1 id="chk-h" tabIndex={-1}>Before you start</h1>
            <ol className="bigsteps">
                <li><span><b>Three practice responses,</b> then a {shortTest ? '45-second' : '3-minute'} timed test.</span></li>
                <li><span><b>Tap the response area, or press Space,</b> as soon as the signal appears.</span></li>
                <li><span><b>If interrupted,</b> end this attempt and restart when ready.</span></li>
            </ol>
            <div className="row actions">
              <Btn variant="primary" onClick={() => setRunning(true)}>Start test</Btn>
              <Btn variant="quiet" onClick={() => go({ view: 'today' })}>Not now</Btn>
            </div>
            {shortTest && <p className="limit"><b>Demo length is on.</b> A 45-second run is not the validated 3-minute test; its result is indicative only.</p>}
          </section>
          <section className="band" aria-label="Signal example">
            <h2 className="rail-h">Signal example</h2>
            <figure className="signal-demo">
              <div className="ring on"><span className="ms">214</span></div>
              <figcaption>When the black signal appears, tap immediately. The number shows elapsed milliseconds.</figcaption>
            </figure>
          </section>
          <section className="panel tight disclosures onerow">
            <details>
              <summary><h2>How this is scored</h2></summary>
              <div className="body">
                <p>The first {WARMUP_TRIALS} responses are practice and are not scored. A response of {LAPSE_MS} ms or slower counts as a lapse; a tap before the signal is a false start.</p>
                <p>If the screen is hidden, the test pauses. Resuming more than 2 minutes later ends the attempt without a score. This 2-minute limit is a prototype rule.</p>
                <p>Your speed is compared with {against.kind === 'nasa-reference' ? 'the NASA ISS pre-flight reference (24 astronauts, Dev et al. 2024). Your own baseline needs 3 rested sessions.' : 'your own rested sessions.'}</p>
                <p className="sm muted">Watch and Act cut-offs are demo rules, not clinically validated. Tablet display and touch timing are not benchmarked.</p>
              </div>
            </details>
          </section>
        </div>
        <aside className="side">
          <section className="panel stack-sm">
            <h2 className="rail-h">Sleepiness</h2>
            <p className="sm">{kssToday ? <>Logged at <span className="num">{clock(kssToday.at)}</span>: {kssToday.value} of 9. Not asked again within 2 h.</> : 'Not logged in the last 2 hours. The daily check-in records it; the test result does not depend on it.'}</p>
          </section>
        </aside>
      </div>
      <Foot kind="test" />
    </>
  );
}

/* ---------- Result: the suggested step first, then the evidence ---------- */

/** Difference from the study reference, in SD. Positive is slower. Watch and Act lines are demo thresholds. */
function ComparePlot({ s }: { s: PvtSession }) {
  const W = 496, L = 20, R = 28, Y = 54;
  const lo = -1.5, hi = 3.5;
  const x = (z: number) => L + ((Math.min(hi, Math.max(lo, z)) - lo) / (hi - lo)) * (W - L - R);
  const over = s.z > hi, under = s.z < lo;
  const tone = s.band === 'act' ? 'var(--act)' : s.band === 'watch' ? 'var(--watch)' : 'var(--ink)';
  const zTxt = `${s.z >= 0 ? '+' : '−'}${Math.abs(s.z).toFixed(1)} SD`;
  return (
    <figure className="compare">
      <svg viewBox={`0 0 ${W} 112`} role="img" aria-label={`Result ${zTxt}${over || under ? ', off scale' : ''}. Study reference band plus or minus 1 SD. Demo thresholds: Watch at plus 1 SD, Act at plus 1.5 SD.`}>
        <text x={W - R} y={14} textAnchor="end" className="strong">Result: {zTxt}{over || under ? ' · off scale' : ''}</text>
        <rect x={x(-1)} y={Y - 16} width={x(1) - x(-1)} height={32} fill="rgba(20,21,23,0.08)" />
        <text x={x(-1)} y={Y - 22}>Study reference ±1 SD</text>
        <line x1={L} x2={W - R} y1={Y} y2={Y} stroke="var(--rail)" strokeWidth="2" />
        {[-1, 0, 1, 2, 3].map((t) => (
          <g key={t}>
            <line x1={x(t)} x2={x(t)} y1={Y + 18} y2={Y + 24} stroke="var(--ink-2)" strokeWidth="1" />
            <text x={x(t)} y={Y + 40} textAnchor="middle">{t > 0 ? `+${t}` : t < 0 ? `−${-t}` : '0'}</text>
          </g>
        ))}
        <line x1={x(1)} x2={x(1)} y1={Y - 16} y2={Y + 16} stroke="var(--watch)" strokeWidth="2" strokeDasharray="3 3" />
        <line x1={x(1.5)} x2={x(1.5)} y1={Y - 16} y2={Y + 16} stroke="var(--act)" strokeWidth="2" strokeDasharray="3 3" />
        <text x={L} y={Y + 58}>← Faster</text>
        <text x={W - R} y={Y + 58} textAnchor="end">Slower →</text>
        {over || under
          ? <path d={over ? `M${W - R - 8} ${Y - 9} l14 9 -14 9z` : `M${L + 8} ${Y - 9} l-14 9 14 9z`} fill={tone} />
          : <circle cx={x(s.z)} cy={Y} r="7" fill={tone} stroke="var(--bg)" strokeWidth="2" />}
      </svg>
      <figcaption className="key">
        <span><i className="dash watch" />Demo Watch: +1 SD</span>
        <span><i className="dash act" />Demo Act: +1.5 SD</span>
      </figcaption>
    </figure>
  );
}

export function Result({ id }: { id: string }) {
  const app = useApp();
  const { go } = useNav();
  const s = app.sessions.find((x) => x.id === id);
  if (!s) return <section className="panel"><h1 tabIndex={-1}>Result not found</h1></section>;
  const ref = s.comparedWith === 'nasa-reference';
  const simulated = s.provenance === 'synthetic';
  const isOpen = app.ev.sessionToday?.id === s.id && s.band !== 'ok';
  const acted = app.actions.filter((a) => a.issue === 'alertness-result' && a.at >= s.at).slice(-1)[0];
  const earlier = app.sessions.filter((x) => x.valid && x.at < s.at && sameDay(x.at, s.at) && x.band !== 'ok').slice(-1)[0];
  const scopeTxt = `Alertness check · ${clock(s.at)}${simulated ? ' · Simulated result' : ''}`;
  const { recheckAt, now, flag } = app;

  if (!s.valid) {
    return (
      <>
        <div className="today fixed">
          <div className="main-col">
            <section className="decision task" aria-labelledby="res-h">
              <p className="mark lg task">{Icon.none}<b>Not scored</b><span className="scope">Alertness check · {clock(s.at)}</span></p>
              <h1 id="res-h" tabIndex={-1}>This attempt was not scored</h1>
              <p className="reason">{/interrupt/i.test(s.invalidReason ?? '') ? 'The attempt was interrupted.' : s.invalidReason} No score was recorded; alertness remains unassessed.</p>
              <div className="row actions"><Btn variant="primary" onClick={() => go({ view: 'check' })}>Start a new attempt</Btn><Btn variant="quiet" onClick={() => go({ view: 'today' })}>Return to Today</Btn></div>
            </section>
          </div>
          <aside className="side" />
        </div>
        <Foot kind="test" />
      </>
    );
  }

  const act = s.band === 'act';
  const cmp = `${Math.abs(s.z).toFixed(1)} SD ${s.z >= 0 ? 'slower' : 'faster'}`;
  const due = recheckAt !== null && now >= recheckAt;
  const review = !flag && <span className="review"><Btn onClick={() => go({ view: 'flag' })}>Mark for medical review</Btn><span className="sm muted">Saves a local flag; no notification is sent.</span></span>;

  let hero;
  if (s.band === 'ok') {
    hero = (
      <section className="decision clear" aria-labelledby="res-h">
        <Mark kind="clear" word="Within reference band" scope={scopeTxt} large />
        <h1 id="res-h" tabIndex={-1}>Within the reference range</h1>
        <p className="reason">Within the displayed study mean ±1 SD band, with {s.lapses} lapse{s.lapses === 1 ? '' : 's'} in {s.trials} responses.{earlier ? <> This re-check meets the demo’s closure rule for the <span className="num">{clock(earlier.at)}</span> alertness concern.</> : null}</p>
        <div className="row actions"><Btn variant="primary" onClick={() => go({ view: 'today' })}>Return to Today</Btn></div>
        <p className="limit">Covers alertness only; sleep, sleepiness and other readings are unchanged. Demo classification · not clinically validated</p>
      </section>
    );
  } else if (isOpen && acted) {
    hero = (
      <section className={`decision ${s.band}`} aria-labelledby="res-h">
        <Mark kind={s.band} scope={scopeTxt} large />
        <div className="headblock">
          <h1 id="res-h" tabIndex={-1}>{recheckAt === null ? 'Choose a re-check time' : due ? 'Re-check your alertness now' : `Re-check at ${clock(recheckAt)}`}</h1>
          {recheckAt !== null && !due && <p className="countdown">In {Math.max(1, Math.ceil(recheckAt - now))} min</p>}
        </div>
        <p className="reason">{acted.text.replace(/\.$/, '').replace(/ taken$/i, '').replace(/^./, (c) => c.toUpperCase())} recorded at <span className="num">{clock(acted.at)}</span>. The earlier alertness concern remains open.</p>
        <div className="row actions">
          {recheckAt === null
            ? <><Btn variant="primary" onClick={() => app.setRecheck(30)}>Re-check at {clock(now + 30)}</Btn><Btn onClick={() => app.setRecheck(60)}>At {clock(now + 60)}</Btn></>
            : due ? <Btn variant="primary" onClick={() => go({ view: 'check' })}>Start re-check</Btn>
              : <Btn variant="quiet" onClick={() => app.setRecheck(null)}>Change time</Btn>}
        </div>
        <p className="limit">Demo rule · not clinically validated</p>
      </section>
    );
  } else {
    hero = (
      <section className={`decision ${s.band}`} aria-labelledby="res-h">
        <Mark kind={s.band} scope={scopeTxt} large />
        <h1 id="res-h" tabIndex={-1}>{act ? 'Suggested: rest if your schedule allows' : 'Suggested: a short movement break'}</h1>
        <p className="reason">{simulated ? 'Simulated result' : 'Result'}: {cmp} than {ref ? 'reference' : 'your baseline'} · {s.lapses} lapse{s.lapses === 1 ? '' : 's'} / {s.trials}.</p>
        <div className="instruction">
          <p>{act ? 'Nap 20 to 30 minutes if your schedule allows. Postpone or double-check critical tasks.' : 'A few minutes of movement. Then double-check critical tasks.'}</p>
          <p className="sm muted">Illustrative guidance · not medically reviewed</p>
        </div>
        {isOpen && (
          <div className="row actions">
            <Btn variant="primary" onClick={() => app.recordAction('alertness-result', act ? 'Rest taken.' : 'Movement break taken.')}>{act ? 'Record completed rest' : 'Record completed break'}</Btn>
            {act && review}
          </div>
        )}
        <p className="limit">Demo rule · not clinically validated</p>
      </section>
    );
  }

  return (
    <>
      <div className="today fixed">
        <div className="main-col">
          {hero}
          <section className="band" aria-labelledby="cmp-h">
            <h2 id="cmp-h" className="rail-h">Difference from study reference</h2>
            <div className="evid2">
              <ComparePlot s={s} />
              <dl className="facts">
                <dt>Lapses</dt><dd className="num">{s.lapses} / {s.trials}</dd>
                <dt>False starts</dt><dd className="num">{s.falseStarts}</dd>
                <dt>Median response</dt><dd className="num">{s.medianMs} ms</dd>
                <dt>Source</dt><dd><Prov p={s.provenance} test /></dd>
              </dl>
            </div>
          </section>
          <section className="panel tight disclosures onerow">
            <details>
              <summary><h2>{s.band !== 'ok' ? 'Guidance and method' : 'Method'}</h2></summary>
              <div className="body">
                {s.band !== 'ok' && <h3 className="sub-h">About the guidance</h3>}
                {s.band !== 'ok' && <>
                  <p>Bright light and caffeine only as your flight surgeon’s plan allows, and not close to your next sleep. No plan is loaded in this prototype.</p>
                  <p>Re-check alertness 30 to 60 minutes after the step.</p>
                  <p className="cap">Based on <a href={SOURCES.sleepRisk.url} target="_blank" rel="noopener noreferrer">{SOURCES.sleepRisk.label}<span className="sr"> (opens in new tab)</span></a>. A general risk page, not a validated procedure.</p>
                </>}
                <h3 className="sub-h">Scoring method</h3>
                <dl className="kv">
                  <dt>Speed score</dt><dd><span className="num">{s.speed.toFixed(2)}</span> · 10 − mean(1/RT), RT in seconds · lower is faster</dd>
                  <dt>Comparison</dt><dd><span className="num">{(s.speed - s.z * REFERENCE.sd).toFixed(2)} ± {REFERENCE.sd.toFixed(2)}</span> · same transformation as the reference (Dev et al. 2024, Table 1) · difference ÷ SD = <span className="num">{s.z.toFixed(2)}</span> SD</dd>
                  <dt>Lapse</dt><dd>Response of {LAPSE_MS} ms or slower (Basner et al. 2011, PVT-B)</dd>
                  <dt>Protocol</dt><dd>{s.protocol === 'pvt-b-3min' ? '3 practice responses, then 3 minutes; 1–4 s random gaps' : '45 seconds, demo length. Not the validated protocol.'}</dd>
                  <dt>Band rule</dt><dd>Watch: 1 to 1.5 SD slower, or 3 to 5 lapses. Act: 1.5 SD or more, 6 or more lapses, or 4 or more false starts. Demo rule, not validated.</dd>
                </dl>
                <p className="cap">Tablet display and touch latency are not benchmarked, so the comparison is indicative only.</p>
              </div>
            </details>
          </section>
        </div>
        <aside className="side">
          <section className="panel stack-sm">
            <h2 className="rail-h">This concern</h2>
            <ul className="rows quiet">
              <li><b>Result</b><span className="sm muted num">{clock(s.at)} · {s.band === 'ok' ? 'within band' : s.band === 'act' ? 'Act' : 'Watch'}</span></li>
              {s.band !== 'ok' && <li><b>Action recorded</b><span className="sm muted">{acted ? <span className="num">{clock(acted.at)}</span> : 'Not yet'}</span></li>}
              {s.band !== 'ok' && <li><b>Re-check due</b><span className="sm muted">{recheckAt !== null && isOpen ? <span className="num">{clock(recheckAt)}</span> : 'Not scheduled'}</span></li>}
            </ul>
          </section>
          <section className="panel stack-sm">
            <h2 className="rail-h">Symptoms</h2>
            <Btn onClick={() => go({ view: 'symptom' })}>Report a symptom</Btn>
          </section>
        </aside>
      </div>
      <Foot kind="test" />
    </>
  );
}
