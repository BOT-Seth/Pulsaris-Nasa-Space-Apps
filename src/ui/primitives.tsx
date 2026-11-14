import type { ReactNode } from 'react';
import { duration } from '../domain/time';
import type { Baseline, Provenance, Reading, Status } from '../domain/types';

/* ---------- Icons: 1.5px outline, inline with text ---------- */
const P = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, 'aria-hidden': true, viewBox: '0 0 24 24' } as const;
export const Icon = {
  ok: <svg {...P}><circle cx="12" cy="12" r="9" /><path d="M8 12.5l2.5 2.5L16 9.5" /></svg>,
  watch: <svg {...P}><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></svg>,
  act: <svg {...P}><path d="M12 3l9.5 17h-19z" /><path d="M12 10v4.5M12 17.2v.3" /></svg>,
  none: <svg {...P} strokeDasharray="3 3"><circle cx="12" cy="12" r="9" /></svg>,
  info: <svg {...P}><circle cx="12" cy="12" r="9" /><path d="M8 12h8" /></svg>,
  due: <svg {...P}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>,
};
const WORD: Record<Status | 'due', string> = { ok: 'OK', watch: 'Watch', act: 'Act', none: 'No data', info: 'Logged', due: 'Due' };

export function Chip({ kind, word, large }: { kind: Status | 'due'; word?: string; large?: boolean }) {
  return <span className={`chip ${kind}${large ? ' lg' : ''}`}>{Icon[kind]}{word ?? WORD[kind]}</span>;
}

export function Btn(props: { children: ReactNode; onClick?: () => void; variant?: 'primary' | 'quiet' | ''; small?: boolean; disabled?: boolean; pressed?: boolean; type?: 'button' | 'submit' }) {
  const { children, onClick, variant = '', small, disabled, pressed, type = 'button' } = props;
  return (
    <button type={type} className={`btn ${variant}${small ? ' small' : ''}`} onClick={onClick} disabled={disabled} aria-pressed={pressed}>
      {children}
    </button>
  );
}

const PROV: Record<Provenance, string> = { recorded: 'Recorded', synthetic: 'Synthetic', 'self-reported': 'Self-reported', 'measured-here': 'Measured here' };
/** Provenance tag. Synthetic gets a dashed outline as well as the word. */
export function Prov({ p }: { p: Provenance }) {
  return <span className={`prov ${p}`}>{PROV[p]}</span>;
}

/** A reading's value with its unit. Sleep is shown as hours and minutes. */
export function Value({ r, className = 'val' }: { r: Reading; className?: string }) {
  if (r.indicator === 'sleep') {
    const m = Math.round(r.value);
    return <span className={className}>{Math.floor(m / 60)} <small>h</small> {String(m % 60).padStart(2, '0')} <small>min</small></span>;
  }
  if (r.indicator === 'bloodPressure') return <span className={className}>{r.value}/{r.value2} <small>mmHg</small></span>;
  const v = r.indicator === 'temperature' ? r.value.toFixed(1) : String(r.value);
  return <span className={className}>{v} <small>{r.unit}</small></span>;
}
export function plain(r: Reading): string {
  if (r.indicator === 'sleep') return duration(r.value);
  if (r.indicator === 'bloodPressure') return `${r.value}/${r.value2} mmHg`;
  return `${r.indicator === 'temperature' ? r.value.toFixed(1) : r.value} ${r.unit}`;
}

/* ---------- Micro-telemetry tracks ---------- */

