import { useCallback, useState } from "react";
import styles from "./Beacon.module.css";
import { TestScreen } from "./TestScreen";
import { ResultScreen } from "./ResultScreen";
import { lapseLineFor } from "./pvt";
import { buildSession, usesAdaptiveStop } from "./session";
import type { Baseline, CountermeasureCardContent, SessionRecord, TestRun, Trigger } from "./types";

export interface BeaconFlowProps {
  trigger: Trigger;
  /** "Why now" line from the status engine, e.g. "HRV 22% below your baseline". */
  triggerCause?: string;
  /** Show the Start / Snooze prompt first. Off when the astronaut started the check themselves. */
  showPrompt?: boolean;
  /** Latest check-in sleepiness. Reused (step skipped) if logged under 2 h ago. */
  recentSleepiness?: { value: number; loggedAt: string } | null;
  /** Last night's sleep, for deciding if this session is "rested". */
  sleepHoursLastNight?: number | null;
  /** From computeBaseline(history), or SAMPLE_BASELINE in demos. Null = building baseline. */
  baseline: Baseline | null;
  /** Earlier sessions, for the 2-Acts-in-24-h escalation rule. */
  history: SessionRecord[];
  /** Called once the result is known. The host saves it. */
  onComplete: (record: SessionRecord) => void;
  /** Close the flow (Done, Close, or quit before the test). */
  onExit: () => void;
  onSnooze?: (minutes: 15 | 30 | 60) => void;
  onRecheck?: (minutes: number) => void;
}

type Step = "prompt" | "sleepiness" | "test" | "result";

const REUSE_SLEEPINESS_MS = 2 * 60 * 60 * 1000;

/** Karolinska Sleepiness Scale anchors (Åkerstedt & Gillberg 1990). */
const KSS = [
  "Extremely alert",
  "Very alert",
  "Alert",
  "Rather alert",
  "Neither alert nor sleepy",
  "Some signs of sleepiness",
  "Sleepy, no effort to stay awake",
  "Sleepy, some effort to stay awake",
  "Very sleepy, fighting sleep",
];

export function BeaconFlow(props: BeaconFlowProps) {
  const recent = props.recentSleepiness;
  const reuse =
    !!recent && Date.now() - new Date(recent.loggedAt).getTime() < REUSE_SLEEPINESS_MS ? recent.value : null;
  const adaptive = usesAdaptiveStop(props.baseline);

  const firstStep: Step = props.showPrompt === false ? (reuse !== null ? "test" : "sleepiness") : "prompt";
  const [step, setStep] = useState<Step>(firstStep);
  const [sleepiness, setSleepiness] = useState<number | null>(reuse);
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<{
    record: SessionRecord;
    card: CountermeasureCardContent;
    reasons: string[];
  } | null>(null);

  const afterPrompt = () => setStep(reuse !== null ? "test" : "sleepiness");

  const onTestDone = useCallback(
    (run: TestRun) => {
      const built = buildSession({
        run,
        trigger: props.trigger,
        sleepiness,
        sleepinessReused: reuse !== null,
        sleepHours: props.sleepHoursLastNight ?? null,
        baseline: props.baseline,
        history: props.history,
      });
      setResult(built);
      setStep("result");
      props.onComplete(built.record);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sleepiness, props.baseline, props.history, props.trigger],
  );

  if (step === "prompt") {
    return (
      <div className={styles.screen}>
        <p className={styles.label}>BEACON · ALERTNESS CHECK · {adaptive ? "UNDER 3 MIN" : "3 MIN"}</p>
        <h1 className={styles.title}>{props.triggerCause ?? "Quick alertness check"}</h1>
        <p className={styles.body}>Tap anywhere as soon as the beacon lights up. That's it.</p>
        <div className={styles.actions}>
          <button type="button" className={styles.primary} onClick={afterPrompt} autoFocus>
            Start
          </button>
          {props.onSnooze && (
            <div className={styles.snooze} role="group" aria-label="Snooze">
              <span className={styles.caption}>Snooze</span>
              {([15, 30, 60] as const).map((m) => (
                <button key={m} type="button" className={styles.secondary} onClick={() => props.onSnooze?.(m)}>
                  {m} min
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (step === "sleepiness") {
    return (
      <div className={styles.screen}>
        <p className={styles.label}>BEFORE YOU START</p>
        <h1 className={styles.title} id="bc-kss">
          How sleepy are you right now?
        </h1>
        <div className={styles.kss} role="radiogroup" aria-labelledby="bc-kss">
          {KSS.map((words, i) => (
            <button
              key={i}
              type="button"
              role="radio"
              aria-checked={sleepiness === i + 1}
              className={styles.kssStop}
              onClick={() => {
                setSleepiness(i + 1);
                setStep("test"); // one tap: pick and go
              }}
            >
              <span className={styles.kssNum}>{i + 1}</span>
              <span className={styles.kssWords}>{words}</span>
            </button>
          ))}
        </div>
        <button type="button" className={styles.quiet} onClick={props.onExit}>
          Cancel
        </button>
      </div>
    );
  }

  if (step === "test") {
    return (
      <TestScreen
        key={attempt}
        lapseLineMs={lapseLineFor(props.baseline)}
        adaptive={adaptive}
        onDone={onTestDone}
      />
    );
  }

  return result ? (
    <ResultScreen
      record={result.record}
      card={result.card}
      reasons={result.reasons}
      baseline={props.baseline}
      onDone={props.onExit}
      onRecheck={props.onRecheck}
      onRetry={() => {
        setAttempt((a) => a + 1);
        setResult(null);
        setStep("test");
      }}
    />
  ) : null;
}
