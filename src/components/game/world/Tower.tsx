"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { CuboidCollider, RigidBody } from "@react-three/rapier";
import { Color, MeshBasicMaterial, type Group, type Mesh } from "three";
import { contact } from "@/data/profile";
import { glow, PAL } from "@/game/materials";
import { useGame } from "@/game/store";
import { heightAt, LAYOUT } from "@/game/terrain";
import { Box, Cyl, FONT_MONO, Label } from "./kit";

const HEIGHT = 15;
const BASE = 1.4;
const TOP = 0.35;

/** A tapered lattice: four legs and X-bracing, generated rather than placed. */
function Lattice() {
  const parts = useMemo(() => {
    const out: { p: [number, number, number]; s: [number, number, number]; r: [number, number, number] }[] = [];
    const half = (y: number) => BASE + (TOP - BASE) * (y / HEIGHT);
    const corners = [
      [-1, -1],
      [1, -1],
      [1, 1],
      [-1, 1],
    ];
    // legs
    for (const [sx, sz] of corners) {
      const x0 = sx * BASE;
      const z0 = sz * BASE;
      const x1 = sx * TOP;
      const z1 = sz * TOP;
      const len = Math.hypot(x1 - x0, HEIGHT, z1 - z0);
      out.push({
        p: [(x0 + x1) / 2, HEIGHT / 2, (z0 + z1) / 2],
        s: [0.12, len, 0.12],
        r: [Math.atan2(z1 - z0, HEIGHT) * -1, 0, Math.atan2(x1 - x0, HEIGHT)],
      });
    }
    // horizontal rings + diagonals on each face
    const levels = 6;
    for (let k = 0; k <= levels; k++) {
      const y = (k / levels) * HEIGHT;
      const h = half(y);
      out.push({ p: [0, y, -h], s: [h * 2, 0.07, 0.07], r: [0, 0, 0] });
      out.push({ p: [0, y, h], s: [h * 2, 0.07, 0.07], r: [0, 0, 0] });
      out.push({ p: [-h, y, 0], s: [0.07, 0.07, h * 2], r: [0, 0, 0] });
      out.push({ p: [h, y, 0], s: [0.07, 0.07, h * 2], r: [0, 0, 0] });
      if (k < levels) {
        const y2 = ((k + 1) / levels) * HEIGHT;
        const h2 = half(y2);
        const dy = y2 - y;
        const midH = (h + h2) / 2;
        const len = Math.hypot(h + h2, dy);
        const ang = Math.atan2(dy, h + h2);
        out.push({ p: [0, (y + y2) / 2, -midH], s: [len, 0.05, 0.05], r: [0, 0, ang * (k % 2 ? 1 : -1)] });
        out.push({ p: [0, (y + y2) / 2, midH], s: [len, 0.05, 0.05], r: [0, 0, ang * (k % 2 ? -1 : 1)] });
        out.push({ p: [-midH, (y + y2) / 2, 0], s: [0.05, 0.05, len], r: [ang * (k % 2 ? 1 : -1), 0, 0] });
        out.push({ p: [midH, (y + y2) / 2, 0], s: [0.05, 0.05, len], r: [ang * (k % 2 ? -1 : 1), 0, 0] });
      }
    }
    return out;
  }, []);

  return (
    <>
      {parts.map((b, i) => (
        <Box key={i} size={b.s} position={b.p} rotation={b.r} color={i % 3 === 0 ? "#d4553f" : "#e8e2d6"} />
      ))}
    </>
  );
}

