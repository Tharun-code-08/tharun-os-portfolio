"use client";

import { useMemo } from "react";
import { RigidBody, TrimeshCollider } from "@react-three/rapier";
import { BufferAttribute, BufferGeometry, Color, MeshToonMaterial } from "three";
import { PAL, toonGradient } from "@/game/materials";
import { runtime } from "@/game/runtime";
import { coastRadius, heightAt, pathDistance, rng } from "@/game/terrain";
import { useGame, canControl } from "@/game/store";

const TAU = Math.PI * 2;

function smooth(a: number, b: number, x: number) {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

/**
 * The walkable top: a polar grid out to the coastline, so the edge follows
 * the shoreline exactly instead of a square mesh with its corners cut off.
 */
function buildTop(rings: number, segments: number, withColor: boolean) {
  const pos: number[] = [];
  const col: number[] = [];
  const idx: number[] = [];
  const c = new Color();
  const grass = new Color(PAL.grass);
  const grassDark = new Color(PAL.grassDark);
  const dry = new Color(PAL.grassDry);
  const sand = new Color(PAL.sand);
  const path = new Color(PAL.path);

  const paint = (x: number, z: number, h: number, edge: number) => {
    const n = 0.5 + 0.5 * Math.sin(x * 0.31 + Math.cos(z * 0.27) * 2) * Math.cos(z * 0.19 - x * 0.07);
    c.copy(grass).lerp(grassDark, n * 0.75);
    c.lerp(dry, smooth(2.2, 5.5, h) * 0.6);
    c.lerp(sand, smooth(-2.6, -0.4, edge));
    c.lerp(path, 1 - smooth(0.7, 1.5, pathDistance(x, z)));
    col.push(c.r, c.g, c.b);
  };

  pos.push(0, heightAt(0, 0), 0);
  if (withColor) paint(0, 0, heightAt(0, 0), -40);

  for (let i = 1; i <= rings; i++) {
    for (let j = 0; j < segments; j++) {
      const th = (j / segments) * TAU;
      const R = coastRadius(th);
      const r = (i / rings) * R;
      const x = Math.cos(th) * r;
      const z = Math.sin(th) * r;
      const h = heightAt(x, z);
      pos.push(x, h, z);
      if (withColor) paint(x, z, h, r - R);
    }
  }

  const ring = (i: number, j: number) => 1 + (i - 1) * segments + (j % segments);
  for (let j = 0; j < segments; j++) idx.push(0, ring(1, j + 1), ring(1, j));
  for (let i = 1; i < rings; i++) {
    for (let j = 0; j < segments; j++) {
      const a = ring(i, j);
      const b = ring(i, j + 1);
      const cc = ring(i + 1, j);
      const d = ring(i + 1, j + 1);
      idx.push(a, b, cc, b, d, cc);
    }
  }

  const g = new BufferGeometry();
  g.setAttribute("position", new BufferAttribute(new Float32Array(pos), 3));
  if (withColor) g.setAttribute("color", new BufferAttribute(new Float32Array(col), 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/**
 * The rock the island floats on: from the coastline down to a jagged point,
 * banded in warm-to-violet strata so it reads at dusk.
 */
function buildUnderside(segments: number, levels: number) {
  const rand = rng(7);
  const pos: number[] = [];
  const col: number[] = [];
  const idx: number[] = [];
  const top = new Color(PAL.dirt);
  const mid = new Color(PAL.rock);
  const deep = new Color(PAL.rockDeep);
  const c = new Color();
  const jitter = Array.from({ length: segments }, () => rand());

  for (let k = 0; k <= levels; k++) {
    const t = k / levels;
    for (let j = 0; j < segments; j++) {
      const th = (j / segments) * TAU;
      const R = coastRadius(th);
      const edgeX = Math.cos(th) * R;
      const edgeZ = Math.sin(th) * R;
      const edgeH = heightAt(edgeX, edgeZ);
      // A lip just under the grass, then the cone narrows to the tip.
      const lip = k === 0 ? 1 : k === 1 ? 1.015 : 1;
      const taper = k <= 1 ? 1 : Math.pow(1 - (t - 1 / levels) / (1 - 1 / levels), 1.25);
      const ragged = k <= 1 ? 1 : 1 + (jitter[(j + k * 3) % segments] - 0.5) * 0.22;
      const r = R * lip * taper * ragged * (k === levels ? 0 : 1);
      const y =
        k === 0 ? edgeH - 0.02 : k === 1 ? edgeH - 0.9 : edgeH - 0.9 - Math.pow(t, 0.85) * 30 - jitter[(j * 7 + k) % segments] * 2.4;
      pos.push(Math.cos(th) * r, y, Math.sin(th) * r);
      c.copy(top).lerp(mid, smooth(0.05, 0.4, t)).lerp(deep, smooth(0.35, 0.95, t));
      // Strata.
      const band = Math.sin(y * 1.3 + Math.sin(th * 3) * 0.8) > 0.55 ? 0.88 : 1;
      col.push(c.r * band, c.g * band, c.b * band);
    }
  }

  for (let k = 0; k < levels; k++) {
    for (let j = 0; j < segments; j++) {
      const a = k * segments + j;
      const b = k * segments + ((j + 1) % segments);
      const cc = (k + 1) * segments + j;
      const d = (k + 1) * segments + ((j + 1) % segments);
      idx.push(a, b, cc, b, d, cc);
    }
  }

  const g = new BufferGeometry();
  g.setAttribute("position", new BufferAttribute(new Float32Array(pos), 3));
  g.setAttribute("color", new BufferAttribute(new Float32Array(col), 3));
  g.setIndex(idx);
  // Flat shading: the facets are the point.
  const flat = g.toNonIndexed();
  flat.computeVertexNormals();
  return flat;
}

export function Island() {
  const top = useMemo(() => buildTop(62, 184, true), []);
  // A coarser copy of the top for physics, handed to Rapier as raw arrays.
  const collider = useMemo(() => {
    const g = buildTop(40, 120, false);
    const verts = new Float32Array(g.getAttribute("position").array);
    const index = new Uint32Array(g.getIndex()!.array);
    g.dispose();
    return [verts, index] as [Float32Array, Uint32Array];
  }, []);
  const under = useMemo(() => buildUnderside(96, 9), []);

  const topMat = useMemo(
    () => new MeshToonMaterial({ vertexColors: true, gradientMap: toonGradient() }),
    [],
  );
  const underMat = useMemo(
    () => new MeshToonMaterial({ vertexColors: true, gradientMap: toonGradient() }),
    [],
  );

  return (
    <group>
      <RigidBody type="fixed" colliders={false} userData={{ surface: "grass" }}>
        <TrimeshCollider args={collider} />
      </RigidBody>

      <mesh
        geometry={top}
        material={topMat}
        receiveShadow
        onClick={(e) => {
          // Tap / click the ground to walk there — unless that was a drag.
          if (e.delta > 6 || runtime.camera.dragging) return;
          if (!canControl(useGame.getState())) return;
          e.stopPropagation();
          runtime.input.moveTarget = e.point.clone();
        }}
      />
      <mesh geometry={under} material={underMat} castShadow />
    </group>
  );
}
