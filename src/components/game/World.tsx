"use client";

import { Suspense, useEffect } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { Physics } from "@react-three/rapier";
import { PerformanceMonitor } from "@react-three/drei";
import { ACESFilmicToneMapping, SRGBColorSpace } from "three";
import { useGame, effectiveQuality } from "@/game/store";
import { QUALITY } from "@/game/quality";
import { emit, runtime } from "@/game/runtime";
import { CameraRig } from "./CameraRig";
import { Player } from "./Player";
import { Environment } from "./world/Environment";
import { Island } from "./world/Island";
import { Places } from "./world/Places";
import { Sea } from "./world/Sea";
import { Foliage } from "./world/Foliage";
import { Effects } from "./world/Effects";
import { Sensors } from "./world/Sensors";
import { Life } from "./world/Life";

/**
 * Dev only: lets the console step frames, read renderer stats, and inspect or
 * drive the player (position, mode, teleports) when testing the controller.
 */
function DevHandle() {
  const advance = useThree((s) => s.advance);
  const gl = useThree((s) => s.gl);
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    (window as unknown as { __r3f: unknown }).__r3f = { advance, gl, runtime, game: useGame, emit };
  }, [advance, gl]);
  return null;
}

/**
 * The 3D layer. Everything here is presentation and physics; the rules live in
 * src/game and the HUD lives in DOM overlays on top.
 */
export function World() {
  const quality = useGame(effectiveQuality);
  const paused = useGame((s) => s.mode === "os" || s.recruiter);
  const setAutoQuality = useGame((s) => s.setAutoQuality);
  const auto = useGame((s) => s.settings.quality === "auto");
  const q = QUALITY[quality];

  return (
    <Canvas
      className="!absolute inset-0"
      shadows={q.shadows ? "soft" : false}
      dpr={q.dpr}
      // While the OS is on screen the GPU has nothing to do.
      frameloop={paused ? "never" : "always"}
      gl={{ antialias: !q.post, powerPreference: "high-performance", stencil: false }}
      camera={{ fov: 50, near: 0.1, far: 1200, position: [60, 30, 60] }}
      onCreated={({ gl }) => {
        gl.toneMapping = ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.05;
        gl.outputColorSpace = SRGBColorSpace;
      }}
    >
      {auto ? (
        <PerformanceMonitor
          onDecline={() => {
            const cur = useGame.getState().autoQuality;
            if (cur === "high") setAutoQuality("medium");
            else if (cur === "medium") setAutoQuality("low");
          }}
          flipflops={2}
        />
      ) : null}

      <DevHandle />
      <Suspense fallback={null}>
        <Environment />
        <Sea />
        {/* Steps before every other frame callback, so the player, camera
            and HUD all read this frame's simulation, not the last one. */}
        <Physics timeStep={1 / 60} interpolate updatePriority={-1}>
          <Island />
          <Places />
          <Sensors />
          <Foliage />
          <Life />
          <Player />
          <CameraRig />
        </Physics>
        {q.post ? <Effects quality={quality} /> : null}
      </Suspense>
    </Canvas>
  );
}
