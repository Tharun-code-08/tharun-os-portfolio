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
    id: "brandthis",
    index: "01",
    name: "BrandThis",
    kind: "AI SaaS · live",
    summary:
      "Feed it a website once and it builds a reusable Brand DNA — colour system, typography, voice — so everything generated afterwards comes out on-brand instead of merely on-topic.",
    status: "building",
    period: "Aug 2026 — present",
    role: "Full-stack feature work",
    tech: ["TypeScript", "Next.js", "React", "Tailwind CSS", "LLM APIs"],
    links: [
      { label: "brandthis.in", href: "https://brandthis.in" },
      { label: "claxonai.in", href: "https://claxonai.in" },
    ],
    published: true,
    study: [
      {
        heading: "The problem",
        body: [
          "Generative tools are good at on-topic and bad at on-brand. Every new campaign starts by re-explaining the same brand to the same model, and the output drifts a little further each time.",
          "The brand already exists — it is sitting on the company website. Nobody was reading it back out in a form a model could use.",
        ],
      },
      {
        heading: "What it does",
        body: [
          "You paste a website or an Instagram URL. BrandThis reads the visual, verbal and strategic signals behind it and turns them into a Brand DNA: a core colour system, typography and a voice direction held together as one working system.",
          "That becomes reusable creative context. Teams generate ads, posts and product visuals from the same identity instead of restating the brief at every handoff.",
        ],
      },
      {
        heading: "Where it sits",
        body: [
          "BrandThis is the first standalone product out of the Claxon AI ecosystem — the same company building an agent runtime that connects models, data and existing tools.",
          "Different shape of problem, same underlying idea: give the AI real context about the business before asking it to do anything.",
        ],
      },
    ],
  },
  {
    id: "softventory",
    index: "02",
    name: "Softventory",
    kind: "Enterprise SaaS · production",
    summary:
      "An inventory control and management system used by real businesses to track stock across plants, batches and expiry dates.",
    status: "shipped",
    period: "Jan — Jul 2026",
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
          "The multi-tenant redesign covered PostgreSQL row-level security for tenant isolation, an append-only stock movement ledger so quantity is derived rather than mutated, and an outbox-based domain event catalog so integrations read events instead of polling tables.",
        ],
      },
      {
        heading: "The part that is not glamorous",
        body: [
          "I designed a multi-tier backup and recovery system for a self-hosted PostgreSQL deployment on a VPS.",
          "It is the least visible work in the product and the reason I slept. A backup you have never restored is a guess.",
        ],
      },
      {
        heading: "What I owned beyond the code",
        body: [
          "Deployment and CI were mine: Vercel for the frontend, Docker on a VPS for the backend, GitHub Actions tying it together.",
          "Owning the deploy changed how I write code. You design differently when you are the one awake if it breaks.",
        ],
      },
    ],
  },
  {
    id: "mini-playground",
    index: "03",
    name: "Mini Playground",
    kind: "Browser IDE · built from scratch",
    summary:
      "A polyglot IDE that runs entirely in the browser — ten-plus languages, including Python, C/C++, Java and SQL, with no backend and no install.",
    status: "shipped",
    period: "2026",
    role: "Solo",
    tech: ["JavaScript", "Vite", "WebAssembly", "Pyodide", "sql.js", "Babel"],
    links: [{ label: "Source", href: "https://github.com/Tharun-code-08/MY-IDLE" }],
    published: true,
    study: [
      {
        heading: "Why build an IDE",
        body: [
          "Browser playgrounds are everywhere, but they mostly stop at the web stack. The moment you want to run Python or compile C, you are back to a local toolchain or a server round-trip.",
          "I wanted to know what it actually takes to run a compiled language in a tab.",
        ],
      },
      {
        heading: "How it runs ten languages with no backend",
        body: [
          "HTML, CSS, JavaScript and TypeScript render in a live iframe; React, Vue and Svelte compile in-browser through Babel and each framework's own compiler.",
          "Python runs on Pyodide compiled to WebAssembly. SQL runs on sql.js, SQLite built for the browser, with real query results in an interactive table.",
          "C, C++ and Java are the honest compromise — those go out to compiler APIs rather than pretending to run locally.",
        ],
      },
      {
        heading: "What it taught me",
        body: [
          "That the interesting constraint was never the editor. It was making ten wildly different execution models present the same interface to someone who just wants to press Run.",
        ],
      },
    ],
  },
  {
    id: "inventory-control",
    index: "04",
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
    index: "05",
    name: "Softdigit Consulting",
    kind: "Company site · live",
    summary: "The company's public site — the front door for the product I led development on.",
    status: "shipped",
    period: "2026",
    role: "Built it",
    tech: ["TypeScript", "Next.js", "Vercel"],
    links: [
      { label: "softdigitconsulting.com", href: "https://softdigitconsulting.com/" },
      { label: "Source", href: "https://github.com/Tharun-code-08/SoftDigitsConsulting" },
    ],
    published: true,
    study: [],
  },
  {
    id: "library-management",
    index: "06",
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
    index: "07",
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
  // TODO (Tharun): your AR/VR/XR work at Ingage. You told me it happened but not
  // what you built, so I have not written it — fill in summary / tech / study and
  // flip `published` to true. It is the most differentiated thing on this list:
  // almost no backend-leaning developer also has headset experience.
  // ---------------------------------------------------------------------------
  {
    id: "xr-ingage",
    index: "08",
    name: "XR work at Ingage",
    kind: "AR / VR / XR",
    summary: "TODO: what you actually built during the internship.",
    status: "archived",
    period: "Jun — Jul 2025",
    role: "Intern",
    tech: ["Unity", "Unreal Engine", "WebXR", "three.js", "ARCore", "ARKit"],
    links: [],
    published: false,
    study: [],
  },
];

