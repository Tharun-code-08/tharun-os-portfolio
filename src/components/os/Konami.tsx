"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { contact } from "@/data/profile";
import { Icon } from "./Icon";

const SEQUENCE = [
  "ArrowUp",
  "ArrowUp",
  "ArrowDown",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowLeft",
  "ArrowRight",
  "b",
  "a",
];

/** Up up down down left right left right B A. Because of course. */
export function Konami({ onUnlock }: { onUnlock?: () => void } = {}) {
  const [open, setOpen] = useState(false);
  const progress = useRef(0);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const want = SEQUENCE[progress.current];
      const got = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      progress.current = got === want ? progress.current + 1 : got === SEQUENCE[0] ? 1 : 0;
      if (progress.current === SEQUENCE.length) {
        progress.current = 0;
        setOpen(true);
        onUnlock?.();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onUnlock]);

  if (!open) return null;
  return <ReactionTest onClose={() => setOpen(false)} />;
}

type Phase = "idle" | "waiting" | "go" | "result" | "early";

function ReactionTest({ onClose }: { onClose: () => void }) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [ms, setMs] = useState<number | null>(null);
  const [best, setBest] = useState<number | null>(null);
  const startedAt = useRef(0);
  const timer = useRef<number | null>(null);

  const arm = useCallback(() => {
    setPhase("waiting");
    setMs(null);
    timer.current = window.setTimeout(
      () => {
        startedAt.current = performance.now();
        setPhase("go");
      },
      900 + Math.random() * 2200,
    );
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      if (timer.current) clearTimeout(timer.current);
    };
  }, [onClose]);

  const hit = () => {
    if (phase === "idle" || phase === "result" || phase === "early") return arm();
    if (phase === "waiting") {
      if (timer.current) clearTimeout(timer.current);
      return setPhase("early");
    }
    const took = Math.round(performance.now() - startedAt.current);
    setMs(took);
    setBest((b) => (b === null ? took : Math.min(b, took)));
    setPhase("result");
  };

  const copy: Record<Phase, { title: string; sub: string }> = {
    idle: { title: "Reaction test", sub: "Click when the square turns amber." },
    waiting: { title: "Wait…", sub: "Not yet." },
    go: { title: "NOW", sub: "Click." },
    result: { title: `${ms} ms`, sub: "Click to go again." },
    early: { title: "Too early", sub: "Click to restart." },
  };

  return (
    <div
      className="fixed inset-0 z-[180] grid place-items-center bg-black/70 px-6 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="animate-win-in w-full max-w-sm overflow-hidden rounded-xl border border-line bg-surface"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Hidden reaction test"
      >
        <header className="flex items-center justify-between border-b border-line px-4 py-2.5">
          <p className="font-mono text-[10px] tracking-[0.24em] text-accent">ACCESS GRANTED</p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-faint transition-colors hover:text-ink"
          >
            <Icon name="close" className="h-3.5 w-3.5" />
          </button>
        </header>

        <div className="px-5 py-5">
          <p className="mb-5 text-[12.5px] leading-relaxed text-muted">
            You found the sequence. There is no prize, but there is a small test of whether you
            would catch the alert at 3am.
          </p>

          <button
            type="button"
            onClick={hit}
            className={`grid h-40 w-full place-items-center rounded-lg border transition-colors ${
              phase === "go"
                ? "border-accent bg-accent text-accent-ink"
                : phase === "waiting"
                  ? "border-line bg-surface-2 text-faint"
                  : "border-line bg-surface-2 text-ink"
            }`}
          >
            <span className="text-center">
              <span className="block font-mono text-[22px] tracking-tight tabular-nums">
                {copy[phase].title}
              </span>
              <span className="mt-1.5 block font-mono text-[10.5px] tracking-[0.14em] opacity-70">
                {copy[phase].sub}
              </span>
            </span>
          </button>

          <div className="mt-4 flex items-center justify-between font-mono text-[10px] tracking-[0.16em] text-faint">
            <span>BEST {best === null ? "—" : `${best} MS`}</span>
            <a href={`mailto:${contact.email}`} className="transition-colors hover:text-accent">
              BEAT IT? TELL ME →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
