import { CircleCheck, CircleDashed, OctagonAlert, TriangleAlert } from "lucide-react";
import styles from "./SignalLock.module.css";
import type { IndicatorStatusValue } from "./types";

const WORD: Record<IndicatorStatusValue, string> = {
  ok: "OK",
  watch: "Watch",
  act: "Act",
  none: "No data",
};

const ICON = { ok: CircleCheck, watch: TriangleAlert, act: OctagonAlert, none: CircleDashed };

/** Icon + word + color, never color alone (design doc 07). Swap for the app's StatusChip later. */
export function StatusChip({ status, size = "sm" }: { status: IndicatorStatusValue; size?: "sm" | "lg" }) {
  const Icon = ICON[status];
  return (
    <span className={`${styles.chip} ${styles[`chip_${status}`]} ${size === "lg" ? styles.chipLg : ""}`}>
      <Icon size={size === "lg" ? 22 : 16} strokeWidth={1.5} aria-hidden="true" />
      {WORD[status]}
    </span>
  );
}
