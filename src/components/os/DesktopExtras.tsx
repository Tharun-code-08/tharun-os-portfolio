"use client";

import { useEffect, useState } from "react";
import { APPS, type AppId } from "@/lib/apps";
import { useOs } from "@/lib/os";
import { setTheme, useTheme } from "@/lib/theme";
import { Icon } from "./Icon";

const DESKTOP_ICONS: AppId[] = ["work", "lab", "notes", "terminal"];

/**
 * Icons on the desktop itself. Single click selects, double click opens —
 * the convention people already have in their fingers.
 */
export function DesktopIcons() {
  const os = useOs();
  const [selected, setSelected] = useState<AppId | null>(null);

  const icons = DESKTOP_ICONS.filter((id) => APPS[id].available);

  return (
    <ul
      className="absolute top-[46px] left-3 z-10 hidden w-24 space-y-1 xl:block"
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) setSelected(null);
      }}
    >
      {icons.map((id) => {
        const app = APPS[id];
        const on = selected === id;
        return (
          <li key={id}>
            <button
              type="button"
              onClick={() => setSelected(id)}
              onDoubleClick={() => {
                os.open(id);
                setSelected(null);
              }}
              aria-label={`${app.label} — double click to open`}
              className={`flex w-full flex-col items-center gap-1.5 rounded-lg border px-2 py-2.5 transition-colors ${
                on ? "border-line bg-surface-2/80 backdrop-blur" : "border-transparent"
              }`}
            >
              <span
                className={`grid h-10 w-10 place-items-center rounded-lg border transition-colors ${
                  on ? "border-accent text-accent" : "border-line bg-surface/60 text-muted"
                }`}
              >
                <Icon name={app.icon} className="h-4 w-4" />
              </span>
              <span
                className={`text-center font-mono text-[9.5px] leading-tight tracking-[0.1em] uppercase ${
                  on ? "text-accent" : "text-faint"
                }`}
              >
                {app.label}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

type MenuState = { x: number; y: number } | null;

/** Right-click anywhere on the desktop. Every item here does something real. */
export function DesktopContextMenu({
  menu,
  onClose,
  onMissionControl,
}: {
  menu: MenuState;
  onClose: () => void;
  onMissionControl: () => void;
}) {
  const os = useOs();
  const theme = useTheme();

  useEffect(() => {
    if (!menu) return;
    const close = () => onClose();
    window.addEventListener("pointerdown", close);
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("pointerdown", close);
      window.removeEventListener("resize", close);
    };
  }, [menu, onClose]);

  if (!menu) return null;

  const items: { label: string; hint?: string; run: () => void; disabled?: boolean }[] = [
    { label: "Open Terminal", hint: "⌘5", run: () => os.open("terminal") },
    { label: "Mission Control", hint: "F2", run: onMissionControl },
    { label: "Settings", hint: "⌘,", run: () => os.open("settings") },
    {
      label: theme === "light" ? "Switch to Charcoal" : "Switch to Paper",
      run: () => setTheme(theme === "light" ? "dark" : "light"),
    },
    {
      label: `Close all windows${os.wins.length ? ` (${os.wins.length})` : ""}`,
      run: () => os.closeAll(),
      disabled: os.wins.length === 0,
    },
  ];

  // Keep the menu on screen when the click lands near an edge.
  const x = Math.min(menu.x, (typeof window !== "undefined" ? window.innerWidth : 1440) - 210);
  const y = Math.min(menu.y, (typeof window !== "undefined" ? window.innerHeight : 900) - 200);

  return (
    <div
      className="animate-win-in fixed z-[140] w-[196px] overflow-hidden rounded-lg border border-line bg-surface/95 py-1 shadow-2xl backdrop-blur-xl"
      style={{ left: x, top: y }}
      onPointerDown={(e) => e.stopPropagation()}
      role="menu"
    >
      {items.map((item) => (
        <button
          key={item.label}
          type="button"
          role="menuitem"
          disabled={item.disabled}
          onClick={() => {
            item.run();
            onClose();
          }}
          className="flex w-full items-center justify-between gap-4 px-3 py-1.5 text-left text-[12.5px] text-ink transition-colors hover:bg-surface-2 disabled:text-faint disabled:hover:bg-transparent"
        >
          {item.label}
          {item.hint ? <span className="font-mono text-[10px] text-faint">{item.hint}</span> : null}
        </button>
      ))}
    </div>
  );
}

/** The translucent panel that previews where a dragged window will land. */
export function SnapPreview({ zone }: { zone: "left" | "right" | "top" | null }) {
  if (!zone) return null;
  const base = "pointer-events-none fixed z-[85] rounded-lg border-2 border-accent/70 bg-accent/10";
  const style =
    zone === "left"
      ? { left: 12, top: 44, width: "calc(50% - 15px)", bottom: 100 }
      : zone === "right"
        ? { right: 12, top: 44, width: "calc(50% - 15px)", bottom: 100 }
        : { left: 12, right: 12, top: 44, bottom: 100 };
  return <div className={base} style={style} aria-hidden />;
}
