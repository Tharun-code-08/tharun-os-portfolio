"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { CapsuleGeometry, MathUtils, SphereGeometry, type Group, type Mesh } from "three";
import { glow, PAL, toon } from "@/game/materials";
import { runtime, type Anim } from "@/game/runtime";

/**
 * Tharun, procedurally — the stand-in until the Blender model is exported,
 * and the fallback if it ever fails to load.
 *
 * Same palette as the pixel TharunBOT in the OS (red tee with the T, navy
 * trousers, white sneakers), rebuilt as a chibi from primitives with a small
 * pose solver: every joint has a target per animation state and eases toward
 * it, so transitions blend instead of snapping.
 */

type Pose = {
  legL: number;
  legR: number;
  kneeL: number;
  kneeR: number;
  armLx: number;
  armRx: number;
  armLz: number;
  armRz: number;
  lean: number;
  headX: number;
  headY: number;
  bob: number;
  squashY: number;
};

const REST: Pose = {
  legL: 0,
  legR: 0,
  kneeL: 0,
  kneeR: 0,
  armLx: 0,
  armRx: 0,
  armLz: 0.12,
  armRz: -0.12,
  lean: 0,
  headX: 0,
  headY: 0,
  bob: 0,
  squashY: 1,
};

function solve(anim: Anim, t: number, phase: number, sinceLand: number, impact: number): Pose {
  const p = { ...REST };
  const s = Math.sin(phase);
  const c = Math.cos(phase);

  switch (anim) {
    case "idle": {
      p.bob = Math.sin(t * 2.1) * 0.008;
      p.armLz = 0.12 + Math.sin(t * 2.1) * 0.03;
      p.armRz = -0.12 - Math.sin(t * 2.1) * 0.03;
      // Glances around every so often rather than staring into the void.
      p.headY = Math.sin(t * 0.37) * 0.35 * Math.max(0, Math.sin(t * 0.21));
      p.headX = Math.sin(t * 0.5) * 0.04;
      break;
    }
    case "walk": {
      p.legL = s * 0.62;
      p.legR = -s * 0.62;
      p.kneeL = Math.max(0, -c) * 0.55;
      p.kneeR = Math.max(0, c) * 0.55;
      p.armLx = -s * 0.55;
      p.armRx = s * 0.55;
      p.bob = Math.abs(c) * 0.045;
      p.lean = 0.06;
      break;
    }
    case "run": {
      p.legL = s * 0.95;
      p.legR = -s * 0.95;
      p.kneeL = Math.max(0, -c) * 1.1;
      p.kneeR = Math.max(0, c) * 1.1;
      p.armLx = -s * 1.0;
      p.armRx = s * 1.0;
      p.armLz = 0.25;
      p.armRz = -0.25;
      p.bob = Math.abs(c) * 0.08;
      p.lean = 0.2;
      break;
    }
    case "jump": {
      p.legL = -0.5;
      p.legR = 0.25;
      p.kneeL = 0.9;
      p.kneeR = 0.3;
      p.armLx = -2.4;
      p.armRx = -2.6;
      p.armLz = 0.3;
      p.armRz = -0.3;
      p.squashY = 1.06;
      break;
    }
    case "fall": {
      p.legL = 0.2;
      p.legR = -0.3;
      p.kneeL = 0.3;
      p.kneeR = 0.5;
      p.armLz = 1.25 + Math.sin(t * 14) * 0.08;
      p.armRz = -1.25 - Math.sin(t * 14) * 0.08;
      p.headX = -0.15;
      break;
    }
    case "land": {
      const k = 1 - sinceLand / 0.16;
      p.squashY = 1 - 0.2 * impact * k;
      p.kneeL = p.kneeR = 0.6 * k;
      p.legL = p.legR = -0.3 * k;
      p.armLz = 0.5;
      p.armRz = -0.5;
      break;
    }
    case "interact": {
      p.armRx = -1.25 + Math.sin(t * 9) * 0.06;
      p.armLx = -1.1 + Math.cos(t * 9) * 0.06;
      p.armLz = -0.1;
      p.armRz = 0.1;
      p.headX = 0.12;
      break;
    }
    case "wave": {
      p.armRz = -2.6 + Math.sin(t * 10) * 0.35;
      p.headY = 0.1;
      break;
    }
  }
  return p;
}

