// Today: one decision, its evidence, and nothing that competes with it.
// Reading order is fixed: status → reason → action → evidence. Built to fit one
// 1180 × 820 tablet viewport: decision area, a three-cell evidence strip, one link row.

import { useState, type ReactNode } from 'react';
import { INFO } from '../domain/content';
import { FEVER_C, INDICATORS, WEEKLY, latest, series } from '../domain/rules';
import { age, clock, duration, missionDay, sameDay } from '../domain/time';
import type { IndicatorId, Issue } from '../domain/types';
import { useApp } from '../state/store';
import { BaselineTrack, Btn, BuildingTrack, Chip, Icon, Prov, SleepTrack, Value, plain, provLabel } from '../ui/primitives';
import { FlagLine, Foot, chipWord, useNav } from '../ui/shared';

/* ---------- Status mark: only for real judgments ---------- */

export function Mark({ kind, scope, large }: { kind: 'ok' | 'watch' | 'act' | 'task'; scope: string; large?: boolean }) {
  const word = kind === 'task' ? 'Task due' : kind === 'ok' ? 'OK' : kind === 'watch' ? 'Watch' : 'Act';
  const icon = kind === 'task' ? Icon.due : Icon[kind];
  return (
    <p className={`mark ${kind}${large ? ' lg' : ''}`}>
      {icon}<b>{word}</b><span className="scope">{scope}</span>
    </p>
  );
}

/** Reminder times stay behind one secondary control, so the decision has a single primary action. */
function Remind({ label, minutes, onPick }: { label: string; minutes: number[]; onPick: (m: number) => void }) {
  const { now } = useApp();
  const [open, setOpen] = useState(false);
  if (!open) return <Btn onClick={() => setOpen(true)}>{label}</Btn>;
  return (
    <span className="remind" role="group" aria-label={label}>
      {minutes.map((m) => <Btn key={m} small onClick={() => { onPick(m); setOpen(false); }}>{clock(now + m)} · in {m} min</Btn>)}
      <Btn small variant="quiet" onClick={() => setOpen(false)}>Cancel</Btn>
    </span>
  );
}

interface Decision {
  kind: 'ok' | 'watch' | 'act' | 'task';
  scope: string;
  headline: ReactNode;
  reason: ReactNode;
  limit?: ReactNode;
  actions?: ReactNode;
}

