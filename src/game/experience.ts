"use client";

/**
 * Game or classic OS, as a tiny external store — so switching between them is
 * a re-render, not a page reload, and the URL still says which one you are in
 * (?classic=1 / ?play=1) for anyone who shares the link.
 */

export type Experience = "pending" | "game" | "classic";

let current: Experience | null = null;
const listeners = new Set<() => void>();

function hasWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

function decide(): Experience {
  const q = new URLSearchParams(window.location.search);
  if (q.has("classic")) return "classic";
  if (q.has("play")) return "game";
  // Reduced motion and no WebGL both get the classic OS — the same content,
  // without a camera flying around.
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return "classic";
  if (!hasWebGL()) return "classic";
  return "game";
}

export function readExperience(): Experience {
  return (current ??= decide());
}

export function subscribeExperience(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

export function switchExperience(next: Exclude<Experience, "pending">) {
  current = next;
  const url = new URL(window.location.href);
  url.searchParams.delete("classic");
  url.searchParams.delete("play");
  url.searchParams.set(next === "classic" ? "classic" : "play", "1");
  window.history.replaceState(null, "", url);
  listeners.forEach((l) => l());
}
