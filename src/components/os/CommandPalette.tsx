"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { contact } from "@/data/profile";
import { publishedProjects } from "@/data/projects";
import { launchableApps, type AppId } from "@/lib/apps";
import { useOs } from "@/lib/os";
import { Icon } from "./Icon";

type Item = {
  id: string;
  label: string;
  hint: string;
  group: string;
  icon: Parameters<typeof Icon>[0]["name"];
  keywords: string;
  run: () => void;
};

/**
 * Mounted only while open, so the query and selection reset for free
 * instead of being cleared by an effect.
 */
export function CommandPalette({ onClose }: { onClose: () => void }) {
  const os = useOs();
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);

  const items = useMemo<Item[]>(() => {
    const apps: Item[] = launchableApps.map((a) => ({
      id: `app:${a.id}`,
      label: a.label,
      hint: a.hint,
      group: "Apps",
      icon: a.icon,
      keywords: [a.id, a.title, a.label, ...a.keywords].join(" ").toLowerCase(),
      run: () => os.open(a.id as AppId),
    }));

    const work: Item[] = publishedProjects.map((p) => ({
      id: `project:${p.id}`,
      label: p.name,
      hint: p.kind,
      group: "Work",
      icon: p.study.length > 0 ? "project" : "work",
      keywords: [p.name, p.kind, p.summary, ...p.tech].join(" ").toLowerCase(),
      run: () =>
        p.study.length > 0 ? os.open("project", p.id, p.name) : window.open(p.links[0]?.href, "_blank", "noopener"),
    }));

    const links: Item[] = [
      {
        id: "link:github",
        label: "GitHub",
        hint: contact.githubHandle,
        group: "Elsewhere",
        icon: "proof",
        keywords: "github code source repos",
        run: () => window.open(contact.github, "_blank", "noopener"),
      },
      {
        id: "link:linkedin",
        label: "LinkedIn",
        hint: contact.linkedinHandle,
        group: "Elsewhere",
        icon: "proof",
        keywords: "linkedin profile formal",
        run: () => window.open(contact.linkedin, "_blank", "noopener"),
      },
      {
        id: "link:email",
        label: "Email me",
        hint: contact.email,
        group: "Elsewhere",
        icon: "contact",
        keywords: "email mail contact hire reach",
        run: () => {
          window.location.href = `mailto:${contact.email}`;
        },
      },
      {
        id: "link:resume",
        label: "Download resume",
        hint: "One page, no theme",
        group: "Elsewhere",
        icon: "notes",
        keywords: "resume cv download pdf",
        run: () => {
          window.location.href = contact.resume;
        },
      },
    ];

    return [...apps, ...work, ...links];
  }, [os]);

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return items;
    return items.filter(
      (i) => i.keywords.includes(needle) || i.label.toLowerCase().includes(needle),
    );
  }, [items, q]);

  useEffect(() => {
    listRef.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const choose = (item?: Item) => {
    if (!item) return;
    item.run();
    onClose();
  };

  let lastGroup = "";

  return (
    <div
      className="fixed inset-0 z-[150] flex items-start justify-center bg-black/55 px-4 pt-[14vh] backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="animate-win-in w-full max-w-lg overflow-hidden rounded-xl border border-line bg-surface shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
      >
        <div className="flex items-center gap-3 border-b border-line px-4">
          <Icon name="search" className="h-4 w-4 shrink-0 text-faint" />
          <input
            autoFocus
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setActive(0);
            }}
            placeholder="Search work, apps, links…"
            aria-label="Search"
            className="h-12 min-w-0 flex-1 bg-transparent text-[14px] text-ink outline-none placeholder:text-faint"
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActive((a) => Math.min(a + 1, results.length - 1));
              }
              if (e.key === "ArrowUp") {
                e.preventDefault();
                setActive((a) => Math.max(a - 1, 0));
              }
              if (e.key === "Enter") {
                e.preventDefault();
                choose(results[active]);
              }
              if (e.key === "Escape") onClose();
            }}
          />
          <kbd className="shrink-0 rounded border border-line px-1.5 py-0.5 font-mono text-[9.5px] text-faint">
            ESC
          </kbd>
        </div>

        <ul ref={listRef} className="scrollbar-thin max-h-[52vh] overflow-y-auto py-2">
          {results.length === 0 ? (
            <li className="px-4 py-8 text-center text-[13px] text-faint">
              Nothing matches “{q}”.
            </li>
          ) : (
            results.map((item, i) => {
              const header = item.group !== lastGroup ? item.group : null;
              lastGroup = item.group;
              return (
                <li key={item.id}>
                  {header ? (
                    <p className="px-4 pt-3 pb-1.5 font-mono text-[9.5px] tracking-[0.22em] text-faint uppercase">
                      {header}
                    </p>
                  ) : null}
                  <button
                    type="button"
                    data-active={i === active}
                    onMouseEnter={() => setActive(i)}
                    onClick={() => choose(item)}
                    className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                      i === active ? "bg-surface-2" : ""
                    }`}
                  >
                    <Icon
                      name={item.icon}
                      className={`h-4 w-4 shrink-0 ${i === active ? "text-accent" : "text-faint"}`}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13.5px] text-ink">{item.label}</span>
                      <span className="block truncate font-mono text-[10.5px] text-faint">
                        {item.hint}
                      </span>
                    </span>
                    {i === active ? (
                      <kbd className="shrink-0 font-mono text-[9.5px] text-faint">↵</kbd>
                    ) : null}
                  </button>
                </li>
              );
            })
          )}
        </ul>
      </div>
    </div>
  );
}
