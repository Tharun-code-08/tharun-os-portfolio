"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  CapsuleCollider,
  RigidBody,
  useRapier,
  type RapierCollider,
  type RapierRigidBody,
} from "@react-three/rapier";
import { MathUtils, Vector3, type Group } from "three";
import { CAPSULE, FOOT_OFFSET, createMover, type Mover } from "@/game/controller";
import { consumeJump, moveAxis, runHeld } from "@/game/input";
import { emit, onGame, runtime } from "@/game/runtime";
import { canControl, useGame } from "@/game/store";
import { heightAt, insideIsland, pathDistance } from "@/game/terrain";
import { STUDIO } from "@/game/zones";
import { botSay } from "@/lib/bot";
import { Character } from "./Character";
import { SpeechBubble } from "./SpeechBubble";

const WALK = 4.3;
const RUN = 7.8;
const JUMP_SPEED = 9.4;
const GRAVITY = 28;
const TERMINAL = 45;
const COYOTE = 0.12;
const JUMP_BUFFER = 0.14;
const STRIDE_WALK = 0.75;
const KILL_Y = -14;

function dampAngle(from: number, to: number, lambda: number, dt: number) {
  let d = ((to - from + Math.PI) % (Math.PI * 2)) - Math.PI;
  if (d < -Math.PI) d += Math.PI * 2;
  return from + d * (1 - Math.exp(-lambda * dt));
}

function surfaceAt(x: number, z: number): "grass" | "wood" | "stone" {
  const [sx, sz] = STUDIO.center;
  if (Math.abs(x - sx) < STUDIO.width / 2 + 0.6 && Math.abs(z - sz) < STUDIO.depth / 2 + 1.6) return "wood";
  return pathDistance(x, z) < 1.3 ? "stone" : "grass";
}

/**
 * The player: a kinematic capsule we move ourselves.
 *
 * Velocity, gravity, coyote time, the jump buffer and respawning are all ours;
 * Rapier's controller only resolves "how far can I actually go" against the
 * world. The visible character is NOT parented to the rigid body — it is placed
 * at exactly the position we hand Rapier, so the camera and the model can never
 * disagree by a physics step.
 */
