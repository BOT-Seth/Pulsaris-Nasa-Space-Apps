// Turns the MMASH v1.0.0 dataset (PhysioNet, ODbL v1.0) into the small JSON file the app replays.
//
// Usage: node scripts/prepare-mmash.mjs <path-to>/DataPaper
// Download: https://physionet.org/files/mmash/1.0.0/MMASH.zip (unpack it, pass the DataPaper folder)
//
// What is computed, per participant, from one recorded night:
//   sleep    Total sleep time, summed over the actigraphy sleep periods in sleep.csv.
//   hrv      RMSSD (ms) of beat-to-beat intervals in RR.csv, inside the sleep periods only.
//            Computed per 5-minute window, then the median window is reported for the night.
//   heart    Mean heart rate (bpm) over the same sleep periods.
//
// Beat cleaning (stated so the numbers can be reproduced):
//   1. Drop intervals outside 0.30-2.00 s (physiologically implausible).
//   2. Drop intervals that differ by more than 20 % from the previous plausible interval (ectopic or missed beats).
//   3. A successive difference is used only when both beats are consecutive in the file and both kept.
//   4. A 5-minute window needs at least 100 successive differences, otherwise it is skipped.
//
// Nothing here is astronaut data. MMASH is 22 healthy men recorded for 24 h on Earth.

import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const src = process.argv[2];
if (!src || !existsSync(src)) {
  console.error('Pass the path to the unpacked MMASH "DataPaper" folder.');
  process.exit(1);
}
const outFile = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'data', 'mmash.json');

const WINDOW_MIN = 5;
const MIN_DIFFS = 100;

function parseCsv(path) {
  const lines = readFileSync(path, 'utf8').split(/\r?\n/).filter((l) => l.trim() !== '');
  const head = lines[0].split(',');
  return lines.slice(1).map((l) => {
    const cells = l.split(',');
    const row = {};
    head.forEach((h, i) => { row[h] = cells[i]; });
    return row;
  });
}
// Minutes on a two-day clock: day 1 00:00 = 0, day 2 00:00 = 1440.
function clock(day, hhmmss) {
  const [h, m, s = '0'] = hhmmss.split(':');
  return (Number(day) - 1) * 1440 + Number(h) * 60 + Number(m) + Number(s) / 60;
}
function hhmm(min) {
  const m = Math.round(((min % 1440) + 1440) % 1440);
  return String(Math.floor(m / 60) % 24).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
}
const median = (a) => { const s = [...a].sort((x, y) => x - y); const n = s.length; return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2; };
const round = (v, d = 1) => Math.round(v * 10 ** d) / 10 ** d;

function sleepPeriods(dir) {
  const path = join(dir, 'sleep.csv');
  if (!existsSync(path)) return [];
  return parseCsv(path).map((r) => {
    let start = clock(r['Onset Date'], r['Onset Time']);
    let end = clock(r['Out Bed Date'], r['Out Bed Time']);
    let inBed = clock(r['In Bed Date'], r['In Bed Time']);
    // Some rows log a next-morning wake time against the same day number.
    if (end <= start) end += 1440;
    return {
      inBed, start, end,
      tstMin: Number(r['Total Sleep Time (TST)']),
      inBedMin: Number(r['Total Minutes in Bed']),
      awakenings: Number(r['Number of Awakenings']),
    };
  }).filter((p) => Number.isFinite(p.tstMin));
}

function beats(dir) {
  return parseCsv(join(dir, 'RR.csv')).map((r) => ({ t: clock(r.day, r.time), ibi: Number(r.ibi_s) }));
}

