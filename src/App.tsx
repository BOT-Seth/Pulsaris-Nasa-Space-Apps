import { useEffect, useMemo, useRef, useState } from 'react';
import { SCENARIOS } from './domain/scenario';
import { INDICATORS } from './domain/rules';
import { clock, missionDay } from './domain/time';
import type { IndicatorId } from './domain/types';
import { AppProvider, useApp } from './state/store';
import { Btn, Mark } from './ui/primitives';
import { NavCtx, type Route } from './ui/shared';
import { Check, Result, useRunSaver } from './views/Alertness';
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

/** Demo-only shortcut: loads a simulated alertness result without running the 3-minute test. */
function DemoSamples() {
  const { sample } = useRunSaver();
  return (
    <div className="row">
      <span className="sm">Sample alertness result</span>
      <Btn small onClick={() => sample('watch')}>Watch</Btn>
      <Btn small onClick={() => sample('act')}>Act</Btn>
      <Btn small onClick={() => sample('ok')}>Within range</Btn>
      <span className="sm muted">Stored and labeled as simulated.</span>
    </div>
  );
}

function Shell() {
  const app = useApp();
  const [route, setRoute] = useState<Route>(fromHash);
  const main = useRef<HTMLElement>(null);
  const first = useRef(true);
  const nav = useMemo(() => ({ route, go: setRoute }), [route]);
  const open = app.ev.issues.filter((i) => i.level !== 'due').length;
  const navRef = useRef<HTMLElement>(null);
  const [navEdge, setNavEdge] = useState({ left: false, right: false });
  const syncNav = () => {
    const n = navRef.current;
    if (!n) return;
    const left = n.scrollLeft > 2, right = n.scrollLeft + n.clientWidth < n.scrollWidth - 2;
    setNavEdge((e) => (e.left === left && e.right === right ? e : { left, right }));
  };
  const revealTab = () => {
    const n = navRef.current, a = n?.querySelector<HTMLElement>('[aria-current="page"]');
    if (!n || !a || n.scrollWidth <= n.clientWidth) return;
    const pad = 48; // the width of an edge control
    if (a.offsetLeft - pad < n.scrollLeft) n.scrollLeft = Math.max(0, a.offsetLeft - pad);
    else if (a.offsetLeft + a.offsetWidth + pad > n.scrollLeft + n.clientWidth) n.scrollLeft = a.offsetLeft + a.offsetWidth + pad - n.clientWidth;
    syncNav();
  };
  useEffect(() => {
    syncNav();
    const ro = new ResizeObserver(() => { revealTab(); syncNav(); });
    if (navRef.current) ro.observe(navRef.current);
    return () => ro.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Move focus to the new screen's heading, so keyboard and screen-reader users land in the right place.
  useEffect(() => {
    if (window.location.hash !== toHash(route)) window.history.replaceState(null, '', toHash(route));
    // On phones the tabs scroll sideways: keep the current tab fully clear of the edge controls.
    revealTab();
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
          <div className="navwrap">
          {navEdge.left && <button type="button" className="navmore left" aria-label="Show earlier navigation" onClick={() => navRef.current?.scrollBy({ left: -160, behavior: 'smooth' })}>‹</button>}
          <nav className="nav" aria-label="Main" ref={navRef} onScroll={syncNav}>
            {TABS.map((t) => (
              <button key={t.view} type="button" aria-current={TAB_OF[route.view] === t.view ? 'page' : undefined} onClick={() => setRoute({ view: t.view })}>
                {t.label}{t.view === 'today' && open > 0 && <span className="count">· {open} open</span>}
              </button>
            ))}
            <button type="button" className="end" aria-current={route.view === 'sources' ? 'page' : undefined} onClick={() => setRoute({ view: 'sources' })}>Sources</button>
          </nav>
          {navEdge.right && <button type="button" className="navmore right" aria-label="Show more navigation" onClick={() => navRef.current?.scrollBy({ left: 160, behavior: 'smooth' })}>›</button>}
          </div>
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
            <DemoSamples />
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
