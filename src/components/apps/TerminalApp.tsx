"use client";

import { useEffect, useRef, useState } from "react";
import { contact, profile, stack } from "@/data/profile";
import { publishedProjects } from "@/data/projects";
import { APPS, launchableApps, type AppId } from "@/lib/apps";
import { useOs } from "@/lib/os";

type Line = { text: string; tone?: "dim" | "accent" | "ok" };

const BANNER: Line[] = [
  { text: `${profile.os.name} ${profile.os.version} — ${profile.os.edition}`, tone: "accent" },
  { text: `Type "help" for commands. Most of them open a window.`, tone: "dim" },
];

export function TerminalApp() {
  const os = useOs();
  const [lines, setLines] = useState<Line[]>(BANNER);
  const [value, setValue] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [cursor, setCursor] = useState(-1);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [lines]);

  function print(...next: Line[]) {
    setLines((prev) => [...prev, ...next]);
  }

  function run(raw: string) {
    const input = raw.trim();
    print({ text: `${profile.handle}@portfolio:~$ ${input}` });
    if (!input) return;

    setHistory((h) => [input, ...h]);
    setCursor(-1);

    const [cmd, ...rest] = input.toLowerCase().split(/\s+/);
    const arg = rest.join(" ");

    const openApp = (id: AppId, label = APPS[id].title) => {
      os.open(id);
      print({ text: `Opening ${label}...`, tone: "dim" });
    };

    switch (cmd) {
      case "help":
        print(
          { text: "COMMANDS", tone: "accent" },
          { text: "  help              this list" },
          { text: "  apps              every app on this machine" },
          { text: "  open <app>        open one of them" },
          { text: "  me | work | lab | log | stack | now | proof | contact" },
          { text: "  projects          list published work" },
          { text: "  skills            what I build with" },
          { text: "  github | linkedin | email | resume" },
          { text: "  api               this site serves JSON" },
          { text: "  theme             three of them" },
          { text: "  whoami | neofetch | clear" },
          { text: "" },
          { text: "There are two commands not on this list.", tone: "dim" },
        );
        break;

      case "apps":
      case "ls":
        print(
          ...launchableApps.map((a) => ({
            text: `  ${a.id.padEnd(10)} ${a.hint}`,
          })),
        );
        break;

      case "open": {
        const app = launchableApps.find((a) => a.id === arg || a.label.toLowerCase() === arg);
        if (app) openApp(app.id);
        else print({ text: `open: no app called "${arg}". Try "apps".`, tone: "dim" });
        break;
      }

      case "me":
      case "about":
      case "whoami":
        if (cmd === "whoami") {
          print(
            { text: profile.name, tone: "accent" },
            { text: `${profile.role} · ${profile.location}` },
            { text: profile.tagline, tone: "dim" },
          );
        } else openApp("me");
        break;

      case "work":
      case "projects":
        if (cmd === "projects") {
          print(
            ...publishedProjects.map((p) => ({
              text: `  ${p.index}  ${p.name.padEnd(26)} ${p.status.toUpperCase()}`,
            })),
            { text: `  Run "open work" for the detail.`, tone: "dim" },
          );
        } else openApp("work");
        break;

      case "lab":
      case "log":
      case "stack":
      case "now":
      case "proof":
      case "contact":
      case "notes":
        if (APPS[cmd as AppId].available) openApp(cmd as AppId);
        else print({ text: `${cmd}: nothing in there yet.`, tone: "dim" });
        break;

      case "skills":
        print(
          ...stack.map((g) => ({
            text: `  ${g.label.padEnd(16)} ${g.items.map((i) => i.name).join(", ")}`,
          })),
        );
        break;

      case "github":
        print({ text: contact.github, tone: "accent" });
        window.open(contact.github, "_blank", "noopener");
        break;

      case "linkedin":
        print({ text: contact.linkedin, tone: "accent" });
        window.open(contact.linkedin, "_blank", "noopener");
        break;

      case "email":
        print({ text: contact.email, tone: "accent" });
        window.location.href = `mailto:${contact.email}`;
        break;

      case "resume":
        print({ text: "Downloading resume...", tone: "dim" });
        window.location.href = contact.resume;
        break;

      case "neofetch":
        print(
          { text: `  ${profile.os.name}`, tone: "accent" },
          { text: `  ---------------------------` },
          { text: `  User      ${profile.name}` },
          { text: `  Role      ${profile.role}` },
          { text: `  Host      ${profile.location}` },
          { text: `  Shell     next.js + typescript` },
          { text: `  Uptime    since 2025` },
          { text: `  Status    ${profile.status.state} — ${profile.status.what}` },
        );
        break;

      case "api":
      case "curl":
        print(
          { text: "This portfolio has an API.", tone: "accent" },
          { text: "  GET /api/portfolio              everything as JSON" },
          { text: "  GET /api/portfolio?q=projects   one section" },
          { text: "  sections: projects experience stack buildLog now openQuestions" },
          { text: "" },
          { text: "Opening /api/portfolio...", tone: "dim" },
        );
        window.open("/api/portfolio", "_blank", "noopener");
        break;

      case "theme":
        os.open("settings");
        print({ text: "Opening SETTINGS — three themes in there.", tone: "dim" });
        break;

      case "clear":
        setLines(BANNER);
        break;

      case "sudo":
        if (arg === "hire tharun" || arg === "hire me") {
          print(
            { text: "[sudo] password for recruiter:", tone: "dim" },
            { text: "Nice try.", tone: "accent" },
            { text: "But you still have to tell me what we are building." },
            { text: `→ ${contact.email}`, tone: "ok" },
          );
        } else if (arg.startsWith("rm -rf")) {
          print(
            { text: "rm: cannot remove '/': Permission denied", tone: "dim" },
            { text: "Portfolio survived.", tone: "ok" },
          );
        } else {
          print({ text: `sudo: ${arg || "usage: sudo <command>"}: not permitted`, tone: "dim" });
        }
        break;

      case "exit":
        print({ text: "There is no exit. Close the window.", tone: "dim" });
        break;

      default:
        print({ text: `${cmd}: command not found. Try "help".`, tone: "dim" });
    }
  }

  return (
    <div
      className="min-h-full bg-[#080808] px-5 py-4 font-mono text-[12.5px] leading-[1.7]"
      onClick={() => inputRef.current?.focus()}
    >
      {lines.map((l, i) => (
        <p
          key={i}
          className={`whitespace-pre-wrap break-words ${
            l.tone === "dim"
              ? "text-faint"
              : l.tone === "accent"
                ? "text-accent"
                : l.tone === "ok"
                  ? "text-ok"
                  : "text-ink"
          }`}
        >
          {l.text}
        </p>
      ))}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          run(value);
          setValue("");
        }}
        className="flex items-center gap-2"
      >
        <span className="shrink-0 text-ok">{profile.handle}@portfolio:~$</span>
        <input
          ref={inputRef}
          value={value}
          autoFocus
          spellCheck={false}
          autoComplete="off"
          aria-label="Terminal input"
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            // Handled explicitly rather than relying on implicit form submission,
            // which browsers only apply under conditions that are easy to break.
            if (e.key === "Enter") {
              e.preventDefault();
              run(value);
              setValue("");
              return;
            }
            if (e.key === "ArrowUp") {
              e.preventDefault();
              const next = Math.min(cursor + 1, history.length - 1);
              if (next >= 0) {
                setCursor(next);
                setValue(history[next]);
              }
            }
            if (e.key === "ArrowDown") {
              e.preventDefault();
              const next = cursor - 1;
              setCursor(next);
              setValue(next >= 0 ? history[next] : "");
            }
          }}
          className="min-w-0 flex-1 bg-transparent text-ink caret-accent outline-none focus-visible:outline-none"
        />
      </form>

      <div ref={endRef} />
    </div>
  );
}
