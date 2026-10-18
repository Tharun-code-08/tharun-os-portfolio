"use client";

import { useGame } from "@/game/store";

/** A quick dip to black for respawns and fast travel. Keyed on its timestamp. */
export function Fade() {
  const at = useGame((s) => s.fadeAt);
  if (at < 0) return null;
  return <div key={at} className="animate-dip pointer-events-none absolute inset-0 z-[65] bg-[#05060c]" />;
}
