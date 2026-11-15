import { useEffect, useMemo, useRef, useState } from 'react';
import { SCENARIOS } from './domain/scenario';
import { INDICATORS } from './domain/rules';
import { clock, missionDay } from './domain/time';
import type { IndicatorId } from './domain/types';
import { AppProvider, useApp } from './state/store';
import { Btn, Mark } from './ui/primitives';
import { NavCtx, type Route } from './ui/shared';
import { Check, Result } from './views/Alertness';
import { BodyMap, FlagView, SymptomForm } from './views/Body';
import { CheckIn } from './views/CheckIn';
import { LogView, SourcesView } from './views/LogSources';
import { Entry, IndicatorDetail, Measurements } from './views/Measurements';
import { Today } from './views/Today';

const TABS: { view: 'today' | 'measurements' | 'body' | 'log'; label: string }[] = [
  { view: 'today', label: 'Today' },
  { view: 'measurements', label: 'Measurements' },
  { view: 'body', label: 'Body map' },
  { view: 'log', label: 'Plan & log' },
];
const TAB_OF: Record<Route['view'], string> = {
  today: 'today', checkin: 'today', check: 'today', result: 'today', symptom: 'today', flag: 'today', entry: 'today',
  measurements: 'measurements', indicator: 'measurements', body: 'body', log: 'log', sources: 'sources',
};

// The screen is mirrored in the URL hash, so a reload or a shared link lands on the same screen.
const SIMPLE = ['today', 'measurements', 'body', 'log', 'sources', 'checkin', 'check', 'symptom', 'flag'] as const;
function fromHash(): Route {
  const [view, arg] = window.location.hash.replace(/^#\/?/, '').split('/');
  if (view === 'indicator' && INDICATORS.includes(arg as IndicatorId)) return { view, id: arg as IndicatorId };
  if (view === 'entry' && (arg === 'bp' || arg === 'temp')) return { view, kind: arg };
  if (view === 'result' && arg) return { view, id: arg };
  if ((SIMPLE as readonly string[]).includes(view)) return { view } as Route;
  return { view: 'today' };
}
function toHash(r: Route): string {
  return r.view === 'indicator' ? `#/indicator/${r.id}` : r.view === 'entry' ? `#/entry/${r.kind}` : r.view === 'result' ? `#/result/${r.id}` : r.view === 'today' ? '#/' : `#/${r.view}`;
}

function View({ route }: { route: Route }) {
  switch (route.view) {
    case 'today': return <Today />;
    case 'measurements': return <Measurements />;
    case 'indicator': return <IndicatorDetail id={route.id} />;
    case 'entry': return <Entry kind={route.kind} />;
    case 'checkin': return <CheckIn />;
    case 'check': return <Check />;
    case 'result': return <Result id={route.id} />;
    case 'body': return <BodyMap region={route.region} />;
    case 'symptom': return <SymptomForm region={route.region} />;
    case 'flag': return <FlagView />;
    case 'log': return <LogView />;
    case 'sources': return <SourcesView />;
  }
}

function Shell() {
  const app = useApp();
  const [route, setRoute] = useState<Route>(fromHash);
  const main = useRef<HTMLElement>(null);
  const first = useRef(true);
  const nav = useMemo(() => ({ route, go: setRoute }), [route]);
  const open = app.ev.issues.filter((i) => i.level !== 'due').length;

  // Move focus to the new screen's heading, so keyboard and screen-reader users land in the right place.
  useEffect(() => {
    if (window.location.hash !== toHash(route)) window.history.replaceState(null, '', toHash(route));
    if (first.current) { first.current = false; return; }
    window.scrollTo(0, 0);
    main.current?.querySelector<HTMLElement>('h1')?.focus({ preventScroll: true });
  }, [route]);

  return (
    <NavCtx.Provider value={nav}>
      <div className="app">
        <header className="toolbar">
          <div className="bar">
            <div className="brand"><Mark />PULSARIS</div>
            <div className="meta">
              <span>Crew member <b>M.A.</b></span>
              <span>Mission clock <b>Day {missionDay(app.now)} · {clock(app.now)}</b></span>
              <span>Data <b>demo scenario</b></span>
              <span>Ground link <b>{app.link ? 'available' : 'none · records local'}</b></span>
            </div>
          </div>
          <nav className="nav" aria-label="Main">
            {TABS.map((t) => (
              <button key={t.view} type="button" aria-current={TAB_OF[route.view] === t.view ? 'page' : undefined} onClick={() => setRoute({ view: t.view })}>
                {t.label}{t.view === 'today' && open > 0 && <span className="count">· {open} open</span>}
              </button>
            ))}
            <button type="button" className="end" aria-current={route.view === 'sources' ? 'page' : undefined} onClick={() => setRoute({ view: 'sources' })}>Sources</button>
          </nav>
        </header>
        <main className="main" ref={main}><View route={route} /></main>
      </div>

      {/* Outside .app on purpose: .app is a size container, which would trap position: fixed. */}
      <div className="dock">
        <details>
          <summary><span className="tag">DEMO CONTROLS · NOT PART OF THE CREW INTERFACE</span></summary>
          <div className="inner">
            <div className="row">
              <label className="row" style={{ gap: 8 }}>
                <span className="sm">Scenario</span>
                <select value={app.scenarioId} onChange={(e) => { app.setScenario(e.target.value); setRoute({ view: 'today' }); }}>
                  {SCENARIOS.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </label>
              <span className="sm muted">{app.scenario.def.blurb}</span>
            </div>
            <div className="row">
              <Btn small onClick={() => app.jump(15)}>Clock +15 min</Btn>
              <Btn small onClick={() => app.jump(60)}>Clock +1 h</Btn>
              <Btn small onClick={app.toggleLink}>{app.link ? 'Drop ground link' : 'Restore ground link'}</Btn>
              <Btn small pressed={app.shortTest} onClick={() => app.setShortTest(!app.shortTest)}>{app.shortTest ? 'Test length: 45 s demo' : 'Test length: 3 min'}</Btn>
              <Btn small variant="quiet" onClick={() => { app.resetAll(); setRoute({ view: 'today' }); }}>Reset scenario</Btn>
            </div>
          </div>
        </details>
      </div>
    </NavCtx.Provider>
  );
}

export default function App() {
  return <AppProvider><Shell /></AppProvider>;
}
