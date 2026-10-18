"use client";

import {
  type BufferGeometry,
  Color,
  Mesh,
  MeshStandardMaterial,
  type Object3D,
  DataTexture,
  MeshBasicMaterial,
  MeshToonMaterial,
  NearestFilter,
  RedFormat,
  type ColorRepresentation,
} from "three";

/**
 * One shared toon look. Three bands of light rather than a smooth falloff is
 * what makes the island read as illustrated instead of rendered.
 */

let gradient: DataTexture | null = null;

export function toonGradient() {
  if (gradient) return gradient;
  const data = new Uint8Array([70, 150, 215, 255]);
  gradient = new DataTexture(data, data.length, 1, RedFormat);
  gradient.minFilter = NearestFilter;
  gradient.magFilter = NearestFilter;
  gradient.generateMipmaps = false;
  gradient.needsUpdate = true;
  return gradient;
}

const toonCache = new Map<string, MeshToonMaterial>();

/** Cached per colour, so a hundred fence posts share one material. */
export function toon(color: ColorRepresentation, opts: { emissive?: ColorRepresentation; glow?: number } = {}) {
  const key = `${new Color(color).getHexString()}|${opts.emissive ?? ""}|${opts.glow ?? 0}`;
  let m = toonCache.get(key);
  if (!m) {
    m = new MeshToonMaterial({ color, gradientMap: toonGradient() });
    if (opts.emissive) {
      m.emissive = new Color(opts.emissive);
      m.emissiveIntensity = opts.glow ?? 1;
    }
    toonCache.set(key, m);
  }
  return m;
}

const glowCache = new Map<string, MeshBasicMaterial>();

/**
 * Unlit, over-bright colour for screens, beacons and holograms. Values above 1
 * are what the bloom pass picks up, so `intensity` is how much it glows.
 */
export function glow(color: ColorRepresentation, intensity = 2, opacity = 1) {
  const key = `${new Color(color).getHexString()}|${intensity}|${opacity}`;
  let m = glowCache.get(key);
  if (!m) {
    m = new MeshBasicMaterial({
      color: new Color(color).multiplyScalar(intensity),
      toneMapped: false,
      transparent: opacity < 1,
      opacity,
      depthWrite: opacity >= 1,
    });
    glowCache.set(key, m);
  }
  return m;
}

/** The palette, in one place, so the island stays one illustration. */
export const PAL = {
  grass: "#86b85a",
  grassDark: "#5f8f45",
  grassDry: "#b5b862",
  sand: "#e2c48c",
  path: "#cfa774",
  dirt: "#8a5a3c",
  rockTop: "#7a5a4a",
  rock: "#5b4252",
  rockDeep: "#3a2b45",
  wood: "#a0744d",
  woodDark: "#6d4c30",
  woodLight: "#c99a68",
  stone: "#b8aea2",
  stoneDark: "#8d8478",
  roof: "#d4553f",
  roofDark: "#a8402f",
  wall: "#f1e4cf",
  metal: "#4a4f5c",
  metalLight: "#8d93a3",
  leaf: "#4f8a4a",
  leafLight: "#74ad55",
  leafWarm: "#d98b3a",
  trunk: "#6d4c30",
  accent: "#ffb020",
  shirt: "#b83b34",
  skin: "#c98c5e",
  hair: "#221812",
  pants: "#39405a",
  shoe: "#ece7de",
} as const;

/**
 * Faceted look without flatShading (toon materials don't take it): split the
 * vertices so every face gets its own normal.
 */
export function faceted<T extends BufferGeometry>(geo: T): BufferGeometry {
  const g = geo.index ? geo.toNonIndexed() : geo;
  g.computeVertexNormals();
  return g;
}

/**
 * Screen-door fade for things the camera can end up inside (tree crowns,
 * rocks): fragments closer than `far` metres to the camera dissolve in a
 * dither pattern, gone entirely by `near`. No sorting, no transparency.
 */
export function nearFade<T extends MeshToonMaterial>(m: T, near = 1.2, far = 3.4): T {
  m.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace(
      "void main() {",
      `float nfBayer2(vec2 a) { a = floor(a); return fract(dot(a, vec2(0.5, a.y * 0.75))); }
float nfBayer4(vec2 a) { return nfBayer2(0.5 * a) * 0.25 + nfBayer2(a); }
void main() {
  {
    float keep = smoothstep(${near.toFixed(2)}, ${far.toFixed(2)}, length(vViewPosition));
    if (keep < 0.999 && keep <= nfBayer4(gl_FragCoord.xy)) discard;
  }`,
    );
  };
  m.customProgramCacheKey = () => `nearFade-${near}-${far}`;
  return m;
}

/**
 * Swap the PBR materials a GLB arrives with for the island's toon look,
 * keeping colour and emission (screens and LEDs stay lit, and bloom).
 */
export function toonify(root: Object3D, opts: { shadows?: boolean } = {}) {
  const cache = new Map<string, MeshToonMaterial>();
  const swap = (m: MeshStandardMaterial) => {
    let t = cache.get(m.uuid);
    if (!t) {
      t = new MeshToonMaterial({ color: m.color, gradientMap: toonGradient(), name: m.name });
      if (m.emissive && m.emissive.getHex() !== 0) {
        t.emissive.copy(m.emissive);
        t.emissiveIntensity = Math.max(2, m.emissiveIntensity);
        t.toneMapped = false;
      }
      cache.set(m.uuid, t);
    }
    return t;
  };
  root.traverse((o) => {
    if (!(o instanceof Mesh)) return;
    o.castShadow = opts.shadows ?? true;
    o.receiveShadow = true;
    o.material = Array.isArray(o.material)
      ? o.material.map((m) => swap(m as MeshStandardMaterial))
      : swap(o.material as MeshStandardMaterial);
  });
  return root;
}
