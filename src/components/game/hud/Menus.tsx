"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { contact, profile } from "@/data/profile";
import { sfx } from "@/game/audio";
import { switchExperience } from "@/game/experience";
import { ACHIEVEMENTS } from "@/game/quests";
import { runtime } from "@/game/runtime";
import { completion, useGame, type Settings } from "@/game/store";
import { COMMITS, TIMELINE_STONES, TRAVEL, ZONES, type ZoneId } from "@/game/zones";
import { islandPath, pathsD } from "./HUD";

function Shell({ title, kicker, onClose, children, wide }: { title: string; kicker: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 cursor-default bg-[#05060c]/60 backdrop-blur-[6px]" />
      <section
        className={`animate-toast-in hud-glass relative flex max-h-full w-full flex-col overflow-hidden rounded-2xl ${wide ? "max-w-4xl" : "max-w-xl"}`}
      >
        <header className="flex items-start justify-between gap-4 border-b border-white/10 px-6 pt-5 pb-4">
          <div>
            <p className="font-mono text-[9.5px] tracking-[0.3em] text-[#ffb020]">{kicker}</p>
            <h2 className="mt-1 font-display text-[22px] font-bold tracking-[-0.02em] text-white">{title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="mt-1 flex items-center gap-2 font-mono text-[9.5px] tracking-[0.16em] text-white/60 hover:text-white"
          >
            <span className="keycap !text-[8px]">ESC</span> CLOSE
          </button>
        </header>
        <div className="scrollbar-thin min-h-0 overflow-y-auto px-6 py-5">{children}</div>
      </section>
    </div>
  );
}

/* --------------------------------------------------------------- pause -- */

function Pause({ onClose }: { onClose: () => void }) {
  const g = useGame();
  const { done, total } = completion(g.achievements);
  const items: { label: string; hint: string; run: () => void; tone?: "accent" }[] = [
    { label: "Resume", hint: "Esc", run: onClose },
    { label: "Map", hint: "M · fast travel", run: () => g.setOverlay("map") },
    { label: "Quests", hint: "J · achievements", run: () => g.setOverlay("quests") },
    { label: "Settings", hint: "Sound, quality, light", run: () => g.setOverlay("settings") },
    {
      label: "Boot THARUN OS",
      hint: "The desktop, inside the game",
      run: () => {
        g.setOverlay(null);
        sfx("whoosh");
        g.setMode("os-enter");
      },
    },
    { label: "Recruiter mode", hint: "R · one page", run: () => g.setRecruiter(true), tone: "accent" },
    { label: "Title screen", hint: "Back to the start", run: () => { g.setOverlay(null); g.setMode("title"); } },
  ];
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        sfx("hover");
        setIndex((i) => (i + 1) % items.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        sfx("hover");
        setIndex((i) => (i - 1 + items.length) % items.length);
      } else if (e.key === "Enter") {
        e.preventDefault();
        sfx("select");
        items[index].run();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <Shell title="Paused" kicker={profile.os.name} onClose={onClose}>
      <div className="grid gap-6 sm:grid-cols-[1fr_12rem]">
        <nav className="flex flex-col gap-1.5">
          {items.map((it, i) => (
            <button
              key={it.label}
              type="button"
              onMouseEnter={() => {
                if (i !== index) sfx("hover");
                setIndex(i);
              }}
              onClick={() => {
                sfx("select");
                it.run();
              }}
              className={`flex items-center justify-between rounded-lg border px-4 py-2.5 text-left transition-all ${
                i === index ? "translate-x-1 border-[#ffb020]/60 bg-[#ffb020]/12 text-white" : "border-white/8 bg-white/[0.03] text-white/75"
              }`}
            >
              <span className={`font-display text-[14px] font-semibold ${it.tone === "accent" ? "text-[#ffb020]" : ""}`}>{it.label}</span>
              <span className="font-mono text-[9px] tracking-[0.12em] text-white/45 uppercase">{it.hint}</span>
            </button>
          ))}
        </nav>
        <aside className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <p className="font-mono text-[9px] tracking-[0.24em] text-white/50">COMPLETION</p>
          <p className="mt-1 font-display text-[34px] font-bold text-white">
            {Math.round((done / total) * 100)}
            <span className="text-[16px] text-white/50">%</span>
          </p>
          <ul className="mt-3 space-y-1.5 font-mono text-[10px] text-white/70">
            <li className="flex justify-between">
              <span>Places</span>
              <span>
                {g.visited.length}/{ZONES.length}
              </span>
            </li>
            <li className="flex justify-between">
              <span>Stones lit</span>
              <span>
                {g.stonesLit.length}/{TIMELINE_STONES.length}
              </span>
            </li>
            <li className="flex justify-between">
              <span>Commits</span>
              <span>
                {g.collected.length}/{COMMITS.length}
              </span>
            </li>
            <li className="flex justify-between">
              <span>Achievements</span>
              <span>
                {g.achievements.length}/{ACHIEVEMENTS.length}
              </span>
            </li>
          </ul>
        </aside>
      </div>
    </Shell>
  );
}

/* ------------------------------------------------------------ settings -- */

function Choice<T extends string>({ value, options, onChange }: { value: T; options: { id: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => {
            sfx("select");
            onChange(o.id);
          }}
          className={`rounded-md border px-3 py-1.5 font-mono text-[10px] tracking-[0.12em] uppercase transition-colors ${
            value === o.id ? "border-[#ffb020] bg-[#ffb020] text-[#0b0b12]" : "border-white/12 text-white/70 hover:text-white"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Row({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="grid gap-2 border-b border-white/6 py-3.5 last:border-0 sm:grid-cols-[11rem_1fr] sm:items-center">
      <div>
        <p className="text-[13px] font-medium text-white">{label}</p>
        {hint ? <p className="text-[11px] text-white/45">{hint}</p> : null}
      </div>
      <div>{children}</div>
    </div>
  );
}

function SettingsPanel({ onClose }: { onClose: () => void }) {
  const s = useGame((st) => st.settings);
  const auto = useGame((st) => st.autoQuality);
  const set = useGame((st) => st.setSettings);
  const reset = useGame((st) => st.resetProgress);
  const patch = (p: Partial<Settings>) => set(p);
  const [confirm, setConfirm] = useState(false);

  return (
    <Shell title="Settings" kicker="OPTIONS" onClose={onClose}>
      <Row label="Graphics" hint={s.quality === "auto" ? `Auto picked ${auto}` : "Fixed"}>
        <Choice
          value={s.quality}
          onChange={(quality) => patch({ quality })}
          options={[
            { id: "auto", label: "Auto" },
            { id: "low", label: "Low" },
            { id: "medium", label: "Medium" },
            { id: "high", label: "High" },
          ]}
        />
      </Row>
      <Row label="Time of day" hint="Auto follows your clock">
        <Choice
          value={s.timeOfDay}
          onChange={(timeOfDay) => patch({ timeOfDay })}
          options={[
            { id: "auto", label: "Auto" },
            { id: "dawn", label: "Dawn" },
            { id: "day", label: "Day" },
            { id: "dusk", label: "Dusk" },
            { id: "night", label: "Night" },
          ]}
        />
      </Row>
      <Row label="Music">
        <input type="range" min={0} max={1} step={0.05} value={s.music} onChange={(e) => patch({ music: Number(e.target.value) })} className="game-range w-full" />
      </Row>
      <Row label="Effects">
        <input type="range" min={0} max={1} step={0.05} value={s.sfx} onChange={(e) => patch({ sfx: Number(e.target.value) })} className="game-range w-full" />
      </Row>
      <Row label="Sound">
        <Choice value={s.muted ? "off" : "on"} onChange={(v) => patch({ muted: v === "off" })} options={[{ id: "on", label: "On" }, { id: "off", label: "Muted" }]} />
      </Row>
      <Row label="FPS counter">
        <Choice value={s.showFps ? "on" : "off"} onChange={(v) => patch({ showFps: v === "on" })} options={[{ id: "off", label: "Off" }, { id: "on", label: "On" }]} />
      </Row>
      <Row label="Progress" hint="Places, stones, commits, achievements">
        {confirm ? (
          <span className="flex items-center gap-2">
            <button type="button" onClick={() => { reset(); setConfirm(false); sfx("close"); }} className="rounded-md bg-[#ff5a5a] px-3 py-1.5 font-mono text-[10px] tracking-[0.12em] text-white">
              YES, RESET
            </button>
            <button type="button" onClick={() => setConfirm(false)} className="font-mono text-[10px] tracking-[0.12em] text-white/60">
              CANCEL
            </button>
          </span>
        ) : (
          <button type="button" onClick={() => setConfirm(true)} className="rounded-md border border-white/12 px-3 py-1.5 font-mono text-[10px] tracking-[0.12em] text-white/70 hover:text-white">
            RESET PROGRESS
          </button>
        )}
      </Row>
      <Row label="Classic OS" hint="The desktop portfolio, no game">
        <button type="button" onClick={() => switchExperience("classic")} className="font-mono text-[10px] tracking-[0.12em] text-[#ffb020] hover:underline">
          OPEN THARUN OS →
        </button>
      </Row>
    </Shell>
  );
}

/* -------------------------------------------------------------- quests -- */

function Quests({ onClose }: { onClose: () => void }) {
  const g = useGame();
  return (
    <Shell title="Quest log" kicker="ACHIEVEMENTS" onClose={onClose} wide>
      <div className="grid gap-6 md:grid-cols-2">
        <ul className="flex flex-col gap-2">
          {ACHIEVEMENTS.map((a) => {
            const got = g.achievements.includes(a.id);
            const hide = a.secret && !got;
            return (
              <li key={a.id} className={`flex items-start gap-3 rounded-xl border p-3 ${got ? "border-[#ffb020]/40 bg-[#ffb020]/8" : "border-white/8 bg-white/[0.02]"}`}>
                <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg text-[16px] ${got ? "bg-[#ffb020] text-[#0b0b12]" : "bg-white/5 text-white/30"}`}>
                  {got ? "★" : hide ? "?" : "☆"}
                </span>
                <span>
                  <span className={`block font-display text-[13.5px] font-semibold ${got ? "text-white" : "text-white/70"}`}>{hide ? "Secret" : a.title}</span>
                  <span className="block text-[11.5px] text-white/50">{hide ? "Keep exploring." : a.detail}</span>
                </span>
              </li>
            );
          })}
        </ul>
        <div>
          <p className="mb-2 font-mono text-[9.5px] tracking-[0.24em] text-white/50">FLOATING COMMITS</p>
          <ul className="flex flex-col gap-1.5">
            {COMMITS.map((c) => {
              const got = g.collected.includes(c.id);
              return (
                <li key={c.id} className="flex items-start gap-3 rounded-lg border border-white/8 bg-white/[0.02] px-3 py-2">
                  <span className={`mt-0.5 font-mono text-[10px] ${got ? "text-[#ffb020]" : "text-white/30"}`}>{got ? c.hash : "•••••••"}</span>
                  <span className="text-[11.5px] text-white/70">{got ? c.entry.title : `Hint: ${c.hint.toLowerCase()}`}</span>
                </li>
              );
            })}
          </ul>
          <p className="mt-5 mb-2 font-mono text-[9.5px] tracking-[0.24em] text-white/50">THE LONG ROAD</p>
          <div className="flex flex-wrap gap-1.5">
            {TIMELINE_STONES.map((s) => (
              <span
                key={s.index}
                title={s.entry.title}
                className={`h-3 w-3 rotate-45 rounded-[2px] ${g.stonesLit.includes(s.index) ? "bg-[#ffb020] shadow-[0_0_8px_#ffb020]" : "bg-white/10"}`}
              />
            ))}
          </div>
        </div>
      </div>
    </Shell>
  );
}

