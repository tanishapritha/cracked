import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#0a0a0a]">
      {/* nav */}
      <header className="border-b border-[#1f1f1f] sticky top-0 bg-[#0a0a0a]/80 backdrop-blur-sm z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <span className="text-xl font-bold tracking-tight">
            <span className="text-[#f5f5f5]">cracked</span>
            <span className="text-[#84cc16]">dev</span>
          </span>
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <Button
                variant="ghost"
                className="text-[#737373] hover:text-[#f5f5f5] hover:bg-[#1f1f1f]"
              >
                Dashboard
              </Button>
            </Link>
            <Link href="/problems">
              <Button className="bg-[#84cc16] text-[#0a0a0a] font-medium hover:bg-[#84cc16]/90">
                Browse Problems
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* hero */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 sm:px-6 py-24 sm:py-32">
        <div className="max-w-4xl space-y-6">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-[#f5f5f5]">
            Become a <span className="text-[#84cc16]">cracked</span> dev with
            more problems, not direct solutions
          </h1>
          <p className="text-[#737373] text-lg sm:text-xl max-w-2xl mx-auto">
            Stop memorizing LeetCode solutions. Our Socratic AI coach forces you
            to think through the conceptual logic before you write a single line of
            code. Build real problem-solving intuition.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link href="/problems">
              <Button
                size="lg"
                className="bg-[#84cc16] text-[#0a0a0a] font-medium hover:bg-[#84cc16]/90 px-8"
              >
                Start free
              </Button>
            </Link>
            <Link href="#how-it-works">
              <Button
                size="lg"
                variant="outline"
                className="border-[#1f1f1f] text-[#f5f5f5] hover:bg-[#1f1f1f] px-8"
              >
                See how it works
              </Button>
            </Link>
          </div>

          {/* how it works */}
          <section id="how-it-works" className="mt-32">
            <h2 className="text-2xl font-semibold text-[#f5f5f5] mb-12">
              Three steps to interview readiness
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[
                {
                  step: "01",
                  title: "Pick a problem",
                  desc: "Browse curated FAANG interview problems filtered by topic and difficulty.",
                },
                {
                  step: "02",
                  title: "Coach walks you through",
                  desc: "Alex, your AI coach, uses Socratic questioning to guide you to the solution yourself.",
                },
                {
                  step: "03",
                  title: "Track your growth",
                  desc: "Your skill map updates after every session. See exactly where you stand.",
                },
              ].map((item) => (
                <div
                  key={item.step}
                  className="bg-[#141414] border border-[#1f1f1f] p-6 text-left"
                >
                  <span className="text-xs font-mono text-[#84cc16]">
                    {item.step}
                  </span>
                  <h3 className="text-[#f5f5f5] font-medium mt-2">
                    {item.title}
                  </h3>
                  <p className="text-sm text-[#737373] mt-2 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>

      {/* footer */}
      <footer className="border-t border-[#1f1f1f] py-6">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-[#737373]">
          cracked<span className="text-[#84cc16]">dev</span> — Get cracked at coding interviews.
        </div>
      </footer>
    </div>
  );
}
