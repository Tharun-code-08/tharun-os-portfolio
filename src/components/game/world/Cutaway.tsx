"use client";

import { useMemo, useRef, type ReactNode } from "react";
import { useFrame } from "@react-three/fiber";
import { Mesh, MeshToonMaterial, type Group } from "three";
import { runtime } from "@/game/runtime";

/**
 * A roof that gets out of the way. When the player walks underneath, every
 * mesh inside fades to a ghost so the camera can look down into the room —
 * the camera already ignores roof colliders (userData.cameraIgnore).
 */
export function Cutaway({
  x,
  z,
  halfX,
  halfZ,
  below,
  ghost = 0.1,
  children,
}: {
  x: number;
  z: number;
  halfX: number;
  halfZ: number;
  /** Only fade while the player's feet are under this height. */
  below: number;
  /** Opacity while faded; 0 hides the group entirely. */
  ghost?: number;
  children: ReactNode;
}) {
  const group = useRef<Group>(null);
  const mats = useRef<MeshToonMaterial[] | null>(null);
  const fade = useRef(1);

  const bounds = useMemo(() => ({ x, z, halfX, halfZ, below }), [x, z, halfX, halfZ, below]);

  useFrame((_, dt) => {
    const g = group.current;
    if (!g) return;
    // Take private copies of the shared toon materials the first time, so
    // fading this roof never fades every other red box on the island.
    if (!mats.current) {
      mats.current = [];
      g.traverse((o) => {
        if (!(o instanceof Mesh) || !(o.material instanceof MeshToonMaterial)) return;
        const m = o.material.clone();
        m.transparent = true;
        o.material = m;
        mats.current!.push(m);
      });
    }
    const p = runtime.player.position;
    const inside =
      Math.abs(p.x - bounds.x) < bounds.halfX && Math.abs(p.z - bounds.z) < bounds.halfZ && p.y < bounds.below;
    fade.current += ((inside ? ghost : 1) - fade.current) * (1 - Math.exp(-8 * dt));
    for (const m of mats.current) {
      m.opacity = fade.current;
      m.depthWrite = fade.current > 0.95;
    }
    g.visible = fade.current > 0.02;
  });

  return <group ref={group}>{children}</group>;
}
