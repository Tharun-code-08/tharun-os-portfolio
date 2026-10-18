"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useRapier } from "@react-three/rapier";
import { MathUtils, PerspectiveCamera, Vector3 } from "three";
import { runtime } from "@/game/runtime";
import { useGame } from "@/game/store";
import { MONITOR } from "@/game/zones";

const FOV = 50;
const DIVE_MS = 1300;
const EXIT_MS = 1400;
const INTRO_MS = 3200;

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const easeIn = (t: number) => t * t * t;

/** Roofs and canopies fade away instead of shoving the camera into your face. */
const seeThrough = (c: { parent: () => { userData?: unknown } | null }) =>
  !(c.parent()?.userData as { cameraIgnore?: boolean } | undefined)?.cameraIgnore;

/**
 * One camera, many shots.
 *
 *   title    — a slow orbit around the island
 *   intro    — flies down from the orbit to behind the player
 *   play     — spring-damped third person; drag to orbit, wheel to zoom,
 *              pulls in when a wall gets between it and the player
 *   panel    — frames the player on the left third while a zone app is open
 *   os-enter — dives into the studio CRT; the OS takes over at the end
 *   os-exit  — the same dive in reverse
 */
export function CameraRig() {
  const { camera, gl, size } = useThree();
  const { world, rapier } = useRapier();
  const cam = camera as PerspectiveCamera;

  const cur = useMemo(() => ({ pos: new Vector3(60, 30, 60), look: new Vector3() }), []);
  const from = useRef({ pos: new Vector3(), look: new Vector3(), fov: FOV, at: 0, mode: "" });
  const v = useMemo(
    () => ({
      target: new Vector3(),
      offset: new Vector3(),
      desired: new Vector3(),
      look: new Vector3(),
      right: new Vector3(),
      monitor: new Vector3(MONITOR.x, MONITOR.y, MONITOR.z),
      monitorCam: new Vector3(MONITOR.x, MONITOR.y + 0.02, MONITOR.z + 0.62),
    }),
    [],
  );
  const ray = useMemo(() => new rapier.Ray({ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 1 }), [rapier]);

  // Drag to orbit, wheel / pinch to zoom.
  useEffect(() => {
    const el = gl.domElement;
    const pointers = new Map<number, { x: number; y: number }>();
    let moved = 0;
    let pinch = 0;

    const down = (e: PointerEvent) => {
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      moved = 0;
    };
    const move = (e: PointerEvent) => {
      const prev = pointers.get(e.pointerId);
      if (!prev) return;
      const dx = e.clientX - prev.x;
      const dy = e.clientY - prev.y;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

      if (pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (pinch) runtime.camera.distance = MathUtils.clamp(runtime.camera.distance * (pinch / d), 4, 16);
        pinch = d;
        return;
      }
      moved += Math.abs(dx) + Math.abs(dy);
      if (moved > 5) runtime.camera.dragging = true;
      if (!runtime.camera.dragging) return;
      runtime.camera.yaw -= dx * 0.0055;
      runtime.camera.pitch = MathUtils.clamp(runtime.camera.pitch + dy * 0.004, 0.08, 1.25);
    };
    const up = (e: PointerEvent) => {
      pointers.delete(e.pointerId);
      if (pointers.size < 2) pinch = 0;
      if (pointers.size === 0) window.setTimeout(() => (runtime.camera.dragging = false), 0);
    };
    const wheel = (e: WheelEvent) => {
      e.preventDefault();
      runtime.camera.distance = MathUtils.clamp(runtime.camera.distance * (1 + e.deltaY * 0.0011), 4, 16);
    };
    const menu = (e: Event) => e.preventDefault();

    el.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    el.addEventListener("wheel", wheel, { passive: false });
    el.addEventListener("contextmenu", menu);
    return () => {
      el.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      el.removeEventListener("wheel", wheel);
      el.removeEventListener("contextmenu", menu);
    };
  }, [gl]);

  /** Where the third-person camera wants to be this frame. */
  const followPose = (panel: boolean, out: { pos: Vector3; look: Vector3 }) => {
    const c = runtime.camera;
    const wide = size.width / size.height > 1.15;
    const dist = panel ? 5.4 : c.distance;
    const pitch = panel ? 0.2 : c.pitch;

    v.target.copy(runtime.player.position);
    v.target.y += panel ? 1.05 : 1.35;
    v.offset.set(Math.sin(c.yaw) * Math.cos(pitch), Math.sin(pitch), Math.cos(c.yaw) * Math.cos(pitch));

    // Keep a wall from ever standing between the camera and the player.
    ray.origin = v.target;
    ray.dir = v.offset;
    const hit = world.castRay(
      ray,
      dist,
      true,
      rapier.QueryFilterFlags.EXCLUDE_SENSORS | rapier.QueryFilterFlags.EXCLUDE_KINEMATIC,
      undefined,
      undefined,
      undefined,
      seeThrough,
    );
    const safe = hit ? Math.max(1.4, hit.timeOfImpact - 0.35) : dist;

    out.pos.copy(v.target).addScaledVector(v.offset, safe);
    out.look.copy(v.target);

    // With a panel open, slide the subject to the left third of the frame.
    if (panel && wide) {
      v.right.set(Math.cos(c.yaw), 0, -Math.sin(c.yaw));
      out.look.addScaledVector(v.right, 1.7);
      out.pos.addScaledVector(v.right, 1.7);
    }
  };

  const titlePose = (t: number, out: { pos: Vector3; look: Vector3 }) => {
    const a = t * 0.055 + 0.6;
    out.pos.set(Math.sin(a) * 66, 26 + Math.sin(t * 0.12) * 3, Math.cos(a) * 66);
    out.look.set(0, 1, 0);
  };

  const pose = useMemo(() => ({ pos: new Vector3(), look: new Vector3() }), []);
  const pose2 = useMemo(() => ({ pos: new Vector3(), look: new Vector3() }), []);

  useFrame((state, rawDt) => {
    const dt = Math.min(rawDt, 1 / 30);
    const g = useGame.getState();
    const now = performance.now();
    const t = state.clock.elapsedTime;
    const f = from.current;

    // Remember where the camera was when a scripted shot started.
    if (f.mode !== g.mode) {
      f.pos.copy(cur.pos);
      f.look.copy(cur.look);
      f.fov = cam.fov;
      f.at = g.modeAt || now;
      f.mode = g.mode;
    }
    const elapsed = now - f.at;
    let fov = FOV;

    switch (g.mode) {
      case "title": {
        titlePose(t, pose);
        cur.pos.lerp(pose.pos, 1 - Math.exp(-2 * dt));
        cur.look.lerp(pose.look, 1 - Math.exp(-2 * dt));
        break;
      }
      case "intro": {
        const k = easeInOut(Math.min(1, elapsed / INTRO_MS));
        followPose(false, pose);
        cur.pos.lerpVectors(f.pos, pose.pos, k);
        // Arc over the top rather than sliding straight in.
        cur.pos.y += Math.sin(k * Math.PI) * 6;
        cur.look.lerpVectors(f.look, pose.look, k);
        if (elapsed >= INTRO_MS) g.setMode("play");
        break;
      }
      case "play": {
        followPose(g.panelOpen, pose);
        const lambda = g.panelOpen ? 3.5 : 9;
        cur.pos.x = MathUtils.damp(cur.pos.x, pose.pos.x, lambda, dt);
        cur.pos.y = MathUtils.damp(cur.pos.y, pose.pos.y, lambda, dt);
        cur.pos.z = MathUtils.damp(cur.pos.z, pose.pos.z, lambda, dt);
        cur.look.x = MathUtils.damp(cur.look.x, pose.look.x, lambda + 3, dt);
        cur.look.y = MathUtils.damp(cur.look.y, pose.look.y, lambda + 3, dt);
        cur.look.z = MathUtils.damp(cur.look.z, pose.look.z, lambda + 3, dt);
        break;
      }
      case "os-enter":
      case "os": {
        const k = g.mode === "os" ? 1 : Math.min(1, elapsed / DIVE_MS);
        const e = easeInOut(k);
        cur.pos.lerpVectors(f.pos, v.monitorCam, g.mode === "os" ? 1 : e);
        // Arc up and over his head instead of through it.
        if (g.mode === "os-enter") cur.pos.y += Math.sin(e * Math.PI) * 1.1;
        cur.look.lerpVectors(f.look, v.monitor, g.mode === "os" ? 1 : Math.min(1, e * 1.4));
        fov = MathUtils.lerp(f.fov, 32, easeIn(k));
        if (g.mode === "os-enter" && elapsed >= DIVE_MS) g.setMode("os");
        break;
      }
      case "os-exit": {
        const k = Math.min(1, elapsed / EXIT_MS);
        const e = easeInOut(k);
        followPose(false, pose2);
        cur.pos.lerpVectors(v.monitorCam, pose2.pos, e);
        cur.pos.y += Math.sin(e * Math.PI) * 1.1;
        cur.look.lerpVectors(v.monitor, pose2.look, e);
        fov = MathUtils.lerp(32, FOV, e);
        if (elapsed >= EXIT_MS) g.setMode("play");
        break;
      }
    }

    if (Math.abs(cam.fov - fov) > 0.01) {
      cam.fov = fov;
      cam.updateProjectionMatrix();
    }
    cam.position.copy(cur.pos);
    cam.lookAt(cur.look);
  });

  return null;
}
