"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { CuboidCollider, RigidBody } from "@react-three/rapier";
import { CanvasTexture, Color, MeshBasicMaterial, SRGBColorSpace, type PointLight } from "three";
import { profile } from "@/data/profile";
import { PAL, toon } from "@/game/materials";
import { liveSky } from "@/game/sky";
import { useGame } from "@/game/store";
import { STUDIO } from "@/game/zones";
import { Box, Cyl, FONT_MONO, Label } from "./kit";

const W = STUDIO.width;
const D = STUDIO.depth;
const H = 3.2;

/** The CRT's screen: a live canvas with the OS waiting at a prompt. */
function useScreen() {
  const canvas = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 320;
    c.height = 250;
    return c;
  }, []);
  const texture = useMemo(() => {
    const t = new CanvasTexture(canvas);
    t.colorSpace = SRGBColorSpace;
    return t;
  }, [canvas]);

  useEffect(() => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let tick = 0;
    const draw = () => {
      tick++;
      const focused = useGame.getState().focus === "pc";
      ctx.fillStyle = "#06140d";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "rgba(95, 211, 141, 0.06)";
      for (let y = 0; y < canvas.height; y += 3) ctx.fillRect(0, y, canvas.width, 1);
      ctx.fillStyle = "#5fd38d";
      ctx.font = "bold 22px monospace";
      ctx.fillText(profile.os.name, 18, 40);
      ctx.font = "15px monospace";
      ctx.fillStyle = "#3fa86c";
      ctx.fillText(`v${profile.os.version} · ${profile.os.edition}`, 18, 64);
      const lines = ["> mounting /work ......... ok", "> build log ............. ok", "> deployments ........... live"];
      lines.forEach((l, i) => ctx.fillText(l, 18, 100 + i * 22));
      ctx.fillStyle = focused ? "#ffd27a" : "#5fd38d";
      ctx.font = "bold 16px monospace";
      const cursor = tick % 2 === 0 ? "█" : " ";
      ctx.fillText(focused ? `PRESS E TO BOOT ${cursor}` : `> _${cursor}`, 18, 200);
      texture.needsUpdate = true;
    };
    draw();
    const id = window.setInterval(draw, 480);
    return () => clearInterval(id);
  }, [canvas, texture]);

  return texture;
}

