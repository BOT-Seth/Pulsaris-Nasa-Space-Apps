import { createContext, useContext, type ReactNode } from 'react';
import { INFO } from '../domain/content';
import { REFERENCE } from '../domain/pvt';
import { age, clock } from '../domain/time';
import type { IndicatorId, IndicatorStatus, Issue, RegionId } from '../domain/types';
import { useApp } from '../state/store';
import { BaselineTrack, Btn, BuildingTrack, Prov, SleepTrack, SpeedScale, Value } from './primitives';

export type Route =
  | { view: 'today' } | { view: 'measurements' } | { view: 'indicator'; id: IndicatorId }
  | { view: 'entry'; kind: 'bp' | 'temp' } | { view: 'checkin' } | { view: 'check' }
  | { view: 'result'; id: string } | { view: 'body'; region?: RegionId }
  | { view: 'symptom'; region?: RegionId } | { view: 'flag' } | { view: 'log' } | { view: 'sources' };

export const NavCtx = createContext<{ route: Route; go: (r: Route) => void }>({ route: { view: 'today' }, go: () => {} });
export const useNav = () => useContext(NavCtx);

/** The word on a status chip. "No data" is only used when data is truly missing. */
export function chipWord(id: IndicatorId, s: IndicatorStatus): string | undefined {
  if (s.status !== 'none') return undefined;
  if (s.baselineNeeded !== undefined) return 'Baseline building';
  if (id === 'alertness') return 'Not run';
  if (id === 'temperature') return 'Not asked';
  if (id === 'mood' || id === 'sleepiness') return 'Not today';
  if (s.latest?.quality?.usable === false) return 'Not usable';
  if (s.summary.startsWith('Marked wrong')) return 'Not used';
  return 'No data';
}

export function Back({ to, label }: { to: Route; label: string }) {
  const { go } = useNav();
  return <div className="backrow"><Btn variant="quiet" onClick={() => go(to)}>‹ {label}</Btn></div>;
}

export function Foot() {
  const { scenario } = useApp();
  const { go } = useNav();
  const night = scenario.readings.some((r) => r.provenance === 'recorded');
  return (
    <p className="foot">
      Prototype · demo scenario “{scenario.def.name}” · {night ? 'last night from an Earth dataset (MMASH)' : 'no overnight recording'} · earlier nights synthetic · not a medical device ·{' '}
      <button type="button" className="linkish" onClick={() => go({ view: 'sources' })}>Sources and limits</button>
    </p>
  );
}

/** One evidence row: big value, micro-telemetry, then what it means, when, and where it came from. */
export function EvidenceRow({ id }: { id: IndicatorId }) {
  const { ev, now, disputed } = useApp();
  const s = ev.statuses[id];
  const info = INFO[id];
  if (id === 'alertness') {
    const sess = ev.sessionToday;
    if (!sess) return null;
    return (
      <li className="ev">
        <div>
          <div className="label">Alertness check</div>
          <div className="metric">{sess.speed.toFixed(2)} <small>speed</small></div>
          <SpeedScale speed={sess.speed} mean={REFERENCE.mean} sd={REFERENCE.sd} label="reference" compact />
        </div>
        <div className="stack-sm">
          <p>{Math.abs(sess.z).toFixed(1)} SD {sess.z >= 0 ? 'slower' : 'faster'} than the NASA ISS pre-flight reference. {sess.lapses} lapse{sess.lapses === 1 ? '' : 's'}.</p>
          <p className="cap">Completed {clock(sess.at)} · {age(sess.at, now)} · <Prov p={sess.provenance} />{sess.protocol === 'demo-short' ? ' · demo length' : ''}</p>
        </div>
      </li>
    );
  }
  const r = s.latest;
  if (!r) {
    return (
      <li className="ev">
        <div><div className="label">{info.name}</div><div className="metric">—</div></div>
        <div className="stack-sm"><p>{s.summary}</p></div>
      </li>
    );
  }
  return (
    <li className="ev">
      <div>
        <div className="label">{info.name}</div>
        <Value r={r} className="metric" />
        {id === 'sleep' && <SleepTrack minutes={r.value} off={disputed.includes(r.id)} />}
        {(id === 'hrv' || id === 'heartRate') && (s.baseline
          ? <BaselineTrack value={r.value} baseline={s.baseline} unit={r.unit} />
          : s.baselineNeeded !== undefined ? <BuildingTrack have={7 - s.baselineNeeded} /> : null)}
      </div>
      <div className="stack-sm">
        <p>{s.summary}</p>
        <p className="cap">
          {r.window ? `Recorded ${clock(r.window.from)} to ${clock(r.window.to)}` : `Entered ${clock(r.at)}`} · {age(r.at, now)} · <Prov p={r.provenance} />
        </p>
      </div>
    </li>
  );
}

