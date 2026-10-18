"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Sparkles } from "@react-three/drei";
import { Color, MeshBasicMaterial, type Group } from "three";
import { useGame } from "@/game/store";
import { COMMITS } from "@/game/zones";

/**
 * Floating commits: spinning hex tokens with a git-dot in the middle. Picked
 * up by walking through them (see Sensors.tsx); they burst and are gone.
 */
function Commit({ index }: { index: number }) {
  const c = COMMITS[index];
  const taken = useGame((s) => s.collected.includes(c.id));
  const ref = useRef<Group>(null);
  const burst = useRef(0);

  const mats = useMemo(
    () => ({
      face: new MeshBasicMaterial({ color: new Color("#ffb020").multiplyScalar(2.2), toneMapped: false }),
      rim: new MeshBasicMaterial({ color: new Color("#fff3d6").multiplyScalar(2.6), toneMapped: false }),
      halo: new MeshBasicMaterial({ color: new Color("#ffb020"), transparent: true, opacity: 0.18, toneMapped: false, depthWrite: false }),
    }),
    [],
  );

  useFrame((state, dt) => {
    const g = ref.current;
    if (!g) return;
    const t = state.clock.elapsedTime;
    if (taken) {
      burst.current = Math.min(1, burst.current + dt * 3);
      const k = burst.current;
      g.scale.setScalar(Math.max(0.0001, (1 + k * 1.5) * (1 - k)));
      g.position.y = c.y + k * 1.2;
      g.visible = k < 1;
      return;
    }
    g.rotation.y += dt * 2.2;
    g.position.y = c.y + Math.sin(t * 2 + index) * 0.15;
  });

  return (
    <group>
      <group ref={ref} position={[c.x, c.y, c.z]}>
        <mesh rotation-x={Math.PI / 2} material={mats.face}>
          <cylinderGeometry args={[0.32, 0.32, 0.08, 6]} />
        </mesh>
        <mesh rotation-x={Math.PI / 2} material={mats.rim}>
          <torusGeometry args={[0.33, 0.035, 6, 6]} />
        </mesh>
        <mesh position-z={0.05} material={mats.rim}>
          <circleGeometry args={[0.09, 16]} />
        </mesh>
        <mesh position-z={-0.05} rotation-y={Math.PI} material={mats.rim}>
          <circleGeometry args={[0.09, 16]} />
        </mesh>
        <mesh material={mats.halo}>
          <sphereGeometry args={[0.62, 16, 12]} />
        </mesh>
      </group>
      {!taken ? (
        <Sparkles position={[c.x, c.y, c.z]} count={14} scale={1.6} size={3} speed={0.6} color="#ffd27a" />
      ) : null}
    </group>
  );
}

export function Commits() {
  return (
    <>
      {COMMITS.map((c, i) => (
        <Commit key={c.id} index={i} />
      ))}
    </>
  );
}
