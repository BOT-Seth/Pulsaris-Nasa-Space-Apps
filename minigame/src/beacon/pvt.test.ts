import { describe, expect, it } from "vitest";
import { classify, computeMetrics, lapseLineFor, nextIsiMs, PVT, scoreEvents } from "./pvt";
import { adaptiveDecision, adaptiveState, categoryFromCount, PVT_BA } from "./adaptive";
import { buildSession, computeBaseline, isRested, SAMPLE_BASELINE, shouldEscalate } from "./session";
import type { Baseline, ScoreEvent, SessionRecord, Trial } from "./types";

/** Trials 2.8 s apart (avg 2.5 s gap + RT), starting at 1 s. */
function trials(rts: (number | null)[]): Trial[] {
  return rts.map((rt, i) => ({ onsetMs: 1000 + i * 2800, rtMs: rt }));
}
const repeat = (rt: number | null, n: number) => Array.from({ length: n }, () => rt);

/** Event stream where every k-th event is a lapse/false start. */
function stream(n: number, lpfsEvery: number | null): ScoreEvent[] {
  return Array.from({ length: n }, (_, i) => ({
    atMs: 1000 + i * 2800,
    lpfs: lpfsEvery !== null && (i + 1) % lpfsEvery === 0,
  }));
}
/** Time at which the adaptive rule first decides. */
function decideAt(events: ScoreEvent[]) {
  for (let i = 1; i <= events.length; i++) {
    const c = adaptiveDecision(events.slice(0, i));
    if (c) return { category: c, atMs: events[i - 1].atMs };
  }
  return null;
}

const base: Baseline = { meanSpeed: 3.6, medianRtMs: 275, n: 3, source: "own", label: "test" };

describe("timing constants (PVT-B, Basner et al. 2011)", () => {
  it("gaps are 1–4 s, cap is 3 min, lab lapse line 355 ms", () => {
    expect(nextIsiMs(() => 0)).toBe(1000);
    expect(nextIsiMs(() => 0.999999)).toBeCloseTo(4000, 0);
    expect(PVT.durationMs).toBe(180_000);
    expect(PVT.lapseMs).toBe(355);
  });
});

describe("lapse line (device + personal offset)", () => {
  it("is 355 ms without a baseline", () => expect(lapseLineFor(null)).toBe(355));
  it("adds how much slower the baseline is than the NASA reference (211 ms)", () => {
    expect(lapseLineFor(SAMPLE_BASELINE)).toBe(355 + (275 - 211));
  });
  it("never drops below 355 ms", () => {
    expect(lapseLineFor({ ...base, medianRtMs: 190 })).toBe(355);
  });
});

describe("computeMetrics", () => {
  it("counts lapses against the lapse line, timeouts included", () => {
    const m = computeMetrics(trials([250, 418, 419, 600, null]), 2, 419);
    expect(m.lapses).toBe(3);
    expect(m.lpfs).toBe(5);
  });
  it("speed is mean 1/RT in s⁻¹", () => {
    expect(computeMetrics(trials(repeat(250, 10)), 0, 355).meanSpeed).toBe(4);
  });
  it("scoring events are in time order, false starts count as LpFS", () => {
    const ev = scoreEvents(trials([250, 600]), [2000], 355);
    expect(ev.map((e) => e.lpfs)).toEqual([false, true, true]);
  });
});

describe("PVT-BA adaptive stopping (Basner 2022)", () => {
  it("categories: HIGH ≤ 6, MEDIUM 7–16, LOW ≥ 17 lapses + false starts", () => {
    expect(categoryFromCount(6)).toBe("high");
    expect(categoryFromCount(7)).toBe("medium");
    expect(categoryFromCount(16)).toBe("medium");
    expect(categoryFromCount(17)).toBe("low");
  });
  it("an alert person stops early as HIGH, well under 3 min", () => {
    const d = decideAt(stream(64, null));
    expect(d?.category).toBe("high");
    expect(d!.atMs).toBeGreaterThan(60_000); // conservative ratios: not reckless
    expect(d!.atMs).toBeLessThan(130_000);
  });
  it("a badly impaired person stops early as LOW", () => {
    const d = decideAt(stream(64, 2)); // every other response a lapse
    expect(d?.category).toBe("low");
    expect(d!.atMs).toBeLessThan(90_000);
  });
  it("never decides on the first few responses", () => {
    expect(decideAt(stream(5, null))).toBeNull();
    expect(decideAt(stream(5, 1))).toBeNull();
  });
  it("more than 6 LpFS rules out HIGH", () => {
    const s = adaptiveState(stream(7, 1));
    expect(s.pHigh).toBe(0);
  });
  it("more than 16 LpFS stops as LOW", () => {
    const ev = Array.from({ length: 17 }, (_, i) => ({ atMs: i * 500, lpfs: true }));
    expect(adaptiveDecision(ev)).toBe("low");
  });
  it("uses the published decision threshold", () => {
    expect(PVT_BA.threshold).toBe(0.99619);
  });
});

