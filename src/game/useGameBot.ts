"use client";

import { useEffect, useState } from "react";
import { botSay, isReturning, markReturning, onBot, pickLine, type Line } from "@/lib/bot";
import { runtime } from "./runtime";
import { useGame } from "./store";

const BUBBLE_MS = 5200;
const AMBIENT_MS = 38_000;

/**
 * The same line table as TharunBOT in the OS, with island rules on top:
 * the greeting waits until you are actually standing on the island, ambient
 * lines only come while you are wandering (not reading a panel), and a line
 * with a wave makes him wave.
 */
export function useGameBot(active: boolean) {
  const [line, setLine] = useState<Line | null>(null);

  useEffect(() => {
    if (!active) return;
    let hide: number | null = null;
    let lastAmbient = "";

    const off = onBot((event) => {
      let next = pickLine(event);
      if (event === "game:idle" && next && next.id === lastAmbient) next = pickLine(event);
      if (!next) return;
      if (event === "game:idle") lastAmbient = next.id;
      setLine(next);
      if (next.pose === "wave") runtime.player.waveUntil = performance.now() + 1800;
      if (hide) clearTimeout(hide);
      hide = window.setTimeout(() => setLine(null), BUBBLE_MS);
    });

    const hello = window.setTimeout(() => {
      const back = isReturning() || useGame.getState().visited.length > 0;
      if (back) markReturning();
      botSay(back ? "game:return" : "game:enter");
    }, 900);

    const ambient = window.setInterval(() => {
      const g = useGame.getState();
      if (g.mode === "play" && !g.panelOpen && !g.overlay) botSay("game:idle");
    }, AMBIENT_MS);

    return () => {
      off();
      clearTimeout(hello);
      clearInterval(ambient);
      if (hide) clearTimeout(hide);
    };
  }, [active]);

  return line;
}
