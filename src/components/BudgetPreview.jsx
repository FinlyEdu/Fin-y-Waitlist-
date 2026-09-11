import React, { useRef, useState } from "react";

const TAKE_HOME = 2400;
/** The 50/30/20 rule the lesson is teaching toward. */
const TARGET = { needs: 50, wants: 30, savings: 20 };
const MIN = { needs: 15, wants: 5, savings: 0 };

const money = (percent) =>
  `$${Math.round((TAKE_HOME * percent) / 100).toLocaleString()}`;

/**
 * A budgeting lesson, playable. Two handles split one month of take-home pay
 * across needs, wants and savings — the page claims fin!y teaches by doing, so
 * the hero should hand a visitor the money rather than show them a screenshot.
 */
export default function BudgetPreview() {
  const trackRef = useRef(null);
  // Stored as the two cut points along the bar, which is what the handles move.
  const [cuts, setCuts] = useState({ first: 58, second: 88 });
  const [dragging, setDragging] = useState(null);

  const needs = cuts.first;
  const wants = cuts.second - cuts.first;
  const savings = 100 - cuts.second;
  const onTrack = savings >= TARGET.savings;

  // Each handle is penned in by the other one, so every segment keeps a floor.
  const clamp = (current, handle, percent) =>
    handle === "first"
      ? { ...current, first: Math.min(Math.max(percent, MIN.needs), current.second - MIN.wants) }
      : { ...current, second: Math.min(Math.max(percent, current.first + MIN.wants), 100 - MIN.savings) };

  const moveTo = (handle, percent) => setCuts((current) => clamp(current, handle, percent));

  const percentFromPointer = (clientX) => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect) return null;
    return Math.round(((clientX - rect.left) / rect.width) * 100);
  };

  const startDrag = (handle) => (event) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(handle);
  };

  const onPointerMove = (event) => {
    if (!dragging) return;
    const percent = percentFromPointer(event.clientX);
    if (percent !== null) moveTo(dragging, percent);
  };

  // The handles are draggable by pointer, so give the keyboard the same control.
  const onKeyDown = (handle) => (event) => {
    const step = event.key === "ArrowLeft" ? -2 : event.key === "ArrowRight" ? 2 : 0;
    if (!step) return;
    event.preventDefault();
    setCuts((current) => clamp(current, handle, current[handle] + step));
  };

  const rows = [
    { key: "needs", label: "Needs", hint: "Rent, food, transport", percent: needs, swatch: "#3F3F3F" },
    { key: "wants", label: "Wants", hint: "Eating out, subscriptions", percent: wants, swatch: "#C8C9CB" },
    { key: "savings", label: "Savings", hint: "Emergency fund, investing", percent: savings, swatch: "#28C76F" },
  ];

  return (
    <div className="relative rounded-3xl hairline border border-border bg-[#F0F4F8] min-h-[360px] overflow-hidden p-6 sm:p-8 flex flex-col">
      <div className="flex items-center justify-between font-mono-meta text-[11px] uppercase tracking-wider text-ink/40">
        <span>Lesson · Build a budget</span>
        <span className="hidden sm:inline">Drag the splits</span>
      </div>

      <div className="mt-4 flex items-baseline gap-2">
        <span className="text-ink text-2xl sm:text-3xl font-semibold tracking-tight">
          ${TAKE_HOME.toLocaleString()}
        </span>
        <span className="font-mono-meta text-[11px] uppercase tracking-wider text-ink/40">
          take-home / month
        </span>
      </div>

      <div
        className="mt-5 select-none"
        onPointerMove={onPointerMove}
        onPointerUp={() => setDragging(null)}
        onPointerCancel={() => setDragging(null)}
      >
        <div ref={trackRef} className="relative h-11 rounded-xl overflow-hidden flex touch-none">
          {rows.map((row) => (
            <div
              key={row.key}
              className="h-full transition-[width] duration-75"
              style={{ width: `${row.percent}%`, backgroundColor: row.swatch }}
            />
          ))}

          {[
            { handle: "first", at: cuts.first, label: "Needs and wants split" },
            { handle: "second", at: cuts.second, label: "Wants and savings split" },
          ].map(({ handle, at, label }) => (
            <div
              key={handle}
              role="slider"
              tabIndex={0}
              aria-label={label}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={at}
              aria-valuetext={`${at} percent`}
              onPointerDown={startDrag(handle)}
              onKeyDown={onKeyDown(handle)}
              style={{ left: `${at}%` }}
              className={`absolute top-0 h-full w-6 -ml-3 grid place-items-center touch-none focus:outline-none ${
                dragging === handle ? "cursor-grabbing" : "cursor-grab"
              }`}
            >
              <span className="h-full w-[3px] rounded-full bg-white shadow-[0_0_0_1px_rgba(26,26,26,0.12)]" />
            </div>
          ))}
        </div>

        {/* Where the 50/30/20 rule would put the same two cuts. */}
        <div className="relative h-4 mt-1.5">
          {[TARGET.needs, TARGET.needs + TARGET.wants].map((at) => (
            <span
              key={at}
              style={{ left: `${at}%` }}
              className="absolute top-0 -ml-px h-2 w-px bg-ink/25"
              aria-hidden="true"
            />
          ))}
          <span className="absolute top-2 left-0 font-mono-meta text-[10px] uppercase tracking-wider text-ink/35">
            50 / 30 / 20 target
          </span>
        </div>
      </div>

      <div className="mt-auto pt-4 space-y-2">
        {rows.map((row) => (
          <div key={row.key} className="flex items-center gap-2.5 text-[13px]">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: row.swatch }} />
            <span className="text-ink font-medium">{row.label}</span>
            <span className="text-ink/35 hidden sm:inline truncate">{row.hint}</span>
            <span className="ml-auto font-mono-meta text-ink/50 tabular-nums">{row.percent}%</span>
            <span className="w-16 text-right text-ink font-medium tabular-nums">{money(row.percent)}</span>
          </div>
        ))}
      </div>

      <p
        className={`mt-4 text-[13px] leading-snug ${onTrack ? "text-vermillion" : "text-ink/50"}`}
        role="status"
        aria-live="polite"
      >
        {onTrack
          ? `On track — ${money(savings)} a month into savings.`
          : `Savings is ${savings}%. Get it to ${TARGET.savings}% and you put ${money(TARGET.savings)} away every month.`}
      </p>
    </div>
  );
}
