"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import type { Group } from "three";
import { runtime } from "@/game/runtime";
import { useGame } from "@/game/store";
import { useGameBot } from "@/game/useGameBot";

/**
 * His voice, above his head. Follows the player without being parented to
 * the rotating model, so the bubble never spins when he turns around.
 */
export function SpeechBubble() {
  // Listening from the first step on the island; only the bubble hides while
  // a panel, a menu or the OS is in front.
  const playing = useGame((s) => s.mode !== "title" && s.mode !== "intro");
  const hidden = useGame((s) => s.panelOpen || !!s.overlay || s.mode === "os" || s.mode === "os-enter");
  const line = useGameBot(playing);
  const anchor = useRef<Group>(null);

  useFrame(() => {
    if (anchor.current) anchor.current.position.copy(runtime.player.position).setY(runtime.player.position.y + 2.05);
  });

  return (
    <group ref={anchor}>
      {line && !hidden ? (
        <Html center zIndexRange={[30, 20]} style={{ pointerEvents: "none" }}>
          <div key={line.id} className="animate-bubble-in relative w-max max-w-[18rem] -translate-y-1/2">
            <div className="rounded-2xl border border-white/15 bg-[#0d0f1a]/88 px-3.5 py-2 text-[12.5px] leading-snug text-[#f6efe2] shadow-[0_10px_30px_-10px_rgba(0,0,0,0.8)] backdrop-blur-md">
              <span className="mb-0.5 block font-mono text-[8.5px] tracking-[0.24em] text-[#ffb020]">THARUN</span>
              {line.text}
            </div>
            <span className="absolute -bottom-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-r border-b border-white/15 bg-[#0d0f1a]/88" />
          </div>
        </Html>
      ) : null}
    </group>
  );
}
