"use client";

import { useState } from "react";
import { profile } from "@/data/profile";
import { buildLog } from "@/data/journal";
import { now } from "@/data/profile";
import { sites } from "@/data/sites";
import { launchableApps } from "@/lib/apps";
import { useOs } from "@/lib/os";
import { Icon } from "./Icon";
import { Scene } from "./Scene";

export function Desktop() {
  const os = useOs();
  const latest = [...buildLog].sort((a, b) => b.date.localeCompare(a.date))[0];
  const [transmission, setTransmission] = useState(true);

  return (
    <>
      {/* Wallpaper. Pointer-events off so the icons and windows own every click. */}
      <div className="pointer-events-none absolute inset-0 top-[34px] z-0 overflow-hidden">
        <Scene className="h-full w-full" />
        {/* Dark where the icons and type sit, clear over the window and the
            character — so the room stays vivid and the text stays readable. */}
        <div className="absolute inset-0 bg-gradient-to-r from-bg/88 via-bg/55 to-bg/10" />
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-bg/75 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-bg/80 to-transparent" />
      </div>

      <div className="scrollbar-thin absolute inset-x-0 top-[34px] bottom-0 z-10 overflow-y-auto">
        <div className="flex min-h-full flex-col px-5 pt-5 pb-28">
          <div className="flex w-full max-w-[62%] flex-col">
            <header className="animate-fade-up mb-5">
              <p className="mb-1.5 font-mono text-[10px] tracking-[0.3em] text-ink/70">
                {profile.name.toUpperCase()}
              </p>
              <h1 className="text-[clamp(1.5rem,2.6vw,2.2rem)] leading-[1.05] font-medium tracking-[-0.02em] text-ink drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]">
                {profile.headline[0]} <span className="text-ink/55">{profile.headline[1]}</span>
              </h1>
              <p className="mt-2.5 flex items-center gap-2 font-mono text-[10px] tracking-[0.16em] text-accent">
                <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-accent" />
                {profile.status.state} · {profile.status.what.toUpperCase()}
              </p>
            </header>

            <ul
              className="animate-fade-up grid grid-cols-3 gap-x-2 gap-y-1 sm:grid-cols-4 lg:grid-cols-5 2xl:grid-cols-6"
              style={{ animationDelay: "120ms" }}
            >
              {launchableApps.map((app) => (
                <li key={app.id}>
                  <DesktopIcon
                    label={app.label}
                    hint={app.hint}
                    icon={app.icon}
                    onOpen={() => os.open(app.id)}
                  />
                </li>
              ))}
            </ul>

            <p
              className="animate-fade-up mt-6 font-mono text-[9.5px] tracking-[0.18em] text-ink/45"
              style={{ animationDelay: "260ms" }}
            >
              DOUBLE-CLICK TO OPEN · ⌘K TO SEARCH · RIGHT-CLICK THE ROOM · R FOR RECRUITER MODE
            </p>
          </div>
        </div>
      </div>

      {transmission ? (
        <aside
          className="animate-fade-up absolute top-[46px] right-4 z-20 hidden w-[19rem] overflow-hidden rounded-lg border border-line bg-surface/95 shadow-2xl backdrop-blur-xl lg:block"
          style={{ animationDelay: "340ms" }}
        >
          <header className="flex items-center justify-between border-b border-line bg-surface-2 px-3 py-2">
            <p className="font-mono text-[9.5px] tracking-[0.22em] text-accent">
              DAILY TRANSMISSION
            </p>
            <button
              type="button"
              onClick={() => setTransmission(false)}
              aria-label="Dismiss"
              className="text-faint transition-colors hover:text-ink"
            >
              <Icon name="close" className="h-3 w-3" />
            </button>
          </header>

          <div className="px-4 py-4">
            <p className="mb-2 font-mono text-[9.5px] tracking-[0.18em] text-faint">
              {new Date(latest.date)
                .toLocaleDateString("en-GB", { day: "2-digit", month: "short" })
                .toUpperCase()}{" "}
              · {latest.kind}
            </p>
            <p className="text-[15px] leading-snug font-medium text-ink">{latest.title}</p>
            {latest.detail ? (
              <p className="mt-2 text-[12px] leading-relaxed text-muted">{latest.detail}</p>
            ) : null}

            <p className="mt-4 mb-1.5 font-mono text-[9px] tracking-[0.2em] text-faint uppercase">
              Next
            </p>
            <p className="text-[12px] leading-relaxed text-muted">{now.thinkingAbout[0]}</p>

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => os.open("log")}
                className="flex-1 rounded border border-line bg-surface-2 px-2.5 py-1.5 font-mono text-[9.5px] tracking-[0.12em] text-ink transition-colors hover:border-accent hover:text-accent"
              >
                BUILD LOG
              </button>
              <button
                type="button"
                onClick={() => os.open("browser", sites[1].id, "BROWSER")}
                className="flex-1 rounded border border-line px-2.5 py-1.5 font-mono text-[9.5px] tracking-[0.12em] text-muted transition-colors hover:border-accent hover:text-accent"
              >
                SEE IT LIVE
              </button>
            </div>
          </div>
        </aside>
      ) : null}
    </>
  );
}

function DesktopIcon({
  label,
  hint,
  icon,
  onOpen,
}: {
  label: string;
  hint: string;
  icon: Parameters<typeof Icon>[0]["name"];
  onOpen: () => void;
}) {
  const [selected, setSelected] = useState(false);

  return (
    <button
      type="button"
      onClick={() => setSelected(true)}
      onDoubleClick={onOpen}
      onBlur={() => setSelected(false)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
      aria-label={`${label} — ${hint}`}
      className={`group flex w-full flex-col items-center gap-1.5 rounded-lg border px-1.5 py-2.5 text-center transition-colors ${
        selected ? "border-accent/60 bg-surface/80 backdrop-blur" : "border-transparent hover:bg-surface/40"
      }`}
    >
      <span
        className={`grid h-11 w-11 place-items-center rounded-[10px] border shadow-[0_4px_14px_-6px_rgba(0,0,0,0.8)] transition-colors ${
          selected
            ? "border-accent bg-surface-2 text-accent"
            : "border-line bg-surface-2/90 text-muted group-hover:text-accent"
        }`}
      >
        <Icon name={icon} className="h-[18px] w-[18px]" />
      </span>

      <span
        className={`rounded px-1.5 py-0.5 font-mono text-[9px] leading-tight tracking-[0.1em] uppercase ${
          selected ? "bg-accent text-accent-ink" : "bg-bg/60 text-ink"
        }`}
      >
        {label}
      </span>
      <span className="line-clamp-2 font-mono text-[8.5px] leading-tight text-ink/50">{hint}</span>
    </button>
  );
}
