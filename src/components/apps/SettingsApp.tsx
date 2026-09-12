"use client";

import { profile } from "@/data/profile";
import { setTheme, THEMES, THEME_LABELS, useTheme } from "@/lib/theme";
import { SHORTCUTS } from "@/lib/shortcuts";
import { AppHeading, AppShell, Row, SectionLabel } from "./ui";

const SWATCHES: Record<(typeof THEMES)[number], string[]> = {
  dark: ["#070707", "#151515", "#8d8d8d", "#ffb020"],
  light: ["#f4f2ee", "#ffffff", "#57534a", "#a8620a"],
  midnight: ["#05070d", "#111726", "#8794ab", "#6aa6ff"],
};

export function SettingsApp() {
  const theme = useTheme();

  return (
    <AppShell>
      <AppHeading
        eyebrow="SETTINGS"
        title="Make it yours"
        lede="Your choice is remembered on this browser. The rest of the site reskins instantly — no reload, no flash on the way back."
      />

      <section className="mb-9">
        <SectionLabel>Appearance</SectionLabel>
        <div className="grid gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-3">
          {THEMES.map((t) => {
            const on = t === theme;
            return (
              <button
                key={t}
                type="button"
                onClick={() => setTheme(t)}
                aria-pressed={on}
                className={`px-4 py-4 text-left transition-colors ${
                  on ? "bg-surface-2" : "bg-surface hover:bg-surface-2"
                }`}
              >
                <span className="mb-3 flex gap-1">
                  {SWATCHES[t].map((c) => (
                    <span
                      key={c}
                      className="h-4 w-4 rounded-sm border border-black/20"
                      style={{ background: c }}
                    />
                  ))}
                </span>
                <span
                  className={`block font-mono text-[11px] tracking-[0.14em] uppercase ${
                    on ? "text-accent" : "text-ink"
                  }`}
                >
                  {THEME_LABELS[t]}
                </span>
                <span className="mt-1 block font-mono text-[10px] text-faint">
                  {on ? "Active" : "Click to apply"}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="mb-9">
        <SectionLabel>Keyboard</SectionLabel>
        <dl className="overflow-hidden rounded-lg border border-line">
          {SHORTCUTS.map((s) => (
            <div
              key={s.keys}
              className="flex items-center gap-4 border-b border-line-soft bg-surface px-4 py-2.5 last:border-0"
            >
              <dt className="w-28 shrink-0">
                <kbd className="rounded border border-line bg-surface-2 px-1.5 py-0.5 font-mono text-[10.5px] text-ink">
                  {s.keys}
                </kbd>
              </dt>
              <dd className="min-w-0 flex-1 text-[12.5px] text-muted">{s.label}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section>
        <SectionLabel>About this system</SectionLabel>
        <dl>
          <Row k="System" v={`${profile.os.name} ${profile.os.version} · ${profile.os.edition}`} />
          <Row k="Built with" v="Next.js, React, TypeScript, Tailwind CSS" />
          <Row k="Dependencies" v="None beyond the framework — no UI, icon or animation libraries" />
          <Row k="Window manager" v="Hand-written: drag, resize, snap, focus, and a remembered session" />
          <Row k="Uptime" v={profile.tagline} />
        </dl>
        <p className="mt-5 text-[12.5px] leading-relaxed text-faint">
          Move a window, resize it, snap it to an edge, then refresh. The workspace comes back the
          way you left it.
        </p>
      </section>
    </AppShell>
  );
}
