/**
 * The parts of the site that change most often.
 *
 * BUILD LOG  — a changelog of you. Add a line whenever something real happens.
 * LAB        — open engineering questions you are actually working through.
 * FAILURES   — things that did not work. Ships empty; fill it in when you're ready.
 * NOTES      — short technical write-ups. Ships empty.
 *
 * LAB, FAILURES and NOTES hide themselves from the dock while they are empty,
 * so nothing half-finished is ever on the live site.
 */

export type LogKind = "SHIP" | "BUILD" | "START" | "LEARN" | "BROKE" | "EXPERIMENT";

export type LogEntry = {
  date: string; // ISO. Used for sorting and display.
  kind: LogKind;
  title: string;
  detail?: string;
  href?: string;
};

/**
 * Dates here come from your resume and from public activity on
 * github.com/Tharun-code-08 — they are last-activity dates, not start dates.
 * Rewrite any line that misremembers how it actually went.
 *
 * TODO (Tharun): two entries are missing because I do not know their dates,
 * and a portfolio with an invented date on it is worse than one with a gap:
 *   - START  — the month you joined Claxon AI
 *   - START  — the two months of the Ingage AR/VR/XR internship
 * Add them in the same shape as the lines below and they slot into the timeline.
 */
export const buildLog: LogEntry[] = [
  {
    date: "2026-09-12",
    kind: "BUILD",
    title: "Building BrandThis at Claxon AI",
    detail:
      "Brand intelligence for generative work — read a company's website, turn it into a Brand DNA, keep everything generated afterwards on-brand.",
    href: "https://brandthis.in",
  },
  {
    date: "2026-09-01",
    kind: "LEARN",
    title: "Started taking DSA seriously",
    detail: "Working through LeetCode most days. A year of shipping features exposed the gaps.",
  },
  {
    date: "2026-07-22",
    kind: "BUILD",
    title: "Library Management System in Java",
    detail: "Book inventory, members, borrowing, returns and search — no framework doing the work for me.",
    href: "https://github.com/Tharun-code-08/LibraryManagementSystem",
  },
  {
    date: "2026-07-17",
    kind: "BUILD",
    title: "Interview assignment, shipped as a real app",
    detail: "Treated a take-home like a product rather than a test.",
    href: "https://github.com/Tharun-code-08/InterviewZoolearn",
  },
  {
    date: "2026-06-16",
    kind: "EXPERIMENT",
    title: "Testing-IMS",
    detail: "A sandbox for inventory ideas before they touched the production system.",
    href: "https://github.com/Tharun-code-08/Testing-IMS",
  },
  {
    date: "2026-04-25",
    kind: "BUILD",
    title: "Wrote my own IDE",
    detail:
      "Mini Playground — ten-plus languages running in the browser, Python on WebAssembly and SQLite compiled to the client.",
    href: "https://github.com/Tharun-code-08/MY-IDLE",
  },
  {
    date: "2026-04-17",
    kind: "BUILD",
    title: "IMS backend groundwork",
    detail: "The data model thinking that everything inventory-shaped since has been built on.",
    href: "https://github.com/Tharun-code-08/ims-backend",
  },
  {
    date: "2026-04-05",
    kind: "SHIP",
    title: "Softdigit Consulting site",
    detail: "Company site, live on Vercel.",
    href: "https://softdigitconsulting.com/",
  },
  {
    date: "2026-02-21",
    kind: "BUILD",
    title: "First work with Astro",
    detail: "Event templates for a developer student community. A different rendering model to think in.",
    href: "https://github.com/Tharun-code-08/dsc-astro-adhi",
  },
  {
    date: "2026-01-01",
    kind: "START",
    title: "Joined Softdigit Consulting as a Software Developer",
    detail: "Second year of a CS degree, leading development on a product with real users.",
    href: "https://softdigitconsulting.com/",
  },
  {
    date: "2025-08-01",
    kind: "START",
    title: "Started B.E. Computer Science at Sathyabama",
    detail: "Chennai. Class of 2029.",
  },
  {
    date: "2025-06-05",
    kind: "START",
    title: "Started pushing code in public",
    detail: "First commits on GitHub.",
    href: "https://github.com/Tharun-code-08",
  },
];

export type LabStatus = "ONGOING" | "ANSWERED" | "PARKED";

export type LabEntry = {
  id: string;
  index: string;
  question: string;
  context: string;
  approach: string;
  status: LabStatus;
  result?: string;
};

