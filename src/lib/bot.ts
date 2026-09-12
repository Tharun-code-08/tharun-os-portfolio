"use client";

import { useEffect, useState } from "react";

/**
 * TharunBOT — the character engine.
 *
 * Deliberately separate from the world (Scene) and the OS shell, so the room
 * can change without touching behaviour and vice versa.
 *
 * Rules that keep it from becoming annoying:
 *   - one bubble at a time, highest priority wins
 *   - a reactive line always beats an ambient one
 *   - ambient lines have a long cooldown and never repeat back to back
 *   - `once` lines fire a single time per session
 *   - prefers-reduced-motion silences ambient chatter entirely
 */

export type Emotion = "neutral" | "happy" | "curious" | "thinking" | "surprised" | "proud" | "playful";
export type Pose = "idle" | "wave" | "point" | "type" | "think" | "walk";

export type BotEvent =
  | "enter"
  | "return"
  | "idle"
  | `open:${string}`
  | `hover:${string}`
  | `space:${string}`
  | "devmode"
  | "closed-all"
  | "summon";

export type Line = {
  id: string;
  on: BotEvent | BotEvent[];
  text: string;
  emotion: Emotion;
  pose: Pose;
  /** Higher wins when two lines are eligible at once. */
  priority: number;
  /** Fire at most once per session. */
  once?: boolean;
  /** Only if this flag is already set (or, with `!`, only if it is not). */
  requires?: string;
};

