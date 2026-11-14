import { INFO } from '../domain/content';
import { INDICATORS, WEEKLY, latest, series } from '../domain/rules';
import { age, clock, missionDay, sameDay } from '../domain/time';
import type { IndicatorId, Issue } from '../domain/types';
import { useApp } from '../state/store';
import { Btn, Chip, Prov, Spark, Value, plain } from '../ui/primitives';
import { EvidenceRow, FlagLine, Foot, IssueActions, chipWord, useNav } from '../ui/shared';

const HEAD: Record<Issue['level'], string> = { act: 'Needs your attention now', watch: 'Needs your attention', due: 'Next task' };

function Primary() {
  const { ev, statuses } = useDerived();
  const { go } = useNav();
  const issue = ev.issues[0];
  if (!issue) {
    const covered = INDICATORS.filter((i) => statuses[i].status === 'ok').map((i) => INFO[i].short);
    const open = INDICATORS.filter((i) => statuses[i].status === 'none' || statuses[i].status === 'info').map((i) => INFO[i].short);
    return (
      <section className="panel primary ok stack">
        <h3>Status</h3>
        <div className="title-row"><Chip kind="ok" large /><h1 tabIndex={-1}>No action needed from today’s data</h1></div>
        <p>No rule was triggered.</p>
        <p className="state ok">Covers: {covered.join(', ') || 'nothing yet'}. Not assessed or not current: {open.join(', ') || 'nothing'}.</p>
        <div className="row"><Btn onClick={() => go({ view: 'check' })}>Run alertness check before a critical task</Btn></div>
        <Evidence ids={['sleep', 'hrv', 'sleepiness']} />
      </section>
    );
  }
  return (
    <section className={`panel primary ${issue.level === 'due' ? '' : issue.level} stack`}>
      <h3>{HEAD[issue.level]}</h3>
      <div className="title-row"><Chip kind={issue.level} large /><h1 tabIndex={-1}>{issue.title}</h1></div>
      <p>{issue.why}</p>
      <p className={`state ${issue.level === 'due' ? '' : issue.level}`}>{issue.state}</p>
      <IssueActions issue={issue} />
      <Evidence ids={issue.evidence} />
    </section>
  );
}

function useDerived() {
  const app = useApp();
  return { ev: app.ev, statuses: app.ev.statuses };
}

function Evidence({ ids }: { ids: IndicatorId[] }) {
  const { go } = useNav();
  return (
    <div className="stack-sm">
      <h2>Evidence</h2>
      <ul>{ids.slice(0, 3).map((id) => <EvidenceRow key={id} id={id} />)}</ul>
      <div className="row"><Btn variant="quiet" onClick={() => go({ view: 'measurements' })}>All measurements</Btn></div>
    </div>
  );
}

