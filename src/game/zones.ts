import type { AppId } from "@/lib/apps";
import { publishedProjects } from "@/data/projects";
import { buildLog } from "@/data/journal";
import { stack } from "@/data/profile";
import { sites } from "@/data/sites";
import { LAYOUT, TIMELINE_PATH, heightAt, samplePolyline, smoothPath, type Vec2 } from "./terrain";

/**
 * The places on the island, and the things you can walk up to in each one.
 *
 * Every interactable here is derived from src/data — add a project and a new
 * hologram appears in the workshop; add a build-log entry and the timeline
 * grows a stone. Nothing about content is hard-coded in the world components.
 */

export type ZoneId = "studio" | "workshop" | "lab" | "timeline" | "arcade" | "tower" | "board";

export type Zone = {
  id: ZoneId;
  name: string;
  /** The line under the name on the location banner. */
  tag: string;
  center: Vec2;
  /** Radius of the "you are here" region. */
  radius: number;
  /** Accent used on the minimap and banner. */
  color: string;
  /** One glyph for the minimap. */
  glyph: string;
};

export const ZONES: Zone[] = [
  { id: "studio", name: "The Studio", tag: "Where the work happens", center: LAYOUT.studio, radius: 10, color: "#ffb020", glyph: "⌂" },
  { id: "workshop", name: "The Workshop", tag: "Things that exist", center: LAYOUT.workshop, radius: 10, color: "#ff7a45", glyph: "⚒" },
  { id: "lab", name: "The Lab", tag: "Questions I haven't finished", center: LAYOUT.lab, radius: 9, color: "#6aa6ff", glyph: "⚗" },
  { id: "arcade", name: "The Arcade", tag: "The stack, one cabinet each", center: LAYOUT.arcade, radius: 9, color: "#c77dff", glyph: "◈" },
  { id: "tower", name: "Radio Tower", tag: "Send a signal", center: LAYOUT.tower, radius: 8, color: "#57d18a", glyph: "⌁" },
  { id: "board", name: "Notice Board", tag: "What I'm doing this month", center: LAYOUT.board, radius: 3.5, color: "#f3e6c8", glyph: "▤" },
  { id: "timeline", name: "The Long Road", tag: "2025 → now, one stone per moment", center: TIMELINE_PATH[3], radius: 0, color: "#ffd27a", glyph: "∿" },
];

export const ZONE_BY_ID = Object.fromEntries(ZONES.map((z) => [z.id, z])) as Record<ZoneId, Zone>;

export type Action =
  | { kind: "app"; app: AppId; payload?: string; title?: string }
  | { kind: "os" }
  | { kind: "recruiter" };

export type Interactable = {
  id: string;
  zone: ZoneId;
  /** What it is — "Softventory". */
  label: string;
  /** What pressing E does — "Open case file". */
  verb: string;
  position: [number, number, number];
  /** How close you need to be. */
  reach: number;
  action: Action;
};

function at(x: number, z: number, lift = 0): [number, number, number] {
  return [x, heightAt(x, z) + lift, z];
}

/* ----------------------------------------------------------- studio ---- */

/** The studio's footprint and the desk inside it, shared with Studio.tsx. */
export const STUDIO = {
  center: LAYOUT.studio,
  width: 10,
  depth: 8,
  /** Floor height of the studio deck. */
  floor: heightAt(...LAYOUT.studio) + 0.32,
  desk: [LAYOUT.studio[0] + 2.4, LAYOUT.studio[1] - 2.2] as Vec2,
};

/** The CRT on the desk: centre of the glass, facing +z. The camera dives here. */
export const MONITOR = {
  x: STUDIO.desk[0],
  y: STUDIO.floor + 1.12,
  z: STUDIO.desk[1] + 0.215,
};

/** The arcade canopy: a flat roof you can reach by climbing the crates. */
export const ARCADE_ROOF = {
  center: LAYOUT.arcade,
  size: 12.5,
  top: heightAt(...LAYOUT.arcade) + 3.1,
};

/* --------------------------------------------------------- workshop ---- */

