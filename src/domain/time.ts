import type { MissionMin } from './types';

export const DAY = 1440;

export const missionDay = (m: MissionMin): number => Math.floor(m / DAY) + 1;

export function clock(m: MissionMin): string {
  const t = ((Math.floor(m) % DAY) + DAY) % DAY;
  return String(Math.floor(t / 60)).padStart(2, '0') + ':' + String(t % 60).padStart(2, '0');
}

/** "Day 8 06:14" */
export const stamp = (m: MissionMin): string => `Day ${missionDay(m)} ${clock(m)}`;

/** Relative age in words. Old data must read as old. */
export function age(from: MissionMin, now: MissionMin): string {
  const d = Math.floor(now - from);
  if (d < 1) return 'just now';
  if (d < 60) return `${d} min ago`;
  if (d < DAY) return `${Math.floor(d / 60)} h ${d % 60} min ago`;
  const days = Math.floor(d / DAY);
  return `${days} d ago`;
}

export function duration(min: number): string {
  const m = Math.round(min);
  return `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')} min`;
}

export const sameDay = (a: MissionMin, b: MissionMin): boolean => missionDay(a) === missionDay(b);
