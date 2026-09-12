export type ProjectStatus = "shipped" | "building" | "archived";

export type CaseSection = { heading: string; body: string[] };

export type Project = {
  id: string;
  index: string;
  name: string;
  kind: string;
  /** One line. What it is, in plain language. */
  summary: string;
  status: ProjectStatus;
  period: string;
  role: string;
  tech: string[];
  links: { label: string; href: string }[];
  /** Set false to keep a project written but hidden from the site. */
  published: boolean;
  /** The case study. Leave empty and the card just won't open a detail view. */
  study: CaseSection[];
};

export const projects: Project[] = [
  {
    id: "softventory",
    index: "01",
    name: "Softventory",
    kind: "Enterprise SaaS · production",
    summary:
      "An inventory control and management system used by real businesses to track stock across plants, batches and expiry dates.",
    status: "building",
    period: "Jan 2026 — present",
    role: "Lead developer",
    tech: [
      "React",
      "Next.js",
      "TypeScript",
      "Tailwind CSS",
      "NestJS",
      "PostgreSQL",
      "Prisma",
      "Redis",
      "Docker",
      "GitHub Actions",
    ],
    links: [{ label: "softdigitconsulting.com", href: "https://softdigitconsulting.com/" }],
    published: true,
    study: [
      {
        heading: "The problem",
        body: [
          "Businesses that hold physical stock lose money in two quiet ways: inventory that expires before it is sold, and stock sitting in one warehouse while another runs out.",
          "Most software meant to solve this is built for accountants, not for the person on a warehouse floor at 7am deciding which pallet to move.",
        ],
      },
      {
        heading: "What I built",
        body: [
          "Bulk product uploads with plant-level assignment, so onboarding a new site is a spreadsheet rather than a week of data entry.",
          "Expiry and batch-lot tracking with FEFO allocation — first-expiring stock gets picked first, automatically, instead of relying on someone remembering.",
          "A drag-and-drop stock transfer workflow that generates real Stock Transfer Orders, turning an intention into a tracked document.",
          "A configurable notification escalation engine built on the outbox pattern, so an alert nobody acts on climbs to someone who will.",
        ],
      },
      {
        heading: "The architecture decision",
        body: [
          "The backend is a NestJS modular monolith, not microservices. A product this age does not have the operational budget for a distributed system, and module boundaries give most of the separation without putting a network in the middle of it.",
          "I am now driving a multi-tenant redesign: PostgreSQL row-level security for tenant isolation, an append-only stock movement ledger so quantity is derived rather than mutated, and an outbox-based domain event catalog so integrations read events instead of polling tables.",
        ],
      },
      {
        heading: "The part that is not glamorous",
        body: [
          "I designed a multi-tier backup and recovery system for a self-hosted PostgreSQL deployment on a VPS.",
          "It is the least visible work in the product and the reason I sleep. A backup you have never restored is a guess.",
        ],
      },
      {
        heading: "What I own beyond the code",
        body: [
          "Deployment and CI are mine: Vercel for the frontend, Docker on a VPS for the backend, GitHub Actions tying it together.",
          "Owning the deploy changed how I write code. You design differently when you are the one awake if it breaks.",
        ],
      },
    ],
  },
  {
    id: "hilook-interiors",
    index: "02",
    name: "Hilook Interiors",
    kind: "Client site · live",
    summary: "A marketing site for an interior design studio, built to load fast and read well on a phone.",
    status: "shipped",
    period: "2026",
    role: "Built and deployed it",
    tech: ["TypeScript", "Next.js", "Tailwind CSS", "Vercel"],
    links: [
      { label: "hilook-interiors.vercel.app", href: "https://hilook-interiors.vercel.app" },
      { label: "Source", href: "https://github.com/Tharun-code-08/hilook-interiors" },
    ],
    published: true,
    study: [],
  },
  {
    id: "inventory-control",
    index: "03",
    name: "Inventory Control",
    kind: "Product · retail",
    summary: "An inventory control app aimed at retail shops — the smaller, sharper cousin of the enterprise system.",
    status: "shipped",
    period: "2026",
    role: "Developer",
    tech: ["TypeScript", "Next.js", "PostgreSQL"],
    links: [
      { label: "Source", href: "https://github.com/Tharun-code-08/Inventory-control" },
      { label: "softdigitconsulting.com", href: "https://softdigitconsulting.com/" },
    ],
    published: true,
    study: [],
  },
  {
    id: "softdigit-site",
    index: "04",
    name: "Softdigit Consulting",
    kind: "Company site · live",
    summary: "The company's public site — the front door for the product I work on every day.",
    status: "shipped",
    period: "2026",
    role: "Built it",
    tech: ["TypeScript", "Next.js", "Vercel"],
    links: [
      { label: "soft-digits-consulting.vercel.app", href: "https://soft-digits-consulting.vercel.app" },
      { label: "Source", href: "https://github.com/Tharun-code-08/SoftDigitsConsulting" },
    ],
    published: true,
    study: [],
  },
  {
    id: "library-management",
    index: "05",
    name: "Library Management System",
    kind: "Java · from scratch",
    summary:
      "Book inventory, member records, borrowing, returns and search — written in Java without a framework carrying it.",
    status: "archived",
    period: "2026",
    role: "Solo",
    tech: ["Java"],
    links: [{ label: "Source", href: "https://github.com/Tharun-code-08/LibraryManagementSystem" }],
    published: true,
    study: [],
  },
  {
    id: "ims-backend",
    index: "06",
    name: "IMS Backend",
    kind: "Backend · groundwork",
    summary: "The early backend work that became the foundation for how I think about inventory data.",
    status: "archived",
    period: "2026",
    role: "Solo",
    tech: ["TypeScript", "Node.js"],
    links: [{ label: "Source", href: "https://github.com/Tharun-code-08/ims-backend" }],
    published: true,
    study: [],
  },

  // ---------------------------------------------------------------------------
  // TODO (Tharun): Claxon AI. You own claxonai.in, but I have no verified details
  // about it and did not want to invent any. Fill in summary / role / tech / study,
  // then flip `published` to true and it shows up in WORK, in ⌘K and in the terminal.
  // ---------------------------------------------------------------------------
  {
    id: "claxon-ai",
    index: "07",
    name: "Claxon AI",
    kind: "Product",
    summary: "TODO: one line on what Claxon AI actually is.",
    status: "building",
    period: "2026 — present",
    role: "TODO",
    tech: [],
    links: [{ label: "claxonai.in", href: "https://claxonai.in" }],
    published: false,
    study: [],
  },
];

