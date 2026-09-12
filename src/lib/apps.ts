import { failures, lab, notes } from "@/data/journal";

export type AppId =
  | "me"
  | "work"
  | "project"
  | "lab"
  | "log"
  | "stack"
  | "now"
  | "proof"
  | "notes"
  | "failures"
  | "contact"
  | "terminal"
  | "settings";

export type AppDef = {
  id: AppId;
  /** Shown in the window title bar and the dock tooltip. */
  title: string;
  /** Shown under the dock icon and in the mobile list. */
  label: string;
  hint: string;
  icon: AppId;
  size: { w: number; h: number };
  /** Position in the dock. Omit to keep it out of the dock. */
  dock?: number;
  /** Extra words the command palette should match on. */
  keywords: string[];
  /** False hides it everywhere — used for sections with no content yet. */
  available: boolean;
};

export const APPS: Record<AppId, AppDef> = {
  me: {
    id: "me",
    title: "ME.exe",
    label: "Me",
    hint: "Who is typing",
    icon: "me",
    size: { w: 620, h: 560 },
    dock: 1,
    keywords: ["about", "bio", "who", "intro", "story"],
    available: true,
  },
  work: {
    id: "work",
    title: "WORK",
    label: "Work",
    hint: "Things that exist",
    icon: "work",
    size: { w: 860, h: 620 },
    dock: 2,
    keywords: ["projects", "portfolio", "softventory", "case study", "built"],
    available: true,
  },
  project: {
    id: "project",
    title: "PROJECT",
    label: "Project",
    hint: "Case file",
    icon: "project",
    size: { w: 780, h: 640 },
    keywords: ["case study", "detail"],
    available: true,
  },
  lab: {
    id: "lab",
    title: "LAB",
    label: "Lab",
    hint: "Open questions",
    icon: "lab",
    size: { w: 760, h: 600 },
    dock: 3,
    keywords: ["experiments", "questions", "research", "trying"],
    available: lab.length > 0,
  },
  log: {
    id: "log",
    title: "BUILD_LOG",
    label: "Build log",
    hint: "What happened when",
    icon: "log",
    size: { w: 720, h: 600 },
    dock: 4,
    keywords: ["changelog", "timeline", "journey", "history"],
    available: true,
  },
  stack: {
    id: "stack",
    title: "STACK",
    label: "Stack",
    hint: "Tools, and why",
    icon: "stack",
    size: { w: 740, h: 580 },
    dock: 5,
    keywords: ["skills", "tech", "languages", "tools", "typescript"],
    available: true,
  },
  now: {
    id: "now",
    title: "NOW",
    label: "Now",
    hint: "This month",
    icon: "now",
    size: { w: 640, h: 540 },
    dock: 6,
    keywords: ["current", "today", "building", "learning"],
    available: true,
  },
  proof: {
    id: "proof",
    title: "PROOF",
    label: "Proof",
    hint: "Check it yourself",
    icon: "proof",
    size: { w: 720, h: 580 },
    dock: 7,
    keywords: ["evidence", "github", "stats", "numbers", "resume"],
    available: true,
  },
  notes: {
    id: "notes",
    title: "NOTES",
    label: "Notes",
    hint: "Short write-ups",
    icon: "notes",
    size: { w: 700, h: 600 },
    dock: 8,
    keywords: ["blog", "writing", "articles", "thoughts"],
    available: notes.length > 0,
  },
  failures: {
    id: "failures",
    title: "FAILURE_MUSEUM",
    label: "Failures",
    hint: "What did not work",
    icon: "failures",
    size: { w: 720, h: 600 },
    dock: 9,
    keywords: ["mistakes", "lessons", "broke", "abandoned"],
    available: failures.length > 0,
  },
  contact: {
    id: "contact",
    title: "CONTACT",
    label: "Contact",
    hint: "Say something",
    icon: "contact",
    size: { w: 620, h: 580 },
    dock: 10,
    keywords: ["email", "hire", "reach", "linkedin", "phone", "talk"],
    available: true,
  },
  settings: {
    id: "settings",
    title: "SETTINGS",
    label: "Settings",
    hint: "Make it yours",
    icon: "settings",
    size: { w: 660, h: 580 },
    dock: 12,
    keywords: ["theme", "appearance", "dark", "light", "shortcuts", "keyboard", "about"],
    available: true,
  },
  terminal: {
    id: "terminal",
    title: "TERMINAL",
    label: "Terminal",
    hint: "For the impatient",
    icon: "terminal",
    size: { w: 680, h: 460 },
    dock: 11,
    keywords: ["shell", "cli", "commands", "sudo"],
    available: true,
  },
};

export const dockApps = Object.values(APPS)
  .filter((a) => a.dock !== undefined && a.available)
  .sort((a, b) => (a.dock ?? 99) - (b.dock ?? 99));

export const launchableApps = Object.values(APPS).filter((a) => a.available && a.id !== "project");
