"use client";

import { useEffect } from "react";
import { contact, profile, stack } from "@/data/profile";
import { education, publishedExperience, publishedProjects } from "@/data/projects";
import { Icon } from "../os/Icon";

/**
 * The other half of the idea: the OS is for people who want to explore,
 * this is for someone with six minutes and forty other candidates.
 * Plain, scrollable, keyboard-closable, and it prints to a clean sheet.
 */
export function RecruiterMode({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div className="print-sheet scrollbar-thin fixed inset-0 z-[160] overflow-y-auto bg-bg">
      <div className="no-print sticky top-0 z-10 flex items-center justify-between border-b border-line bg-bg/90 px-5 py-3 backdrop-blur sm:px-8">
        <p className="font-mono text-[10px] tracking-[0.24em] text-accent">RECRUITER MODE</p>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded border border-line px-2.5 py-1 font-mono text-[10px] tracking-[0.14em] text-faint transition-colors hover:border-muted hover:text-ink"
          >
            PRINT / PDF
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 rounded border border-line px-2.5 py-1 font-mono text-[10px] tracking-[0.14em] text-faint transition-colors hover:border-accent hover:text-accent"
          >
            BACK TO THE OS
            <Icon name="close" className="h-3 w-3" />
          </button>
        </div>
      </div>

      <main className="mx-auto max-w-2xl px-5 py-12 sm:px-8 sm:py-16">
        <header className="mb-12 border-b border-line pb-9">
          <h1 className="text-[30px] leading-tight font-medium tracking-tight text-ink">
            {profile.name}
          </h1>
          <p className="mt-2 text-[14px] text-muted">
            {profile.role} · {profile.education}
          </p>
          <p className="mt-5 flex flex-wrap gap-x-4 gap-y-1.5 font-mono text-[11.5px] text-muted">
            <span>{profile.location}</span>
            {contact.phone ? (
              <a href={contact.phoneHref} className="hover:text-accent">
                {contact.phone}
              </a>
            ) : null}
            <a href={`mailto:${contact.email}`} className="hover:text-accent">
              {contact.email}
            </a>
            <a href={contact.github} target="_blank" rel="noreferrer noopener" className="hover:text-accent">
              github.com/{contact.githubHandle}
            </a>
            <a href={contact.linkedin} target="_blank" rel="noreferrer noopener" className="hover:text-accent">
              linkedin.com/{contact.linkedinHandle}
            </a>
          </p>
        </header>

        <Section title="Summary">
          <p className="text-[13.5px] leading-relaxed text-muted">{profile.resumeSummary}</p>
        </Section>

        <Section title="Experience">
          {publishedExperience.map((job) => (
            <article key={job.company} className="mb-8 last:mb-0">
              <div className="mb-1 flex flex-wrap items-baseline justify-between gap-x-4">
                <h3 className="text-[15px] font-medium text-ink">
                  {job.role} — {job.company}
                </h3>
                <span className="font-mono text-[11px] text-faint">{job.period}</span>
              </div>
              <p className="mb-3 text-[12.5px] text-accent">{job.product}</p>
              <ul className="space-y-2">
                {job.points.map((p, i) => (
                  <li key={i} className="flex gap-3 text-[13px] leading-relaxed text-muted">
                    <span className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-line" />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </Section>

        <Section title="Selected projects">
          <ul className="space-y-4">
            {publishedProjects.map((p) => (
              <li key={p.id}>
                <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                  <h3 className="text-[14px] font-medium text-ink">{p.name}</h3>
                  <span className="font-mono text-[11px] text-faint">{p.period}</span>
                </div>
                <p className="mt-1 text-[13px] leading-relaxed text-muted">{p.summary}</p>
                <p className="mt-1.5 flex flex-wrap gap-x-3 font-mono text-[11px] text-faint">
                  {p.links.map((l) => (
                    <a
                      key={l.href}
                      href={l.href}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="hover:text-accent"
                    >
                      {l.label}
                    </a>
                  ))}
                </p>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Technical skills">
          <dl className="space-y-2.5">
            {stack.map((g) => (
              <div key={g.label} className="flex flex-wrap gap-x-3 text-[13px]">
                <dt className="w-32 shrink-0 font-mono text-[11.5px] text-faint">{g.label}</dt>
                <dd className="min-w-0 flex-1 text-muted">
                  {g.items.map((i) => i.name).join(", ")}
                </dd>
              </div>
            ))}
          </dl>
        </Section>

        <Section title="Education">
          {education.map((e) => (
            <div key={e.school}>
              <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                <h3 className="text-[14px] font-medium text-ink">{e.degree}</h3>
                <span className="font-mono text-[11px] text-faint">{e.period}</span>
              </div>
              <p className="mt-1 text-[13px] text-muted">
                {e.school}, {e.location} · {e.detail}
              </p>
            </div>
          ))}
        </Section>

        <footer className="no-print mt-14 border-t border-line pt-8">
          <a
            href={contact.resume}
            download
            className="inline-flex items-center gap-2 rounded-md border border-line bg-surface-2 px-4 py-2.5 font-mono text-[11px] tracking-[0.14em] text-muted transition-colors hover:border-accent hover:text-accent"
          >
            DOWNLOAD THE RESUME FILE
            <Icon name="arrow" className="h-3.5 w-3.5" />
          </a>
          <p className="mt-6 font-mono text-[10.5px] tracking-[0.16em] text-faint">
            PRESS ESC OR CLICK BACK TO RETURN TO {profile.os.name}
          </p>
        </footer>
      </main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-11">
      <h2 className="mb-4 font-mono text-[10px] tracking-[0.26em] text-accent uppercase">{title}</h2>
      {children}
    </section>
  );
}
