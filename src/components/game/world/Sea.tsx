"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  Color,
  IcosahedronGeometry,
  InstancedMesh,
  MeshToonMaterial,
  Object3D,
  ShaderMaterial,
  UniformsLib,
  UniformsUtils,
  type Group,
} from "three";
import { faceted, toonGradient } from "@/game/materials";
import { rng } from "@/game/terrain";
import { liveSky } from "@/game/sky";

const SEA_Y = -58;
const WHITE = new Color("#ffffff");

const VERT = /* glsl */ `
#include <fog_pars_vertex>
uniform float uTime;
varying vec3 vWorld;
void main() {
  vec4 w = modelMatrix * vec4(position, 1.0);
  w.y += sin(w.x * 0.045 + uTime * 0.5) * 0.8 + cos(w.z * 0.038 + uTime * 0.4) * 0.8;
  vWorld = w.xyz;
  vec4 mvPosition = viewMatrix * w;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}
`;

const FRAG = /* glsl */ `
#include <fog_pars_fragment>
uniform float uTime;
uniform vec3 uShallow;
uniform vec3 uDeep;
uniform vec3 uSun;
varying vec3 vWorld;

void main() {
  vec2 p = vWorld.xz;
  float n = sin(p.x * 0.06 + uTime * 0.3) * sin(p.y * 0.05 - uTime * 0.25)
          + 0.5 * sin((p.x + p.y) * 0.11 + uTime * 0.4);
  vec3 col = mix(uDeep, uShallow, 0.5 + 0.35 * n);
  // Toon wave crests: hard bands, not gradients.
  float crest = smoothstep(0.86, 0.9, sin(length(p) * 0.09 - uTime * 0.6 + n * 1.5));
  col = mix(col, uShallow * 1.35 + 0.1, crest * 0.45);
  // Glints that drift with the sun colour.
  float glint = step(0.985, fract(sin(dot(floor(p * 0.5), vec2(12.9898, 78.233))) * 43758.5453 + uTime * 0.05));
  col += uSun * glint * 0.35;
  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
  #include <fog_fragment>
}
`;

/** The sea far below, and a ring of drifting cloud puffs around the island. */
export function Sea() {
  const mat = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: VERT,
        fragmentShader: FRAG,
        fog: true,
        uniforms: UniformsUtils.merge([
          UniformsLib.fog,
          {
            uTime: { value: 0 },
            uShallow: { value: new Color("#e08a79") },
            uDeep: { value: new Color("#5a2a5a") },
            uSun: { value: new Color("#ffffff") },
          },
        ]),
      }),
    [],
  );

  const clouds = useRef<Group>(null);

  const cloudMesh = useMemo(() => {
    const rand = rng(42);
    const geo = faceted(new IcosahedronGeometry(1, 1));
    const m = new MeshToonMaterial({ color: "#ffffff", gradientMap: toonGradient() });
    const puffs: { x: number; y: number; z: number; s: number }[] = [];
    for (let c = 0; c < 34; c++) {
      const a = rand() * Math.PI * 2;
      const r = 62 + rand() * 120;
      const y = rand() < 0.45 ? -28 - rand() * 18 : -6 + rand() * 34;
      const cx = Math.cos(a) * r;
      const cz = Math.sin(a) * r;
      const big = 3 + rand() * 4;
      const n = 4 + Math.floor(rand() * 4);
      for (let i = 0; i < n; i++) {
        puffs.push({
          x: cx + (rand() - 0.5) * big * 2.6,
          y: y + (rand() - 0.3) * big * 0.6,
          z: cz + (rand() - 0.5) * big * 1.4,
          s: big * (0.55 + rand() * 0.6),
        });
      }
    }
    const mesh = new InstancedMesh(geo, m, puffs.length);
    const o = new Object3D();
    puffs.forEach((p, i) => {
      o.position.set(p.x, p.y, p.z);
      o.scale.set(p.s, p.s * 0.62, p.s);
      o.rotation.set(rand(), rand(), rand());
      o.updateMatrix();
      mesh.setMatrixAt(i, o.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    return { mesh, mat: m };
  }, []);

  useFrame((state, dt) => {
    const u = mat.uniforms;
    u.uTime.value = state.clock.elapsedTime;
    u.uShallow.value.copy(liveSky.water);
    u.uDeep.value.copy(liveSky.waterDeep);
    u.uSun.value.copy(liveSky.sun);
    // Clouds catch the light: warm at dusk, blue-grey at night.
    cloudMesh.mat.color.copy(liveSky.horizon).lerp(WHITE, 0.55);
    if (clouds.current) clouds.current.rotation.y += dt * 0.004;
  });

  return (
    <>
      <mesh rotation-x={-Math.PI / 2} position-y={SEA_Y} material={mat}>
        <planeGeometry args={[2400, 2400, 120, 120]} />
      </mesh>
      <group ref={clouds}>
        <primitive object={cloudMesh.mesh} />
      </group>
    </>
  );
}
