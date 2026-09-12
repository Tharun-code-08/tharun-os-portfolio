"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";
import { APPS, type AppId } from "./apps";

export type WinRect = { x: number; y: number; w: number; h: number };

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

type Action =
  | { type: "open"; appId: AppId; payload?: string; title?: string; viewport: { w: number; h: number } }
  | { type: "close"; id: string }
  | { type: "focus"; id: string }
  | { type: "move"; id: string; x: number; y: number }
  | { type: "resize"; id: string; w: number; h: number; x?: number; y?: number }
  | { type: "minimize"; id: string }
  | { type: "toggleMax"; id: string; viewport: { w: number; h: number } }
  | { type: "closeAll" };

const TOP_BAR = 34;
const DOCK_SPACE = 96;

function clampRect(r: WinRect, vp: { w: number; h: number }): WinRect {
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
            ? {
                ...w,
                w: Math.max(360, action.w),
                h: Math.max(240, action.h),
                x: action.x ?? w.x,
                y: action.y ?? w.y,
              }
            : w,
        ),
      };

    case "minimize":
      return {
        ...state,
        wins: state.wins.map((w) => (w.id === action.id ? { ...w, minimized: true } : w)),
      };

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
            x: 12,
            y: TOP_BAR + 10,
            w: vp.w - 24,
            h: vp.h - TOP_BAR - DOCK_SPACE - 4,
            maximized: true,
          };
        }),
      };
    }
  }
}

type OsApi = {
  wins: Win[];
  open: (appId: AppId, payload?: string, title?: string) => void;
  close: (id: string) => void;
  closeAll: () => void;
  focus: (id: string) => void;
  move: (id: string, x: number, y: number) => void;
  resize: (id: string, w: number, h: number) => void;
  minimize: (id: string) => void;
  toggleMax: (id: string) => void;
  isOpen: (appId: AppId) => boolean;
};

const OsContext = createContext<OsApi | null>(null);

function viewport() {
  if (typeof window === "undefined") return { w: 1440, h: 900 };
  return { w: window.innerWidth, h: window.innerHeight };
}

export function OsProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { wins: [], z: 10, cascade: 0 });

  const open = useCallback(
    (appId: AppId, payload?: string, title?: string) =>
      dispatch({ type: "open", appId, payload, title, viewport: viewport() }),
    [],
  );

  const api = useMemo<OsApi>(
    () => ({
      wins: state.wins,
      open,
      close: (id) => dispatch({ type: "close", id }),
      closeAll: () => dispatch({ type: "closeAll" }),
      focus: (id) => dispatch({ type: "focus", id }),
      move: (id, x, y) => dispatch({ type: "move", id, x, y }),
      resize: (id, w, h) => dispatch({ type: "resize", id, w, h }),
      minimize: (id) => dispatch({ type: "minimize", id }),
      toggleMax: (id) => dispatch({ type: "toggleMax", id, viewport: viewport() }),
      isOpen: (appId) => state.wins.some((w) => w.appId === appId && !w.minimized),
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
