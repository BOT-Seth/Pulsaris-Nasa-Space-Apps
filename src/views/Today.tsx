// Today: one scoped decision, the readings behind it, and nothing that competes with it.
// Reading order is fixed: status → headline → reason → action → evidence.
// Geometry at 1180 × 820: header 0–100, decision 100–452, evidence 452–708,
// "All measurements" 708–764, prototype line 764–820. One left edge at x = 24.

import { useState, type ReactNode } from 'react';
import { INFO, KSS } from '../domain/content';
import { FEVER_C, INDICATORS, WEEKLY, latest } from '../domain/rules';
import { age, clock, sameDay } from '../domain/time';
import type { IndicatorId, Issue } from '../domain/types';
import { useApp } from '../state/store';
import { Btn, Chip, Icon, Prov, Value, plain, provLabel } from '../ui/primitives';
import { FlagLine, Foot, chipWord, useNav } from '../ui/shared';

type MarkKind = 'ok' | 'watch' | 'act' | 'task' | 'clear';

/** Status line. Color only for Watch and Act; "No flags" and "Assessment incomplete" stay neutral. */
export function Mark({ kind, scope, large }: { kind: MarkKind; scope?: string; large?: boolean }) {
  const word = { ok: 'OK', watch: 'Watch', act: 'Act', task: 'Assessment incomplete', clear: 'No flags' }[kind];
  const icon = kind === 'task' ? Icon.due : kind === 'clear' ? Icon.ok : Icon[kind];
  return (
    <p className={`mark ${kind}${large ? ' lg' : ''}`}>
      {icon}<b>{word}</b>{scope && <span className="scope">{scope}</span>}
    </p>
  );
}

/** Reminder times behind one secondary control, so the decision keeps a single primary action. */
function Remind({ onPick }: { onPick: (m: number) => void }) {
  const { now } = useApp();
  const [open, setOpen] = useState(false);
  if (!open) return <Btn onClick={() => setOpen(true)}>Remind me…</Btn>;
  return (
    <span className="remind" role="group" aria-label="Remind me">
      {[15, 30, 60].map((m) => <Btn key={m} small onClick={() => { onPick(m); setOpen(false); }}>{clock(now + m)} · in {m} min</Btn>)}
      <Btn small variant="quiet" onClick={() => setOpen(false)}>Cancel</Btn>
    </span>
  );
}

interface Decision {
  kind: MarkKind;
  scope?: string;
  headline: ReactNode;
  countdown?: string;
  reason: ReactNode;
  actions?: ReactNode;
  note?: ReactNode;
  /** Qualifies the interpretation where it appears. */
  rule?: string;
}

const DEMO_RULE = 'Demo rule · not clinically validated';

/** "movement break taken." → "Movement break" */
const actionName = (text: string): string => {
  const t = text.replace(/\.$/, '').replace(/ taken$/i, '');
  return t.charAt(0).toUpperCase() + t.slice(1);
};