function Side() {
  const app = useApp();
  const { go } = useNav();
  const { ev, now, readings, recheckAt, deferUntil, symptoms } = app;
  const others = ev.issues.slice(1);
  const mood = latest(readings, 'mood');
  const checkedIn = mood && sameDay(mood.at, now) && mood.provenance === 'self-reported';
  const bp = latest(readings, 'bloodPressure');
  const nextBp = bp ? bp.at + WEEKLY : now;
  const daysToBp = Math.ceil((nextBp - now) / 1440);
  const todays = symptoms.filter((s) => sameDay(s.at, now));
  return (
    <aside>
      {others.length > 0 && (
        <section className="panel stack-sm">
          <h2>Also open · {others.length}</h2>
          <ul className="rows">
            {others.map((i) => (
              <li key={i.id} className="stack-sm">
                <div className="title-row"><Chip kind={i.level} /><b>{i.title}</b></div>
                <p className="sm muted">{i.why}</p>
                <IssueActions issue={i} />
              </li>
            ))}
          </ul>
        </section>
      )}
      <section className="panel stack-sm">
        <h2>Due and scheduled</h2>
        <ul className="rows">
          <li><b>Daily check-in</b><p className="sm muted">{checkedIn ? <>Done <span className="num">{clock(mood.at)}</span></> : 'Due now'}</p></li>
          {recheckAt !== null && <li><b>Alertness re-check</b><p className="sm muted">{now >= recheckAt ? 'Due now' : <>Due <span className="num">{clock(recheckAt)}</span></>}</p></li>}
          {recheckAt === null && ev.issues.some((i) => i.id === 'alertness-check') && (
            <li><b>Alertness check</b><p className="sm muted">{deferUntil === null ? 'Pending' : now >= deferUntil ? 'Due now' : <>Deferred to <span className="num">{clock(deferUntil)}</span></>}</p></li>
          )}
          <li>
            <b>Blood pressure + blood sugar</b>
            <p className="sm muted">{bp ? `Last entered ${age(bp.at, now)}. ` : 'No entry yet. '}{daysToBp <= 0 ? 'Weekly entry due.' : `Next weekly entry in ${daysToBp} d. Not overdue.`}</p>
          </li>
        </ul>
      </section>
      <section className="panel stack-sm">
        <h2>Symptoms and support</h2>
        {todays.length ? (
          <ul className="rows">{todays.map((s) => (
            <li key={s.id}><p>{s.list.join(', ')}{s.tempC !== undefined && <> · <span className="num">{s.tempC.toFixed(1)} °C</span></>}</p><p className="cap">Reported {clock(s.at)} · saved on this tablet</p></li>
          ))}</ul>
        ) : <p className="sm muted">Available any time, even when measurements look ordinary.</p>}
        <div className="row"><Btn onClick={() => go({ view: 'symptom' })}>Report a symptom</Btn></div>
        <p className="sm"><FlagLine /></p>
        {!app.flag && <div className="row"><Btn variant="quiet" onClick={() => go({ view: 'flag' })}>Flag for crew medical officer</Btn></div>}
      </section>
    </aside>
  );
}

/** All nine indicators, compact. Status word and icon, value, age, provenance, trend. */
export function Tiles() {
  const { ev, readings, now } = useApp();
  const { go } = useNav();
  return (
    <div className="tiles" aria-label="All indicators">
      {INDICATORS.map((id) => {
        const s = ev.statuses[id];
        const hist = series(readings, id).slice(-8);
        const sess = id === 'alertness' ? ev.sessionToday : null;
        // A reading that is not from today is shown as the last one, never as today's value.
        const stale = s.status === 'none' && s.latest && !sameDay(s.latest.at, now) ? s.latest : null;
        return (
          <button key={id} type="button" className="tile" onClick={() => go({ view: 'indicator', id })}>
            <span className="tile-head"><span className="label">{INFO[id].short}</span><Chip kind={s.status} word={chipWord(id, s)} /></span>
            {sess ? <span className="val">{sess.speed.toFixed(2)} <small>speed</small></span>
              : s.latest && !stale ? <Value r={s.latest} /> : <span className="val">—</span>}
            <span className="cap">
              {sess ? <>{clock(sess.at)} · <Prov p={sess.provenance} /></>
                : stale ? <>Last: {plain(stale)} · {age(stale.at, now)} · <Prov p={stale.provenance} /></>
                : s.latest ? <>{sameDay(s.latest.at, now) ? clock(s.latest.at) : age(s.latest.at, now)} · <Prov p={s.latest.provenance} /></> : 'No reading'}
            </span>
            {id !== 'alertness' && id !== 'bloodPressure' && <Spark values={hist.map((r) => r.value)} synthetic={hist.map((r) => r.provenance === 'synthetic')} />}
          </button>
        );
      })}
    </div>
  );
}

export function Today() {
  const { now } = useApp();
  return (
    <>
      <div className="split"><Primary /><Side /></div>
      <section className="panel tight"><h2 style={{ padding: '10px 0' }}>All indicators · mission day {missionDay(now)}</h2></section>
      <Tiles />
      <Foot />
    </>
  );
}
