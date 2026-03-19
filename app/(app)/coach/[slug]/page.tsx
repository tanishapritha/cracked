"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import { getProblemBySlug } from "@/lib/problems";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import type { ChatMessage, CoachStage } from "@/lib/types";
import dynamic from "next/dynamic";
import { toast } from "sonner";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="h-full bg-[#1e1e1e] flex items-center justify-center text-[#737373] text-sm">
      Loading editor...
    </div>
  ),
});

const stageLabels = [
  "Problem",
  "Initial Read",
  "Diagnosis",
  "Walkthrough",
  "Coding",
  "Debrief",
];

const difficultyColors: Record<string, string> = {
  Easy: "text-[#22c55e]",
  Medium: "text-[#f59e0b]",
  Hard: "text-[#ef4444]",
};

export default function CoachPage() {
  const { slug } = useParams<{ slug: string }>();
  const problem = getProblemBySlug(slug);

  const [stage, setStage] = useState<CoachStage>(1);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [language, setLanguage] = useState<"python" | "javascript" | "java">("python");
  const [code, setCode] = useState("");
  const [timer, setTimer] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [sessionStartTime] = useState(Date.now());
  const [sessionEnded, setSessionEnded] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // set starter code
  useEffect(() => {
    if (problem) {
      setCode(problem.starter_code[language]);
    }
  }, [problem, language]);

  // auto scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // timer for stage 5
  useEffect(() => {
    if (!timerActive) return;
    const interval = setInterval(() => setTimer((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, [timerActive]);

  // start with stage 1 coach message
  useEffect(() => {
    if (problem && messages.length === 0) {
      const introMessage: ChatMessage = {
        role: "coach",
        content: `Here's your problem: **${problem.title}** (${problem.difficulty})\n\nTopics: ${problem.topics.join(", ")}\n\n[Read the full problem on LeetCode](${problem.lc_url})\n\n${problem.description}\n\nTake a moment to read through it. When you're ready, I'll ask about your initial thinking.\n\n-- Alex`,
      };
      setMessages([introMessage]);
      setStage(2);
    }
  }, [problem]);

  const sendMessage = useCallback(
    async (content: string, hintLevel?: number) => {
      if (isStreaming || !problem) return;

      const userMsg: ChatMessage = { role: "user", content };
      const updatedMessages = [...messages, userMsg];
      setMessages(updatedMessages);
      setInput("");
      setIsStreaming(true);

      try {
        const response = await fetch("/api/coach/message", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            problem_slug: slug,
            messages: updatedMessages,
            stage,
            hints_used: hintsUsed,
            hint_level: hintLevel,
            code: stage >= 5 ? code : undefined,
          }),
        });

        if (!response.ok) {
          throw new Error("Coach request failed");
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No response stream");

        const decoder = new TextDecoder();
        let coachContent = "";

        setMessages((prev) => [...prev, { role: "coach", content: "" }]);

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          coachContent += chunk;

          setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = {
              role: "coach",
              content: coachContent,
            };
            return updated;
          });
        }

        // advance stage based on context
        if (stage === 2) setStage(3);
        else if (stage === 3 && coachContent.toLowerCase().includes("ready to code")) {
          setStage(5);
          setTimerActive(true);
        } else if (stage === 3) setStage(4);
        else if (stage === 4) {
          setStage(5);
          setTimerActive(true);
        }
      } catch (err) {
        toast.error("Failed to reach the coach. Try again.");
        setMessages((prev) => prev.filter((m) => m.content !== ""));
      } finally {
        setIsStreaming(false);
      }
    },
    [isStreaming, problem, messages, stage, hintsUsed, slug, code]
  );

  const handleHint = (level: number) => {
    if (level > hintsUsed + 1) return;
    setHintsUsed(level);
    const hintPrompts = [
      "Give me a nudge in the right direction. Just a conceptual direction, no specifics.",
      "Give me a hint. Name the right data structure or pattern I should use.",
      "Show me the pseudocode. Step by step, no actual syntax.",
    ];
    sendMessage(hintPrompts[level - 1], level);
  };

  const handleSkipStage2 = () => {
    setStage(3);
    sendMessage("I'd like to skip the initial read and get right to it.");
  };

  const endSession = async (solved: boolean) => {
    setTimerActive(false);
    setSessionEnded(true);

    const durationSeconds = Math.floor((Date.now() - sessionStartTime) / 1000);

    // get debrief from coach
    if (stage < 6) {
      setStage(6);
      await sendMessage(
        solved
          ? "I think I've got a working solution. Can you review my approach?"
          : "I'm stuck and want to wrap up. Can you debrief me on this problem?"
      );
    }

    // record session
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        await fetch("/api/session/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            problem_slug: slug,
            stage_reached: stage,
            hints_used: hintsUsed,
            duration_seconds: durationSeconds,
            solved,
          }),
        });
      }
    } catch (err) {
      console.error("Failed to save session:", err);
    }
  };

  if (!problem) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-3.5rem)] text-[#737373]">
        Problem not found.
      </div>
    );
  }

  const formatTime = (s: number) => {
    const min = Math.floor(s / 60);
    const sec = s % 60;
    return `${min}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div className="h-[calc(100vh-3.5rem)] flex">
      {/* left panel — coach chat */}
      <div className="w-1/2 border-r border-[#1f1f1f] flex flex-col">
        {/* stage indicator */}
        <div className="px-4 py-3 border-b border-[#1f1f1f] flex items-center gap-2">
          {stageLabels.map((label, i) => {
            const stageNum = (i + 1) as CoachStage;
            const isCompleted = stage > stageNum;
            const isCurrent = stage === stageNum;
            return (
              <div key={i} className="flex items-center gap-1.5">
                <div
                  className={`h-1.5 w-8 transition-colors ${
                    isCompleted
                      ? "bg-[#84cc16]"
                      : isCurrent
                      ? "bg-[#f59e0b]"
                      : "bg-[#1f1f1f]"
                  }`}
                  title={label}
                />
              </div>
            );
          })}
          <span className="text-[10px] text-[#737373] ml-2">
            {stageLabels[stage - 1]}
          </span>
        </div>

        {/* chat messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] px-4 py-2.5 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-[#84cc16]/10 text-[#f5f5f5] border border-[#84cc16]/20"
                    : "bg-[#1f1f1f] text-[#f5f5f5] border border-[#1f1f1f]"
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.content}</div>
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        {/* input area */}
        <div className="px-4 py-3 border-t border-[#1f1f1f]">
          {stage === 2 && (
            <div className="flex gap-2 mb-3">
              <Button
                size="sm"
                variant="outline"
                onClick={handleSkipStage2}
                className="text-xs border-[#1f1f1f] text-[#737373] hover:text-[#f5f5f5] hover:bg-[#1f1f1f]"
              >
                Skip to coaching
              </Button>
            </div>
          )}

          <div className="flex gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (input.trim()) sendMessage(input.trim());
                }
              }}
              placeholder={
                sessionEnded
                  ? "Session ended"
                  : "Type your response..."
              }
              disabled={isStreaming || sessionEnded}
              rows={2}
              className="flex-1 bg-[#141414] border border-[#1f1f1f] text-[#f5f5f5] text-sm px-3 py-2 resize-none placeholder:text-[#737373] focus:outline-none focus:border-[#84cc16]/50"
            />
            <Button
              onClick={() => input.trim() && sendMessage(input.trim())}
              disabled={!input.trim() || isStreaming || sessionEnded}
              className="bg-[#84cc16] text-[#0a0a0a] hover:bg-[#84cc16]/90 self-end"
              size="sm"
            >
              Send
            </Button>
          </div>

          {/* hint ladder */}
          <div className="flex items-center justify-between mt-3">
            <div className="flex gap-2">
              <button
                onClick={() => handleHint(1)}
                disabled={hintsUsed >= 1 || isStreaming || sessionEnded}
                className={`text-xs px-3 py-1 border transition-colors ${
                  hintsUsed >= 1
                    ? "border-[#737373]/20 text-[#737373]/40 cursor-not-allowed"
                    : "border-[#1f1f1f] text-[#737373] hover:text-[#f5f5f5] hover:border-[#737373]"
                }`}
              >
                Nudge me
              </button>
              <button
                onClick={() => handleHint(2)}
                disabled={hintsUsed < 1 || hintsUsed >= 2 || isStreaming || sessionEnded}
                className={`text-xs px-3 py-1 border transition-colors ${
                  hintsUsed >= 2
                    ? "border-[#737373]/20 text-[#737373]/40 cursor-not-allowed"
                    : hintsUsed < 1
                    ? "border-[#737373]/10 text-[#737373]/20 cursor-not-allowed"
                    : "border-[#1f1f1f] text-[#737373] hover:text-[#f5f5f5] hover:border-[#737373]"
                }`}
              >
                Give me a hint
              </button>
              <button
                onClick={() => handleHint(3)}
                disabled={hintsUsed < 2 || hintsUsed >= 3 || isStreaming || sessionEnded}
                className={`text-xs px-3 py-1 border transition-colors ${
                  hintsUsed >= 3
                    ? "border-[#737373]/20 text-[#737373]/40 cursor-not-allowed"
                    : hintsUsed < 2
                    ? "border-[#737373]/10 text-[#737373]/20 cursor-not-allowed"
                    : "border-[#1f1f1f] text-[#737373] hover:text-[#f5f5f5] hover:border-[#737373]"
                }`}
              >
                Show pseudocode
              </button>
            </div>

            {/* hint cost indicator */}
            <div className="flex gap-1">
              {[1, 2, 3].map((level) => (
                <div
                  key={level}
                  className={`w-3 h-1.5 ${
                    hintsUsed >= level ? "bg-[#737373]/30" : "bg-[#84cc16]"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* right panel — code editor */}
      <div className="w-1/2 flex flex-col">
        {/* editor toolbar */}
        <div className="px-4 py-3 border-b border-[#1f1f1f] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as "python" | "javascript" | "java")}
              className="bg-[#141414] border border-[#1f1f1f] text-[#f5f5f5] text-xs px-2 py-1 focus:outline-none focus:border-[#84cc16]/50"
            >
              <option value="python">Python</option>
              <option value="javascript">JavaScript</option>
              <option value="java">Java</option>
            </select>
            <Button
              size="sm"
              variant="outline"
              onClick={() => toast.info("Code execution is coming soon. Focus on the logic.")}
              className="text-xs border-[#1f1f1f] text-[#737373] hover:text-[#f5f5f5] hover:bg-[#1f1f1f]"
            >
              Run
            </Button>
          </div>
          <div className="flex items-center gap-4">
            {timerActive && (
              <span className="text-xs font-mono text-[#84cc16]">
                {formatTime(timer)}
              </span>
            )}
            {!sessionEnded && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => endSession(true)}
                  className="text-xs bg-[#22c55e] text-[#0a0a0a] hover:bg-[#22c55e]/90"
                >
                  Submit
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => endSession(false)}
                  className="text-xs border-[#1f1f1f] text-[#737373] hover:text-[#f5f5f5] hover:bg-[#1f1f1f]"
                >
                  I'm done
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* editor */}
        <div className="flex-1">
          <MonacoEditor
            height="100%"
            language={language === "python" ? "python" : language === "java" ? "java" : "javascript"}
            value={code}
            onChange={(value) => setCode(value || "")}
            theme="vs-dark"
            options={{
              fontSize: 14,
              fontFamily: "var(--font-geist-mono), monospace",
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              padding: { top: 16, bottom: 16 },
              lineNumbers: "on",
              renderLineHighlight: "line",
              automaticLayout: true,
              tabSize: 4,
              wordWrap: "on",
            }}
          />
        </div>
      </div>
    </div>
  );
}
