"use client";

import { useEffect, useMemo, useState } from "react";
import { useProgress } from "@react-three/drei";
import { profile } from "@/data/profile";
import { sfx, unlockAudio } from "@/game/audio";
import { switchExperience } from "@/game/experience";
import { isTouchDevice } from "@/game/quality";
import { completion, useGame } from "@/game/store";

type Item = { id: string; label: string; hint: string; run: () => void };

/**
 * PRESS ANY KEY, then a menu. The island orbits behind it the whole time, so
 * the first thing anyone sees is the world, not a loading bar.
 */
export function TitleScreen() {
  const { progress, active } = useProgress();
  const ready = !active || progress >= 100;
  const started = useGame((s) => s.started);
  const achievements = useGame((s) => s.achievements);
  const [phase, setPhase] = useState<"press" | "menu">("press");
  const [index, setIndex] = useState(0);
  const touch = useMemo(() => isTouchDevice(), []);
  const { done, total } = completion(achievements);

  const items = useMemo<Item[]>(() => {
    const g = useGame.getState;
    const play = () => {
      sfx("start");
      g().setMode("intro");
    };
    const list: Item[] = [
      { id: "play", label: started ? "Continue" : "Start", hint: started ? `${done}/${total} complete` : "Walk the island", run: play },
      {
        id: "recruiter",
        label: "Recruiter mode",
        hint: "The one-page version",
        run: () => {
          sfx("open");
          g().setRecruiter(true);
        },
      },
      {
        id: "classic",
        label: "Classic OS",
        hint: "Skip the game",
        run: () => switchExperience("classic"),
      },
      {
        id: "settings",
        label: "Settings",
        hint: "Sound, quality, time of day",
        run: () => {
          sfx("select");
          g().setOverlay("settings");
        },
      },
    ];
    if (started) {
      list.push({
        id: "new",
        label: "New game",
        hint: "Forget everything you found",
        run: () => {
          g().resetProgress();
          play();
        },
      });
    }
    return list;
  }, [started, done, total]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (useGame.getState().overlay || useGame.getState().recruiter) return;
      if (phase === "press") {
        if (!ready) return;
        unlockAudio();
        sfx("select");
        setPhase("menu");
        return;
      }
      if (e.key === "ArrowDown" || e.key.toLowerCase() === "s") {
        e.preventDefault();
        sfx("hover");
        setIndex((i) => (i + 1) % items.length);
      } else if (e.key === "ArrowUp" || e.key.toLowerCase() === "w") {
        e.preventDefault();
        sfx("hover");
        setIndex((i) => (i - 1 + items.length) % items.length);
      } else if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        items[index]?.run();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, ready, items, index]);

  return (
    <div
      className="absolute inset-0 z-30 flex flex-col"
      onPointerDown={() => {
        if (phase === "press" && ready) {
          unlockAudio();
          sfx("select");
          setPhase("menu");
        }
      }}
    >
      {/* Legibility wash: dark on the left where the type sits. */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#07070f]/85 via-[#07070f]/35 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#07070f]/80 to-transparent" />

      <header className="relative flex items-center justify-between px-6 pt-5 sm:px-10">
        <p className="font-mono text-[10px] tracking-[0.32em] text-white/55">{profile.os.name} PRESENTS</p>
        <p className="hidden font-mono text-[10px] tracking-[0.24em] text-white/40 sm:block">
          BEST WITH SOUND ♪
        </p>
      </header>

      <main className="relative flex flex-1 flex-col justify-center px-6 sm:px-10">
        <p className="animate-fade-up mb-3 font-mono text-[10.5px] tracking-[0.34em] text-[#ffb020]">
          A PLAYABLE PORTFOLIO
        </p>
        <h1 className="animate-glitch-in title-logo -ml-[0.04em] pb-[0.06em] font-display text-[clamp(3.4rem,12vw,9.5rem)] leading-none font-extrabold tracking-[-0.04em]">
          THARUN
        </h1>
        <p
          className="animate-fade-up mt-4 max-w-md text-[clamp(0.95rem,1.4vw,1.1rem)] leading-relaxed text-white/75"
          style={{ animationDelay: "500ms" }}
        >
          {profile.role} · {profile.location.split(",")[0]} · <span className="text-white">{profile.tagline}</span>
        </p>

        <div className="mt-10 min-h-[15rem]">
          {phase === "press" ? (
            <button
              type="button"
              disabled={!ready}
              onClick={() => {
                unlockAudio();
                sfx("select");
                setPhase("menu");
              }}
              className="group flex items-center gap-3 font-mono text-[12px] tracking-[0.3em] text-white"
            >
              {ready ? (
                <>
                  <span className="h-2 w-2 animate-pulse-dot rounded-full bg-[#ffb020]" />
                  <span className="animate-blink">{touch ? "TAP TO START" : "PRESS ANY KEY"}</span>
                </>
              ) : (
                <span className="flex items-center gap-3 text-white/60">
                  LOADING
                  <span className="relative h-1 w-40 overflow-hidden rounded-full bg-white/10">
                    <span className="absolute inset-y-0 left-0 bg-[#ffb020]" style={{ width: `${progress}%` }} />
                  </span>
                  {Math.round(progress)}%
                </span>
              )}
            </button>
          ) : (
            <nav aria-label="Main menu" className="animate-fade-up flex w-full max-w-sm flex-col gap-1.5">
              {items.map((item, i) => {
                const on = i === index;
                return (
                  <button
                    key={item.id}
                    type="button"
                    autoFocus={i === 0}
                    onMouseEnter={() => {
                      if (i !== index) sfx("hover");
                      setIndex(i);
                    }}
                    onFocus={() => setIndex(i)}
                    onClick={item.run}
                    className={`group flex items-center justify-between rounded-lg border px-4 py-2.5 text-left transition-all duration-150 ${
                      on
                        ? "translate-x-1.5 border-[#ffb020]/60 bg-[#ffb020]/12 text-white"
                        : "border-white/8 bg-white/[0.03] text-white/70 hover:text-white"
                    }`}
                  >
                    <span className="flex shrink-0 items-center gap-3">
                      <span className={`font-mono text-[10px] text-[#ffb020] transition-opacity ${on ? "opacity-100" : "opacity-0"}`}>
                        ▶
                      </span>
                      <span className="font-display text-[15px] font-semibold tracking-[-0.01em] whitespace-nowrap">
                        {item.label}
                      </span>
                    </span>
                    <span className="ml-3 min-w-0 truncate text-right font-mono text-[9.5px] tracking-[0.12em] text-white/45 uppercase">
                      {item.hint}
                    </span>
                  </button>
                );
              })}
            </nav>
          )}
        </div>
      </main>

      <footer className="relative flex flex-wrap items-end justify-between gap-4 px-6 pb-5 font-mono text-[9.5px] tracking-[0.16em] text-white/45 sm:px-10">
        <p className="flex flex-wrap items-center gap-x-4 gap-y-2">
          {touch ? (
            <span>STICK TO MOVE · TAP THE GROUND TO WALK · A TO INTERACT</span>
          ) : (
            <>
              <span>
                <span className="keycap">W</span>
                <span className="keycap">A</span>
                <span className="keycap">S</span>
                <span className="keycap">D</span> MOVE
              </span>
              <span>
                <span className="keycap">⇧</span> RUN
              </span>
              <span>
                <span className="keycap">␣</span> JUMP
              </span>
              <span>
                <span className="keycap">E</span> INTERACT
              </span>
              <span>
                <span className="keycap">M</span> MAP
              </span>
              <span>
                <span className="keycap">R</span> RECRUITER
              </span>
            </>
          )}
        </p>
        <p>NEXT.JS · THREE.JS · RAPIER · BLENDER</p>
      </footer>
    </div>
  );
}