export const LINES: Line[] = [
  // --- arrival -------------------------------------------------------------
  {
    id: "greet",
    on: "enter",
    text: "Hey. Come in — this is my workspace.",
    emotion: "happy",
    pose: "wave",
    priority: 90,
    once: true,
  },
  {
    id: "greet-back",
    on: "return",
    text: "Welcome back.",
    emotion: "happy",
    pose: "wave",
    priority: 90,
    once: true,
  },

  // --- reacting to apps ----------------------------------------------------
  {
    id: "work",
    on: "open:work",
    text: "This is where the ideas turn into software.",
    emotion: "proud",
    pose: "point",
    priority: 70,
  },
  {
    id: "project",
    on: "open:project",
    text: "Case file. The problem, the decision, and the part that wasn't glamorous.",
    emotion: "proud",
    pose: "point",
    priority: 70,
  },
  {
    id: "lab",
    on: "open:lab",
    text: "The lab. These are questions I haven't finished answering.",
    emotion: "curious",
    pose: "think",
    priority: 70,
  },
  {
    id: "terminal",
    on: "open:terminal",
    text: "Going technical? Try `neofetch`. Two commands aren't in `help`.",
    emotion: "playful",
    pose: "type",
    priority: 75,
  },
  {
    id: "browser",
    on: "open:browser",
    text: "Those are live. Claxon and BrandThis are what I work on right now.",
    emotion: "proud",
    pose: "point",
    priority: 70,
  },
  {
    id: "settings",
    on: "open:settings",
    text: "Three themes in there. Please don't break anything.",
    emotion: "playful",
    pose: "idle",
    priority: 70,
  },
  {
    id: "contact",
    on: "open:contact",
    text: "Looks like you've got something to build.",
    emotion: "happy",
    pose: "point",
    priority: 75,
  },
  {
    id: "proof",
    on: "open:proof",
    text: "Every number here links to something you can click. No invented metrics.",
    emotion: "neutral",
    pose: "point",
    priority: 70,
  },
  {
    id: "log",
    on: "open:log",
    text: "The whole timeline. It starts with XR, before university.",
    emotion: "neutral",
    pose: "think",
    priority: 70,
  },
  {
    id: "now",
    on: "open:now",
    text: "What I'm actually doing this month. If it's stale, tell me.",
    emotion: "neutral",
    pose: "idle",
    priority: 70,
  },
  {
    id: "stack",
    on: "open:stack",
    text: "Click anything — it shows the projects I actually used it on.",
    emotion: "curious",
    pose: "point",
    priority: 70,
  },
  {
    id: "me",
    on: "open:me",
    text: "The short version. Second-year student, already shipping.",
    emotion: "neutral",
    pose: "idle",
    priority: 70,
  },

  // --- reacting to a visitor who is digging -------------------------------
  {
    id: "deep",
    on: ["open:lab", "open:proof", "open:log"],
    text: "You're actually reading this. Most people stop at the projects.",
    emotion: "surprised",
    pose: "idle",
    priority: 85,
    requires: "explorer",
  },
  {
    id: "dev",
    on: "open:terminal",
    text: "Okay — you're definitely a developer.",
    emotion: "playful",
    pose: "type",
    priority: 88,
    requires: "explorer",
  },

  // --- hovering ------------------------------------------------------------
  {
    id: "hover-work",
    on: "hover:work",
    text: "Start there. Double-click it.",
    emotion: "neutral",
    pose: "point",
    priority: 40,
    once: true,
  },
  {
    id: "hover-lab",
    on: "hover:lab",
    text: "Careful. Some of those are still unresolved.",
    emotion: "playful",
    pose: "point",
    priority: 40,
    once: true,
  },

  // --- ambient -------------------------------------------------------------
  {
    id: "ambient-1",
    on: "idle",
    text: "Take your time. ⌘K searches everything.",
    emotion: "neutral",
    pose: "idle",
    priority: 10,
  },
  {
    id: "ambient-2",
    on: "idle",
    text: "The room is clickable too, not just the icons.",
    emotion: "curious",
    pose: "idle",
    priority: 10,
  },
  {
    id: "ambient-3",
    on: "idle",
    text: "Press R if you're hiring and short on time.",
    emotion: "neutral",
    pose: "think",
    priority: 10,
  },
  {
    id: "ambient-4",
    on: "idle",
    text: "Not everything here worked the first time. That's the point.",
    emotion: "thinking",
    pose: "think",
    priority: 10,
  },
  {
    id: "summon",
    on: "summon",
    text: "Where do you want to go?",
    emotion: "happy",
    pose: "wave",
    priority: 95,
  },

  // --- relationship tiers --------------------------------------------------
  {
    id: "tier-curious",
    on: "idle",
    text: "You're still here. Most people leave after the projects.",
    emotion: "surprised",
    pose: "idle",
    priority: 30,
    once: true,
    requires: "tier:2",
  },
  {
    id: "tier-deep",
    on: "idle",
    text: "You really do read the architecture bits, don't you.",
    emotion: "happy",
    pose: "think",
    priority: 35,
    once: true,
    requires: "tier:3",
  },
  {
    id: "tier-regular",
    on: "idle",
    text: "You've been here before. At this point you may as well email me.",
    emotion: "playful",
    pose: "point",
    priority: 40,
    once: true,
    requires: "tier:4",
  },
  {
    id: "devmode",
    on: "idle",
    text: "Press D if you want to see how this is actually wired up.",
    emotion: "curious",
    pose: "idle",
    priority: 25,
    once: true,
    requires: "tier:2",
  },

  // --- spaces + developer mode --------------------------------------------
  {
    id: "space-work",
    on: "space:work",
    text: "Work desk. Everything I've shipped lives here.",
    emotion: "proud",
    pose: "point",
    priority: 80,
  },
  {
    id: "space-lab",
    on: "space:lab",
    text: "Cooler light in here. This is the messy side.",
    emotion: "curious",
    pose: "think",
    priority: 80,
  },
  {
    id: "space-personal",
    on: "space:personal",
    text: "Back to the warm desk.",
    emotion: "happy",
    pose: "idle",
    priority: 80,
  },
  {
    id: "dev-on",
    on: "devmode",
    text: "Okay — let's look at the system.",
    emotion: "playful",
    pose: "type",
    priority: 92,
  },
];

/* ------------------------------------------------------------------ state - */

const FLAGS_KEY = "tharun-os-bot-flags";
const SEEN_KEY = "tharun-os-seen";

type Flags = Record<string, boolean>;

function readFlags(): Flags {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(sessionStorage.getItem(FLAGS_KEY) ?? "{}") as Flags;
  } catch {
    return {};
  }
}

function writeFlags(flags: Flags) {
  try {
    sessionStorage.setItem(FLAGS_KEY, JSON.stringify(flags));
  } catch {
    /* private mode — the bot just forgets, which is fine. */
  }
}

