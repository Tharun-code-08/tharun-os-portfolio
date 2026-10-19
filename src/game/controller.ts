"use client";

import type { RapierCollider, RapierContext } from "@react-three/rapier";

type World = RapierContext["world"];
type Collider = RapierCollider;

/**
 * Collision resolution for the player.
 *
 * This is Rapier core's own kinematic character controller
 * (World.createCharacterController → computeColliderMovement), configured for
 * a small character on rolling ground. It is deliberately NOT a React wrapper:
 * we own the body, the velocity and the rules on top (coyote time, jump buffer,
 * respawn) in Player.tsx, and only ask Rapier "if I try to move this far, how
 * far do I actually get?".
 */

export const CAPSULE = { radius: 0.32, halfHeight: 0.5 } as const;
/** Feet are this far below the body's centre. */
export const FOOT_OFFSET = CAPSULE.radius + CAPSULE.halfHeight;

const DEG = Math.PI / 180;

export type Mover = {
  move: (
    collider: Collider,
    desired: { x: number; y: number; z: number },
  ) => { x: number; y: number; z: number; grounded: boolean };
  dispose: () => void;
};

export function createMover(world: World, excludeSensors: number): Mover {
  const kcc = world.createCharacterController(0.03);
  kcc.setUp({ x: 0, y: 1, z: 0 });
  kcc.setSlideEnabled(true);
  kcc.setMaxSlopeClimbAngle(52 * DEG);
  kcc.setMinSlopeSlideAngle(40 * DEG);
  // Porch steps and stones: walk up anything under ~45cm instead of bumping.
  kcc.enableAutostep(0.45, 0.2, false);
  // Hold to the ground going downhill instead of skipping off every crest.
  kcc.enableSnapToGround(0.35);
  // Lets him nudge the beach ball around.
  kcc.setApplyImpulsesToDynamicBodies(true);
  kcc.setCharacterMass(60);

  return {
    move(collider, desired) {
      kcc.computeColliderMovement(collider, desired, excludeSensors);
      const m = kcc.computedMovement();
      return { x: m.x, y: m.y, z: m.z, grounded: kcc.computedGrounded() };
    },
    dispose() {
      world.removeCharacterController(kcc);
    },
  };
}