export const publishedProjects = projects.filter((p) => p.published);

export type Job = {
  company: string;
  role: string;
  period: string;
  location: string;
  href?: string;
  product?: string;
  points: string[];
  /** False keeps it out of the site until the details are right. */
  published: boolean;
};

export const experience: Job[] = [
  {
    company: "Claxon AI",
    role: "Software Development Intern",
    period: "Aug 2026 — Present",
    location: "Chennai, India",
    href: "https://claxonai.in",
    product: "BrandThis — brand intelligence for generative work",
    points: [
      "Building BrandThis, the first standalone product out of the Claxon AI ecosystem: it reads a company's website and turns the visual, verbal and strategic signals behind it into a reusable Brand DNA.",
      "Work spans the product surface — brand scanning, the workspace where a team's identity lives, and the generation flow that keeps ads, posts and product visuals on-brand across channels.",
      "Claxon itself builds an agent runtime that connects models, data and existing tools so an agent finishes a task rather than recommending one; BrandThis applies the same idea to creative work.",
    ],
    published: true,
  },
  {
    company: "Softdigit Consulting",
    role: "Software Developer",
    period: "Jan — Jul 2026",
    location: "Chennai, India",
    href: "https://softdigitconsulting.com/",
    product: "Softventory — Inventory Control & Management System",
    points: [
      "Lead developer on an enterprise inventory management SaaS built with React, Next.js, TypeScript and Tailwind CSS on the frontend, and a NestJS modular monolith with PostgreSQL, Prisma and Redis on the backend.",
      "Shipped core product features: bulk product uploads with plant-level assignment, expiry and batch-lot tracking with FEFO allocation, a drag-and-drop stock transfer workflow generating Stock Transfer Orders, and a configurable notification escalation engine built on an outbox pattern.",
      "Drove a multi-tenant SaaS architecture redesign covering PostgreSQL row-level security for tenant isolation, an append-only stock movement ledger, and an outbox-based domain event catalog.",
      "Designed a multi-tier database backup and recovery system for a self-hosted PostgreSQL deployment on a VPS.",
      "Owned deployment and CI: Vercel (frontend), Docker on VPS (backend), and GitHub Actions pipelines.",
    ],
    published: true,
  },
  {
    company: "Ingage",
    role: "AR/VR & XR Development Intern",
    period: "Jun — Jul 2025",
    location: "Chennai, India",
    product: "Immersive development — Unity, Unreal Engine, WebXR and mobile AR",
    // TODO (Tharun): add one concrete line — the thing you actually built and
    // what it did. These two bullets place the internship; a real artefact
    // would make it the most memorable entry on the résumé.
    points: [
      "Two months of immersive development spanning Unity and Unreal Engine, WebXR and three.js in the browser, and mobile AR with ARCore and ARKit.",
      "My first professional development work, taken the summer before starting the Computer Science degree.",
    ],
    published: true,
  },
];

export const publishedExperience = experience.filter((j) => j.published);

export const education = [
  {
    school: "Sathyabama Institute of Science and Technology",
    degree: "B.E. Computer Science & Engineering",
    period: "2025 — 2029",
    location: "Chennai, India",
    detail: "CGPA 8.2 / 10",
  },
];
