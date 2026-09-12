"use client";

import { useEffect, useState } from "react";
import { botSay, useBot, type Emotion, type Pose } from "@/lib/bot";
import { WALK_MS } from "@/lib/cinematic";
import type { LifeState } from "@/lib/life";

type R = [number, number, number, number, string];

const SKIN = "#c98c5e";
const SKIN_DK = "#a87049";
const HAIR = "#221812";
const SHIRT = "#b83b34";
const SHIRT_DK = "#8f2b25";
const PANTS = "#39405a";
const PANTS_DK = "#2b3147";
const SHOE = "#ece7de";
const EYE = "#15151b";

/** Eyes and mouth are the whole personality — poses are secondary. */
function face(emotion: Emotion, look: { x: number; y: number }, blinking: boolean): R[] {
  const ex = Math.round(look.x);
  const ey = Math.round(look.y);

  if (blinking) {
    // A closed eye is a flat line. Two pixels of it reads as a blink.
    return [
      [8 + ex, 6 + ey, 2, 1, EYE],
      [14 + ex, 6 + ey, 2, 1, EYE],
      ...mouthFor(emotion),
    ];
  }

  const eyes: Record<Emotion, R[]> = {
    neutral: [
      [8 + ex, 5 + ey, 2, 2, EYE],
      [14 + ex, 5 + ey, 2, 2, EYE],
    ],
    happy: [
      [8 + ex, 5 + ey, 2, 1, EYE],
      [14 + ex, 5 + ey, 2, 1, EYE],
      [7 + ex, 4 + ey, 1, 1, EYE],
      [16 + ex, 4 + ey, 1, 1, EYE],
    ],
    curious: [
      [8 + ex, 4 + ey, 2, 3, EYE],
      [14 + ex, 5 + ey, 2, 2, EYE],
    ],
    thinking: [
      [8 + ex, 6 + ey, 2, 1, EYE],
      [14 + ex, 6 + ey, 2, 1, EYE],
    ],
    surprised: [
      [7 + ex, 4 + ey, 3, 3, EYE],
      [14 + ex, 4 + ey, 3, 3, EYE],
    ],
    proud: [
      [8 + ex, 5 + ey, 2, 2, EYE],
      [14 + ex, 5 + ey, 2, 2, EYE],
      [6, 3, 3, 1, HAIR],
    ],
    playful: [
      [8 + ex, 5 + ey, 2, 1, EYE],
      [14 + ex, 4 + ey, 2, 3, EYE],
    ],
  };

  return [...eyes[emotion], ...mouthFor(emotion)];
}

function mouthFor(emotion: Emotion): R[] {
  const mouth: Record<Emotion, R[]> = {
    neutral: [[10, 9, 4, 1, SKIN_DK]],
    happy: [
      [9, 9, 6, 1, EYE],
      [8, 8, 1, 1, EYE],
      [15, 8, 1, 1, EYE],
    ],
    curious: [[11, 9, 2, 2, EYE]],
    thinking: [[9, 9, 3, 1, SKIN_DK]],
    surprised: [[10, 8, 4, 3, EYE]],
    proud: [[9, 9, 6, 1, EYE]],
    playful: [
      [9, 9, 5, 1, EYE],
      [14, 8, 1, 1, EYE],
    ],
  };
  return mouth[emotion];
}

function body(pose: Pose, frame: "a" | "b"): R[] {
  const base: R[] = [
    // head + hair
    [6, 0, 12, 11, SKIN],
    [5, -2, 14, 5, HAIR],
    [4, 1, 2, 6, HAIR],
    [18, 1, 2, 6, HAIR],
    [4, -1, 3, 2, HAIR],
    // neck
    [10, 11, 4, 3, SKIN_DK],
    // torso
    [4, 14, 16, 20, SHIRT],
    [4, 14, 3, 20, SHIRT_DK],
    [17, 14, 3, 20, SHIRT_DK],
    // the T on the shirt
    [9, 19, 6, 2, "#f3e6c8"],
    [11, 21, 2, 5, "#f3e6c8"],
    // legs
    [5, 34, 6, 22, PANTS],
    [13, 34, 6, 22, PANTS],
    [5, 34, 14, 3, PANTS_DK],
    // shoes
    [3, 56, 9, 4, SHOE],
    [12, 56, 9, 4, SHOE],
    [1, 60, 22, 2, "#00000038"],
  ];

  // Legs swap during a walk; the CSS class alternates the two frames.
  const legs: Record<"a" | "b", R[]> =
    {
      a: [
        [4, 34, 6, 22, PANTS],
        [14, 34, 6, 20, PANTS],
        [2, 54, 9, 4, SHOE],
        [13, 56, 9, 4, SHOE],
      ],
      b: [
        [5, 34, 6, 20, PANTS],
        [13, 34, 6, 22, PANTS],
        [3, 56, 9, 4, SHOE],
        [14, 54, 9, 4, SHOE],
      ],
    };

  const arms: Record<Pose, R[]> = {
    idle: [
      [1, 17, 4, 14, SHIRT_DK],
      [19, 17, 4, 14, SHIRT_DK],
      [1, 31, 4, 4, SKIN],
      [19, 31, 4, 4, SKIN],
    ],
    wave: [
      [1, 17, 4, 12, SHIRT_DK],
      [1, 29, 4, 4, SKIN],
      [19, 12, 4, 10, SHIRT_DK],
      [20, 6, 4, 6, SKIN],
      [19, 4, 6, 3, SKIN],
    ],
    point: [
      [1, 17, 4, 14, SHIRT_DK],
      [1, 31, 4, 4, SKIN],
      [19, 18, 9, 4, SHIRT_DK],
      [27, 18, 6, 4, SKIN],
    ],
    type: [
      [1, 18, 4, 10, SHIRT_DK],
      [19, 18, 4, 10, SHIRT_DK],
      [2, 28, 6, 4, SKIN],
      [16, 28, 6, 4, SKIN],
    ],
    think: [
      [1, 17, 4, 14, SHIRT_DK],
      [1, 31, 4, 4, SKIN],
      [19, 16, 4, 8, SHIRT_DK],
      [16, 10, 5, 5, SKIN],
    ],
    walk: [
      [0, 18, 4, 12, SHIRT_DK],
      [20, 16, 4, 12, SHIRT_DK],
      [0, 30, 4, 4, SKIN],
      [20, 28, 4, 4, SKIN],
    ],
  };

  if (pose === "walk") {
    // Drop the static legs and shoes; the walk frames replace them.
    const still = base.filter((_, i) => i < 11 || i > 15);
    return [...still, ...legs[frame], ...arms.walk];
  }

  return [...base, ...arms[pose]];
}

