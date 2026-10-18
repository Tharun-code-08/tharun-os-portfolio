"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Billboard } from "@react-three/drei";
import { CylinderCollider, RigidBody } from "@react-three/rapier";
import { Color, MeshBasicMaterial, type Group } from "three";
import type { LogKind } from "@/data/journal";
import { PAL } from "@/game/materials";
import { useGame } from "@/game/store";
import { heightAt, TIMELINE_PATH } from "@/game/terrain";
import { TIMELINE_STONES } from "@/game/zones";
import { Box, Cyl, FONT_MONO, Label } from "./kit";

export const KIND_COLOR: Record<LogKind, string> = {
  SHIP: "#57d18a",
  BUILD: "#ffb020",
  START: "#6aa6ff",
  LEARN: "#c77dff",
  BROKE: "#ff5a5a",
  EXPERIMENT: "#ff7ad9",
};

function Stone({ index }: { index: number }) {
  const { entry, x, z } = TIMELINE_STONES[index];
  const lit = useGame((s) => s.stonesLit.includes(index));
  const focused = useGame((s) => s.focus === `stone:${index}`);
  const y = heightAt(x, z);
  const color = KIND_COLOR[entry.kind];
  const gem = useRef<Group>(null);
  const card = useRef<Group>(null);

  const mat = useMemo(() => new MeshBasicMaterial({ color: new Color(color), toneMapped: false }), [color]);

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    if (gem.current) {
      gem.current.rotation.y += dt * (lit ? 1.4 : 0.3);
      gem.current.position.y = 1.32 + Math.sin(t * 2 + index) * 0.05;
    }
    mat.color.set(lit ? color : "#5a5560").multiplyScalar(lit ? (focused ? 3.4 : 2.2) : 1);
    if (card.current) {
      const target = focused ? 1 : 0;
      const s = card.current.scale.x + (target - card.current.scale.x) * (1 - Math.exp(-12 * dt));
      card.current.scale.setScalar(Math.max(0.0001, s));
    }
  });

  const date = new Date(entry.date).toLocaleDateString("en-GB", { month: "short", year: "numeric" }).toUpperCase();

  return (
    <group position={[x, y, z]}>
      <Cyl r={0.32} rTop={0.26} h={1.0} position={[0, 0.5, 0]} color={PAL.stone} segments={6} />
      <Cyl r={0.36} h={0.12} position={[0, 0.06, 0]} color={PAL.stoneDark} segments={6} />
      <group ref={gem} position-y={1.32}>
        <mesh material={mat}>
          <octahedronGeometry args={[0.17, 0]} />
        </mesh>
      </group>
      <Billboard position-y={2.25}>
        <group ref={card} scale={0.0001}>
          <mesh position-z={-0.01}>
            <planeGeometry args={[2.6, 0.78]} />
            <meshBasicMaterial color="#0a0d18" transparent opacity={0.85} depthWrite={false} />
          </mesh>
          <mesh position={[-1.3, 0, 0]}>
            <planeGeometry args={[0.04, 0.78]} />
            <meshBasicMaterial color={new Color(color).multiplyScalar(2)} toneMapped={false} />
          </mesh>
          <Label position={[-1.18, 0.22, 0]} size={0.085} color={color} font={FONT_MONO} anchorX="left">
            {`${date} · ${entry.kind}`}
          </Label>
          <Label position={[-1.18, -0.02, 0]} size={0.13} anchorX="left" maxWidth={2.35}>
            {entry.title}
          </Label>
          <Label position={[-1.18, -0.25, 0]} size={0.06} color="#8d93a3" font={FONT_MONO} anchorX="left">
            E — READ THE WHOLE LOG
          </Label>
        </group>
      </Billboard>
    </group>
  );
}

export function Timeline() {
  const first = TIMELINE_PATH[0];
  const last = TIMELINE_PATH[TIMELINE_PATH.length - 1];

  return (
    <group>
      <RigidBody type="fixed" colliders={false} userData={{ surface: "stone" }}>
        {TIMELINE_STONES.map(({ x, z }, i) => (
          <CylinderCollider key={i} args={[0.5, 0.3]} position={[x, heightAt(x, z) + 0.5, z]} />
        ))}
      </RigidBody>

      {TIMELINE_STONES.map((_, i) => (
        <Stone key={i} index={i} />
      ))}

      {/* Start and end markers */}
      <group position={[first[0] - 1.6, heightAt(first[0] - 1.6, first[1] - 1.4), first[1] - 1.4]} rotation-y={0.9}>
        <Box size={[0.12, 2.0, 0.12]} position={[0, 1, 0]} color={PAL.woodDark} />
        <Box size={[2.3, 0.85, 0.08]} position={[0, 1.8, 0]} color="#2b2b2f" />
        <Label position={[0, 1.95, 0.05]} size={0.16} color="#ffd27a">
          THE LONG ROAD
        </Label>
        <Label position={[0, 1.66, 0.05]} size={0.07} color="#d9d2c4" font={FONT_MONO}>
          JUNE 2025 · START HERE →
        </Label>
      </group>
      <group position={[last[0] + 1.4, heightAt(last[0] + 1.4, last[1] - 1.6), last[1] - 1.6]} rotation-y={-0.9}>
        <Box size={[0.12, 2.0, 0.12]} position={[0, 1, 0]} color={PAL.woodDark} />
        <Box size={[1.6, 0.6, 0.08]} position={[0, 1.8, 0]} color="#2b2b2f" />
        <Label position={[0, 1.82, 0.05]} size={0.18} color="#57d18a">
          NOW
        </Label>
      </group>
    </group>
  );
}