function useDecision(issue: Issue | undefined): Decision {
  const app = useApp();
  const { go } = useNav();
  const { now, ev, draft, deferUntil, recheckAt, readings, flag } = app;
  const sess = ev.sessionToday;
  const inMin = (t: number) => Math.max(1, Math.ceil(t - now));

  if (!issue) {
    const covered = INDICATORS.filter((i) => ev.statuses[i].status === 'ok').map((i) => INFO[i].short);
    const open = INDICATORS.filter((i) => !['ok', 'watch', 'act'].includes(ev.statuses[i].status)).map((i) => INFO[i].short);
    return {
      kind: 'ok', scope: 'Today’s data',
      headline: 'No action needed',
      reason: 'No rule was triggered by today’s readings.',
      limit: <>Assessed: {covered.join(', ') || 'nothing yet'}. Not assessed or not current: {open.join(', ') || 'nothing'}.</>,
      actions: <Btn onClick={() => go({ view: 'check' })}>Run a pre-task alertness check</Btn>,
    };
  }

  switch (issue.id) {
    case 'checkin': {
      const answered = [draft.mood, draft.kss, draft.sleep].filter((v) => v !== null).length;
      return {
        kind: 'task', scope: 'Daily routine',
        headline: answered ? 'Finish your check-in' : 'Start your daily check-in',
        reason: 'A few taps, under a minute. Today’s assessment needs your sleepiness and mood.',
        limit: answered ? `Draft kept: ${answered} answered.` : 'Until then, alertness and mood are not assessed.',
        actions: <Btn variant="primary" onClick={() => go({ view: 'checkin' })}>{answered ? 'Resume check-in' : 'Start check-in'}</Btn>,
      };
    }
    case 'alertness-check': {
      const invalid = app.sessions.filter((s) => sameDay(s.at, now)).slice(-1)[0];
      const deferred = deferUntil !== null && now < deferUntil;
      return {
        kind: 'watch', scope: 'Alertness',
        headline: deferred ? <>Check your alertness at <span className="num">{clock(deferUntil!)}</span></> : 'Check your alertness',
        reason: issue.why,
        limit: <>{invalid && !invalid.valid ? `The ${clock(invalid.at)} attempt was not scored. ` : ''}Current alertness: not assessed. The test takes 3 minutes.</>,
        actions: (
          <>
            <Btn variant="primary" onClick={() => go({ view: 'check' })}>Start 3-min alertness check</Btn>
            {deferred
              ? <Btn variant="quiet" onClick={() => app.setDefer(null)}>Cancel reminder</Btn>
              : <Remind label="Remind me…" minutes={[15, 30, 60]} onPick={app.setDefer} />}
          </>
        ),
      };
    }
    case 'alertness-result': {
      const act = issue.level === 'act';
      return {
        kind: act ? 'act' : 'watch', scope: 'Alertness',
        headline: act ? 'Rest now if your schedule allows' : 'Take a short movement break',
        reason: sess ? <>The <span className="num">{clock(sess.at)}</span> check was {Math.abs(sess.z).toFixed(1)} SD slower than the NASA ISS pre-flight reference, with {sess.lapses} lapse{sess.lapses === 1 ? '' : 's'}.</> : issue.why,
        limit: 'A screening result, not a fitness-for-duty decision. The steps are illustrative and not medically reviewed.',
        actions: <Btn variant="primary" onClick={() => sess && go({ view: 'result', id: sess.id })}>Open the steps</Btn>,
      };
    }
    case 'alertness-followup': {
      const action = app.actions.filter((a) => a.issue === 'alertness-result').slice(-1)[0];
      const due = recheckAt !== null && now >= recheckAt;
      return {
        kind: issue.level === 'act' ? 'act' : 'watch', scope: 'Alertness',
        headline: recheckAt === null ? 'Choose a re-check time'
          : due ? 'Re-check your alertness now'
            : <>Re-check at <span className="num">{clock(recheckAt)}</span> <span className="soft">in {inMin(recheckAt)} min</span></>,
        reason: <>{issue.why}{action ? <> {action.text.charAt(0).toUpperCase() + action.text.slice(1)} Recorded <span className="num">{clock(action.at)}</span>.</> : null}</>,
        limit: 'The re-check gives new evidence on alertness. Until then the concern stays open.',
        actions: recheckAt === null
          ? <><Btn variant="primary" onClick={() => app.setRecheck(30)}>Re-check at {clock(now + 30)} · in 30 min</Btn><Btn onClick={() => app.setRecheck(60)}>At {clock(now + 60)}</Btn></>
          : due
            ? <Btn variant="primary" onClick={() => go({ view: 'check' })}>Start re-check</Btn>
            : <Btn variant="quiet" onClick={() => app.setRecheck(null)}>Change time</Btn>,
      };
    }
    case 'temperature': {
      const t = latest(readings, 'temperature')!;
      const dueAt = t.at + 30;
      const due = now >= dueAt;
      return {
        kind: 'watch', scope: 'Temperature',
        headline: due ? 'Re-check your temperature now' : <>Re-check temperature at <span className="num">{clock(dueAt)}</span> <span className="soft">in {inMin(dueAt)} min</span></>,
        reason: <><span className="num">{t.value.toFixed(1)} °C</span> at <span className="num">{clock(t.at)}</span> is at or above {FEVER_C.toFixed(1)} °C, the Earth clinical definition of fever.</>,
        limit: 'One reading. Not a diagnosis. If it holds on the re-check, flag the crew medical officer.',
        actions: due
          ? <Btn variant="primary" onClick={() => go({ view: 'entry', kind: 'temp' })}>Log temperature</Btn>
          : !flag ? <Btn onClick={() => go({ view: 'flag' })}>Flag crew medical officer now</Btn> : null,
      };
    }
    case 'blood-sugar': {
      const confirmed = issue.title.includes('twice');
      return {
        kind: 'watch', scope: 'Blood sugar',
        headline: confirmed ? 'Flag the crew medical officer' : 'Re-check your blood sugar',
        reason: issue.why,
        limit: confirmed ? 'Two fasting readings agree. Not a diagnosis.' : 'Single readings swing widely, so one re-check comes before any alert.',
        actions: confirmed
          ? (flag ? <p className="sm"><FlagLine /></p> : <Btn variant="primary" onClick={() => go({ view: 'flag' })}>Flag crew medical officer</Btn>)
          : <Btn variant="primary" onClick={() => go({ view: 'entry', kind: 'bp' })}>Log blood sugar</Btn>,
      };
    }
    case 'heart-rate':
      return {
        kind: 'watch', scope: 'Heart rate',
        headline: 'Log blood pressure and blood sugar',
        reason: issue.why,
        limit: issue.state,
        actions: <Btn variant="primary" onClick={() => go({ view: 'entry', kind: 'bp' })}>Log readings</Btn>,
      };
    case 'bp-due':
    default:
      return {
        kind: 'task', scope: 'Weekly routine',
        headline: 'Log blood pressure and blood sugar',
        reason: issue.why,
        limit: 'About 30 seconds.',
        actions: <Btn variant="primary" onClick={() => go({ view: 'entry', kind: 'bp' })}>Log readings</Btn>,
      };
  }
}

