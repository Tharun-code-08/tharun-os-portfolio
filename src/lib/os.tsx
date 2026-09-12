"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";
import { APPS, type AppId } from "@/lib/apps";
import { botSay, markOpened } from "@/lib/bot";

export type WinRect = { x: number; y: number; w: number; h: number };

export type SnapZone = "left" | "right" | "top";

export type Win = WinRect & {
  /** Instance id. Usually the app id, but detail views append a slug. */
  id: string;
  appId: AppId;
  title: string;
  z: number;
  minimized: boolean;
  maximized: boolean;
  restore?: WinRect;
  /** Extra data for the app, e.g. which project a detail view shows. */
  payload?: string;
};

type State = { wins: Win[]; z: number; cascade: number };

type Viewport = { w: number; h: number };

type Action =
  | { type: "open"; appId: AppId; payload?: string; title?: string; viewport: Viewport }
  | { type: "close"; id: string }
  | { type: "focus"; id: string }
  | { type: "move"; id: string; x: number; y: number }
  | { type: "resize"; id: string; w: number; h: number }
  | { type: "minimize"; id: string }
  | { type: "toggleMax"; id: string; viewport: Viewport }
  | { type: "snap"; id: string; zone: SnapZone; viewport: Viewport }
  | { type: "closeAll" }
  | { type: "restoreAll" };

const TOP_BAR = 34;
const DOCK_SPACE = 96;
const SESSION_KEY = "tharun-os-session-v1";

export function snapRect(zone: SnapZone, vp: Viewport): WinRect {
  const top = TOP_BAR + 10;
  const height = vp.h - TOP_BAR - DOCK_SPACE - 4;
  const half = Math.floor((vp.w - 30) / 2);
  if (zone === "left") return { x: 12, y: top, w: half, h: height };
  if (zone === "right") return { x: vp.w - half - 12, y: top, w: half, h: height };
  return { x: 12, y: top, w: vp.w - 24, h: height };
}

function clampRect(r: WinRect, vp: Viewport): WinRect {
  const w = Math.min(r.w, Math.max(360, vp.w - 32));
  const h = Math.min(r.h, Math.max(280, vp.h - TOP_BAR - DOCK_SPACE));
  return {
    w,
    h,
    x: Math.min(Math.max(16, r.x), Math.max(16, vp.w - w - 16)),
    y: Math.min(Math.max(TOP_BAR + 12, r.y), Math.max(TOP_BAR + 12, vp.h - h - DOCK_SPACE + 40)),
  };
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "open": {
      const id = action.payload ? `${action.appId}:${action.payload}` : action.appId;
      const existing = state.wins.find((w) => w.id === id);
      const z = state.z + 1;

      if (existing) {
        return {
          ...state,
          z,
          wins: state.wins.map((w) => (w.id === id ? { ...w, z, minimized: false } : w)),
        };
      }

      const app = APPS[action.appId];
      const step = state.cascade % 6;
      const base: WinRect = {
        w: app.size.w,
        h: app.size.h,
        x: Math.round((action.viewport.w - app.size.w) / 2) + step * 26 - 65,
        y: TOP_BAR + 28 + step * 22,
      };

      return {
        ...state,
        z,
        cascade: state.cascade + 1,
        wins: [
          ...state.wins,
          {
            id,
            appId: action.appId,
            title: action.title ?? app.title,
            ...clampRect(base, action.viewport),
            z,
            minimized: false,
            maximized: false,
            payload: action.payload,
          },
        ],
      };
    }

    case "close":
      return { ...state, wins: state.wins.filter((w) => w.id !== action.id) };

    case "closeAll":
      return { ...state, wins: [] };

    case "restoreAll":
      return { ...state, wins: state.wins.map((w) => ({ ...w, minimized: false })) };

    case "focus": {
      const z = state.z + 1;
      return {
        ...state,
        z,
        wins: state.wins.map((w) => (w.id === action.id ? { ...w, z, minimized: false } : w)),
      };
    }

    case "move":
      return {
        ...state,
        wins: state.wins.map((w) =>
          w.id === action.id ? { ...w, x: action.x, y: action.y, maximized: false } : w,
        ),
      };

    case "resize":
      return {
        ...state,
        wins: state.wins.map((w) =>
          w.id === action.id
            ? { ...w, w: Math.max(360, action.w), h: Math.max(240, action.h) }
            : w,
        ),
      };

    case "minimize":
      return {
        ...state,
        wins: state.wins.map((w) => (w.id === action.id ? { ...w, minimized: true } : w)),
      };

    case "snap": {
      const rect = snapRect(action.zone, action.viewport);
      return {
        ...state,
        wins: state.wins.map((w) => {
          if (w.id !== action.id) return w;
          return {
            ...w,
            restore: w.restore ?? { x: w.x, y: w.y, w: w.w, h: w.h },
            ...rect,
            maximized: action.zone === "top",
            minimized: false,
          };
        }),
      };
    }

    case "toggleMax": {
      const vp = action.viewport;
      return {
        ...state,
        wins: state.wins.map((w) => {
          if (w.id !== action.id) return w;
          if (w.maximized && w.restore) {
            return { ...w, ...w.restore, maximized: false, restore: undefined };
          }
          return {
            ...w,
            restore: { x: w.x, y: w.y, w: w.w, h: w.h },
            ...snapRect("top", vp),
            maximized: true,
          };
        }),
      };
    }
  }
}

