"use client";

import { useEffect, useState } from "react";
import { botSay, useBot, type Emotion, type Pose } from "@/lib/bot";

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
function face(emotion: Emotion, look: { x: number; y: number }): R[] {
  const ex = Math.round(look.x);
  const ey = Math.round(look.y);

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

  return [...eyes[emotion], ...mouth[emotion]];
}

function body(pose: Pose): R[] {
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
  };

  return [...base, ...arms[pose]];
}

export function TharunBot() {
  const { line, emotion, pose } = useBot();
  const [look, setLook] = useState({ x: 0, y: 0 });

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

  const parts = [...body(pose), ...face(emotion, look)];

  return (
    <div className="pointer-events-none absolute right-[4%] bottom-[11%] z-20 hidden h-[26vh] max-h-[260px] min-h-[150px] lg:block">
      {line ? (
        <div className="animate-fade-up pointer-events-auto absolute right-full bottom-[62%] mr-3 w-[17rem]">
          <div className="rounded-lg rounded-br-none border border-line bg-surface/96 px-3.5 py-3 shadow-2xl backdrop-blur-xl">
            <p className="mb-1 font-mono text-[9px] tracking-[0.22em] text-accent">THARUNBOT</p>
            <p className="text-[12.5px] leading-relaxed text-ink">{line.text}</p>
          </div>
          <div className="ml-auto h-2.5 w-2.5 -translate-y-px border-r border-b border-line bg-surface/96" />
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
