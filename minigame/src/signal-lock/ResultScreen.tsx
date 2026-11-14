import { useState } from "react";
import { ChevronDown, ExternalLink } from "lucide-react";
import styles from "./SignalLock.module.css";
import { StatusChip } from "./StatusChip";
import { NASA_REFERENCE, toIndicatorStatus } from "./pvt";
import type { Baseline, CountermeasureCardContent, SessionRecord } from "./types";

interface Props {
  record: SessionRecord;
  card: CountermeasureCardContent;
  reasons: string[];
  baseline: Baseline | null;
  onDone: () => void;
  onRecheck?: (minutes: number) => void;
  onRetry: () => void;
}

const HEADLINE = {
  ok: "Alert",
  watch: "Reduced alertness",
  act: "Low alertness",
  baseline: "Building your baseline",
  invalid: "Not scored",
} as const;

/** Result + countermeasure card (design doc 06 S6). The one action is up front; details are one tap deep. */
export function ResultScreen({ record, card, reasons, baseline, onDone, onRecheck, onRetry }: Props) {
  const [open, setOpen] = useState(false);
  const p = record.pvt;
  const status = toIndicatorStatus(p.band);
  const scored = p.band !== "invalid";

  return (
    <div className={styles.screen}>
      <header className={styles.resultHead}>
        <StatusChip status={status} size="lg" />
        <h1 className={styles.status}>{HEADLINE[p.band]}</h1>
      </header>
      {reasons[0] && <p className={styles.body}>{reasons.join(" · ")}</p>}
      {scored && (
        <p className={styles.mono}>
          Median {p.medianRtMs} ms · {p.lapses} lapses · {p.falseStarts} false start{p.falseStarts === 1 ? "" : "s"}
        </p>
      )}

      <section
        className={"card " + styles.cm + (p.band === "act" ? " " + styles.cmAct : "")}
        aria-labelledby="sl-do"
      >
        {(p.band === "watch" || p.band === "act") && (
          <p id="sl-do" className={styles.label}>
            DO THIS NOW
          </p>
        )}
        <p className={styles.section} id={p.band === "watch" || p.band === "act" ? undefined : "sl-do"}>
          {card.primary}
        </p>
        {card.secondary.length > 0 && (
          <ul className={styles.secondaryList}>
            {card.secondary.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        )}
        {card.flags.map((f) => (
          <p key={f} className={styles.flag}>
            {f}
          </p>
        ))}
        {card.source && (
          <a className={styles.source} href={card.source.url} target="_blank" rel="noreferrer">
            Source: {card.source.label} <ExternalLink size={14} aria-hidden="true" />
            <span className={styles.srOnly}> (opens in new tab)</span>
          </a>
        )}
      </section>

      <div className={styles.actions}>
        {p.band === "invalid" ? (
          <button type="button" className={styles.primary} onClick={onRetry}>
            Try again
          </button>
        ) : (
          <button type="button" className={styles.primary} onClick={onDone} autoFocus>
            Done
          </button>
        )}
        {(p.band === "watch" || p.band === "act") && onRecheck && (
          <button type="button" className={styles.secondary} onClick={() => onRecheck(60)}>
            Re-check in 60 min
          </button>
        )}
        {p.band === "invalid" && (
          <button type="button" className={styles.secondary} onClick={onDone}>
            Close
          </button>
        )}
      </div>

      {scored && (
        <div className={styles.details}>
          <button
            type="button"
            className={styles.disclosure}
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
          >
            Details <ChevronDown size={18} aria-hidden="true" className={open ? styles.flip : ""} />
          </button>
          {open && (
            <dl className={styles.dl}>
              <dt>Speed vs your baseline</dt>
              <dd>{p.vsBaselineSd === null ? "—" : `${p.vsBaselineSd > 0 ? "+" : ""}${p.vsBaselineSd} SD`}</dd>
              <dt>Lapses (≥355 ms)</dt>
              <dd>
                {p.lapses}
                {p.excessLapses !== null && ` (usual ${baseline?.meanLapses ?? "—"})`}
              </dd>
              <dt>False starts</dt>
              <dd>{p.falseStarts}</dd>
              <dt>Signals scored</dt>
              <dd>{p.trials}</dd>
              <dt>You rated sleepiness</dt>
              <dd>{record.checkIn.sleepiness === null ? "—" : `${record.checkIn.sleepiness} / 9`}</dd>
              <dt>Baseline</dt>
              <dd>{baseline ? baseline.label : "Not set yet"}</dd>
              <dt>1 SD</dt>
              <dd>
                {NASA_REFERENCE.speedSd} s⁻¹, from the {NASA_REFERENCE.label}
              </dd>
            </dl>
          )}
        </div>
      )}
    </div>
  );
}
