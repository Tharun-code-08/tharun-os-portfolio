"use client";

import { liveSky } from "./sky";

/**
 * Every sound in the game, synthesised with Web Audio. No audio files.
 *
 * The context is created on the first gesture (browsers insist), the music is
 * generative — a slow chord pad, a few plucked notes through an echo, and wind
 * — and every effect is a few oscillators and a noise burst with an envelope.
 */

export type Sfx =
  | "step-grass"
  | "step-wood"
  | "step-stone"
  | "jump"
  | "land"
  | "chime"
  | "collect"
  | "open"
  | "close"
  | "achievement"
  | "boot"
  | "whoosh"
  | "hover"
  | "select"
  | "start";

let ctx: AudioContext | null = null;
let master: GainNode;
let musicBus: GainNode;
let sfxBus: GainNode;
let noise: AudioBuffer;
let echo: DelayNode;
let musicTimer: number | null = null;
let levels = { music: 0.55, sfx: 0.8, muted: false };

function makeNoise(c: AudioContext) {
  const b = c.createBuffer(1, c.sampleRate * 2, c.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return b;
}

export function audioReady() {
  return !!ctx && ctx.state === "running";
}

/** Call from a user gesture. Safe to call repeatedly. */
export function unlockAudio() {
  if (typeof window === "undefined") return;
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain();
    master.connect(ctx.destination);
    musicBus = ctx.createGain();
    sfxBus = ctx.createGain();
    // A gentle master compressor so stacked effects never clip.
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14;
    comp.ratio.value = 3;
    musicBus.connect(comp);
    sfxBus.connect(comp);
    comp.connect(master);
    noise = makeNoise(ctx);

    echo = ctx.createDelay(1.2);
    echo.delayTime.value = 0.42;
    const fb = ctx.createGain();
    fb.gain.value = 0.38;
    const tone = ctx.createBiquadFilter();
    tone.type = "lowpass";
    tone.frequency.value = 2200;
    echo.connect(tone);
    tone.connect(fb);
    fb.connect(echo);
    tone.connect(musicBus);
    applyLevels();
  }
  if (ctx.state === "suspended") void ctx.resume();
  startMusic();
}

export function setLevels(next: { music: number; sfx: number; muted: boolean }) {
  levels = next;
  applyLevels();
}

function applyLevels() {
  if (!ctx) return;
  const t = ctx.currentTime;
  master.gain.setTargetAtTime(levels.muted ? 0 : 1, t, 0.05);
  musicBus.gain.setTargetAtTime(levels.music * 0.5, t, 0.3);
  sfxBus.gain.setTargetAtTime(levels.sfx * 0.9, t, 0.05);
}

/** Stop the generative music entirely — the game is being left. */
export function stopMusic() {
  if (musicTimer !== null) clearInterval(musicTimer);
  musicTimer = null;
  if (ctx) void ctx.suspend();
}

/** Duck the music, e.g. while the OS is on screen. */
export function duckMusic(on: boolean) {
  if (!ctx) return;
  musicBus.gain.setTargetAtTime(on ? levels.music * 0.12 : levels.music * 0.5, ctx.currentTime, 0.4);
}

/* -------------------------------------------------------------- voices -- */

function tone(
  freq: number,
  {
    type = "sine",
    at = 0,
    dur = 0.25,
    gain = 0.2,
    attack = 0.005,
    to,
    bus,
    detune = 0,
  }: {
    type?: OscillatorType;
    at?: number;
    dur?: number;
    gain?: number;
    attack?: number;
    to?: number;
    bus?: AudioNode;
    detune?: number;
  } = {},
) {
  if (!ctx) return;
  const t = ctx.currentTime + at;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  o.detune.value = detune;
  if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(gain, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g);
  g.connect(bus ?? sfxBus);
  o.start(t);
  o.stop(t + dur + 0.05);
}

function hiss({
  at = 0,
  dur = 0.08,
  gain = 0.2,
  freq = 1800,
  q = 0.8,
  to,
  type = "bandpass",
  bus,
}: {
  at?: number;
  dur?: number;
  gain?: number;
  freq?: number;
  q?: number;
  to?: number;
  type?: BiquadFilterType;
  bus?: AudioNode;
} = {}) {
  if (!ctx) return;
  const t = ctx.currentTime + at;
  const s = ctx.createBufferSource();
  s.buffer = noise;
  s.loop = dur > 1;
  s.playbackRate.value = 0.8 + Math.random() * 0.4;
  const f = ctx.createBiquadFilter();
  f.type = type;
  f.frequency.setValueAtTime(freq, t);
  if (to) f.frequency.exponentialRampToValueAtTime(to, t + dur);
  f.Q.value = q;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(gain, t + 0.004);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(f);
  f.connect(g);
  g.connect(bus ?? sfxBus);
  s.start(t, Math.random() * 1.5);
  s.stop(t + dur + 0.05);
}

const N = (semi: number) => 440 * Math.pow(2, (semi - 9) / 12); // semitones from C4 → Hz