export function Player() {
  const body = useRef<RapierRigidBody>(null);
  const collider = useRef<RapierCollider>(null);
  const visual = useRef<Group>(null);
  const { world, rapier } = useRapier();

  // Created in an effect, not a memo: StrictMode runs effects twice in dev,
  // and a memoised controller would be freed by the first cleanup and then
  // reused dead.
  const mover = useRef<Mover | null>(null);
  useEffect(() => {
    const m = createMover(world, rapier.QueryFilterFlags.EXCLUDE_SENSORS);
    mover.current = m;
    return () => {
      mover.current = null;
      m.dispose();
    };
  }, [world, rapier]);

  const s = useRef({
    vx: 0,
    vy: 0,
    vz: 0,
    coyote: 0,
    buffer: 0,
    grounded: true,
    airMinVy: 0,
    safeTimer: 0,
    stride: 0,
    speed: 0,
    stuck: 0,
  });

  const start = runtime.player.position;

  // Teleports (map fast-travel) and forced respawns come in as events.
  useEffect(() => {
    const place = (x: number, y: number, z: number) => {
      const b = body.current;
      if (!b) return;
      const p = { x, y: y + FOOT_OFFSET, z };
      b.setTranslation(p, true);
      b.setNextKinematicTranslation(p);
      runtime.player.position.set(x, y, z);
      s.current.vx = s.current.vy = s.current.vz = 0;
      runtime.input.moveTarget = null;
    };
    // Drop a ray from the sky so a teleport lands on decks and floors, not in them.
    const groundAt = (x: number, z: number) => {
      const ray = new rapier.Ray({ x, y: 40, z }, { x: 0, y: -1, z: 0 });
      const hit = world.castRay(
        ray,
        80,
        true,
        rapier.QueryFilterFlags.EXCLUDE_SENSORS | rapier.QueryFilterFlags.EXCLUDE_KINEMATIC,
      );
      return hit ? 40 - hit.timeOfImpact : heightAt(x, z);
    };
    return onGame((e) => {
      if (e.type === "teleport") {
        useGame.getState().fade();
        window.setTimeout(() => place(e.x, groundAt(e.x, e.z) + 0.05, e.z), 220);
      }
      if (e.type === "respawn") {
        const safe = runtime.player.lastSafe;
        place(safe.x, safe.y + 0.6, safe.z);
      }
    });
  }, [world, rapier]);

  const tmp = useMemo(() => new Vector3(), []);

  useFrame((state, rawDt) => {
    const b = body.current;
    const c = collider.current;
    const mv = mover.current;
    if (!b || !c || !mv) return;
    const dt = Math.min(rawDt, 1 / 30);
    const st = s.current;
    const game = useGame.getState();
    const control = canControl(game);

    // --- intent ---------------------------------------------------------
    let ix = 0;
    let iy = 0;
    let run = false;
    const jumpPressed = consumeJump() || runtime.input.jumpQueued;
    runtime.input.jumpQueued = false;

    if (control) {
      const k = moveAxis();
      ix = k.x + runtime.input.stickX;
      iy = k.y + runtime.input.stickY;
      run = runHeld() || runtime.input.stickRun;
      if (k.x || k.y) runtime.input.moveTarget = null;
    }

    const yaw = runtime.camera.yaw;
    let wx = -Math.sin(yaw) * iy + Math.cos(yaw) * ix;
    let wz = -Math.cos(yaw) * iy - Math.sin(yaw) * ix;

    const pos = b.translation();
    const target = runtime.input.moveTarget;
    if (control && target && ix === 0 && iy === 0) {
      const dx = target.x - pos.x;
      const dz = target.z - pos.z;
      const d = Math.hypot(dx, dz);
      if (d < 0.45 || st.stuck > 1.2) {
        runtime.input.moveTarget = null;
        st.stuck = 0;
      } else {
        wx = dx / d;
        wz = dz / d;
        run = d > 7;
        // Taper in so he doesn't overshoot and turn around.
        const taper = Math.min(1, d / 1.2);
        wx *= taper;
        wz *= taper;
      }
    } else {
      st.stuck = 0;
    }

    const wl = Math.hypot(wx, wz);
    if (wl > 1) {
      wx /= wl;
      wz /= wl;
    }

    // --- velocity -------------------------------------------------------
    const top = run ? RUN : WALK;
    const lambda = st.grounded ? 13 : 3.2;
    st.vx = MathUtils.damp(st.vx, wx * top, lambda, dt);
    st.vz = MathUtils.damp(st.vz, wz * top, lambda, dt);

    st.coyote = st.grounded ? COYOTE : st.coyote - dt;
    st.buffer = control && jumpPressed ? JUMP_BUFFER : st.buffer - dt;
    if (st.buffer > 0 && st.coyote > 0) {
      st.vy = JUMP_SPEED;
      st.buffer = 0;
      st.coyote = 0;
      st.grounded = false;
      emit({ type: "jump" });
    }

    if (st.grounded && st.vy <= 0) st.vy = -2.5;
    else st.vy = Math.max(st.vy - GRAVITY * dt, -TERMINAL);

    // --- resolve against the world ---------------------------------------
    const desired = { x: st.vx * dt, y: st.vy * dt, z: st.vz * dt };
    const m = mv.move(c, desired);

    // Bonked a ceiling on the way up.
    if (st.vy > 0 && m.y < desired.y * 0.4) st.vy = 0;

    const wasGrounded = st.grounded;
    st.grounded = m.grounded;
    if (!st.grounded) st.airMinVy = Math.min(st.airMinVy, st.vy);
    if (st.grounded && !wasGrounded) {
      const impact = MathUtils.clamp(-st.airMinVy / 22, 0, 1);
      runtime.player.landedAt = state.clock.elapsedTime;
      runtime.player.landImpact = impact;
      if (impact > 0.25) emit({ type: "land", impact });
      st.airMinVy = 0;
    }

    const next = { x: pos.x + m.x, y: pos.y + m.y, z: pos.z + m.z };
    b.setNextKinematicTranslation(next);

    // --- bookkeeping -------------------------------------------------------
    const moved = Math.hypot(m.x, m.z) / dt;
    st.speed = MathUtils.damp(st.speed, moved, 10, dt);
    if (target && moved < 0.4) st.stuck += dt;

    const p = runtime.player;
    p.position.set(next.x, next.y - FOOT_OFFSET, next.z);
    p.velocity.set(st.vx, st.vy, st.vz);
    p.grounded = st.grounded;
    p.speed = st.speed;
    if (wl > 0.15) p.facing = dampAngle(p.facing, Math.atan2(wx, wz), 12, dt);

    const sinceLand = state.clock.elapsedTime - p.landedAt;
    p.anim = !st.grounded
      ? st.vy > 0.5
        ? "jump"
        : "fall"
      : sinceLand < 0.16 && p.landImpact > 0.35
        ? "land"
        : game.panelOpen || game.mode === "os-enter"
          ? "interact"
          : st.speed > RUN * 0.72
            ? "run"
            : st.speed > 0.45
              ? "walk"
              : performance.now() < p.cheerUntil
                ? "victory"
                : performance.now() < p.waveUntil
                  ? "wave"
                  : "idle";

    // Footsteps on the beat of the stride.
    if (st.grounded && st.speed > 0.45) {
      st.stride += (st.speed * dt) / (STRIDE_WALK * (st.speed > RUN * 0.72 ? 1.35 : 1));
      if (st.stride >= 1) {
        st.stride -= 1;
        emit({ type: "footstep", surface: surfaceAt(next.x, next.z) });
      }
    }

    // Remember solid ground well inside the coast, for respawns.
    st.safeTimer += dt;
    if (st.grounded && st.safeTimer > 0.6 && insideIsland(next.x, next.z, 4)) {
      st.safeTimer = 0;
      p.lastSafe.copy(tmp.set(next.x, next.y - FOOT_OFFSET, next.z));
    }

    // Off the edge of the world.
    if (next.y < KILL_Y) {
      const g = useGame.getState();
      g.fade();
      g.unlock("leap");
      botSay("fall");
      emit({ type: "respawn" });
    }

    if (visual.current) {
      visual.current.position.copy(p.position);
      visual.current.rotation.y = p.facing;
      // Never let the camera end up inside his head.
      const head = tmp.set(p.position.x, p.position.y + 1.3, p.position.z);
      visual.current.visible = state.camera.position.distanceTo(head) > 0.75;
    }
  });

  return (
    <>
      <RigidBody
        ref={body}
        type="kinematicPosition"
        colliders={false}
        position={[start.x, start.y + FOOT_OFFSET + 0.05, start.z]}
        enabledRotations={[false, false, false]}
        name="player"
        userData={{ player: true }}
      >
        <CapsuleCollider
          ref={collider}
          args={[CAPSULE.halfHeight, CAPSULE.radius]}
          // Kinematic ↔ fixed pairs are off by default in Rapier; the zone
          // sensors are fixed, so the player opts in to see them.
          activeCollisionTypes={
            rapier.ActiveCollisionTypes.DEFAULT | rapier.ActiveCollisionTypes.KINEMATIC_FIXED
          }
        />
      </RigidBody>
      <group ref={visual} position={[start.x, start.y, start.z]}>
        <Character />
      </group>
      <SpeechBubble />
    </>
  );
}
