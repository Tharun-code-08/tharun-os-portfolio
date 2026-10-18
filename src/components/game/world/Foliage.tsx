"use client";

import { useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { CylinderCollider, BallCollider, RigidBody } from "@react-three/rapier";
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  ConeGeometry,
  CylinderGeometry,
  DodecahedronGeometry,
  IcosahedronGeometry,
  InstancedBufferAttribute,
  InstancedBufferGeometry,
  InstancedMesh,
  MeshToonMaterial,
  Object3D,
  Points,
  ShaderMaterial,
  UniformsLib,
  UniformsUtils,
} from "three";
import { faceted, nearFade, PAL, toonGradient } from "@/game/materials";
import { QUALITY } from "@/game/quality";
import { liveSky } from "@/game/sky";
import { effectiveQuality, useGame } from "@/game/store";
import { coastRadius, heightAt, insideIsland, pathDistance, rng, SPRING_THETA } from "@/game/terrain";
import { ZONES } from "@/game/zones";

/** Keep plants off paths, out of the places, and away from the cliff edge. */
const SPRING: [number, number] = [Math.cos(SPRING_THETA) * 38, Math.sin(SPRING_THETA) * 38];

function clear(x: number, z: number, margin: number) {
  if (!insideIsland(x, z, margin)) return false;
  if (Math.hypot(x - SPRING[0], z - SPRING[1]) < 5) return false;
  if (pathDistance(x, z) < 1.8) return false;
  for (const zone of ZONES) {
    if (zone.radius === 0) continue;
    const r = zone.id === "board" ? 3 : zone.radius - 0.5;
    if (Math.hypot(x - zone.center[0], z - zone.center[1]) < r) return false;
  }
  return true;
}

type Tree = { x: number; z: number; y: number; s: number; kind: number; rot: number };

function scatterTrees(count: number): Tree[] {
  const rand = rng(1234);
  const out: Tree[] = [];
  let tries = 0;
  while (out.length < count && tries++ < count * 40) {
    const a = rand() * Math.PI * 2;
    // Bias toward the outer ring so the middle stays open and readable.
    const r = Math.sqrt(0.25 + rand() * 0.75) * coastRadius(a);
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    if (!clear(x, z, 2.4)) continue;
    if (out.some((t) => Math.hypot(t.x - x, t.z - z) < 3.2)) continue;
    out.push({ x, z, y: heightAt(x, z), s: 0.8 + rand() * 0.7, kind: rand() < 0.22 ? 1 : 0, rot: rand() * Math.PI * 2 });
  }
  return out;
}

function Trees({ density }: { density: number }) {
  const trees = useMemo(() => scatterTrees(Math.round(78 * density)), [density]);

  const meshes = useMemo(() => {
    const grad = toonGradient();
    const trunk = new InstancedMesh(
      new CylinderGeometry(0.16, 0.24, 1.6, 7),
      nearFade(new MeshToonMaterial({ color: PAL.trunk, gradientMap: grad })),
      trees.length,
    );
    const round = trees.filter((t) => t.kind === 0);
    const pine = trees.filter((t) => t.kind === 1);
    const crown = new InstancedMesh(
      faceted(new IcosahedronGeometry(1, 0)),
      nearFade(new MeshToonMaterial({ color: "#ffffff", gradientMap: grad })),
      round.length * 3,
    );
    const cone = new InstancedMesh(
      faceted(new ConeGeometry(1, 1.6, 7)),
      nearFade(new MeshToonMaterial({ color: "#ffffff", gradientMap: grad })),
      pine.length * 3,
    );
    const o = new Object3D();
    const c = new Color();
    const greens = [PAL.leaf, PAL.leafLight, "#5f9a4a", PAL.leafWarm];

    trees.forEach((t, i) => {
      o.position.set(t.x, t.y + 0.8 * t.s, t.z);
      o.scale.set(t.s, t.s, t.s);
      o.rotation.set(0, t.rot, 0);
      o.updateMatrix();
      trunk.setMatrixAt(i, o.matrix);
    });
    round.forEach((t, i) => {
      const base = greens[i % 7 === 0 ? 3 : i % 3];
      [
        [0, 2.0, 0, 1.25],
        [0.55, 2.55, 0.2, 0.85],
        [-0.45, 2.7, -0.25, 0.75],
      ].forEach(([dx, dy, dz, r], k) => {
        o.position.set(t.x + dx * t.s, t.y + dy * t.s, t.z + dz * t.s);
        o.scale.setScalar(r * t.s);
        o.rotation.set(t.rot + k, t.rot * 0.5, 0);
        o.updateMatrix();
        crown.setMatrixAt(i * 3 + k, o.matrix);
        crown.setColorAt(i * 3 + k, c.set(base).offsetHSL(0, 0, (k - 1) * 0.04));
      });
    });
    pine.forEach((t, i) => {
      [
        [1.7, 1.2],
        [2.5, 0.95],
        [3.2, 0.68],
      ].forEach(([dy, r], k) => {
        o.position.set(t.x, t.y + dy * t.s, t.z);
        o.scale.set(r * t.s, t.s, r * t.s);
        o.rotation.set(0, t.rot + k, 0);
        o.updateMatrix();
        cone.setMatrixAt(i * 3 + k, o.matrix);
        cone.setColorAt(i * 3 + k, c.set("#3f7a4a").offsetHSL(0, 0, k * 0.03));
      });
    });
    [trunk, crown, cone].forEach((m) => {
      m.castShadow = true;
      m.receiveShadow = true;
      m.instanceMatrix.needsUpdate = true;
      if (m.instanceColor) m.instanceColor.needsUpdate = true;
    });
    return { trunk, crown, cone };
  }, [trees]);

  return (
    <>
      <RigidBody type="fixed" colliders={false}>
        {trees.map((t, i) => (
          <CylinderCollider key={i} args={[1.2, 0.28 * t.s]} position={[t.x, t.y + 1.2, t.z]} />
        ))}
      </RigidBody>
      <primitive object={meshes.trunk} />
      <primitive object={meshes.crown} />
      <primitive object={meshes.cone} />
    </>
  );
}

