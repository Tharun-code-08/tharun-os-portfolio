"use client";

import { Bloom, ChromaticAberration, EffectComposer, SMAA, ToneMapping, Vignette } from "@react-three/postprocessing";
import { BlendFunction, ToneMappingMode } from "postprocessing";
import { Vector2 } from "three";
import type { Quality } from "@/game/store";

const ABERRATION = new Vector2(0.0007, 0.0007);

/**
 * Bloom picks up anything brighter than 1 — screens, beacons, holograms,
 * commits — so glow is a material decision, not a post-process mask.
 * The composer turns renderer tone mapping off, so it is re-applied here.
 */
export function Effects({ quality }: { quality: Quality }) {
  if (quality === "high") {
    return (
      <EffectComposer multisampling={0} enableNormalPass={false}>
        <Bloom mipmapBlur luminanceThreshold={1} luminanceSmoothing={0.25} intensity={0.85} radius={0.72} />
        <ChromaticAberration offset={ABERRATION} radialModulation modulationOffset={0.35} blendFunction={BlendFunction.NORMAL} />
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
        <Vignette offset={0.32} darkness={0.5} />
        <SMAA />
      </EffectComposer>
    );
  }
  return (
    <EffectComposer multisampling={0} enableNormalPass={false}>
      <Bloom mipmapBlur luminanceThreshold={1} luminanceSmoothing={0.25} intensity={0.75} radius={0.65} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      <Vignette offset={0.32} darkness={0.5} />
      <SMAA />
    </EffectComposer>
  );
}
