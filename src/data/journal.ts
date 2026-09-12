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
 * Dates below come from your resume and from public activity on
 * github.com/Tharun-code-08 — they are last-activity dates, not start dates.
 * Rewrite any line that misremembers how it actually went.
 */
export const buildLog: LogEntry[] = [
  {
    date: "2026-09-11",
    kind: "SHIP",
    title: "Hilook Interiors went live",
    detail: "Interior design studio site, built and deployed on Vercel.",
    href: "https://hilook-interiors.vercel.app",
  },
  {
    date: "2026-08-09",
    kind: "BUILD",
    title: "Inventory Control for retail",
    detail: "The smaller retail-facing take on inventory, separate from the enterprise product.",
    href: "https://github.com/Tharun-code-08/Inventory-control",
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
    href: "https://soft-digits-consulting.vercel.app",
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
    date: "2025-06-05",
    kind: "START",
    title: "Started pushing code in public",
    detail: "First commits on GitHub.",
    href: "https://github.com/Tharun-code-08",
  },
  {
    date: "2025-08-01",
    kind: "START",
    title: "Started B.E. Computer Science at Sathyabama",
    detail: "Chennai. Class of 2029.",
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
 * Add one whenever something at work makes you go "wait, how does that actually work".
 */
export const lab: LabEntry[] = [
  {
    id: "rls-isolation",
    index: "001",
    question: "Can row-level security alone be trusted to keep tenants apart?",
    context:
      "Softventory is moving to multi-tenant. The cheap version is a tenant_id column and discipline. Discipline fails eventually.",
    approach:
      "Push isolation into PostgreSQL with row-level security so a missing WHERE clause returns nothing instead of everything, and treat the application layer as a convenience rather than the boundary.",
    status: "ONGOING",
  },
  {
    id: "append-only-ledger",
    index: "002",
    question: "Should stock quantity be a column, or something you derive?",
    context:
      "A mutable quantity column is fast and lies quietly. When two operations race, you find out days later from a stock count.",
    approach:
      "Model stock as an append-only movement ledger and derive the on-hand figure, so every number on screen has a trail behind it.",
    status: "ONGOING",
  },
  {
    id: "outbox-escalation",
    index: "003",
    question: "How do you make sure an alert nobody reads still reaches someone?",
    context:
      "Low-stock and expiry notifications are worthless if they land in an inbox that is never opened.",
    approach:
      "A configurable escalation engine on top of the outbox pattern — the notification is written in the same transaction as the event, then climbs the chain until someone acknowledges it.",
    status: "ANSWERED",
    result: "Shipped into the product. Alerts now escalate rather than expire.",
  },
  {
    id: "fefo",
    index: "004",
    question: "What does FEFO cost you when the shelf disagrees with the database?",
    context:
      "First-expiring-first-out is obvious on paper. On a warehouse floor, the nearest pallet wins.",
    approach:
      "Allocate by expiry automatically and make the picking flow show why a specific batch was chosen, so the rule is visible instead of arbitrary.",
    status: "ANSWERED",
    result: "In production as part of batch-lot tracking.",
  },
  {
    id: "restore-drill",
    index: "005",
    question: "Is a backup you have never restored actually a backup?",
    context: "Self-hosted PostgreSQL on a VPS. No managed service quietly handling this.",
    approach:
      "A multi-tier backup design, and rehearsing the restore rather than trusting the job that writes the file.",
    status: "ONGOING",
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
 *   - "Why I chose a modular monolith over microservices"
 *   - "Restoring a Postgres backup before you need to"
 * Add one and NOTES appears in the dock.
 */
export const notes: Note[] = [];