/** Sleep against the sourced in-flight crew average, on a full 0-8 h scale. */
export function SleepTrack({ minutes, off }: { minutes: number; off?: boolean }) {
  const cur = Math.min(100, (minutes / 480) * 100), avg = (384 / 480) * 100;
  const under = minutes < 384;
  const diff = Math.abs(384 - minutes) / 60;
  const text = off ? 'Marked wrong by you. Not used.' : `${diff.toFixed(1)} h ${under ? 'under' : 'over'} the 6.4 h crew average`;
  return (
    <div className="track" role="img" aria-label={`Sleep ${duration(minutes)} on a 0 to 8 hour scale. ${text}`}>
      <div className={`rail${off ? ' off' : ''}`}>
        <span className="fill" style={{ width: `${cur}%` }} />
        {!off && under && <span className="gap" style={{ left: `${cur}%`, width: `${avg - cur}%` }} />}
        <span className="mark" style={{ left: `${avg}%` }} />
      </div>
      <p className="cap" aria-hidden="true">0–8 h · mark: avg 6.4 h<br />{off ? 'Marked wrong · not used' : under ? `amber: ${diff.toFixed(1)} h under` : `${diff.toFixed(1)} h over`}</p>
    </div>
  );
}

/** A value against the person's own baseline band (mean +/- 1 SD). */
export function BaselineTrack({ value, baseline, unit }: { value: number; baseline: Baseline; unit: string }) {
  const span = Math.max(baseline.high - baseline.low, 1);
  const lo = baseline.low - span * 1.5, hi = baseline.high + span * 1.5;
  const pos = (v: number) => Math.min(100, Math.max(0, ((v - lo) / (hi - lo)) * 100));
  const outside = value < baseline.low || value > baseline.high;
  const range = `${Math.round(baseline.low)}–${Math.round(baseline.high)} ${unit}`;
  return (
    <div className="track" role="img" aria-label={`${value} ${unit}. Your usual range is ${range}, from ${baseline.n} nights${baseline.synthetic ? ', synthetic history' : ''}.`}>
      <div className="rail">
        <span className="band" style={{ left: `${pos(baseline.low)}%`, width: `${pos(baseline.high) - pos(baseline.low)}%` }} />
        <span className={`dot${outside ? ' warn' : ''}`} style={{ left: `${pos(value)}%` }} />
      </div>
      <p className="cap" aria-hidden="true">Band: your usual {range}<br />{baseline.n} nights{baseline.synthetic ? ', synthetic' : ''}</p>
    </div>
  );
}

/** Baseline still building: progress, not a comparison. */
export function BuildingTrack({ have }: { have: number }) {
  return (
    <div className="track" role="img" aria-label={`Baseline: ${have} of 7 in-flight nights recorded. Nothing to compare against yet.`}>
      <div className="rail seg">{Array.from({ length: 7 }, (_, i) => <i key={i} className={i < have ? 'on' : ''} />)}</div>
      <p className="cap" aria-hidden="true">Baseline nights {have} of 7<br />no comparison yet</p>
    </div>
  );
}

/** Alertness speed on the reference scale. Left is faster. */
export function SpeedScale({ speed, mean, sd, label, compact }: { speed: number; mean: number; sd: number; label: string; compact?: boolean }) {
  const lo = mean - 3 * sd, hi = mean + 3.5 * sd;
  const pos = (v: number) => Math.min(100, Math.max(0, ((v - lo) / (hi - lo)) * 100));
  const z = (speed - mean) / sd;
  return (
    <div className="track" role="img" aria-label={`Speed score ${speed.toFixed(2)}. ${label} ${mean.toFixed(2)} plus or minus ${sd.toFixed(2)}. ${Math.abs(z).toFixed(1)} SD ${z >= 0 ? 'slower' : 'faster'}.`}>
      <div className="rail" style={{ height: 10 }}>
        <span className="band" style={{ left: `${pos(mean - sd)}%`, width: `${pos(mean + sd) - pos(mean - sd)}%` }} />
        <span className="mark" style={{ left: `${pos(mean + 1.5 * sd)}%`, background: 'var(--act)' }} />
        <span className={`dot${z >= 1 ? ' warn' : ''}`} style={{ left: `${pos(speed)}%`, width: 16, height: 16, margin: '-8px 0 0 -8px' }} />
      </div>
      {compact
        ? <p className="cap" aria-hidden="true">← faster · slower →<br />band: {label} ±1 SD</p>
        : <div className="ends cap" aria-hidden="true"><span>← faster</span><span>band: {label} ±1 SD · red mark: 1.5 SD</span><span>slower →</span></div>}
    </div>
  );
}

