"use client";

import { Text } from "@react-three/drei";
import type { ComponentProps, ReactNode } from "react";
import type { ColorRepresentation, Material } from "three";
import { toon } from "@/game/materials";

/**
 * Tiny building blocks for props: a box, a cylinder, a sign. Everything casts
 * and receives shadows and shares the cached toon materials.
 */

type V3 = [number, number, number];

export const FONT_DISPLAY = "/fonts/unbounded-700.woff";
export const FONT_MONO = "/fonts/jetbrains-mono-500.woff";

export function Box({
  size,
  position,
  rotation,
  color,
  material,
  cast = true,
  children,
}: {
  size: V3;
  position?: V3;
  rotation?: V3;
  color?: ColorRepresentation;
  material?: Material;
  cast?: boolean;
  children?: ReactNode;
}) {
  return (
    <mesh position={position} rotation={rotation} material={material ?? toon(color ?? "#ffffff")} castShadow={cast} receiveShadow>
      <boxGeometry args={size} />
      {children}
    </mesh>
  );
}

export function Cyl({
  r,
  rTop,
  h,
  position,
  rotation,
  color,
  material,
  segments = 14,
  cast = true,
}: {
  r: number;
  rTop?: number;
  h: number;
  position?: V3;
  rotation?: V3;
  color?: ColorRepresentation;
  material?: Material;
  segments?: number;
  cast?: boolean;
}) {
  return (
    <mesh position={position} rotation={rotation} material={material ?? toon(color ?? "#ffffff")} castShadow={cast} receiveShadow>
      <cylinderGeometry args={[rTop ?? r, r, h, segments]} />
    </mesh>
  );
}

export function Label({
  children,
  size = 0.3,
  color = "#fff7e8",
  font = FONT_DISPLAY,
  ...rest
}: { children: string; size?: number; font?: string } & Omit<ComponentProps<typeof Text>, "children" | "font">) {
  return (
    <Text font={font} fontSize={size} color={color} anchorX="center" anchorY="middle" {...rest}>
      {children}
    </Text>
  );
}