export const publishedProjects = projects.filter((p) => p.published);

export const experience = [
  {
    company: "Softdigit Consulting",
    role: "Software Developer",
    period: "Jan 2026 — Present",
    location: "Chennai, India",
    href: "https://softdigitconsulting.com/",
    product: "Softventory — Inventory Control & Management System",
    points: [
      "Lead developer on an enterprise inventory management SaaS built with React, Next.js, TypeScript and Tailwind CSS on the frontend, and a NestJS modular monolith with PostgreSQL, Prisma and Redis on the backend.",
      "Shipped core product features: bulk product uploads with plant-level assignment, expiry and batch-lot tracking with FEFO allocation, a drag-and-drop stock transfer workflow generating Stock Transfer Orders, and a configurable notification escalation engine built on an outbox pattern.",
      "Driving a multi-tenant SaaS architecture redesign covering PostgreSQL row-level security for tenant isolation, an append-only stock movement ledger, and an outbox-based domain event catalog.",
      "Designed a multi-tier database backup and recovery system for a self-hosted PostgreSQL deployment on a VPS.",
      "Own deployment and CI: Vercel (frontend), Docker on VPS (backend), and GitHub Actions pipelines.",
    ],
  },
];

export const education = [
  {
    school: "Sathyabama Institute of Science and Technology",
    degree: "B.E. Computer Science & Engineering",
    period: "2025 — 2029",
    location: "Chennai, India",
    detail: "CGPA 8.2 / 10",
  },
];
