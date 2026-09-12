import { NextResponse } from "next/server";
import { contact, now, profile, stack } from "@/data/profile";
import { publishedExperience, publishedProjects, education } from "@/data/projects";
import { buildLog, lab } from "@/data/journal";

// Dynamic on purpose: the ?q= filter has to read the request, which a
// force-static route cannot do — it would silently serve the full payload.
export const dynamic = "force-dynamic";

/**
 * The portfolio has an API. Same data the UI renders, no separate source of truth.
 * GET /api/portfolio            everything
 * GET /api/portfolio?q=projects one section
 */
export function GET(request: Request) {
  const section = new URL(request.url).searchParams.get("q");

  const payload = {
    name: profile.name,
    role: profile.role,
    location: profile.location,
    tagline: profile.tagline,
    status: profile.status,
    now,
    contact: {
      email: contact.email,
      github: contact.github,
      linkedin: contact.linkedin,
    },
    projects: publishedProjects.map((p) => ({
      id: p.id,
      name: p.name,
      summary: p.summary,
      status: p.status,
      period: p.period,
      role: p.role,
      tech: p.tech,
      links: p.links,
      hasCaseStudy: p.study.length > 0,
    })),
    experience: publishedExperience.map((j) => ({
      company: j.company,
      role: j.role,
      period: j.period,
      product: j.product,
    })),
    education,
    stack: Object.fromEntries(stack.map((g) => [g.label, g.items.map((i) => i.name)])),
    buildLog: buildLog.map((e) => ({ date: e.date, kind: e.kind, title: e.title })),
    openQuestions: lab.map((e) => ({ question: e.question, status: e.status })),
  };

  const body = section && section in payload
    ? { [section]: payload[section as keyof typeof payload] }
    : payload;

  return NextResponse.json(body, {
    headers: { "cache-control": "public, max-age=3600" },
  });
}
