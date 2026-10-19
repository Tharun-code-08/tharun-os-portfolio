import { contact } from "./profile";
import { publishedProjects } from "./projects";

/**
 * Only numbers that can be checked by clicking something.
 * No "10x developer", no invented user counts.
 */

const CAREER_START = new Date("2026-01-01");

export function monthsShipping(from: Date = new Date()): number {
  const months =
    (from.getFullYear() - CAREER_START.getFullYear()) * 12 +
    (from.getMonth() - CAREER_START.getMonth());
  return Math.max(1, months);
}

export const liveDeployments = [
  { label: "PitchMyWeb", href: "https://pitchmyweb.in", note: "Lead-to-pitch SaaS, live" },
  { label: "Softventory", href: "https://softdigitconsulting.com/", note: "Enterprise SaaS, in production" },
  {
    label: "Mini Playground",
    href: "https://github.com/Tharun-code-08/MY-IDLE",
    note: "Browser IDE — source",
  },
];

export function proofStats(now: Date = new Date()) {
  return [
    {
      value: String(monthsShipping(now)),
      label: "months in industry",
      note: "Writing production software continuously since January 2026, after an AR/VR internship in mid-2025.",
    },
    {
      value: "3",
      label: "products shipped",
      note: "Softventory, an enterprise inventory SaaS; BrandThis at Claxon AI; and PitchMyWeb, live at pitchmyweb.in.",
    },
    {
      value: "10+",
      label: "languages in my IDE",
      note: "Mini Playground runs them in the browser — Python on WebAssembly, SQLite compiled to the client.",
    },
    {
      value: String(publishedProjects.length),
      label: "projects published here",
      note: "Every one links to source or to a live URL.",
    },
    {
      value: "14",
      label: "public repositories",
      note: "Open on GitHub.",
    },
    {
      value: "8.2",
      label: "CGPA / 10",
      note: "B.E. Computer Science, Sathyabama Institute of Science and Technology.",
    },
  ];
}

export const proofLinks = [
  { label: "GitHub", href: contact.github, note: "Source for almost everything here." },
  { label: "LinkedIn", href: contact.linkedin, note: "The formal version." },
  { label: "Resume", href: contact.resume, note: "One page, no theme." },
];
