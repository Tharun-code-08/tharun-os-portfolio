"use client";

import { useRef, useState } from "react";
import { queueJump } from "@/game/input";
import { runtime } from "@/game/runtime";
import { useGame } from "@/game/store";

const RADIUS = 52;

/**
 * Phones: a floating thumbstick on the left, A (interact) and B (jump) on the
 * right. Pushing the stick all the way out runs.
 */
export function TouchControls({ onInteract }: { onInteract: () => void }) {
  const focus = useGame((s) => s.focus);
  const [knob, setKnob] = useState<{ ox: number; oy: number; x: number; y: number } | null>(null);
  const origin = useRef<{ x: number; y: number; id: number } | null>(null);

  const end = () => {
    origin.current = null;
    runtime.input.stickX = 0;
    runtime.input.stickY = 0;
    runtime.input.stickRun = false;
    setKnob(null);
  };

  return (
    <>
      <div
        className="pointer-events-auto absolute bottom-0 left-0 h-[45%] w-1/2 touch-none"
        onPointerDown={(e) => {
          const el = e.currentTarget as HTMLElement;
          el.setPointerCapture(e.pointerId);
          const rect = el.getBoundingClientRect();
          origin.current = { x: e.clientX, y: e.clientY, id: e.pointerId };
          setKnob({ ox: e.clientX - rect.left, oy: e.clientY - rect.top, x: 0, y: 0 });
        }}
        onPointerMove={(e) => {
          const o = origin.current;
          if (!o || o.id !== e.pointerId) return;
          let dx = e.clientX - o.x;
          let dy = e.clientY - o.y;
          const d = Math.hypot(dx, dy);
          if (d > RADIUS) {
            dx = (dx / d) * RADIUS;
            dy = (dy / d) * RADIUS;
          }
          runtime.input.stickX = dx / RADIUS;
          runtime.input.stickY = -dy / RADIUS;
          runtime.input.stickRun = d > RADIUS * 0.92;
          runtime.input.moveTarget = null;
          setKnob((k) => (k ? { ...k, x: dx, y: dy } : k));
        }}
        onPointerUp={end}
        onPointerCancel={end}
      >
        {knob ? (
          <div
            className="absolute h-[104px] w-[104px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/20 bg-white/5 backdrop-blur-sm"
            style={{ left: knob.ox, top: knob.oy }}
          >
            <div
              className="absolute top-1/2 left-1/2 h-11 w-11 rounded-full bg-[#ffb020]/80 shadow-[0_0_20px_rgba(255,176,32,0.5)]"
              style={{ transform: `translate(calc(-50% + ${knob.x}px), calc(-50% + ${knob.y}px))` }}
            />
          </div>
        ) : (
          <p className="absolute bottom-8 left-8 font-mono text-[9px] tracking-[0.2em] text-white/40">DRAG TO MOVE</p>
        )}
      </div>

      <div className="pointer-events-auto absolute right-5 bottom-8 flex items-end gap-3">
        <button
          type="button"
          aria-label="Jump"
          onPointerDown={() => (runtime.input.jumpQueued = true)}
          className="grid h-14 w-14 place-items-center rounded-full border border-white/20 bg-white/10 font-mono text-[13px] font-bold text-white backdrop-blur active:scale-95"
        >
          B
        </button>
        <button
          type="button"
          aria-label="Interact"
          onPointerDown={() => {
            if (focus) onInteract();
            else queueJump();
          }}
          className={`mb-6 grid h-16 w-16 place-items-center rounded-full font-mono text-[15px] font-bold backdrop-blur active:scale-95 ${
            focus ? "bg-[#ffb020] text-[#0b0b12] shadow-[0_0_24px_rgba(255,176,32,0.6)]" : "border border-white/20 bg-white/10 text-white/60"
          }`}
        >
          A
        </button>
      </div>
    </>
  );
}
