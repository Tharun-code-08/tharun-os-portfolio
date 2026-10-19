"use client";

import { profile, contact } from "@/data/profile";
import { education, publishedExperience } from "@/data/projects";
import { useOs } from "@/lib/os";
import { AppHeading, AppShell, OutLink, Row, SectionLabel } from "./ui";

export function MeApp() {
  const os = useOs();
  const current = publishedExperience[0];

  return (
    <AppShell>
      <AppHeading eyebrow="ME.EXE" title={profile.name} lede={profile.intro} />

      <dl className="mb-8">
        <Row
          k="Role"
          v={current.company === "Freelance" ? `Freelance ${current.role}` : `${current.role} at ${current.company}`}
        />
        <Row k="Studying" v={`${profile.education}, ${education[0].school}`} />
        <Row k="Based in" v={profile.location} />
        <Row k="Reachable" v={<OutLink href={`mailto:${contact.email}`}>{contact.email}</OutLink>} />
      </dl>

      <section className="mb-8">
        <SectionLabel>The short version</SectionLabel>
        <div className="space-y-4 text-[13.5px] leading-relaxed text-muted">
          <p>
            I am in the second year of a computer science degree and working in industry at the same
            time. That combination is the whole story: most of what I know came from products other
            people depend on, not from a syllabus.
          </p>
          <p>
            I led development on Softventory, an enterprise inventory management system — the
            frontend, the backend, the multi-tenant architecture, and the deploy. At{" "}
            <OutLink href="https://claxonai.in">Claxon AI</OutLink> I shipped two products: BrandThis,
            which reads a company&rsquo;s website and turns it into a Brand DNA a model can actually
            work from, and <OutLink href="https://pitchmyweb.in">PitchMyWeb</OutLink>, which finds
            local businesses with no website and pitches them one over WhatsApp.
          </p>
          <p>
            Now I freelance. Right now that means a quick-commerce app for a client, taken from the
            scope and the quote all the way to the handover.
          </p>
          <p>
            It did not start with web. My first job was two months of AR, VR and XR development at
            Ingage — Unity, Unreal, WebXR, mobile AR — in the summer before the degree began. I have
            kept going sideways since: I wrote my own browser IDE that runs ten-plus languages with
            no backend, Python and SQLite included.
          </p>
          <p>
            The work I like most is the unglamorous kind — tenant isolation that holds when someone
            forgets a WHERE clause, a stock ledger that can explain every number it shows, a backup
            that has actually been restored. Features get demos. These get you trusted.
          </p>
          <p>
            Right now I am filling in what shipping fast let me skip: data structures and algorithms,
            properly, most days.
          </p>
        </div>
      </section>

      <section className="mb-8">
        <SectionLabel>How I work</SectionLabel>
        <ol className="grid gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-2">
          {[
            [
              "Read the domain first",
              "Inventory is not CRUD and a brand is not a colour picker. Learn why it is done that way before changing it.",
            ],
            [
              "Choose boring",
              "A modular monolith over microservices. Postgres over a new database. Boring scales further than clever.",
            ],
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
