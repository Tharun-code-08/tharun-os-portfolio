"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Billboard } from "@react-three/drei";
import { CuboidCollider, CylinderCollider, RigidBody } from "@react-three/rapier";
import { Color, DoubleSide, MeshBasicMaterial, type Group, type Mesh } from "three";
import { lab, type LabStatus } from "@/data/journal";
import { glow, PAL } from "@/game/materials";
import { useGame } from "@/game/store";
import { heightAt, LAYOUT } from "@/game/terrain";
import { Box, Cyl, FONT_MONO, Label } from "./kit";

const R = 5.8;
const GAP = (62 * Math.PI) / 180;

const STATUS_COLOR: Record<LabStatus, string> = {
  ONGOING: "#ffb020",
  ANSWERED: "#57d18a",
  PARKED: "#8da2c0",
};

export function Lab() {
  const [cx, cz] = LAYOUT.lab;
  const g = heightAt(cx, cz);
  const focused = useGame((s) => s.focus === "lab-console");

  // The doorway faces the studio.
  const [sx, sz] = LAYOUT.studio;
  const door = Math.atan2(sz - cz, sx - cx);
  const phiGap = Math.PI - door;

  const ring = useRef<Group>(null);
  const orbits = useRef<Group>(null);
  const core = useRef<Mesh>(null);

  const mats = useMemo(
    () => ({
      glass: new MeshBasicMaterial({
        color: "#a8d8ff",
        transparent: true,
        opacity: 0.1,
        side: DoubleSide,
        depthWrite: false,
      }),
      core: new MeshBasicMaterial({ color: new Color("#ffb020").multiplyScalar(2.4), toneMapped: false }),
    }),
    [],
  );

  const walls = useMemo(() => {
    const out: { x: number; z: number; rot: number }[] = [];
    const n = 28;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      let d = Math.abs(((a - door + Math.PI) % (Math.PI * 2)) - Math.PI);
      if (d > Math.PI) d = Math.PI * 2 - d;
      if (d < GAP / 2) continue;
      out.push({ x: Math.cos(a) * R, z: Math.sin(a) * R, rot: -a });
    }
    return out;
  }, [door]);

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    if (ring.current) {
      ring.current.rotation.y += dt * 0.6;
      ring.current.rotation.x = Math.sin(t * 0.4) * 0.3;
    }
    if (orbits.current) orbits.current.rotation.y += dt * 0.18;
    if (core.current) {
      const pulse = 1 + Math.sin(t * 3) * 0.06 + (focused ? 0.12 : 0);
      core.current.scale.setScalar(pulse);
      mats.core.color.set("#ffb020").multiplyScalar(focused ? 3.6 : 2.4);
    }
  });

  return (
    <group position={[cx, g, cz]}>
      <RigidBody type="fixed" colliders={false} userData={{ surface: "stone" }}>
        {walls.map((w, i) => (
          <CuboidCollider key={i} args={[0.15, 2.2, 0.7]} position={[w.x, 2.2, w.z]} rotation={[0, w.rot, 0]} />
        ))}
        <CylinderCollider args={[0.6, 0.9]} position={[0, 0.6, 0]} />
        <CuboidCollider args={[0.9, 0.5, 0.35]} position={[-2.9, 0.5, -2.2]} rotation={[0, 0.9, 0]} />
      </RigidBody>

      {/* Floor */}
      <Cyl r={R + 0.3} h={0.14} position={[0, 0.02, 0]} color={PAL.metal} segments={40} cast={false} />
      <mesh rotation-x={-Math.PI / 2} position-y={0.1} material={glow("#6aa6ff", 1.4, 0.5)}>
        <ringGeometry args={[R - 0.25, R - 0.15, 48]} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position-y={0.1} material={glow("#6aa6ff", 1.2, 0.35)}>
        <ringGeometry args={[1.6, 1.68, 40]} />
      </mesh>

      {/* Glass dome with the doorway cut out */}
      <mesh material={mats.glass} renderOrder={2}>
        <sphereGeometry args={[R, 40, 18, phiGap + GAP / 2, Math.PI * 2 - GAP, 0, Math.PI / 2]} />
      </mesh>
      {/* Ribs */}
      {Array.from({ length: 10 }, (_, i) => {
        const a = (i / 10) * Math.PI * 2;
        let d = Math.abs(((a - door + Math.PI) % (Math.PI * 2)) - Math.PI);
        if (d > Math.PI) d = Math.PI * 2 - d;
        if (d < GAP / 2 - 0.05) return null;
        return (
          <mesh key={i} rotation={[0, -a, 0]} castShadow>
            <torusGeometry args={[R, 0.06, 6, 24, Math.PI / 2]} />
            <meshToonMaterial color={PAL.metalLight} />
          </mesh>
        );
      })}
      <mesh position-y={R * Math.sin(Math.PI / 4)} rotation-x={Math.PI / 2}>
        <torusGeometry args={[R * Math.cos(Math.PI / 4), 0.05, 6, 40]} />
        <meshToonMaterial color={PAL.metalLight} />
      </mesh>
      {/* Doorway arch + sign */}
      <group position={[Math.cos(door) * R, 0, Math.sin(door) * R]} rotation-y={-door + Math.PI / 2}>
        <Box size={[0.25, 3.6, 0.25]} position={[-2.6, 1.8, 0]} color={PAL.metal} />
        <Box size={[0.25, 3.6, 0.25]} position={[2.6, 1.8, 0]} color={PAL.metal} />
        <Box size={[5.5, 0.6, 0.2]} position={[0, 3.7, 0]} color="#141a30" />
        <Label position={[0, 3.72, 0.12]} size={0.26} color="#6aa6ff">
          THE LAB
        </Label>
      </group>

      {/* Core */}
      <Cyl r={0.9} rTop={0.6} h={1.1} position={[0, 0.55, 0]} color="#2b2f3a" segments={8} />
      <mesh ref={core} position-y={1.8} material={mats.core}>
        <icosahedronGeometry args={[0.42, 1]} />
      </mesh>
      <group ref={ring} position-y={1.8}>
        <mesh>
          <torusGeometry args={[0.8, 0.03, 6, 40]} />
          <meshBasicMaterial color={new Color("#6aa6ff").multiplyScalar(2)} toneMapped={false} />
        </mesh>
        <mesh rotation-x={Math.PI / 2}>
          <torusGeometry args={[0.95, 0.025, 6, 40]} />
          <meshBasicMaterial color={new Color("#c77dff").multiplyScalar(2)} toneMapped={false} />
        </mesh>
      </group>

      {/* One orb per open question, coloured by where it stands */}
      <group ref={orbits} position-y={0}>
        {lab.map((q, i) => {
          const a = (i / lab.length) * Math.PI * 2;
          return (
            <group key={q.id} position={[Math.cos(a) * 3.1, 2.2 + Math.sin(i * 1.9) * 0.5, Math.sin(a) * 3.1]}>
              <mesh material={glow(STATUS_COLOR[q.status], 2.2)}>
                <sphereGeometry args={[0.2, 16, 12]} />
              </mesh>
              <mesh material={glow(STATUS_COLOR[q.status], 1, 0.18)}>
                <sphereGeometry args={[0.34, 16, 12]} />
              </mesh>
              <Billboard position-y={-0.48}>
                <Label size={0.11} color={STATUS_COLOR[q.status]} font={FONT_MONO}>
                  {`Q${q.index}`}
                </Label>
              </Billboard>
            </group>
          );
        })}
      </group>

      {/* Whiteboard */}
      <group position={[-2.9, 0, -2.2]} rotation-y={0.9 + Math.PI}>
        <Box size={[1.8, 1.1, 0.06]} position={[0, 1.55, 0]} color="#f6f4ee" />
        <Box size={[1.9, 0.08, 0.1]} position={[0, 0.98, 0.02]} color={PAL.metalLight} />
        <Box size={[0.06, 1, 0.06]} position={[-0.8, 0.5, 0]} color={PAL.metal} />
        <Box size={[0.06, 1, 0.06]} position={[0.8, 0.5, 0]} color={PAL.metal} />
        <Label position={[0, 1.85, 0.04]} size={0.08} color="#3f7dd4" font={FONT_MONO}>
          RLS ≠ DISCIPLINE
        </Label>
        <Label position={[0, 1.62, 0.04]} size={0.07} color="#d4553f" font={FONT_MONO}>
          qty = Σ movements
        </Label>
        <Label position={[0, 1.4, 0.04]} size={0.07} color="#2b2b2f" font={FONT_MONO}>
          python → wasm → tab?
        </Label>
        <Label position={[0, 1.2, 0.04]} size={0.06} color="#4fa36a" font={FONT_MONO}>
          restore it or it isn&apos;t a backup
        </Label>
      </group>

      {/* Console in front of the core */}
      <group position={[Math.cos(door) * 1.6, 0, Math.sin(door) * 1.6]} rotation-y={-door + Math.PI / 2}>
        <Box size={[1.2, 0.85, 0.5]} position={[0, 0.42, 0]} rotation={[0, 0, 0]} color="#2b2f3a" />
        <mesh position={[0, 0.9, 0.12]} rotation-x={-0.7} material={glow(focused ? "#ffd27a" : "#6aa6ff", focused ? 2.4 : 1.5)}>
          <planeGeometry args={[1.05, 0.38]} />
        </mesh>
      </group>
    </group>
  );
}
