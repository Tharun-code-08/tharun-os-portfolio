"use client";

import { useCallback, useRef, type ReactNode } from "react";
import { useOs, type SnapZone, type Win } from "@/lib/os";
import { Icon } from "./Icon";

const TOP_BAR = 34;
const EDGE = 16;

/** Which half of the screen a drag is currently hovering, if any. */
function zoneFor(x: number, y: number): SnapZone | null {
  if (y <= TOP_BAR + 8) return "top";
  if (x <= EDGE) return "left";
  if (x >= window.innerWidth - EDGE) return "right";
  return null;
}

export function Window({
  win,
  topZ,
  onSnapHint,
  children,
}: {
  win: Win;
  topZ: number;
  onSnapHint: (zone: SnapZone | null) => void;
  children: ReactNode;
}) {
  const os = useOs();
  const drag = useRef<{ dx: number; dy: number } | null>(null);
  const zone = useRef<SnapZone | null>(null);
  const size = useRef<{ x: number; y: number; w: number; h: number } | null>(null);
  const focused = win.z === topZ;

  const onTitlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if ((e.target as HTMLElement).closest("[data-no-drag]")) return;
      os.focus(win.id);
      drag.current = { dx: e.clientX - win.x, dy: e.clientY - win.y };
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    },
    [os, win.id, win.x, win.y],
  );

  const onTitlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!drag.current) return;
      const x = e.clientX - drag.current.dx;
      const y = Math.max(TOP_BAR + 2, e.clientY - drag.current.dy);
      os.move(win.id, x, y);

      const next = zoneFor(e.clientX, e.clientY);
      if (next !== zone.current) {
        zone.current = next;
        onSnapHint(next);
      }
    },
    [os, win.id, onSnapHint],
  );

  const endDrag = useCallback(() => {
    if (!drag.current) return;
    drag.current = null;
    if (zone.current) os.snap(win.id, zone.current);
    zone.current = null;
    onSnapHint(null);
  }, [os, win.id, onSnapHint]);

  const onResizePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.stopPropagation();
      os.focus(win.id);
      size.current = { x: e.clientX, y: e.clientY, w: win.w, h: win.h };
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    },
    [os, win.id, win.w, win.h],
  );

  const onResizePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!size.current) return;
      os.resize(
        win.id,
        size.current.w + (e.clientX - size.current.x),
        size.current.h + (e.clientY - size.current.y),
      );
    },
    [os, win.id],
  );

  if (win.minimized) return null;

  return (
    <section
      className={`animate-win-in absolute flex flex-col overflow-hidden rounded-[10px] border bg-surface shadow-2xl transition-[box-shadow,border-color] duration-200 ${
        focused
          ? "border-line shadow-[0_28px_80px_-20px_rgba(0,0,0,0.9)]"
          : "border-line-soft shadow-[0_18px_50px_-24px_rgba(0,0,0,0.8)]"
      }`}
      style={{ left: win.x, top: win.y, width: win.w, height: win.h, zIndex: win.z }}
      onPointerDown={() => os.focus(win.id)}
      aria-label={win.title}
    >
      <header
        className={`flex h-9 shrink-0 cursor-grab touch-none items-center gap-2 border-b px-3 select-none active:cursor-grabbing ${
          focused ? "border-line bg-surface-2" : "border-line-soft bg-surface"
        }`}
        onPointerDown={onTitlePointerDown}
        onPointerMove={onTitlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onDoubleClick={() => os.toggleMax(win.id)}
      >
        <div className="flex items-center gap-1.5" data-no-drag>
          <WinDot label="Close" onClick={() => os.close(win.id)} tone="close" icon="close" />
          <WinDot label="Minimise" onClick={() => os.minimize(win.id)} tone="idle" icon="min" />
          <WinDot label="Maximise" onClick={() => os.toggleMax(win.id)} tone="idle" icon="max" />
        </div>

        <p
          className={`ml-1 truncate font-mono text-[11px] tracking-[0.16em] ${
            focused ? "text-ink" : "text-faint"
          }`}
        >
          {win.title}
        </p>
      </header>

      <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto">{children}</div>

      <button
        type="button"
        aria-label="Resize window"
        onPointerDown={onResizePointerDown}
        onPointerMove={onResizePointerMove}
        onPointerUp={() => (size.current = null)}
        className="absolute right-0 bottom-0 h-4 w-4 cursor-nwse-resize touch-none"
      >
        <svg viewBox="0 0 16 16" className="h-full w-full text-line" aria-hidden="true">
          <path d="M15 7 7 15M15 12l-3 3" stroke="currentColor" strokeWidth="1.25" fill="none" />
        </svg>
      </button>
    </section>
  );
}

function WinDot({
  label,
  onClick,
  tone,
  icon,
}: {
  label: string;
  onClick: () => void;
  tone: "close" | "idle";
  icon: "close" | "min" | "max";
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={`group grid h-3 w-3 place-items-center rounded-full border transition-colors ${
        tone === "close"
          ? "border-line bg-raised hover:border-accent hover:bg-accent"
          : "border-line bg-raised hover:border-muted hover:bg-line"
      }`}
    >
      <Icon
        name={icon}
        strokeWidth={3}
        className={`h-2 w-2 opacity-0 transition-opacity group-hover:opacity-100 ${
          tone === "close" ? "text-accent-ink" : "text-ink"
        }`}
      />
    </button>
  );
}
