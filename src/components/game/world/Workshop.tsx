"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { CuboidCollider, CylinderCollider, RigidBody } from "@react-three/rapier";
import { Color, MeshBasicMaterial, type Group } from "three";
import type { Project } from "@/data/projects";
import { sites } from "@/data/sites";
import { glow, PAL } from "@/game/materials";
import { liveSky } from "@/game/sky";
import { useGame } from "@/game/store";
import { heightAt, LAYOUT } from "@/game/terrain";
import { PROJECT_SLOTS } from "@/game/zones";
import { Box, Cyl, FONT_MONO, Label } from "./kit";

const STATUS: Record<Project["status"], { color: string; label: string }> = {
  building: { color: "#ffb020", label: "● BUILDING" },
  shipped: { color: "#57d18a", label: "● SHIPPED" },
  archived: { color: "#8da2c0", label: "○ ARCHIVED" },
};

function Hologram({ project, x, z, facing, i }: { project: Project; x: number; z: number; facing: number; i: number }) {
  const focused = useGame((s) => s.focus === `project:${project.id}`);
  const card = useRef<Group>(null);
  const status = STATUS[project.status];
  const y = heightAt(x, z);

  const mats = useMemo(
    () => ({
      glass: new MeshBasicMaterial({ color: "#0a1224", transparent: true, opacity: 0.78, depthWrite: false }),
      frame: new MeshBasicMaterial({ color: new Color(status.color).multiplyScalar(1.8), toneMapped: false }),
    }),
    [status.color],
  );

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    if (!card.current) return;
    card.current.position.y = 1.85 + Math.sin(t * 1.3 + i) * 0.06;
    card.current.rotation.y = Math.sin(t * 0.6 + i * 1.7) * 0.06;
    const s = card.current.scale.x + ((focused ? 1.1 : 1) - card.current.scale.x) * (1 - Math.exp(-10 * dt));
    card.current.scale.setScalar(s);
    mats.frame.color.set(status.color).multiplyScalar(focused ? 3.2 : 1.6);
  });

  return (
    <group position={[x, y, z]} rotation-y={facing}>
      <Cyl r={0.48} rTop={0.42} h={0.8} position={[0, 0.4, 0]} color={PAL.stone} segments={6} />
      <Cyl r={0.44} h={0.04} position={[0, 0.82, 0]} material={glow(status.color, 1.8)} segments={6} cast={false} />
      {/* light beam up into the card */}
      <mesh position={[0, 1.25, 0]} material={glow(status.color, 1.2, 0.12)}>
        <cylinderGeometry args={[0.38, 0.12, 0.8, 6, 1, true]} />
      </mesh>

      <group ref={card} position-y={1.85}>
        <mesh material={mats.glass}>
          <planeGeometry args={[1.6, 1.0]} />
        </mesh>
        {[
          [0, 0.5, 1.6, 0.025],
          [0, -0.5, 1.6, 0.025],
          [-0.8, 0, 0.025, 1.0],
          [0.8, 0, 0.025, 1.0],
        ].map(([px, py, w, h], k) => (
          <mesh key={k} position={[px, py, 0.005]} material={mats.frame}>
            <planeGeometry args={[w, h]} />
          </mesh>
        ))}
        <Label position={[-0.66, 0.36, 0.01]} size={0.07} color={status.color} font={FONT_MONO} anchorX="left">
          {`${project.index} · ${project.kind.toUpperCase()}`}
        </Label>
        {/* Long names drop a size so they wrap to two lines, not three. */}
        <Label
          position={[-0.66, 0.12, 0.01]}
          size={project.name.length > 16 ? 0.09 : 0.15}
          anchorX="left"
          maxWidth={1.35}
          lineHeight={1.05}
        >
          {project.name}
        </Label>
        <Label
          position={[-0.66, -0.17, 0.01]}
          size={0.052}
          color="#b8c0d4"
          font={FONT_MONO}
          anchorX="left"
          anchorY="top"
          maxWidth={1.32}
          lineHeight={1.35}
        >
          {project.summary.length > 120 ? `${project.summary.slice(0, 117)}…` : project.summary}
        </Label>
        <Label position={[-0.66, -0.42, 0.01]} size={0.05} color={status.color} font={FONT_MONO} anchorX="left">
          {`${status.label}  ·  ${project.period.toUpperCase()}`}
        </Label>
        {/* back face so it reads from behind too */}
        <mesh rotation-y={Math.PI} material={mats.glass}>
          <planeGeometry args={[1.6, 1.0]} />
        </mesh>
      </group>
    </group>
  );
}

