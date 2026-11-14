/**
 * Beacon: drop-in alertness check for Pulsaris.
 * Copy this folder to src/features/beacon/ in the app. Needs: react, lucide-react, tokens.css.
 * Integration notes: docs/scope/MINIGAME.md §8.
 */
export { BeaconFlow } from "./BeaconFlow";
export type { BeaconFlowProps } from "./BeaconFlow";
export { StatusChip } from "./StatusChip";
export {
  PVT,
  NASA_REFERENCE,
  computeMetrics,
  classify,
  lapseLineFor,
  toIndicatorStatus,
} from "./pvt";
export { PVT_BA, adaptiveDecision, adaptiveState, categoryFromCount } from "./adaptive";
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
