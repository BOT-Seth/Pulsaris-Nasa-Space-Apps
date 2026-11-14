/**
 * The 3-minute test engine.
 *
 * Timing notes (why it's built this way):
 * - The stimulus is shown by writing to the DOM directly, not through a React render,
 *   so onset time is recorded at the moment the element changes.
 * - Responses use the input event's own timestamp (event.timeStamp), not the time the
 *   handler happened to run.
 * - Any constant device delay (touchscreen, display) is the same for the baseline,
 *   so it cancels out in scoring (own-baseline decision, 2026-11-14).
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { PVT, nextIsiMs } from "./pvt";
import type { TestRun, Trial } from "./types";

export type TestPhase = "ready" | "running" | "paused" | "confirm-quit" | "done";

export interface TestRefs {
  ring: HTMLDivElement | null;
  counter: HTMLSpanElement | null;
  message: HTMLParagraphElement | null;
  clock: HTMLSpanElement | null;
}

function eventTime(e: { timeStamp: number }): number {
  // Modern browsers give a high-resolution timestamp on the same clock as performance.now().
  const now = performance.now();
  return e.timeStamp > 0 && Math.abs(now - e.timeStamp) < 1_000 ? e.timeStamp : now;
}

export function useSignalLockTest(durationMs: number, onDone: (run: TestRun) => void) {
  const [phase, setPhase] = useState<TestPhase>("ready");
  const els = useRef<TestRefs>({ ring: null, counter: null, message: null, clock: null });

  const trials = useRef<Trial[]>([]);
  const falseStarts = useRef(0);
  const runStartedAt = useRef(0); // performance.now() when the current running stretch began
  const elapsedBefore = useRef(0); // test time accumulated before the current stretch
  const onset = useRef<number | null>(null); // performance.now() of the visible stimulus
  const lastResponseAt = useRef(-Infinity);
  const pausedAt = useRef<number | null>(null);
  const timers = useRef<number[]>([]);
  const raf = useRef<number | null>(null);
  const clockTimer = useRef<number | null>(null);
  const wakeLock = useRef<{ release: () => Promise<void> } | null>(null);
  const finished = useRef(false);
  const phaseRef = useRef<TestPhase>("ready");

  const setP = (p: TestPhase) => {
    phaseRef.current = p;
    setPhase(p);
  };

  const elapsed = () =>
    elapsedBefore.current + (phaseRef.current === "running" ? performance.now() - runStartedAt.current : 0);

  const clearTimers = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
    if (raf.current !== null) cancelAnimationFrame(raf.current);
    raf.current = null;
  };

  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  };

  const setMessage = (text: string) => {
    if (els.current.message) els.current.message.textContent = text;
  };

  const hideRing = () => {
    onset.current = null;
    if (els.current.ring) els.current.ring.dataset.state = "off";
  };

  const tickCounter = () => {
    if (onset.current === null || !els.current.counter) return;
    els.current.counter.textContent = String(Math.round(performance.now() - onset.current));
    raf.current = requestAnimationFrame(tickCounter);
  };

  const finish = useCallback(
    (complete: boolean, endedReason: TestRun["endedReason"]) => {
      if (finished.current) return;
      finished.current = true;
      const ran = elapsed();
      clearTimers();
      hideRing();
      if (clockTimer.current !== null) window.clearInterval(clockTimer.current);
      wakeLock.current?.release().catch(() => {});
      wakeLock.current = null;
      setP("done");
      onDone({
        trials: trials.current,
        falseStarts: falseStarts.current,
        elapsedMs: Math.min(ran, durationMs),
        complete,
        endedReason,
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [durationMs, onDone],
  );

  const showStimulus = () => {
    if (phaseRef.current !== "running") return;
    setMessage("");
    const ring = els.current.ring;
    if (ring) {
      if (els.current.counter) els.current.counter.textContent = "0";
      ring.dataset.state = "on";
    }
    onset.current = performance.now();
    raf.current = requestAnimationFrame(tickCounter);
    // No response at all = lapse, then move on.
    later(() => {
      if (onset.current === null) return;
      trials.current.push({ onsetMs: onsetElapsed(), rtMs: null });
      hideRing();
      setMessage("Tap as soon as the ring appears.");
      scheduleNext();
    }, PVT.timeoutMs);
  };

  // Test-time position of the current stimulus.
  const onsetElapsed = () =>
    elapsedBefore.current + ((onset.current ?? performance.now()) - runStartedAt.current);

  const scheduleNext = () => {
    later(showStimulus, nextIsiMs());
  };

  const respond = (t: number) => {
    if (phaseRef.current !== "running") return;
    if (t - lastResponseAt.current < PVT.bounceMs) return;
    lastResponseAt.current = t;

    if (onset.current !== null) {
      const rt = t - onset.current;
      const at = onsetElapsed();
      clearTimers();
      if (rt < PVT.falseStartMinRtMs) {
        falseStarts.current += 1;
        hideRing();
        setMessage("Too early");
      } else {
        trials.current.push({ onsetMs: at, rtMs: Math.round(rt) });
        // Freeze the counter on the RT (feedback), then hide.
        onset.current = null;
        if (els.current.counter) els.current.counter.textContent = String(Math.round(rt));
        const ring = els.current.ring;
        if (ring) ring.dataset.state = "frozen";
        later(() => {
          if (els.current.ring?.dataset.state === "frozen") hideRing();
        }, PVT.feedbackMs);
      }
      scheduleNext();
    } else {
      // Tap while waiting = false start; restart the gap (MINIGAME.md §4.3).
      falseStarts.current += 1;
      clearTimers();
      hideRing();
      setMessage("Too early");
      later(() => setMessage(""), PVT.feedbackMs);
      scheduleNext();
    }
  };

  const updateClock = () => {
    const left = Math.max(0, durationMs - elapsed());
    if (els.current.clock) {
      const s = Math.ceil(left / 1000);
      els.current.clock.textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
    }
    if (left <= 0) finish(true, "finished");
  };

  const runStretch = () => {
    runStartedAt.current = performance.now();
    setP("running");
    if (clockTimer.current !== null) window.clearInterval(clockTimer.current);
    clockTimer.current = window.setInterval(updateClock, 200);
    updateClock();
    scheduleNext();
  };

  const requestWakeLock = async () => {
    try {
      const nav = navigator as Navigator & {
        wakeLock?: { request: (t: "screen") => Promise<{ release: () => Promise<void> }> };
      };
      wakeLock.current = (await nav.wakeLock?.request("screen")) ?? null;
    } catch {
      wakeLock.current = null; // Not supported or denied: the test still runs.
    }
  };

  const start = () => {
    if (phaseRef.current !== "ready") return;
    void requestWakeLock();
    runStretch();
  };

  /** Stop the clock. Any stimulus on screen is discarded (not scored). */
  const pause = (next: "paused" | "confirm-quit") => {
    if (phaseRef.current !== "running") {
      if (phaseRef.current === "paused" || phaseRef.current === "confirm-quit") setP(next);
      return;
    }
    elapsedBefore.current += performance.now() - runStartedAt.current;
    clearTimers();
    hideRing();
    setMessage("");
    if (clockTimer.current !== null) window.clearInterval(clockTimer.current);
    pausedAt.current = performance.now();
    setP(next);
  };

  const resume = () => {
    if (phaseRef.current !== "paused" && phaseRef.current !== "confirm-quit") return;
    const pausedFor = pausedAt.current === null ? 0 : performance.now() - pausedAt.current;
    pausedAt.current = null;
    if (pausedFor > PVT.maxPauseMs) {
      finish(false, "paused-too-long");
      return;
    }
    lastResponseAt.current = performance.now(); // ignore the resume tap itself
    runStretch();
  };

  const quit = () => finish(false, "quit");

  // Leaving the app or locking the screen pauses the test (MINIGAME.md §4.9).
  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "hidden") pause("paused");
      else if (
        phaseRef.current === "paused" &&
        pausedAt.current !== null &&
        performance.now() - pausedAt.current > PVT.maxPauseMs
      ) {
        finish(false, "paused-too-long");
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Clean up if the component unmounts mid-test.
  useEffect(
    () => () => {
      clearTimers();
      if (clockTimer.current !== null) window.clearInterval(clockTimer.current);
      wakeLock.current?.release().catch(() => {});
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const onPointerDown = (e: React.PointerEvent) => {
    if (!e.isPrimary) return; // ignore extra fingers/palm
    respond(eventTime(e));
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.repeat) return;
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      respond(eventTime(e));
    }
  };

  return { phase, els, start, pause, resume, quit, onPointerDown, onKeyDown };
}
