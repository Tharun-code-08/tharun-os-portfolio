"use client";

import { useEffect, useState } from "react";
import { profile } from "@/data/profile";
import { SPACES, useOs } from "@/lib/os";

export function MenuBar({
  onCommand,
  onRecruiterMode,
  onMissionControl,
  onExit,
  exitLabel = "BACK TO THE ISLAND",
}: {
  onCommand: () => void;
  onRecruiterMode: () => void;
  onMissionControl: () => void;
  onExit?: () => void;
  exitLabel?: string;
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
        {onExit ? (
          <button
            type="button"
            onClick={onExit}
            title="Log off (Esc on an empty desk)"
            className="flex items-center gap-1.5 rounded border border-accent/40 bg-accent/10 px-2 py-0.5 font-mono text-[10px] tracking-[0.14em] text-accent transition-colors hover:bg-accent hover:text-accent-ink"
          >
            <span aria-hidden>⏻</span>
            {exitLabel}
          </button>
        ) : null}
        <span className="font-mono text-[11px] tracking-[0.22em] text-ink">
          {profile.os.name}
        </span>
        <span className="hidden font-mono text-[10px] tracking-[0.14em] text-faint sm:inline">
          v{profile.os.version} · {profile.os.edition}
        </span>

        <nav aria-label="Desks" className="hidden items-center gap-0.5 md:flex">
          {SPACES.map((s, i) => {
            const on = s.id === os.space;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => os.setSpace(s.id)}
                title={`${s.hint}  ·  Ctrl+${i + 1}`}
                aria-pressed={on}
                className={`rounded px-2 py-0.5 font-mono text-[10px] tracking-[0.14em] transition-colors ${
                  on ? "bg-accent/15 text-accent" : "text-faint hover:text-ink"
                }`}
              >
                {s.label.toUpperCase()}
              </button>
            );
          })}
        </nav>

        {os.wins.length > 0 ? (
          <button
            type="button"
            onClick={onMissionControl}
            title="Mission Control (F2)"
            className="hidden font-mono text-[10px] tracking-[0.14em] text-faint transition-colors hover:text-accent lg:inline"
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
