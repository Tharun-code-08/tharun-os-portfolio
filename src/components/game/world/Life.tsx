"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { CylinderCollider, RigidBody } from "@react-three/rapier";
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  DoubleSide,
  Group,
  IcosahedronGeometry,
  InstancedBufferAttribute,
  InstancedMesh,
  Mesh,
  MeshBasicMaterial,
  MeshToonMaterial,
  Object3D,
  PlaneGeometry,
  ShaderMaterial,
  SphereGeometry,
  UniformsLib,
  UniformsUtils,
} from "three";
import { faceted, PAL, toonGradient } from "@/game/materials";
import { onGame, runtime } from "@/game/runtime";
import { liveSky } from "@/game/sky";
import { useGame } from "@/game/store";
import { coastRadius, heightAt, rng, SMOOTH_PATHS, samplePolyline, SPRING_THETA } from "@/game/terrain";
import { INTERACTABLE_BY_ID, INTERACTABLES } from "@/game/zones";

/* ---------------------------------------------------------------- birds -- */

/** A few gulls circling the island: two-triangle wings flapping in a shader. */
const BIRD_VERT = /* glsl */ `
uniform float uTime;
attribute float aSeed;
void main() {
  vec3 p = position;
  float flap = sin(uTime * (7.0 + aSeed * 3.0) + aSeed * 20.0);
  p.y += abs(p.x) * flap * 0.9;
  gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(p, 1.0);
}
`;

function Birds() {
  const mesh = useMemo(() => {
    const g = new BufferGeometry();
    // Body at the origin, wing tips out to ±1 along x, facing +z.
    g.setAttribute("position", new BufferAttribute(new Float32Array([0, 0, 0.3, -1, 0, -0.2, 0, 0, -0.25, 0, 0, 0.3, 0, 0, -0.25, 1, 0, -0.2]), 3));
    const n = 14;
    const seeds = new Float32Array(n);
    for (let i = 0; i < n; i++) seeds[i] = i / n;
    g.setAttribute("aSeed", new InstancedBufferAttribute(seeds, 1));
    const m = new ShaderMaterial({ vertexShader: BIRD_VERT, fragmentShader: "void main(){ gl_FragColor = vec4(0.12,0.1,0.14,1.0); }", side: DoubleSide, uniforms: { uTime: { value: 0 } } });
    const inst = new InstancedMesh(g, m, n);
    inst.frustumCulled = false;
    return inst;
  }, []);

  const flock = useMemo(() => {
    const rand = rng(31);
    return Array.from({ length: mesh.count }, (_, i) => ({
      r: 30 + rand() * 30,
      h: 14 + rand() * 14,
      speed: (0.05 + rand() * 0.05) * (i % 3 === 0 ? -1 : 1),
      phase: rand() * Math.PI * 2,
      bob: rand() * 10,
      scale: 0.35 + rand() * 0.25,
    }));
  }, [mesh]);

  const o = useMemo(() => new Object3D(), []);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    (mesh.material as ShaderMaterial).uniforms.uTime.value = t;
    flock.forEach((b, i) => {
      const a = b.phase + t * b.speed;
      o.position.set(Math.cos(a) * b.r, b.h + Math.sin(t * 0.5 + b.bob) * 1.5, Math.sin(a) * b.r);
      // Face along the circle.
      o.rotation.set(0, -a + (b.speed > 0 ? 0 : Math.PI), Math.sin(t + b.bob) * 0.2);
      o.scale.setScalar(b.scale);
      o.updateMatrix();
      mesh.setMatrixAt(i, o.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    // Gulls by day, gone by night.
    mesh.visible = liveSky.night < 0.7;
  });

  return <primitive object={mesh} />;
}

/* -------------------------------------------------------- mini islands -- */

function Islets() {
  const group = useRef<Group>(null);
  const islets = useMemo(() => {
    const rand = rng(8);
    return Array.from({ length: 7 }, (_, i) => {
      const a = (i / 7) * Math.PI * 2 + rand() * 0.5;
      const r = 58 + rand() * 30;
      return { x: Math.cos(a) * r, z: Math.sin(a) * r, y: -6 + rand() * 16, s: 2 + rand() * 3.5, spin: rand() * 6, bob: rand() * 10, tree: rand() > 0.35 };
    });
  }, []);

  const parts = useMemo(() => {
    const grad = toonGradient();
    return {
      rock: faceted(new IcosahedronGeometry(1, 0)),
      top: new SphereGeometry(1, 14, 6, 0, Math.PI * 2, 0, Math.PI / 2),
      rockMat: new MeshToonMaterial({ color: PAL.rock, gradientMap: grad }),
      topMat: new MeshToonMaterial({ color: PAL.grass, gradientMap: grad }),
      leaf: new MeshToonMaterial({ color: PAL.leafLight, gradientMap: grad }),
      trunk: new MeshToonMaterial({ color: PAL.trunk, gradientMap: grad }),
    };
  }, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    group.current?.children.forEach((c, i) => {
      c.position.y = islets[i].y + Math.sin(t * 0.35 + islets[i].bob) * 0.8;
    });
  });

  return (
    <group ref={group}>
      {islets.map((it, i) => (
        <group key={i} position={[it.x, it.y, it.z]} rotation-y={it.spin} scale={it.s}>
          <mesh geometry={parts.rock} material={parts.rockMat} scale={[1.1, 1.6, 1.1]} position-y={-1.1} castShadow />
          <mesh geometry={parts.top} material={parts.topMat} scale={[1.15, 0.25, 1.15]} position-y={-0.05} />
          {it.tree ? (
            <group position={[0.2, 0, 0.1]}>
              <mesh material={parts.trunk} position-y={0.35}>
                <cylinderGeometry args={[0.06, 0.09, 0.7, 6]} />
              </mesh>
              <mesh geometry={parts.rock} material={parts.leaf} position-y={0.9} scale={0.45} castShadow />
            </group>
          ) : null}
        </group>
      ))}
    </group>
  );
}

