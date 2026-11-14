import { describe, expect, it } from "vitest";
import { classify, computeMetrics, minTrialsFor, nextIsiMs, PVT } from "./pvt";
import { buildSession, computeBaseline, isRested, SAMPLE_BASELINE, shouldEscalate } from "./session";
import type { Baseline, SessionRecord, Trial } from "./types";

/** n trials at a fixed RT, 2.5 s apart, after 3 warm-up trials. */
function trials(rts: (number | null)[]): Trial[] {
  const warm = [300, 300, 300].map((rt, i) => ({ onsetMs: i * 2500, rtMs: rt }));
  return [...warm, ...rts.map((rt, i) => ({ onsetMs: (i + 3) * 2500, rtMs: rt }))];
}
const repeat = (rt: number | null, n: number) => Array.from({ length: n }, () => rt);

const base: Baseline = { meanSpeed: 3.6, meanLapses: 2, medianRtMs: 275, n: 3, source: "own", label: "test" };

describe("timing constants (PVT-B, Basner et al. 2011)", () => {
  it("gaps are 1–4 s", () => {
    expect(nextIsiMs(() => 0)).toBe(1000);
    expect(nextIsiMs(() => 0.999999)).toBeCloseTo(4000, 0);
  });
  it("test is 3 min with a 355 ms lapse line", () => {
    expect(PVT.durationMs).toBe(180_000);
    expect(PVT.lapseMs).toBe(355);
  });
});

describe("computeMetrics", () => {
  it("skips the 3 warm-up trials", () => {
    expect(computeMetrics(trials(repeat(250, 20)), 0, null).trials).toBe(20);
  });
  it("counts ≥355 ms and timeouts as lapses", () => {
    const m = computeMetrics(trials([250, 354, 355, 600, null]), 0, null);
    expect(m.lapses).toBe(3);
  });
  it("speed is mean 1/RT in s⁻¹", () => {
    expect(computeMetrics(trials(repeat(250, 10)), 0, null).meanSpeed).toBe(4);
  });
  it("personal lapses use 2× baseline median", () => {
    const m = computeMetrics(trials([500, 551, 600, null, 250]), 0, base);
    expect(m.personalLapses).toBe(3); // 551, 600, timeout (2×275 = 550)
  });
  it("false-start percentage counts against all responses", () => {
    expect(computeMetrics(trials(repeat(250, 18)), 2, null).falseStartPct).toBe(10);
  });
  it("detects slowing across the test", () => {
    const rising = Array.from({ length: 40 }, (_, i) => 250 + i * 5);
    expect(computeMetrics(trials(rising), 0, null).slopeMsPerMin).toBeGreaterThan(100);
  });
});

describe("classify (own baseline)", () => {
  const at = (rt: number, n = 40, extra: (number | null)[] = []) =>
    computeMetrics(trials([...repeat(rt, n), ...extra]), 0, base);

  it("OK at your usual speed", () => {
    // 1/0.2778 s ≈ 3.6 s⁻¹ = baseline
    expect(classify(at(278), base).band).toBe("ok");
  });
  it("Watch when 1–1.5 SD slower", () => {
    // 3.6 − 1.2×0.24 = 3.312 s⁻¹ → ~302 ms
    const c = classify(at(302), base);
    expect(c.band).toBe("watch");
    expect(c.reasons[0]).toMatch(/SD slower/);
  });
  it("Act when ≥1.5 SD slower", () => {
    // 3.6 − 1.6×0.24 = 3.216 → ~311 ms
    expect(classify(at(311), base).band).toBe("act");
  });
  it("Watch on 3+ extra lapses even at normal speed", () => {
    // 5 lapses at 360 ms in a fast run; baseline usual = 2
    const m = computeMetrics(trials([...repeat(265, 40), ...repeat(360, 5)]), 0, base);
    const c = classify(m, base);
    expect(c.excessLapses).toBe(3);
    expect(c.band).toBe("watch");
  });
  it("Act on 4+ false starts", () => {
    const m = computeMetrics(trials(repeat(270, 40)), 4, base);
    expect(classify(m, base).band).toBe("act");
  });
  it("invalid on more than 8 false starts", () => {
    const m = computeMetrics(trials(repeat(270, 40)), 9, base);
    expect(classify(m, base).band).toBe("invalid");
  });
  it("invalid with too few signals", () => {
    expect(classify(at(270, 5), base).band).toBe("invalid");
  });
  it("building baseline gives no judgement", () => {
    const m = computeMetrics(trials(repeat(400, 40)), 0, null);
    expect(classify(m, null).band).toBe("baseline");
  });
  it("shortened DEV runs scale the minimum", () => {
    expect(minTrialsFor(30_000)).toBe(3);
    expect(minTrialsFor(PVT.durationMs)).toBe(15);
  });
});

