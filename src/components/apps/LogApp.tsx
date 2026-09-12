"use client";

import { buildLog, type LogKind } from "@/data/journal";
import { AppHeading, AppShell, OutLink } from "./ui";

const KIND: Record<LogKind, string> = {
  SHIP: "text-ok",
  BUILD: "text-ink",
  START: "text-accent",
  LEARN: "text-muted",
  BROKE: "text-faint",
  EXPERIMENT: "text-muted",
};

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export function LogApp() {
  const entries = [...buildLog].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <AppShell>
      <AppHeading
        eyebrow="BUILD_LOG"
        title="What happened, when"
        lede="A changelog instead of a timeline. Dates come from the work itself and from public commit history, so it is checkable."
      />

      <ol className="relative border-l border-line pl-6">
        {entries.map((e, i) => (
          <li key={`${e.date}-${i}`} className="relative pb-7 last:pb-0">
            <span className="absolute -left-[25px] top-[7px] h-1.5 w-1.5 rounded-full bg-line ring-4 ring-bg" />

            <div className="mb-1.5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <time className="font-mono text-[10.5px] tracking-[0.12em] text-faint tabular-nums">
                {fmt(e.date)}
              </time>
              <span className={`font-mono text-[10px] tracking-[0.22em] ${KIND[e.kind]}`}>
                {e.kind}
              </span>
            </div>

            <h3 className="text-[14px] leading-snug font-medium text-ink">{e.title}</h3>

            {e.detail ? (
              <p className="mt-1.5 max-w-lg text-[12.5px] leading-relaxed text-muted">{e.detail}</p>
            ) : null}

            {e.href ? (
              <div className="mt-2">
                <OutLink href={e.href} className="text-[12px] text-faint">
                  {e.href.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                </OutLink>
              </div>
            ) : null}
          </li>
        ))}
      </ol>
    </AppShell>
  );
}
