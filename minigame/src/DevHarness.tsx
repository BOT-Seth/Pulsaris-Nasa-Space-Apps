/**
 * DEV PAGE ONLY: not part of the app.
 * Stands in for the host app: picks the trigger and baseline, stores sessions, shows the record.
 */
import { useMemo, useState } from "react";
import {
  BeaconFlow,
  computeBaseline,
  SAMPLE_BASELINE,
  causeLine,
  toIndicatorStatus,
  StatusChip,
  type SessionRecord,
  type Trigger,
} from "./beacon";
import styles from "./DevHarness.module.css";

const KEY = "beacon-dev-sessions";

function load(): SessionRecord[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]") as SessionRecord[];
  } catch {
    return [];
  }
}
function save(list: SessionRecord[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* private mode: keep in memory only */
  }
}

const TRIGGERS: { value: Trigger; label: string; cause: string }[] = [
  { value: "low_hrv", label: "Low HRV", cause: "HRV 22% below your baseline (sleep window)" },
  { value: "short_sleep", label: "Short sleep", cause: "4 h 40 min sleep last night" },
  { value: "self_report", label: "Sleepiness ≥ 7", cause: "You rated sleepiness 7 of 9" },
  { value: "pre_task", label: "Before critical task", cause: "Robotic arm session in 30 min" },
  { value: "manual", label: "Manual start", cause: "Quick alertness check" },
];

type BaselineMode = "sample" | "own" | "none";

export function DevHarness() {
  const [sessions, setSessions] = useState<SessionRecord[]>(load);
  const [running, setRunning] = useState(false);
  const [trigger, setTrigger] = useState<Trigger>("low_hrv");
  const [mode, setMode] = useState<BaselineMode>("sample");
  const [reuseKss, setReuseKss] = useState(false);
  const [sleepHours, setSleepHours] = useState(7.5);
  const [showPrompt, setShowPrompt] = useState(true);
  const [log, setLog] = useState<string>("");

  const own = useMemo(() => computeBaseline(sessions), [sessions]);
  const baseline = mode === "sample" ? SAMPLE_BASELINE : mode === "own" ? own : null;
  const t = TRIGGERS.find((x) => x.value === trigger)!;
  const last = sessions[sessions.length - 1];

  if (running) {
    return (
      <BeaconFlow
        trigger={trigger}
        triggerCause={t.cause}
        showPrompt={showPrompt}
        recentSleepiness={reuseKss ? { value: 3, loggedAt: new Date().toISOString() } : null}
        sleepHoursLastNight={sleepHours}
        baseline={baseline}
        history={sessions}
        onComplete={(r) => {
          const next = [...sessions, r];
          setSessions(next);
          save(next);
        }}
        onExit={() => setRunning(false)}
        onSnooze={(m) => {
          setLog(`Snoozed ${m} min`);
          setRunning(false);
        }}
        onRecheck={(m) => {
          setLog(`Re-check scheduled in ${m} min`);
          setRunning(false);
        }}
      />
    );
  }

  return (
    <main className={styles.page}>
      <p className={styles.dev}>DEV PAGE · stands in for the Pulsaris app · not shipped</p>
      <h1 className={styles.h1}>Beacon</h1>

      <section className={"card " + styles.grid}>
        <label>
          Trigger
          <select value={trigger} onChange={(e) => setTrigger(e.target.value as Trigger)}>
            {TRIGGERS.map((x) => (
              <option key={x.value} value={x.value}>
                {x.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Baseline
          <select value={mode} onChange={(e) => setMode(e.target.value as BaselineMode)}>
            <option value="sample">Sample demo baseline</option>
            <option value="own">Own ({own ? `${own.n} rested sessions` : "need 3 rested"})</option>
            <option value="none">None (first use)</option>
          </select>
        </label>
        <label>
          Sleep last night (h)
          <input
            type="number"
            min={0}
            max={14}
            step={0.5}
            value={sleepHours}
            onChange={(e) => setSleepHours(Number(e.target.value))}
          />
        </label>
        <label className={styles.check}>
          <input type="checkbox" checked={showPrompt} onChange={(e) => setShowPrompt(e.target.checked)} />
          Show trigger prompt
        </label>
        <label className={styles.check}>
          <input type="checkbox" checked={reuseKss} onChange={(e) => setReuseKss(e.target.checked)} />
          Sleepiness logged &lt; 2 h ago (skip step)
        </label>
      </section>

      <button type="button" className={styles.go} onClick={() => setRunning(true)}>
        Open Beacon
      </button>
      {log && <p className={styles.note}>{log}</p>}

      <section className="card">
        <h2 className={styles.h2}>What the app receives</h2>
        {last ? (
          <>
            <p className={styles.row}>
              <StatusChip status={toIndicatorStatus(last.pvt.band)} /> {causeLine(last, [])}
            </p>
            <pre className={styles.pre}>{JSON.stringify(last, null, 2)}</pre>
          </>
        ) : (
          <p>No sessions yet.</p>
        )}
        <p className={styles.note}>
          {sessions.length} saved · {sessions.filter((s) => s.rested && s.complete).length} rested ·{" "}
          <button
            type="button"
            className={styles.link}
            onClick={() => {
              setSessions([]);
              save([]);
            }}
          >
            Clear
          </button>
        </p>
      </section>
    </main>
  );
}
