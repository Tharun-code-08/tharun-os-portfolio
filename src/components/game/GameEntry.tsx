"use client";

import dynamic from "next/dynamic";
import { useSyncExternalStore } from "react";
import { readExperience, subscribeExperience, switchExperience, type Experience } from "@/game/experience";
import { Shell } from "../os/Shell";

function Loading() {
  return (
    <div className="fixed inset-0 grid place-items-center bg-[#0b0b14]">
      <div className="flex flex-col items-center gap-4">
        <p className="title-logo font-display text-[2.4rem] font-extrabold tracking-[-0.04em]">THARUN</p>
        <span className="relative h-1 w-40 overflow-hidden rounded-full bg-white/10">
          <span className="absolute inset-y-0 left-0 w-1/3 animate-pulse rounded-full bg-[#ffb020]" />
        </span>
        <p className="font-mono text-[9.5px] tracking-[0.3em] text-white/45">LOADING THE ISLAND</p>
      </div>
    </div>
  );
}

// The whole 3D stack (three, rapier, postprocessing) is its own chunk, loaded
// only by people who are actually going to see it.
const GameRoot = dynamic(() => import("./GameRoot"), { ssr: false, loading: Loading });

/**
 * Game or classic OS. Decided once on the client — the server renders neither,
 * so there is nothing to mismatch on hydration.
 */
export function GameEntry() {
  const choice = useSyncExternalStore(subscribeExperience, readExperience, () => "pending" as Experience);

  if (choice === "pending") return <Loading />;
  if (choice === "classic") {
    return <Shell onExit={() => switchExperience("game")} exitLabel="PLAY THE GAME" />;
  }
  return <GameRoot />;
}
