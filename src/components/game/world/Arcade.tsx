"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { CuboidCollider, RigidBody } from "@react-three/rapier";
import { Color, MeshBasicMaterial, type Mesh } from "three";
import type { StackGroup } from "@/data/profile";
import { glow, PAL } from "@/game/materials";
import { liveSky } from "@/game/sky";
import { useGame } from "@/game/store";
import { heightAt, LAYOUT } from "@/game/terrain";
import { ARCADE_ROOF, CABINET_SLOTS } from "@/game/zones";
import { Box, Cyl, FONT_MONO, Label } from "./kit";
import { Cutaway } from "./Cutaway";

const NEON = ["#ff4fd8", "#4fd8ff", "#ffb020", "#57d18a", "#c77dff", "#ff7a45", "#6aa6ff"];

function Cabinet({ group, x, z, facing, i }: { group: StackGroup; x: number; z: number; facing: number; i: number }) {
  const focused = useGame((s) => s.focus === `cabinet:${group.label}`);
  const color = NEON[i % NEON.length];
  const screen = useRef<Mesh>(null);
  const y = heightAt(x, z);

  const mat = useMemo(() => new MeshBasicMaterial({ color: new Color(color), toneMapped: false }), [color]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    // An attract-mode flicker; brighter when you walk up to it.
    const flicker = 0.85 + Math.sin(t * 7 + i * 3) * 0.05 + (Math.sin(t * 31 + i) > 0.97 ? 0.3 : 0);
    mat.color.set(color).multiplyScalar((focused ? 2.6 : 1.5) * flicker);
    if (screen.current) screen.current.scale.y = focused ? 1.04 : 1;
  });

  return (
    <group position={[x, y, z]} rotation-y={facing}>
      <Box size={[0.9, 1.9, 0.8]} position={[0, 0.95, -0.05]} color="#1d1d27" />
      <Box size={[0.92, 0.12, 0.82]} position={[0, 1.95, -0.05]} color={color} />
      <Box size={[0.9, 0.38, 0.12]} position={[0, 2.15, 0.28]} color="#2b2b37" />
      <mesh position={[0, 2.15, 0.345]} material={mat}>
        <planeGeometry args={[0.8, 0.28]} />
      </mesh>
      <Label position={[0, 2.15, 0.36]} size={0.085} color="#0b0b12" maxWidth={0.78}>
        {group.label.toUpperCase()}
      </Label>
      {/* screen, tilted back */}
      <mesh ref={screen} position={[0, 1.45, 0.36]} rotation-x={-0.28} material={glow("#0b0b18", 1)}>
        <planeGeometry args={[0.72, 0.56]} />
      </mesh>
      <Label position={[0, 1.55, 0.395]} rotation={[-0.28, 0, 0]} size={0.05} color={color} font={FONT_MONO}>
        {`${group.items.length} TITLES`}
      </Label>
      <Label
        position={[0, 1.38, 0.41]}
        rotation={[-0.28, 0, 0]}
        size={0.042}
        color="#e9eefa"
        font={FONT_MONO}
        maxWidth={0.64}
        lineHeight={1.3}
      >
        {group.items.map((it) => it.name).join(" · ")}
      </Label>
      {/* control deck */}
      <Box size={[0.9, 0.14, 0.42]} position={[0, 1.02, 0.42]} rotation={[0.35, 0, 0]} color="#2b2b37" />
      <Cyl r={0.025} h={0.14} position={[-0.2, 1.14, 0.45]} color="#d9d2c4" />
      <mesh position={[-0.2, 1.22, 0.45]} material={glow(PAL.red, 1.2)}>
        <sphereGeometry args={[0.045, 10, 8]} />
      </mesh>
      {[0.08, 0.2, 0.32].map((bx, k) => (
        <mesh key={bx} position={[bx, 1.12, 0.47]} rotation-x={0.35} material={glow(NEON[(i + k + 1) % NEON.length], 1.6)}>
          <cylinderGeometry args={[0.035, 0.035, 0.03, 12]} />
        </mesh>
      ))}
      <Box size={[0.3, 0.06, 0.02]} position={[0, 0.6, 0.355]} color="#3a3a46" />
    </group>
  );
}

