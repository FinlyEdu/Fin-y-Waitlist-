import React, { useEffect, useRef } from "react";
import pennyArt from "@/assets/penny.png";
import {
  clamp,
  easeInOut,
  makeSpring,
  pennyPointer,
  stepSpring,
  subscribePennyFrame,
  usePrefersReducedMotion,
} from "@/lib/pennyMotion";

/**
 * LivePenny — the mascot with an eye that actually works.
 *
 * The section copy promises "move your cursor, she's watching", but the eye is
 * painted into penny.png, so leaning the whole sprite was the closest the old
 * version could get. Here the monocle is redrawn as an SVG layer on top of the
 * artwork, which is what lets her blink and track the pointer with her eye
 * rather than her body.
 *
 * penny.png is the main app's faceted artwork re-exported at 320px, so the
 * monocle lands at the same normalised position. The geometry below is in the
 * 1254px space it was measured in and scales onto whatever box the image
 * occupies — centre 558.5,592.9; ring 194.8-210.7; sclera 173; pupil 98.5.
 *
 * Body and eye sit inside one transformed wrapper, so a lean can never slide
 * the monocle off the gem.
 */

const ART = 1254;
const EYE = {
  cx: 558.5,
  cy: 592.9,
  ring: 211.6, // a hair over the painted 210.7, to hide its antialiased edge
  glass: 195.5,
  sclera: 173,
  pupil: 98.5,
};
const GAZE_X = 54; // how far the pupil slides before it crowds the sclera edge
const GAZE_Y = 46;

/**
 * The open lid has to clear the glass completely.
 *
 * The lid's edge curves *downward* 17 units at its centre, so parking it at
 * the glass radius left that curve poking into the top of the eye — a dark
 * stroked arc, dipping in the middle, which reads as a furrowed brow. Solving
 * the edge against the r=194.5 clip circle, it stayed inside for |x| < 72.
 * 226 puts the whole curve, stroke included, clear of the glass.
 */
const LID_OPEN = 226;
const LID_TRAVEL = 258; // closed lids still overlap by ~60 units
/** Bottom lid resting a third closed is what makes an eye read as smiling. */
const LOWER_REST = 0.34;
/** A gaze sitting slightly high reads as eager; level or low reads flat. */
const EAGER_LIFT = 0.1;
const BLINK_DURATION = 0.24;
const TAU = Math.PI * 2;

let instanceCount = 0;

