"use client";

import { useEffect } from "react";
import { buildLog, lab, notes, failures } from "@/data/journal";
import { profile, stack } from "@/data/profile";
import { publishedExperience, publishedProjects, projects } from "@/data/projects";
import { sites } from "@/data/sites";
import { TIER_NAMES, tier } from "@/lib/bot";
import { SPACES, useOs } from "@/lib/os";
import { Icon } from "./Icon";

/**
 * Press D. For the visitor who wants to know how the thing they are looking at
 * is actually put together — every number here is read live from the running
 * app, not typed into a slide.
 */
export function DeveloperMode({ onClose }: { onClose: () => void }) {
  const os = useOs();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key.toLowerCase() === "d") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const t = tier();

  return (
    <div
      className="scrollbar-thin fixed inset-0 z-[175] overflow-y-auto bg-bg/96 backdrop-blur-xl"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="mx-auto max-w-3xl px-6 py-12"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Developer mode"
      >
        <header className="mb-8 flex items-start justify-between gap-6 border-b border-line pb-6">
          <div>
            <p className="mb-2 font-mono text-[10px] tracking-[0.26em] text-accent">DEVELOPER MODE</p>
            <h2 className="text-[22px] font-medium tracking-tight text-ink">
              How this is wired up
            </h2>
            <p className="mt-2 max-w-lg text-[13px] leading-relaxed text-muted">
              Read live from the running app. If a count here is wrong, the site is wrong.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex shrink-0 items-center gap-1.5 rounded border border-line px-2.5 py-1 font-mono text-[10px] tracking-[0.14em] text-faint transition-colors hover:border-accent hover:text-accent"
          >
            CLOSE
            <Icon name="close" className="h-3 w-3" />
          </button>
        </header>

        <Block title="Process tree">
          {os.wins.length === 0 ? (
            <Mono dim>no windows open on this desk</Mono>
          ) : (
            <div className="space-y-1">
              {[...os.wins]
                .sort((a, b) => b.z - a.z)
                .map((w) => (
                  <Mono key={w.id}>
                    {w.minimized ? "·" : "●"} {w.appId.padEnd(10)} {String(Math.round(w.w)).padStart(4)}×
                    {String(Math.round(w.h)).padEnd(4)} z:{String(w.z).padEnd(4)} {w.space}
                  </Mono>
                ))}
            </div>
          )}
          <Mono dim>
            {SPACES.map((s) => `${s.id}${s.id === os.space ? "*" : ""}`).join("  ")} — * is active
          </Mono>
        </Block>

        <Block title="Runtime">
          <Row k="Framework" v="Next.js 16 · App Router · React 19 · TypeScript" />
          <Row k="Styling" v="Tailwind CSS v4, theme tokens redefined per [data-theme]" />
          <Row k="Runtime deps" v="None beyond the framework — no UI, icon, animation or state library" />
          <Row k="Window manager" v="useReducer in lib/os.tsx — drag, resize, snap, focus, spaces" />
          <Row k="World" v="SVG rects on a 320×180 grid + one WebGL fragment shader for dust" />
          <Row k="Character" v="lib/bot.ts state machine, lib/cinematic.ts 15s scene loop" />
          <Row k="Persistence" v="localStorage for the workspace and theme, sessionStorage for the bot" />
        </Block>

        <Block title="Content model">
          <Row k="projects" v={`${projects.length} defined · ${publishedProjects.length} published`} />
          <Row
            k="case studies"
            v={`${publishedProjects.filter((p) => p.study.length > 0).length} with a written study`}
          />
          <Row k="experience" v={`${publishedExperience.length} published roles`} />
          <Row k="buildLog" v={`${buildLog.length} entries`} />
          <Row k="lab" v={`${lab.length} open questions`} />
          <Row k="notes" v={`${notes.length} — empty until written`} />
          <Row k="failures" v={`${failures.length} — empty until written`} />
          <Row k="stack" v={`${stack.reduce((n, g) => n + g.items.length, 0)} tools in ${stack.length} groups`} />
          <Row k="browser sites" v={sites.map((s) => s.url.replace("https://", "")).join(", ")} />
        </Block>

        <Block title="Public API">
          <Mono>GET /api/portfolio</Mono>
          <Mono>GET /api/portfolio?q=projects</Mono>
          <Mono dim>sections: projects experience stack buildLog now openQuestions education</Mono>
          <div className="mt-3">
            <a
              href="/api/portfolio"
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-1.5 rounded border border-line px-2.5 py-1.5 font-mono text-[10.5px] tracking-[0.12em] text-muted transition-colors hover:border-accent hover:text-accent"
            >
              OPEN THE JSON
              <Icon name="arrow" className="h-3 w-3" />
            </a>
          </div>
        </Block>

        <Block title="Session">
          <Row k="Relationship" v={`${t} — ${TIER_NAMES[t]}`} />
          <Row
            k="What that is"
            v="A session-local counter of how many apps you've opened. It only changes which lines TharunBOT picks. Nothing is stored about you, and it dies with the tab."
          />
          <Row k="Theme" v={typeof document !== "undefined" ? (document.documentElement.dataset.theme ?? "dark") : "dark"} />
          <Row k="Uptime" v={profile.tagline} />
        </Block>

        <p className="mt-8 font-mono text-[10px] tracking-[0.16em] text-faint">
          PRESS D OR ESC TO LEAVE DEVELOPER MODE
        </p>
      </div>
    </div>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h3 className="mb-3 font-mono text-[10px] tracking-[0.24em] text-accent uppercase">{title}</h3>
      <div className="rounded-lg border border-line bg-surface px-4 py-3.5">{children}</div>
    </section>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex gap-4 border-b border-line-soft py-2 last:border-0">
      <dt className="w-32 shrink-0 font-mono text-[10px] tracking-[0.14em] text-faint uppercase">
        {k}
      </dt>
      <dd className="min-w-0 flex-1 text-[12.5px] leading-relaxed text-muted">{v}</dd>
    </div>
  );
}

function Mono({ children, dim = false }: { children: React.ReactNode; dim?: boolean }) {
  return (
    <p
      className={`font-mono text-[11.5px] whitespace-pre-wrap ${dim ? "mt-2 text-faint" : "text-ink"}`}
    >
      {children}
    </p>
  );
}
