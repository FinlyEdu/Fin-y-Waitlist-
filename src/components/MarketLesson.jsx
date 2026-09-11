import React, { useEffect, useMemo, useState } from "react";
import LivePenny from "@/components/LivePenny";

/**
 * The hero lesson: a simulated trading session, narrated as it happens.
 *
 * One timeline drives everything. Each phase of SCRIPT owns both a price
 * movement and the sentence explaining it, so Penny is never describing a
 * trend the chart is not showing — the two cannot drift apart, because they
 * are the same data.
 *
 * The company, the prices and the session are invented. The panel says
 * "simulated" on its face, because a finance product showing a live-looking
 * chart should never leave a visitor wondering whether it is real market data.
 */

const COMPANY = { name: "Northwind Foods", ticker: "NWF" };

const BASE_PRICE = 46;
const TICK_MS = 250;            // one price sample
const TICKS_PER_PHASE = 20;     // 20 x 250ms = exactly 5s per message

/**
 * The session, in order. `delta` is the dollar move across the whole phase.
 *
 * The deltas sum to zero, so the loop returns to its opening price and can run
 * forever without the chart wandering off its own scale.
 *
 * Every line explains a mechanism — who is buying, who is selling, and why the
 * number followed. None of them tell anyone what to do with money.
 */
const SCRIPT = [
  {
    delta: +1.2,
    text: "Buyers are stepping in. Each one pays slightly more than the last, so the price ticks up.",
  },
  {
    delta: +1.4,
    text: "Northwind sold more than people expected this quarter. More want in than out, so it keeps rising.",
  },
  {
    delta: +0.6,
    text: "The climb slows. At this price fewer buyers still think it is worth it.",
  },
  {
    delta: -0.4,
    text: "Early buyers start selling to lock in their gain. Now there are sellers to match every buyer.",
  },
  {
    delta: -2.4,
    text: "Sellers now outnumber buyers. To find one, each accepts a little less — so the price drops fast.",
  },
  {
    delta: -1.2,
    text: "Nothing about the company changed today. Only what people are willing to pay for it did.",
  },
  {
    delta: +0.3,
    text: "The fall stops where buyers decide it is cheap enough to step back in.",
  },
  {
    delta: +0.5,
    text: "Those buyers compete again, and the number starts to climb from the lower price.",
  },
];

const LOOP_TICKS = SCRIPT.length * TICKS_PER_PHASE;
const WINDOW = 48; // samples visible at once

/** Cumulative price at the start of each phase, precomputed once. */
const PHASE_OPENS = SCRIPT.reduce(
  (acc, phase) => [...acc, acc[acc.length - 1] + phase.delta],
  [BASE_PRICE],
);

/**
 * Price at any tick. Pure and periodic, so the visible window can be rebuilt
 * from scratch every frame with no accumulated drift.
 */
function priceAt(tick) {
  const n = ((tick % LOOP_TICKS) + LOOP_TICKS) % LOOP_TICKS;
  const phase = Math.floor(n / TICKS_PER_PHASE);
  const progress = (n % TICKS_PER_PHASE) / TICKS_PER_PHASE;
  const base = PHASE_OPENS[phase] + SCRIPT[phase].delta * progress;
  // Small deterministic texture, so it reads as a market rather than a ramp.
  return base + Math.sin(n * 0.9) * 0.07 + Math.sin(n * 0.31) * 0.05;
}

/**
 * Two minutes per sample, from a 09:30 open.
 *
 * Deliberately NOT wrapped on LOOP_TICKS like the price is. A visible window
 * spans 48 samples, so wrapping the clock there let a window straddle the
 * boundary and print 14:06 · 14:38 · 09:50 — time running backwards across the
 * axis. Wrapping on the day instead keeps every window monotonic.
 */
