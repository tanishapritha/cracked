"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { problems, getTopics } from "@/lib/problems";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Difficulty } from "@/lib/types";

const difficultyColors: Record<Difficulty, string> = {
  Easy: "bg-[#22c55e]/10 text-[#22c55e] border-[#22c55e]/20",
  Medium: "bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]/20",
  Hard: "bg-[#ef4444]/10 text-[#ef4444] border-[#ef4444]/20",
};

export default function ProblemsPage() {
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("");
  const topics = getTopics();

  const filtered = useMemo(() => {
    return problems.filter((p) => {
      if (selectedDifficulty && p.difficulty !== selectedDifficulty) return false;
      if (
        selectedTopics.length > 0 &&
        !p.topics.some((t) => selectedTopics.includes(t))
      )
        return false;
      return true;
    });
  }, [selectedTopics, selectedDifficulty]);

  const toggleTopic = (topic: string) => {
    setSelectedTopics((prev) =>
      prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic]
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-[#f5f5f5]">Problems</h1>
        <p className="text-sm text-[#737373] mt-1">
          {filtered.length} problems available
        </p>
      </div>

      {/* filters */}
      <div className="mb-6 space-y-3">
        <div className="flex flex-wrap gap-2">
          {(["Easy", "Medium", "Hard"] as Difficulty[]).map((d) => (
            <button
              key={d}
              onClick={() =>
                setSelectedDifficulty((prev) => (prev === d ? "" : d))
              }
              className={`px-3 py-1 text-xs font-medium border transition-colors ${
                selectedDifficulty === d
                  ? difficultyColors[d]
                  : "text-[#737373] border-[#1f1f1f] hover:text-[#f5f5f5] hover:border-[#737373]"
              }`}
            >
              {d}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {topics.map((topic) => (
            <button
              key={topic}
              onClick={() => toggleTopic(topic)}
              className={`px-3 py-1 text-xs font-medium border transition-colors ${
                selectedTopics.includes(topic)
                  ? "bg-[#84cc16]/10 text-[#84cc16] border-[#84cc16]/20"
                  : "text-[#737373] border-[#1f1f1f] hover:text-[#f5f5f5] hover:border-[#737373]"
              }`}
            >
              {topic}
            </button>
          ))}
        </div>
      </div>

      {/* problem grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((problem) => (
          <div
            key={problem.slug}
            className="bg-[#141414] border border-[#1f1f1f] p-5 flex flex-col justify-between hover:border-[#84cc16]/30 transition-colors group"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-[#f5f5f5] group-hover:text-[#84cc16] transition-colors">
                  {problem.title}
                </h3>
                <Badge
                  variant="outline"
                  className={`text-[10px] ${difficultyColors[problem.difficulty]}`}
                >
                  {problem.difficulty}
                </Badge>
              </div>
              <p className="text-xs text-[#737373] leading-relaxed mb-4">
                {problem.description}
              </p>
              <div className="flex flex-wrap gap-1.5 mb-4">
                {problem.topics.map((t) => (
                  <span
                    key={t}
                    className="text-[10px] px-2 py-0.5 bg-[#1f1f1f] text-[#737373] border border-[#1f1f1f]"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
            <Link href={`/coach/${problem.slug}`}>
              <Button
                size="sm"
                className="w-full bg-[#84cc16] text-[#0a0a0a] font-medium hover:bg-[#84cc16]/90 text-xs"
              >
                Start coaching
              </Button>
            </Link>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <p className="text-[#737373]">No problems match your filters.</p>
          <button
            onClick={() => {
              setSelectedTopics([]);
              setSelectedDifficulty("");
            }}
            className="text-[#84cc16] text-sm mt-2 hover:underline"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}
