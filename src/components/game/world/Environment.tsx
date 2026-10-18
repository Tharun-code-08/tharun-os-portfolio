"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import {
  BackSide,
  Color,
  Fog,
  ShaderMaterial,
  Vector3,
  type DirectionalLight,
  type HemisphereLight,
} from "three";
import { runtime } from "@/game/runtime";
import { hourFor, liveSky, skyAt } from "@/game/sky";
import { useGame, effectiveQuality } from "@/game/store";

const SKY_VERT = /* glsl */ `
varying vec3 vDir;
void main() {
  vDir = normalize(position);
  vec4 p = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * p;
  gl_Position.z = gl_Position.w; // pin to the far plane
}
`;

const SKY_FRAG = /* glsl */ `
uniform vec3 uTop;
uniform vec3 uHorizon;
uniform vec3 uBottom;
uniform vec3 uSun;
uniform vec3 uSunDir;
uniform float uStars;
uniform float uTime;
varying vec3 vDir;

float hash(vec3 p) {
  p = fract(p * 0.3183099 + 0.1);
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}

void main() {
  vec3 d = normalize(vDir);
  float h = d.y;
  vec3 col = h > 0.0
    ? mix(uHorizon, uTop, pow(smoothstep(0.0, 1.0, h), 0.55))
    : mix(uHorizon, uBottom, pow(smoothstep(0.0, 1.0, -h), 0.45));

  // Sun: a crisp disc, a warm halo, and a wide wash along the horizon.
  float sd = max(dot(d, uSunDir), 0.0);
  col += uSun * (smoothstep(0.9986, 0.9992, sd) * 2.2 + pow(sd, 22.0) * 0.32 + pow(sd, 3.0) * 0.07);

  // Stars, twinkling, only above the horizon.
  vec3 cell = floor(d * 260.0);
  float s = hash(cell);
  float star = step(0.9968, s) * smoothstep(0.02, 0.3, h) * uStars;
  col += vec3(star * (0.55 + 0.45 * sin(uTime * 2.3 + s * 140.0)) * 1.4);

  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
}
`;

/**
 * Sky, sun, ambient light and fog — all from the same SkyState, so the colour
 * of the fog always matches the colour of the horizon it is fading into.
 */
export function Environment() {
  const { scene } = useThree();
  const sun = useRef<DirectionalLight>(null);
  const hemi = useRef<HemisphereLight>(null);
  const timeOfDay = useGame((s) => s.settings.timeOfDay);
  const quality = useGame(effectiveQuality);

  const sky = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: SKY_VERT,
        fragmentShader: SKY_FRAG,
        side: BackSide,
        depthWrite: false,
        uniforms: {
          uTop: { value: new Color() },
          uHorizon: { value: new Color() },
          uBottom: { value: new Color() },
          uSun: { value: new Color() },
          uSunDir: { value: new Vector3(0, 0.2, -1) },
          uStars: { value: 0 },
          uTime: { value: 0 },
        },
      }),
    [],
  );

  const fog = useMemo(() => new Fog("#e07a72", 80, 300), []);
  useEffect(() => {
    scene.fog = fog;
    return () => {
      scene.fog = null;
    };
  }, [scene, fog]);

  const sunDir = useMemo(() => new Vector3(), []);
  const target = useRef({ hour: hourFor(timeOfDay), shown: hourFor(timeOfDay) });

  // Re-read the clock every half minute; a preset change eases over in ~2s.
  useEffect(() => {
    target.current.hour = hourFor(timeOfDay);
    const id = window.setInterval(() => (target.current.hour = hourFor(timeOfDay)), 30_000);
    return () => clearInterval(id);
  }, [timeOfDay]);

  useFrame((state, dt) => {
    const tg = target.current;
    // Ease the shown hour toward the target the short way round the clock.
    let d = tg.hour - tg.shown;
    if (d > 12) d -= 24;
    if (d < -12) d += 24;
    tg.shown = (tg.shown + d * (1 - Math.exp(-1.8 * Math.min(dt, 0.1))) + 24) % 24;

    const s = skyAt(tg.shown, liveSky);
    sunDir.set(
      Math.cos(s.sunElevation) * Math.sin(s.sunAzimuth),
      Math.sin(s.sunElevation),
      Math.cos(s.sunElevation) * Math.cos(s.sunAzimuth),
    );

    const u = sky.uniforms;
    u.uTop.value.copy(s.top);
    u.uHorizon.value.copy(s.horizon);
    u.uBottom.value.copy(s.bottom);
    u.uSun.value.copy(s.sun);
    u.uSunDir.value.copy(sunDir);
    u.uStars.value = s.stars;
    u.uTime.value = state.clock.elapsedTime;

    fog.color.copy(s.fog);

    const p = runtime.player.position;
    if (sun.current) {
      sun.current.color.copy(s.sun);
      sun.current.intensity = s.sunIntensity;
      // The shadow box follows the player, so shadows stay sharp everywhere.
      sun.current.position.set(p.x + sunDir.x * 60, p.y + Math.max(0.25, sunDir.y) * 60, p.z + sunDir.z * 60);
      sun.current.target.position.copy(p);
      sun.current.target.updateMatrixWorld();
    }
    if (hemi.current) {
      hemi.current.color.copy(s.hemiSky);
      hemi.current.groundColor.copy(s.hemiGround);
      hemi.current.intensity = s.hemiIntensity;
    }
  });

  const shadowSize = quality === "high" ? 2048 : 1024;

  return (
    <>
      <mesh material={sky} frustumCulled={false} renderOrder={-10}>
        <sphereGeometry args={[480, 32, 16]} />
      </mesh>
      <hemisphereLight ref={hemi} />
      <directionalLight
        ref={sun}
        castShadow={quality !== "low"}
        shadow-mapSize={[shadowSize, shadowSize]}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={30}
        shadow-camera-bottom={-30}
        shadow-camera-near={1}
        shadow-camera-far={160}
        shadow-bias={-0.0004}
        shadow-normalBias={0.04}
      />
    </>
  );
}
