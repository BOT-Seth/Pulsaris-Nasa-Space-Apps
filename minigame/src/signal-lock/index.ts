/**
 * Signal Lock: drop-in alertness check for Pulsaris.
 * Copy this folder to src/features/signal-lock/ in the app. Needs: react, lucide-react, tokens.css.
 * Integration notes: docs/scope/MINIGAME.md §7.
 */
export { SignalLockFlow } from "./SignalLockFlow";
export type { SignalLockFlowProps } from "./SignalLockFlow";
export { StatusChip } from "./StatusChip";
export {
  PVT,
  NASA_REFERENCE,
  BANDS,
  computeMetrics,
  classify,
  toIndicatorStatus,
} from "./pvt";
export {
  computeBaseline,
  SAMPLE_BASELINE,
  shouldEscalate,
  countermeasureCard,
  buildSession,
  causeLine,
  isRested,
} from "./session";
export type * from "./types";
