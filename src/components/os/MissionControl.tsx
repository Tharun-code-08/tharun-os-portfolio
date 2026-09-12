"use client";

import { useEffect } from "react";
import { APPS } from "@/lib/apps";
import { useOs } from "@/lib/os";
import { Icon } from "./Icon";

/**
 * Every open window at once. Cards rather than scaled clones — a live clone of
 * a scrolled window reads as a rendering bug at thumbnail size.
 */
export function MissionControl({ onClose }: { onClose: () => void }) {
  const os = useOs();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "F2") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const wins = [...os.wins].sort((a, b) => b.z - a.z);

  return (
    <div
      className="fixed inset-0 z-[170] bg-bg/92 px-8 pt-16 pb-10 backdrop-blur-xl"
      onClick={onClose}
      role="presentation"
    >
      <div className="mx-auto max-w-4xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-7 flex items-baseline justify-between">
          <p className="font-mono text-[10px] tracking-[0.26em] text-accent">MISSION CONTROL</p>
          <p className="font-mono text-[10px] tracking-[0.16em] text-faint">
            {wins.length} OPEN · ESC TO CLOSE
          </p>
        </div>

        {wins.length === 0 ? (
          <div className="rounded-lg border border-dashed border-line px-6 py-16 text-center">
            <p className="font-mono text-[11px] tracking-[0.2em] text-faint uppercase">
              Nothing open
            </p>
            <p className="mx-auto mt-3 max-w-sm text-[13px] text-muted">
              Launch something from the dock, or press ⌘K.
            </p>
          </div>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {wins.map((w) => (
              <li key={w.id}>
                <button
                  type="button"
                  onClick={() => {
                    os.focus(w.id);
                    onClose();
                  }}
                  className="group w-full overflow-hidden rounded-lg border border-line bg-surface text-left transition-colors hover:border-accent"
                >
                  <span className="flex items-center gap-2 border-b border-line-soft bg-surface-2 px-3 py-2">
                    <Icon
                      name={APPS[w.appId].icon}
                      className="h-3.5 w-3.5 shrink-0 text-faint transition-colors group-hover:text-accent"
                    />
                    <span className="truncate font-mono text-[10.5px] tracking-[0.14em] text-ink">
                      {w.title}
                    </span>
                  </span>
                  <span className="block px-3 py-4">
                    <span className="block text-[12.5px] text-muted">{APPS[w.appId].hint}</span>
                    <span className="mt-2 flex items-center gap-2 font-mono text-[9.5px] tracking-[0.16em] text-faint uppercase">
                      {w.minimized ? "Minimised" : w.maximized ? "Maximised" : "Open"}
                      <span className="text-line">·</span>
                      {Math.round(w.w)}×{Math.round(w.h)}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}

        {wins.length > 0 ? (
          <div className="mt-7 flex gap-2">
            <button
              type="button"
              onClick={() => {
                os.restoreAll();
                onClose();
              }}
              className="rounded-md border border-line px-3.5 py-2 font-mono text-[10.5px] tracking-[0.14em] text-muted transition-colors hover:border-accent hover:text-accent"
            >
              RESTORE ALL
            </button>
            <button
              type="button"
              onClick={() => {
                os.closeAll();
                onClose();
              }}
              className="rounded-md border border-line px-3.5 py-2 font-mono text-[10.5px] tracking-[0.14em] text-muted transition-colors hover:border-accent hover:text-accent"
            >
              CLOSE ALL
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