/** Project holograms stand on an arc around the workshop bench, facing in. */
export const PROJECT_SLOTS = publishedProjects.map((p, i, all) => {
  const [cx, cz] = LAYOUT.workshop;
  const spread = (150 * Math.PI) / 180;
  const a = -spread / 2 + (all.length === 1 ? 0.5 : i / (all.length - 1)) * spread;
  const r = 6.2;
  const x = cx + Math.cos(a) * r;
  const z = cz + Math.sin(a) * r;
  // Face the bench in the middle.
  const facing = Math.atan2(cx - x, cz - z);
  return { project: p, x, z, facing };
});

/* ----------------------------------------------------------- arcade ---- */

export const CABINET_SLOTS = stack.map((group, i, all) => {
  const [cx, cz] = LAYOUT.arcade;
  const spread = (160 * Math.PI) / 180;
  const a = Math.PI - spread / 2 + (i / Math.max(1, all.length - 1)) * spread;
  const r = 5.4;
  const x = cx + Math.cos(a + Math.PI / 2) * r;
  const z = cz + Math.sin(a + Math.PI / 2) * r;
  const facing = Math.atan2(cx - x, cz - z);
  return { group, x, z, facing };
});

/* --------------------------------------------------------- timeline ---- */

export const TIMELINE_LINE = smoothPath(TIMELINE_PATH, 10);

/** Oldest first, so walking the road is walking forward in time. */
export const TIMELINE_STONES = (() => {
  const entries = [...buildLog].sort((a, b) => a.date.localeCompare(b.date));
  const spots = samplePolyline(TIMELINE_LINE, entries.length);
  return entries.map((entry, i) => {
    const [x, z] = spots[i];
    // Offset each stone a little off the road, alternating sides.
    const next = spots[Math.min(spots.length - 1, i + 1)];
    const prev = spots[Math.max(0, i - 1)];
    const dx = next[0] - prev[0];
    const dz = next[1] - prev[1];
    const len = Math.hypot(dx, dz) || 1;
    const side = i % 2 === 0 ? 1 : -1;
    const ox = (-dz / len) * 1.7 * side;
    const oz = (dx / len) * 1.7 * side;
    return { entry, x: x + ox, z: z + oz, index: i };
  });
})();

/* --------------------------------------------------------- registry ---- */

