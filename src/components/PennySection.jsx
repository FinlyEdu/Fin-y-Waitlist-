import React, { useRef } from "react";
import LivePenny from "@/components/LivePenny";

/**
 * "Meet Penny" — the one section on the page where the mascot is alive.
 *
 * Penny watches the cursor while it is inside this section and settles back
 * the moment it leaves, so the effect reads as attention rather than a gimmick
 * that follows you down the whole page. The eye tracks fast and the body leans
 * slowly behind it; that lag is most of what sells it as looking at you rather
 * than sliding. Motion is written straight to style.transform from one shared
 * rAF loop, keeping it off React's render path.
 */
export default function PennySection() {
  const sectionRef = useRef(null);

  return (
    <section
      ref={sectionRef}
      id="penny"
      className="relative overflow-hidden border-t border-border bg-[#0E1512] text-paper"
    >
      {/* A soft glow anchored behind Penny, so the dark band has a centre. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-40 blur-3xl lg:left-[72%]"
        style={{ background: "radial-gradient(circle, rgba(40,199,111,0.55), transparent 65%)" }}
      />

      <div className="relative mx-auto grid max-w-[1200px] items-center gap-12 px-6 py-24 lg:grid-cols-2 lg:gap-16 lg:px-10 lg:py-32">
        <div>
          <div className="font-mono-meta mb-6 text-xs uppercase tracking-[0.2em] text-paper/40">
            <span className="mr-3 inline-block h-px w-8 bg-vermillion align-middle" />
            Meet your tutor
          </div>
          <h2 className="text-4xl font-semibold leading-[1.08] tracking-tight lg:text-5xl">
            This is <span className="text-vermillion">Penny</span>.
          </h2>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-paper/70">
            Penny is the tutor sitting next to you in every lesson. She watches which
            step you got stuck on — not just whether the answer was wrong — and explains
            that part again a different way.
          </p>
          <p className="mt-4 max-w-md leading-relaxed text-paper/50">
            She never gives you the answer outright. She asks the question that gets you
            there, waits, and tells you plainly when you&apos;ve got it.
          </p>

          <dl className="mt-10 grid gap-6 sm:grid-cols-3">
            {[
              ["Notices", "Where the reasoning broke, not just the wrong answer"],
              ["Re-explains", "The same idea from a different angle until it lands"],
              ["Remembers", "What you've mastered, so nothing repeats needlessly"],
            ].map(([term, detail]) => (
              <div key={term}>
                <dt className="font-mono-meta text-[11px] uppercase tracking-wider text-vermillion">
                  {term}
                </dt>
                <dd className="mt-2 text-sm leading-relaxed text-paper/55">{detail}</dd>
              </div>
            ))}
          </dl>

          <p className="font-mono-meta mt-10 text-[11px] uppercase tracking-wider text-paper/30">
            Move your cursor — she&apos;s watching
          </p>
        </div>

        <div className="flex justify-center lg:justify-end">
          <LivePenny
            className="w-52 max-w-full drop-shadow-2xl sm:w-64 lg:w-80"
            alt="Penny, the fin!y tutor — a faceted green character with one large eye"
            trackRef={sectionRef}
            lean={1}
            bob={10}
            hopPeriod={1.5}
          />
        </div>
      </div>
    </section>
  );
}