/* ---------- Charts ---------- */

export interface TrendPoint { day: number; v: number; v2?: number; prov: Provenance }
type Kind = 'line' | 'bar' | 'dots' | 'range';

export function TrendChart(props: { points: TrendPoint[]; today: number; days?: number; kind: Kind; baseline?: Baseline | null; scale?: [number, number]; refLine?: { v: number; label: string }; fmt?: (v: number) => string; bandLabel?: string; summary: string }) {
  const { points, today, days = 8, kind, baseline, scale, refLine, fmt = (v) => String(Math.round(v)), bandLabel = 'Your usual range', summary } = props;
  const W = 640, H = 210, L = 56, R = 16, T = 14, B = 30;
  const first = today - days + 1;
  const vis = points.filter((p) => p.day >= first && p.day <= today);
  const vals = vis.flatMap((p) => (p.v2 === undefined ? [p.v] : [p.v, p.v2]));
  if (baseline) vals.push(baseline.low, baseline.high);
  if (refLine) vals.push(refLine.v);
  let [lo, hi] = scale ?? [Math.min(...vals), Math.max(...vals)];
  if (!vals.length) { lo = 0; hi = 1; }
  if (!scale) { const pad = (hi - lo || 1) * 0.18; lo -= pad; hi += pad; }
  const x = (day: number) => L + ((day - first + 0.5) / days) * (W - L - R);
  const y = (v: number) => T + (1 - (v - lo) / (hi - lo)) * (H - T - B);
  const ticks = [lo, (lo + hi) / 2, hi];
  const segs: TrendPoint[][] = [];
  vis.forEach((p, i) => { if (i && vis[i - 1].day === p.day - 1) segs[segs.length - 1].push(p); else segs.push([p]); });
  const cls = (p: TrendPoint) => (p.day === today && p.prov !== 'synthetic' ? 'last' : p.prov === 'synthetic' ? 'syn' : '');
  const bw = Math.min(26, ((W - L - R) / days) * 0.5);
  return (
    <figure className="stack-sm">
      <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={summary}>
        {ticks.map((t, i) => (
          <g key={i}><line className="axis" x1={L} x2={W - R} y1={y(t)} y2={y(t)} /><text x={L - 8} y={y(t) + 4} textAnchor="end">{fmt(t)}</text></g>
        ))}
        {baseline && <rect className="band" x={L} width={W - L - R} y={y(baseline.high)} height={Math.max(2, y(baseline.low) - y(baseline.high))} />}
        {refLine && <g><line className="ref" x1={L} x2={W - R} y1={y(refLine.v)} y2={y(refLine.v)} /><text x={W - R} y={y(refLine.v) - 6} textAnchor="end">{refLine.label}</text></g>}
        {kind === 'line' && segs.map((s, i) => s.length > 1 && <polyline key={i} className="line" points={s.map((p) => `${x(p.day)},${y(p.v)}`).join(' ')} />)}
        {kind === 'bar' && vis.map((p) => <rect key={p.day} className={`bar ${cls(p)}`} x={x(p.day) - bw / 2} width={bw} y={y(p.v)} height={Math.max(0, y(lo) - y(p.v))} />)}
        {kind === 'range' && vis.map((p) => (
          <g key={p.day}>
            <line className="line" x1={x(p.day)} x2={x(p.day)} y1={y(p.v)} y2={y(p.v2 ?? p.v)} />
            <circle className={`pt ${cls(p)}`} cx={x(p.day)} cy={y(p.v)} r="5" />
            <rect className={`pt ${cls(p)}`} x={x(p.day) - 4.5} y={y(p.v2 ?? p.v) - 4.5} width="9" height="9" transform={`rotate(45 ${x(p.day)} ${y(p.v2 ?? p.v)})`} />
          </g>
        ))}
        {(kind === 'line' || kind === 'dots') && vis.map((p) => <circle key={p.day} className={`pt ${cls(p)}`} cx={x(p.day)} cy={y(p.v)} r={p.day === today ? 6 : 5} />)}
        {Array.from({ length: days }, (_, i) => first + i).filter((d) => d >= 1).map((d) => (
          <text key={d} x={x(d)} y={H - 8} textAnchor="middle">{d === today ? 'Today' : `D${d}`}</text>
        ))}
        {Array.from({ length: days }, (_, i) => first + i).filter((d) => d >= 1 && !vis.some((p) => p.day === d)).map((d) => (
          <text key={`n${d}`} x={x(d)} y={y((lo + hi) / 2) + 4} textAnchor="middle">–</text>
        ))}
      </svg>
      <div className="legend" aria-hidden="true">
        <span><i className="last" />Latest, not synthetic</span><span><i />Recorded or entered</span><span><i className="syn" />Synthetic</span>
        {baseline && <span><i className="bandkey" />{bandLabel}</span>}
      </div>
      <figcaption className="sm">{summary}</figcaption>
    </figure>
  );
}