/* ---------- Evidence strip ---------- */

function Cell({ id }: { id: IndicatorId }) {
  const { ev, now, disputed } = useApp();
  const { go } = useNav();
  const s = ev.statuses[id];
  const info = INFO[id];
  const judged = s.status === 'ok' || s.status === 'watch' || s.status === 'act';
  const head = (
    <span className="cell-head">
      <span className="label">{info.name}</span>
      {judged ? <Chip kind={s.status} /> : null}
    </span>
  );

  if (id === 'alertness') {
    const sess = ev.sessionToday;
    return (
      <button type="button" className="cell" onClick={() => go({ view: 'indicator', id })}>
        {head}
        {sess ? (
          <>
            <span className="big">{Math.abs(sess.z).toFixed(1)} <small>SD {sess.z >= 0 ? 'slower' : 'faster'}</small></span>
            <span className="sm">than the NASA ISS pre-flight reference · {sess.lapses} lapse{sess.lapses === 1 ? '' : 's'}</span>
            <span className="cellmeta"><span className="num">{clock(sess.at)}</span><Prov p={sess.provenance} /></span>
          </>
        ) : <><span className="na">Not run today</span><span className="sm">Offered when a sign of fatigue appears.</span></>}
      </button>
    );
  }

  const r = s.latest;
  const current = r && sameDay(r.at, now);
  const nightly = id === 'sleep' || id === 'hrv' || id === 'heartRate';
  return (
    <button type="button" className="cell" onClick={() => go({ view: 'indicator', id })}>
      {head}
      {current ? (
        <>
          <Value r={r} className="big" />
          {id === 'sleep' && <SleepTrack minutes={r.value} off={disputed.includes(r.id)} concern={s.status === 'watch'} />}
          {(id === 'hrv' || id === 'heartRate') && (s.baseline
            ? <BaselineTrack value={r.value} baseline={s.baseline} unit={r.unit} />
            : s.baselineNeeded !== undefined ? <BuildingTrack have={7 - s.baselineNeeded} /> : null)}
          <span className={judged ? 'sm' : 'sm muted'}>{s.summary}</span>
          <span className="cellmeta"><span className="num">{r.window ? `${clock(r.window.from)}–${clock(r.window.to)}` : clock(r.at)}</span><Prov p={r.provenance} /></span>
        </>
      ) : (
        <>
          <span className="na">{nightly ? 'No overnight recording' : chipWord(id, s) === 'Not today' ? 'Not entered today' : 'No reading'}</span>
          {r && <span className="cellmeta">Last available: {plain(r)} · {age(r.at, now)} · {provLabel(r.provenance)}</span>}
        </>
      )}
    </button>
  );
}

/* ---------- Side column: what is next, and support ---------- */

