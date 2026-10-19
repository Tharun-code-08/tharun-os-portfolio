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

  /** Shown under the headline. Keep it to two or three sentences. */
  intro:
    "I'm a second-year CS undergrad already working in industry. I led development on Softventory, an enterprise inventory SaaS running in production, then shipped BrandThis and PitchMyWeb at Claxon AI. Now I freelance, and right now I'm building a quick-commerce app for a client. My first job was two months of XR work before the degree even started, and somewhere in between I wrote my own browser IDE.",

  /** The status line in the menu bar and hero. Update it when the work changes. */
  status: {
    state: "BUILDING" as const,
    what: "A quick-commerce app for a client",
  },

  /** The summary paragraph at the top of Recruiter Mode. Keep it to one block. */
  resumeSummary:
    "Second-year Computer Science undergraduate already working in industry, starting with an AR/VR internship the summer before the degree began. Led development of Softventory, an enterprise inventory management SaaS running in production, then shipped two products at Claxon AI: BrandThis, a brand-intelligence SaaS, and PitchMyWeb, which finds local businesses without a website and pitches them a ready-made one over WhatsApp. Now freelancing, currently building a quick-commerce app for a client. Hands-on across the full stack — TypeScript, React/Next.js, NestJS and PostgreSQL — with experience designing multi-tenant architecture and owning real deployments, plus a browser-based polyglot IDE built from scratch.",

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
  /** The one-page résumé. The .docx next to it is the editable source. */
  resume: "/Tharun_Adhithya_Resume.pdf",
  /** TODO (Tharun): add your LeetCode handle and this appears in PROOF and ⌘K. */
  leetcode: null as string | null,
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
      { name: "JavaScript", note: "Where it started, and what my browser IDE is written in." },
      { name: "Java", note: "Coursework, a Library Management System from scratch, and most of my DSA practice." },
      { name: "Python", note: "Scripts, automation, one-off data work." },
      { name: "C", note: "Systems fundamentals — memory, pointers, how it actually works." },
      { name: "SQL", note: "Schema design and the queries underneath every product I have shipped." },
      { name: "HTML / CSS", note: "Hand-written more often than people assume." },
    ],
  },
  {
    label: "Frontend",
    items: [
      { name: "React", note: "Every production UI I've shipped." },
      { name: "Next.js", note: "App Router, server components, deployed on Vercel." },
      { name: "Tailwind CSS", note: "Design system for Softventory's interface, and for this site." },
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
      { name: "Redis", note: "Caching, locks and BullMQ queues — PitchMyWeb's WhatsApp sending runs on them." },
      { name: "MongoDB", note: "Used on earlier projects before Postgres became the default." },
    ],
  },
  {
    label: "AI",
    items: [
      { name: "LLM APIs", note: "BrandThis ran on them — the work is in the context you give a model, not the call." },
      {
        name: "Agent workflows",
        note: "Claxon builds agents that finish a task rather than recommend one. Different discipline to prompting.",
      },
    ],
  },
  {
    label: "Immersive",
    items: [
      { name: "Unity", note: "Headset and mobile builds during the XR internship at Ingage." },
      { name: "Unreal Engine", note: "The other half of the engine question, same internship." },
      {
        name: "WebXR / three.js",
        note: "Immersive scenes in the browser — the same constraint I enjoyed in Mini Playground.",
      },
      { name: "ARCore / ARKit", note: "Mobile AR: plane detection, anchors, real-world placement." },
    ],
  },
  {
    label: "Infrastructure",
    items: [
      { name: "Docker", note: "Backend ran containerised on a self-hosted VPS." },
      { name: "AWS + Terraform", note: "PitchMyWeb's server, defined as code and deployed from a script." },
      { name: "Cloudflare", note: "Proxy, DNS as code, Turnstile on sign-up, and Access in front of the admin." },
      { name: "GitHub Actions", note: "CI pipelines I owned — build, check, deploy." },
      { name: "Vercel", note: "Frontend deployments and preview environments." },
      { name: "Linux (VPS)", note: "Self-hosted Postgres, backups, recovery drills." },
      { name: "WebAssembly", note: "How Mini Playground runs Python and SQLite with no backend." },
      { name: "Git", note: "Branches, reviews, and a readable history." },
    ],
  },
];

export const now = {
  /** Update this date whenever you rewrite the section below. */
  updated: "October 2026",
  building: [
    "A quick-commerce app for a client — my first freelance build, from the scope and the quote to the handover.",
    "Freelance work for clients: sites and apps, scoped honestly and handed over in a state someone else can run.",
  ],
  learning: [
    "Data structures and algorithms, properly rather than for a test — working through LeetCode most days.",
    "Where the fundamentals I skipped show up in production code I have already written.",
  ],
  thinkingAbout: [
    "Why a year of shipping features taught me less about complexity than a month of DSA has.",
    "How much context an AI actually needs before its output stops being generic.",
    "Why most inventory software is hated by the people who have to use it every day.",
  ],
};