function useDecision(issue: Issue | undefined): Decision {
  const app = useApp();
  const { go } = useNav();
  const { now, ev, draft, deferUntil, recheckAt, readings, flag } = app;
  const sess = ev.sessionToday;
  const inMin = (t: number) => `In ${Math.max(1, Math.ceil(t - now))} min`;
  const simulated = sess?.provenance === 'synthetic';
  const resultWord = sess ? `${simulated ? 'simulated' : 'measured'} ${clock(sess.at)} result` : 'last result';
  const review = flag
    ? null
    : <span className="review"><Btn onClick={() => go({ view: 'flag' })}>Mark for medical review</Btn><span className="sm muted">Saves a local flag; no notification is sent.</span></span>;

  if (!issue) {
    return {
      kind: 'clear', scope: 'Available readings',
      headline: 'Nothing needs follow-up from these readings',
      reason: <>No demo rule was triggered.{sess ? '' : ' Alertness has not been tested.'}</>,
    };
  }

  switch (issue.id) {
    case 'checkin': {
      const answered = [draft.mood, draft.kss, draft.sleep].filter((v) => v !== null).length;
      const noNight = !readings.some((r) => r.indicator === 'sleep' && r.provenance === 'recorded' && sameDay(r.at, now));
      return {
        kind: 'task',
        headline: answered ? 'Finish your daily check-in' : 'Start your daily check-in',
        reason: noNight
          ? 'No overnight recording. Complete your check-in; sleep, HRV and sleeping heart rate remain unavailable.'
          : 'Report today’s sleepiness and mood. Takes under a minute.',
        actions: <Btn variant="primary" onClick={() => go({ view: 'checkin' })}>{answered ? 'Resume check-in' : 'Start check-in'}</Btn>,
        note: answered ? `Draft kept: ${answered} of 3 answered.` : undefined,
      };
    }
    case 'alertness-check': {
      const deferred = deferUntil !== null && now < deferUntil;
      const failed = app.sessions.filter((s) => sameDay(s.at, now)).slice(-1)[0];
      return {
        kind: 'watch', scope: 'Alertness',
        headline: deferred ? `Check your alertness at ${clock(deferUntil!)}` : 'Check your alertness',
        countdown: deferred ? inMin(deferUntil!) : undefined,
        reason: issue.why,
        actions: (
          <>
            <Btn variant="primary" onClick={() => go({ view: 'check' })}>Start 3-min alertness check</Btn>
            {deferred ? <Btn variant="quiet" onClick={() => app.setDefer(null)}>Cancel reminder</Btn> : <Remind onPick={app.setDefer} />}
          </>
        ),
        note: failed && !failed.valid ? `The ${clock(failed.at)} attempt was not scored.` : undefined,
        rule: DEMO_RULE,
      };
    }
    case 'alertness-result': {
      const act = issue.level === 'act';
      return {
        kind: act ? 'act' : 'watch', scope: simulated ? 'Alertness · Simulated result' : 'Alertness',
        headline: act ? 'Review the suggested rest' : 'Review the suggested movement break',
        reason: <>The {resultWord} is slower than the study reference.</>,
        actions: <>
          <Btn variant="primary" onClick={() => sess && go({ view: 'result', id: sess.id })}>{act ? 'View rest steps' : 'View movement-break steps'}</Btn>
          {act && review}
        </>,
        rule: DEMO_RULE,
      };
    }
    case 'alertness-followup': {
      const action = app.actions.filter((a) => a.issue === 'alertness-result').slice(-1)[0];
      const due = recheckAt !== null && now >= recheckAt;
      return {
        kind: issue.level === 'act' ? 'act' : 'watch', scope: simulated ? 'Alertness · Simulated result' : 'Alertness',
        headline: recheckAt === null ? 'Choose a re-check time' : due ? 'Re-check your alertness now' : `Re-check at ${clock(recheckAt)}`,
        countdown: recheckAt !== null && !due ? inMin(recheckAt) : undefined,
        reason: <>The {resultWord} was slower than the study reference.{action ? <> {actionName(action.text)} recorded at <span className="num">{clock(action.at)}</span>.</> : null}</>,
        actions: recheckAt === null
          ? <><Btn variant="primary" onClick={() => app.setRecheck(30)}>Re-check at {clock(now + 30)}</Btn><Btn onClick={() => app.setRecheck(60)}>At {clock(now + 60)}</Btn></>
          : due
            ? <Btn variant="primary" onClick={() => go({ view: 'check' })}>Start re-check</Btn>
            : <Btn variant="quiet" onClick={() => app.setRecheck(null)}>Change time</Btn>,
        rule: DEMO_RULE,
      };
    }
    case 'temperature': {
      const t = latest(readings, 'temperature')!;
      const dueAt = t.at + 30;
      const due = now >= dueAt;
      return {
        kind: 'watch', scope: 'Temperature',
        headline: due ? 'Re-check your temperature now' : `Re-check temperature at ${clock(dueAt)}`,
        countdown: due ? undefined : inMin(dueAt),
        reason: <>Temperature entered: <span className="num">{t.value.toFixed(1)} °C</span> at <span className="num">{clock(t.at)}</span>. At or above this demo’s {FEVER_C.toFixed(1)} °C threshold.</>,
        actions: <>{due && <Btn variant="primary" onClick={() => go({ view: 'entry', kind: 'temp' })}>Log temperature</Btn>}{review}</>,
        rule: 'Demo threshold · not clinically validated',
      };
    }
    case 'blood-sugar': {
      const confirmed = issue.title.includes('twice');
      return {
        kind: 'watch', scope: 'Blood sugar',
        headline: confirmed ? 'Mark both readings for medical review' : 'Re-check your blood sugar',
        reason: issue.why,
        actions: confirmed ? review : <Btn variant="primary" onClick={() => go({ view: 'entry', kind: 'bp' })}>Log blood sugar</Btn>,
        note: confirmed ? undefined : 'Single readings vary, so one re-check comes before any flag.',
        rule: 'Earth fasting lab range · applied as a demo rule',
      };
    }
    case 'heart-rate':
      return {
        kind: 'watch', scope: 'Heart rate',
        headline: 'Log blood pressure and blood sugar',
        reason: issue.why,
        actions: <Btn variant="primary" onClick={() => go({ view: 'entry', kind: 'bp' })}>Log readings</Btn>,
        rule: DEMO_RULE,
      };
    case 'bp-due':
    default:
      return {
        kind: 'task',
        headline: 'Log blood pressure and blood sugar',
        reason: 'Weekly entry. About 30 seconds.',
        actions: <Btn variant="primary" onClick={() => go({ view: 'entry', kind: 'bp' })}>Log readings</Btn>,
      };
  }
}

