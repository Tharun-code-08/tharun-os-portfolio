"use client";

import { profile } from "@/data/profile";
import { buildLog } from "@/data/journal";
import { publishedProjects } from "@/data/projects";
import { useOs } from "@/lib/os";
import { Icon } from "./Icon";

export function Desktop() {
  const os = useOs();
  // Newest entry of any kind, so this card cannot go stale just because the
  // most recent milestone happened to not be a launch.
  const latest = [...buildLog].sort((a, b) => b.date.localeCompare(a.date))[0];
  const lead = publishedProjects[0];

  return (
    // `m-auto` on the child centres the hero when there is room and lets the
    // layer scroll when the window is short, instead of clipping the top.
    <div className="scrollbar-thin absolute inset-x-0 top-[34px] bottom-0 z-0 flex overflow-y-auto px-6">
      <div className="m-auto w-full max-w-3xl py-10 pb-28">
        <div className="animate-fade-up" style={{ animationDelay: "60ms" }}>
          <p className="mb-5 font-mono text-[10.5px] tracking-[0.3em] text-faint">
            {profile.name.toUpperCase()}
          </p>

          <h1 className="text-[clamp(2.1rem,6.2vw,4.1rem)] leading-[0.98] font-medium tracking-[-0.03em] text-ink">
            {profile.headline[0]}
            <br />
            <span className="text-faint">{profile.headline[1]}</span>
          </h1>

          <p className="mt-6 max-w-lg text-[14px] leading-relaxed text-muted">{profile.intro}</p>
        </div>

        <div
          className="animate-fade-up mt-9 flex flex-wrap gap-2.5"
          style={{ animationDelay: "180ms" }}
        >
          <button
            type="button"
            onClick={() => os.open("work")}
            className="inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2.5 font-mono text-[11px] tracking-[0.14em] text-accent-ink transition-opacity hover:opacity-90"
          >
            OPEN THE WORK
            <Icon name="arrow" className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => os.open("me")}
            className="rounded-md border border-line bg-surface/60 px-4 py-2.5 font-mono text-[11px] tracking-[0.14em] text-muted backdrop-blur transition-colors hover:border-muted hover:text-ink"
          >
            WHO IS THIS
          </button>
        </div>

        <div
          className="animate-fade-up mt-12 grid gap-px overflow-hidden rounded-lg border border-line-soft bg-line-soft sm:grid-cols-3"
          style={{ animationDelay: "300ms" }}
        >
          <Card
            label="Currently building"
            value={lead?.name ?? "—"}
            note={lead?.kind ?? ""}
            live
            onClick={() => os.open("project", lead.id, lead.name)}
          />
          <Card
            label="Latest"
            value={latest?.title ?? "—"}
            note={
              latest
                ? new Date(latest.date).toLocaleDateString("en-GB", { month: "long", year: "numeric" })
                : ""
            }
            onClick={() => os.open("log")}
          />
          <Card
            label="Open questions"
            value="The Lab"
            note="Things I have not solved yet"
            onClick={() => os.open("lab")}
          />
        </div>

        <p
          className="animate-fade-up mt-8 font-mono text-[10px] tracking-[0.18em] text-faint"
          style={{ animationDelay: "420ms" }}
        >
          ⌘K TO SEARCH · R FOR RECRUITER MODE · DOCK BELOW
        </p>
      </div>
    </div>
  );
}

function Card({
  label,
  value,
  note,
  onClick,
  live = false,
}: {
  label: string;
  value: string;
  note: string;
  onClick: () => void;
  live?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group bg-surface/70 px-4 py-4 text-left backdrop-blur transition-colors hover:bg-surface-2"
    >
      <p className="mb-2 flex items-center gap-2 font-mono text-[9.5px] tracking-[0.2em] text-faint uppercase">
        {live ? <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-accent" /> : null}
        {label}
      </p>
      <p className="truncate text-[13.5px] font-medium text-ink transition-colors group-hover:text-accent">
        {value}
      </p>
      <p className="mt-1 line-clamp-2 text-[11.5px] leading-snug text-faint">{note}</p>
    </button>
  );
}