export function Arcade() {
  const [cx, cz] = LAYOUT.arcade;
  const g = heightAt(cx, cz);
  const S = ARCADE_ROOF.size;
  const top = ARCADE_ROOF.top;
  const sign = useMemo(() => new MeshBasicMaterial({ color: new Color("#ff4fd8"), toneMapped: false }), []);
  const floorGlow = useMemo(() => new MeshBasicMaterial({ color: new Color("#c77dff"), toneMapped: false, transparent: true, opacity: 0.5 }), []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const on = Math.sin(t * 1.7) > -0.92 ? 1 : 0.25; // the occasional neon stutter
    sign.color.set("#ff4fd8").multiplyScalar((1.8 + liveSky.night * 1.6) * on);
    floorGlow.opacity = 0.25 + liveSky.night * 0.45;
  });

  // Crates, west side, climbing to the roof: [x, z, height in crates]
  const crates: [number, number, number][] = [
    [cx - S / 2 - 2.9, cz + 3.8, 1],
    [cx - S / 2 - 1.9, cz + 2.6, 2],
    [cx - S / 2 - 0.75, cz + 1.4, 3],
  ];
  const C = 0.85;

  const posts: [number, number][] = [
    [cx - S / 2 + 0.3, cz - S / 2 + 0.3],
    [cx + S / 2 - 0.3, cz - S / 2 + 0.3],
    [cx + S / 2 - 0.3, cz + S / 2 - 0.3],
    [cx - S / 2 + 0.3, cz + S / 2 - 0.3],
  ];

  return (
    <group>
      <RigidBody type="fixed" colliders={false} userData={{ surface: "wood" }}>
        {CABINET_SLOTS.map(({ group, x, z, facing }) => (
          <CuboidCollider key={group.label} args={[0.45, 1.0, 0.45]} position={[x, heightAt(x, z) + 1, z]} rotation={[0, facing, 0]} />
        ))}
        {posts.map(([x, z]) => (
          <CuboidCollider key={`${x}${z}`} args={[0.18, (top - g) / 2, 0.18]} position={[x, g + (top - g) / 2, z]} />
        ))}
        {crates.map(([x, z, n]) => (
          <CuboidCollider key={`${x}${z}`} args={[C / 2, (C * n) / 2, C / 2]} position={[x, heightAt(x, z) + (C * n) / 2 - 0.05, z]} />
        ))}
      </RigidBody>
      {/* Walkable roof, but the camera looks straight through it. */}
      <RigidBody type="fixed" colliders={false} userData={{ cameraIgnore: true, surface: "wood" }}>
        <CuboidCollider args={[S / 2, 0.15, S / 2]} position={[cx, top - 0.15, cz]} />
      </RigidBody>

      {/* Floor: checker tiles */}
      <group position={[cx, g, cz]}>
        <Box size={[S - 0.4, 0.1, S - 0.4]} position={[0, 0.02, 0]} color="#2a2236" cast={false} />
        {Array.from({ length: 6 }, (_, ix) =>
          Array.from({ length: 6 }, (_, iz) =>
            (ix + iz) % 2 === 0 ? (
              <Box
                key={`${ix}${iz}`}
                size={[1.8, 0.02, 1.8]}
                position={[-4.5 + ix * 1.8, 0.08, -4.5 + iz * 1.8]}
                color="#3a2f4a"
                cast={false}
              />
            ) : null,
          ),
        )}
        <mesh rotation-x={-Math.PI / 2} position-y={0.1} material={floorGlow}>
          <ringGeometry args={[2.4, 2.5, 40]} />
        </mesh>
      </group>

      {/* Canopy */}
      {posts.map(([x, z]) => (
        <Box key={`${x}${z}`} size={[0.32, top - g, 0.32]} position={[x, g + (top - g) / 2, z]} color="#2b2b37" />
      ))}
      <Cutaway x={cx} z={cz} halfX={S / 2} halfZ={S / 2} below={top - 1}>
        <Box size={[S, 0.3, S]} position={[cx, top - 0.15, cz]} color="#3a2f4a" />
      </Cutaway>
      <Box size={[S + 0.2, 0.08, S + 0.2]} position={[cx, top - 0.32, cz]} material={glow("#c77dff", 1.3)} cast={false} />

      {/* Neon sign on the roof edge facing the studio */}
      <group position={[cx + S / 2 + 0.05, top + 0.55, cz]} rotation-y={Math.PI / 2}>
        <Box size={[4.2, 1.0, 0.12]} color="#14101c" />
        <Label position={[0, 0.02, 0.08]} size={0.48} color="#ff4fd8" material={sign}>
          ARCADE
        </Label>
      </group>

      {CABINET_SLOTS.map((s, i) => (
        <Cabinet key={s.group.label} {...s} i={i} />
      ))}

      {/* Crates */}
      {crates.map(([x, z, n]) =>
        Array.from({ length: n }, (_, k) => (
          <group key={`${x}${z}${k}`} position={[x, heightAt(x, z) + C / 2 + k * C - 0.05, z]} rotation-y={k * 0.12}>
            <Box size={[C, C, C]} color={PAL.wood} />
            <Box size={[C + 0.02, 0.1, C + 0.02]} position={[0, C / 2 - 0.06, 0]} color={PAL.woodDark} />
            <Box size={[C + 0.02, 0.1, C + 0.02]} position={[0, -C / 2 + 0.06, 0]} color={PAL.woodDark} />
          </group>
        )),
      )}
    </group>
  );
}
