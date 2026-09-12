"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Emotion, Pose } from "@/lib/bot";
import { SCENES, SCENE_MS, WALK_MS, type Scene } from "@/lib/cinematic";

/**
 * TharunBOT's life.
 *
 * The five-scene film plays once as a welcome, then the character drops into
 * ambient mode — an ongoing simulation with anchors, activities and a rough
 * day. The point is that he is not waiting for you. He was already here.
 *
 * Nothing here is random noise: which activity comes next is weighted by the
 * hour and by what the visitor has actually been reading.
 */

export type Anchor = "desk" | "whiteboard" | "shelf" | "couch" | "window";

/** Where the marks are, as a percentage of the stage, plus the camera framing. */
export const ANCHORS: Record<
  Anchor,
  { x: number; scale: number; facing: 1 | -1; camera: { x: number; y: number; scale: number } }
> = {
  desk: { x: 76, scale: 1.06, facing: -1, camera: { x: -5, y: -2, scale: 1.08 } },
  whiteboard: { x: 41, scale: 1.04, facing: -1, camera: { x: 3, y: 0, scale: 1.04 } },
  shelf: { x: 20, scale: 1.02, facing: 1, camera: { x: 8, y: -1, scale: 1.05 } },
  couch: { x: 30, scale: 1.03, facing: 1, camera: { x: 6, y: -1, scale: 1.06 } },
  window: { x: 88, scale: 1.0, facing: -1, camera: { x: -9, y: -3, scale: 1.07 } },
};

export type Slot = "morning" | "afternoon" | "evening" | "night";

export type Activity = {
  id: string;
  anchor: Anchor;
  pose: Pose;
  emotion: Emotion;
  /** How long he stays once he arrives. */
  ms: number;
  /** Which hours this fits. Empty means any. */
  slots: Slot[];
  /** Biases selection when the visitor has been reading this kind of thing. */
  tag?: "work" | "lab" | "read" | "rest";
  /** Shown occasionally — most activities pass in silence, which is the point. */
  thought?: string;
};

export const ACTIVITIES: Activity[] = [
  {
    id: "coffee",
    anchor: "shelf",
    pose: "idle",
    emotion: "neutral",
    ms: 7000,
    slots: ["morning"],
    tag: "rest",
    thought: "Coffee first. Architecture later.",
  },
  {
    id: "coding",
    anchor: "desk",
    pose: "type",
    emotion: "neutral",
    ms: 12000,
    slots: [],
    tag: "work",
  },
  {
    id: "coding-deep",
    anchor: "desk",
    pose: "type",
    emotion: "thinking",
    ms: 14000,
    slots: ["afternoon", "evening"],
    tag: "work",
    thought: "Third attempt at this one.",
  },
  {
    id: "whiteboard",
    anchor: "whiteboard",
    pose: "think",
    emotion: "thinking",
    ms: 9000,
    slots: [],
    tag: "lab",
    thought: "This looked simpler two weeks ago.",
  },
  {
    id: "sketch",
    anchor: "whiteboard",
    pose: "point",
    emotion: "curious",
    ms: 8000,
    slots: ["afternoon"],
    tag: "lab",
  },
  {
    id: "reading",
    anchor: "shelf",
    pose: "idle",
    emotion: "curious",
    ms: 10000,
    slots: ["morning", "afternoon"],
    tag: "read",
    thought: "Still trying to understand this properly.",
  },
  {
    id: "notes",
    anchor: "couch",
    pose: "think",
    emotion: "neutral",
    ms: 10000,
    slots: ["evening"],
    tag: "read",
    thought: "Writing down what broke today.",
  },
  {
    id: "review",
    anchor: "couch",
    pose: "idle",
    emotion: "proud",
    ms: 8000,
    slots: ["evening"],
    tag: "work",
  },
  {
    id: "stretch",
    anchor: "desk",
    pose: "idle",
    emotion: "neutral",
    ms: 5000,
    slots: [],
    tag: "rest",
  },
  {
    id: "window-think",
    anchor: "window",
    pose: "idle",
    emotion: "thinking",
    ms: 11000,
    slots: ["evening", "night"],
    tag: "rest",
    thought: "Not sure what's next. That's usually a good sign.",
  },
  {
    id: "window-night",
    anchor: "window",
    pose: "idle",
    emotion: "neutral",
    ms: 13000,
    slots: ["night"],
    tag: "rest",
  },
  {
    id: "late",
    anchor: "desk",
    pose: "type",
    emotion: "thinking",
    ms: 12000,
    slots: ["night"],
    tag: "work",
    thought: "One more fix. Famous last words.",
  },
];

export function slotFor(date = new Date()): Slot {
  const h = date.getHours();
  if (h < 11) return "morning";
  if (h < 17) return "afternoon";
  if (h < 21) return "evening";
  return "night";
}

export const SLOT_LIGHT: Record<Slot, string> = {
  morning: "rgba(255, 198, 130, 0.11)",
  afternoon: "rgba(255, 224, 180, 0.07)",
  evening: "rgba(255, 160, 110, 0.12)",
  night: "rgba(110, 140, 220, 0.16)",
};

