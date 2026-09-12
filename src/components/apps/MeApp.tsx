"use client";

import { profile, contact } from "@/data/profile";
import { education, experience } from "@/data/projects";
import { useOs } from "@/lib/os";
import { AppHeading, AppShell, OutLink, Row, SectionLabel } from "./ui";

export function MeApp() {
  const os = useOs();
  const job = experience[0];

  return (
    <AppShell>
      <AppHeading
        eyebrow="ME.EXE"
        title={profile.name}
        lede={profile.intro}
      />

      <dl className="mb-8">
        <Row k="Role" v={`${profile.role} at ${job.company}`} />
        <Row k="Studying" v={`${profile.education}, ${education[0].school}`} />
        <Row k="Based in" v={profile.location} />
        <Row
          k="Reachable"
          v={<OutLink href={`mailto:${contact.email}`}>{contact.email}</OutLink>}
        />
      </dl>

      <section className="mb-8">
        <SectionLabel>The short version</SectionLabel>
        <div className="space-y-4 text-[13.5px] leading-relaxed text-muted">
          <p>
            I am in the second year of a computer science degree and working in industry at the same
            time. That combination is the whole story: most of what I know came from a product that
            other people depend on, not from a syllabus.
          </p>
          <p>
            At{" "}
            <OutLink href={job.href}>{job.company}</OutLink> I lead development on Softventory, an
            enterprise inventory management system. I write the frontend, I write the backend, I own
            the deploy, and I am the one who finds out when something breaks.
          </p>
          <p>
            The work I like most is the unglamorous kind — tenant isolation that holds when someone
            forgets a WHERE clause, a stock ledger that can explain every number it shows, a backup
            that has actually been restored. Features get demos. These get you trusted.
          </p>
        </div>
      </section>

      <section className="mb-8">
        <SectionLabel>How I work</SectionLabel>
        <ol className="grid gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-2">
          {[
            ["Read the domain first", "Inventory is not CRUD. Learn why the warehouse does it that way before changing it."],
            ["Choose boring", "A modular monolith over microservices. Postgres over a new database. Boring scales further than clever."],
            ["Make it provable", "If a number is on screen, there should be a trail behind it."],
            ["Own the deploy", "You write different code when you are the one awake at 2am."],
          ].map(([title, body]) => (
            <li key={title} className="bg-surface px-4 py-4">
              <p className="mb-1.5 text-[13px] font-medium text-ink">{title}</p>
              <p className="text-[12.5px] leading-relaxed text-muted">{body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section>
        <SectionLabel>Next</SectionLabel>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => os.open("work")}
            className="rounded-md border border-line bg-surface-2 px-3.5 py-2 font-mono text-[11px] tracking-[0.14em] text-ink transition-colors hover:border-accent hover:text-accent"
          >
            SEE THE WORK
          </button>
          <button
            type="button"
            onClick={() => os.open("contact")}
            className="rounded-md border border-line px-3.5 py-2 font-mono text-[11px] tracking-[0.14em] text-muted transition-colors hover:border-accent hover:text-accent"
          >
            GET IN TOUCH
          </button>
        </div>
      </section>
    </AppShell>
  );
}
