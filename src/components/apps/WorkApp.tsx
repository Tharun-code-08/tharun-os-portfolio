"use client";

import { publishedProjects, type Project } from "@/data/projects";
import { useOs } from "@/lib/os";
import { Icon } from "../os/Icon";
import { AppHeading, AppShell, OutLink, Row, SectionLabel, StatusDot, Tag } from "./ui";

export function WorkApp() {
  const os = useOs();

  return (
    <AppShell>
      <AppHeading
        eyebrow="WORK"
        title="Things that exist"
        lede="Every item here links to a live URL or to source, newest first. The top three are full products; the rest are builds and experiments."
      />

      <ul className="space-y-px overflow-hidden rounded-lg border border-line bg-line">
        {publishedProjects.map((p) => (
          <ProjectRow key={p.id} project={p} onOpen={() => os.open("project", p.id, p.name)} />
        ))}
      </ul>

      <p className="mt-6 text-[12.5px] leading-relaxed text-faint">
        More of the smaller work lives on{" "}
        <OutLink href="https://github.com/Tharun-code-08">GitHub</OutLink> — interview assignments,
        coursework, and the experiments that never became anything.
      </p>
    </AppShell>
  );
}

function ProjectRow({ project: p, onOpen }: { project: Project; onOpen: () => void }) {
  const hasStudy = p.study.length > 0;

  return (
    <li className="group bg-surface transition-colors hover:bg-surface-2">
      <div className="flex items-start gap-4 px-5 py-5">
        <span className="mt-0.5 font-mono text-[11px] text-faint tabular-nums">{p.index}</span>

        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
            <h3 className="text-[15px] font-medium text-ink">{p.name}</h3>
            <StatusDot state={p.status} />
          </div>

          <p className="mb-1 font-mono text-[10.5px] tracking-[0.14em] text-faint uppercase">
            {p.kind} · {p.period}
          </p>

          <p className="mt-2.5 max-w-xl text-[13px] leading-relaxed text-muted">{p.summary}</p>

          {p.tech.length > 0 ? (
            <div className="mt-3.5 flex flex-wrap gap-1.5">
              {p.tech.slice(0, 6).map((t) => (
                <Tag key={t}>{t}</Tag>
              ))}
              {p.tech.length > 6 ? <Tag>+{p.tech.length - 6}</Tag> : null}
            </div>
          ) : null}

          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
            {hasStudy ? (
              <button
                type="button"
                onClick={onOpen}
                className="inline-flex items-center gap-1.5 font-mono text-[11px] tracking-[0.14em] text-accent transition-opacity hover:opacity-75"
              >
                OPEN CASE FILE
                <Icon name="arrow" className="h-3 w-3" />
              </button>
            ) : null}
            {p.links.map((l) => (
              <OutLink key={l.href} href={l.href} className="text-[12.5px] text-muted">
                {l.label}
              </OutLink>
            ))}
          </div>
        </div>
      </div>
    </li>
  );
}

export function ProjectApp({ payload }: { payload?: string }) {
  const p = publishedProjects.find((x) => x.id === payload);
  if (!p) {
    return (
      <AppShell>
        <p className="text-[13px] text-muted">That case file is not on this machine.</p>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <AppHeading eyebrow={`CASE FILE #${p.index}`} title={p.name} lede={p.summary} />

      <dl className="mb-8">
        <Row k="Status" v={<StatusDot state={p.status} />} />
        <Row k="Role" v={p.role} />
        <Row k="Period" v={p.period} />
        <Row
          k="Built with"
          v={
            <div className="flex flex-wrap gap-1.5">
              {p.tech.map((t) => (
                <Tag key={t}>{t}</Tag>
              ))}
            </div>
          }
        />
        {p.links.length > 0 ? (
          <Row
            k="Links"
            v={
              <div className="flex flex-wrap gap-x-5 gap-y-1">
                {p.links.map((l) => (
                  <OutLink key={l.href} href={l.href}>
                    {l.label}
                  </OutLink>
                ))}
              </div>
            }
          />
        ) : null}
      </dl>

      <div className="space-y-8">
        {p.study.map((s) => (
          <section key={s.heading}>
            <SectionLabel>{s.heading}</SectionLabel>
            <div className="space-y-3.5 border-l border-line pl-5">
              {s.body.map((para, i) => (
                <p key={i} className="text-[13.5px] leading-relaxed text-muted">
                  {para}
                </p>
              ))}
            </div>
          </section>
        ))}
      </div>
    </AppShell>
  );
}