function analyse(all, periods) {
  // Some beats are logged against day 1 although they belong to the next morning.
  const inSleep = (t) => periods.some((p) => t >= p.start && t <= p.end) ? t
    : periods.some((p) => t + 1440 >= p.start && t + 1440 <= p.end) ? t + 1440 : null;

  let total = 0, kept = 0, sumIbi = 0;
  let prev = null;          // previous plausible interval, the reference for the 20 % rule
  let prevKept = false;     // was the immediately preceding beat kept?
  const windows = new Map();
  for (const b of all) {
    const t = inSleep(b.t);
    if (t === null) { prev = null; prevKept = false; continue; }
    total++;
    if (!(b.ibi >= 0.3 && b.ibi <= 2.0)) { prevKept = false; continue; }
    const steady = prev === null || Math.abs(b.ibi - prev) / prev <= 0.2;
    const last = prev;
    prev = b.ibi;
    if (!steady) { prevKept = false; continue; }
    kept++; sumIbi += b.ibi;
    const key = Math.floor(t / WINDOW_MIN);
    if (!windows.has(key)) windows.set(key, { sq: 0, n: 0, ibi: 0, beats: 0 });
    const w = windows.get(key);
    w.ibi += b.ibi; w.beats++;
    if (prevKept && last !== null) { const d = (b.ibi - last) * 1000; w.sq += d * d; w.n++; }
    prevKept = true;
  }
  const series = [...windows.entries()]
    .filter(([, w]) => w.n >= MIN_DIFFS)
    .sort((x, y) => x[0] - y[0])
    .map(([k, w]) => ({ t: hhmm(k * WINDOW_MIN), rmssd: round(Math.sqrt(w.sq / w.n)), hr: round(60 / (w.ibi / w.beats)) }));
  const sleepMin = periods.reduce((s, p) => s + (p.end - p.start), 0);
  return { total, kept, meanHr: kept ? 60 / (sumIbi / kept) : null, series, coveragePct: Math.min(100, (series.length * WINDOW_MIN / sleepMin) * 100) };
}

const users = readdirSync(src).filter((d) => /^user_\d+$/.test(d)).sort((a, b) => Number(a.slice(5)) - Number(b.slice(5)));
const result = [];
for (const u of users) {
  const dir = join(src, u);
  const periods = sleepPeriods(dir);
  const entry = { id: u, sleep: null, hrv: null, heart: null };
  if (periods.length) {
    const tst = periods.reduce((s, p) => s + p.tstMin, 0);
    const inBedMin = periods.reduce((s, p) => s + p.inBedMin, 0);
    entry.sleep = {
      tstMin: tst,
      inBed: hhmm(periods[0].inBed),
      outBed: hhmm(periods[periods.length - 1].end),
      periods: periods.length,
      efficiencyPct: round((tst / inBedMin) * 100),
      awakenings: periods.reduce((s, p) => s + p.awakenings, 0),
    };
    const a = analyse(beats(dir), periods);
    if (a.series.length >= 6) {
      entry.hrv = {
        rmssdMs: round(median(a.series.map((w) => w.rmssd))),
        windows: a.series.length,
        beatsKeptPct: round((a.kept / a.total) * 100),
        coveragePct: round(a.coveragePct),
        series: a.series,
      };
      entry.heart = { sleepMeanBpm: round(a.meanHr), sleepLowestBpm: Math.min(...a.series.map((w) => w.hr)) };
    }
  }
  result.push(entry);
  console.log(u.padEnd(8),
    entry.sleep ? `sleep ${String(entry.sleep.tstMin).padStart(3)} min ${entry.sleep.inBed}-${entry.sleep.outBed}` : 'sleep --',
    entry.hrv ? `| RMSSD ${String(entry.hrv.rmssdMs).padStart(5)} ms over ${entry.hrv.windows} windows, ${entry.hrv.beatsKeptPct}% beats kept, ${entry.hrv.coveragePct}% of night | HR ${entry.heart.sleepMeanBpm}` : '| HRV --');
}

mkdirSync(dirname(outFile), { recursive: true });
writeFileSync(outFile, JSON.stringify({
  dataset: 'MMASH v1.0.0',
  doi: '10.13026/cerq-fc86',
  license: 'ODbL v1.0',
  method: { windowMin: WINDOW_MIN, minDiffsPerWindow: MIN_DIFFS, ibiRangeS: [0.3, 2.0], maxStepPct: 20, nightValue: 'median of 5-min window RMSSD' },
  users: result,
}));
console.log('Wrote', outFile);
