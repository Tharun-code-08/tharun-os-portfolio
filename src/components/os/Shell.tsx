"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { OsProvider, useOs } from "@/lib/os";
import { Boot } from "./Boot";
import { Desktop } from "./Desktop";
import { Dock } from "./Dock";
import { MenuBar } from "./MenuBar";
import { MobileShell } from "./MobileShell";
import { Window } from "./Window";
import { AppHost } from "./AppHost";
import { CommandPalette } from "./CommandPalette";
import { RecruiterMode } from "../modes/RecruiterMode";
import { Konami } from "./Konami";

const MOBILE_QUERY = "(max-width: 820px)";

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

  const openPalette = useCallback(() => setPalette(true), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      const typing =
        el?.tagName === "INPUT" || el?.tagName === "TEXTAREA" || el?.isContentEditable;

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPalette((p) => !p);
        return;
      }

      // Escape works even while a field is focused — the terminal autofocuses,
      // and being trapped in a window you cannot close is a bad first impression.
      if (e.key === "Escape") {
        if (palette) return; // the palette closes itself
        const top = os.wins.filter((w) => !w.minimized).sort((a, b) => b.z - a.z)[0];
        if (top) os.close(top.id);
        return;
      }

      if (typing || e.metaKey || e.ctrlKey || e.altKey) return;

      if (e.key.toLowerCase() === "r") {
        e.preventDefault();
        setRecruiter((r) => !r);
      }
      if (e.key === "/") {
        e.preventDefault();
        setPalette(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [os, palette]);

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
    <div className="scanlines relative h-dvh w-full overflow-hidden bg-bg">
      <div className="desktop-field absolute inset-0" aria-hidden />
      <div className="desktop-vignette absolute inset-0" aria-hidden />

      {booting ? <Boot onDone={() => setBooting(false)} /> : null}

      <MenuBar onCommand={openPalette} onRecruiterMode={() => setRecruiter(true)} />

      <Desktop />

      {os.wins.map((win) => (
        <Window key={win.id} win={win} topZ={topZ}>
          <AppHost appId={win.appId} payload={win.payload} />
        </Window>
      ))}

      <Dock />

      {palette ? <CommandPalette onClose={() => setPalette(false)} /> : null}
      <Konami />
    </div>
  );
}