/**
 * Real questions from the work, not invented demos.
 * Add one whenever something makes you go "wait, how does that actually work".
 */
export const lab: LabEntry[] = [
  {
    id: "brand-context",
    index: "001",
    question: "How much context does a model need before its output stops being generic?",
    context:
      "Every generative tool is good at on-topic and bad at on-brand. Re-explaining a brand in each prompt does not hold, and the drift compounds across a campaign.",
    approach:
      "Extract the brand once — colour system, typography, voice — from the artefact that already encodes it, the company's own website, and make that a reusable object rather than a paragraph someone retypes.",
    status: "ONGOING",
  },
  {
    id: "rls-isolation",
    index: "002",
    question: "Can row-level security alone be trusted to keep tenants apart?",
    context:
      "The cheap version of multi-tenancy is a tenant_id column and discipline. Discipline fails eventually.",
    approach:
      "Push isolation into PostgreSQL with row-level security so a missing WHERE clause returns nothing instead of everything, and treat the application layer as a convenience rather than the boundary.",
    status: "PARKED",
    result: "Designed and driven as part of the Softventory multi-tenant redesign.",
  },
  {
    id: "append-only-ledger",
    index: "003",
    question: "Should stock quantity be a column, or something you derive?",
    context:
      "A mutable quantity column is fast and lies quietly. When two operations race, you find out days later from a stock count.",
    approach:
      "Model stock as an append-only movement ledger and derive the on-hand figure, so every number on screen has a trail behind it.",
    status: "ANSWERED",
    result: "Went into the Softventory multi-tenant redesign.",
  },
  {
    id: "outbox-escalation",
    index: "004",
    question: "How do you make sure an alert nobody reads still reaches someone?",
    context: "Low-stock and expiry notifications are worthless if they land in an inbox that is never opened.",
    approach:
      "A configurable escalation engine on top of the outbox pattern — the notification is written in the same transaction as the event, then climbs the chain until someone acknowledges it.",
    status: "ANSWERED",
    result: "Shipped into the product. Alerts escalate rather than expire.",
  },
  {
    id: "wasm-runtimes",
    index: "005",
    question: "What actually has to happen for Python to run in a browser tab?",
    context:
      "Browser playgrounds stop at the web stack. The moment you want Python or SQL you are back to a server round-trip.",
    approach:
      "Pyodide for Python and sql.js for SQLite, both compiled to WebAssembly, behind one interface — and being honest that C, C++ and Java still go out to a compiler API.",
    status: "ANSWERED",
    result: "Mini Playground runs ten-plus languages with no backend.",
  },
  {
    id: "restore-drill",
    index: "006",
    question: "Is a backup you have never restored actually a backup?",
    context: "Self-hosted PostgreSQL on a VPS. No managed service quietly handling this.",
    approach:
      "A multi-tier backup design, and rehearsing the restore rather than trusting the job that writes the file.",
    status: "ANSWERED",
    result: "Multi-tier backup and recovery designed and in place.",
  },
];

export type FailureEntry = {
  id: string;
  index: string;
  title: string;
  whatHappened: string;
  whyItFailed: string;
  lesson: string;
  verdict: "FAILED" | "ABANDONED" | "REBUILT" | "PIVOTED";
};

/**
 * TODO (Tharun): this is the section almost nobody else will have, and it is
 * the one I could not write for you — I would have had to make things up.
 *
 * Add three entries and it appears in the dock automatically. A template:
 *
 * {
 *   id: "some-slug",
 *   index: "001",
 *   title: "What you tried",
 *   whatHappened: "Two sentences on what you built and what went wrong.",
 *   whyItFailed: "The honest reason. Not 'ran out of time' if that isn't it.",
 *   lesson: "What you would do differently. This is the part people remember.",
 *   verdict: "REBUILT",
 * },
 */
export const failures: FailureEntry[] = [];

export type Note = {
  slug: string;
  title: string;
  date: string; // ISO
  tag: string;
  /** Plain paragraphs. Keep them short — these are notes, not articles. */
  body: string[];
};

/**
 * TODO (Tharun): short technical notes. 200 words is plenty.
 * Good first ones, based on what you already do every day:
 *   - "What row-level security does not protect you from"
 *   - "Running Python in a browser tab: what Pyodide actually costs"
 *   - "Why I chose a modular monolith over microservices"
 * Add one and NOTES appears in the dock.
 */
export const notes: Note[] = [];
