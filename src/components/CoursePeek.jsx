import React from "react";

/**
 * A sneak peek at the course library.
 *
 * Content is taken from the fin!y master library export — three tracks,
 * 62 courses, 335 units. Only a handful are shown here on purpose: enough to
 * make the scope legible without turning the waitlist into a catalogue.
 *
 * Course and unit names are the real ones, so the page does not promise a
 * different product than the one people are signing up for.
 */
const TRACKS = [
  {
    id: "real-life",
    label: "Real life",
    blurb: "The decisions people actually face, in the order they meet them.",
    courses: [
      {
        title: "Your First Budget",
        units: ["Understanding your money flow", "Tracking your spending", "Cutting costs without feeling deprived"],
      },
      {
        title: "Your First Investment Account",
        units: ["Choosing your brokerage", "Understanding account types", "Making your first investment"],
      },
      {
        title: "Raising Money-Smart Kids",
        units: ["Teaching money basics (3–10)", "Pre-teen money skills (11–14)", "Teen investing and college planning (15–18)"],
      },
    ],
  },
  {
    id: "investing",
    label: "Investing",
    blurb: "From what a share is, through to portfolio construction and risk.",
    courses: [
      {
        title: "Investing Fundamentals 101",
        units: ["What is investing?", "Risk and return", "Portfolio diversification"],
      },
      {
        title: "Market Cycles & Market Observation",
        units: ["Understanding market cycles", "All-time lows and market crashes", "Timing vs time in market"],
      },
      {
        title: "ETFs & Passive Investing",
        units: ["ETF fundamentals", "ETFs vs mutual funds", "Building an ETF portfolio"],
      },
    ],
  },
  {
    id: "economics",
    label: "Finance, economics & politics",
    blurb: "Why the numbers move, and who is moving them.",
    courses: [
      {
        title: "How Politics Impacts Markets",
        units: ["Elections and market impact", "Legislation and regulatory risk", "Fiscal policy and the debt ceiling"],
      },
      {
        title: "Microeconomics 101",
        units: ["Supply, demand and prices", "Incentives and trade-offs", "Markets and competition"],
      },
      {
        title: "Behavioral Economics",
        units: ["Why people misjudge risk", "Biases in everyday money choices", "Designing better decisions"],
      },
    ],
  },
];

export default function CoursePeek() {
  return (
    <section id="courses" className="border-t border-border bg-paper">
      <div className="mx-auto max-w-[1200px] px-6 py-20 lg:px-10 lg:py-28">
        <div className="max-w-2xl">
          <div className="font-mono-meta mb-6 text-xs uppercase tracking-[0.2em] text-ink/40">
            <span className="mr-3 inline-block h-px w-8 bg-ink/30 align-middle" />
            A look inside
          </div>
          <h2 className="text-4xl font-semibold leading-[1.08] tracking-tight text-ink lg:text-5xl">
            62 courses. Here are nine of them.
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-ink/60">
            Three tracks, 335 units. Start with the money in your account this month, or go all
            the way to reading a company&apos;s books — the path is the same either way.
          </p>
        </div>

        <div className="mt-14 space-y-16">
          {TRACKS.map((track) => (
            <div key={track.id}>
              <div className="mb-6 flex flex-wrap items-baseline gap-x-4 gap-y-1 border-b border-border pb-4">
                <h3 className="text-xl font-semibold tracking-tight text-ink">{track.label}</h3>
                <p className="text-sm leading-relaxed text-ink/45">{track.blurb}</p>
              </div>

              <ul className="grid gap-4 md:grid-cols-3">
                {track.courses.map((course) => (
                  <li
                    key={course.title}
                    className="group rounded-2xl hairline border border-border bg-white p-5 transition-colors hover:border-ink/25"
                  >
                    <h4 className="font-medium leading-snug text-ink">{course.title}</h4>
                    {/* A few real unit names, so the scope is concrete rather
                        than a title with nothing behind it. */}
                    <ul className="mt-3 space-y-1.5">
                      {course.units.map((unit) => (
                        <li key={unit} className="flex gap-2.5 text-sm leading-relaxed text-ink/50">
                          <span
                            aria-hidden="true"
                            className="mt-[0.55rem] h-1 w-1 shrink-0 rounded-full bg-vermillion/50 transition-colors group-hover:bg-vermillion"
                          />
                          {unit}
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="font-mono-meta mt-14 text-center text-[11px] uppercase tracking-wider text-ink/35">
          Plus 53 more courses across the three tracks
        </p>
      </div>
    </section>
  );
}
