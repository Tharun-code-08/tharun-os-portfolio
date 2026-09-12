"use client";

import { failures, lab, notes, type LabStatus } from "@/data/journal";
import { AppHeading, AppShell, EmptyState, SectionLabel } from "./ui";

const STATUS: Record<LabStatus, { label: string; className: string }> = {
  ONGOING: { label: "Ongoing", className: "text-accent border-accent/40" },
  ANSWERED: { label: "Answered", className: "text-ok border-ok/40" },
  PARKED: { label: "Parked", className: "text-faint border-line" },
};

export function LabApp() {
  return (
    <AppShell>
      <AppHeading
        eyebrow="LAB"
        title="Open questions"
        lede="Not side projects. These are the things the day job keeps forcing me to actually understand, written down while they are still unresolved."
      />

      {lab.length === 0 ? (
        <EmptyState
          title="Nothing open"
          body="Add an entry to `lab` in src/data/journal.ts and this section reappears."
        />
      ) : (
        <ul className="space-y-4">
          {lab.map((e) => {
            const s = STATUS[e.status];
            return (
              <li key={e.id} className="rounded-lg border border-line bg-surface-2 px-5 py-5">
                <div className="mb-3 flex items-center gap-3">
                  <span className="font-mono text-[10.5px] text-faint tabular-nums">{e.index}</span>
                  <span
                    className={`rounded-full border px-2 py-0.5 font-mono text-[9.5px] tracking-[0.18em] uppercase ${s.className}`}
                  >
                    {s.label}
                  </span>
                </div>

                <h3 className="mb-4 text-[15px] leading-snug font-medium text-ink">{e.question}</h3>

                <dl className="space-y-3 border-l border-line pl-4">
                  <Field k="Why it matters" v={e.context} />
                  <Field k="Approach" v={e.approach} />
                  {e.result ? <Field k="Result" v={e.result} /> : null}
                </dl>
              </li>
            );
          })}
        </ul>
      )}
    </AppShell>
  );
}

function Field({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <dt className="mb-1 font-mono text-[9.5px] tracking-[0.2em] text-faint uppercase">{k}</dt>
      <dd className="text-[13px] leading-relaxed text-muted">{v}</dd>
    </div>
  );
}

export function FailuresApp() {
  return (
    <AppShell>
      <AppHeading
        eyebrow="FAILURE_MUSEUM"
        title="What did not work"
        lede="Every portfolio shows the wins. This is the other half of the record."
      />
      {failures.length === 0 ? (
        <EmptyState
          title="Empty"
          body="Nothing filed here yet. Add entries to `failures` in src/data/journal.ts."
        />
      ) : (
        <ul className="space-y-4">
          {failures.map((f) => (
            <li key={f.id} className="rounded-lg border border-line bg-surface-2 px-5 py-5">
              <div className="mb-3 flex items-center gap-3">
                <span className="font-mono text-[10.5px] text-faint tabular-nums">{f.index}</span>
                <span className="rounded-full border border-line px-2 py-0.5 font-mono text-[9.5px] tracking-[0.18em] text-faint uppercase">
                  {f.verdict}
                </span>
              </div>
              <h3 className="mb-4 text-[15px] font-medium text-ink">{f.title}</h3>
              <dl className="space-y-3 border-l border-line pl-4">
                <Field k="What happened" v={f.whatHappened} />
                <Field k="Why it failed" v={f.whyItFailed} />
                <Field k="Lesson" v={f.lesson} />
              </dl>
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}

export function NotesApp() {
  return (
    <AppShell>
      <AppHeading
        eyebrow="NOTES"
        title="Short write-ups"
        lede="Notes, not articles. Written to remember something, published in case it helps."
      />
      {notes.length === 0 ? (
        <EmptyState
          title="Nothing published"
          body="Add entries to `notes` in src/data/journal.ts and this appears in the dock."
        />
      ) : (
        <div className="space-y-10">
          {notes.map((n) => (
            <article key={n.slug}>
              <SectionLabel>
                {n.tag} · {new Date(n.date).toLocaleDateString("en-GB", { month: "short", year: "numeric" })}
              </SectionLabel>
              <h3 className="mb-3 text-[17px] leading-snug font-medium text-ink">{n.title}</h3>
              <div className="space-y-3.5">
                {n.body.map((para, i) => (
                  <p key={i} className="text-[13.5px] leading-relaxed text-muted">
                    {para}
                  </p>
                ))}
              </div>
            </article>
          ))}
        </div>
      )}
    </AppShell>
  );
}
