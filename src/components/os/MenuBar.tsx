"use client";

import { useEffect, useState } from "react";
import { profile } from "@/data/profile";
import { useOs } from "@/lib/os";

export function MenuBar({
  onCommand,
  onRecruiterMode,
  onMissionControl,
}: {
  onCommand: () => void;
  onRecruiterMode: () => void;
  onMissionControl: () => void;
}) {
  const os = useOs();
  const [clock, setClock] = useState<string | null>(null);

  useEffect(() => {
    const tick = () =>
      setClock(
        new Date().toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
          timeZone: profile.timezone,
        }),
      );
    tick();
    const id = window.setInterval(tick, 20_000);
    return () => clearInterval(id);
  }, []);

  return (
    <header className="absolute inset-x-0 top-0 z-[90] flex h-[34px] items-center justify-between border-b border-line-soft bg-bg/80 px-3 backdrop-blur-md sm:px-4">
      <div className="flex min-w-0 items-center gap-3 sm:gap-5">
        <span className="font-mono text-[11px] tracking-[0.22em] text-ink">
          {profile.os.name}
        </span>
        <span className="hidden font-mono text-[10px] tracking-[0.14em] text-faint sm:inline">
          v{profile.os.version} · {profile.os.edition}
        </span>

        {os.wins.length > 0 ? (
          <button
            type="button"
            onClick={onMissionControl}
            title="Mission Control (F2)"
            className="hidden font-mono text-[10px] tracking-[0.14em] text-faint transition-colors hover:text-accent md:inline"
          >
            WINDOWS ({os.wins.length})
          </button>
        ) : null}
      </div>

      <div className="flex shrink-0 items-center gap-3 sm:gap-5">
        <span className="hidden items-center gap-2 font-mono text-[10px] tracking-[0.16em] text-muted lg:flex">
          <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-accent" />
          {profile.status.state} · {profile.status.what.toUpperCase()}
        </span>

        <button
          type="button"
          onClick={onRecruiterMode}
          title="A clean, scrollable, printable version of this site"
          className="font-mono text-[10px] tracking-[0.16em] text-faint transition-colors hover:text-accent"
        >
          RECRUITER MODE
        </button>

        <button
          type="button"
          onClick={onCommand}
          className="flex items-center gap-1.5 rounded border border-line px-2 py-1 font-mono text-[10px] tracking-[0.12em] text-faint transition-colors hover:border-muted hover:text-ink"
        >
          <span className="hidden sm:inline">SEARCH</span>
          <kbd className="font-mono">⌘K</kbd>
        </button>

        <time className="font-mono text-[10.5px] text-muted tabular-nums">{clock ?? "--:--"}</time>
      </div>
    </header>
  );
}