/** Real 5-minute windows across the recorded night. */
export function NightChart({ series, pick, unit, summary }: { series: { t: string; rmssd: number; hr: number }[]; pick: 'rmssd' | 'hr'; unit: string; summary: string }) {
  const W = 640, H = 170, L = 56, R = 16, T = 12, B = 28;
  const vals = series.map((s) => s[pick]);
  const lo = Math.min(...vals) * 0.92, hi = Math.max(...vals) * 1.05;
  const x = (i: number) => L + (i / Math.max(1, series.length - 1)) * (W - L - R);
  const y = (v: number) => T + (1 - (v - lo) / (hi - lo)) * (H - T - B);
  const marks = [0, Math.floor(series.length / 2), series.length - 1];
  return (
    <figure className="stack-sm">
      <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={summary}>
        {[lo, (lo + hi) / 2, hi].map((t, i) => (
          <g key={i}><line className="axis" x1={L} x2={W - R} y1={y(t)} y2={y(t)} /><text x={L - 8} y={y(t) + 4} textAnchor="end">{Math.round(t)}{i === 2 ? ` ${unit}` : ''}</text></g>
        ))}
        <polyline className="line" points={series.map((s, i) => `${x(i)},${y(s[pick])}`).join(' ')} />
        {marks.map((i) => <text key={i} x={x(i)} y={H - 8} textAnchor={i === 0 ? 'start' : i === series.length - 1 ? 'end' : 'middle'}>{series[i].t}</text>)}
      </svg>
      <figcaption className="sm">{summary}</figcaption>
    </figure>
  );
}

export function Spark({ values, synthetic }: { values: number[]; synthetic: boolean[] }) {
  if (values.length < 2) return <svg className="spark" width="120" height="24" aria-hidden="true" />;
  const lo = Math.min(...values), hi = Math.max(...values), span = hi - lo || 1;
  const x = (i: number) => 4 + (i / (values.length - 1)) * 112;
  const y = (v: number) => 20 - ((v - lo) / span) * 16;
  const last = values.length - 1;
  return (
    <svg className="spark" width="120" height="24" viewBox="0 0 120 24" aria-hidden="true">
      <polyline fill="none" stroke="var(--rail)" strokeWidth="1.5" points={values.map((v, i) => `${x(i)},${y(v)}`).join(' ')} />
      <circle cx={x(last)} cy={y(values[last])} r="3.5" fill={synthetic[last] ? 'var(--bg)' : 'var(--ink)'} stroke="var(--ink)" strokeWidth="1.5" />
    </svg>
  );
}

export function Mark() {
  return (
    <svg viewBox="0 0 26 26" fill="none" aria-hidden="true">
      <rect x="1" y="1" width="24" height="24" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M4 14h4l2.5-7 4 12 2.5-7 1.5 2H22" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
