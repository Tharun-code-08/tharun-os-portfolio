"use client";

import { useEffect, useRef, useState } from "react";
import type { Pose } from "@/lib/bot";

/**
 * The 15-second loop.
 *
 * Five scenes, three seconds each. The character walks between marks, the
 * camera reframes, and the light changes from morning to night — but the OS
 * chrome never moves. The world animates underneath a stable interface.
 *
 * The rule that matters: the visitor always wins. Open anything and the loop
 * pauses where it is; it resumes only after the desktop is clear and idle.
 */

export type SceneId = "wake" | "discover" | "build" | "think" | "invite";

export type Scene = {
  id: SceneId;
  label: string;
  /** Character mark, as a percentage of the stage. */
  bot: { x: number; y: number; scale: number; pose: Pose; facing: 1 | -1 };
  /** Camera framing applied to the world layer only. */
  camera: { x: number; y: number; scale: number };
  /** Colour wash for the hour of day. */
  light: string;
  line: string;
};

export const SCENE_MS = 3000;
export const WALK_MS = 900;

export const SCENES: Scene[] = [
  {
    id: "wake",
    label: "WAKE",
    bot: { x: 78, y: 0, scale: 1, pose: "type", facing: -1 },
    camera: { x: 0, y: 0, scale: 1 },
    light: "rgba(255, 186, 110, 0.10)",
    line: "Hey. Come in — this is my workspace.",
  },
  {
    id: "discover",
    label: "DISCOVER",
    bot: { x: 41, y: 2, scale: 1.06, pose: "point", facing: -1 },
    camera: { x: 3, y: 0, scale: 1.04 },
    light: "rgba(255, 214, 170, 0.08)",
    line: "Projects, experiments, unfinished ideas. It all starts on the left.",
  },
  {
    id: "build",
    label: "BUILD",
    bot: { x: 74, y: 0, scale: 1.12, pose: "point", facing: -1 },
    camera: { x: -6, y: -2, scale: 1.1 },
    light: "rgba(180, 214, 255, 0.07)",
    line: "This is where the ideas turn into software.",
  },
  {
    id: "think",
    label: "THINK",
    bot: { x: 26, y: 1, scale: 1.04, pose: "think", facing: 1 },
    camera: { x: 8, y: -1, scale: 1.06 },
    light: "rgba(255, 168, 120, 0.11)",
    line: "Not everything worked the first time. That is most of the story.",
  },
  {
    id: "invite",
    label: "INVITE",
    bot: { x: 86, y: 1, scale: 1.02, pose: "wave", facing: -1 },
    camera: { x: -9, y: -3, scale: 1.08 },
    light: "rgba(110, 140, 220, 0.16)",
    line: "So — where do you want to go?",
  },
];

const SKIP_KEY = "tharun-os-cinematic-skipped";

export function hasSkipped() {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(SKIP_KEY) === "1";
  } catch {
    return false;
  }
}

export function rememberSkip() {
  try {
    localStorage.setItem(SKIP_KEY, "1");
  } catch {
    /* storage disabled — the loop simply plays again next time. */
  }
}

export type CinematicState = {
  scene: Scene;
  index: number;
  /** True during the hand-off between two marks, so legs can cycle. */
  walking: boolean;
  playing: boolean;
};

/**
 * @param enabled false while the visitor is doing something, or when they have
 *        turned the loop off, or under prefers-reduced-motion.
 */
export function useCinematic(enabled: boolean): CinematicState {
  const [index, setIndex] = useState(0);
  const [walking, setWalking] = useState(false);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    const clear = () => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };

    // No setState on the disabled path — `walking` is masked by `enabled`
    // below instead, which keeps this effect purely about scheduling.
    if (!enabled) {
      clear();
      return clear;
    }

    // One scheduled hop at a time rather than a global interval, so pausing
    // mid-scene resumes cleanly instead of jumping.
    const schedule = () => {
      const toWalk = window.setTimeout(() => setWalking(true), SCENE_MS - WALK_MS);
      const toNext = window.setTimeout(() => {
        setIndex((i) => (i + 1) % SCENES.length);
        setWalking(false);
        schedule();
      }, SCENE_MS);
      timers.current.push(toWalk, toNext);
    };

    schedule();
    return clear;
  }, [enabled]);

  return { scene: SCENES[index], index, walking: enabled && walking, playing: enabled };
}
