"use client";

import { useMemo, useState } from "react";
import { contact, profile } from "@/data/profile";
import { liveDeployments, proofStats } from "@/data/proof";
import { Icon } from "../os/Icon";
import { AppHeading, AppShell, OutLink, SectionLabel } from "./ui";

export function ProofApp() {
  const stats = useMemo(() => proofStats(), []);

  return (
    <AppShell>
      <AppHeading
        eyebrow="PROOF"
        title="Do not take my word for it"
        lede="Only numbers that can be checked by clicking something. No invented user counts, no 10x anything."
      />

      <div className="mb-8 grid gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-2">
        {stats.map((s) => (
          <div key={s.label} className="bg-surface px-5 py-5">
            <p className="font-mono text-[28px] leading-none text-ink tabular-nums">{s.value}</p>
            <p className="mt-2 font-mono text-[10px] tracking-[0.2em] text-accent uppercase">
              {s.label}
            </p>
            <p className="mt-2.5 text-[12.5px] leading-relaxed text-muted">{s.note}</p>
          </div>
        ))}
      </div>

      <section className="mb-8">
        <SectionLabel>Open these right now</SectionLabel>
        <ul className="space-y-px overflow-hidden rounded-lg border border-line bg-line">
          {liveDeployments.map((d) => (
            <li key={d.href} className="bg-surface px-5 py-4">
              <div className="flex items-baseline justify-between gap-4">
                <OutLink href={d.href} className="text-[13.5px]">
                  {d.label}
                </OutLink>
                <span className="font-mono text-[10px] tracking-[0.14em] text-faint uppercase">
                  {d.note}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <SectionLabel>The record</SectionLabel>
        <div className="flex flex-wrap gap-2">
          <ProofLink href={contact.github} label="GitHub" />
          <ProofLink href={contact.linkedin} label="LinkedIn" />
          {contact.leetcode ? <ProofLink href={contact.leetcode} label="LeetCode" /> : null}
          <ProofLink href={contact.resume} label="Resume" download />
        </div>
      </section>
    </AppShell>
  );
}

function ProofLink({
  href,
  label,
  download = false,
}: {
  href: string;
  label: string;
  download?: boolean;
}) {
  return (
    <a
      href={href}
      target={download ? undefined : "_blank"}
      rel="noreferrer noopener"
      download={download || undefined}
      className="group inline-flex items-center gap-2 rounded-md border border-line bg-surface-2 px-3.5 py-2 font-mono text-[11px] tracking-[0.14em] text-muted transition-colors hover:border-accent hover:text-accent"
    >
      {label.toUpperCase()}
      <Icon name="arrow" className="h-3 w-3" />
    </a>
  );
}

/* ------------------------------------------------------------------ contact */

type Intent = "idea" | "builder" | "hello";

const INTENTS: Record<Intent, { label: string; blurb: string; subject: string; body: string }> = {
  idea: {
    label: "I have an idea",
    blurb: "Tell me the problem before the solution. What breaks today, and for whom?",
    subject: "An idea worth building",
    body: "The problem:\n\nWho has it:\n\nWhat I think the solution looks like:\n\n",
  },
  builder: {
    label: "I need a builder",
    blurb: "What are you trying to ship, and by when? I will tell you honestly if I am the wrong person.",
    subject: "Work enquiry",
    body: "What we are building:\n\nTimeline:\n\nStack (if it is decided):\n\n",
  },
  hello: {
    label: "Just saying hi",
    blurb: "Questions about the stack, the architecture, or how to get into industry early — all welcome.",
    subject: "Hello",
    body: "",
  },
};

export function ContactApp() {
  const [intent, setIntent] = useState<Intent>("idea");
  const it = INTENTS[intent];
  const mailto = `mailto:${contact.email}?subject=${encodeURIComponent(it.subject)}&body=${encodeURIComponent(it.body)}`;

  return (
    <AppShell>
      <AppHeading
        eyebrow="CONTACT"
        title="Got something worth building?"
        lede="Pick the one that fits. It opens your mail client with a sensible starting point — nothing is sent from this page."
      />

      <div className="mb-6 grid gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-3">
        {(Object.keys(INTENTS) as Intent[]).map((key) => {
          const on = key === intent;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setIntent(key)}
              className={`px-4 py-3.5 text-left transition-colors ${
                on ? "bg-surface-2 text-accent" : "bg-surface text-muted hover:text-ink"
              }`}
            >
              <span className="font-mono text-[11px] tracking-[0.1em]">{INTENTS[key].label}</span>
            </button>
          );
        })}
      </div>

      <p className="mb-7 min-h-[42px] text-[13.5px] leading-relaxed text-muted">{it.blurb}</p>

      <a
        href={mailto}
        className="mb-9 inline-flex items-center gap-2.5 rounded-md bg-accent px-4 py-2.5 font-mono text-[11.5px] tracking-[0.14em] text-accent-ink transition-opacity hover:opacity-90"
      >
        START THE EMAIL
        <Icon name="arrow" className="h-3.5 w-3.5" />
      </a>

      <section>
        <SectionLabel>Or, directly</SectionLabel>
        <dl className="overflow-hidden rounded-lg border border-line">
          <Line k="Email" v={contact.email} href={`mailto:${contact.email}`} />
          {contact.phone ? <Line k="Phone" v={contact.phone} href={contact.phoneHref} /> : null}
          <Line k="GitHub" v={contact.githubHandle} href={contact.github} />
          <Line k="LinkedIn" v={contact.linkedinHandle} href={contact.linkedin} />
          <Line k="Resume" v="Download" href={contact.resume} />
          <Line k="Based in" v={profile.location} />
        </dl>
      </section>
    </AppShell>
  );
}

function Line({ k, v, href }: { k: string; v: string; href?: string }) {
  return (
    <div className="flex items-center gap-4 border-b border-line-soft bg-surface px-5 py-3 last:border-0">
      <dt className="w-24 shrink-0 font-mono text-[10px] tracking-[0.18em] text-faint uppercase">
        {k}
      </dt>
      <dd className="min-w-0 flex-1 text-[13px] text-ink">
        {href ? (
          <a
            href={href}
            target={href.startsWith("http") ? "_blank" : undefined}
            rel="noreferrer noopener"
            className="underline decoration-line underline-offset-4 transition-colors hover:decoration-accent"
          >
            {v}
          </a>
        ) : (
          v
        )}
      </dd>
    </div>
  );
}