function Rocks() {
  const rocks = useMemo(() => {
    const rand = rng(99);
    const out: { x: number; z: number; y: number; s: number; r: number }[] = [];
    let tries = 0;
    while (out.length < 46 && tries++ < 2000) {
      const a = rand() * Math.PI * 2;
      const r = (0.35 + rand() * 0.65) * coastRadius(a);
      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r;
      if (!clear(x, z, 0.6)) continue;
      out.push({ x, z, y: heightAt(x, z), s: rand() < 0.2 ? 0.9 + rand() * 0.8 : 0.25 + rand() * 0.4, r: rand() * 6 });
    }
    return out;
  }, []);

  const mesh = useMemo(() => {
    const m = new InstancedMesh(
      faceted(new DodecahedronGeometry(1, 0)),
      nearFade(new MeshToonMaterial({ color: PAL.stone, gradientMap: toonGradient() })),
      rocks.length,
    );
    const o = new Object3D();
    const c = new Color();
    rocks.forEach((k, i) => {
      o.position.set(k.x, k.y + k.s * 0.35, k.z);
      o.scale.set(k.s * 1.2, k.s * 0.8, k.s);
      o.rotation.set(k.r, k.r * 2, k.r * 0.5);
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
      m.setColorAt(i, c.set(i % 3 ? PAL.stone : PAL.stoneDark));
    });
    m.castShadow = true;
    m.receiveShadow = true;
    return m;
  }, [rocks]);

  return (
    <>
      <RigidBody type="fixed" colliders={false} userData={{ surface: "stone" }}>
        {rocks
          .filter((k) => k.s > 0.6)
          .map((k, i) => (
            <BallCollider key={i} args={[k.s * 0.85]} position={[k.x, k.y + k.s * 0.2, k.z]} />
          ))}
      </RigidBody>
      <primitive object={mesh} />
    </>
  );
}

/* ---------------------------------------------------------------- grass -- */

const GRASS_VERT = /* glsl */ `
#include <fog_pars_vertex>
uniform float uTime;
attribute vec3 aOffset;
attribute float aScale;
attribute float aShade;
varying float vH;
varying float vShade;
void main() {
  vec3 p = position * aScale;
  float h = position.y; // 0..1 up the blade
  float sway = sin(uTime * 1.7 + aOffset.x * 0.35 + aOffset.z * 0.27) * 0.18
             + sin(uTime * 3.1 + aOffset.x * 1.3) * 0.05;
  p.x += sway * h * h;
  p.z += sway * 0.5 * h * h;
  vec4 mvPosition = modelViewMatrix * vec4(p + aOffset, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  vH = h;
  vShade = aShade;
  #include <fog_vertex>
}
`;

const GRASS_FRAG = /* glsl */ `
#include <fog_pars_fragment>
uniform vec3 uBase;
uniform vec3 uTip;
uniform float uLight;
varying float vH;
varying float vShade;
void main() {
  vec3 col = mix(uBase, uTip, vH) * (0.82 + vShade * 0.3) * uLight;
  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
  #include <fog_fragment>
}
`;