function rec(partial: Partial<SessionRecord> & { band?: SessionRecord["pvt"]["band"]; speed?: number }): SessionRecord {
  return {
    sessionId: Math.random().toString(),
    timestamp: partial.timestamp ?? new Date().toISOString(),
    trigger: "manual",
    checkIn: { sleepiness: 3, sleepinessReused: false },
    rested: partial.rested ?? true,
    pvt: {
      trials: 50, medianRtMs: 270, meanRtMs: 275, meanSpeed: partial.speed ?? 3.7, lapses: 1,
      personalLapses: 0, falseStarts: 0, falseStartPct: 0, slopeMsPerMin: 0, durationSec: 180,
      band: partial.band ?? "baseline", vsBaselineSd: null, excessLapses: null, baselineSource: null,
    },
    recovery: { type: "none" },
    recommendation: "",
    cmoFlagged: false,
    escalated: false,
    complete: partial.complete ?? true,
  };
}

describe("baseline", () => {
  it("rested = sleepiness ≤ 4 and ≥ 7 h sleep", () => {
    expect(isRested(4, 7)).toBe(true);
    expect(isRested(5, 8)).toBe(false);
    expect(isRested(3, 6.5)).toBe(false);
    expect(isRested(null, 8)).toBe(false);
  });
  it("needs 3 rested, complete sessions", () => {
    expect(computeBaseline([rec({}), rec({})])).toBeNull();
    expect(computeBaseline([rec({}), rec({}), rec({ rested: false })])).toBeNull();
    const b = computeBaseline([rec({ speed: 3.5 }), rec({ speed: 3.7 }), rec({ speed: 3.9 })]);
    expect(b?.meanSpeed).toBeCloseTo(3.7);
    expect(b?.source).toBe("own");
  });
  it("ignores invalid and incomplete sessions", () => {
    expect(
      computeBaseline([rec({}), rec({}), rec({ band: "invalid" }), rec({ complete: false })]),
    ).toBeNull();
  });
});

describe("escalation (MINIGAME.md §4.6)", () => {
  const now = new Date("2026-11-15T12:00:00Z");
  it("Act before a critical task escalates", () => {
    expect(shouldEscalate("act", "pre_task", [], now)).toBe(true);
  });
  it("second Act within 24 h escalates", () => {
    const earlier = rec({ band: "act", timestamp: "2026-11-15T01:00:00Z" });
    expect(shouldEscalate("act", "low_hrv", [earlier], now)).toBe(true);
  });
  it("an Act more than 24 h ago doesn't", () => {
    const old = rec({ band: "act", timestamp: "2026-11-13T11:00:00Z" });
    expect(shouldEscalate("act", "low_hrv", [old], now)).toBe(false);
  });
  it("Watch never escalates", () => {
    expect(shouldEscalate("watch", "pre_task", [], now)).toBe(false);
  });
});

describe("buildSession", () => {
  it("an incomplete run is never scored", () => {
    const { record } = buildSession({
      run: { trials: trials(repeat(270, 40)), falseStarts: 0, elapsedMs: 90_000, complete: false, endedReason: "quit" },
      trigger: "manual", sleepiness: 3, sleepinessReused: false, sleepHours: 8,
      baseline: SAMPLE_BASELINE, history: [], durationMs: PVT.durationMs,
    });
    expect(record.pvt.band).toBe("invalid");
    expect(record.complete).toBe(false);
  });
  it("Act flags the crew medical officer and fills the card", () => {
    const { record, card } = buildSession({
      run: { trials: trials(repeat(330, 50)), falseStarts: 0, elapsedMs: 180_000, complete: true, endedReason: "finished" },
      trigger: "low_hrv", sleepiness: 7, sleepinessReused: false, sleepHours: 5,
      baseline: SAMPLE_BASELINE, history: [], durationMs: PVT.durationMs,
    });
    expect(record.pvt.band).toBe("act");
    expect(record.cmoFlagged).toBe(true);
    expect(record.rested).toBe(false);
    expect(card.primary).toMatch(/Nap/);
    expect(card.flags[0]).toMatch(/Crew medical officer/);
  });
});