/* ----------------------------------------------------------------- map -- */

function MapOverlay({ onClose, onTravel }: { onClose: () => void; onTravel: (x: number, z: number) => void }) {
  const SIZE = 520;
  const R = 46;
  const visited = useGame((s) => s.visited);
  const collected = useGame((s) => s.collected);
  const island = useMemo(() => islandPath(SIZE), []);
  const paths = useMemo(() => pathsD(SIZE), []);
  const toMap = (x: number, z: number) => [((x + R) / (R * 2)) * SIZE, ((z + R) / (R * 2)) * SIZE] as const;
  const me = useRef<SVGGElement>(null);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const p = runtime.player.position;
      const [x, y] = [((p.x + R) / (R * 2)) * SIZE, ((p.z + R) / (R * 2)) * SIZE];
      me.current?.setAttribute("transform", `translate(${x} ${y}) rotate(${180 - (runtime.player.facing * 180) / Math.PI})`);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const go = (id: ZoneId) => {
    const [x, z] = TRAVEL[id];
    sfx("whoosh");
    onClose();
    onTravel(x, z);
  };

  return (
    <Shell title="The island" kicker="MAP · CLICK A PLACE TO TRAVEL" onClose={onClose} wide>
      <div className="grid gap-6 md:grid-cols-[1fr_15rem]">
        <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="mx-auto aspect-square w-full max-w-[520px]">
          <defs>
            <radialGradient id="map-sea" cx="50%" cy="50%" r="55%">
              <stop offset="0%" stopColor="#24305e" />
              <stop offset="100%" stopColor="#0a0c1c" />
            </radialGradient>
          </defs>
          <rect width={SIZE} height={SIZE} rx={24} fill="url(#map-sea)" />
          <path d={island} fill="#5f8f45" stroke="#e2c48c" strokeWidth={5} />
          {paths.map((d, i) => (
            <path key={i} d={d} fill="none" stroke="#cfa774" strokeWidth={5} strokeLinecap="round" />
          ))}
          {TIMELINE_STONES.map((s) => {
            const [x, y] = toMap(s.x, s.z);
            return <rect key={s.index} x={x - 3} y={y - 3} width={6} height={6} transform={`rotate(45 ${x} ${y})`} fill="#ffd27a" opacity={0.8} />;
          })}
          {COMMITS.filter((c) => collected.includes(c.id)).map((c) => {
            const [x, y] = toMap(c.x, c.z);
            return <circle key={c.id} cx={x} cy={y} r={5} fill="#ffb020" stroke="#fff3d6" strokeWidth={1.5} />;
          })}
          {ZONES.map((z) => {
            const [x, y] = z.id === "timeline" ? toMap(...TRAVEL.timeline) : toMap(z.center[0], z.center[1]);
            const seen = visited.includes(z.id);
            return (
              <g key={z.id} transform={`translate(${x} ${y})`} className="cursor-pointer" onClick={() => go(z.id)}>
                <circle r={22} fill="transparent" />
                <circle r={15} fill={seen ? z.color : "#141624"} stroke={z.color} strokeWidth={2.5} />
                <text y={5.5} textAnchor="middle" fontSize={15} fill={seen ? "#0b0b12" : z.color}>
                  {z.glyph}
                </text>
                <text y={34} textAnchor="middle" fontSize={11.5} fontFamily="var(--font-mono-stack), monospace" letterSpacing={1.5} fill="#f6efe2">
                  {z.name.toUpperCase()}
                </text>
              </g>
            );
          })}
          <g ref={me}>
            <circle r={11} fill="#ffb020" opacity={0.25} />
            <path d="M0,-9 L6.5,6.5 L0,3 L-6.5,6.5 Z" fill="#fff7e8" stroke="#0b0b12" strokeWidth={1} />
          </g>
          <text x={SIZE - 26} y={36} textAnchor="middle" fontSize={14} fill="#f6efe2" fontFamily="var(--font-mono-stack), monospace">
            N
          </text>
          <path d={`M${SIZE - 26},44 L${SIZE - 26},64`} stroke="#f6efe2" strokeWidth={2} />
        </svg>
        <ul className="flex flex-col gap-1.5">
          {ZONES.map((z) => (
            <li key={z.id}>
              <button
                type="button"
                onMouseEnter={() => sfx("hover")}
                onClick={() => go(z.id)}
                className="flex w-full items-center gap-3 rounded-lg border border-white/8 bg-white/[0.03] px-3 py-2 text-left transition-colors hover:border-white/25"
              >
                <span className="grid h-7 w-7 place-items-center rounded-md text-[13px]" style={{ background: visited.includes(z.id) ? z.color : "transparent", color: visited.includes(z.id) ? "#0b0b12" : z.color, border: `1px solid ${z.color}` }}>
                  {z.glyph}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[12.5px] font-medium text-white">{z.name}</span>
                  <span className="block truncate text-[10.5px] text-white/45">{z.tag}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </Shell>
  );
}

/* -------------------------------------------------------------- finale -- */

function Finale({ onClose }: { onClose: () => void }) {
  const canvas = useRef<HTMLCanvasElement>(null);

  // Fireworks: a few bursts of particles with gravity and fade.
  useEffect(() => {
    const c = canvas.current;
    const ctx = c?.getContext("2d");
    if (!c || !ctx) return;
    c.width = window.innerWidth;
    c.height = window.innerHeight;
    const parts: { x: number; y: number; vx: number; vy: number; life: number; color: string }[] = [];
    const colors = ["#ffb020", "#ff7a45", "#ff4fd8", "#6aa6ff", "#57d18a", "#fff3d6"];
    let raf = 0;
    let t = 0;
    const burst = () => {
      const x = c.width * (0.2 + Math.random() * 0.6);
      const y = c.height * (0.15 + Math.random() * 0.35);
      const color = colors[Math.floor(Math.random() * colors.length)];
      for (let i = 0; i < 70; i++) {
        const a = (i / 70) * Math.PI * 2;
        const s = 2 + Math.random() * 3.5;
        parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 1, color });
      }
      sfx("chime");
    };
    const tick = () => {
      t++;
      if (t % 38 === 1 && t < 600) burst();
      ctx.globalCompositeOperation = "destination-out";
      ctx.fillStyle = "rgba(0,0,0,0.2)";
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.globalCompositeOperation = "lighter";
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.05;
        p.vx *= 0.985;
        p.life -= 0.012;
        if (p.life <= 0) {
          parts.splice(i, 1);
          continue;
        }
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2.2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4">
      <canvas ref={canvas} className="pointer-events-none absolute inset-0" />
      <div className="absolute inset-0 bg-[#05060c]/45" />
      <section className="animate-toast-in hud-glass relative max-w-lg rounded-3xl px-8 py-8 text-center">
        <p className="font-mono text-[10px] tracking-[0.34em] text-[#ffb020]">100% COMPLETE</p>
        <h2 className="title-logo mt-3 font-display text-[clamp(2rem,6vw,3.2rem)] leading-none font-extrabold">Thanks for playing.</h2>
        <p className="mx-auto mt-4 max-w-sm text-[14px] leading-relaxed text-white/75">
          You walked the whole road, found every commit and read the case files. That&apos;s more than most interviews
          get through. If you&apos;re building something, I&apos;d like to hear about it.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <a href={`mailto:${contact.email}`} className="rounded-full bg-[#ffb020] px-5 py-2.5 font-mono text-[11px] tracking-[0.14em] text-[#0b0b12] hover:brightness-110">
            EMAIL ME
          </a>
          <a href={contact.resume} className="rounded-full border border-white/20 px-5 py-2.5 font-mono text-[11px] tracking-[0.14em] text-white hover:border-white/50">
            RÉSUMÉ
          </a>
          <button type="button" onClick={onClose} className="rounded-full px-5 py-2.5 font-mono text-[11px] tracking-[0.14em] text-white/60 hover:text-white">
            KEEP EXPLORING
          </button>
        </div>
      </section>
    </div>
  );
}

export function Menus({ onTravel }: { onTravel: (x: number, z: number) => void }) {
  const overlay = useGame((s) => s.overlay);
  const mode = useGame((s) => s.mode);
  const setOverlay = useGame((s) => s.setOverlay);
  const back = () => {
    sfx("close");
    setOverlay(mode === "play" && overlay !== "pause" && overlay !== "finale" ? "pause" : null);
  };
  const close = () => {
    sfx("close");
    setOverlay(null);
  };

  if (overlay === "pause") return <Pause onClose={close} />;
  if (overlay === "settings") return <SettingsPanel onClose={mode === "title" ? close : back} />;
  if (overlay === "quests") return <Quests onClose={close} />;
  if (overlay === "map") return <MapOverlay onClose={close} onTravel={onTravel} />;
  if (overlay === "finale") return <Finale onClose={close} />;
  return null;
}
