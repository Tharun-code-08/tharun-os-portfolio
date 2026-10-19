"use client";

import { Text } from "@react-three/drei";
import { useMemo, type ComponentProps, type ReactNode } from "react";
import { DoubleSide, FrontSide, MeshBasicMaterial, type ColorRepresentation, type Material } from "three";
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
  fade = false,
  children,
}: {
  size: V3;
  position?: V3;
  rotation?: V3;
  color?: ColorRepresentation;
  material?: Material;
  cast?: boolean;
  /** Dissolve near the camera (posts, poles). */
  fade?: boolean;
  children?: ReactNode;
}) {
  return (
    <mesh
      position={position}
      rotation={rotation}
      material={material ?? toon(color ?? "#ffffff", { fade })}
      castShadow={cast}
      receiveShadow
    >
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
  fade = false,
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
  /** Dissolve near the camera (posts, poles). */
  fade?: boolean;
}) {
  return (
    <mesh
      position={position}
      rotation={rotation}
      material={material ?? toon(color ?? "#ffffff", { fade })}
      castShadow={cast}
      receiveShadow
    >
      <cylinderGeometry args={[rTop ?? r, r, h, segments]} />
    </mesh>
  );
}

/**
 * Text on a sign, a card or a plaque. Front side only: from behind you see the
 * back of whatever it is printed on, never the words mirrored. Each label gets
 * its own material because troika writes the colour into it.
 */
export function Label({
  children,
  size = 0.3,
  color = "#fff7e8",
  font = FONT_DISPLAY,
  doubleSided = false,
  ...rest
}: { children: string; size?: number; font?: string; doubleSided?: boolean } & Omit<
  ComponentProps<typeof Text>,
  "children" | "font"
>) {
  const material = useMemo(
    () => new MeshBasicMaterial({ transparent: true, side: doubleSided ? DoubleSide : FrontSide }),
    [doubleSided],
  );
  return (
    <Text font={font} fontSize={size} color={color} anchorX="center" anchorY="middle" material={material} {...rest}>
      {children}
    </Text>
  );
}