export function sfx(name: Sfx) {
  if (!ctx || ctx.state !== "running") return;
  const r = 0.92 + Math.random() * 0.16;
  switch (name) {
    case "step-grass":
      hiss({ dur: 0.07, gain: 0.08, freq: 2400 * r, q: 0.6, type: "highpass" });
      hiss({ dur: 0.05, gain: 0.06, freq: 900 * r, q: 1 });
      break;
    case "step-wood":
      tone(150 * r, { dur: 0.08, gain: 0.16, to: 90 });
      hiss({ dur: 0.04, gain: 0.07, freq: 700 * r, q: 2 });
      break;
    case "step-stone":
      hiss({ dur: 0.035, gain: 0.1, freq: 3200 * r, q: 1.5 });
      tone(240 * r, { dur: 0.05, gain: 0.06, to: 160 });
      break;
    case "jump":
      tone(280 * r, { type: "triangle", dur: 0.16, gain: 0.12, to: 620 * r });
      hiss({ dur: 0.12, gain: 0.04, freq: 1200, to: 3000 });
      break;
    case "land":
      tone(130, { dur: 0.16, gain: 0.22, to: 55 });
      hiss({ dur: 0.1, gain: 0.08, freq: 600, q: 0.7 });
      break;
    case "chime":
      tone(N(24 + [0, 4, 7, 9][Math.floor(Math.random() * 4)]), { dur: 0.9, gain: 0.05, attack: 0.01 });
      break;
    case "collect":
      [0, 4, 7, 12, 16].forEach((s, i) => tone(N(24 + s), { type: "triangle", at: i * 0.055, dur: 0.35, gain: 0.1 }));
      tone(N(48), { at: 0.28, dur: 0.6, gain: 0.03 });
      break;
    case "open":
      tone(520, { type: "triangle", dur: 0.12, gain: 0.08, to: 900 });
      hiss({ dur: 0.18, gain: 0.03, freq: 800, to: 2400 });
      break;
    case "close":
      tone(760, { type: "triangle", dur: 0.12, gain: 0.07, to: 380 });
      break;
    case "select":
      tone(N(19), { type: "square", dur: 0.06, gain: 0.03 });
      tone(N(26), { type: "square", at: 0.05, dur: 0.08, gain: 0.03 });
      break;
    case "hover":
      tone(1900, { type: "sine", dur: 0.03, gain: 0.02 });
      break;
    case "achievement":
      [
        [7, 0],
        [12, 0.11],
        [16, 0.22],
        [19, 0.33],
        [24, 0.5],
      ].forEach(([s, at]) => {
        tone(N(12 + s), { type: "square", at, dur: 0.45, gain: 0.035 });
        tone(N(12 + s), { type: "triangle", at, dur: 0.5, gain: 0.07, detune: 6 });
      });
      tone(N(48), { at: 0.5, dur: 1.4, gain: 0.025 });
      break;
    case "boot":
      tone(60, { dur: 0.5, gain: 0.25, to: 40 });
      hiss({ dur: 0.35, gain: 0.08, freq: 4000, q: 0.5, type: "highpass" });
      tone(9800, { dur: 1.6, gain: 0.012, attack: 0.05 });
      break;
    case "whoosh":
      hiss({ dur: 0.9, gain: 0.12, freq: 300, to: 2600, q: 0.9 });
      break;
    case "start":
      [0, 7, 12, 16, 19].forEach((s, i) => tone(N(12 + s), { type: "triangle", at: i * 0.07, dur: 0.6, gain: 0.07 }));
      hiss({ dur: 1.0, gain: 0.06, freq: 400, to: 3000 });
      break;
  }
}

/* --------------------------------------------------------------- music -- */

// A slow, warm progression: Fmaj9 → Am7 → Dm9 → Cmaj7(add9). Semitones from C4.
const CHORDS = [
  [-7, 0, 4, 9, 12],
  [-3, 0, 4, 7, 11],
  [-10, -3, 0, 4, 9],
  [-12, -5, 4, 7, 14],
];
const PENTA = [0, 2, 4, 7, 9];

function startMusic() {
  if (!ctx || musicTimer !== null) return;
  let bar = 0;
  const playBar = () => {
    if (!ctx) return;
    const chord = CHORDS[bar % CHORDS.length];
    // Pad: two detuned voices per note, slow in, slow out.
    chord.forEach((s) => {
      tone(N(s), { type: "triangle", dur: 8.6, gain: 0.022, attack: 2.2, bus: musicBus, detune: -7 });
      tone(N(s), { type: "sine", dur: 8.6, gain: 0.028, attack: 2.6, bus: musicBus, detune: 7 });
    });
    tone(N(chord[0] - 12), { type: "sine", dur: 8, gain: 0.05, attack: 1.2, bus: musicBus });

    // A few plucked notes into the echo — sparse, never a melody you'd hum.
    const notes = 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < notes; i++) {
      const at = 0.6 + Math.random() * 6.5;
      const s = PENTA[Math.floor(Math.random() * PENTA.length)] + (Math.random() > 0.5 ? 12 : 24);
      tone(N(s), { type: "sine", at, dur: 1.2, gain: 0.05, attack: 0.004, bus: echo });
    }

    // Wind always; crickets after dark.
    hiss({ dur: 8.5, gain: 0.018, freq: 380 + Math.random() * 200, q: 0.4, type: "lowpass", bus: musicBus });
    if (liveSky.night > 0.5) {
      for (let k = 0; k < 6; k++) {
        const at = Math.random() * 7.5;
        for (let c = 0; c < 3; c++) tone(4600 + Math.random() * 300, { at: at + c * 0.06, dur: 0.035, gain: 0.006, bus: musicBus });
      }
    }
    bar++;
  };
  playBar();
  musicTimer = window.setInterval(playBar, 8000);
}