export function Tower() {
  const [cx, cz] = LAYOUT.tower;
  const g = heightAt(cx, cz);
  const dish = useRef<Group>(null);
  const beacon = useRef<Mesh>(null);
  const waves = useRef<Group>(null);
  const radioFocused = useGame((s) => s.focus === "contact");
  const proofFocused = useGame((s) => s.focus === "proof");

  const beaconMat = useMemo(() => new MeshBasicMaterial({ color: new Color("#ff3b3b"), toneMapped: false }), []);

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    if (dish.current) dish.current.rotation.y += dt * 0.35;
    const on = (t % 1.6) < 0.5;
    beaconMat.color.set("#ff3b3b").multiplyScalar(on ? 4 : 0.6);
    if (beacon.current) beacon.current.scale.setScalar(on ? 1.15 : 1);
    if (waves.current) {
      waves.current.children.forEach((c, i) => {
        const k = ((t * 0.5 + i / 3) % 1);
        c.scale.setScalar(0.5 + k * 3);
        ((c as Mesh).material as MeshBasicMaterial).opacity = (1 - k) * 0.5;
      });
    }
  });

  const [rx, rz] = [cx - 2.2, cz + 2.4];
  const [px, pz] = [cx + 2.6, cz + 2.2];

  return (
    <group>
      <RigidBody type="fixed" colliders={false} userData={{ surface: "stone" }}>
        <CuboidCollider args={[BASE + 0.1, 1.2, BASE + 0.1]} position={[cx, g + 1.2, cz]} />
        <CuboidCollider args={[0.6, 0.5, 0.4]} position={[rx, heightAt(rx, rz) + 0.5, rz - 0.4]} />
        <CuboidCollider args={[0.5, 0.6, 0.2]} position={[px, heightAt(px, pz) + 0.6, pz - 0.3]} />
      </RigidBody>

      <group position={[cx, g, cz]}>
        <Box size={[BASE * 2 + 0.8, 0.3, BASE * 2 + 0.8]} position={[0, 0.15, 0]} color={PAL.stoneDark} />
        <Lattice />
        {/* platform + dish */}
        <Box size={[1.6, 0.1, 1.6]} position={[0, HEIGHT * 0.62, 0]} color={PAL.metal} />
        <group ref={dish} position={[0, HEIGHT * 0.62 + 0.6, 0]}>
          <mesh rotation-x={-Math.PI / 2.6} position={[0, 0.2, 0.5]} castShadow>
            <sphereGeometry args={[0.9, 20, 10, 0, Math.PI * 2, 0, Math.PI / 3.2]} />
            <meshToonMaterial color="#e8e2d6" side={2} />
          </mesh>
          <Cyl r={0.06} h={0.9} position={[0, 0, 0]} color={PAL.metal} />
        </group>
        {/* mast + beacon */}
        <Cyl r={0.05} h={2.2} position={[0, HEIGHT + 1.1, 0]} color={PAL.metal} />
        <mesh ref={beacon} position={[0, HEIGHT + 2.3, 0]} material={beaconMat}>
          <sphereGeometry args={[0.2, 14, 10]} />
        </mesh>
        <group ref={waves} position={[0, HEIGHT + 2.3, 0]}>
          {[0, 1, 2].map((i) => (
            <mesh key={i} rotation-x={Math.PI / 2}>
              <torusGeometry args={[0.5, 0.025, 6, 40]} />
              <meshBasicMaterial color={new Color("#57d18a").multiplyScalar(2)} transparent opacity={0.4} toneMapped={false} depthWrite={false} />
            </mesh>
          ))}
        </group>
      </group>

      {/* Radio desk — CONTACT */}
      <group position={[rx, heightAt(rx, rz), rz]}>
        <Box size={[1.2, 0.9, 0.7]} position={[0, 0.45, -0.4]} color={PAL.woodDark} />
        <Box size={[0.9, 0.42, 0.4]} position={[0, 1.11, -0.5]} color="#4a4f5c" />
        <mesh position={[0.18, 1.12, -0.295]} material={glow(radioFocused ? "#ffd27a" : "#57d18a", radioFocused ? 2.6 : 1.6)}>
          <planeGeometry args={[0.42, 0.2]} />
        </mesh>
        <Cyl r={0.07} h={0.04} position={[-0.25, 1.12, -0.29]} rotation={[Math.PI / 2, 0, 0]} color="#d9d2c4" />
        <Cyl r={0.018} h={0.7} position={[0.35, 1.65, -0.6]} color={PAL.metal} />
        <Label position={[0, 0.55, -0.04]} size={0.085} color="#ffd27a" font={FONT_MONO}>
          SEND A SIGNAL
        </Label>
        <Label position={[0, 0.4, -0.04]} size={0.05} color="#d9d2c4" font={FONT_MONO}>
          {contact.email.toUpperCase()}
        </Label>
      </group>

      {/* Proof plaque */}
      <group position={[px, heightAt(px, pz), pz]}>
        <Box size={[1.1, 1.3, 0.3]} position={[0, 0.65, -0.3]} color={PAL.stone} />
        <Box size={[0.9, 0.7, 0.04]} position={[0, 0.85, -0.13]} color={proofFocused ? "#ffd27a" : "#c9a34a"} />
        <Label position={[0, 1.05, -0.1]} size={0.09} color="#2b2b2f">
          PROOF
        </Label>
        <Label position={[0, 0.82, -0.1]} size={0.045} color="#3a3a46" font={FONT_MONO} maxWidth={0.8}>
          EVERY NUMBER LINKS TO SOMETHING YOU CAN CHECK
        </Label>
      </group>

      {/* Sign */}
      <group position={[cx - 4.5, heightAt(cx - 4.5, cz + 4.5), cz + 4.5]} rotation-y={-0.6}>
        <Box size={[0.1, 1.8, 0.1]} position={[0, 0.9, 0]} color={PAL.woodDark} />
        <Box size={[2.2, 0.55, 0.08]} position={[0, 1.7, 0]} color="#14201a" />
        <Label position={[0, 1.71, 0.05]} size={0.18} color="#57d18a">
          RADIO TOWER
        </Label>
      </group>
    </group>
  );
}