/* ------------------------------------------------------------ lanterns -- */

function Lanterns() {
  const spots = useMemo(() => {
    const out: [number, number][] = [];
    // The road has its own stones; everything else gets a lantern every so often.
    SMOOTH_PATHS.slice(0, -1).forEach((line, k) => {
      const count = Math.max(3, Math.round(line.length / 5));
      samplePolyline(line, count).forEach(([x, z], i) => {
        if (i === 0 || i === count - 1) return;
        // Step off the path to its side.
        const side = (i + k) % 2 ? 1.5 : -1.5;
        out.push([x + side * 0.7, z + side * 0.7]);
      });
    });
    // Never in front of something you can interact with.
    return out.filter(([x, z]) => INTERACTABLES.every((it) => Math.hypot(it.position[0] - x, it.position[2] - z) > it.reach + 0.6));
  }, []);

  const lights = useMemo(() => new MeshBasicMaterial({ color: new Color("#ffc46a"), toneMapped: false }), []);
  useFrame(() => {
    const n = liveSky.night;
    lights.color.setRGB(1 + n * 3.2, 0.77 + n * 2.2, 0.42 + n * 0.8);
  });

  return (
    <>
      <RigidBody type="fixed" colliders={false}>
        {spots.map(([x, z], i) => (
          <CylinderCollider key={i} args={[0.7, 0.08]} position={[x, heightAt(x, z) + 0.7, z]} />
        ))}
      </RigidBody>
      {spots.map(([x, z], i) => {
        const y = heightAt(x, z);
        return (
          <group key={i} position={[x, y, z]}>
            <mesh position-y={0.65} castShadow>
              <cylinderGeometry args={[0.05, 0.07, 1.3, 6]} />
              <meshToonMaterial color={PAL.woodDark} gradientMap={toonGradient()} />
            </mesh>
            <mesh position-y={1.38}>
              <boxGeometry args={[0.24, 0.26, 0.24]} />
              <meshToonMaterial color="#2b2b2f" gradientMap={toonGradient()} />
            </mesh>
            <mesh position-y={1.37} material={lights}>
              <boxGeometry args={[0.18, 0.2, 0.25]} />
            </mesh>
            <mesh position-y={1.37} material={lights}>
              <boxGeometry args={[0.25, 0.2, 0.18]} />
            </mesh>
            <mesh position-y={1.55}>
              <coneGeometry args={[0.2, 0.14, 4]} />
              <meshToonMaterial color="#2b2b2f" gradientMap={toonGradient()} />
            </mesh>
          </group>
        );
      })}
    </>
  );
}

