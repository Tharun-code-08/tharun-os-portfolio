"use client";

import { useMemo, useRef, type ReactNode } from "react";
import { useFrame } from "@react-three/fiber";
import { Mesh, type Group, type Material } from "three";
import { runtime } from "@/game/runtime";
import { useGame } from "@/game/store";

/** How far the roof overhangs its footprint, and how thick a slab to test. */
const OVERHANG = 0.9;
const SLAB = 1.6;

/**
 * Does the segment a→b pass through the box? (Slab test.)
 */
function segmentHitsBox(
  ax: number, ay: number, az: number,
  bx: number, by: number, bz: number,
  min: [number, number, number], max: [number, number, number],
) {
  let t0 = 0;
  let t1 = 1;
  const a = [ax, ay, az];
  const d = [bx - ax, by - ay, bz - az];
  for (let i = 0; i < 3; i++) {
    if (Math.abs(d[i]) < 1e-9) {
      if (a[i] < min[i] || a[i] > max[i]) return false;
      continue;
    }
    let ta = (min[i] - a[i]) / d[i];
    let tb = (max[i] - a[i]) / d[i];
    if (ta > tb) [ta, tb] = [tb, ta];
    t0 = Math.max(t0, ta);
    t1 = Math.min(t1, tb);
    if (t0 > t1) return false;
  }
  return true;
}

/**
 * A roof that gets out of the way. It fades to a ghost when the player walks
 * underneath, so the camera can look down into the room, and whenever it sits
 * between the camera and the player — the camera ignores roof colliders
 * (userData.cameraIgnore), so it can end up under one while he stands outside.
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
  const mats = useRef<Material[] | null>(null);
  const fade = useRef(1);

  const bounds = useMemo(() => ({ x, z, halfX, halfZ, below }), [x, z, halfX, halfZ, below]);

  useFrame((state, dt) => {
    const g = group.current;
    if (!g) return;
    // Take private copies of the shared materials the first time, so fading
    // this roof never fades every other red box (or neon strip) on the island.
    if (!mats.current) {
      mats.current = [];
      g.traverse((o) => {
        if (!(o instanceof Mesh) || Array.isArray(o.material)) return;
        // Text (troika) builds its own shader from its material; leave it be.
        // A group with ghost 0 hides it outright once the fade is done.
        if ((o.material as { isDerivedMaterial?: boolean }).isDerivedMaterial) return;
        const m = o.material.clone();
        m.transparent = true;
        o.material = m;
        mats.current!.push(m);
      });
    }
    const p = runtime.player.position;
    const inside =
      Math.abs(p.x - bounds.x) < bounds.halfX && Math.abs(p.z - bounds.z) < bounds.halfZ && p.y < bounds.below;
    const c = state.camera.position;
    // Only while you are actually playing: the title orbit and the intro
    // fly over the roofs, and a roofless island looks broken from up there.
    const blocking =
      !inside &&
      useGame.getState().mode === "play" &&
      segmentHitsBox(
        c.x, c.y, c.z,
        p.x, p.y + 1.1, p.z,
        [bounds.x - bounds.halfX - OVERHANG, bounds.below, bounds.z - bounds.halfZ - OVERHANG],
        [bounds.x + bounds.halfX + OVERHANG, bounds.below + SLAB, bounds.z + bounds.halfZ + OVERHANG],
      );
    fade.current += ((inside || blocking ? ghost : 1) - fade.current) * (1 - Math.exp(-8 * dt));
    for (const m of mats.current) {
      m.opacity = fade.current;
      m.depthWrite = fade.current > 0.95;
    }
    g.visible = fade.current > 0.02;
  });

  return <group ref={group}>{children}</group>;
}
