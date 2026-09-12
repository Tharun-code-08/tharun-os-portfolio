"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { OsProvider, SPACES, useOs, type SnapZone } from "@/lib/os";
import { botSay, exploreBias } from "@/lib/bot";
import { hasSkipped } from "@/lib/cinematic";
import { useLife } from "@/lib/life";
import type { AppId } from "@/lib/apps";
import { Boot } from "./Boot";
import { Desktop } from "./Desktop";
import { DesktopContextMenu, SnapPreview } from "./DesktopExtras";
import { Dock } from "./Dock";
import { MenuBar } from "./MenuBar";
import { MissionControl } from "./MissionControl";
import { DeveloperMode } from "./DeveloperMode";
import { MobileShell } from "./MobileShell";
import { Window } from "./Window";
import { AppHost } from "./AppHost";
import { CommandPalette } from "./CommandPalette";
import { RecruiterMode } from "../modes/RecruiterMode";
import { Konami } from "./Konami";

const MOBILE_QUERY = "(max-width: 820px)";

/** ⌘1 … ⌘5 */
const NUMBER_KEYS: AppId[] = ["work", "lab", "log", "now", "terminal"];

function subscribeToWidth(onChange: () => void) {
  const mq = window.matchMedia(MOBILE_QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

const noopSubscribe = () => () => {};

function alreadyBooted() {
  if (typeof window === "undefined") return false;
  try {
    return sessionStorage.getItem("tharun-os-booted") === "1";
  } catch {
    return false; // private mode — the sequence just runs again.
  }
}

export function Shell() {
  return (
    <OsProvider>
      <ShellInner />
    </OsProvider>
  );
}

function ShellInner() {
  const os = useOs();

  // The two shells are structurally different, so this is a real branch rather
  // than a CSS breakpoint. Both values are read through the store so the server
  // render is deterministic and hydration stays quiet.
  const mounted = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
  const isMobile = useSyncExternalStore(
    subscribeToWidth,
    () => window.matchMedia(MOBILE_QUERY).matches,
    () => false,
  );

  const [booting, setBooting] = useState(() => !alreadyBooted());
  const [palette, setPalette] = useState(false);
  const [recruiter, setRecruiter] = useState(false);
  const [mission, setMission] = useState(false);
  const [devMode, setDevMode] = useState(false);
  const [snapHint, setSnapHint] = useState<SnapZone | null>(null);
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
  const [skipped, setSkipped] = useState(() => hasSkipped());

  // The visitor always wins: the loop only runs on a clear, quiet desktop.
  const cinematicOn =
    !skipped && !booting && !recruiter && !devMode && !palette && !mission && os.wins.length === 0;
  // What the visitor has been reading nudges what he does next.
  const bias = exploreBias();
  const life = useLife(cinematicOn, bias);

  const openPalette = useCallback(() => setPalette(true), []);
  const openMission = useCallback(() => setMission(true), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      const typing = el?.tagName === "INPUT" || el?.tagName === "TEXTAREA" || el?.isContentEditable;
      const mod = e.metaKey || e.ctrlKey;
      const top = os.topWindow();

      if (mod && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPalette((p) => !p);
        return;
      }

      if (e.key === "F2") {
        e.preventDefault();
        setMission((m) => !m);
        return;
      }

      // ⌃1/⌃2/⌃3 switch desks — deliberately not ⌘, which opens apps.
      if (e.ctrlKey && !e.metaKey && /^[123]$/.test(e.key)) {
        e.preventDefault();
        os.setSpace(SPACES[Number(e.key) - 1].id);
        return;
      }

      // Window management works even while a field is focused — the terminal
      // autofocuses, and being trapped in a window you cannot close is a bad
      // first impression.
      if (e.key === "Escape") {
        if (palette || mission || menu) return; // those close themselves
        if (top) os.close(top.id);
        return;
      }

      if (mod && top) {
        const k = e.key.toLowerCase();
        if (k === "w") {
          e.preventDefault();
          os.close(top.id);
          return;
        }
        if (k === "m") {
          e.preventDefault();
          os.minimize(top.id);
          return;
        }
        if (e.key === "Enter") {
          e.preventDefault();
          os.toggleMax(top.id);
          return;
        }
        if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
          e.preventDefault();
          os.snap(top.id, e.key === "ArrowLeft" ? "left" : "right");
          return;
        }
      }

      if (mod && e.key === ",") {
        e.preventDefault();
        os.open("settings");
        return;
      }

      if (mod && /^[1-5]$/.test(e.key)) {
        e.preventDefault();
        os.open(NUMBER_KEYS[Number(e.key) - 1]);
        return;
      }

      if (typing || mod || e.altKey) return;

      if (e.key.toLowerCase() === "r") {
        e.preventDefault();
        setRecruiter((r) => {
          if (!r) botSay("recruiter");
          return !r;
        });
      }
      if (e.key.toLowerCase() === "d") {
        e.preventDefault();
        setDevMode((d) => {
          if (!d) botSay("devmode");
          return !d;
        });
      }
      if (e.key === "/") {
        e.preventDefault();
        setPalette(true);
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [os, palette, mission, menu]);

  if (!mounted) {
    return <div className="min-h-dvh bg-bg" aria-hidden />;
  }

  if (recruiter) {
    return <RecruiterMode onClose={() => setRecruiter(false)} />;
  }

  if (isMobile) {
    return (
      <>
        <MobileShell onRecruiterMode={() => setRecruiter(true)} />
        <Konami />
      </>
    );
  }

  const topZ = os.wins.reduce((max, w) => Math.max(max, w.z), 0);

  return (
    <div
      className="scanlines relative h-dvh w-full overflow-hidden bg-bg"
      onContextMenu={(e) => {
        // Only the desktop itself — right-clicking inside a window should still
        // give people their browser menu.
        if ((e.target as HTMLElement).closest("section[aria-label], nav, header")) return;
        e.preventDefault();
        setMenu({ x: e.clientX, y: e.clientY });
      }}
    >
      {booting ? <Boot onDone={() => setBooting(false)} /> : null}

      <MenuBar
        onCommand={openPalette}
        onRecruiterMode={() => setRecruiter(true)}
        onMissionControl={openMission}
      />

      <Desktop life={life} onSkip={() => setSkipped(true)} />

      {os.wins.map((win) => (
        <Window key={win.id} win={win} topZ={topZ} onSnapHint={setSnapHint}>
          <AppHost appId={win.appId} payload={win.payload} />
        </Window>
      ))}

      <SnapPreview zone={snapHint} />
      <Dock />

      {palette ? <CommandPalette onClose={() => setPalette(false)} /> : null}
      {mission ? <MissionControl onClose={() => setMission(false)} /> : null}
      {devMode ? <DeveloperMode onClose={() => setDevMode(false)} /> : null}
      <DesktopContextMenu
        menu={menu}
        onClose={() => setMenu(null)}
        onMissionControl={openMission}
      />
      <Konami />
    </div>
  );
}
