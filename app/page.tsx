import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
      {/* nav */}
      <header className="border-b border-[#1f1f1f]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <span className="text-lg font-medium tracking-tight text-[#f5f5f5]">
            cracked<span className="text-[#84cc16]">]</span>
          </span>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button
                variant="ghost"
                className="text-[#737373] hover:text-[#f5f5f5] hover:bg-[#1f1f1f]"
              >
                Sign in
              </Button>
            </Link>
            <Link href="/signup">
              <Button className="bg-[#84cc16] text-[#0a0a0a] font-medium hover:bg-[#84cc16]/90">
                Get started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* hero */}
      <main className="flex-1 flex items-center">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-[#f5f5f5] leading-tight">
            Stop memorizing solutions.
            <br />
            <span className="text-[#84cc16]">Learn to think</span> like an
            engineer.
          </h1>
          <p className="mt-6 text-lg text-[#737373] max-w-xl mx-auto leading-relaxed">
            Cracked guides you through FAANG problems like a senior engineer
            would — with questions, not answers. Socratic coaching that builds
            real problem-solving intuition.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link href="/signup">
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
          cracked] — Get cracked at coding interviews.
        </div>
      </footer>
    </div>
  );
}