/* ----------------------------------------------------------- waterfall -- */

const FALL_VERT = /* glsl */ `
#include <fog_pars_vertex>
varying vec2 vUv;
void main() {
  vUv = uv;
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}
`;

const FALL_FRAG = /* glsl */ `
#include <fog_pars_fragment>
uniform float uTime;
uniform vec3 uColor;
varying vec2 vUv;
float hash(float n) { return fract(sin(n) * 43758.5453); }
void main() {
  // Vertical streaks sliding down, broken into toon bands.
  float lane = floor(vUv.x * 18.0);
  float speed = 0.9 + hash(lane) * 0.7;
  float s = fract(vUv.y * 3.0 + uTime * speed + hash(lane + 3.0));
  float streak = smoothstep(0.55, 0.62, s) * (1.0 - smoothstep(0.85, 0.95, s));
  float edge = smoothstep(0.0, 0.12, vUv.x) * smoothstep(1.0, 0.88, vUv.x);
  float fade = smoothstep(0.0, 0.35, vUv.y);
  vec3 col = mix(uColor, vec3(1.0), streak * 0.65);
  gl_FragColor = vec4(col, (0.55 + streak * 0.4) * edge * fade);
  #include <fog_fragment>
}
`;

const FOAM = new Color("#bfe8ff");

