"use client";

import { useEffect } from "react";
import { useOs } from "@/lib/os";
import { setTheme, useTheme } from "@/lib/theme";

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