export const SLOT_LABEL: Record<Slot, string> = {
  morning: "MORNING",
  afternoon: "AFTERNOON",
  evening: "EVENING",
  night: "LATE",
};

/** Phases give movement its anticipation instead of teleporting between marks. */
export type Phase = "settled" | "notice" | "walking";

export type LifeState = {
  mode: "intro" | "ambient";
  /** Present during the intro film. */
  scene: Scene | null;
  index: number;
  label: string;
  anchor: Anchor;
  mark: { x: number; scale: number; facing: 1 | -1 };
  camera: { x: number; y: number; scale: number };
  light: string;
  pose: Pose;
  emotion: Emotion;
  phase: Phase;
  walking: boolean;
  thought: string | null;
  activityId: string | null;
  playing: boolean;
};

const NOTICE_MS = 420;

function pickActivity(slot: Slot, bias: string | null, lastId: string | null): Activity {
  const fits = ACTIVITIES.filter(
    (a) => (a.slots.length === 0 || a.slots.includes(slot)) && a.id !== lastId,
  );
  const pool = fits.length > 0 ? fits : ACTIVITIES;

  // Weight by the hour, then nudge toward whatever the visitor has been reading.
  const weighted = pool.flatMap((a) => {
    let n = a.slots.includes(slot) ? 3 : 1;
    if (bias && a.tag === bias) n += 3;
    return Array<Activity>(n).fill(a);
  });

  return weighted[Math.floor(Math.random() * weighted.length)];
}

export function useLife(enabled: boolean, bias: string | null): LifeState {
  const [mode, setMode] = useState<"intro" | "ambient">("intro");
  const [index, setIndex] = useState(0);
  const [activity, setActivity] = useState<Activity>(ACTIVITIES[1]);
  const [phase, setPhase] = useState<Phase>("settled");
  const [thought, setThought] = useState<string | null>(null);
  const [slot, setSlot] = useState<Slot>(() => slotFor());

  const timers = useRef<number[]>([]);
  const lastId = useRef<string | null>(null);
  const cursor = useRef(0);
  // Kept in a ref so the scheduler reads the latest value without restarting.
  const biasRef = useRef(bias);
  useEffect(() => {
    biasRef.current = bias;
  }, [bias]);

  const clear = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);

  // The clock only matters at slot boundaries; once a minute is plenty.
  useEffect(() => {
    const id = window.setInterval(() => setSlot(slotFor()), 60_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!enabled) {
      clear();
      return clear;
    }

    const push = (fn: () => void, ms: number) => {
      timers.current.push(window.setTimeout(fn, ms));
    };

    const runAmbient = () => {
      const next = pickActivity(slotFor(), biasRef.current, lastId.current);
      lastId.current = next.id;

      // notice → turn → walk → settle. The pause before moving is what stops
      // it reading like a teleport.
      setPhase("notice");
      setThought(null);
      push(() => {
        setActivity(next);
        setPhase("walking");
        push(() => {
          setPhase("settled");
          // Most activities pass in silence; a thought is the exception.
          if (next.thought && Math.random() < 0.45) {
            setThought(next.thought);
            push(() => setThought(null), 5200);
          }
          push(runAmbient, next.ms);
        }, WALK_MS);
      }, NOTICE_MS);
    };

    if (mode === "intro") {
      // The cursor is held in a ref rather than derived inside a setState
      // updater: Strict Mode double-invokes updaters, and scheduling the next
      // scene from inside one made the film run at double speed.
      const runIntro = () => {
        push(() => setPhase("walking"), SCENE_MS - WALK_MS);
        push(() => {
          const next = cursor.current + 1;
          if (next >= SCENES.length) {
            // The film has played. From here he simply lives here.
            setMode("ambient");
            setPhase("settled");
            push(runAmbient, 600);
            return;
          }
          cursor.current = next;
          setIndex(next);
          setPhase("settled");
          runIntro();
        }, SCENE_MS);
      };
      runIntro();
    } else {
      runAmbient();
    }

    return clear;
  }, [enabled, mode, clear]);

  const scene = mode === "intro" ? SCENES[index] : null;
  const anchor = scene
    ? (["desk", "whiteboard", "desk", "couch", "window"] as Anchor[])[index]
    : activity.anchor;
  const a = ANCHORS[anchor];

  return {
    mode,
    scene,
    index,
    label: scene ? scene.label : SLOT_LABEL[slot],
    anchor,
    mark: scene
      ? { x: scene.bot.x, scale: scene.bot.scale, facing: scene.bot.facing }
      : { x: a.x, scale: a.scale, facing: a.facing },
    camera: scene ? scene.camera : a.camera,
    light: scene ? scene.light : SLOT_LIGHT[slot],
    pose: scene ? scene.bot.pose : activity.pose,
    emotion: scene ? "neutral" : activity.emotion,
    phase: enabled ? phase : "settled",
    walking: enabled && phase === "walking",
    thought: enabled && mode === "ambient" ? thought : null,
    activityId: mode === "ambient" ? activity.id : null,
    playing: enabled,
  };
}
