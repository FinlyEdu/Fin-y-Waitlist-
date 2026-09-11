import React from "react";
import { LineChart, Sparkles, Timer } from "lucide-react";
import AskPennySection from "@/components/AskPennySection";
import FinyMark from "@/components/FinyMark";
import MarketLesson from "@/components/MarketLesson";
import CoursePeek from "@/components/CoursePeek";
import PennySection from "@/components/PennySection";
import WaitlistForm from "@/components/WaitlistForm";

const PERKS = [
  {
    icon: Timer,
    title: "15 minutes a day",
    body: "Short, interactive lessons that fit between everything else — not a course you have to schedule around.",
  },
  {
    icon: LineChart,
    title: "Learn by doing",
    body: "Split the paycheque, run the trade, watch it compound. Every idea is something you handle, not something you read.",
  },
  {
    icon: Sparkles,
    title: "Penny tutors you",
    body: "An AI tutor that notices where you got stuck and explains that part again, in a way that lands.",
  },
];

/** Deliberately about the product, not borrowed statistics we cannot stand behind. */
const MISSION = [
  {
    stat: "62 courses",
    label: "Three tracks",
    detail: "Real-life money, investing, and the economics behind both. Start anywhere that fits.",
  },
  {
    stat: "15 min",
    label: "A day is enough",
    detail: "Short sessions beat weekend crash courses that nobody finishes.",
  },
  {
    stat: "Ages 11+",
    label: "Written to be understood",
    detail: "Plain language and real decisions, without talking down to anyone.",
  },
];

export default function App() {
  return (
    <div className="min-h-screen bg-paper">
      <header className="max-w-[1200px] mx-auto px-6 lg:px-10 py-7 flex items-center justify-between">
        <FinyMark className="w-[86px]" />
        <span className="font-mono-meta text-[11px] uppercase tracking-[0.18em] text-ink/45 hairline border border-border rounded-full px-4 py-2">
          Early access · 2026
        </span>
      </header>

      <main>
        <section className="max-w-[1200px] mx-auto px-6 lg:px-10 pt-10 pb-20 lg:pt-16 lg:pb-28 grid lg:grid-cols-2 gap-14 items-center">
          <div className="hero-rise">
            <div className="font-mono-meta text-xs uppercase tracking-[0.2em] text-ink/40 mb-6">
              <span className="inline-block w-8 h-px bg-ink/30 align-middle mr-3" />
              A finance tutor that does the teaching
            </div>
            <h1 className="text-ink text-5xl lg:text-6xl xl:text-[68px] leading-[1.05] font-semibold tracking-tight">
              Your personal tutor for <span className="text-vermillion">finance</span>
            </h1>
            <p className="mt-6 text-lg text-ink/60 leading-relaxed max-w-md">
              A world-class tutor for every home. Learn investing, markets, and money management — step by step, with interactive lessons that actually click.
            </p>

            <WaitlistForm className="mt-8" source="hero" />

            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 font-mono-meta text-xs text-ink/40 uppercase tracking-wider">
              <span>335 units at launch</span>
              <span className="hidden sm:inline w-px h-3 bg-ink/15" />
              <span>Learn in 15 min/day</span>
              <span className="hidden sm:inline w-px h-3 bg-ink/15" />
              <span>No card required</span>
            </div>
          </div>

          <div className="relative hero-rise" style={{ animationDelay: "120ms" }}>
            <MarketLesson />
          </div>
        </section>

        <section className="border-t border-border bg-[#FAFAF8]">
          <div className="max-w-[1200px] mx-auto px-6 lg:px-10 py-16 lg:py-20">
            <h2 className="font-mono-meta text-[11px] uppercase tracking-[0.18em] text-ink/40 mb-10">
              What you get on day one
            </h2>
            <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
              {PERKS.map(({ icon: Icon, title, body }) => (
                <div key={title}>
                  <span className="grid place-items-center w-11 h-11 rounded-full bg-vermillion/12 text-vermillion mb-5">
                    <Icon size={20} aria-hidden="true" />
                  </span>
                  <h3 className="text-ink text-lg font-semibold mb-2">{title}</h3>
                  <p className="text-ink/55 leading-relaxed">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <PennySection />

        <AskPennySection />

        <CoursePeek />

        <section className="border-t border-border bg-[#FAFAF8]">
          <div className="max-w-[1200px] mx-auto px-6 lg:px-10 py-20 lg:py-28 grid lg:grid-cols-[1.1fr_1fr] gap-12 lg:gap-20 items-start">
            <div>
              <div className="font-mono-meta text-xs uppercase tracking-[0.2em] text-ink/40 mb-6">
                <span className="inline-block w-8 h-px bg-ink/30 align-middle mr-3" />
                Why we&apos;re building it
              </div>
              <h2 className="text-ink text-4xl lg:text-5xl font-semibold leading-[1.08] tracking-tight">
                Money is taught late, or not at all
              </h2>
              <p className="mt-6 text-lg text-ink/60 leading-relaxed">
                Most people meet their first real financial decision — a loan, a first pay
                cheque, a credit limit — with nothing to reason from. Not because the ideas
                are hard, but because nobody ever handed them to us in a form we could use.
              </p>
              <p className="mt-4 text-ink/55 leading-relaxed">
                fin!y exists to hand them over early, while the stakes are still small. Not
                as a lecture on being sensible, but as something you work through: move the
                money, make the call, see what it costs. A young person who has already made
                a hundred small decisions in practice meets the first real one differently.
              </p>
            </div>

            <dl className="grid gap-8 sm:grid-cols-2 lg:grid-cols-1 lg:gap-7 lg:pt-4">
              {MISSION.map(({ stat, label, detail }) => (
                <div key={label} className="border-l-2 border-vermillion/30 pl-5">
                  <dt className="text-ink text-2xl font-semibold tracking-tight">{stat}</dt>
                  <dd className="mt-1">
                    <span className="block font-medium text-ink">{label}</span>
                    <span className="mt-1 block text-sm leading-relaxed text-ink/50">{detail}</span>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section className="max-w-[1200px] mx-auto px-6 lg:px-10 py-20 lg:py-28 text-center">
          <h2 className="text-ink text-3xl lg:text-4xl font-semibold tracking-tight max-w-xl mx-auto">
            Be first in when we open the doors
          </h2>
          <p className="mt-4 text-ink/55 max-w-md mx-auto leading-relaxed">
            We&apos;re letting people in a group at a time so every early learner gets Penny&apos;s full attention.
          </p>
          <div className="mt-9 flex justify-center">
            <WaitlistForm source="footer" note="One email when your seat opens. Nothing else." />
          </div>
        </section>
      </main>

      <footer className="bg-ink text-paper">
        <div className="max-w-[1200px] mx-auto px-6 lg:px-10 py-12 flex flex-col sm:flex-row items-center justify-between gap-5">
          <FinyMark light className="w-[80px]" />
          <span className="font-mono-meta text-[11px] uppercase tracking-wider text-paper/40">
            © 2026 fin!y · Learn money by doing
          </span>
        </div>
      </footer>
    </div>
  );
}
