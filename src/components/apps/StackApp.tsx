"use client";

import { useState } from "react";
import { now, stack } from "@/data/profile";
import { publishedProjects } from "@/data/projects";
import { useOs } from "@/lib/os";
import { AppHeading, AppShell, SectionLabel } from "./ui";

/**
 * A skill claim is only worth something if you can click through to the thing
 * it was used on. This is derived from each project's own tech list, so it can
 * never drift out of sync with the projects.
 */
function projectsUsing(tech: string) {
  const needles = tech.toLowerCase().split(/\s*\/\s*/);
  return publishedProjects.filter((p) =>
    p.tech.some((t) => needles.some((n) => t.toLowerCase().includes(n))),
  );
}

export function StackApp() {
  const os = useOs();
  const [active, setActive] = useState<string | null>(null);
  const activeItem = stack.flatMap((g) => g.items).find((i) => i.name === active);
  const used = activeItem ? projectsUsing(activeItem.name) : [];

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

      <div className="mt-8 min-h-[96px] rounded-lg border border-line bg-surface-2 px-5 py-4">
        {activeItem ? (
          <>
            <p className="mb-1.5 font-mono text-[10px] tracking-[0.2em] text-accent uppercase">
              {activeItem.name}
            </p>
            <p className="text-[13px] leading-relaxed text-muted">{activeItem.note}</p>

            {used.length > 0 ? (
              <div className="mt-4 border-t border-line pt-3.5">
                <p className="mb-2 font-mono text-[9.5px] tracking-[0.2em] text-faint uppercase">
                  Used in
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {used.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() =>
                        p.study.length > 0
                          ? os.open("project", p.id, p.name)
                          : os.open("work")
                      }
                      className="rounded-md border border-line bg-surface px-2.5 py-1 text-[11.5px] text-ink transition-colors hover:border-accent hover:text-accent"
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </>
        ) : (
          <p className="text-[13px] text-faint">
            Pick one. Every entry here is something I have shipped with, not something I read about —
            and each shows the projects it was used on.
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
