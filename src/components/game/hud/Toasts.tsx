"use client";

import { useEffect } from "react";
import { useGame, type Toast } from "@/game/store";

function Item({ t }: { t: Toast }) {
  const drop = useGame((s) => s.dropToast);
  useEffect(() => {
    const id = window.setTimeout(() => drop(t.id), t.kind === "achievement" ? 4800 : 3800);
    return () => clearTimeout(id);
  }, [t, drop]);

  const achievement = t.kind === "achievement";
  return (
    <li className="animate-toast-in hud-glass flex items-center gap-3 rounded-2xl py-2.5 pr-5 pl-2.5">
      <span
        className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl text-[18px] ${
          achievement ? "bg-gradient-to-br from-[#ffd27a] to-[#ff7a45] text-[#0b0b12] shadow-[0_0_24px_rgba(255,176,32,0.45)]" : "bg-white/8 text-[#ffb020]"
        }`}
      >
        {achievement ? "★" : "⬡"}
      </span>
      <span className="min-w-0">
        <span className="block font-mono text-[8.5px] tracking-[0.26em] text-[#ffb020]">
          {achievement ? "ACHIEVEMENT UNLOCKED" : t.kind === "commit" ? "COMMIT FOUND" : "NOTE"}
        </span>
        <span className="block font-display text-[14px] font-semibold text-white">{t.title}</span>
        {t.detail ? <span className="block max-w-[18rem] truncate text-[11.5px] text-white/60">{t.detail}</span> : null}
      </span>
    </li>
  );
}

export function Toasts() {
  const toasts = useGame((s) => s.toasts);
  return (
    <ul className="pointer-events-none absolute top-20 left-1/2 z-[70] flex -translate-x-1/2 flex-col items-center gap-2">
      {toasts.map((t) => (
        <Item key={t.id} t={t} />
      ))}
    </ul>
  );
}