export default function LivePenny({
  className = "",
  imgClassName = "",
  alt = "",
  decorative = false,
  /** How hard the body leans toward the pointer. 0 keeps her still. */
  lean = 1,
  /** Hop height in px. */
  bob = 9,
  /** Seconds between landings. Lower is more excited. */
  hopPeriod = 1.55,
  /** Only follow the pointer while it is inside this element. */
  trackRef = null,
  /** Second eye shine and the glint sweep — worth it above ~120px. */
  detail = true,
}) {
  const reducedMotion = usePrefersReducedMotion();
  const uid = useRef(`lp-${(instanceCount += 1)}`).current;

  const rootRef = useRef(null);
  const bodyRef = useRef(null);
  const irisRef = useRef(null);
  const upperLidRef = useRef(null);
  const lowerLidRef = useRef(null);
  const glintRef = useRef(null);

  const stateRef = useRef(null);
  if (!stateRef.current) {
    stateRef.current = {
      seed: Math.random() * 100,
      gazeX: makeSpring(0),
      gazeY: makeSpring(0),
      leanX: makeSpring(0),
      leanY: makeSpring(0),
      rect: null,
      rectAt: -1,
      trackRect: null,
      wanderX: 0,
      wanderY: 0,
      nextWander: 0,
      nextBlink: 0,
      blinkStart: -1,
      blinkQueue: 0,
      nextGlint: 0,
      glintStart: -1,
    };
  }

  const optionsRef = useRef({ lean, bob, detail, hopPeriod });
  optionsRef.current = { lean, bob, detail, hopPeriod };

  useEffect(() => {
    if (reducedMotion) {
      if (bodyRef.current) bodyRef.current.style.transform = "";
      if (irisRef.current) irisRef.current.setAttribute("transform", "translate(0 0)");
      if (upperLidRef.current) upperLidRef.current.setAttribute("transform", `translate(0 ${-LID_OPEN})`);
      // Still smiling when motion is off — the squint is expression, not movement.
      if (lowerLidRef.current) {
        lowerLidRef.current.setAttribute("transform", `translate(0 ${LID_OPEN - LOWER_REST * LID_TRAVEL})`);
      }
      if (glintRef.current) glintRef.current.style.opacity = "0";
      return undefined;
    }

    const state = stateRef.current;

    const tick = (now, dt) => {
      const body = bodyRef.current;
      if (!body) return;

      const { lean: leanAmount, bob: bobAmount, hopPeriod } = optionsRef.current;
      const t = now + state.seed;

      // Rects are cheap to reuse; recomputing twice a second is enough to keep
      // up with scrolling without measuring layout on every frame.
      if (now - state.rectAt > 0.4) {
        if (rootRef.current) state.rect = rootRef.current.getBoundingClientRect();
        if (trackRef?.current) state.trackRect = trackRef.current.getBoundingClientRect();
        state.rectAt = now;
      }

      // Scoped tracking keeps the effect reading as attention inside its own
      // section rather than a mascot that follows you down the whole page.
      let watching = pennyPointer.seen && now - pennyPointer.movedAt < 2.2;
      if (watching && trackRef) {
        const box = state.trackRect;
        watching = Boolean(
          box &&
            pennyPointer.x >= box.left &&
            pennyPointer.x <= box.right &&
            pennyPointer.y >= box.top &&
            pennyPointer.y <= box.bottom,
        );
      }

      let targetX = 0;
      let targetY = 0;

      if (watching && state.rect) {
        const originX = state.rect.left + state.rect.width / 2;
        const originY = state.rect.top + state.rect.height * 0.47;
        const dx = pennyPointer.x - originX;
        const dy = pennyPointer.y - originY;
        const distance = Math.hypot(dx, dy) || 1;
        // Eases off close in, so she does not twitch when the pointer is on her.
        const pull = clamp(distance / Math.max(90, state.rect.width * 1.1), 0, 1);
        targetX = (dx / distance) * pull;
        targetY = (dy / distance) * pull * 0.82;
        state.nextWander = now + 1.2 + Math.random() * 1.4;
      } else if (!trackRef) {
        // Page-wide instances keep glancing around instead of going glassy.
        if (now > state.nextWander) {
          const settle = Math.random() < 0.3;
          state.wanderX = (Math.random() * 2 - 1) * (settle ? 0.15 : 0.7);
          state.wanderY = (Math.random() * 2 - 1) * (settle ? 0.12 : 0.45);
          state.nextWander = now + 1.4 + Math.random() * 2.6;
        }
        targetX = state.wanderX;
        targetY = state.wanderY;
      }

      // The eye snaps; the body follows slowly behind it. That lag is most of
      // what makes the movement read as looking rather than sliding.
      const gazeX = stepSpring(state.gazeX, clamp(targetX, -1, 1), dt, 210, 22);
      const gazeY = stepSpring(state.gazeY, clamp(targetY - EAGER_LIFT, -1, 1), dt, 210, 22);
      const leanX = stepSpring(state.leanX, clamp(targetX, -1, 1), dt, 62, 13);
      const leanY = stepSpring(state.leanY, clamp(targetY, -1, 1), dt, 62, 13);

      if (irisRef.current) {
        irisRef.current.setAttribute(
          "transform",
          `translate(${(gazeX * GAZE_X).toFixed(2)} ${(gazeY * GAZE_Y).toFixed(2)})`,
        );
      }

      // ---- blinking ----------------------------------------------------------
      if (state.nextBlink === 0) state.nextBlink = now + 0.9 + Math.random() * 2;
      if (state.blinkStart < 0 && now >= state.nextBlink) {
        state.blinkStart = now;
        state.blinkQueue = Math.random() < 0.22 ? 1 : 0;
      }

      let blink = 0;
      if (state.blinkStart >= 0) {
        const p = (now - state.blinkStart) / BLINK_DURATION;
        if (p >= 1) {
          if (state.blinkQueue > 0) {
            state.blinkQueue -= 1;
            state.blinkStart = now;
          } else {
            state.blinkStart = -1;
            state.nextBlink = now + 1.8 + Math.random() * 2.6;
          }
        } else {
          // Lids shut faster than they open, the way real ones do.
          blink = p < 0.4 ? easeInOut(p / 0.4) : 1 - easeInOut((p - 0.4) / 0.6);
        }
      }

      // The bottom lid rests part-closed and takes the blink the rest of the
      // way, so a blink never drops the smile on its way through.
      const lower = LOWER_REST + blink * (1 - LOWER_REST);

      if (upperLidRef.current) {
        upperLidRef.current.setAttribute(
          "transform",
          `translate(0 ${(-LID_OPEN + blink * LID_TRAVEL).toFixed(2)})`,
        );
      }
      if (lowerLidRef.current) {
        lowerLidRef.current.setAttribute(
          "transform",
          `translate(0 ${(LID_OPEN - lower * LID_TRAVEL).toFixed(2)})`,
        );
      }

      // ---- body --------------------------------------------------------------
      // A hop rather than a sine bob: abs(sin) spends its time near the top and
      // snaps through the bottom, which is what separates "excited" from
      // "drifting". The exponent softens the peak so it floats at the apex.
      const hop = Math.abs(Math.sin((t * Math.PI) / hopPeriod));
      const lift = hop ** 0.72;
      const land = 1 - hop; // 1 at the bottom of the hop, 0 at the top

      // Squash on landing, stretch on the way up. Volume is roughly preserved,
      // so she reads as springy rather than as an image being scaled.
      const breath = Math.sin(t * TAU * 0.33 + 0.7) * 0.018;
      const scaleY = 1 + breath - land * 0.055 + lift * 0.022;
      const scaleX = 1 - breath * 0.8 + land * 0.05 - lift * 0.018;

      body.style.transform =
        `translate3d(${(leanX * 26 * leanAmount).toFixed(2)}px, ` +
        `${(leanY * 18 * leanAmount - lift * bobAmount).toFixed(2)}px, 0) ` +
        `rotate(${(leanX * 6.5 * leanAmount + Math.sin(t * 1.7) * 1.4).toFixed(3)}deg) ` +
        `scale(${scaleX.toFixed(4)}, ${scaleY.toFixed(4)})`;

      // ---- monocle glint -----------------------------------------------------
      const glint = glintRef.current;
      if (glint) {
        if (state.nextGlint === 0) state.nextGlint = now + 2 + Math.random() * 6;
        if (state.glintStart < 0 && now >= state.nextGlint) state.glintStart = now;

        if (state.glintStart >= 0) {
          const p = (now - state.glintStart) / 0.85;
          if (p >= 1) {
            state.glintStart = -1;
            state.nextGlint = now + 7 + Math.random() * 9;
            glint.style.opacity = "0";
          } else {
            glint.style.opacity = (Math.sin(p * Math.PI) * 0.7).toFixed(3);
            glint.setAttribute("transform", `translate(${(-340 + p * 680).toFixed(1)} 0)`);
          }
        }
      }
    };

    return subscribePennyFrame(tick);
  }, [reducedMotion, trackRef]);

  return (
    <span
      ref={rootRef}
      className={`live-penny ${className}`}
      aria-hidden={decorative ? "true" : undefined}
      role={decorative ? undefined : "img"}
      aria-label={decorative ? undefined : alt}
    >
      <span ref={bodyRef} className="live-penny-body">
        <img src={pennyArt} alt="" aria-hidden="true" draggable="false" className={`live-penny-img ${imgClassName}`} />

        <svg className="live-penny-eye" viewBox={`0 0 ${ART} ${ART}`} aria-hidden="true" focusable="false">
          <defs>
            <radialGradient id={`${uid}-sclera`} cx="34%" cy="30%" r="82%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="58%" stopColor="#F6F9FC" />
              <stop offset="100%" stopColor="#DDEAF5" />
            </radialGradient>
            <linearGradient id={`${uid}-glass`} x1="18%" y1="6%" x2="86%" y2="96%">
              <stop offset="0%" stopColor="#CFF3C8" />
              <stop offset="42%" stopColor="#8FD6A6" />
              <stop offset="100%" stopColor="#59BC92" />
            </linearGradient>
            <radialGradient id={`${uid}-pupil`} cx="32%" cy="28%" r="86%">
              <stop offset="0%" stopColor="#1B3F69" />
              <stop offset="62%" stopColor="#14365D" />
              <stop offset="100%" stopColor="#0F4173" />
            </radialGradient>
            <linearGradient id={`${uid}-lid`} x1="0%" y1="0%" x2="18%" y2="100%">
              <stop offset="0%" stopColor="#B9EBC6" />
              <stop offset="100%" stopColor="#6AC79B" />
            </linearGradient>
            <linearGradient id={`${uid}-glint`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0" />
              <stop offset="50%" stopColor="#FFFFFF" stopOpacity="1" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </linearGradient>
            <clipPath id={`${uid}-clip`}>
              <circle cx="0" cy="0" r={EYE.glass - 1} />
            </clipPath>
          </defs>

          <g transform={`translate(${EYE.cx} ${EYE.cy})`}>
            {/* The painted monocle underneath is fully covered from here down. */}
            <circle r={EYE.ring} fill="#0E3359" />
            <circle r={EYE.glass} fill={`url(#${uid}-glass)`} />

            <g clipPath={`url(#${uid}-clip)`}>
              <circle r={EYE.sclera} fill={`url(#${uid}-sclera)`} />

              <g ref={irisRef} transform="translate(0 0)">
                <circle r={EYE.pupil} fill={`url(#${uid}-pupil)`} />
                <circle cx="-50.5" cy="-53.5" r="34.5" fill="#FEFEFE" />
                {detail ? <circle cx="55.5" cy="34" r="18.3" fill="#F7F9FB" /> : null}
              </g>

              <g ref={upperLidRef} transform={`translate(0 ${-LID_OPEN})`}>
                <path d="M -230 -300 H 230 V 0 Q 0 34 -230 0 Z" fill={`url(#${uid}-lid)`} stroke="#2E9A79" strokeWidth="7" />
              </g>
              {/* Rendered already smiling, so the first paint matches the
                  resting pose instead of flashing a wide-open eye. */}
              <g ref={lowerLidRef} transform={`translate(0 ${LID_OPEN - LOWER_REST * LID_TRAVEL})`}>
                <path d="M -230 0 Q 0 -30 230 0 V 300 H -230 Z" fill={`url(#${uid}-lid)`} stroke="#2E9A79" strokeWidth="7" />
              </g>

              {detail ? (
                <>
                  <ellipse cx="-92" cy="-98" rx="74" ry="52" fill="#FFFFFF" opacity="0.32" transform="rotate(-32 -92 -98)" />
                  <g ref={glintRef} style={{ opacity: 0 }} transform="translate(-340 0)">
                    <rect x="-46" y="-300" width="92" height="600" fill={`url(#${uid}-glint)`} transform="rotate(-22)" />
                  </g>
                </>
              ) : null}
            </g>
          </g>
        </svg>
      </span>
    </span>
  );
}
