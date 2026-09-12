"use client";

import { useEffect, useState } from "react";
import { sites } from "@/data/sites";
import { Icon } from "../os/Icon";

/**
 * A browser inside the OS. The bookmarked sites are ones I checked actually
 * allow embedding — none of them send X-Frame-Options or a frame-ancestors
 * policy. Anything that refuses still gets an escape hatch rather than an
 * unexplained white rectangle.
 */
export function BrowserApp({ payload }: { payload?: string }) {
  const start = sites.find((s) => s.id === payload) ?? sites[0];
  const [history, setHistory] = useState<string[]>([start.url]);
  const [index, setIndex] = useState(0);
  const [nonce, setNonce] = useState(0);
  const [loading, setLoading] = useState(true);

  const url = history[index];
  const current = sites.find((s) => url.startsWith(s.url));

  function go(next: string) {
    const trimmed = history.slice(0, index + 1);
    setHistory([...trimmed, next]);
    setIndex(trimmed.length);
  }

  const canBack = index > 0;
  const canForward = index < history.length - 1;

  return (
    <div className="flex h-full min-h-0 flex-col bg-surface">
      <div className="flex shrink-0 items-center gap-2 border-b border-line bg-surface-2 px-3 py-2">
        <NavButton
          label="Back"
          disabled={!canBack}
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
        >
          <span className="text-[13px] leading-none">‹</span>
        </NavButton>
        <NavButton
          label="Forward"
          disabled={!canForward}
          onClick={() => setIndex((i) => Math.min(history.length - 1, i + 1))}
        >
          <span className="text-[13px] leading-none">›</span>
        </NavButton>
        <NavButton label="Reload" onClick={() => setNonce((n) => n + 1)}>
          <span className="text-[11px] leading-none">↻</span>
        </NavButton>

        <p className="ml-1 flex min-w-0 flex-1 items-center gap-2 truncate rounded-md border border-line bg-surface px-2.5 py-1.5 font-mono text-[11px] text-muted">
          <span
            className={`h-1.5 w-1.5 shrink-0 rounded-full ${loading ? "bg-accent animate-pulse-dot" : "bg-ok"}`}
          />
          <span className="truncate">{url.replace(/^https?:\/\//, "")}</span>
        </p>

        <a
          href={url}
          target="_blank"
          rel="noreferrer noopener"
          title="Open in a real tab"
          className="shrink-0 rounded-md border border-line px-2 py-1.5 text-faint transition-colors hover:border-accent hover:text-accent"
        >
          <Icon name="arrow" className="h-3.5 w-3.5" />
        </a>
      </div>

      <div className="flex shrink-0 gap-1 overflow-x-auto border-b border-line-soft bg-surface px-3 py-1.5">
        {sites.map((s) => {
          const on = current?.id === s.id;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => go(s.url)}
              title={s.note}
              className={`shrink-0 rounded px-2.5 py-1 font-mono text-[10.5px] tracking-[0.08em] transition-colors ${
                on ? "bg-accent/12 text-accent" : "text-faint hover:text-ink"
              }`}
            >
              {s.label}
            </button>
          );
        })}
      </div>

      {/* Keyed, so navigating mounts a fresh frame with its own loading state
          instead of an effect resetting the old one. */}
      <Frame
        key={`${url}:${nonce}`}
        url={url}
        title={current?.label ?? url}
        onLoaded={() => setLoading(false)}
      />

      {current?.note ? (
        <p className="shrink-0 border-t border-line bg-surface-2 px-3 py-1.5 font-mono text-[10px] tracking-[0.1em] text-faint">
          {current.note.toUpperCase()}
        </p>
      ) : null}
    </div>
  );
}

function Frame({
  url,
  title,
  onLoaded,
}: {
  url: string;
  title: string;
  onLoaded: () => void;
}) {
  const [slow, setSlow] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    // Cross-origin frames cannot be inspected, so a blocked load looks exactly
    // like a slow one. After six seconds, offer the way out either way.
    const id = window.setTimeout(() => setSlow(true), 6000);
    return () => clearTimeout(id);
  }, []);

  return (
    <div className="relative min-h-0 flex-1 bg-white">
      <iframe
        src={url}
        title={title}
        onLoad={() => {
          setDone(true);
          onLoaded();
        }}
        referrerPolicy="no-referrer"
        sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
        className="h-full w-full border-0"
      />

      {slow && !done ? (
        <div className="absolute inset-x-0 bottom-0 border-t border-line bg-surface/95 px-4 py-3 backdrop-blur">
          <p className="text-[12.5px] text-muted">
            Taking a while — some sites refuse to load inside a frame.{" "}
            <a
              href={url}
              target="_blank"
              rel="noreferrer noopener"
              className="text-accent underline underline-offset-4"
            >
              Open it in a real tab
            </a>
            .
          </p>
        </div>
      ) : null}
    </div>
  );
}

function NavButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="grid h-6 w-6 shrink-0 place-items-center rounded border border-line bg-surface font-mono text-muted transition-colors hover:border-muted hover:text-ink disabled:opacity-35 disabled:hover:border-line disabled:hover:text-muted"
    >
      {children}
    </button>
  );
}
