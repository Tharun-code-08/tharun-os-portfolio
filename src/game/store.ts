"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { ACHIEVEMENT_BY_ID, EXPLORABLE, MAIN_ACHIEVEMENTS, type AchievementId } from "./quests";
import { COMMITS, TIMELINE_STONES, ZONE_BY_ID, type ZoneId } from "./zones";

/**
 * The game's state machine and save file.
 *
 *   title → intro → play ⇄ os-enter → os → os-exit → play
 *
 * Panels (zone apps) and overlays (pause, map, quests) sit on top of `play`
 * rather than being modes of their own, so closing one always lands you back
 * exactly where you were standing.
 */

export type Mode = "title" | "intro" | "play" | "os-enter" | "os" | "os-exit";
export type Overlay = null | "pause" | "map" | "quests" | "settings" | "finale";
export type Quality = "low" | "medium" | "high";
export type TimeOfDay = "auto" | "dawn" | "day" | "dusk" | "night";

export type Settings = {
  quality: "auto" | Quality;
  timeOfDay: TimeOfDay;
  music: number;
  sfx: number;
  muted: boolean;
  showFps: boolean;
};

export type Toast = {
  id: number;
  kind: "achievement" | "commit" | "info";
  title: string;
  detail?: string;
};

type Banner = { title: string; tag: string; color: string; at: number };

type GameState = {
  mode: Mode;
  /** performance.now() when the mode last changed — scripted shots key off it. */
  modeAt: number;
  overlay: Overlay;
  recruiter: boolean;
  /** A zone app is open on top of the world. Mirrors the panel OS store. */
  panelOpen: boolean;
  /** Interactable currently in reach. */
  focus: string | null;
  /** The place the player is standing in. */
  zone: ZoneId | null;
  banner: Banner | null;
  toasts: Toast[];
  /** Quality picked by detection / the performance monitor when set to auto. */
  autoQuality: Quality;
  /** Dims the screen for respawns and teleports. */
  fadeAt: number;

  // --- saved -----------------------------------------------------------
  started: boolean;
  visited: ZoneId[];
  collected: string[];
  stonesLit: number[];
  achievements: AchievementId[];
  finaleSeen: boolean;
  settings: Settings;

  // --- actions ---------------------------------------------------------
  setMode: (mode: Mode) => void;
  setOverlay: (overlay: Overlay) => void;
  setRecruiter: (on: boolean) => void;
  setPanelOpen: (on: boolean) => void;
  setFocus: (id: string | null) => void;
  enterZone: (id: ZoneId) => void;
  leaveZone: (id: ZoneId) => void;
  unlock: (id: AchievementId) => void;
  collect: (id: string) => void;
  lightStone: (index: number) => void;
  pushToast: (t: Omit<Toast, "id">) => void;
  dropToast: (id: number) => void;
  setSettings: (patch: Partial<Settings>) => void;
  setAutoQuality: (q: Quality) => void;
  fade: () => void;
  resetProgress: () => void;
};

let toastId = 1;

const DEFAULT_SETTINGS: Settings = {
  quality: "auto",
  timeOfDay: "auto",
  music: 0.55,
  sfx: 0.8,
  muted: false,
  showFps: false,
};

export const useGame = create<GameState>()(
  persist(
    (set, get) => ({
      mode: "title",
      modeAt: 0,
      overlay: null,
      recruiter: false,
      panelOpen: false,
      focus: null,
      zone: null,
      banner: null,
      toasts: [],
      autoQuality: "medium",
      fadeAt: -10_000,

      started: false,
      visited: [],
      collected: [],
      stonesLit: [],
      achievements: [],
      finaleSeen: false,
      settings: DEFAULT_SETTINGS,

      setMode: (mode) => set({ mode, modeAt: performance.now(), ...(mode === "play" ? { started: true } : {}) }),
      setOverlay: (overlay) => set({ overlay }),
      setRecruiter: (recruiter) => set({ recruiter }),
      setPanelOpen: (panelOpen) => set({ panelOpen }),
      setFocus: (focus) => (get().focus === focus ? undefined : set({ focus })),

      enterZone: (id) => {
        const zone = ZONE_BY_ID[id];
        const s = get();
        const first = !s.visited.includes(id);
        set({
          zone: id,
          banner: s.zone === id ? s.banner : { title: zone.name, tag: zone.tag, color: zone.color, at: performance.now() },
          visited: first ? [...s.visited, id] : s.visited,
        });
        if (first && EXPLORABLE.every((z) => get().visited.includes(z))) get().unlock("explorer");
      },

      leaveZone: (id) => {
        if (get().zone === id) set({ zone: null });
      },

      unlock: (id) => {
        const s = get();
        if (s.achievements.includes(id)) return;
        const a = ACHIEVEMENT_BY_ID[id];
        set({ achievements: [...s.achievements, id] });
        get().pushToast({ kind: "achievement", title: a.title, detail: a.detail });
        const done = MAIN_ACHIEVEMENTS.every((m) => get().achievements.includes(m.id));
        if (done && !get().finaleSeen) {
          // Let the last toast land before the curtain call.
          window.setTimeout(() => set({ overlay: "finale", finaleSeen: true }), 2600);
        }
      },

      collect: (id) => {
        const s = get();
        if (s.collected.includes(id)) return;
        const commit = COMMITS.find((c) => c.id === id);
        const collected = [...s.collected, id];
        set({ collected });
        if (commit) {
          get().pushToast({
            kind: "commit",
            title: `commit ${commit.hash} · ${collected.length}/${COMMITS.length}`,
            detail: `${commit.entry.date.slice(0, 7)} — ${commit.entry.title}`,
          });
        }
        if (collected.length === COMMITS.length) get().unlock("collector");
      },

      lightStone: (index) => {
        const s = get();
        if (s.stonesLit.includes(index)) return;
        const stonesLit = [...s.stonesLit, index];
        set({ stonesLit });
        if (stonesLit.length === TIMELINE_STONES.length) get().unlock("historian");
      },

      pushToast: (t) => set({ toasts: [...get().toasts.slice(-3), { ...t, id: toastId++ }] }),
      dropToast: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
      setSettings: (patch) => set({ settings: { ...get().settings, ...patch } }),
      setAutoQuality: (autoQuality) => set({ autoQuality }),
      fade: () => set({ fadeAt: performance.now() }),
      resetProgress: () =>
        set({ started: false, visited: [], collected: [], stonesLit: [], achievements: [], finaleSeen: false }),
    }),
    {
      name: "tharun-game-v1",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        started: s.started,
        visited: s.visited,
        collected: s.collected,
        stonesLit: s.stonesLit,
        achievements: s.achievements,
        finaleSeen: s.finaleSeen,
        settings: s.settings,
      }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<GameState>;
        return { ...current, ...p, settings: { ...DEFAULT_SETTINGS, ...(p.settings ?? {}) } };
      },
    },
  ),
);

/** Whether the player may move: in play, with nothing on top of the world. */
export function canControl(s: Pick<GameState, "mode" | "overlay" | "recruiter" | "panelOpen">) {
  return s.mode === "play" && !s.overlay && !s.recruiter && !s.panelOpen;
}

export function effectiveQuality(s: Pick<GameState, "settings" | "autoQuality">): Quality {
  return s.settings.quality === "auto" ? s.autoQuality : s.settings.quality;
}

/** Progress toward 100%, counting only the non-secret achievements. */
export function completion(achievements: AchievementId[]) {
  const done = MAIN_ACHIEVEMENTS.filter((a) => achievements.includes(a.id)).length;
  return { done, total: MAIN_ACHIEVEMENTS.length };
}
