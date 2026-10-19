"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { profile } from "@/data/profile";
import { sfx } from "@/game/audio";
import { isTouchDevice } from "@/game/quality";
import { ACHIEVEMENTS, EXPLORABLE } from "@/game/quests";
import { runtime } from "@/game/runtime";
import { completion, useGame } from "@/game/store";
import { coastRadius, SMOOTH_PATHS } from "@/game/terrain";
import { COMMITS, INTERACTABLE_BY_ID, TIMELINE_STONES, ZONES } from "@/game/zones";
import { TouchControls } from "./TouchControls";

/* ------------------------------------------------------------ minimap -- */

const MAP_R = 46;

/** Island → minimap coordinates (north up). */
function toMap(x: number, z: number, size: number) {
  return [((x + MAP_R) / (MAP_R * 2)) * size, ((z + MAP_R) / (MAP_R * 2)) * size] as const;
}

export function islandPath(size: number) {
  let d = "";
  for (let i = 0; i <= 96; i++) {
    const th = (i / 96) * Math.PI * 2;
    const r = coastRadius(th);
    const [x, y] = toMap(Math.cos(th) * r, Math.sin(th) * r, size);
    d += `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
  }
  return `${d}Z`;
}

export function pathsD(size: number) {
  return SMOOTH_PATHS.map((line) =>
    line.map(([x, z], i) => {
      const [mx, my] = toMap(x, z, size);
      return `${i === 0 ? "M" : "L"}${mx.toFixed(1)},${my.toFixed(1)}`;
    }).join(""),
  );
}

function Minimap({ onOpen }: { onOpen: () => void }) {
  const SIZE = 148;
  const arrow = useRef<SVGGElement>(null);
  const cone = useRef<SVGPathElement>(null);
  const visited = useGame((s) => s.visited);
  const island = useMemo(() => islandPath(SIZE), []);
  const paths = useMemo(() => pathsD(SIZE), []);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const p = runtime.player.position;
      const [x, y] = toMap(p.x, p.z, SIZE);
      // facing 0 = +z = down on the map.
      const deg = 180 - (runtime.player.facing * 180) / Math.PI;
      arrow.current?.setAttribute("transform", `translate(${x} ${y}) rotate(${deg})`);
      const camDeg = 180 - (runtime.camera.yaw * 180) / Math.PI + 180;
      cone.current?.setAttribute("transform", `translate(${x} ${y}) rotate(${camDeg})`);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <button
      type="button"
      onClick={onOpen}
      title="Map (M)"
      className="hud-glass group relative block overflow-hidden rounded-full p-0 transition-transform hover:scale-[1.03]"
      style={{ width: SIZE, height: SIZE }}
    >
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="h-full w-full">
        <defs>
          <radialGradient id="mm-sea" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#1b2147" />
            <stop offset="100%" stopColor="#0a0c1c" />
          </radialGradient>
        </defs>
        <rect width={SIZE} height={SIZE} fill="url(#mm-sea)" />
        <path d={island} fill="#5f8f45" stroke="#e2c48c" strokeWidth={2} />
        {paths.map((d, i) => (
          <path key={i} d={d} fill="none" stroke="#cfa774" strokeWidth={1.6} strokeLinecap="round" opacity={0.9} />
        ))}
        {ZONES.filter((z) => z.radius > 0).map((z) => {
          const [x, y] = toMap(z.center[0], z.center[1], SIZE);
          const seen = visited.includes(z.id);
          return (
            <g key={z.id} transform={`translate(${x} ${y})`}>
              <circle r={6} fill={seen ? z.color : "#1d1d27"} stroke={z.color} strokeWidth={1.2} />
              <text y={2.6} textAnchor="middle" fontSize={7} fill={seen ? "#0b0b12" : z.color}>
                {z.glyph}
              </text>
            </g>
          );
        })}
        <path ref={cone} d="M0,0 L-9,-22 A24,24 0 0 1 9,-22 Z" fill="#ffffff" opacity={0.12} />
        <g ref={arrow}>
          <circle r={5.5} fill="#ffb020" opacity={0.25} />
          <path d="M0,-5 L3.6,3.6 L0,1.8 L-3.6,3.6 Z" fill="#fff7e8" stroke="#0b0b12" strokeWidth={0.6} />
        </g>
      </svg>
      <span className="pointer-events-none absolute inset-x-0 bottom-2 text-center font-mono text-[8px] tracking-[0.24em] text-white/60">
        N ↑ · M
      </span>
    </button>
  );
}

/* ------------------------------------------------------------- tracker -- */

function Tracker() {
  const s = useGame();
  const objectives = [
    { id: "explorer", text: "Visit every place", n: EXPLORABLE.filter((z) => s.visited.includes(z)).length, of: EXPLORABLE.length },
    { id: "reader", text: "Open a case file in the workshop", n: s.achievements.includes("reader") ? 1 : 0, of: 1 },
    { id: "root", text: "Boot the computer in the studio", n: s.achievements.includes("root") ? 1 : 0, of: 1 },
    { id: "historian", text: "Light every stone on the road", n: s.stonesLit.length, of: TIMELINE_STONES.length },
    { id: "collector", text: "Find the floating commits", n: s.collected.length, of: COMMITS.length },
    { id: "signal", text: "Use the radio at the tower", n: s.achievements.includes("signal") ? 1 : 0, of: 1 },
  ];
  const open = objectives.filter((o) => o.n < o.of).slice(0, 3);
  if (open.length === 0) return null;

  return (
    <div className="hud-glass w-[15.5rem] rounded-xl px-3.5 py-3">
      <p className="mb-2 flex items-center justify-between font-mono text-[9px] tracking-[0.24em] text-[#ffb020]">
        OBJECTIVES <span className="text-white/40">J</span>
      </p>
      <ul className="flex flex-col gap-2">
        {open.map((o) => (
          <li key={o.id} className="text-[11.5px] leading-snug text-white/85">
            <div className="flex items-start justify-between gap-2">
              <span>{o.text}</span>
              {o.of > 1 ? (
                <span className="shrink-0 font-mono text-[10px] text-white/50 tabular-nums">
                  {o.n}/{o.of}
                </span>
              ) : null}
            </div>
            {o.of > 1 ? (
              <span className="mt-1 block h-[3px] overflow-hidden rounded-full bg-white/10">
                <span className="block h-full rounded-full bg-[#ffb020] transition-[width] duration-500" style={{ width: `${(o.n / o.of) * 100}%` }} />
              </span>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* -------------------------------------------------------------- prompt -- */

function Prompt({ onInteract, touch }: { onInteract: () => void; touch: boolean }) {
  const focus = useGame((s) => s.focus);
  const it = focus ? INTERACTABLE_BY_ID[focus] : null;
  const zone = it ? ZONES.find((z) => z.id === it.zone) : null;
  const last = useRef<string | null>(null);

  useEffect(() => {
    if (focus && focus !== last.current) sfx("hover");
    last.current = focus;
  }, [focus]);

  if (!it) return null;
  return (
    <button
      key={it.id}
      type="button"
      onClick={onInteract}
      className="animate-prompt-in hud-glass absolute bottom-24 left-1/2 flex items-center gap-3 rounded-full py-2 pr-5 pl-2 sm:bottom-10"
    >
      <span
        className="grid h-9 w-9 place-items-center rounded-full font-mono text-[13px] font-bold text-[#0b0b12]"
        style={{ background: zone?.color ?? "#ffb020" }}
      >
        {touch ? "A" : "E"}
      </span>
      <span className="text-left">
        <span className="block font-mono text-[9px] tracking-[0.22em] text-white/50 uppercase">{it.label}</span>
        <span className="block text-[14px] font-medium text-white">{it.verb}</span>
      </span>
    </button>
  );
}

/* -------------------------------------------------------------- banner -- */

function Banner() {
  const banner = useGame((s) => s.banner);
  if (!banner) return null;
  // Keyed on its timestamp, so each new place replays the animation, which
  // fades itself out — nothing needs to unmount it.
  return (
    <div key={banner.at} className="pointer-events-none absolute inset-x-0 top-[18%] flex flex-col items-center text-center">
      <span className="animate-rule-grow mb-3 block h-px w-56" style={{ background: banner.color }} />
      <p className="animate-banner font-display text-[clamp(1.6rem,4vw,2.8rem)] font-bold text-white drop-shadow-[0_4px_20px_rgba(0,0,0,0.6)]">
        {banner.title.toUpperCase()}
      </p>
      <p className="animate-banner mt-1 font-mono text-[11px] tracking-[0.3em] uppercase" style={{ color: banner.color }}>
        {banner.tag}
      </p>
      <span className="animate-rule-grow mt-3 block h-px w-56" style={{ background: banner.color }} />
    </div>
  );
}

/* ------------------------------------------------------------ controls -- */

function ControlsHint() {
  const [show, setShow] = useState(true);
  useEffect(() => {
    const t = window.setTimeout(() => setShow(false), 14_000);
    return () => clearTimeout(t);
  }, []);
  if (!show) return null;
  return (
    <div className="animate-fade-up hud-glass absolute bottom-5 left-5 hidden rounded-xl px-4 py-3 font-mono text-[9.5px] tracking-[0.14em] text-white/70 sm:block">
      <p className="mb-2 text-[#ffb020]">CONTROLS</p>
      <div className="grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-1.5">
        <span>
          <span className="keycap">W</span>
          <span className="keycap">A</span>
          <span className="keycap">S</span>
          <span className="keycap">D</span>
        </span>
        <span>MOVE · OR CLICK THE GROUND</span>
        <span className="keycap">⇧ SHIFT</span>
        <span>RUN</span>
        <span className="keycap">SPACE</span>
        <span>JUMP</span>
        <span className="keycap">DRAG</span>
        <span>LOOK AROUND · WHEEL ZOOMS</span>
      </div>
    </div>
  );
}

/* --------------------------------------------------------------- frame -- */

function Fps() {
  const show = useGame((s) => s.settings.showFps);
  const el = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!show) return;
    let raf = 0;
    let frames = 0;
    let last = performance.now();
    const tick = (t: number) => {
      frames++;
      if (t - last > 500) {
        runtime.fps = Math.round((frames * 1000) / (t - last));
        if (el.current) el.current.textContent = `${runtime.fps} FPS`;
        frames = 0;
        last = t;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [show]);
  if (!show) return null;
  return <span ref={el} className="font-mono text-[10px] text-[#57d18a]" />;
}

export function HUD({ onInteract }: { onInteract: () => void }) {
  const panelOpen = useGame((s) => s.panelOpen);
  const overlay = useGame((s) => s.overlay);
  const achievements = useGame((s) => s.achievements);
  const muted = useGame((s) => s.settings.muted);
  const set = useGame((s) => s.setOverlay);
  const setSettings = useGame((s) => s.setSettings);
  const setRecruiter = useGame((s) => s.setRecruiter);
  const touch = useMemo(() => isTouchDevice(), []);
  const { done, total } = completion(achievements);
  const secrets = ACHIEVEMENTS.filter((a) => a.secret && achievements.includes(a.id)).length;

  const hidden = panelOpen || !!overlay;

  return (
    <div className={`pointer-events-none absolute inset-0 z-20 transition-opacity duration-300 ${hidden ? "opacity-0" : "opacity-100"}`}>
      {/* Player plate */}
      <div className="pointer-events-auto absolute top-4 left-4 flex items-center gap-3">
        <div className="hud-glass flex items-center gap-3 rounded-2xl py-2 pr-4 pl-2">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-[#3a3a44] to-[#16161b] font-display text-[13px] font-bold text-[#ffb020] shadow-inner ring-1 ring-[#ffb020]/30">
            TG
          </span>
          <span>
            <span className="block font-display text-[13px] font-semibold tracking-[-0.01em] text-white">
              {profile.shortName.toUpperCase()}
            </span>
            <span className="block font-mono text-[9px] tracking-[0.18em] text-white/50">
              {profile.role.toUpperCase()}
            </span>
            <span className="mt-1 flex items-center gap-2">
              <span className="block h-[4px] w-24 overflow-hidden rounded-full bg-white/10">
                <span className="block h-full rounded-full bg-gradient-to-r from-[#ffb020] to-[#ff7a45] transition-[width] duration-700" style={{ width: `${(done / total) * 100}%` }} />
              </span>
              <span className="font-mono text-[9px] text-white/60 tabular-nums">
                {Math.round((done / total) * 100)}%{secrets ? ` +${secrets}` : ""}
              </span>
            </span>
          </span>
        </div>
        <Fps />
      </div>

      {/* Buttons */}
      <div className="pointer-events-auto absolute top-4 right-4 flex flex-col items-end gap-3">
        <div className="flex items-center gap-2">
          <HudButton label="Recruiter" k="R" onClick={() => setRecruiter(true)} accent />
          <HudButton label="Quests" k="J" onClick={() => set("quests")} className="hidden sm:flex" />
          <HudButton
            label={muted ? "Sound off" : "Sound on"}
            k={muted ? "♪̸" : "♪"}
            onClick={() => setSettings({ muted: !muted })}
          />
          <HudButton label="Menu" k="Esc" onClick={() => set("pause")} />
        </div>
        <div className="hidden sm:block">
          <Minimap onOpen={() => set("map")} />
        </div>
        <div className="hidden md:block">
          <Tracker />
        </div>
      </div>

      <div className="pointer-events-auto">
        <Prompt onInteract={onInteract} touch={touch} />
      </div>
      <Banner />
      {!touch ? <ControlsHint /> : null}
      {touch ? <TouchControls onInteract={onInteract} /> : null}
    </div>
  );
}

function HudButton({
  label,
  k,
  onClick,
  accent,
  className = "",
}: {
  label: string;
  k: string;
  onClick: () => void;
  accent?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => {
        sfx("select");
        onClick();
      }}
      title={label}
      className={`hud-glass flex items-center gap-2 rounded-full px-3 py-1.5 font-mono text-[9.5px] tracking-[0.16em] transition-colors ${
        accent ? "text-[#ffb020] hover:bg-[#ffb020] hover:text-[#0b0b12]" : "text-white/75 hover:text-white"
      } ${className}`}
    >
      <span className="keycap !text-[9px]">{k}</span>
      <span className="hidden uppercase lg:inline">{label}</span>
    </button>
  );
}
