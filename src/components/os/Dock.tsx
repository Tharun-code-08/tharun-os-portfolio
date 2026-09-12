"use client";

import { dockApps } from "@/lib/apps";
import { useOs } from "@/lib/os";
import { Icon } from "./Icon";

export function Dock() {
  const os = useOs();

  return (
    <nav
      aria-label="Applications"
      className="absolute bottom-5 left-1/2 z-[95] -translate-x-1/2"
    >
      <ul className="flex items-end gap-1 rounded-2xl border border-line bg-surface/85 px-2.5 py-2 shadow-[0_20px_60px_-25px_rgba(0,0,0,0.95)] backdrop-blur-xl">
        {dockApps.map((app) => {
          const open = os.wins.some((w) => w.appId === app.id);
          return (
            <li key={app.id} className="group relative">
              <button
                type="button"
                onClick={() => os.open(app.id)}
                aria-label={`${app.label} — ${app.hint}`}
                className="grid h-11 w-11 place-items-center rounded-xl border border-transparent text-muted transition-all duration-150 group-hover:-translate-y-1 group-hover:border-line group-hover:bg-surface-2 group-hover:text-accent"
              >
                <Icon name={app.icon} className="h-[18px] w-[18px]" />
              </button>

              <span
                className={`absolute -bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full transition-colors ${
                  open ? "bg-accent" : "bg-transparent"
                }`}
              />

              <span className="pointer-events-none absolute bottom-[calc(100%+10px)] left-1/2 -translate-x-1/2 scale-95 rounded-md border border-line bg-surface-2 px-2.5 py-1.5 opacity-0 shadow-lg transition-all duration-150 group-hover:scale-100 group-hover:opacity-100">
                <span className="block font-mono text-[10px] whitespace-nowrap tracking-[0.16em] text-ink uppercase">
                  {app.label}
                </span>
                <span className="block font-mono text-[9.5px] whitespace-nowrap text-faint">
                  {app.hint}
                </span>
              </span>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