/* ---------- Evidence: what each reading says, in words ---------- */

function explain(id: IndicatorId, app: ReturnType<typeof useApp>): string {
  const s = app.ev.statuses[id];
  const r = s.latest!;
  if (r.quality?.usable === false) return r.quality.note;
  if (id === 'sleepiness') return KSS[r.value];
  if (id === 'hrv' || id === 'heartRate') {
    if (!s.baseline) return s.baselineNeeded !== undefined ? '' : s.summary;
    const b = s.baseline;
    const where = r.value < b.low ? 'Below range' : r.value > b.high ? 'Above range' : 'Within range';
    const pct = s.summary.match(/(\d+)\s?%/);
    return s.status === 'watch' && pct ? `${where}\n${pct[1]}% below ${b.synthetic ? 'demo' : 'your'} mean` : where;
  }
  return s.summary;
}

function Cell({ id }: { id: IndicatorId }) {
  const app = useApp();
  const { ev, now } = app;
  const { go } = useNav();
  const s = ev.statuses[id];
  const info = INFO[id];
  const flagged = s.status === 'watch' || s.status === 'act';
  const head = (
    <span className="cell-head">
      <span className="label">{info.name}</span>
      {flagged && <span className={`contrib ${s.status}`}>Flagged by demo rule</span>}
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
            <span className="sm">Than the study reference · {sess.lapses} lapse{sess.lapses === 1 ? '' : 's'}</span>
            <span className="cellmeta"><span className="num">{clock(sess.at)}</span><Prov p={sess.provenance} test /></span>
          </>
        ) : <span className="na">Not tested today</span>}
      </button>
    );
  }

  const r = s.latest;
  const current = r && sameDay(r.at, now);
  const nightly = id === 'sleep' || id === 'hrv' || id === 'heartRate';
  if (!current) {
    return (
      <button type="button" className="cell" onClick={() => go({ view: 'indicator', id })}>
        {head}
        <span className="na">{nightly ? 'No overnight recording' : 'Not entered today'}</span>
      </button>
    );
  }
  const b = s.baseline;
  const range = b ? `${b.synthetic ? 'Demo range' : 'Your range'}: ${Math.round(b.low)}–${Math.round(b.high)} ${r.unit}` : null;
  const text = explain(id, app);
  return (
    <button type="button" className="cell" onClick={() => go({ view: 'indicator', id })}>
      {head}
      <Value r={r} className="big" />
      {range && <span className="sm muted">{range}</span>}
      {!b && s.baselineNeeded !== undefined && (
        <span className="sm muted">Demo baseline: {7 - s.baselineNeeded} of 7 nights · no comparison yet</span>
      )}
      {text && text.split('\n').map((line) => <span key={line} className="sm">{line}</span>)}
      <span className="cellmeta"><span className="num">{r.window ? `${clock(r.window.from)}–${clock(r.window.to)}` : clock(r.at)}</span><Prov p={r.provenance} /></span>
    </button>
  );
}

/* ---------- Right rail: other open items, what is due, symptoms ---------- */

