"use client";

import { useEffect, useRef } from "react";

/**
 * Atmospheric layer: drifting dust, a soft light shaft and film grain, drawn on
 * a WebGL fullscreen quad above the SVG room.
 *
 * It is additive only — the room stays vector art. If WebGL is unavailable or
 * the visitor prefers reduced motion, nothing renders and the scene is exactly
 * as it was. No library; the whole thing is one fragment shader.
 */

const VERT = `
attribute vec2 p;
void main() { gl_Position = vec4(p, 0.0, 1.0); }
`;

const FRAG = `
precision mediump float;
uniform vec2  u_res;
uniform float u_time;
uniform vec3  u_tint;
uniform float u_strength;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

// One drifting mote: soft round falloff, slow vertical rise, gentle sway.
float mote(vec2 uv, float seed, float t) {
  float x = hash(vec2(seed, 1.0));
  float speed = 0.02 + hash(vec2(seed, 2.0)) * 0.05;
  float size = 0.0016 + hash(vec2(seed, 3.0)) * 0.0042;
  float y = fract(hash(vec2(seed, 4.0)) + t * speed);
  vec2 c = vec2(x + sin(t * 0.35 + seed) * 0.02, y);
  float d = distance(uv * vec2(u_res.x / u_res.y, 1.0), c * vec2(u_res.x / u_res.y, 1.0));
  // GLSL smoothstep is undefined when edge0 > edge1 — invert instead of
  // swapping the edges, or this returns 1.0 everywhere and floods the screen.
  return 1.0 - smoothstep(0.0, size, d);
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_res;
  float t = u_time;

  float dust = 0.0;
  for (int i = 0; i < 34; i++) {
    dust += mote(uv, float(i) * 7.13, t);
  }

  // A wide shaft falling from the upper right, where the window is.
  float shaft = 1.0 - smoothstep(0.08, 0.34, distance(uv.x - uv.y * 0.34, 0.78));
  shaft *= (1.0 - smoothstep(0.15, 1.05, uv.y)) * 0.10;

  float grain = (hash(uv * u_res + fract(t)) - 0.5) * 0.022;

  vec3 col = u_tint * (dust * 0.85 + shaft) + grain;
  float a = clamp(dust * 0.7 + shaft * 0.85 + abs(grain), 0.0, 1.0) * u_strength;
  gl_FragColor = vec4(col, a);
}
`;

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, src);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

/** @param tint rgb 0-1, set from the active cinematic scene's light. */
export function Atmosphere({ tint, strength = 1 }: { tint: [number, number, number]; strength?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  // The render loop reads the latest values without re-running the WebGL setup.
  const live = useRef({ tint, strength });
  useEffect(() => {
    live.current = { tint, strength };
  }, [tint, strength]);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const gl = canvas.getContext("webgl", { alpha: true, antialias: false, premultipliedAlpha: false });
    if (!gl) return; // no WebGL — the room simply renders without atmosphere

    const vs = compile(gl, gl.VERTEX_SHADER, VERT);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
    const program = gl.createProgram();
    if (!vs || !fs || !program) return;

    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(program, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(program, "u_res");
    const uTime = gl.getUniformLocation(program, "u_time");
    const uTint = gl.getUniformLocation(program, "u_tint");
    const uStrength = gl.getUniformLocation(program, "u_strength");

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    const resize = () => {
      // Half resolution: this is out-of-focus dust, nobody can tell.
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5) * 0.5;
      canvas.width = Math.max(1, Math.floor(canvas.clientWidth * dpr));
      canvas.height = Math.max(1, Math.floor(canvas.clientHeight * dpr));
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();
    window.addEventListener("resize", resize);

    let raf = 0;
    let running = true;
    const start = performance.now();

    const draw = () => {
      if (!running) return;
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uTime, (performance.now() - start) / 1000);
      gl.uniform3fv(uTint, live.current.tint);
      gl.uniform1f(uStrength, live.current.strength);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      raf = requestAnimationFrame(draw);
    };
    draw();

    // Stop burning frames on a tab nobody is looking at.
    const onVisibility = () => {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(raf);
      } else if (!running) {
        running = true;
        draw();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
      // Deliberately NOT calling loseContext(): Strict Mode double-invokes
      // effects, and a lost context cannot be recovered on the remount — the
      // canvas would stay dead for the life of the page.
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteBuffer(buffer);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      className="pointer-events-none absolute inset-0 h-full w-full"
      aria-hidden="true"
    />
  );
}
