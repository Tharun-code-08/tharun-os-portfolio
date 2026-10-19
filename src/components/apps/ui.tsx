import type { ReactNode } from "react";
import { Icon } from "../os/Icon";

export function AppShell({ children }: { children: ReactNode }) {
  return <div className="px-6 py-6 sm:px-8 sm:py-7">{children}</div>;
}

export function AppHeading({
  eyebrow,
  title,
  lede,
}: {
  eyebrow: string;
  title: string;
  lede?: string;
}) {
  return (
    <header className="mb-7 border-b border-line-soft pb-6">
      <p className="mb-3 font-mono text-[10px] tracking-[0.28em] text-accent">{eyebrow}</p>
      <h2 className="text-2xl leading-tight font-medium tracking-tight text-ink sm:text-[27px]">
        {title}
      </h2>
      {lede ? <p className="mt-3 max-w-xl text-[13.5px] leading-relaxed text-muted">{lede}</p> : null}
    </header>
  );
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="mb-3 font-mono text-[10px] tracking-[0.24em] text-faint uppercase">{children}</p>
  );
}

export function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full border border-line px-2.5 py-1 font-mono text-[10px] tracking-wide text-muted">
      {children}
    </span>
  );
}

export function StatusDot({ state }: { state: "shipped" | "building" | "archived" }) {
  const map = {
    building: { color: "bg-accent", label: "Building", pulse: true },
    shipped: { color: "bg-ok", label: "Shipped", pulse: false },
    archived: { color: "bg-faint", label: "Archived", pulse: false },
  } as const;
  const s = map[state];
  return (
    <span className="inline-flex items-center gap-2 font-mono text-[10px] tracking-[0.18em] text-muted uppercase">
      <span
        className={`h-1.5 w-1.5 rounded-full ${s.color} ${s.pulse ? "animate-pulse-dot" : ""}`}
      />
      {s.label}
    </span>
  );
}

export function OutLink({
  href,
  children,
  className = "",
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  const external = href.startsWith("http");
  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer noopener" : undefined}
      className={`group inline-flex items-center gap-1.5 text-[13px] text-ink underline decoration-line underline-offset-4 transition-colors hover:decoration-accent ${className}`}
    >
      {children}
      {external ? (
        <Icon name="arrow" className="h-3 w-3 text-faint transition-colors group-hover:text-accent" />
      ) : null}
    </a>
  );
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-lg border border-dashed border-line px-6 py-10 text-center">
      <p className="font-mono text-[11px] tracking-[0.2em] text-faint uppercase">{title}</p>
      <p className="mx-auto mt-3 max-w-sm text-[13px] leading-relaxed text-muted">{body}</p>
    </div>
  );
}

/** Two-column definition row used across ME, NOW and PROJECT. */
export function Row({ k, v }: { k: string; v: ReactNode }) {
  return (
    <div className="flex gap-4 border-b border-line-soft py-2.5 last:border-0">
      <dt className="w-28 shrink-0 font-mono text-[10px] tracking-[0.18em] text-faint uppercase">
        {k}
      </dt>
      <dd className="min-w-0 flex-1 text-[13px] leading-relaxed text-ink">{v}</dd>
    </div>
  );
}