describe("classify", () => {
  const m = (lpfs: number, falseStarts = 0) =>
    computeMetrics(trials([...repeat(270, 40), ...repeat(500, lpfs - falseStarts)]), falseStarts, 419);

  it("adaptive decision maps HIGH/MEDIUM/LOW to OK/Watch/Act", () => {
    expect(classify(m(1), base, "high", 90_000).band).toBe("ok");
    expect(classify(m(9), base, "medium", 140_000).band).toBe("watch");
    expect(classify(m(12), base, "low", 70_000).band).toBe("act");
  });
  it("at the 3-min cap the full count decides", () => {
    expect(classify(m(6), base, null, 180_000).band).toBe("ok");
    expect(classify(m(7), base, null, 180_000).band).toBe("watch");
    expect(classify(m(17), base, null, 180_000).band).toBe("act");
  });
  it("cause line says how many and how fast it was decided", () => {
    expect(classify(m(12), base, "low", 70_000).reasons[0]).toBe("12 lapses or early taps in 1:10");
  });
  it("building baseline gives no judgement", () => {
    expect(classify(m(20), null, null, 180_000).band).toBe("baseline");
  });
  it("more than 8 false starts = not scored", () => {
    expect(classify(m(9, 9), base, null, 40_000).band).toBe("invalid");
  });
});

function rec(p: { band?: SessionRecord["pvt"]["band"]; speed?: number; rested?: boolean; complete?: boolean; early?: boolean; timestamp?: string }): SessionRecord {
  return {
    sessionId: Math.random().toString(),
    timestamp: p.timestamp ?? new Date().toISOString(),
    trigger: "manual",
    checkIn: { sleepiness: 3, sleepinessReused: false },
    rested: p.rested ?? true,
    pvt: {
      trials: 60, medianRtMs: 270, meanRtMs: 275, meanSpeed: p.speed ?? 3.7, lapses: 1, falseStarts: 0,
      lpfs: 1, lapseLineMs: 355, durationSec: 180, stoppedEarly: p.early ?? false,
      band: p.band ?? "baseline", category: null, vsBaselineSd: null, baselineSource: null,
    },
    recovery: { type: "none" },
    recommendation: "",
    cmoFlagged: false,
    escalated: false,
    complete: p.complete ?? true,
  };
}

describe("baseline", () => {
  it("rested = sleepiness ≤ 4 and ≥ 7 h sleep", () => {
    expect(isRested(4, 7)).toBe(true);
    expect(isRested(5, 8)).toBe(false);
    expect(isRested(3, 6.5)).toBe(false);
    expect(isRested(null, 8)).toBe(false);
  });
  it("needs 3 rested, complete, full-length sessions", () => {
    expect(computeBaseline([rec({}), rec({})])).toBeNull();
    expect(computeBaseline([rec({}), rec({}), rec({ rested: false })])).toBeNull();
    expect(computeBaseline([rec({}), rec({}), rec({ early: true })])).toBeNull();
    const b = computeBaseline([rec({ speed: 3.5 }), rec({ speed: 3.7 }), rec({ speed: 3.9 })]);
    expect(b?.meanSpeed).toBeCloseTo(3.7);
    expect(b?.source).toBe("own");
  });
});

describe("escalation (MINIGAME.md §4.6)", () => {
  const now = new Date("2026-11-15T12:00:00Z");
  it("Act before a critical task escalates", () => expect(shouldEscalate("act", "pre_task", [], now)).toBe(true));
  it("second Act within 24 h escalates", () => {
    expect(shouldEscalate("act", "low_hrv", [rec({ band: "act", timestamp: "2026-11-15T01:00:00Z" })], now)).toBe(true);
  });
  it("an Act more than 24 h ago doesn't", () => {
    expect(shouldEscalate("act", "low_hrv", [rec({ band: "act", timestamp: "2026-11-13T11:00:00Z" })], now)).toBe(false);
  });
  it("Watch never escalates", () => expect(shouldEscalate("watch", "pre_task", [], now)).toBe(false));
});

describe("buildSession", () => {
  const input = {
    trigger: "low_hrv" as const, sleepiness: 7, sleepinessReused: false, sleepHours: 5,
    baseline: SAMPLE_BASELINE, history: [],
  };
  it("an incomplete run is never scored", () => {
    const { record } = buildSession({
      ...input,
      run: { trials: trials(repeat(270, 30)), falseStarts: 0, elapsedMs: 80_000, complete: false, endedReason: "quit", decided: null },
    });
    expect(record.pvt.band).toBe("invalid");
    expect(record.complete).toBe(false);
  });
  it("an early LOW decision gives Act, flags the CMO and fills the card", () => {
    const { record, card } = buildSession({
      ...input,
      run: { trials: trials([...repeat(270, 10), ...repeat(700, 10)]), falseStarts: 0, elapsedMs: 56_000, complete: true, endedReason: "decided", decided: "low" },
    });
    expect(record.pvt.band).toBe("act");
    expect(record.pvt.stoppedEarly).toBe(true);
    expect(record.cmoFlagged).toBe(true);
    expect(record.rested).toBe(false);
    expect(card.primary).toMatch(/Nap/);
    expect(card.flags[0]).toMatch(/Crew medical officer/);
  });
});
