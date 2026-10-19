/**
 * The island, as one function.
 *
 * Everything that needs to know where the ground is — the visible mesh, the
 * physics collider, every prop, the grass, the minimap — asks `heightAt`. Move
 * a place in LAYOUT and the ground settles itself flat underneath it.
 */

export type Vec2 = readonly [number, number];

/** Where each place sits, in metres. North is −z. */
export const LAYOUT = {
  spawn: [0, 12],
  studio: [0, -3],
  board: [7.5, 6],
  workshop: [21, -3],
  tower: [15, -23],
  lab: [-16, -18],
  arcade: [-22, 2],
} satisfies Record<string, Vec2>;

/** The build log walks along this arc on the south side, oldest first. */
export const TIMELINE_PATH: Vec2[] = [
  [-26, 8],
  [-19, 17],
  [-8, 23],
  [5, 24],
  [16, 19.5],
  [25, 10],
];

/** Dirt paths between places. Colour only — they do not change the height. */
export const PATHS: Vec2[][] = [
  [LAYOUT.spawn, [0, 6], LAYOUT.studio],
  [LAYOUT.studio, [10, -3], LAYOUT.workshop],
  [LAYOUT.studio, [-11, 0], LAYOUT.arcade],
  [LAYOUT.studio, [-7, -11], LAYOUT.lab],
  [LAYOUT.studio, [7, -13], LAYOUT.tower],
  [LAYOUT.spawn, [-4, 18], TIMELINE_PATH[2]],
  TIMELINE_PATH,
];

/** Flat pads the ground blends into: [x, z, inner radius, outer radius, height]. */
const PADS: [number, number, number, number, number][] = [
  [...LAYOUT.spawn, 3, 7, 0.55],
  [...LAYOUT.studio, 9, 14, 0.6],
  [...LAYOUT.board, 2, 4, 0.55],
  [...LAYOUT.workshop, 8, 13, 0.45],
  [...LAYOUT.tower, 5, 9, 2.1],
  [...LAYOUT.lab, 7, 11, 0.9],
  [...LAYOUT.arcade, 7, 11, 0.3],
];

/** Raised ground worth climbing. [x, z, radius, height] */
const HILLS: [number, number, number, number][] = [
  [2, -33, 10, 6.5],
  [-32, -9, 7, 3.4],
  [30, 12, 7, 2.6],
  [-9, 30, 6, 1.4],
  [31, -14, 5, 2.2],
];

export const ISLAND_RADIUS = 40;

/** Where the spring spills over the edge (radians around the island). */
export const SPRING_THETA = -2.62;

/** An irregular coastline, so the island never reads as a perfect disc. */
export function coastRadius(theta: number): number {
  return (
    ISLAND_RADIUS +
    2.8 * Math.sin(3 * theta + 0.4) +
    1.9 * Math.cos(5 * theta + 1.3) +
    1.1 * Math.sin(9 * theta + 2.1)
  );
}

export function insideIsland(x: number, z: number, margin = 0): boolean {
  return Math.hypot(x, z) < coastRadius(Math.atan2(z, x)) - margin;
}

function smoothstep(a: number, b: number, x: number) {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

function rolling(x: number, z: number) {
  return (
    0.9 * Math.sin(x * 0.13 + 1.3) * Math.cos(z * 0.11 - 0.7) +
    0.45 * Math.sin(x * 0.27 - z * 0.21 + 2.0) +
    0.22 * Math.cos(x * 0.5 + z * 0.43)
  );
}

export function heightAt(x: number, z: number): number {
  let h = 0.7 + rolling(x, z);

  for (const [cx, cz, r, height] of HILLS) {
    const d2 = ((x - cx) ** 2 + (z - cz) ** 2) / (r * r);
    h += height * Math.exp(-d2 * 2);
  }

  for (const [cx, cz, inner, outer, height] of PADS) {
    const w = 1 - smoothstep(inner, outer, Math.hypot(x - cx, z - cz));
    h += (height - h) * w;
  }

  // The ground rolls off gently toward the cliff edge rather than stopping dead.
  const r = Math.hypot(x, z);
  const coast = coastRadius(Math.atan2(z, x));
  h -= smoothstep(coast - 6, coast, r) * 1.1;

  return h;
}

/** Distance from a point to a polyline, for paths and grass exclusion. */
export function distanceToPolyline(x: number, z: number, line: readonly Vec2[]): number {
  let best = Infinity;
  for (let i = 0; i < line.length - 1; i++) {
    const [ax, az] = line[i];
    const [bx, bz] = line[i + 1];
    const dx = bx - ax;
    const dz = bz - az;
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz)));
    best = Math.min(best, Math.hypot(x - (ax + t * dx), z - (az + t * dz)));
  }
  return best;
}

/** Catmull-Rom through the control points, so paths curve instead of kinking. */
export function smoothPath(points: readonly Vec2[], perSegment = 8): Vec2[] {
  const out: Vec2[] = [];
  const p = (i: number) => points[Math.max(0, Math.min(points.length - 1, i))];
  for (let i = 0; i < points.length - 1; i++) {
    const [p0, p1, p2, p3] = [p(i - 1), p(i), p(i + 1), p(i + 2)];
    for (let s = 0; s < perSegment; s++) {
      const t = s / perSegment;
      const t2 = t * t;
      const t3 = t2 * t;
      const f = (a: number, b: number, c: number, d: number) =>
        0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  out.push(points[points.length - 1]);
  return out;
}

export const SMOOTH_PATHS = PATHS.map((p) => smoothPath(p));

export function pathDistance(x: number, z: number): number {
  let best = Infinity;
  for (const line of SMOOTH_PATHS) best = Math.min(best, distanceToPolyline(x, z, line));
  return best;
}

/** Evenly spaced points along a polyline — used to plant timeline stones. */
export function samplePolyline(line: readonly Vec2[], count: number): Vec2[] {
  const lengths = [0];
  for (let i = 1; i < line.length; i++) {
    lengths.push(lengths[i - 1] + Math.hypot(line[i][0] - line[i - 1][0], line[i][1] - line[i - 1][1]));
  }
  const total = lengths[lengths.length - 1];
  const out: Vec2[] = [];
  for (let k = 0; k < count; k++) {
    const target = count === 1 ? total / 2 : (k / (count - 1)) * total;
    let i = 1;
    while (i < lengths.length - 1 && lengths[i] < target) i++;
    const seg = lengths[i] - lengths[i - 1] || 1;
    const t = (target - lengths[i - 1]) / seg;
    out.push([
      line[i - 1][0] + (line[i][0] - line[i - 1][0]) * t,
      line[i - 1][1] + (line[i][1] - line[i - 1][1]) * t,
    ]);
  }
  return out;
}

/** Small deterministic PRNG, so the island is the same island on every visit. */
export function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