function Side() {
  const app = useApp();
  const { go } = useNav();
  const { ev, now, readings, recheckAt, deferUntil, symptoms } = app;
  const others = ev.issues.slice(1).filter((i) => i.level !== 'due');
  const bp = latest(readings, 'bloodPressure');
  const next: { what: string; when: string }[] = [];
  if (recheckAt !== null) next.push({ what: 'Alertness re-check', when: now >= recheckAt ? 'Due now' : `${clock(recheckAt)} · in ${Math.ceil(recheckAt - now)} min` });
  if (deferUntil !== null && recheckAt === null) next.push({ what: 'Alertness check', when: now >= deferUntil ? 'Due now' : `${clock(deferUntil)} · in ${Math.ceil(deferUntil - now)} min` });
  const temp = latest(readings, 'temperature');
  if (ev.issues.some((i) => i.id === 'temperature') && temp) next.push({ what: 'Temperature re-check', when: now >= temp.at + 30 ? 'Due now' : `${clock(temp.at + 30)} · in ${Math.ceil(temp.at + 30 - now)} min` });
  if (ev.issues[0]?.id !== 'checkin' && ev.issues.some((i) => i.id === 'checkin')) next.push({ what: 'Daily check-in', when: 'Due now' });
  if (!next.length) {
    const days = bp ? Math.ceil((bp.at + WEEKLY - now) / 1440) : 0;
    next.push({ what: 'Blood pressure + blood sugar', when: days <= 0 ? 'Due now' : `In ${days} d · weekly` });
  }
  const todays = symptoms.filter((s) => sameDay(s.at, now));
  return (
    <aside className="side">
      {others.length > 0 && (
        <section className="panel stack-sm">
          <h2>Also open</h2>
          <ul className="rows">
            {others.map((i) => (
              <li key={i.id}>
                <Mark kind={i.level === 'act' ? 'act' : 'watch'} scope={i.title} />
                <p className="sm muted">{i.why}</p>
              </li>
            ))}
          </ul>
        </section>
      )}
      <section className="panel stack-sm">
        <h2>Next</h2>
        <ul className="rows">
          {next.map((n) => <li key={n.what}><b>{n.what}</b><p className="sm muted num">{n.when}</p></li>)}
        </ul>
      </section>
      <section className="panel stack-sm">
        <h2>Symptoms and support</h2>
        {todays.length
          ? <ul className="rows">{todays.map((s) => <li key={s.id}><p>{s.list.join(', ')}{s.tempC !== undefined && <> · <span className="num">{s.tempC.toFixed(1)} °C</span></>}</p><p className="cap">Reported {clock(s.at)} · on this tablet</p></li>)}</ul>
          : <p className="sm muted">Available any time, even when readings look ordinary.</p>}
        <div className="row"><Btn onClick={() => go({ view: 'symptom' })}>Report a symptom</Btn></div>
        <p className="sm"><FlagLine /></p>
      </section>
    </aside>
  );
}

export function Today() {
  const { ev, now } = useApp();
  const { go } = useNav();
  const issue = ev.issues[0];
  const d = useDecision(issue);
  const ids = (issue?.evidence ?? ['sleep', 'hrv', 'sleepiness']).slice(0, 3);
  return (
    <>
      <div className="today">
        <div className="main-col">
          <section className={`decision ${d.kind}`} aria-labelledby="decision-h">
            <Mark kind={d.kind} scope={d.scope} large />
            <h1 id="decision-h" tabIndex={-1}>{d.headline}</h1>
            <p className="reason">{d.reason}</p>
            {d.actions && <div className="row actions">{d.actions}</div>}
            {d.limit && <p className="limit">{d.limit}</p>}
          </section>
          <div className="strip" aria-label="Evidence" style={{ ['--cols' as string]: ids.length }}>
            {ids.map((id) => <Cell key={id} id={id} />)}
          </div>
          <button type="button" className="allrow" onClick={() => go({ view: 'measurements' })}>
            <span>All measurements</span><span className="sm muted">9 indicators · mission day {missionDay(now)} <span aria-hidden="true">→</span></span>
          </button>
        </div>
        <Side />
      </div>
      <Foot />
    </>
  );
}

/** All nine indicators, compact. Used on Measurements, not on Today. */
export function Tiles() {
  const { ev, readings, now } = useApp();
  const { go } = useNav();
  return (
    <div className="tiles" aria-label="All indicators">
      {INDICATORS.map((id) => {
        const s = ev.statuses[id];
        const sess = id === 'alertness' ? ev.sessionToday : null;
        const r = s.latest;
        const current = r && sameDay(r.at, now);
        const judged = s.status === 'ok' || s.status === 'watch' || s.status === 'act';
        return (
          <button key={id} type="button" className="tile" onClick={() => go({ view: 'indicator', id })}>
            <span className="tile-head"><span className="label">{INFO[id].short}</span>{judged ? <Chip kind={s.status} /> : <span className="sm muted">{chipWord(id, s) ?? 'Logged'}</span>}</span>
            {sess ? <span className="val">{Math.abs(sess.z).toFixed(1)} <small>SD {sess.z >= 0 ? 'slower' : 'faster'}</small></span>
              : current ? <Value r={r} /> : <span className="val muted">—</span>}
            <span className="cap">
              {sess ? <>{clock(sess.at)} · <Prov p={sess.provenance} /></>
                : current ? <>{clock(r.at)} · <Prov p={r.provenance} /></>
                  : r ? <>Last: {plain(r)} · {age(r.at, now)} · {provLabel(r.provenance)}</> : 'No reading'}
            </span>
            {id === 'sleep' && current && <span className="cap">{duration(r.value)} · {series(readings, 'sleep').length} nights on record</span>}
          </button>
        );
      })}
    </div>
  );
}