function Grass({ count }: { count: number }) {
  const { geometry, material } = useMemo(() => {
    const rand = rng(555);
    // One blade: a thin tapered triangle pair, base at y=0, tip at y=1.
    const blade = new BufferGeometry();
    blade.setAttribute(
      "position",
      new BufferAttribute(new Float32Array([-0.045, 0, 0, 0.045, 0, 0, 0.02, 0.55, 0, -0.02, 0.55, 0, 0, 1, 0]), 3),
    );
    blade.setIndex([0, 1, 2, 0, 2, 3, 3, 2, 4]);

    const offsets = new Float32Array(count * 3);
    const scales = new Float32Array(count);
    const shades = new Float32Array(count);
    let n = 0;
    let tries = 0;
    while (n < count && tries++ < count * 6) {
      // Tufts: clusters read better than an even carpet.
      const a = rand() * Math.PI * 2;
      const r = Math.sqrt(rand()) * (coastRadius(a) - 1.5);
      const cx = Math.cos(a) * r;
      const cz = Math.sin(a) * r;
      if (!clear(cx, cz, 1.2)) continue;
      const tuft = 6 + Math.floor(rand() * 8);
      for (let k = 0; k < tuft && n < count; k++) {
        const x = cx + (rand() - 0.5) * 0.9;
        const z = cz + (rand() - 0.5) * 0.9;
        offsets[n * 3] = x;
        offsets[n * 3 + 1] = heightAt(x, z) - 0.02;
        offsets[n * 3 + 2] = z;
        scales[n] = 0.35 + rand() * 0.45;
        shades[n] = rand();
        n++;
      }
    }

    const g = new InstancedBufferGeometry();
    g.setIndex(blade.getIndex());
    g.setAttribute("position", blade.getAttribute("position"));
    g.instanceCount = n;
    g.setAttribute("aOffset", new InstancedBufferAttribute(offsets.subarray(0, n * 3), 3));
    g.setAttribute("aScale", new InstancedBufferAttribute(scales.subarray(0, n), 1));
    g.setAttribute("aShade", new InstancedBufferAttribute(shades.subarray(0, n), 1));

    const m = new ShaderMaterial({
      vertexShader: GRASS_VERT,
      fragmentShader: GRASS_FRAG,
      fog: true,
      side: 2,
      uniforms: UniformsUtils.merge([
        UniformsLib.fog,
        {
          uTime: { value: 0 },
          uBase: { value: new Color(PAL.grassDark) },
          uTip: { value: new Color("#c6e07a") },
          uLight: { value: 1 },
        },
      ]),
    });
    return { geometry: g, material: m };
  }, [count]);

  useFrame((state) => {
    material.uniforms.uTime.value = state.clock.elapsedTime;
    material.uniforms.uLight.value = 0.45 + liveSky.sunIntensity * 0.25;
  });

  return <mesh geometry={geometry} material={material} frustumCulled={false} />;
}

/* ------------------------------------------------------------ fireflies -- */

const FLY_VERT = /* glsl */ `
uniform float uTime;
uniform float uSize;
attribute float aSeed;
varying float vSeed;
void main() {
  vec3 p = position;
  p.x += sin(uTime * 0.6 + aSeed * 12.0) * 0.8;
  p.y += sin(uTime * 0.9 + aSeed * 7.0) * 0.5;
  p.z += cos(uTime * 0.5 + aSeed * 9.0) * 0.8;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = uSize * (0.6 + 0.4 * sin(uTime * 3.0 + aSeed * 30.0)) / -mv.z;
  vSeed = aSeed;
}
`;

const FLY_FRAG = /* glsl */ `
uniform float uNight;
uniform float uTime;
varying float vSeed;
void main() {
  float d = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5, 0.0, d);
  float blink = 0.5 + 0.5 * sin(uTime * 2.0 + vSeed * 40.0);
  gl_FragColor = vec4(vec3(1.0, 0.85, 0.35) * 2.5, a * uNight * blink);
}
`;

function Fireflies() {
  const points = useMemo(() => {
    const rand = rng(77);
    const n = 160;
    const pos = new Float32Array(n * 3);
    const seed = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const a = rand() * Math.PI * 2;
      const r = Math.sqrt(rand()) * 34;
      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r;
      pos[i * 3] = x;
      pos[i * 3 + 1] = heightAt(x, z) + 0.6 + rand() * 2.2;
      pos[i * 3 + 2] = z;
      seed[i] = rand();
    }
    const g = new BufferGeometry();
    g.setAttribute("position", new BufferAttribute(pos, 3));
    g.setAttribute("aSeed", new BufferAttribute(seed, 1));
    const m = new ShaderMaterial({
      vertexShader: FLY_VERT,
      fragmentShader: FLY_FRAG,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      toneMapped: false,
      uniforms: { uTime: { value: 0 }, uNight: { value: 0 }, uSize: { value: 90 } },
    });
    return new Points(g, m);
  }, []);

  useFrame((state) => {
    const m = points.material as ShaderMaterial;
    m.uniforms.uTime.value = state.clock.elapsedTime;
    m.uniforms.uNight.value = Math.max(0, liveSky.night - 0.25) * 1.3;
    points.visible = liveSky.night > 0.25;
  });

  return <primitive object={points} />;
}

export function Foliage() {
  const quality = useGame(effectiveQuality);
  const q = QUALITY[quality];
  return (
    <>
      <Trees density={q.trees} />
      <Rocks />
      {q.grass > 0 ? <Grass count={q.grass} /> : null}
      <Fireflies />
    </>
  );
}