export const INTERACTABLES: Interactable[] = [
  {
    id: "pc",
    zone: "studio",
    label: "THARUN OS",
    verb: "Boot the computer",
    position: [STUDIO.desk[0], STUDIO.floor + 0.9, STUDIO.desk[1] + 1.1],
    reach: 1.7,
    action: { kind: "os" },
  },
  {
    id: "me",
    zone: "studio",
    label: "About me",
    verb: "Read the ID card",
    position: [LAYOUT.studio[0] - 3.6, STUDIO.floor + 1.2, LAYOUT.studio[1] + 1.6],
    reach: 1.7,
    action: { kind: "app", app: "me" },
  },
  {
    id: "now",
    zone: "board",
    label: "Notice board",
    verb: "Read what's pinned",
    position: at(LAYOUT.board[0], LAYOUT.board[1], 1.2),
    reach: 2,
    action: { kind: "app", app: "now" },
  },
  {
    id: "recruiter",
    zone: "board",
    label: "Short on time?",
    verb: "Recruiter Mode — one page",
    position: at(LAYOUT.spawn[0] - 3.2, LAYOUT.spawn[1] - 1.5, 0.9),
    reach: 1.8,
    action: { kind: "recruiter" },
  },
  {
    id: "bench",
    zone: "workshop",
    label: "Workbench",
    verb: "See everything I've built",
    position: at(LAYOUT.workshop[0], LAYOUT.workshop[1], 0.9),
    reach: 2,
    action: { kind: "app", app: "work" },
  },
  ...PROJECT_SLOTS.map<Interactable>(({ project, x, z }) => ({
    id: `project:${project.id}`,
    zone: "workshop",
    label: project.name,
    verb: project.study.length > 0 ? "Open the case file" : "Look closer",
    position: at(x, z, 1.4),
    reach: 1.5,
    action:
      project.study.length > 0
        ? { kind: "app", app: "project", payload: project.id, title: `CASE_FILE · ${project.name.toUpperCase()}` }
        : { kind: "app", app: "work" },
  })),
  {
    id: "live",
    zone: "workshop",
    label: "Live: BrandThis",
    verb: "Open it in the browser",
    position: at(LAYOUT.workshop[0] - 7, LAYOUT.workshop[1] + 5, 1.6),
    reach: 2,
    action: { kind: "app", app: "browser", payload: sites[1]?.id, title: "BROWSER" },
  },
  {
    id: "lab-console",
    zone: "lab",
    label: "Lab console",
    verb: "Open the questions",
    position: at(LAYOUT.lab[0], LAYOUT.lab[1], 1),
    reach: 2.2,
    action: { kind: "app", app: "lab" },
  },
  ...CABINET_SLOTS.map<Interactable>(({ group, x, z }) => ({
    id: `cabinet:${group.label}`,
    zone: "arcade",
    label: group.label,
    verb: "Insert coin",
    position: at(x, z, 1.2),
    reach: 1.4,
    action: { kind: "app", app: "stack" },
  })),
  {
    id: "contact",
    zone: "tower",
    label: "Radio",
    verb: "Send a signal",
    position: at(LAYOUT.tower[0] - 2.2, LAYOUT.tower[1] + 2.4, 1),
    reach: 1.8,
    action: { kind: "app", app: "contact" },
  },
  {
    id: "proof",
    zone: "tower",
    label: "Proof plaque",
    verb: "Check the numbers",
    position: at(LAYOUT.tower[0] + 2.6, LAYOUT.tower[1] + 2.2, 1),
    reach: 1.8,
    action: { kind: "app", app: "proof" },
  },
  ...TIMELINE_STONES.map<Interactable>(({ entry, x, z, index }) => ({
    id: `stone:${index}`,
    zone: "timeline",
    label: entry.title,
    verb: "Read the build log",
    position: at(x, z, 1),
    reach: 1.6,
    action: { kind: "app", app: "log" },
  })),
];

export const INTERACTABLE_BY_ID = Object.fromEntries(INTERACTABLES.map((i) => [i.id, i])) as Record<
  string,
  Interactable
>;

/* ------------------------------------------------------- collectibles -- */

/**
 * Five floating commits hidden around the island. Each one carries a real line
 * from the build log, so finding them is also reading the story out of order.
 */
const COMMIT_SPOTS: { id: string; x: number; z: number; lift: number; hint: string }[] = [
  { id: "c-hill", x: 2, z: -33, lift: 1.3, hint: "The top of the north hill" },
  { id: "c-behind", x: -4.5, z: -10.2, lift: 1.1, hint: "Behind the studio" },
  { id: "c-roof", x: -24.5, z: 3.5, lift: 3.85, hint: "Somewhere above the arcade" },
  { id: "c-edge", x: 33.5, z: 4, lift: 1.1, hint: "Out by the east cliff" },
  { id: "c-west", x: -32, z: -9, lift: 1.2, hint: "The west lookout" },
];

export const COMMITS = (() => {
  const entries = [...buildLog].sort((a, b) => a.date.localeCompare(b.date));
  const picks = [0, 4, 6, 8, entries.length - 1].map((i) => entries[Math.min(i, entries.length - 1)]);
  return COMMIT_SPOTS.map((spot, i) => ({
    ...spot,
    y: heightAt(spot.x, spot.z) + spot.lift,
    hash: hashOf(picks[i].title),
    entry: picks[i],
  }));
})();

function hashOf(text: string) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return (h >>> 0).toString(16).padStart(8, "0").slice(0, 7);
}

/** Where fast travel drops you: just outside each place, on the path side. */
export const TRAVEL: Record<ZoneId, Vec2> = {
  studio: [0, 7.5],
  workshop: [13.4, -1.6],
  lab: [-10.4, -12.8],
  arcade: [-14.4, 1.6],
  tower: [10.6, -16.2],
  board: [5.6, 9.2],
  timeline: [-23.6, 11.2],
};
