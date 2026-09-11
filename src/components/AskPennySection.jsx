import React, { useLayoutEffect, useRef, useState } from "react";
import LivePenny from "@/components/LivePenny";

/**
 * "Ask her anything" — one worked exchange, shown rather than described.
 *
 * The claim that an AI tutor answers your questions is worth nothing on its
 * own; every product says it. So the section spends its space on a single real
 * answer and lets the reader judge the quality themselves. The question is one
 * people actually ask and are often answered badly — either waved away or sold
 * to.
 *
 * The reply arrives after a short pause on first scroll into view, which reads
 * as Penny thinking. It plays once, and not at all for anyone who has asked for
 * reduced motion — they get the answer immediately, which is the point anyway.
 */

const OTHER_QUESTIONS = [
  "Why is my payslip less than my salary?",
  "What actually is inflation?",
  "Is credit card debt worse than a loan?",
  "Should I worry about a recession?",
];

/** Kept out of the component so the copy is easy to find and edit. */
const ANSWER = [
  "A bit, yes. Both mean putting money on something you can't control, and both can lose.",
  "But a share is a tiny slice of a real company. If that company sells more sandwiches this year, your slice can be worth more. A fairground game doesn't sell anything — it's built so the stall keeps a little of your money every time you play.",
  "Though if you buy on Monday hoping it jumps by Friday, that's a bet. Owning your slice for years is a different thing.",
];

export default function AskPennySection() {
  const sectionRef = useRef(null);
  /**
   * Answered by default, and only hidden once this component has committed to
   * revealing it. The answer is the entire point of the section, so it must not
   * depend on a timer firing: if scripting is off, or the observer never
   * delivers, a visitor still reads it. useLayoutEffect rather than useEffect
   * so the hide lands before paint and there is no flash of the answer.
   */
  const [answered, setAnswered] = useState(true);

  useLayoutEffect(() => {
    const node = sectionRef.current;
    if (!node) return undefined;

    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      typeof IntersectionObserver === "undefined"
    ) {
      return undefined;
    }

    setAnswered(false);

    let timer = null;

    // Backstop. The dots are a flourish; the answer is the content, and the
    // failure mode of a stuck observer is a visitor watching dots forever on a
    // page meant to sell the tutor. If nothing has revealed it by six seconds,
    // show it anyway — arriving to an already-answered question costs nothing.
    const fallback = setTimeout(() => setAnswered(true), 6000);

    // threshold:0 with a bottom rootMargin, deliberately: a ratio threshold is
    // a function of the element's height, and this section is ~1760px tall, so
    // anything above ~0.3 could never be reached on a short window or a phone
    // held sideways — the answer would never arrive and the dots would run
    // forever. This fires when the section's top edge crosses 80% of the
    // viewport, whatever either of them measures.
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        timer = setTimeout(() => setAnswered(true), 900);
      },
      { threshold: 0, rootMargin: "0px 0px -20% 0px" },
    );

    observer.observe(node);
    return () => {
      observer.disconnect();
      clearTimeout(fallback);
      if (timer) clearTimeout(timer);
    };
  }, []);

  return (
    <section ref={sectionRef} className="border-t border-border bg-paper">
      <div className="mx-auto grid max-w-[1200px] items-start gap-12 px-6 py-20 lg:grid-cols-[1fr_1.15fr] lg:gap-20 lg:px-10 lg:py-28">
        <div>
          <div className="font-mono-meta mb-6 text-xs uppercase tracking-[0.2em] text-ink/40">
            <span className="mr-3 inline-block h-px w-8 bg-ink/30 align-middle" />
            Ask her anything
          </div>
          <h2 className="text-4xl font-semibold leading-[1.08] tracking-tight text-ink lg:text-5xl">
            No question is too basic
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-ink/60">
            Penny answers whatever you actually want to know — in the middle of a lesson
            or at eleven at night — in plain language, as many times as you need to ask.
          </p>
          <p className="mt-4 leading-relaxed text-ink/55">
            She won&apos;t talk down to you, and she won&apos;t sell you anything. If the
            honest answer is &ldquo;it depends&rdquo;, she&apos;ll tell you what it depends
            on.
          </p>

          <p className="font-mono-meta mt-10 text-[11px] uppercase tracking-wider text-ink/35">
            Also asked
          </p>
          <ul className="mt-4 flex flex-wrap gap-2">
            {OTHER_QUESTIONS.map((question) => (
              <li
                key={question}
                className="hairline rounded-full border border-border px-3.5 py-2 text-sm text-ink/55"
              >
                {question}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-border bg-[#FAFAF8] p-5 sm:p-7">
          {/* The learner's turn. Right-aligned so the exchange reads as a
              conversation at a glance, without needing labels. */}
          <div className="flex justify-end">
            <p className="max-w-[85%] rounded-2xl rounded-br-md bg-ink px-4 py-3 text-paper">
              Are stocks like gambling?
            </p>
          </div>

          <div className="mt-6 flex gap-3 sm:gap-4">
            <LivePenny
              decorative
              detail={false}
              lean={0.3}
              bob={3}
              hopPeriod={2.6}
              className="mt-1 w-9 shrink-0 sm:w-11"
            />

            <div className="min-w-0 flex-1">
              <p className="font-mono-meta mb-2 text-[11px] uppercase tracking-wider text-vermillion">
                Penny
              </p>

              {answered ? (
                <div className="space-y-3 text-ink/75">
                  {ANSWER.map((paragraph) => (
                    <p key={paragraph.slice(0, 24)} className="leading-relaxed">
                      {paragraph}
                    </p>
                  ))}
                </div>
              ) : (
                <p className="flex items-center gap-1.5 py-2" aria-label="Penny is typing">
                  {[0, 1, 2].map((dot) => (
                    <span
                      key={dot}
                      className="penny-typing-dot h-2 w-2 rounded-full bg-ink/25"
                      style={{ animationDelay: `${dot * 160}ms` }}
                    />
                  ))}
                </p>
              )}
            </div>
          </div>

          <p className="mt-6 border-t border-border pt-4 text-sm leading-relaxed text-ink/40">
            A real answer from a lesson on risk. Penny explains how things work — she
            never tells you what to buy.
          </p>
        </div>
      </div>
    </section>
  );
}
