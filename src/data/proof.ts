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
  { label: "Softventory", href: "https://softdigitconsulting.com/", note: "Enterprise SaaS, in production" },
  { label: "Hilook Interiors", href: "https://hilook-interiors.vercel.app", note: "Client site" },
  { label: "Softdigit Consulting", href: "https://soft-digits-consulting.vercel.app", note: "Company site" },
];

export function proofStats(now: Date = new Date()) {
  return [
    {
      value: String(monthsShipping(now)),
      label: "months in industry",
      note: "Software Developer at Softdigit Consulting since January 2026.",
    },
    {
      value: "1",
      label: "product in production",
      note: "Softventory, an enterprise inventory SaaS with real businesses using it.",
    },
    {
      value: String(liveDeployments.length),
      label: "live deployments",
      note: "Sites and products you can open right now.",
    },
    {
      value: String(publishedProjects.length),
      label: "projects published here",
      note: "Everything on this site links to source or to a live URL.",
    },
    {
      value: "10",
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
