import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import styles from "./SignalLock.module.css";
import { useSignalLockTest } from "./useSignalLockTest";
import { formatLength } from "./pvt";
import type { TestRun } from "./types";

interface Props {
  durationMs: number;
  onDone: (run: TestRun) => void;
}

/** Full-screen test. The whole screen is the tap target (design doc 07: SignalStimulus). */
export function TestScreen({ durationMs, onDone }: Props) {
  const t = useSignalLockTest(durationMs, onDone);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    root.current?.focus(); // so Space/Enter work without a click first
  }, [t.phase]);

  const stop = (e: React.SyntheticEvent) => e.stopPropagation();
  const begin = (e: React.PointerEvent | React.KeyboardEvent) => {
    if ("key" in e && e.key !== " " && e.key !== "Enter") return;
    e.preventDefault();
    t.start();
  };

  return (
    <div
      ref={root}
      className={styles.test}
      tabIndex={0}
      role="application"
      aria-label="Alertness test. Tap anywhere, or press Space, as soon as the ring appears."
      onPointerDown={t.phase === "ready" ? begin : t.onPointerDown}
      onKeyDown={t.phase === "ready" ? begin : t.onKeyDown}
      onContextMenu={(e) => e.preventDefault()}
    >
      <span className={styles.clock} ref={(el) => void (t.els.current.clock = el)} aria-hidden="true">
        {Math.floor(durationMs / 60000)}:{String(Math.round((durationMs % 60000) / 1000)).padStart(2, "0")}
      </span>

      {t.phase === "running" && (
        <button
          type="button"
          className={styles.quiet + " " + styles.corner}
          onPointerDown={stop}
          onKeyDown={stop}
          onClick={() => t.pause("confirm-quit")}
          aria-label="Pause or end the check"
        >
          <X size={20} strokeWidth={1.5} aria-hidden="true" /> Pause
        </button>
      )}

      <div className={styles.ring} data-state="off" ref={(el) => void (t.els.current.ring = el)}>
        <span className={styles.counter} ref={(el) => void (t.els.current.counter = el)}>
          0
        </span>
      </div>
      <p className={styles.message} ref={(el) => void (t.els.current.message = el)} aria-live="polite" />

      {t.phase === "ready" && (
        <div className={styles.readyText}>
          <p className={styles.title}>Tap anywhere to begin</p>
          <p className={styles.body}>Then tap as soon as the ring appears. {formatLength(durationMs)}.</p>
        </div>
      )}

      {(t.phase === "paused" || t.phase === "confirm-quit") && (
        <div className={styles.overlay} onPointerDown={stop} onKeyDown={stop}>
          <div className={"card " + styles.dialog} role="dialog" aria-modal="true" aria-labelledby="sl-paused">
            <h2 id="sl-paused" className={styles.title}>
              {t.phase === "paused" ? "Check paused" : "Pause the check?"}
            </h2>
            <p className={styles.body}>Resume within 2 minutes to keep this check. Otherwise it's saved as incomplete.</p>
            <div className={styles.actions}>
              <button type="button" className={styles.primary} onClick={t.resume} autoFocus>
                Resume
              </button>
              <button type="button" className={styles.secondary} onClick={t.quit}>
                End check
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
