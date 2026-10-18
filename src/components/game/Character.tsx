"use client";

import { Component, Suspense, useEffect, useMemo, useRef, type ReactNode } from "react";
import { useFrame } from "@react-three/fiber";
import { useAnimations, useGLTF } from "@react-three/drei";
import { LoopOnce, LoopRepeat, Mesh, MeshToonMaterial, type AnimationAction, type Group } from "three";
import { clone as cloneSkinned } from "three/examples/jsm/utils/SkeletonUtils.js";
import { toonify } from "@/game/materials";
import { runtime, type Anim } from "@/game/runtime";
import { ProceduralCharacter } from "./ProceduralCharacter";

/**
 * Tharun, as modelled in Blender (art/build_tharun.py → public/models/tharun.glb).
 *
 * The GLB carries nine clips. Each frame the controller says what he is doing
 * (runtime.player.anim) and this crossfades to the matching clip, scaling the
 * walk and run cycles to his real speed so the feet don't skate.
 */

const MODEL = "/models/tharun.glb";

const CLIP: Record<Anim, string> = {
  idle: "Idle",
  walk: "Walk",
  run: "Run",
  jump: "Jump",
  fall: "Fall",
  land: "Land",
  wave: "Wave",
  interact: "Interact",
  victory: "Victory",
};

const ONCE = new Set(["Jump", "Land"]);
const FADE: Partial<Record<Anim, number>> = { jump: 0.08, land: 0.06, fall: 0.25 };

function Model() {
  const group = useRef<Group>(null);
  const { scene, animations } = useGLTF(MODEL);

  // A private copy (skeletons can't be shared) with the toon look applied.
  const model = useMemo(() => {
    const clone = toonify(cloneSkinned(scene) as Group);
    clone.traverse((o) => {
      // Skinned bounds don't follow the animation; never cull him.
      o.frustumCulled = false;
      // Eyes keep a little life in them.
      if (o instanceof Mesh && !Array.isArray(o.material) && o.material.name === "Glint") {
        (o.material as MeshToonMaterial).emissive.set("#ffffff");
      }
    });
    return clone;
  }, [scene]);

  const { actions } = useAnimations(animations, group);
  const current = useRef<AnimationAction | null>(null);
  const currentAnim = useRef<Anim | null>(null);

  useEffect(() => {
    Object.entries(actions).forEach(([name, a]) => {
      if (!a) return;
      if (ONCE.has(name)) {
        a.setLoop(LoopOnce, 1);
        a.clampWhenFinished = true;
      } else {
        a.setLoop(LoopRepeat, Infinity);
      }
    });
    const idle = actions.Idle;
    idle?.reset().play();
    current.current = idle ?? null;
    currentAnim.current = "idle";
  }, [actions]);

  useFrame(() => {
    const p = runtime.player;
    const anim = p.anim;
    if (anim !== currentAnim.current) {
      const next = actions[CLIP[anim]];
      if (next) {
        const fade = FADE[anim] ?? 0.18;
        next.reset().setEffectiveWeight(1).fadeIn(fade).play();
        current.current?.fadeOut(fade);
        current.current = next;
      }
      currentAnim.current = anim;
    }
    // Match the cycle to the ground speed.
    const a = current.current;
    if (a) {
      if (anim === "walk") a.timeScale = Math.max(0.6, p.speed / 2.3);
      else if (anim === "run") a.timeScale = Math.max(0.8, p.speed / 5.2);
      else a.timeScale = 1;
    }
  });

  return (
    <group ref={group}>
      <primitive object={model} />
      <BlobShadow />
    </group>
  );
}

/** A soft contact shadow, so he never looks like he's floating on low quality. */
function BlobShadow() {
  return (
    <mesh rotation-x={-Math.PI / 2} position-y={0.02} renderOrder={-1}>
      <circleGeometry args={[0.36, 24]} />
      <meshBasicMaterial color="#000000" transparent opacity={0.25} depthWrite={false} />
    </mesh>
  );
}

class Fallback extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? <ProceduralCharacter /> : this.props.children;
  }
}

export function Character() {
  return (
    <Fallback>
      <Suspense fallback={<ProceduralCharacter />}>
        <Model />
      </Suspense>
    </Fallback>
  );
}

useGLTF.preload(MODEL);