/**
 * The workspace is restored the way you left it — move a window, refresh, and
 * it is still there. Read lazily so the server render stays deterministic.
 */
function initState(): State {
  const empty: State = { wins: [], z: 10, cascade: 0 };
  if (typeof window === "undefined") return empty;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return empty;
    const saved = JSON.parse(raw) as State;
    if (!Array.isArray(saved.wins)) return empty;
    // Drop anything pointing at an app that no longer exists or is unavailable.
    const wins = saved.wins.filter((w) => APPS[w.appId]?.available);
    return { wins, z: saved.z ?? 10, cascade: saved.cascade ?? 0 };
  } catch {
    return empty;
  }
}

type OsApi = {
  wins: Win[];
  open: (appId: AppId, payload?: string, title?: string) => void;
  close: (id: string) => void;
  closeAll: () => void;
  restoreAll: () => void;
  focus: (id: string) => void;
  move: (id: string, x: number, y: number) => void;
  resize: (id: string, w: number, h: number) => void;
  minimize: (id: string) => void;
  toggleMax: (id: string) => void;
  snap: (id: string, zone: SnapZone) => void;
  isOpen: (appId: AppId) => boolean;
  topWindow: () => Win | undefined;
};

const OsContext = createContext<OsApi | null>(null);

function viewport(): Viewport {
  if (typeof window === "undefined") return { w: 1440, h: 900 };
  return { w: window.innerWidth, h: window.innerHeight };
}

export function OsProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, initState);

  useEffect(() => {
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(state));
    } catch {
      /* storage disabled — the session simply is not remembered. */
    }
  }, [state]);

  const open = useCallback((appId: AppId, payload?: string, title?: string) => {
    dispatch({ type: "open", appId, payload, title, viewport: viewport() });
    // Let the character react to what the visitor just did.
    markOpened(appId);
    botSay(`open:${appId}`);
  }, []);

  const api = useMemo<OsApi>(
    () => ({
      wins: state.wins,
      open,
      close: (id) => dispatch({ type: "close", id }),
      closeAll: () => dispatch({ type: "closeAll" }),
      restoreAll: () => dispatch({ type: "restoreAll" }),
      focus: (id) => dispatch({ type: "focus", id }),
      move: (id, x, y) => dispatch({ type: "move", id, x, y }),
      resize: (id, w, h) => dispatch({ type: "resize", id, w, h }),
      minimize: (id) => dispatch({ type: "minimize", id }),
      toggleMax: (id) => dispatch({ type: "toggleMax", id, viewport: viewport() }),
      snap: (id, zone) => dispatch({ type: "snap", id, zone, viewport: viewport() }),
      isOpen: (appId) => state.wins.some((w) => w.appId === appId && !w.minimized),
      topWindow: () => state.wins.filter((w) => !w.minimized).sort((a, b) => b.z - a.z)[0],
    }),
    [state.wins, open],
  );

  return <OsContext.Provider value={api}>{children}</OsContext.Provider>;
}

export function useOs() {
  const ctx = useContext(OsContext);
  if (!ctx) throw new Error("useOs must be used inside <OsProvider>");
  return ctx;
}
