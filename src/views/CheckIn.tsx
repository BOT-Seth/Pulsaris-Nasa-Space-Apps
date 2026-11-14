import { KSS, MOOD } from '../domain/content';
import { latest } from '../domain/rules';
import { clock, duration, sameDay } from '../domain/time';
import { useApp } from '../state/store';
import { Btn } from '../ui/primitives';
import { useNav } from '../ui/shared';

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
  const night = sleep && sameDay(sleep.at, now) ? sleep : null;
  const ready = draft.mood !== null && draft.kss !== null && (!night || draft.sleep !== null);
  return (
    <section className="panel stack">
      <h3>Daily check-in · {night ? 3 : 2} questions</h3>
      <h1 tabIndex={-1}>How are you this morning?</h1>
      <form className="stack" onSubmit={(e) => { e.preventDefault(); if (ready) { saveCheckin(); go({ view: 'today' }); } }}>
        <fieldset className="choices">
          <legend>1. Mood</legend>
          <Scale name="mood" count={5} value={draft.mood} words={MOOD} onPick={(mood) => setDraft({ ...draft, mood })} />
        </fieldset>
        <div className="ends"><span>1 Very low</span><span>5 Very good</span></div>
        <fieldset className="choices">
          <legend>2. Sleepiness right now</legend>
          <Scale name="kss" count={9} value={draft.kss} words={KSS} onPick={(kss) => setDraft({ ...draft, kss })} />
        </fieldset>
        <div className="ends"><span>1 Extremely alert</span><span>9 Fighting sleep</span></div>
        <p className="notice" aria-live="polite">{draft.kss ? <><span className="num">{draft.kss}</span> · {KSS[draft.kss]}</> : 'Pick a number to see its meaning.'}</p>
        {night ? (
          <fieldset className="choices words">
            <legend>3. Last night’s sleep: <span className="num">{duration(night.value)}</span>, recorded {night.window ? `${clock(night.window.from)} to ${clock(night.window.to)}` : ''}</legend>
            <label><input type="radio" name="sleep" checked={draft.sleep === 'yes'} onChange={() => setDraft({ ...draft, sleep: 'yes' })} />Looks right</label>
            <label><input type="radio" name="sleep" checked={draft.sleep === 'no'} onChange={() => setDraft({ ...draft, sleep: 'no' })} />Not right</label>
          </fieldset>
        ) : <p className="notice">No sleep recording exists for last night, so there is nothing to confirm.</p>}
        <div className="row">
          <Btn type="submit" variant="primary" disabled={!ready}>Save check-in</Btn>
          <Btn variant="quiet" onClick={() => go({ view: 'today' })}>Close, keep draft</Btn>
        </div>
        <p className="sm muted">Closing keeps your answers. Nothing is saved to the record until you press Save.</p>
      </form>
    </section>
  );
}
