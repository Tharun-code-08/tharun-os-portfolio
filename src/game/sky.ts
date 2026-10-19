import { Color } from "three";
import type { TimeOfDay } from "./store";

/**
 * The light, as a function of the visitor's real hour.
 *
 * A handful of hand-picked keyframes rather than a physical sky: the island is
 * an illustration, and illustrations choose their colours. Everything is
 * interpolated, so 18:40 is a real point between golden hour and dusk.
 */

export type SkyState = {
  top: Color;
  horizon: Color;
  bottom: Color;
  sun: Color;
  sunIntensity: number;
  /** Elevation in radians; negative is below the horizon. */
  sunElevation: number;
  sunAzimuth: number;
  hemiSky: Color;
  hemiGround: Color;
  hemiIntensity: number;
  fog: Color;
  stars: number;
  /** 0 by day, 1 at night — lamps, windows and fireflies key off it. */
  night: number;
  water: Color;
  waterDeep: Color;
};

type Key = {
  hour: number;
  top: string;
  horizon: string;
  bottom: string;
  sun: string;
  sunIntensity: number;
  sunElevation: number;
  hemiSky: string;
  hemiGround: string;
  hemiIntensity: number;
  fog: string;
  stars: number;
  night: number;
  water: string;
  waterDeep: string;
};

const DEG = Math.PI / 180;

const KEYS: Key[] = [
  { hour: 0, top: "#070b1f", horizon: "#1b2147", bottom: "#090c1c", sun: "#8ea2ff", sunIntensity: 0.55, sunElevation: 40 * DEG, hemiSky: "#3a4a8a", hemiGround: "#151226", hemiIntensity: 0.55, fog: "#141a3a", stars: 1, night: 1, water: "#1c2a5a", waterDeep: "#0a1030" },
  { hour: 5, top: "#1d2552", horizon: "#e58a7a", bottom: "#2a2340", sun: "#ffb48a", sunIntensity: 0.9, sunElevation: 4 * DEG, hemiSky: "#8a8fd0", hemiGround: "#3a2a3a", hemiIntensity: 0.7, fog: "#c98a8a", stars: 0.3, night: 0.6, water: "#7b6aa0", waterDeep: "#2a2a5a" },
  { hour: 8, top: "#4f8fe0", horizon: "#ffd9b0", bottom: "#7aa2d8", sun: "#fff1d6", sunIntensity: 2.1, sunElevation: 28 * DEG, hemiSky: "#bcd6ff", hemiGround: "#6a5a3a", hemiIntensity: 0.9, fog: "#cfe0f5", stars: 0, night: 0, water: "#4aa3d8", waterDeep: "#1e5a9a" },
  { hour: 13, top: "#3a7fe0", horizon: "#bfe0ff", bottom: "#7fb0e8", sun: "#ffffff", sunIntensity: 2.5, sunElevation: 62 * DEG, hemiSky: "#c9e2ff", hemiGround: "#6a6040", hemiIntensity: 1, fog: "#cbe3fb", stars: 0, night: 0, water: "#3fa9e0", waterDeep: "#145a9e" },
  { hour: 17, top: "#4a6fc0", horizon: "#ffc08a", bottom: "#c98a7a", sun: "#ffd29a", sunIntensity: 2.2, sunElevation: 18 * DEG, hemiSky: "#ffd0b0", hemiGround: "#5a3a3a", hemiIntensity: 0.85, fog: "#f0b890", stars: 0, night: 0.05, water: "#e08a79", waterDeep: "#6a3a6a" },
  { hour: 18.7, top: "#3a3a8a", horizon: "#ff8a5a", bottom: "#a35a7c", sun: "#ff9a5a", sunIntensity: 1.8, sunElevation: 5 * DEG, hemiSky: "#ff9ab0", hemiGround: "#4a2a40", hemiIntensity: 0.8, fog: "#e07a72", stars: 0.15, night: 0.35, water: "#e07a72", waterDeep: "#5a2a5a" },
  { hour: 20, top: "#141a46", horizon: "#7a4a8a", bottom: "#1f1a3a", sun: "#c48aff", sunIntensity: 0.75, sunElevation: 30 * DEG, hemiSky: "#5a5aa0", hemiGround: "#201a30", hemiIntensity: 0.6, fog: "#3a2f5a", stars: 0.8, night: 0.9, water: "#3a3a7a", waterDeep: "#141a40" },
  { hour: 24, top: "#070b1f", horizon: "#1b2147", bottom: "#090c1c", sun: "#8ea2ff", sunIntensity: 0.55, sunElevation: 40 * DEG, hemiSky: "#3a4a8a", hemiGround: "#151226", hemiIntensity: 0.55, fog: "#141a3a", stars: 1, night: 1, water: "#1c2a5a", waterDeep: "#0a1030" },
];

const PRESET_HOURS: Record<Exclude<TimeOfDay, "auto">, number> = {
  dawn: 5.6,
  day: 11,
  dusk: 18.4,
  night: 22.5,
};

export function hourFor(tod: TimeOfDay, now = new Date()): number {
  if (tod !== "auto") return PRESET_HOURS[tod];
  return now.getHours() + now.getMinutes() / 60;
}

const scratch = { a: new Color(), b: new Color() };

function mix(a: string, b: string, t: number, out: Color) {
  return out.copy(scratch.a.set(a)).lerp(scratch.b.set(b), t);
}

export function skyAt(hour: number, out?: SkyState): SkyState {
  const h = ((hour % 24) + 24) % 24;
  let i = 0;
  while (i < KEYS.length - 2 && KEYS[i + 1].hour <= h) i++;
  const a = KEYS[i];
  const b = KEYS[i + 1];
  const t = (h - a.hour) / (b.hour - a.hour);
  const s =
    out ??
    ({
      top: new Color(),
      horizon: new Color(),
      bottom: new Color(),
      sun: new Color(),
      hemiSky: new Color(),
      hemiGround: new Color(),
      fog: new Color(),
      water: new Color(),
      waterDeep: new Color(),
    } as SkyState);

  mix(a.top, b.top, t, s.top);
  mix(a.horizon, b.horizon, t, s.horizon);
  mix(a.bottom, b.bottom, t, s.bottom);
  mix(a.sun, b.sun, t, s.sun);
  mix(a.hemiSky, b.hemiSky, t, s.hemiSky);
  mix(a.hemiGround, b.hemiGround, t, s.hemiGround);
  mix(a.fog, b.fog, t, s.fog);
  mix(a.water, b.water, t, s.water);
  mix(a.waterDeep, b.waterDeep, t, s.waterDeep);
  const lerp = (x: number, y: number) => x + (y - x) * t;
  s.sunIntensity = lerp(a.sunIntensity, b.sunIntensity);
  s.sunElevation = lerp(a.sunElevation, b.sunElevation);
  // The sun swings east → west through the day; at night the "sun" is the moon.
  s.sunAzimuth = (h / 24) * Math.PI * 2 + Math.PI * 0.35;
  s.hemiIntensity = lerp(a.hemiIntensity, b.hemiIntensity);
  s.stars = lerp(a.stars, b.stars);
  s.night = lerp(a.night, b.night);
  return s;
}

/**
 * The sky the world is currently lit by. Environment.tsx writes it; lamps,
 * windows and fireflies read `night` from it inside useFrame.
 */
export const liveSky: SkyState = skyAt(18.4);
