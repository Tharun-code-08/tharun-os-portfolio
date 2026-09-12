"use client";

import { useSyncExternalStore } from "react";

export const THEMES = ["dark", "light", "midnight"] as const;
export type Theme = (typeof THEMES)[number];

export const THEME_LABELS: Record<Theme, string> = {
  dark: "Charcoal",
  light: "Paper",
  midnight: "Midnight",
};

const KEY = "tharun-os-theme";
const EVENT = "tharun-os-theme-change";

/**
 * Inlined in <head> so the chosen theme is on <html> before first paint.
 * Without this the OS flashes charcoal on every load for paper users.
 */
export const THEME_BOOTSTRAP = `(function(){try{var t=localStorage.getItem(${JSON.stringify(
  KEY,
)});if(t==="light"||t==="midnight"||t==="dark"){document.documentElement.dataset.theme=t}}catch(e){}})()`;

export function getTheme(): Theme {
  if (typeof document === "undefined") return "dark";
  const t = document.documentElement.dataset.theme;
  return t === "light" || t === "midnight" ? t : "dark";
}

export function setTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem(KEY, theme);
  } catch {
    /* storage disabled — the choice just won't survive a reload. */
  }
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  return () => window.removeEventListener(EVENT, onChange);
}

export function useTheme(): Theme {
  return useSyncExternalStore(subscribe, getTheme, () => "dark" as Theme);
}
