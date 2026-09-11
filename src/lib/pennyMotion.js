import { useEffect, useState } from "react";

/**
 * Shared motion clock for Penny.
 *
 * Every Penny on screen animates from one requestAnimationFrame loop and one
 * pointermove listener, so a page with a dozen mascots costs the same as one.
 * Instances write straight to `style.transform` from the tick, which keeps the
 * motion off React's render path and lets the idle loop stay smooth.
 */

const frameSubscribers = new Set();
let frameId = null;
let lastFrame = 0;

/** Latest pointer position in viewport space, shared by every instance. */
export const pennyPointer = { x: 0, y: 0, movedAt: -Infinity, seen: false };

function handlePointerMove(event) {
  pennyPointer.x = event.clientX;
  pennyPointer.y = event.clientY;
  pennyPointer.movedAt = performance.now() / 1000;
  pennyPointer.seen = true;
}

function runFrame(stamp) {
  const now = stamp / 1000;
  const dt = Math.min(0.05, Math.max(0.001, now - lastFrame));
  lastFrame = now;
  for (const subscriber of frameSubscribers) subscriber(now, dt);
  frameId = requestAnimationFrame(runFrame);
}

export function subscribePennyFrame(tick) {
  if (typeof window === "undefined") return () => {};

  frameSubscribers.add(tick);
  if (frameId === null) {
    lastFrame = performance.now() / 1000;
    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    frameId = requestAnimationFrame(runFrame);
  }

  return () => {
    frameSubscribers.delete(tick);
    if (frameSubscribers.size === 0 && frameId !== null) {
      cancelAnimationFrame(frameId);
      frameId = null;
      window.removeEventListener("pointermove", handlePointerMove);
    }
  };
}

export function makeSpring(value = 0) {
  return { value, velocity: 0 };
}

/**
 * Frame-rate independent spring. Damping is applied as exponential decay so a
 * dropped frame slows the motion down instead of making it explode.
 */
export function stepSpring(spring, target, dt, stiffness, damping) {
  spring.velocity += (target - spring.value) * stiffness * dt;
  spring.velocity *= Math.exp(-damping * dt);
  spring.value += spring.velocity * dt;
  return spring.value;
}

export const clamp = (value, min, max) => (value < min ? min : value > max ? max : value);

export const easeInOut = (p) => (p < 0.5 ? 2 * p * p : 1 - ((2 - 2 * p) ** 2) / 2);

export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(() => {
    if (typeof window === "undefined" || !window.matchMedia) return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return undefined;
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(query.matches);
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  return reduced;
}
