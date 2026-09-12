/**
 * Everything about you lives in src/data/*.
 * Edit these files, never the components, to change what the site says.
 */

export const profile = {
  name: "Tharun Adhithya G S",
  shortName: "Tharun",
  handle: "tharun",
  role: "Software Developer",
  education: "B.E. Computer Science & Engineering",
  location: "Chennai, India",
  timezone: "Asia/Kolkata",

  /** The one line someone remembers. */
  tagline: "Still building.",
  headline: ["I build products,", "not just projects."],

  /** Shown under the headline. Keep it to two sentences. */
  intro:
    "I'm a second-year CS undergrad who went straight into industry. I lead development on Softventory, an enterprise inventory management SaaS that's in production — full stack, real tenants, real deployments.",

  /** The status line in the menu bar and hero. Update it when the work changes. */
  status: {
    state: "BUILDING" as const,
    what: "multi-tenant architecture for Softventory",
  },

  os: {
    name: "THARUN OS",
    version: "1.0",
    edition: "Builder Edition",
  },
};

export const contact = {
  email: "gstharunadhithya08@gmail.com",
  /** Set to null if you ever want the number off the public site. */
  phone: "+91 94883 29318",
  phoneHref: "tel:+919488329318",
  github: "https://github.com/Tharun-code-08",
  githubHandle: "Tharun-code-08",
  linkedin: "https://www.linkedin.com/in/tharuncode",
  linkedinHandle: "in/tharuncode",
  /** Drop a PDF at public/resume.pdf and change this to "/resume.pdf". */
  resume: "/Tharun_Adhithya_Resume.docx",
};

export type StackGroup = {
  label: string;
  items: { name: string; note: string }[];
};

/** Only what you actually work in. No logo wall. */
export const stack: StackGroup[] = [
  {
    label: "Languages",
    items: [
      { name: "TypeScript", note: "Daily driver. Frontend and backend, end to end." },
      { name: "JavaScript", note: "Where it started. Still what everything compiles down to." },
      { name: "Java", note: "Coursework and a Library Management System built from scratch." },
      { name: "Python", note: "Scripts, automation, one-off data work." },
      { name: "C", note: "Systems fundamentals — memory, pointers, how it actually works." },
      { name: "HTML / CSS", note: "Hand-written more often than people assume." },
    ],
  },
  {
    label: "Frontend",
    items: [
      { name: "React", note: "Every production UI I've shipped." },
      { name: "Next.js", note: "App Router, server components, deployed on Vercel." },
      { name: "Tailwind CSS", note: "Design system for Softventory's entire interface." },
    ],
  },
  {
    label: "Backend",
    items: [
      { name: "NestJS", note: "Softventory's backend — a modular monolith, not a pile of routes." },
      { name: "Node.js", note: "Runtime for everything server-side I write." },
      { name: "Express", note: "Smaller services and prototypes." },
      { name: "REST APIs", note: "Designing them, versioning them, keeping them boring." },
    ],
  },
  {
    label: "Data",
    items: [
      { name: "PostgreSQL", note: "Row-level security, append-only ledgers, backup tiers." },
      { name: "Prisma", note: "Schema, migrations, and the type safety that comes with it." },
      { name: "Redis", note: "Caching and queue-backed background work." },
      { name: "MongoDB", note: "Used on earlier projects before Postgres became the default." },
    ],
  },
  {
    label: "Infrastructure",
    items: [
      { name: "Docker", note: "Backend runs containerised on a self-hosted VPS." },
      { name: "GitHub Actions", note: "CI pipelines I own — build, check, deploy." },
      { name: "Vercel", note: "Frontend deployments and preview environments." },
      { name: "Linux (VPS)", note: "Self-hosted Postgres, backups, recovery drills." },
      { name: "Git", note: "Branches, reviews, and a readable history." },
    ],
  },
];

export const now = {
  /** Update this date whenever you rewrite the section below. */
  updated: "September 2026",
  building: [
    "A multi-tenant SaaS redesign of Softventory — row-level security for tenant isolation, an append-only stock movement ledger, and an outbox-based domain event catalog.",
    "A multi-tier backup and recovery system for self-hosted PostgreSQL, because a backup you have never restored is not a backup.",
  ],
  learning: [
    "How multi-tenancy actually fails — noisy neighbours, leaked rows, migrations across tenants.",
    "Event-driven patterns: outbox, idempotency, and what 'exactly once' really costs.",
    "Database operations: WAL, point-in-time recovery, and restore rehearsals.",
  ],
  thinkingAbout: [
    "Why most inventory software is hated by the people who have to use it every day.",
    "How much architecture a two-year-old product actually deserves.",
  ],
};
