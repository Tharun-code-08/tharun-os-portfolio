"use client";

import { useEffect } from "react";
import { profile } from "@/data/profile";
import { launchableApps } from "@/lib/apps";
import { useOs } from "@/lib/os";
import { AppHost } from "./AppHost";
import { Icon } from "./Icon";

/**
 * Phones get the same identity, a different interaction model: no dragging and
 * no overlapping windows, just a command centre and full-screen sheets.
 *
 * Sheets are driven by the same window store as the desktop, so an app that
 * opens another app (WORK opening a case file) gets a back stack for free.
 */
export function MobileShell({
  onRecruiterMode,
  onExit,
  exitLabel = "ISLAND",
}: {
  onRecruiterMode: () => void;
  onExit?: () => void;
  exitLabel?: string;
}) {
  const os = useOs();
  const top = os.wins.filter((w) => !w.minimized).sort((a, b) => b.z - a.z)[0];

  useEffect(() => {
    document.body.style.overflow = top ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [top]);

  return (
    <div className="min-h-dvh bg-bg">
      <header className="flex h-[34px] items-center justify-between border-b border-line-soft px-4">
        <span className="flex items-center gap-3">
          {onExit ? (
            <button
              type="button"
              onClick={onExit}
              className="font-mono text-[9.5px] tracking-[0.16em] text-accent"
            >
              ⏻ {exitLabel}
            </button>
          ) : null}
          <span className="font-mono text-[10.5px] tracking-[0.22em] text-ink">{profile.os.name}</span>
        </span>
        <button
          type="button"
          onClick={onRecruiterMode}
          className="font-mono text-[9.5px] tracking-[0.16em] text-faint"
        >
          RECRUITER MODE
        </button>
      </header>

      <main className="px-5 pt-12 pb-16">
        <p className="mb-4 font-mono text-[10px] tracking-[0.26em] text-faint">
          {profile.name.toUpperCase()}
        </p>
        <h1 className="text-[clamp(2rem,10vw,2.9rem)] leading-[1.02] font-medium tracking-[-0.03em] text-ink">
          {profile.headline[0]}
          <br />
          <span className="text-faint">{profile.headline[1]}</span>
        </h1>
        <p className="mt-5 text-[13.5px] leading-relaxed text-muted">{profile.intro}</p>

        <p className="mt-7 flex items-center gap-2 font-mono text-[10px] tracking-[0.16em] text-muted">
          <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-accent" />
          {profile.status.state} · {profile.status.what.toUpperCase()}
        </p>

        <nav className="mt-11">
          <p className="mb-3 font-mono text-[9.5px] tracking-[0.24em] text-faint uppercase">
            Command centre
          </p>
          <ul className="overflow-hidden rounded-lg border border-line">
            {launchableApps.map((app) => (
              <li key={app.id} className="border-b border-line-soft last:border-0">
                <button
                  type="button"
                  onClick={() => os.open(app.id)}
                  className="flex w-full items-center gap-3.5 bg-surface px-4 py-3.5 text-left active:bg-surface-2"
                >
                  <Icon name={app.icon} className="h-[17px] w-[17px] shrink-0 text-accent" />
                  <span className="min-w-0 flex-1">
                    <span className="block font-mono text-[12px] tracking-[0.1em] text-ink uppercase">
                      {app.label}
                    </span>
                    <span className="block text-[11.5px] text-faint">{app.hint}</span>
                  </span>
                  <Icon name="arrow" className="h-3.5 w-3.5 shrink-0 text-faint" />
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <p className="mt-10 font-mono text-[10px] tracking-[0.14em] text-faint">
          {profile.tagline.toUpperCase()}
        </p>
      </main>

      {top ? (
        <div className="animate-win-in fixed inset-0 z-[120] flex flex-col bg-bg">
          <header className="flex h-12 shrink-0 items-center justify-between border-b border-line px-4">
            <p className="truncate font-mono text-[11px] tracking-[0.18em] text-ink">{top.title}</p>
            <button
              type="button"
              onClick={() => os.close(top.id)}
              aria-label="Close"
              className="grid h-8 w-8 shrink-0 place-items-center rounded-md border border-line text-muted active:bg-surface-2"
            >
              <Icon name="close" className="h-3.5 w-3.5" />
            </button>
          </header>
          <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto">
            <AppHost appId={top.appId} payload={top.payload} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