export function Studio() {
  const [cx, cz] = STUDIO.center;
  const f = STUDIO.floor;
  const [dx, dz] = [STUDIO.desk[0] - cx, STUDIO.desk[1] - cz];
  const screen = useScreen();
  const lamp = useRef<PointLight>(null);

  const mats = useMemo(
    () => ({
      screen: new MeshBasicMaterial({ map: screen, toneMapped: false, color: new Color(1.6, 1.6, 1.6) }),
      window: new MeshBasicMaterial({ color: new Color("#ffcf8a"), toneMapped: false, transparent: true, opacity: 0.35 }),
      bulb: new MeshBasicMaterial({ color: new Color("#ffd9a0"), toneMapped: false }),
    }),
    [screen],
  );

  // Lamps and windows come up as the light goes down.
  useFrame(() => {
    const n = liveSky.night;
    if (lamp.current) lamp.current.intensity = 2 + n * 10;
    mats.window.opacity = 0.18 + n * 0.55;
    mats.window.color.setRGB(1 + n * 1.6, 0.81 + n * 1.2, 0.54 + n * 0.6);
    mats.bulb.color.setRGB(1 + n * 3, 0.85 + n * 2.4, 0.63 + n * 1.5);
  });

  const books = useMemo(() => {
    const colors = ["#d4553f", "#3f7dd4", "#e8c04a", "#4fa36a", "#8a5ad4", "#f1e4cf", "#2b2b2f"];
    const out: { x: number; y: number; w: number; h: number; c: string }[] = [];
    for (let shelf = 0; shelf < 4; shelf++) {
      let x = -0.7;
      let i = shelf * 3;
      while (x < 0.62) {
        const w = 0.07 + ((i * 37) % 5) * 0.015;
        const h = 0.26 + ((i * 53) % 4) * 0.035;
        out.push({ x: x + w / 2, y: 0.12 + shelf * 0.5 + h / 2, w, h, c: colors[i % colors.length] });
        x += w + 0.012;
        i++;
      }
    }
    return out;
  }, []);

  return (
    <group position={[cx, 0, cz]}>
      <RigidBody type="fixed" colliders={false} userData={{ surface: "wood" }}>
        {/* deck */}
        <CuboidCollider args={[W / 2 + 0.5, 0.2, D / 2 + 0.7]} position={[0, f - 0.2, 0.3]} />
        {/* walls */}
        <CuboidCollider args={[W / 2, H / 2, 0.14]} position={[0, f + H / 2, -D / 2]} />
        <CuboidCollider args={[0.14, H / 2, D / 2]} position={[-W / 2, f + H / 2, 0]} />
        <CuboidCollider args={[0.14, H / 2, D / 2]} position={[W / 2, f + H / 2, 0]} />
        {/* roof */}
        <CuboidCollider args={[W / 2 + 0.7, 0.15, D / 2 + 0.9]} position={[0, f + H + 0.25, 0.2]} rotation={[0.07, 0, 0]} />
        {/* desk, shelf, couch */}
        <CuboidCollider args={[0.95, 0.4, 0.42]} position={[dx, f + 0.4, dz]} />
        <CuboidCollider args={[0.22, 1.1, 0.8]} position={[-W / 2 + 0.38, f + 1.1, -1.2]} />
        <CuboidCollider args={[1.1, 0.35, 0.45]} position={[-2.4, f + 0.35, 2.3]} />
      </RigidBody>

      {/* Deck + porch */}
      <Box size={[W + 1, 0.4, D + 1.4]} position={[0, f - 0.2, 0.3]} color={PAL.woodLight} />
      {Array.from({ length: 12 }, (_, i) => (
        <Box key={i} size={[0.03, 0.02, D + 1.38]} position={[-W / 2 + 0.4 + i * 0.85, f + 0.005, 0.3]} color={PAL.wood} cast={false} />
      ))}
      <Box size={[3.4, 0.16, 0.6]} position={[0, f - 0.32, D / 2 + 1.2]} color={PAL.wood} />

      {/* Walls */}
      <Box size={[W, H, 0.25]} position={[0, f + H / 2, -D / 2]} color={PAL.wall} />
      <Box size={[0.25, H, D]} position={[-W / 2, f + H / 2, 0]} color={PAL.wall} />
      <Box size={[0.25, 1.05, D]} position={[W / 2, f + 0.52, 0]} color={PAL.wall} />
      <Box size={[0.25, 0.55, D]} position={[W / 2, f + H - 0.27, 0]} color={PAL.wall} />
      {[-D / 2 + 0.12, -1.3, 1.3, D / 2 - 0.12].map((z) => (
        <Box key={z} size={[0.3, H - 1.6, 0.18]} position={[W / 2, f + 1.85, z]} color={PAL.woodDark} />
      ))}
      <mesh position={[W / 2, f + 1.85, 0]} rotation-y={Math.PI / 2} material={mats.window}>
        <planeGeometry args={[D - 0.2, H - 1.6]} />
      </mesh>
      {/* corner posts + front beam */}
      {[-W / 2, W / 2].map((x) => (
        <Box key={x} size={[0.32, H + 0.1, 0.32]} position={[x, f + H / 2, D / 2]} color={PAL.woodDark} />
      ))}
      <Box size={[W + 0.3, 0.3, 0.3]} position={[0, f + H - 0.1, D / 2]} color={PAL.woodDark} />

      {/* Roof */}
      <Box size={[W + 1.4, 0.26, D + 1.8]} position={[0, f + H + 0.25, 0.2]} rotation={[0.07, 0, 0]} color={PAL.roof} />
      <Box size={[W + 1.5, 0.12, 0.3]} position={[0, f + H - 0.05, D / 2 + 1.1]} rotation={[0.07, 0, 0]} color={PAL.roofDark} />

      {/* Sign */}
      <Box size={[2.6, 0.6, 0.08]} position={[0, f + H + 0.75, D / 2 + 0.95]} color={PAL.woodDark} />
      <Label position={[0, f + H + 0.76, D / 2 + 1.0]} size={0.26} color="#ffd27a">
        STUDIO
      </Label>

      {/* Rug */}
      <mesh rotation-x={-Math.PI / 2} position={[0.4, f + 0.012, -0.4]} material={toon("#7a3b5a")} receiveShadow>
        <circleGeometry args={[2.1, 28]} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0.4, f + 0.014, -0.4]} material={toon("#a85a6a")} receiveShadow>
        <ringGeometry args={[1.5, 1.7, 28]} />
      </mesh>

      {/* Desk */}
      <group position={[dx, f, dz]}>
        <Box size={[1.9, 0.07, 0.85]} position={[0, 0.76, 0]} color={PAL.wood} />
        {[
          [-0.88, -0.36],
          [0.88, -0.36],
          [-0.88, 0.36],
          [0.88, 0.36],
        ].map(([x, z]) => (
          <Box key={`${x}${z}`} size={[0.07, 0.76, 0.07]} position={[x, 0.38, z]} color={PAL.woodDark} />
        ))}
        {/* CRT */}
        <Box size={[0.3, 0.06, 0.3]} position={[0, 0.82, -0.04]} color={PAL.metal} />
        <Box size={[0.64, 0.54, 0.5]} position={[0, 1.12, -0.04]} color="#d9d2c4" />
        <Box size={[0.5, 0.42, 0.3]} position={[0, 1.12, -0.36]} color="#c9c2b4" />
        <mesh position={[0, 1.12, 0.214]} material={mats.screen}>
          <planeGeometry args={[0.5, 0.39]} />
        </mesh>
        <Box size={[0.6, 0.06, 0.2]} position={[0, 0.81, 0.3]} color="#e8e2d6" />
        {/* Lamp */}
        <Cyl r={0.12} h={0.03} position={[-0.7, 0.8, -0.15]} color={PAL.metal} />
        <Cyl r={0.015} h={0.45} position={[-0.7, 1.02, -0.15]} color={PAL.metal} />
        <mesh position={[-0.7, 1.28, -0.12]} rotation-x={0.4} material={toon(PAL.accent)} castShadow>
          <coneGeometry args={[0.16, 0.18, 14, 1, true]} />
        </mesh>
        <mesh position={[-0.7, 1.22, -0.1]} material={mats.bulb}>
          <sphereGeometry args={[0.05, 10, 8]} />
        </mesh>
        <pointLight ref={lamp} position={[-0.7, 1.3, 0.1]} color="#ffc27a" distance={7} decay={1.6} />
        {/* Mug */}
        <Cyl r={0.05} h={0.11} position={[0.7, 0.85, 0.15]} color="#f1e4cf" />
      </group>

      {/* Chair */}
      <group position={[dx, f, dz + 0.95]}>
        <Box size={[0.55, 0.08, 0.5]} position={[0, 0.5, 0]} color="#2b2b2f" />
        <Box size={[0.55, 0.6, 0.07]} position={[0, 0.85, 0.24]} color="#2b2b2f" />
        <Cyl r={0.04} h={0.46} position={[0, 0.25, 0]} color={PAL.metal} />
        <Cyl r={0.26} h={0.04} position={[0, 0.03, 0]} color={PAL.metal} />
      </group>

      {/* Bookshelf on the west wall */}
      <group position={[-W / 2 + 0.38, f, -1.2]} rotation-y={Math.PI / 2}>
        <Box size={[1.6, 2.2, 0.42]} position={[0, 1.1, 0]} color={PAL.woodDark} />
        {[0.1, 0.6, 1.1, 1.6, 2.1].map((y) => (
          <Box key={y} size={[1.52, 0.04, 0.4]} position={[0, y, 0.02]} color={PAL.wood} />
        ))}
        {books.map((b, i) => (
          <Box key={i} size={[b.w, b.h, 0.3]} position={[b.x, b.y, 0.06]} color={b.c} />
        ))}
      </group>

      {/* ID card on the west wall — opens ME */}
      <group position={[-W / 2 + 0.15, f + 1.55, 1.6]} rotation-y={Math.PI / 2}>
        <Box size={[1.5, 1.0, 0.05]} color="#c99a68" />
        <Box size={[1.36, 0.86, 0.02]} position={[0, 0, 0.03]} color="#f6efe2" />
        <Box size={[0.42, 0.52, 0.02]} position={[-0.42, 0.04, 0.045]} color={PAL.shirt} />
        <Label position={[-0.42, 0.06, 0.06]} size={0.18}>
          TG
        </Label>
        <Label position={[0.25, 0.22, 0.05]} size={0.075} color="#2b2b2f" anchorX="center" maxWidth={0.8}>
          {profile.name.toUpperCase()}
        </Label>
        <Label position={[0.25, 0.04, 0.05]} size={0.06} color="#8a5a3c" font={FONT_MONO}>
          {profile.role.toUpperCase()}
        </Label>
        <Label position={[0.25, -0.1, 0.05]} size={0.055} color="#6d6a60" font={FONT_MONO}>
          {profile.location.toUpperCase()}
        </Label>
        <Box size={[0.8, 0.07, 0.02]} position={[0.25, -0.28, 0.045]} color="#2b2b2f" />
      </group>

      {/* Poster on the back wall */}
      <group position={[-1.6, f + 1.9, -D / 2 + 0.14]}>
        <Box size={[2.2, 1.1, 0.04]} color="#1d1d21" />
        <Label position={[0, 0.15, 0.03]} size={0.2} color="#ffb020">
          STILL BUILDING.
        </Label>
        <Label position={[0, -0.22, 0.03]} size={0.075} color="#8d93a3" font={FONT_MONO}>
          {profile.status.what.toUpperCase()}
        </Label>
      </group>

      {/* Couch */}
      <group position={[-2.4, f, 2.3]}>
        <Box size={[2.2, 0.42, 0.9]} position={[0, 0.25, 0]} color="#4a6a8a" />
        <Box size={[2.2, 0.55, 0.22]} position={[0, 0.65, -0.36]} color="#3f5a78" />
        <Box size={[0.22, 0.5, 0.9]} position={[-1.1, 0.45, 0]} color="#3f5a78" />
        <Box size={[0.22, 0.5, 0.9]} position={[1.1, 0.45, 0]} color="#3f5a78" />
        <Box size={[0.45, 0.35, 0.12]} position={[-0.55, 0.62, -0.18]} rotation={[-0.2, 0.15, 0]} color={PAL.accent} />
      </group>

      {/* Plant */}
      <group position={[4.2, f, -3.2]}>
        <Cyl r={0.26} rTop={0.3} h={0.5} position={[0, 0.25, 0]} color="#9c6a45" />
        {[
          [0, 0.85, 0, 0.38],
          [0.18, 1.15, 0.05, 0.28],
          [-0.15, 1.1, -0.08, 0.3],
          [0.02, 1.38, -0.02, 0.22],
        ].map(([x, y, z, r], i) => (
          <mesh key={i} position={[x, y, z]} material={toon(i % 2 ? PAL.leafLight : PAL.leaf)} castShadow>
            <icosahedronGeometry args={[r, 0]} />
          </mesh>
        ))}
      </group>

      {/* Ceiling light */}
      <mesh position={[0.4, f + H - 0.25, -0.4]} material={mats.bulb}>
        <sphereGeometry args={[0.12, 12, 10]} />
      </mesh>
      <Cyl r={0.01} h={0.25} position={[0.4, f + H - 0.1, -0.4]} color={PAL.metal} cast={false} />
    </group>
  );
}