function Waterfall() {
  const theta = SPRING_THETA;
  const R = coastRadius(theta);
  const x = Math.cos(theta) * (R - 0.4);
  const z = Math.sin(theta) * (R - 0.4);
  const top = heightAt(x, z) + 0.15;
  // Face outward from the island.
  const rotY = -theta + Math.PI / 2;

  const mat = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: FALL_VERT,
        fragmentShader: FALL_FRAG,
        transparent: true,
        depthWrite: false,
        side: DoubleSide,
        fog: true,
        uniforms: UniformsUtils.merge([UniformsLib.fog, { uTime: { value: 0 }, uColor: { value: new Color("#8fd3ff") } }]),
      }),
    [],
  );
  const mists = useMemo(
    () => Array.from({ length: 6 }, () => new MeshBasicMaterial({ color: "#ffffff", transparent: true, opacity: 0.35, depthWrite: false })),
    [],
  );
  const mistRef = useRef<Group>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    mat.uniforms.uTime.value = t;
    mat.uniforms.uColor.value.copy(liveSky.water).lerp(FOAM, 0.5);
    mistRef.current?.children.forEach((c, i) => {
      const k = (t * 0.4 + i / 6) % 1;
      c.position.y = -k * 3;
      c.scale.setScalar(0.6 + k * 1.6);
      ((c as Mesh).material as MeshBasicMaterial).opacity = (1 - k) * 0.35;
    });
  });

  // A curved sheet: out over the lip, then straight down into the clouds.
  const geo = useMemo(() => {
    const g = new PlaneGeometry(2.6, 1, 1, 24);
    const pos = g.getAttribute("position");
    for (let i = 0; i < pos.count; i++) {
      const v = pos.getY(i) + 0.5; // 0 bottom … 1 top
      const fall = 1 - v;
      pos.setY(i, -fall * 42);
      pos.setZ(i, Math.sqrt(fall) * 2.4);
    }
    g.computeVertexNormals();
    return g;
  }, []);

  return (
    <group position={[x, top, z]} rotation-y={rotY}>
      {/* spring: rocks around the source */}
      {[
        [-1.6, 0.2, -0.8, 0.8],
        [1.7, 0.25, -0.6, 0.9],
        [0.4, 0.1, -1.6, 0.6],
      ].map(([px, py, pz, s], i) => (
        <mesh key={i} position={[px, py, pz]} scale={s} castShadow>
          <icosahedronGeometry args={[1, 0]} />
          <meshToonMaterial color={PAL.stone} gradientMap={toonGradient()} />
        </mesh>
      ))}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.02, -1.0]}>
        <circleGeometry args={[1.6, 20]} />
        <meshBasicMaterial color={new Color("#7cc6f0")} transparent opacity={0.85} />
      </mesh>
      <mesh geometry={geo} material={mat} position={[0, 0, 0]} renderOrder={3} />
      <group ref={mistRef} position={[0, 0, 0.6]}>
        {mists.map((m, i) => (
          <mesh key={i} material={m}>
            <sphereGeometry args={[0.6, 8, 6]} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

/* ----------------------------------------------------------- footsteps -- */

const DUST = 24;

/** Little puffs at his feet on every step and a ring of them on landing. */
function Dust() {
  const mesh = useMemo(() => {
    const m = new InstancedMesh(
      new SphereGeometry(1, 8, 6),
      new MeshBasicMaterial({ color: "#e9dcc4", transparent: true, opacity: 0.55, depthWrite: false }),
      DUST,
    );
    m.frustumCulled = false;
    return m;
  }, []);
  const puffs = useRef(Array.from({ length: DUST }, () => ({ x: 0, y: -999, z: 0, vx: 0, vy: 0, vz: 0, life: 0, size: 0 })));
  const next = useRef(0);
  const o = useMemo(() => new Object3D(), []);

  useEffect(
    () =>
      onGame((e) => {
        const p = runtime.player.position;
        const spawn = (n: number, spread: number, size: number) => {
          for (let i = 0; i < n; i++) {
            const d = puffs.current[next.current++ % DUST];
            const a = Math.random() * Math.PI * 2;
            d.x = p.x + Math.cos(a) * 0.15;
            d.y = p.y + 0.05;
            d.z = p.z + Math.sin(a) * 0.15;
            d.vx = Math.cos(a) * spread;
            d.vz = Math.sin(a) * spread;
            d.vy = 0.4 + Math.random() * 0.4;
            d.life = 1;
            d.size = size * (0.7 + Math.random() * 0.6);
          }
        };
        if (e.type === "footstep" && e.surface !== "wood" && runtime.player.speed > 5) spawn(2, 0.6, 0.11);
        if (e.type === "land") spawn(8, 1.6 * e.impact + 0.6, 0.16);
        if (e.type === "jump") spawn(4, 0.9, 0.12);
      }),
    [],
  );

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 1 / 30);
    let alive = 0;
    puffs.current.forEach((d, i) => {
      if (d.life > 0) {
        d.life -= dt * 1.6;
        d.x += d.vx * dt;
        d.y += d.vy * dt;
        d.z += d.vz * dt;
        d.vx *= 0.9;
        d.vz *= 0.9;
        alive++;
      }
      const s = d.life > 0 ? d.size * (1.6 - d.life * 0.6) : 0;
      o.position.set(d.x, d.y, d.z);
      o.scale.setScalar(Math.max(0.0001, s));
      o.updateMatrix();
      mesh.setMatrixAt(i, o.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.visible = alive > 0;
  });

  return <primitive object={mesh} />;
}

/* ---------------------------------------------------------- focus ring -- */

/** A pulsing ring on the ground under whatever E would interact with. */
function FocusRing() {
  const ref = useRef<Mesh>(null);
  const mat = useMemo(
    () => new MeshBasicMaterial({ color: new Color("#ffb020").multiplyScalar(2), transparent: true, opacity: 0.8, toneMapped: false, depthWrite: false, blending: AdditiveBlending }),
    [],
  );
  useFrame((state) => {
    const m = ref.current;
    if (!m) return;
    const id = useGame.getState().focus;
    const it = id ? INTERACTABLE_BY_ID[id] : null;
    m.visible = !!it && !useGame.getState().panelOpen;
    if (!it) return;
    const [x, , z] = it.position;
    const t = state.clock.elapsedTime;
    m.position.set(x, Math.max(heightAt(x, z), runtime.player.position.y) + 0.04, z);
    m.scale.setScalar(0.85 + Math.sin(t * 5) * 0.08);
    m.rotation.z = t * 0.8;
  });
  return (
    <mesh ref={ref} rotation-x={-Math.PI / 2} material={mat} renderOrder={5}>
      <ringGeometry args={[0.55, 0.68, 6]} />
    </mesh>
  );
}

export function Life() {
  return (
    <>
      <Birds />
      <Islets />
      <Lanterns />
      <Waterfall />
      <Dust />
      <FocusRing />
    </>
  );
}

