import type { Quality } from "./store";

/**
 * Three presets. "auto" starts from a guess about the device and the
 * PerformanceMonitor steps it down if frames start dropping.
 */
export const QUALITY: Record<
  Quality,
  { dpr: [number, number]; shadows: boolean; post: boolean; grass: number; trees: number; aberration: boolean }
> = {
  low: { dpr: [1, 1], shadows: false, post: false, grass: 0, trees: 0.55, aberration: false },
  medium: { dpr: [1, 1.5], shadows: true, post: true, grass: 7000, trees: 1, aberration: false },
  high: { dpr: [1, 2], shadows: true, post: true, grass: 16000, trees: 1, aberration: true },
};

export function guessQuality(): Quality {
  if (typeof window === "undefined") return "medium";
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const small = Math.min(window.innerWidth, window.innerHeight) < 600;
  if (coarse && small) return "low";
  const cores = navigator.hardwareConcurrency ?? 4;
  if (coarse || cores <= 4) return "medium";
  return "high";
}

export function isTouchDevice() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(pointer: coarse)").matches;
}
