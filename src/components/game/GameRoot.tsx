"use client";

import { useCallback, useEffect, useRef } from "react";
import { OsProvider, useOs } from "@/lib/os";
import { botSay } from "@/lib/bot";
import { duckMusic, setLevels, sfx, stopMusic, unlockAudio } from "@/game/audio";
import { clearKeys, installKeys } from "@/game/input";
import { guessQuality } from "@/game/quality";
import { emit, onGame, runtime } from "@/game/runtime";
import { canControl, useGame } from "@/game/store";
import { INTERACTABLE_BY_ID, type Interactable } from "@/game/zones";
import { RecruiterMode } from "../modes/RecruiterMode";
import { Konami } from "../os/Konami";
import { World } from "./World";
import { TitleScreen } from "./hud/TitleScreen";
import { HUD } from "./hud/HUD";
import { GamePanel } from "./hud/GamePanel";
import { Menus } from "./hud/Menus";
import { Toasts } from "./hud/Toasts";
import { Fade } from "./hud/Fade";
import { OsScreen } from "./hud/OsScreen";

/**
 * The game, top to bottom: the 3D world, then DOM layers over it.
 *
 * The zone panels run on their own OsProvider (not persisted), so every app
 * component from the OS — WORK, LAB, the case files — works here untouched.
 */
export default function GameRoot() {
  return (
    <OsProvider storageKey={null}>
      <Game />
    </OsProvider>
  );
}

function Game() {
  const os = useOs();
  const mode = useGame((s) => s.mode);
  const recruiter = useGame((s) => s.recruiter);
  const settings = useGame((s) => s.settings);
  const setPanelOpen = useGame((s) => s.setPanelOpen);

  // Detect a sensible quality once.
  useEffect(() => {
    useGame.getState().setAutoQuality(guessQuality());
  }, []);

  useEffect(() => installKeys(), []);
  // Leaving for the classic OS should not leave the music playing behind it.
  useEffect(() => () => stopMusic(), []);

  useEffect(() => setLevels(settings), [settings]);

  // Mirror the panel store into the game store so the 3D side can read it.
  const panelOpen = os.wins.length > 0;
  useEffect(() => {
    setPanelOpen(panelOpen);
    if (panelOpen) clearKeys();
  }, [panelOpen, setPanelOpen]);

  // Achievements that are about what you read, not where you walked.
  useEffect(() => {
    const g = useGame.getState();
    if (os.wins.some((w) => w.appId === "project")) g.unlock("reader");
    if (os.wins.some((w) => w.appId === "contact")) g.unlock("signal");
  }, [os.wins]);

  // The OS takes over the screen; the music steps back.
  useEffect(() => {
    if (mode === "os") {
      useGame.getState().unlock("root");
      duckMusic(true);
    } else duckMusic(false);
  }, [mode]);

  // Sounds for movement events from the controller.
  useEffect(
    () =>
      onGame((e) => {
        if (e.type === "footstep") sfx(`step-${e.surface}`);
        if (e.type === "jump") sfx("jump");
        if (e.type === "land") sfx("land");
      }),
    [],
  );

  // Every achievement gets its jingle.
  const count = useGame((s) => s.achievements.length);
  const prevCount = useRef(count);
  useEffect(() => {
    if (count > prevCount.current) {
      sfx("achievement");
      botSay("achievement");
    }
    prevCount.current = count;
  }, [count]);

  const finale = useGame((s) => s.overlay === "finale");
  useEffect(() => {
    if (finale) botSay("finale");
  }, [finale]);

  const run = useCallback(
    (it: Interactable) => {
      const g = useGame.getState();
      const a = it.action;
      if (a.kind === "app") {
        sfx("open");
        os.open(a.app, a.payload, a.title);
        return;
      }
      if (a.kind === "os") {
        sfx("whoosh");
        botSay("os:boot");
        g.setMode("os-enter");
        return;
      }
      if (a.kind === "recruiter") {
        sfx("open");
        botSay("recruiter");
        g.setRecruiter(true);
      }
    },
    [os],
  );

  const interact = useCallback(() => {
    const g = useGame.getState();
    if (!canControl(g) || !g.focus) return;
    const it = INTERACTABLE_BY_ID[g.focus];
    if (it) run(it);
  }, [run]);

  // Global keys. Movement keys are read by the controller; these are actions.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      const typing = el?.tagName === "INPUT" || el?.tagName === "TEXTAREA" || el?.isContentEditable;
      const g = useGame.getState();
      if (g.mode === "os" || g.mode === "os-enter" || g.mode === "title") return;
      if (g.recruiter) return; // RecruiterMode closes itself on Esc

      if (e.key === "Escape") {
        e.preventDefault();
        if (g.overlay === "settings" || g.overlay === "map" || g.overlay === "quests") {
          sfx("close");
          g.setOverlay(g.mode === "play" ? "pause" : null);
          return;
        }
        if (g.overlay) {
          sfx("close");
          g.setOverlay(null);
          return;
        }
        if (os.wins.length > 0) return; // GamePanel handles its own Esc
        if (g.mode === "play") {
          sfx("select");
          g.setOverlay("pause");
        }
        return;
      }
      if (typing || e.metaKey || e.ctrlKey || e.altKey) return;
      if (os.wins.length > 0) return;

      const k = e.key.toLowerCase();
      if ((k === "e" || e.key === "Enter") && !g.overlay) {
        e.preventDefault();
        interact();
      } else if (k === "m" && g.mode === "play") {
        sfx("select");
        g.setOverlay(g.overlay === "map" ? null : "map");
      } else if (k === "j" && g.mode === "play") {
        sfx("select");
        g.setOverlay(g.overlay === "quests" ? null : "quests");
      } else if (k === "r" && !g.overlay) {
        botSay("recruiter");
        g.setRecruiter(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [os, interact]);

  // Respawn sound + first gesture unlocks audio wherever it happens.
  useEffect(() => {
    const unlock = () => unlockAudio();
    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);

  const exitOs = useCallback(() => {
    sfx("whoosh");
    botSay("os:exit");
    useGame.getState().setMode("os-exit");
  }, []);

  const travel = useCallback((x: number, z: number) => {
    runtime.input.moveTarget = null;
    emit({ type: "teleport", x, z });
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden bg-[#0b0b14] text-[#f6efe2] select-none">
      <World />

      {mode === "title" ? <TitleScreen /> : null}
      {mode === "play" ? <HUD onInteract={interact} /> : null}
      {mode === "play" ? <GamePanel /> : null}
      <Menus onTravel={travel} />
      <Toasts />
      <Fade />
      <OsScreen onExit={exitOs} />

      {recruiter ? (
        <RecruiterMode
          onClose={() => {
            sfx("close");
            useGame.getState().setRecruiter(false);
          }}
        />
      ) : null}
      {mode !== "os" ? <Konami onUnlock={() => useGame.getState().unlock("konami")} /> : null}
    </div>
  );
}