export function TharunBot({ life }: { life: LifeState }) {
  const { line, emotion: spokenEmotion } = useBot();
  const [look, setLook] = useState({ x: 0, y: 0 });
  const [frame, setFrame] = useState<"a" | "b">("a");
  const [blinking, setBlinking] = useState(false);
  const [breath, setBreath] = useState(0);

  // Blink on an irregular cadence — a metronome blink reads as a glitch.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let timer: number;
    const schedule = () => {
      timer = window.setTimeout(
        () => {
          setBlinking(true);
          window.setTimeout(() => setBlinking(false), 120);
          schedule();
        },
        2600 + Math.random() * 4200,
      );
    };
    schedule();
    return () => clearTimeout(timer);
  }, []);

  // A single pixel of rise and fall. It is the difference between a sprite and
  // something that appears to be breathing.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => setBreath((b) => (b === 0 ? 1 : 0)), 1900);
    return () => clearInterval(id);
  }, []);

  // Subtle head/eye tracking. One pixel of travel is plenty at this scale.
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;
    const onMove = (e: PointerEvent) => {
      setLook({
        x: Math.max(-1, Math.min(1, (e.clientX / window.innerWidth - 0.7) * 3)),
        y: Math.max(-1, Math.min(1, (e.clientY / window.innerHeight - 0.55) * 2)),
      });
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  // Leg cycle, only while actually crossing the room.
  useEffect(() => {
    if (!life.walking) return;
    const id = window.setInterval(() => setFrame((f) => (f === "a" ? "b" : "a")), 130);
    return () => clearInterval(id);
  }, [life.walking]);

  const { mark } = life;
  // Priority: walking > what he is saying > what he is doing.
  const activePose: Pose = life.walking ? "walk" : (line?.pose ?? life.pose);
  const emotion = line ? spokenEmotion : life.emotion;
  const parts = [...body(activePose, frame), ...face(emotion, look, blinking)];
  const onRight = mark.x > 55;

  return (
    <div
      className="pointer-events-none absolute bottom-[11%] z-20 hidden h-[26vh] max-h-[260px] min-h-[150px] lg:block"
      style={{
        left: `${mark.x}%`,
        transform: `translate(-50%, ${breath && !life.walking ? -0.4 : 0}%) scale(${mark.scale})`,
        transformOrigin: "bottom center",
        transition: `left ${WALK_MS}ms cubic-bezier(0.37,0,0.63,1), transform 900ms ease-in-out`,
      }}
    >
      {line ? (
        <div
          className={`animate-fade-up pointer-events-auto absolute bottom-[62%] w-[17rem] ${
            onRight ? "right-full mr-3" : "left-full ml-3"
          }`}
        >
          <div className="rounded-lg border border-line bg-surface/96 px-3.5 py-3 shadow-2xl backdrop-blur-xl">
            <p className="mb-1 font-mono text-[9px] tracking-[0.22em] text-accent">THARUNBOT</p>
            <p className="text-[12.5px] leading-relaxed text-ink">{line.text}</p>
          </div>
        </div>
      ) : life.thought ? (
        // A thought, not speech — quieter, no name, and it never interrupts.
        <div
          className={`animate-fade-up absolute bottom-[66%] w-[15rem] ${
            onRight ? "right-full mr-3" : "left-full ml-3"
          }`}
        >
          <p className="rounded-lg border border-dashed border-line/70 bg-bg/55 px-3 py-2 text-[11.5px] leading-relaxed text-ink/65 italic backdrop-blur-sm">
            {life.thought}
          </p>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => botSay("summon")}
        aria-label="Ask TharunBOT"
        className="pointer-events-auto h-full transition-transform duration-200 hover:-translate-y-1"
      >
        <svg
          viewBox="0 0 34 64"
          shapeRendering="crispEdges"
          className="h-full w-auto drop-shadow-[0_8px_18px_rgba(0,0,0,0.55)]"
          style={{ transform: `scaleX(${mark.facing})` }}
          aria-hidden="true"
        >
          {parts.map(([x, y, w, h, fill], i) => (
            <rect key={i} x={x} y={y} width={w} height={h} fill={fill} />
          ))}
        </svg>
      </button>
    </div>
  );
}
