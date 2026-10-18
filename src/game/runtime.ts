import { Vector3 } from "three";
import { LAYOUT, heightAt } from "./terrain";

/**
 * Per-frame state that changes 60 times a second and must never trigger a
 * React render: where the player is, how fast, what the camera is doing.
 * Components read it inside useFrame / requestAnimationFrame.
 */

export type Anim = "idle" | "walk" | "run" | "jump" | "fall" | "land" | "wave" | "interact" | "victory";

const [sx, sz] = LAYOUT.spawn;

export const runtime = {
  player: {
    /** Interpolated, rendered position of the feet. */
    position: new Vector3(sx, heightAt(sx, sz) + 0.1, sz),
    velocity: new Vector3(),
    grounded: true,
    /** Radians. 0 faces +z. */
    facing: Math.PI,
    speed: 0,
    anim: "idle" as Anim,
    /** Last place he stood safely, for respawns. */
    lastSafe: new Vector3(sx, heightAt(sx, sz) + 0.1, sz),
    /** Seconds since the last landing — drives the squash. */
    landedAt: -10,
    /** Impact speed of the last landing, 0..1. */
    landImpact: 0,
    /** performance.now() until which an idle player waves. */
    waveUntil: 0,
    /** performance.now() until which an idle player celebrates. */
    cheerUntil: 0,
  },
  input: {
    /** Virtual joystick, -1..1. */
    stickX: 0,
    stickY: 0,
    stickRun: false,
    /** Set by tap-to-move. */
    moveTarget: null as Vector3 | null,
    jumpQueued: false,
  },
  camera: {
    yaw: 0,
    pitch: 0.42,
    distance: 9.5,
    dragging: false,
  },
  /** Interactables whose sensor the player is currently inside. */
  inReach: new Set<string>(),
  /** Zones whose region the player is currently inside. */
  inZones: new Set<string>(),
  fps: 60,
};

/* ------------------------------------------------------------- events -- */

export type GameEvent =
  | { type: "teleport"; x: number; z: number }
  | { type: "respawn" }
  | { type: "footstep"; surface: "grass" | "wood" | "stone" }
  | { type: "jump" }
  | { type: "land"; impact: number };

type Listener = (e: GameEvent) => void;
const listeners = new Set<Listener>();

export function emit(e: GameEvent) {
  listeners.forEach((l) => l(e));
}

export function onGame(l: Listener) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}