export function FlagLine() {
  const { flag } = useApp();
  if (!flag) return <span className="muted">Nothing flagged. Records stay on this tablet.</span>;
  return <>Flag saved on this tablet at <span className="num">{clock(flag.queuedAt)}</span>. No notification sent; this prototype cannot send.</>;
}

/** The actions that belong to an issue. Task state (deferred, scheduled) lives here, apart from the health state. */
export function IssueActions({ issue }: { issue: Issue }) {
  const app = useApp();
  const { go } = useNav();
  const { now, deferUntil, draft, ev, flag } = app;
  const bp = () => go({ view: 'entry', kind: 'bp' });
  const flagBtn = flag ? null : <Btn onClick={() => go({ view: 'flag' })}>Flag for crew medical officer</Btn>;
  let body: ReactNode = null;
  switch (issue.id) {
    case 'checkin': {
      const answered = [draft.mood, draft.kss, draft.sleep].filter((v) => v !== null).length;
      body = (
        <>
          {answered > 0 && <p className="notice">Draft kept: {answered} answered.</p>}
          <div className="row"><Btn variant="primary" onClick={() => go({ view: 'checkin' })}>{answered ? 'Resume check-in' : 'Start check-in'}</Btn></div>
        </>
      );
      break;
    }
    case 'alertness-check': {
      const lastToday = app.sessions.filter((s) => Math.floor(s.at / 1440) === Math.floor(now / 1440)).slice(-1)[0];
      const invalid = lastToday && !lastToday.valid ? lastToday : null;
      body = (
        <>
          {invalid && <p className="notice">The attempt at <span className="num">{clock(invalid.at)}</span> was not scored. {invalid.invalidReason} Run it again when ready.</p>}
          {deferUntil !== null ? (
            <>
              <p className="notice">{now >= deferUntil ? 'Deferred check is due now' : <>Deferred until <span className="num">{clock(deferUntil)}</span></>}. Alertness is still not assessed.</p>
              <div className="row"><Btn variant="primary" onClick={() => go({ view: 'check' })}>Start 3-min alertness check</Btn><Btn variant="quiet" onClick={() => app.setDefer(null)}>Change time</Btn></div>
            </>
          ) : (
            <>
              <div className="row"><Btn variant="primary" onClick={() => go({ view: 'check' })}>Start 3-min alertness check</Btn></div>
              <div className="stack-sm">
                <p className="sm muted">Not now? Pick when to be reminded. The check stays pending.</p>
                <div className="row">{[15, 30, 60].map((m) => <Btn key={m} small onClick={() => app.setDefer(m)}>At {clock(now + m)}</Btn>)}</div>
              </div>
            </>
          )}
        </>
      );
      break;
    }
    case 'alertness-result':
      body = <div className="row"><Btn variant="primary" onClick={() => ev.sessionToday && go({ view: 'result', id: ev.sessionToday.id })}>Open next step</Btn></div>;
      break;
    case 'alertness-followup':
      body = <RecheckControls />;
      break;
    case 'temperature':
      body = <div className="row"><Btn variant="primary" onClick={() => go({ view: 'entry', kind: 'temp' })}>Log temperature again</Btn>{flagBtn}</div>;
      break;
    case 'blood-sugar':
      body = <div className="row"><Btn variant="primary" onClick={bp}>Log blood sugar again</Btn>{flagBtn}</div>;
      break;
    case 'heart-rate':
    case 'bp-due':
      body = <div className="row"><Btn variant="primary" onClick={bp}>Log blood pressure and blood sugar</Btn></div>;
      break;
  }
  return <>{body}</>;
}

export function RecheckControls() {
  const { now, recheckAt, setRecheck } = useApp();
  const { go } = useNav();
  if (recheckAt !== null) {
    const due = now >= recheckAt;
    return (
      <>
        <p className="notice">{due ? 'Re-check is due now' : <>Re-check due at <span className="num">{clock(recheckAt)}</span></>}.</p>
        <div className="row"><Btn variant={due ? 'primary' : ''} onClick={() => go({ view: 'check' })}>Start re-check</Btn><Btn variant="quiet" onClick={() => setRecheck(null)}>Change time</Btn></div>
      </>
    );
  }
  return (
    <div className="stack-sm">
      <p className="sm">Choose a re-check time. The plan allows 30 to 60 min after rest.</p>
      <div className="row">{[30, 60].map((m) => <Btn key={m} small onClick={() => setRecheck(m)}>At {clock(now + m)}</Btn>)}</div>
    </div>
  );
}
