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
import { Btn, Chip, Prov, SpeedScale } from '../ui/primitives';
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

/* ---------- Result: interpretation, then next step, then numbers ---------- */

export function Result({ id }: { id: string }) {
  const app = useApp();
  const { go } = useNav();
  const s = app.sessions.find((x) => x.id === id);
  if (!s) return <><Back to={{ view: 'today' }} label="Today" /><section className="panel"><h1 tabIndex={-1}>Result not found</h1></section></>;
  const ref = s.comparedWith === 'nasa-reference';
  const refText = ref ? 'the NASA ISS pre-flight reference' : 'your own rested baseline';
  const isOpen = app.ev.sessionToday?.id === s.id && s.band !== 'ok';
  const acted = app.actions.filter((a) => a.issue === 'alertness-result' && a.at >= s.at).slice(-1)[0];
  const tag = <p className="cap">Completed {clock(s.at)} · <Prov p={s.provenance} />{s.protocol === 'demo-short' ? ' · demo length, 45 s, indicative only' : ''}</p>;

  if (!s.valid) {
    return (
      <>
        <Back to={{ view: 'today' }} label="Today" />
        <section className="panel primary stack">
          <h3>Alertness check · {clock(s.at)}</h3>
          <div className="title-row"><Chip kind="none" word="Not scored" large /><h1 tabIndex={-1}>This session was not scored</h1></div>
          <p>{s.invalidReason} No result was recorded, so your alertness is still not assessed.</p>
          <div className="row"><Btn variant="primary" onClick={() => go({ view: 'check' })}>Run it again</Btn></div>
        </section>
        <Foot />
      </>
    );
  }
  const cmp = `${Math.abs(s.z).toFixed(1)} SD ${s.z >= 0 ? 'slower' : 'faster'}`;
  return (
    <>
      <Back to={{ view: 'today' }} label="Today" />
      <section className={`panel primary ${s.band} stack`}>
        <h3>Alertness check result</h3>
        {s.band === 'ok' ? (
          <>
            <div className="title-row"><Chip kind="ok" large /><h1 tabIndex={-1}>Within the reference range</h1></div>
            <p>Speed is within 1 SD of {refText}, with {s.lapses} lapse{s.lapses === 1 ? '' : 's'}. No action needed from this check.</p>
          </>
        ) : (
          <>
            <div className="title-row"><Chip kind={s.band} large /><h1 tabIndex={-1}>{s.band === 'act' ? 'Well below the reference' : 'Slower than the reference'}</h1></div>
            <p>Treat your alertness as {s.band === 'act' ? 'reduced' : 'possibly reduced'} until a re-check. This is a screening result, not a fitness-for-duty decision.</p>
          </>
        )}
        <SpeedScale speed={s.speed} mean={ref ? REFERENCE.mean : s.speed - s.z * REFERENCE.sd} sd={REFERENCE.sd} label={ref ? 'reference' : 'your baseline'} />
        <p className="state">{ref ? 'Compared with the NASA ISS pre-flight reference (24 astronauts, Dev et al. 2024), not with you. Your own baseline needs 3 rested sessions.' : 'Compared with your own rested sessions.'}</p>
        {tag}
      </section>

      {s.band !== 'ok' && (
        <section className="panel stack">
          <h3>Next step · Fatigue countermeasure steps, draft v0.1</h3>
          <p className="big">{s.band === 'act' ? 'Rest now if your schedule allows: a 20 to 30 minute nap. Postpone or double-check critical tasks.' : 'Take a short movement break. Then double-check critical tasks today.'}</p>
          <p>Bright light and caffeine: only as your flight surgeon’s plan allows, and not close to your next sleep. No plan is loaded in this prototype.</p>
          <p className="sm muted">Illustrative wording, not medically reviewed. Based on <a href={SOURCES.sleepRisk.url} target="_blank" rel="noopener noreferrer">{SOURCES.sleepRisk.label}<span className="sr"> (opens in new tab)</span></a>.</p>
          {isOpen && (acted ? (
            <>
              <p className="notice">Recorded <span className="num">{clock(acted.at)}</span>: {acted.text} The concern stays open until a re-check.</p>
              <RecheckControls />
            </>
          ) : (
            <>
              <div className="row">
                <Btn variant="primary" onClick={() => app.recordAction('alertness-result', s.band === 'act' ? 'rest taken.' : 'movement break taken.')}>{s.band === 'act' ? 'Record: rest taken' : 'Record: movement break taken'}</Btn>
                {s.band === 'act' && !app.flag && <Btn onClick={() => go({ view: 'flag' })}>Flag for crew medical officer</Btn>}
              </div>
              <p className="sm muted">Recording an action does not clear the concern.</p>
            </>
          ))}
        </section>
      )}

      <section className="panel tight">
        <details>
          <summary><h2>Numbers and method</h2><span className="cap">{cmp} · {s.lapses} lapse{s.lapses === 1 ? '' : 's'} · {s.falseStarts} false start{s.falseStarts === 1 ? '' : 's'}</span></summary>
          <div className="body">
            <dl className="kv">
              <dt>Speed score</dt><dd><span className="num">{s.speed.toFixed(2)}</span> · lower is faster · 10 − mean(1/RT)</dd>
              <dt>Comparison</dt><dd><span className="num">{(s.speed - s.z * REFERENCE.sd).toFixed(2)} ± {REFERENCE.sd.toFixed(2)}</span> · difference ÷ SD = <span className="num">{s.z.toFixed(2)}</span> SD</dd>
              <dt>Mean response speed</dt><dd><span className="num">{s.meanRecip.toFixed(2)} per s</span> · median <span className="num">{s.medianMs} ms</span></dd>
              <dt>Lapses (≥{LAPSE_MS} ms)</dt><dd><span className="num">{s.lapses} of {s.trials}</span> scored trials</dd>
              <dt>False starts</dt><dd><span className="num">{s.falseStarts}</span></dd>
              <dt>Protocol</dt><dd>{s.protocol === 'pvt-b-3min' ? '3 minutes, 1–4 s random gaps, first 3 trials not scored' : '45 seconds, demo length. Not the validated protocol.'}</dd>
              <dt>Band rule</dt><dd>Watch: 1 to 1.5 SD slower, or 3 to 5 lapses. Act: 1.5 SD or more, 6 or more lapses, or 4 or more false starts. Team starting points, not validated.</dd>
            </dl>
            <p className="cap">Tablet display and touch latency are not benchmarked, so the comparison is indicative only. Lapse threshold: Basner et al. 2011 (PVT-B).</p>
          </div>
        </details>
      </section>
      <Foot />
    </>
  );
}
