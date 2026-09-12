"use client";

import { useState } from "react";
import { now, stack } from "@/data/profile";
import { AppHeading, AppShell, SectionLabel } from "./ui";

export function StackApp() {
  const [active, setActive] = useState<string | null>(null);
  const activeItem = stack.flatMap((g) => g.items).find((i) => i.name === active);

  return (
    <AppShell>
      <AppHeading
        eyebrow="STACK"
        title="Tools, and what I use them for"
        lede="Not a logo wall. Hover or tap anything and it tells you what it actually does in my work."
      />

      <div className="space-y-7">
        {stack.map((group) => (
          <section key={group.label}>
            <SectionLabel>{group.label}</SectionLabel>
            <div className="flex flex-wrap gap-1.5">
              {group.items.map((item) => {
                const on = active === item.name;
                return (
                  <button
                    key={item.name}
                    type="button"
                    onMouseEnter={() => setActive(item.name)}
                    onFocus={() => setActive(item.name)}
                    onClick={() => setActive(on ? null : item.name)}
                    className={`rounded-md border px-3 py-1.5 font-mono text-[11.5px] transition-colors ${
                      on
                        ? "border-accent bg-accent/10 text-accent"
                        : "border-line bg-surface-2 text-muted hover:border-muted hover:text-ink"
                    }`}
                  >
                    {item.name}
                  </button>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <div className="mt-8 min-h-[76px] rounded-lg border border-line bg-surface-2 px-5 py-4">
        {activeItem ? (
          <>
            <p className="mb-1.5 font-mono text-[10px] tracking-[0.2em] text-accent uppercase">
              {activeItem.name}
            </p>
            <p className="text-[13px] leading-relaxed text-muted">{activeItem.note}</p>
          </>
        ) : (
          <p className="text-[13px] text-faint">
            Pick one. Every entry here is something I have shipped with, not something I read about.
          </p>
        )}
      </div>
    </AppShell>
  );
}

export function NowApp() {
  return (
    <AppShell>
      <AppHeading
        eyebrow="NOW"
        title="What I am doing right now"
        lede={`Last updated ${now.updated}. If this page is stale, so is the rest of the site — tell me.`}
      />

      <div className="space-y-8">
        <Block label="Building" items={now.building} accent />
        <Block label="Learning" items={now.learning} />
        <Block label="Thinking about" items={now.thinkingAbout} />
      </div>
    </AppShell>
  );
}

function Block({
  label,
  items,
  accent = false,
}: {
  label: string;
  items: string[];
  accent?: boolean;
}) {
  return (
    <section>
      <SectionLabel>{label}</SectionLabel>
      <ul className="space-y-3">
        {items.map((item, i) => (
          <li key={i} className="flex gap-3.5">
            <span
              className={`mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full ${
                accent ? "bg-accent animate-pulse-dot" : "bg-line"
              }`}
            />
            <p className="text-[13.5px] leading-relaxed text-muted">{item}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
