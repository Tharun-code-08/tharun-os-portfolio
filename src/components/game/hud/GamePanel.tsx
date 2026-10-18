"use client";

import { useEffect } from "react";
import { useOs } from "@/lib/os";
import { sfx } from "@/game/audio";
import { useGame } from "@/game/store";
import { ZONE_BY_ID } from "@/game/zones";
import { AppHost } from "../../os/AppHost";

/**
 * A zone app, opened in the world. Same window store as the OS, rendered the
 * way MobileShell renders it: only the top window, full height, with a back
 * stack — so WORK → case file → back works without any new code.
 *
 * It docks to the right so the camera can keep the player framed on the left.
 */
export function GamePanel() {
  const os = useOs();
  const zone = useGame((s) => s.zone);
  const stack = os.wins.filter((w) => !w.minimized).sort((a, b) => b.z - a.z);
  const top = stack[0];
  const depth = stack.length;
  const color = zone ? ZONE_BY_ID[zone].color : "#ffb020";

  useEffect(() => {
    if (!top) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      e.stopPropagation();
      sfx("close");
      os.close(top.id);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [top, os]);

  if (!top) return null;

  const closeAll = () => {
    sfx("close");
    stack.forEach((w) => os.close(w.id));
  };

  return (
    <div className="absolute inset-0 z-40 flex justify-end">
      {/* Clicking the world closes the panel. */}
      <button
        type="button"
        aria-label="Close"
        onClick={closeAll}
        className="absolute inset-0 cursor-default bg-gradient-to-r from-transparent via-[#05060c]/30 to-[#05060c]/75"
      />

      <section
        key={top.id}
        aria-label={top.title}
        className="animate-panel-in relative m-0 flex h-full w-full flex-col overflow-hidden border-white/10 bg-surface/95 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.9)] backdrop-blur-xl sm:m-4 sm:h-[calc(100%-2rem)] sm:w-[min(780px,60vw)] sm:rounded-2xl sm:border"
      >
        <span className="absolute inset-x-0 top-0 h-[2px]" style={{ background: `linear-gradient(90deg, ${color}, transparent)` }} />
        <header className="flex h-12 shrink-0 items-center gap-3 border-b border-line px-4">
          {depth > 1 ? (
            <button
              type="button"
              onClick={() => {
                sfx("close");
                os.close(top.id);
              }}
              className="flex items-center gap-1.5 rounded-md border border-line px-2 py-1 font-mono text-[10px] tracking-[0.14em] text-muted transition-colors hover:border-accent hover:text-accent"
            >
              ← BACK
            </button>
          ) : null}
          <div className="min-w-0 flex-1">
            {zone ? (
              <p className="font-mono text-[8.5px] tracking-[0.26em] uppercase" style={{ color }}>
                {ZONE_BY_ID[zone].name}
              </p>
            ) : null}
            <p className="truncate font-mono text-[11.5px] tracking-[0.16em] text-ink">{top.title}</p>
          </div>
          <span className="hidden font-mono text-[9px] tracking-[0.16em] text-faint sm:inline">
            <span className="keycap !text-[8px]">ESC</span> {depth > 1 ? "BACK" : "CLOSE"}
          </span>
          <button
            type="button"
            onClick={closeAll}
            aria-label="Close panel"
            className="grid h-8 w-8 place-items-center rounded-full border border-line text-muted transition-colors hover:border-accent hover:text-accent"
          >
            ✕
          </button>
        </header>
        <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto">
          <AppHost appId={top.appId} payload={top.payload} />
        </div>
      </section>
    </div>
  );
}