/**
 * Relationship tier — session-local only, never persisted to a profile and
 * never tied to anything identifying. It exists so the bot can stop explaining
 * the basics to someone who has clearly already understood them.
 *
 *   0 visitor · 1 explorer · 2 curious · 3 deep dive · 4 regular
 */
export const TIER_NAMES = ["Visitor", "Explorer", "Curious", "Deep dive", "Regular"] as const;

export function tier(): number {
  const flags = readFlags();
  const opened = Object.keys(flags).filter((k) => k.startsWith("opened:")).length;
  let t = 0;
  if (opened >= 2) t = 1;
  if (opened >= 4) t = 2;
  if (opened >= 6 || flags["opened:project"]) t = 3;
  if (flags.returning && opened >= 3) t = 4;
  return t;
}

export function markOpened(appId: string) {
  const flags = readFlags();
  flags[`opened:${appId}`] = true;
  const count = Object.keys(flags).filter((k) => k.startsWith("opened:")).length;
  if (count >= 3) flags.explorer = true;
  writeFlags(flags);
}

export function markReturning() {
  const flags = readFlags();
  flags.returning = true;
  writeFlags(flags);
}

export function isReturning() {
  if (typeof window === "undefined") return false;
  try {
    const seen = localStorage.getItem(SEEN_KEY) === "1";
    localStorage.setItem(SEEN_KEY, "1");
    return seen;
  } catch {
    return false;
  }
}

/* ------------------------------------------------------------------- bus -- */

type Listener = (event: BotEvent) => void;
const listeners = new Set<Listener>();

export function botSay(event: BotEvent) {
  listeners.forEach((l) => l(event));
}

export function onBot(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/* ------------------------------------------------------------------ pick -- */

const fired = new Set<string>();
let lastAmbient = "";

function matches(line: Line, event: BotEvent) {
  return Array.isArray(line.on) ? line.on.includes(event) : line.on === event;
}

export function pickLine(event: BotEvent): Line | null {
  const flags = readFlags();

  const eligible = LINES.filter((line) => {
    if (!matches(line, event)) return false;
    if (line.once && fired.has(line.id)) return false;
    if (line.requires) {
      // "tier:3" gates on relationship depth; "!flag" inverts a flag.
      if (line.requires.startsWith("tier:")) {
        if (tier() < Number(line.requires.slice(5))) return false;
      } else {
        const negate = line.requires.startsWith("!");
        const key = negate ? line.requires.slice(1) : line.requires;
        if (negate ? flags[key] : !flags[key]) return false;
      }
    }
    if (event === "idle" && line.id === lastAmbient) return false;
    return true;
  });

  if (eligible.length === 0) return null;

  const top = Math.max(...eligible.map((l) => l.priority));
  const best = eligible.filter((l) => l.priority === top);
  const chosen = best[Math.floor(Math.random() * best.length)];

  if (chosen.once) fired.add(chosen.id);
  if (event === "idle") lastAmbient = chosen.id;
  return chosen;
}

/* ------------------------------------------------------------------ hook -- */

export type BotState = { line: Line | null; emotion: Emotion; pose: Pose };

const AMBIENT_EVERY = 32_000;
const BUBBLE_MS = 6_000;

export function useBot(): BotState {
  const [line, setLine] = useState<Line | null>(null);
  const [emotion, setEmotion] = useState<Emotion>("neutral");
  const [pose, setPose] = useState<Pose>("idle");

  useEffect(() => {
    let hideTimer: number | null = null;

    const show = (next: Line) => {
      setLine(next);
      setEmotion(next.emotion);
      setPose(next.pose);
      if (hideTimer) clearTimeout(hideTimer);
      hideTimer = window.setTimeout(() => {
        setLine(null);
        setPose("idle");
        setEmotion("neutral");
      }, BUBBLE_MS);
    };

    const off = onBot((event) => {
      const next = pickLine(event);
      if (next) show(next);
    });

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const first = window.setTimeout(() => {
      const back = isReturning();
      if (back) markReturning();
      botSay(back ? "return" : "enter");
    }, 1200);
    const ambient = reduced ? null : window.setInterval(() => botSay("idle"), AMBIENT_EVERY);

    return () => {
      off();
      clearTimeout(first);
      if (ambient) clearInterval(ambient);
      if (hideTimer) clearTimeout(hideTimer);
    };
  }, []);

  return { line, emotion, pose };
}
