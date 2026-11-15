import { KSS, MOOD } from '../domain/content';
import { latest } from '../domain/rules';
import { clock, duration, sameDay } from '../domain/time';
import { useApp } from '../state/store';
import { Btn, Icon } from '../ui/primitives';
import { Foot, useNav } from '../ui/shared';

function Scale({ name, count, value, words, onPick }: { name: string; count: number; value: number | null; words: string[]; onPick: (v: number) => void }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => i + 1).map((i) => (
        <label key={i}>
          <input type="radio" name={name} value={i} checked={value === i} onChange={() => onPick(i)} aria-label={`${i}, ${words[i]}`} />
          <span className="num">{i}</span>
        </label>
      ))}
    </>
  );
}

/** Daily check-in. Answers are kept as a draft on every tap, so an interruption loses nothing. */
export function CheckIn() {
  const { draft, setDraft, saveCheckin, readings, now } = useApp();
  const { go } = useNav();
  const sleep = latest(readings, 'sleep');
  const night = sleep && sameDay(sleep.at, now) && sleep.provenance === 'recorded' ? sleep : null;
  const total = night ? 3 : 2;
  const answered = [draft.mood !== null, draft.kss !== null, ...(night ? [draft.sleep !== null] : [])].filter(Boolean).length;
  const ready = answered === total;
  const save = () => { if (ready) { saveCheckin(); go({ view: 'today' }); } };
  const items: [string, string | null][] = [
    ['Mood', draft.mood ? `${draft.mood} · ${MOOD[draft.mood]}` : null],
    ['Sleepiness', draft.kss ? `${draft.kss} · ${KSS[draft.kss]}` : null],
    ...(night ? [['Last night’s sleep', draft.sleep === 'yes' ? 'Looks right' : draft.sleep === 'no' ? 'Not right' : null] as [string, string | null]] : []),
  ];
  return (
    <form className="today form" onSubmit={(e) => { e.preventDefault(); save(); }}>
      <div className="main-col">
        <section className="decision task formhead" aria-labelledby="ci-h">
          <p className="mark lg task">{Icon.due}<b>Daily check-in</b><span className="scope">{total} questions · under a minute</span></p>
          <h1 id="ci-h" tabIndex={-1}>How are you this morning?</h1>
        </section>
        <section className="panel q">
          <fieldset className="choices">
            <legend>1. Mood</legend>
            <Scale name="mood" count={5} value={draft.mood} words={MOOD} onPick={(mood) => setDraft({ ...draft, mood })} />
          </fieldset>
          <div className="ends"><span>1 Very low</span><span>5 Very good</span></div>
        </section>
        <section className="panel q">
          <fieldset className="choices">
            <legend>2. Sleepiness right now</legend>
            <Scale name="kss" count={9} value={draft.kss} words={KSS} onPick={(kss) => setDraft({ ...draft, kss })} />
          </fieldset>
          <p className="anchor" aria-live="polite">{draft.kss ? <><span className="num">{draft.kss}</span> {KSS[draft.kss]}</> : <span className="muted">1 Extremely alert · 9 Very sleepy, great effort to keep awake</span>}</p>
        </section>
        {night ? (
          <section className="panel q">
            <fieldset className="choices words">
              <legend>3. Last night’s sleep: <span className="num">{duration(night.value)}</span>, recorded {night.window ? `${clock(night.window.from)}–${clock(night.window.to)}` : ''}</legend>
              <label><input type="radio" name="sleep" checked={draft.sleep === 'yes'} onChange={() => setDraft({ ...draft, sleep: 'yes' })} />Looks right</label>
              <label><input type="radio" name="sleep" checked={draft.sleep === 'no'} onChange={() => setDraft({ ...draft, sleep: 'no' })} />Not right</label>
            </fieldset>
          </section>
        ) : <section className="panel q"><p className="sm muted">No overnight recording, so there is no sleep to confirm.</p></section>}
      </div>
      <aside className="side">
        <section className="panel stack-sm sticky">
          <h2 className="rail-h">{answered} of {total} answered</h2>
          <ul className="rows quiet progress">
            {items.map(([q, a]) => <li key={q}><b>{q}</b><span className={`sm ${a ? '' : 'muted'}`}>{a ?? 'Not answered'}</span></li>)}
          </ul>
          <Btn type="submit" variant="primary" disabled={!ready}>Save check-in</Btn>
          <Btn variant="quiet" onClick={() => go({ view: 'today' })}>Close, keep draft</Btn>
          <p className="sm muted">Answers are kept as you tap. Nothing is saved to the record until you press Save.</p>
        </section>
      </aside>
      <div className="formfoot"><Foot /></div>
    </form>
  );
}