export function Character() {
  const root = useRef<Group>(null);
  const body = useRef<Group>(null);
  const head = useRef<Group>(null);
  const legL = useRef<Group>(null);
  const legR = useRef<Group>(null);
  const shinL = useRef<Group>(null);
  const shinR = useRef<Group>(null);
  const armL = useRef<Group>(null);
  const armR = useRef<Group>(null);
  const eyes = useRef<Group>(null);
  const shadow = useRef<Mesh>(null);

  const state = useRef({ phase: 0, pose: { ...REST }, blinkAt: 2, wave: 0 });

  const geo = useMemo(
    () => ({
      thigh: new CapsuleGeometry(0.105, 0.2, 4, 10),
      shin: new CapsuleGeometry(0.095, 0.18, 4, 10),
      arm: new CapsuleGeometry(0.075, 0.26, 4, 10),
      head: new SphereGeometry(0.29, 28, 20),
      hair: new SphereGeometry(0.305, 28, 16, 0, Math.PI * 2, 0, Math.PI * 0.55),
      hand: new SphereGeometry(0.075, 12, 10),
      eye: new CapsuleGeometry(0.026, 0.035, 4, 8),
    }),
    [],
  );

  const mat = useMemo(
    () => ({
      skin: toon(PAL.skin),
      hair: toon(PAL.hair),
      shirt: toon(PAL.shirt),
      shirtDark: toon("#8f2b25"),
      pants: toon(PAL.pants),
      shoe: toon(PAL.shoe),
      sole: toon("#3a3a40"),
      eye: toon("#15151b"),
      logo: toon("#f3e6c8"),
      shadow: glow("#000000", 0, 0.28),
    }),
    [],
  );

  useFrame((frame, rawDt) => {
    const dt = Math.min(rawDt, 1 / 30);
    const t = frame.clock.elapsedTime;
    const p = runtime.player;
    const st = state.current;

    st.phase += ((p.speed / 1.5) * Math.PI * 2 * dt) % (Math.PI * 2);
    const target = solve(p.anim, t, st.phase, t - p.landedAt, p.landImpact);

    const k = 1 - Math.exp(-16 * dt);
    const cur = st.pose;
    (Object.keys(cur) as (keyof Pose)[]).forEach((key) => {
      cur[key] += (target[key] - cur[key]) * k;
    });

    if (legL.current) legL.current.rotation.x = cur.legL;
    if (legR.current) legR.current.rotation.x = cur.legR;
    if (shinL.current) shinL.current.rotation.x = cur.kneeL;
    if (shinR.current) shinR.current.rotation.x = cur.kneeR;
    if (armL.current) {
      armL.current.rotation.x = cur.armLx;
      armL.current.rotation.z = cur.armLz;
    }
    if (armR.current) {
      armR.current.rotation.x = cur.armRx;
      armR.current.rotation.z = cur.armRz;
    }
    if (head.current) {
      head.current.rotation.x = cur.headX;
      head.current.rotation.y = cur.headY;
    }
    if (body.current) {
      body.current.position.y = cur.bob;
      body.current.rotation.x = cur.lean;
    }
    if (root.current) {
      const sy = cur.squashY;
      root.current.scale.set(1 / Math.sqrt(sy), sy, 1 / Math.sqrt(sy));
    }

    // Blinks on an irregular cadence, same as the pixel version.
    if (eyes.current) {
      const closing = t > st.blinkAt && t < st.blinkAt + 0.12;
      eyes.current.scale.y = MathUtils.damp(eyes.current.scale.y, closing ? 0.1 : 1, 40, dt);
      if (t > st.blinkAt + 0.12) st.blinkAt = t + 2 + Math.random() * 3.5;
    }

    // Blob shadow stays on the ground while he is in the air.
    if (shadow.current) {
      const air = p.grounded ? 0 : Math.min(1.5, Math.max(0, p.velocity.y > 0 ? 0.6 : 0.4));
      shadow.current.scale.setScalar(1 - air * 0.3);
    }
  });

  return (
    <group ref={root}>
      <mesh ref={shadow} rotation-x={-Math.PI / 2} position-y={0.02} material={mat.shadow} renderOrder={-1}>
        <circleGeometry args={[0.38, 24]} />
      </mesh>

      <group ref={body}>
        {/* Legs pivot at the hip. */}
        {[
          { ref: legL, shin: shinL, x: -0.12 },
          { ref: legR, shin: shinR, x: 0.12 },
        ].map((leg) => (
          <group key={leg.x} ref={leg.ref} position={[leg.x, 0.6, 0]}>
            <mesh geometry={geo.thigh} material={mat.pants} position-y={-0.16} castShadow />
            <group ref={leg.shin} position-y={-0.3}>
              <mesh geometry={geo.shin} material={mat.pants} position-y={-0.12} castShadow />
              <mesh material={mat.shoe} position={[0, -0.25, 0.04]} castShadow>
                <boxGeometry args={[0.17, 0.1, 0.28]} />
              </mesh>
              <mesh material={mat.sole} position={[0, -0.3, 0.04]}>
                <boxGeometry args={[0.175, 0.025, 0.285]} />
              </mesh>
            </group>
          </group>
        ))}

        {/* Torso: the red tee with the T on it. */}
        <mesh material={mat.shirt} position-y={0.86} castShadow>
          <capsuleGeometry args={[0.22, 0.2, 6, 14]} />
        </mesh>
        <mesh material={mat.shirtDark} position-y={0.66} scale={[1, 0.35, 0.85]}>
          <sphereGeometry args={[0.22, 16, 10]} />
        </mesh>
        <mesh material={mat.logo} position={[0, 0.93, 0.205]}>
          <boxGeometry args={[0.15, 0.035, 0.02]} />
        </mesh>
        <mesh material={mat.logo} position={[0, 0.865, 0.212]}>
          <boxGeometry args={[0.04, 0.11, 0.02]} />
        </mesh>

        {/* Arms pivot at the shoulder. */}
        {[
          { ref: armL, x: -0.29 },
          { ref: armR, x: 0.29 },
        ].map((arm) => (
          <group key={arm.x} ref={arm.ref} position={[arm.x, 1.02, 0]}>
            <mesh geometry={geo.arm} material={mat.shirt} position-y={-0.1} scale={[1.15, 0.55, 1.15]} castShadow />
            <mesh geometry={geo.arm} material={mat.skin} position-y={-0.22} castShadow />
            <mesh geometry={geo.hand} material={mat.skin} position-y={-0.4} castShadow />
          </group>
        ))}

        {/* Head: big on purpose. */}
        <group ref={head} position-y={1.1}>
          <mesh material={mat.skin} position-y={0.03}>
            <cylinderGeometry args={[0.07, 0.08, 0.1, 10]} />
          </mesh>
          <mesh geometry={geo.head} material={mat.skin} position-y={0.31} castShadow />
          <mesh geometry={geo.hair} material={mat.hair} position={[0, 0.345, -0.012]} rotation-x={-0.18} castShadow />
          {/* Fringe */}
          {[-0.14, -0.04, 0.07, 0.16].map((x, i) => (
            <mesh key={x} material={mat.hair} position={[x, 0.5 - (i % 2) * 0.02, 0.2]} rotation={[0.5, 0, x * 1.4]}>
              <capsuleGeometry args={[0.055, 0.07, 3, 8]} />
            </mesh>
          ))}
          <mesh material={mat.skin} position={[-0.285, 0.3, 0]}>
            <sphereGeometry args={[0.055, 10, 8]} />
          </mesh>
          <mesh material={mat.skin} position={[0.285, 0.3, 0]}>
            <sphereGeometry args={[0.055, 10, 8]} />
          </mesh>
          <group ref={eyes} position={[0, 0.3, 0.262]}>
            <mesh geometry={geo.eye} material={mat.eye} position-x={-0.095} />
            <mesh geometry={geo.eye} material={mat.eye} position-x={0.095} />
          </group>
          <mesh material={mat.hair} position={[-0.095, 0.39, 0.262]} rotation-z={0.08}>
            <boxGeometry args={[0.08, 0.018, 0.02]} />
          </mesh>
          <mesh material={mat.hair} position={[0.095, 0.39, 0.262]} rotation-z={-0.08}>
            <boxGeometry args={[0.08, 0.018, 0.02]} />
          </mesh>
          <mesh material={toon("#8a4a3a")} position={[0, 0.2, 0.272]}>
            <boxGeometry args={[0.07, 0.016, 0.015]} />
          </mesh>
        </group>
      </group>
    </group>
  );
}
