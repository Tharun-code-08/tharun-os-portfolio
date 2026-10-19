"use client";

/**
 * Keyboard state, read every frame by the controller.
 *
 * Not a React context on purpose: the canvas and the DOM overlays both need it,
 * and it changes far too often to live in state. Typing into a field (the
 * terminal, a search box) never moves the character.
 */

const down = new Set<string>();
let pressedJump = false;
let installed = 0;

function isTyping(target: EventTarget | null) {
  const el = target as HTMLElement | null;
  return !!el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable);
}

function onDown(e: KeyboardEvent) {
  if (isTyping(e.target) || e.metaKey || e.ctrlKey) return;
  if (e.code === "Space" && !down.has("Space")) pressedJump = true;
  down.add(e.code);
  // Arrows and space would otherwise scroll the page behind the canvas.
  if (e.code.startsWith("Arrow") || e.code === "Space") e.preventDefault();
}

function onUp(e: KeyboardEvent) {
  down.delete(e.code);
}

function clear() {
  down.clear();
  pressedJump = false;
}

export function installKeys() {
  if (installed++ > 0) return () => uninstall();
  window.addEventListener("keydown", onDown);
  window.addEventListener("keyup", onUp);
  window.addEventListener("blur", clear);
  return () => uninstall();
}

function uninstall() {
  if (--installed > 0) return;
  window.removeEventListener("keydown", onDown);
  window.removeEventListener("keyup", onUp);
  window.removeEventListener("blur", clear);
  clear();
}

export function key(code: string) {
  return down.has(code);
}

/** Movement axis from WASD / arrows: x right, y forward, both -1..1. */
export function moveAxis() {
  const x = (key("KeyD") || key("ArrowRight") ? 1 : 0) - (key("KeyA") || key("ArrowLeft") ? 1 : 0);
  const y = (key("KeyW") || key("ArrowUp") ? 1 : 0) - (key("KeyS") || key("ArrowDown") ? 1 : 0);
  return { x, y };
}

export function runHeld() {
  return key("ShiftLeft") || key("ShiftRight");
}

/** True once per press. */
export function consumeJump() {
  const j = pressedJump;
  pressedJump = false;
  return j;
}

export function queueJump() {
  pressedJump = true;
}

export function clearKeys() {
  clear();
}