const OPEN_MINUTES = 9 * 60 + 30;
const MINUTES_PER_DAY = 24 * 60;
function clockAt(tick) {
  const total = ((OPEN_MINUTES + tick * 2) % MINUTES_PER_DAY + MINUTES_PER_DAY) % MINUTES_PER_DAY;
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export default function MarketLesson() {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      // Park mid sell-off, so the still frame still shows cause and effect.
      setTick(TICKS_PER_PHASE * 4 + 10);
      return undefined;
    }
    // setInterval rather than rAF: this is a data update, not a per-frame
    // animation, and it keeps ticking in throttled or background tabs.
    const id = setInterval(() => setTick((t) => t + 1), TICK_MS);
    return () => clearInterval(id);
  }, []);

  const phaseIndex = Math.floor((((tick % LOOP_TICKS) + LOOP_TICKS) % LOOP_TICKS) / TICKS_PER_PHASE);
  const phase = SCRIPT[phaseIndex];
  const rising = phase.delta > 0;

  // The visible window, rebuilt from the pure price function.
  const view = useMemo(() => {
    const out = [];
    for (let i = WINDOW - 1; i >= 0; i--) out.push(priceAt(tick - i));
    return out;
  }, [tick]);

  const price = view[WINDOW - 1];
  const openOfWindow = view[0];
  const change = price - openOfWindow;
  const changePct = (change / openOfWindow) * 100;

  // Pressure follows the phase, so the bar always agrees with the sentence.
  const sellPressure = Math.round(50 - (phase.delta / 2.4) * 38);

  // Auto-scale to the visible window, the way a quote chart does.
  const lo = Math.min(...view);
  const hi = Math.max(...view);
  const pad = Math.max(0.25, (hi - lo) * 0.2);
  const top = hi + pad;
  const bottom = lo - pad;
  const yOf = (v) => 8 + ((top - v) / (top - bottom)) * 96;
  const xOf = (i) => (i / (WINDOW - 1)) * 268;

  // Sharp segments, not smoothed curves — this should read as a trading chart.
  const points = view.map((v, i) => ({ x: xOf(i), y: yOf(v) }));
  const path = points.map((p, i) => `${i ? "L" : "M"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
  const last = points[points.length - 1];

  const accent = rising ? "#28C76F" : "#E5484D";
  const priceTicks = [top, (top + bottom) / 2, bottom];
  const timeTicks = [0, 16, 32, 47];

  return (
    <div className="relative rounded-3xl hairline border border-border bg-white p-6 sm:p-7">
      {/* Instrument header, laid out like a quote line. */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-ink">{COMPANY.ticker}</span>
            <span className="font-mono-meta rounded bg-ink/[0.06] px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-ink/45">
              Simulated
            </span>
          </div>
          <div className="mt-0.5 truncate text-xs text-ink/45">{COMPANY.name}</div>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-lg font-semibold tabular-nums tracking-tight text-ink">
            ${price.toFixed(2)}
          </div>
          <div
            className="font-mono-meta text-[11px] font-medium tabular-nums transition-colors duration-500"
            style={{ color: accent }}
          >
            {rising ? "▲" : "▼"} {Math.abs(change).toFixed(2)} ({Math.abs(changePct).toFixed(2)}%)
          </div>
          <div className="font-mono-meta mt-0.5 text-[10px] tabular-nums text-ink/35">
            {clockAt(tick)} · session
          </div>
        </div>
      </div>

      <svg
        viewBox="0 0 300 128"
        className="mt-4 w-full"
        role="img"
        aria-label={`Simulated price chart for ${COMPANY.name} at ${clockAt(tick)}`}
      >
        <defs>
          <linearGradient id="market-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={accent} stopOpacity="0.14" />
            <stop offset="100%" stopColor={accent} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Price gridlines with the scale on the right, as a quote chart has. */}
        {priceTicks.map((v) => (
          <g key={v}>
            <line
              x1="0" y1={yOf(v)} x2="268" y2={yOf(v)}
              stroke="#1A1A1A" strokeOpacity="0.07" strokeWidth="1"
              shapeRendering="crispEdges"
            />
            <text
              x="274" y={yOf(v) + 3} fontSize="8" fill="#1A1A1A" fillOpacity="0.35"
              fontFamily="Fredoka, sans-serif"
            >
              {v.toFixed(0)}
            </text>
          </g>
        ))}

        {/* Time axis. Ticks scroll with the window, so the clock advances. */}
        {timeTicks.map((i) => (
          <g key={i}>
            <line
              x1={xOf(i)} y1="104" x2={xOf(i)} y2="108"
              stroke="#1A1A1A" strokeOpacity="0.18" strokeWidth="1"
              shapeRendering="crispEdges"
            />
            <text
              x={xOf(i)} y="119" fontSize="7.5" fill="#1A1A1A" fillOpacity="0.35"
              textAnchor={i === 0 ? "start" : i === 47 ? "end" : "middle"}
              fontFamily="Fredoka, sans-serif"
            >
              {clockAt(tick - (WINDOW - 1 - i))}
            </text>
          </g>
        ))}
        <line
          x1="0" y1="104" x2="268" y2="104"
          stroke="#1A1A1A" strokeOpacity="0.12" strokeWidth="1"
          shapeRendering="crispEdges"
        />

        <path d={`${path} L 268 104 L 0 104 Z`} fill="url(#market-fill)" />
        <path
          d={path}
          fill="none"
          stroke={accent}
          strokeWidth="1.75"
          strokeLinecap="square"
          strokeLinejoin="miter"
          style={{ transition: "stroke 500ms ease" }}
        />
        <line
          x1="0" y1={last.y} x2="268" y2={last.y}
          stroke={accent} strokeOpacity="0.35" strokeWidth="1" strokeDasharray="3 3"
          style={{ transition: "stroke 500ms ease" }}
        />
        <circle
          cx={last.x} cy={last.y} r="3" fill={accent}
          style={{ transition: "fill 500ms ease" }}
        />
      </svg>

      {/* Buy/sell pressure — the cause, shown beside the effect. */}
      <div className="mt-3">
        <div className="flex justify-between font-mono-meta text-[10px] uppercase tracking-wider text-ink/40">
          <span>Buyers</span>
          <span>Sellers</span>
        </div>
        <div className="mt-1.5 flex h-1.5 overflow-hidden rounded-full bg-ink/10">
          <div
            className="h-full bg-vermillion transition-[width] duration-[800ms] ease-out"
            style={{ width: `${100 - sellPressure}%` }}
          />
          <div
            className="h-full bg-[#E5484D] transition-[width] duration-[800ms] ease-out"
            style={{ width: `${sellPressure}%` }}
          />
        </div>
      </div>

      {/* Penny holds the corner and explains the phase. The bubble is keyed to
          the phase, so it re-enters exactly when the explanation changes —
          once every 5 seconds, by construction. */}
      <div className="mt-5 flex items-end gap-2 sm:gap-3">
        <p
          key={phaseIndex}
          className="market-bubble relative min-h-[3.75rem] flex-1 rounded-2xl rounded-br-md hairline border border-border bg-[#F7F9F8] px-4 py-3 text-sm leading-relaxed text-ink/70"
          role="status"
          aria-live="polite"
        >
          {phase.text}
        </p>
        <LivePenny
          decorative
          detail={false}
          lean={0.4}
          bob={3}
          hopPeriod={3.2}
          className="-mb-3 -mr-2 w-14 shrink-0 drop-shadow-lg sm:w-16"
        />
      </div>
    </div>
  );
}