function Side({ heroId }: { heroId: Issue['id'] | undefined }) {
  const app = useApp();
  const { go } = useNav();
  const { ev, now, readings, recheckAt, symptoms } = app;
  const others = ev.issues.slice(1).filter((i) => i.level !== 'due');
  const checkinDue = heroId !== 'checkin' && ev.issues.some((i) => i.id === 'checkin');
  const bp = latest(readings, 'bloodPressure');
  const later: { what: string; when: string }[] = [];
  if (recheckAt !== null && heroId !== 'alertness-followup') later.push({ what: 'Alertness re-check', when: `${clock(recheckAt)} · in ${Math.max(1, Math.ceil(recheckAt - now))} min` });
  if (heroId !== 'bp-due') {
    const days = bp ? Math.ceil((bp.at + WEEKLY - now) / 1440) : 0;
    later.push({ what: 'Blood pressure + blood sugar', when: days <= 0 ? 'Due' : `In ${days} d · weekly` });
  }
  const todays = symptoms.filter((s) => sameDay(s.at, now));
  return (
    <aside className="side">
      {others.length > 0 && (
        <section className="panel stack-sm">
          <h2 className="rail-h">Also open</h2>
          <ul className="rows">{others.map((i) => <li key={i.id}><Mark kind={i.level === 'act' ? 'act' : 'watch'} scope={i.title} /></li>)}</ul>
        </section>
      )}
      {checkinDue && (
        <section className="panel stack-sm">
          <h2 className="rail-h">Also due</h2>
          <Btn onClick={() => go({ view: 'checkin' })}>Start check-in</Btn>
        </section>
      )}
      {!heroId && (
        <section className="panel stack-sm">
          <h2 className="rail-h">Optional</h2>
          <Btn onClick={() => go({ view: 'check' })}>Alertness check · 3 min</Btn>
        </section>
      )}
      {later.length > 0 && (
        <section className="panel stack-sm">
          <h2 className="rail-h">Next scheduled</h2>
          <ul className="rows quiet">{later.map((n) => <li key={n.what}><b>{n.what}</b><span className="sm muted num">{n.when}</span></li>)}</ul>
        </section>
      )}
      <section className="panel stack-sm">
        <h2 className="rail-h">Symptoms</h2>
        {todays.length > 0 && <ul className="rows quiet">{todays.map((s) => <li key={s.id}><b>{s.list.join(', ')}{s.tempC !== undefined ? ` · ${s.tempC.toFixed(1)} °C` : ''}</b><span className="sm muted">Reported {clock(s.at)}</span></li>)}</ul>}
        <Btn onClick={() => go({ view: 'symptom' })}>Report a symptom</Btn>
        <p className="sm muted"><FlagLine /></p>
      </section>
    </aside>
  );
}

export function Today() {
  const { ev } = useApp();
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
            <div className="headblock">
              <h1 id="decision-h" tabIndex={-1}>{d.headline}</h1>
              {d.countdown && <p className="countdown">{d.countdown}</p>}
            </div>
            <p className="reason">{d.reason}</p>
            {d.actions && <div className="row actions">{d.actions}</div>}
            {(d.rule || d.note) && <p className="limit">{[d.note, d.rule].filter(Boolean).join(' · ')}</p>}
          </section>
          <div className="strip" aria-label="Readings behind this" style={{ ['--cols' as string]: ids.length }}>
            {ids.map((id) => <Cell key={id} id={id} />)}
          </div>
          <button type="button" className="allrow" onClick={() => go({ view: 'measurements' })}>
            <span>All measurements</span><span aria-hidden="true">→</span>
          </button>
        </div>
        <Side heroId={issue?.id} />
      </div>
      <Foot />
    </>
  );
}

/** All nine indicators, compact. Used on Measurements, not on Today. */
export function Tiles() {
  const { ev, now } = useApp();
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
              {sess ? <>{clock(sess.at)} · <Prov p={sess.provenance} test /></>
                : current ? <>{clock(r.at)} · <Prov p={r.provenance} /></>
                  : r ? <>Last: {plain(r)} · {age(r.at, now)} · {provLabel(r.provenance)}</> : 'No reading'}
            </span>
          </button>
        );
      })}
    </div>
  );
}
