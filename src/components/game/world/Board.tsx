"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { BallCollider, CuboidCollider, RigidBody } from "@react-three/rapier";
import type { Group } from "three";
import { now } from "@/data/profile";
import { glow, PAL } from "@/game/materials";
import { useGame } from "@/game/store";
import { heightAt, LAYOUT } from "@/game/terrain";
import { INTERACTABLE_BY_ID } from "@/game/zones";
import { Box, FONT_MONO, Label } from "./kit";

const NOTE_COLORS = ["#fff4b8", "#ffd6e0", "#d6f0ff", "#e2ffd6"];

/** The notice board by the studio (NOW), and the recruiter stand by spawn. */
export function Board() {
  const [bx, bz] = LAYOUT.board;
  const by = heightAt(bx, bz);
  const notes = [...now.building, ...now.learning.slice(0, 1), ...now.thinkingAbout.slice(0, 1)];

  const rec = INTERACTABLE_BY_ID.recruiter.position;
  const recFocused = useGame((s) => s.focus === "recruiter");
  const arrow = useRef<Group>(null);
  useFrame((state) => {
    if (arrow.current) arrow.current.position.x = Math.sin(state.clock.elapsedTime * 4) * 0.06;
  });

  return (
    <group>
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[1.3, 1.1, 0.12]} position={[bx, by + 1.1, bz]} rotation={[0, -0.5, 0]} />
        <CuboidCollider args={[0.45, 0.5, 0.35]} position={[rec[0], rec[1] - 0.4, rec[2]]} />
      </RigidBody>

      <group position={[bx, by, bz]} rotation-y={-0.5}>
        <Box size={[0.12, 2.3, 0.12]} position={[-1.25, 1.15, 0]} color={PAL.woodDark} />
        <Box size={[0.12, 2.3, 0.12]} position={[1.25, 1.15, 0]} color={PAL.woodDark} />
        <Box size={[2.6, 1.5, 0.1]} position={[0, 1.45, 0]} color="#b8875a" />
        <Box size={[2.8, 0.14, 0.24]} position={[0, 2.27, 0]} color={PAL.roof} />
        <Label position={[0, 2.05, 0.07]} size={0.12} color="#2b2b2f">
          {`NOW · ${now.updated.toUpperCase()}`}
        </Label>
        {notes.slice(0, 3).map((text, i) => (
          <group key={i} position={[-0.8 + i * 0.8, 1.32 + (i % 2) * 0.08, 0.07]} rotation-z={(i - 1) * 0.06}>
            <Box size={[0.7, 0.72, 0.01]} color={NOTE_COLORS[i % NOTE_COLORS.length]} cast={false} />
            <mesh position={[0, 0.3, 0.012]} material={glow(PAL.red, 1)}>
              <sphereGeometry args={[0.03, 8, 6]} />
            </mesh>
            <Label
              position={[-0.3, 0.22, 0.012]}
              size={0.042}
              color="#2b2b2f"
              font={FONT_MONO}
              anchorX="left"
              anchorY="top"
              maxWidth={0.6}
              lineHeight={1.3}
            >
              {text.length > 110 ? `${text.slice(0, 107)}…` : text}
            </Label>
          </group>
        ))}
      </group>

      {/* Recruiter stand: a briefcase on a crate. */}
      <group position={[rec[0], rec[1] - 0.9, rec[2]]} rotation-y={0.4}>
        <Box size={[0.9, 0.6, 0.7]} position={[0, 0.3, 0]} color={PAL.wood} />
        <Box size={[0.62, 0.42, 0.18]} position={[0, 0.82, 0]} color={recFocused ? "#ffb020" : "#5a3a28"} />
        <Box size={[0.22, 0.06, 0.05]} position={[0, 1.06, 0]} color="#2b2b2f" />
        <Box size={[1.5, 0.42, 0.06]} position={[0, 1.55, -0.2]} color="#2b2b2f" />
        <group ref={arrow}>
          <Label position={[0, 1.6, -0.16]} size={0.09} color="#ffb020">
            SHORT ON TIME?
          </Label>
          <Label position={[0, 1.45, -0.16]} size={0.055} color="#d9d2c4" font={FONT_MONO}>
            ONE-PAGE RÉSUMÉ →
          </Label>
        </group>
      </group>

      {/* A ball, because every island needs one. */}
      <RigidBody
        type="dynamic"
        colliders={false}
        position={[LAYOUT.spawn[0] + 3, heightAt(LAYOUT.spawn[0] + 3, LAYOUT.spawn[1] - 2) + 1, LAYOUT.spawn[1] - 2]}
        restitution={0.7}
        friction={0.6}
        linearDamping={0.4}
        angularDamping={0.4}
      >
        <BallCollider args={[0.32]} mass={0.4} />
        <mesh castShadow>
          <icosahedronGeometry args={[0.32, 2]} />
          <meshToonMaterial color="#f1e4cf" />
        </mesh>
        <mesh rotation-x={Math.PI / 2}>
          <torusGeometry args={[0.322, 0.03, 6, 24]} />
          <meshToonMaterial color={PAL.red} />
        </mesh>
      </RigidBody>
    </group>
  );
}