function StringLights({ from, to, sag = 0.8 }: { from: [number, number, number]; to: [number, number, number]; sag?: number }) {
  const bulbs = useMemo(() => {
    const out: [number, number, number][] = [];
    const n = 10;
    for (let i = 1; i < n; i++) {
      const t = i / n;
      out.push([
        from[0] + (to[0] - from[0]) * t,
        from[1] + (to[1] - from[1]) * t - Math.sin(t * Math.PI) * sag,
        from[2] + (to[2] - from[2]) * t,
      ]);
    }
    return out;
  }, [from, to, sag]);

  const mat = useMemo(() => new MeshBasicMaterial({ color: new Color("#ffcf7a"), toneMapped: false }), []);
  useFrame(() => mat.color.setRGB(1 + liveSky.night * 2.4, 0.8 + liveSky.night * 1.6, 0.48 + liveSky.night * 0.6));

  return (
    <>
      {bulbs.map((p, i) => (
        <mesh key={i} position={p} material={mat}>
          <sphereGeometry args={[0.07, 8, 6]} />
        </mesh>
      ))}
    </>
  );
}

export function Workshop() {
  const [cx, cz] = LAYOUT.workshop;
  const g = heightAt(cx, cz);
  // The latest thing that's live, shown on the billboard.
  const live = sites.find((s) => s.id === "pitchmyweb") ?? sites[0];
  const [bx, bz] = [cx - 7, cz + 5];
  const bg = heightAt(bx, bz);

  const poles: [number, number][] = [
    [cx - 6.5, cz - 6],
    [cx + 6.5, cz - 6],
    [cx + 6.5, cz + 6],
    [cx - 6.5, cz + 6],
  ];

  return (
    <group>
      <RigidBody type="fixed" colliders={false} userData={{ surface: "stone" }}>
        <CuboidCollider args={[1.3, 0.45, 0.6]} position={[cx, g + 0.45, cz]} />
        {PROJECT_SLOTS.map(({ project, x, z }) => (
          <CylinderCollider key={project.id} args={[0.4, 0.46]} position={[x, heightAt(x, z) + 0.4, z]} />
        ))}
        {poles.map(([x, z]) => (
          <CylinderCollider key={`${x}${z}`} args={[1.7, 0.1]} position={[x, heightAt(x, z) + 1.7, z]} />
        ))}
        <CuboidCollider args={[1.7, 1.4, 0.15]} position={[bx, bg + 1.4, bz]} rotation={[0, 0.5, 0]} />
      </RigidBody>

      {/* Plaza */}
      <Cyl r={8.6} h={0.12} position={[cx, g + 0.0, cz]} color="#c9b49a" segments={40} cast={false} />
      <Cyl r={2.4} h={0.14} position={[cx, g + 0.01, cz]} color="#b09a80" segments={40} cast={false} />

      {/* Workbench */}
      <group position={[cx, g, cz]}>
        <Box size={[2.6, 0.12, 1.2]} position={[0, 0.9, 0]} color={PAL.wood} />
        {[
          [-1.2, -0.5],
          [1.2, -0.5],
          [-1.2, 0.5],
          [1.2, 0.5],
        ].map(([x, z]) => (
          <Box key={`${x}${z}`} size={[0.12, 0.9, 0.12]} position={[x, 0.45, z]} color={PAL.woodDark} />
        ))}
        <Box size={[2.4, 0.06, 1.0]} position={[0, 0.3, 0]} color={PAL.woodDark} />
        {/* laptop */}
        <Box size={[0.6, 0.03, 0.42]} position={[-0.5, 0.98, 0.1]} color={PAL.metalLight} />
        <mesh position={[-0.5, 1.18, -0.1]} rotation-x={-0.25} material={glow("#6aa6ff", 1.6)}>
          <planeGeometry args={[0.56, 0.36]} />
        </mesh>
        <Box size={[0.6, 0.4, 0.02]} position={[-0.5, 1.18, -0.115]} rotation={[-0.25, 0, 0]} color={PAL.metal} />
        {/* vise + tools */}
        <Box size={[0.25, 0.2, 0.2]} position={[0.8, 1.06, 0.2]} color={PAL.metal} />
        <Box size={[0.5, 0.04, 0.06]} position={[0.5, 0.98, -0.3]} rotation={[0, 0.4, 0]} color={PAL.red} />
        <Cyl r={0.12} h={0.16} position={[0.3, 1.04, 0.3]} color="#e8c04a" />
        <Label position={[0, 0.9, 0.62]} size={0.11} color="#2b2b2f" font={FONT_MONO}>
          ALL PROJECTS
        </Label>
      </group>

      {PROJECT_SLOTS.map((s, i) => (
        <Hologram key={s.project.id} {...s} i={i} />
      ))}

      {/* String lights over the plaza */}
      {poles.map(([x, z]) => (
        <Cyl key={`${x}${z}`} r={0.08} h={3.4} position={[x, heightAt(x, z) + 1.7, z]} color={PAL.woodDark} fade />
      ))}
      {poles.map(([x, z], i) => {
        const [nx, nz] = poles[(i + 1) % poles.length];
        return (
          <StringLights
            key={i}
            from={[x, heightAt(x, z) + 3.35, z]}
            to={[nx, heightAt(nx, nz) + 3.35, nz]}
          />
        );
      })}

      {/* Sign */}
      <group position={[cx - 9.4, heightAt(cx - 9.4, cz - 1.5), cz - 1.5]} rotation-y={-Math.PI / 2}>
        <Box size={[0.12, 2.2, 0.12]} position={[-1.2, 1.1, 0]} color={PAL.woodDark} />
        <Box size={[0.12, 2.2, 0.12]} position={[1.2, 1.1, 0]} color={PAL.woodDark} />
        <Box size={[2.8, 0.7, 0.1]} position={[0, 2.0, 0]} color="#2b2b2f" />
        <Label position={[0, 2.02, 0.06]} size={0.22} color="#ff7a45">
          THE WORKSHOP
        </Label>
      </group>

      {/* Live billboard */}
      {live ? (
        <group position={[bx, bg, bz]} rotation-y={0.5}>
          <Box size={[0.16, 2.8, 0.16]} position={[-1.5, 1.4, 0]} color={PAL.metal} />
          <Box size={[0.16, 2.8, 0.16]} position={[1.5, 1.4, 0]} color={PAL.metal} />
          <Box size={[3.3, 1.9, 0.14]} position={[0, 2.0, -0.05]} color="#1d1d21" />
          <mesh position={[0, 2.0, 0.03]} material={glow("#141a30", 1)}>
            <planeGeometry args={[3.1, 1.7]} />
          </mesh>
          <Label position={[-1.35, 2.6, 0.05]} size={0.11} color="#57d18a" font={FONT_MONO} anchorX="left">
            ● LIVE NOW
          </Label>
          <Label position={[-1.35, 2.18, 0.05]} size={0.3} anchorX="left">
            {live.label}
          </Label>
          <Label position={[-1.35, 1.78, 0.05]} size={0.085} color="#b8c0d4" font={FONT_MONO} anchorX="left" maxWidth={2.7}>
            {live.note}
          </Label>
          <Label position={[-1.35, 1.4, 0.05]} size={0.09} color="#ffb020" font={FONT_MONO} anchorX="left">
            {live.url.replace("https://", "").toUpperCase()}
          </Label>
        </group>
      ) : null}
    </group>
  );
}

