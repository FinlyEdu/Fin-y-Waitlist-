import React from "react";
import { Lock } from "lucide-react";

/**
 * The real fin!y curriculum, taken from src/data/curriculum in the app repo —
 * seven courses across two paths. Titles and blurbs match what a learner will
 * actually be given, so the waitlist is not promising a different product.
 */
const PATHS = [
  {
    id: "finance-fundamentals",
    title: "Finance Fundamentals",
    access: "Free",
    description:
      "A four-course path from first money decisions through spending, banking, protection, and investing.",
    courses: [
      {
        title: "Money, Choices & Goals",
        blurb: "Start at zero: what money actually does, and how to choose well under real limits.",
      },
      {
        title: "Spending, Budgeting & Saving",
        blurb: "Track income and spending, plan a budget, and save for both goals and shocks.",
      },
      {
        title: "Banking, Credit & Financial Safety",
        blurb: "Accounts, credit, scams and consumer rights — and how to recover when things go wrong.",
      },
      {
        title: "Investing & Your Financial Future",
        blurb: "Risk, time, and compounding — how investing works before you ever put money in.",
      },
    ],
  },
  {
    id: "advanced-finance",
    title: "Advanced Finance",
    access: "Paid",
    description:
      "A curated bridge into business finance, company analysis, valuation, markets, and professional decision-making.",
    courses: [
      {
        title: "Financial Statements & Corporate Finance",
        blurb: "Read a balance sheet, trace a transaction, and tell profit apart from cash.",
      },
      {
        title: "Business Analysis & Valuation",
        blurb: "Analyse a company with explicit calculations — and know where the model breaks.",
      },
      {
        title: "Markets, Risk & Advanced Decisions",
        blurb: "Issuance, liquidity and price formation, without treating a quote as guaranteed value.",
      },
    ],
  },
];

export default function CoursesSection() {
  return (
    <section id="courses" className="border-t border-border bg-paper">
      <div className="mx-auto max-w-[1200px] px-6 py-20 lg:px-10 lg:py-28">
        <div className="max-w-2xl">
          <div className="font-mono-meta mb-6 text-xs uppercase tracking-[0.2em] text-ink/40">
            <span className="mr-3 inline-block h-px w-8 bg-ink/30 align-middle" />
            The curriculum
          </div>
          <h2 className="text-4xl font-semibold leading-[1.08] tracking-tight text-ink lg:text-5xl">
            Seven courses, built in order
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-ink/60">
            Each one assumes only what came before it. You can start knowing nothing about
            money and finish reading a company&apos;s accounts.
          </p>
        </div>

        <div className="mt-14 space-y-14">
          {PATHS.map((path) => (
            <div key={path.id}>
              <div className="mb-6 flex flex-wrap items-baseline gap-x-4 gap-y-2 border-b border-border pb-4">
                <h3 className="text-xl font-semibold tracking-tight text-ink">{path.title}</h3>
                <span
                  className={`font-mono-meta rounded-full px-2.5 py-1 text-[10px] uppercase tracking-wider ${
                    path.access === "Free"
                      ? "bg-vermillion/12 text-vermillion"
                      : "bg-ink/[0.06] text-ink/45"
                  }`}
                >
                  {path.access === "Free" ? "Free" : (
                    <span className="inline-flex items-center gap-1">
                      <Lock size={9} aria-hidden="true" />
                      Paid
                    </span>
                  )}
                </span>
                <p className="w-full text-sm leading-relaxed text-ink/45 sm:w-auto sm:flex-1">
                  {path.description}
                </p>
              </div>

              <ol className="grid gap-4 sm:grid-cols-2">
                {path.courses.map((course, index) => (
                  <li
                    key={course.title}
                    className="group rounded-2xl hairline border border-border bg-white p-5 transition-colors hover:border-ink/25"
                  >
                    <div className="flex items-start gap-4">
                      <span className="font-mono-meta mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-ink/[0.05] text-[11px] text-ink/40 transition-colors group-hover:bg-vermillion/12 group-hover:text-vermillion">
                        {index + 1}
                      </span>
                      <div className="min-w-0">
                        <h4 className="font-medium leading-snug text-ink">{course.title}</h4>
                        <p className="mt-1.5 text-sm leading-relaxed text-ink/50">{course.blurb}</p>
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
