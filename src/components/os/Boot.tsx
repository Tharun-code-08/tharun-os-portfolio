"use client";

import { useEffect, useRef, useState } from "react";
import { profile } from "@/data/profile";

const STEPS = [
  "mounting /work",
  "loading build log",
  "resolving open questions",
  "checking deployments",
  "restoring last session",
];

/**
 * Runs once per browser tab. Skippable by any key, click, or the button —
 * nobody should be forced to watch a boot sequence twice.
 */
export function Boot({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  const done = useRef(false);

  useEffect(() => {
    const finish = () => {
      if (done.current) return;
      done.current = true;
      try {
        sessionStorage.setItem("tharun-os-booted", "1");
      } catch {
        /* private mode — the sequence just runs again. */
      }
      onDone();
    };

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      finish();
      return;
    }

    const timers = STEPS.map((_, i) => window.setTimeout(() => setStep(i + 1), 190 * (i + 1)));
    const end = window.setTimeout(finish, 190 * STEPS.length + 520);

    window.addEventListener("keydown", finish);
    window.addEventListener("pointerdown", finish);

    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(end);
      window.removeEventListener("keydown", finish);
      window.removeEventListener("pointerdown", finish);
    };
  }, [onDone]);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-bg px-6">
      <div className="w-full max-w-sm font-mono text-[12px]">
        <p className="mb-6 tracking-[0.3em] text-accent">
          {profile.os.name} {profile.os.version}
        </p>

        <ul className="space-y-1.5" aria-live="polite">
          {STEPS.map((s, i) => (
            <li
              key={s}
              className={`flex items-center justify-between transition-opacity duration-200 ${
                i < step ? "opacity-100" : "opacity-25"
              }`}
            >
              <span className="text-muted">{s}</span>
              <span className={i < step ? "text-ok" : "text-faint"}>{i < step ? "ok" : "··"}</span>
            </li>
          ))}
        </ul>

        <div className="mt-8 h-px w-full bg-line">
          <div
            className="h-px bg-accent transition-[width] duration-200 ease-out"
            style={{ width: `${(step / STEPS.length) * 100}%` }}
          />
        </div>

        <p className="mt-6 text-[10.5px] tracking-[0.2em] text-faint">
          PRESS ANY KEY TO SKIP<span className="animate-blink">_</span>
        </p>
      </div>
    </div>
  );
}
