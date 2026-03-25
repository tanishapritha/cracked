"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import { getProblemBySlug } from "@/lib/problems";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ChatMessage, CoachStep } from "@/lib/types";
import { STEP_LABELS } from "@/lib/types";
import dynamic from "next/dynamic";
import { toast } from "sonner";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="h-full bg-[#0a0a0a] flex items-center justify-center text-[#525252] text-sm">
      Loading editor...
    </div>
  ),
});

const difficultyColors: Record<string, string> = {
  Easy: "text-[#22c55e]",
  Medium: "text-[#f59e0b]",
  Hard: "text-[#ef4444]",
};

export default function CoachPage() {
  const { slug } = useParams<{ slug: string }>();
  const problem = getProblemBySlug(slug);

  const [step, setStep] = useState<CoachStep>(1);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [language, setLanguage] = useState<"python" | "javascript" | "java">("python");
  const [code, setCode] = useState("");
  const [timer, setTimer] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [sessionStartTime] = useState(Date.now());
  const [sessionEnded, setSessionEnded] = useState(false);
  const [showProblem, setShowProblem] = useState(true);
  const [buildSubStep, setBuildSubStep] = useState(1);

  // Mobile tab
  const [activeTab, setActiveTab] = useState<"coach" | "code">("coach");

  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Set starter code
  useEffect(() => {
    if (problem) setCode(problem.starter_code[language]);
  }, [problem, language]);

  // Auto scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Timer
  useEffect(() => {
    if (!timerActive) return;
    const interval = setInterval(() => setTimer((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, [timerActive]);

  // Kick off step 1 automatically
  useEffect(() => {
    if (problem && messages.length === 0) {
      const intro: ChatMessage = {
        role: "coach",
        type: "problem-intro",
        content: "",
      };
      setMessages([intro]);
      // Auto-send the first coach message
      sendToCoach("Let's start. Help me understand this problem.", "understand");
    }
  }, [problem]);

  const sendToCoach = useCallback(
    async (content: string, action?: string) => {
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
            messages: updatedMessages.filter((m) => m.type !== "problem-intro"),
            step,
            action: action || "chat",
            code: step >= 4 ? code : undefined,
            buildSubStep: step === 4 ? buildSubStep : undefined,
          }),
        });

        if (!response.ok) throw new Error("Coach request failed");

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No stream");

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
            updated[updated.length - 1] = { role: "coach", content: coachContent };
            return updated;
          });
        }
      } catch {
        toast.error("Coach is temporarily unavailable. Try again.");
        setMessages((prev) => prev.filter((m) => m.content !== ""));
      } finally {
        setIsStreaming(false);
      }
    },
    [isStreaming, problem, messages, step, slug, code, buildSubStep]
  );

  // Action handlers
  const handleIGotIt = () => {
    if (step < 4) {
      sendToCoach("I understand this part. Let's move to the next step.");
      advanceStep();
    } else if (step === 4) {
      sendToCoach("I got it, I'll write this part now.");
      setActiveTab("code");
      if (!timerActive) setTimerActive(true);
    }
  };

  const handleShowMe = () => {
    sendToCoach(
      step === 4
        ? `Show me the code for this step (build sub-step ${buildSubStep}).`
        : "Show me — I'm stuck on this part.",
      "show_me"
    );
  };

  const handleExplainMore = () => {
    sendToCoach("Can you explain this more? I'm not fully getting it.", "explain_more");
  };

  const handleDoneWithStep = () => {
    if (step === 4) {
      setBuildSubStep((s) => s + 1);
      sendToCoach(`I've written the code for this part. What's the next step?`);
    } else {
      advanceStep();
      sendToCoach("I'm done with this step. Let's continue.");
    }
  };

  const handleSkipToCode = () => {
    setStep(4);
    setTimerActive(true);
    sendToCoach("I want to skip ahead and start coding. Guide me through building the solution step by step.");
  };

  const advanceStep = () => {
    if (step < 6) {
      const next = (step + 1) as CoachStep;
      setStep(next);
      if (next === 4) setTimerActive(true);
    }
  };

  const endSession = async (solved: boolean) => {
    setTimerActive(false);
    setSessionEnded(true);

    const durationSeconds = Math.floor((Date.now() - sessionStartTime) / 1000);

    if (step < 6) {
      setStep(6);
      await sendToCoach(
        solved
          ? "I think I've got a working solution. Can you review my code?"
          : "I'm stuck. Can you debrief me on this problem and show me what I missed?"
      );
    }

    try {
      await fetch("/api/session/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problem_slug: slug,
          stage_reached: step,
          hints_used: 0,
          duration_seconds: durationSeconds,
          solved,
        }),
      });
    } catch (err) {
      console.error("Failed to save session:", err);
    }
  };

  if (!problem) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-3.5rem)] text-[#525252]">
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
    <div className="h-[calc(100vh-3.5rem)] flex flex-col md:flex-row bg-black">
      {/* Mobile tabs */}
      <div className="md:hidden flex border-b-2 border-[#1a1a1a] bg-[#050505]">
        <button
          onClick={() => setActiveTab("coach")}
          className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest transition-colors ${
            activeTab === "coach"
              ? "text-[#84cc16] border-b-2 border-[#84cc16]"
              : "text-[#525252]"
          }`}
        >
          Coach
        </button>
        <button
          onClick={() => setActiveTab("code")}
          className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest transition-colors ${
            activeTab === "code"
              ? "text-[#84cc16] border-b-2 border-[#84cc16]"
              : "text-[#525252]"
          }`}
        >
          Code
        </button>
      </div>

      {/* ============ LEFT: COACH PANEL ============ */}
      <div
        className={`w-full md:w-1/2 border-r-2 border-[#1a1a1a] flex flex-col bg-[#050505] ${
          activeTab === "coach" ? "flex" : "hidden md:flex"
        }`}
      >
        {/* Step tracker */}
        <div className="px-4 py-3 border-b-2 border-[#1a1a1a] bg-[#080808]">
          <div className="flex items-center gap-1">
            {([1, 2, 3, 4, 5, 6] as CoachStep[]).map((s) => (
              <button
                key={s}
                disabled
                className={`flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all ${
                  s === step
                    ? "bg-[#84cc16] text-black"
                    : s < step
                    ? "bg-[#1a1a1a] text-[#84cc16]"
                    : "bg-[#0a0a0a] text-[#333333]"
                }`}
              >
                <span className="w-4 h-4 flex items-center justify-center text-[9px] font-black border border-current/30">
                  {s < step ? "✓" : s}
                </span>
                <span className="hidden sm:inline">{STEP_LABELS[s]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Chat messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.type === "problem-intro" ? (
                <div className="bg-[#080808] border border-[#1a1a1a] p-4 w-full space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-[#f5f5f5]">
                      {problem.title}
                    </h2>
                    <Badge
                      variant="outline"
                      className={`text-[9px] font-bold uppercase tracking-wider ${
                        difficultyColors[problem.difficulty]
                      } border-current/20`}
                    >
                      {problem.difficulty}
                    </Badge>
                  </div>
                  <button
                    onClick={() => setShowProblem(!showProblem)}
                    className="text-[10px] text-[#525252] hover:text-[#84cc16] transition-colors uppercase tracking-widest font-bold"
                  >
                    {showProblem ? "▼ Hide problem" : "▶ Show problem"}
                  </button>
                  {showProblem && (
                    <div className="space-y-3">
                      <p className="text-sm text-[#d4d4d4] leading-relaxed whitespace-pre-wrap">
                        {problem.description}
                      </p>
                      {problem.examples?.map((ex: any, j: number) => (
                        <div key={j} className="bg-[#0a0a0a] border border-[#1a1a1a] p-3 font-mono text-xs text-[#a3a3a3] space-y-1">
                          <div>
                            <span className="text-[#525252]">Input: </span>
                            {ex.input}
                          </div>
                          <div>
                            <span className="text-[#525252]">Output: </span>
                            {ex.output}
                          </div>
                        </div>
                      ))}
                      <a
                        href={problem.lc_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-[#525252] hover:text-[#84cc16] transition-colors"
                      >
                        View on LeetCode ↗
                      </a>
                    </div>
                  )}
                </div>
              ) : (
                <div
                  className={`max-w-[90%] px-4 py-3 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-[#84cc16]/8 text-[#e5e5e5] border border-[#84cc16]/15"
                      : "bg-[#111111] text-[#e5e5e5] border border-[#1a1a1a]"
                  }`}
                >
                  {msg.role === "coach" && (
                    <div className="text-[9px] font-bold text-[#84cc16] uppercase tracking-widest mb-1.5">
                      Alex
                    </div>
                  )}
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                </div>
              )}
            </div>
          ))}
          {isStreaming && (
            <div className="flex justify-start">
              <div className="bg-[#111111] border border-[#1a1a1a] px-4 py-3 text-sm">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-[#84cc16] rounded-full animate-pulse" />
                  <span className="w-1.5 h-1.5 bg-[#84cc16] rounded-full animate-pulse delay-150" />
                  <span className="w-1.5 h-1.5 bg-[#84cc16] rounded-full animate-pulse delay-300" />
                </div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* ============ ACTION BAR ============ */}
        <div className="border-t-2 border-[#1a1a1a] bg-[#080808]">
          {/* Quick action buttons */}
          {!sessionEnded && (
            <div className="px-4 py-3 flex flex-wrap gap-2">
              {step <= 3 && (
                <>
                  <button
                    onClick={handleIGotIt}
                    disabled={isStreaming}
                    className="px-4 py-2 text-xs font-bold uppercase tracking-wider bg-[#84cc16] text-black hover:bg-[#a3e635] transition-colors disabled:opacity-30"
                  >
                    ✓ I get it
                  </button>
                  <button
                    onClick={handleShowMe}
                    disabled={isStreaming}
                    className="px-4 py-2 text-xs font-bold uppercase tracking-wider bg-[#f59e0b]/15 text-[#f59e0b] border border-[#f59e0b]/30 hover:bg-[#f59e0b]/25 transition-colors disabled:opacity-30"
                  >
                    Show me
                  </button>
                  <button
                    onClick={handleExplainMore}
                    disabled={isStreaming}
                    className="px-4 py-2 text-xs font-bold uppercase tracking-wider bg-[#1a1a1a] text-[#737373] hover:text-[#e5e5e5] transition-colors disabled:opacity-30"
                  >
                    Explain more
                  </button>
                  <button
                    onClick={handleSkipToCode}
                    disabled={isStreaming}
                    className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#525252] hover:text-[#737373] transition-colors disabled:opacity-30 ml-auto"
                  >
                    Skip to code →
                  </button>
                </>
              )}
              {step === 4 && (
                <>
                  <button
                    onClick={handleIGotIt}
                    disabled={isStreaming}
                    className="px-4 py-2 text-xs font-bold uppercase tracking-wider bg-[#84cc16] text-black hover:bg-[#a3e635] transition-colors disabled:opacity-30"
                  >
                    ✓ I got it — let me code
                  </button>
                  <button
                    onClick={handleShowMe}
                    disabled={isStreaming}
                    className="px-4 py-2 text-xs font-bold uppercase tracking-wider bg-[#f59e0b]/15 text-[#f59e0b] border border-[#f59e0b]/30 hover:bg-[#f59e0b]/25 transition-colors disabled:opacity-30"
                  >
                    Show me this step
                  </button>
                  <button
                    onClick={handleDoneWithStep}
                    disabled={isStreaming}
                    className="px-4 py-2 text-xs font-bold uppercase tracking-wider bg-[#22c55e]/15 text-[#22c55e] border border-[#22c55e]/30 hover:bg-[#22c55e]/25 transition-colors disabled:opacity-30"
                  >
                    ✓ Done — next step
                  </button>
                </>
              )}
              {step === 5 && (
                <>
                  <button
                    onClick={handleIGotIt}
                    disabled={isStreaming}
                    className="px-4 py-2 text-xs font-bold uppercase tracking-wider bg-[#84cc16] text-black hover:bg-[#a3e635] transition-colors disabled:opacity-30"
                  >
                    ✓ I covered the edge cases
                  </button>
                  <button
                    onClick={handleShowMe}
                    disabled={isStreaming}
                    className="px-4 py-2 text-xs font-bold uppercase tracking-wider bg-[#f59e0b]/15 text-[#f59e0b] border border-[#f59e0b]/30 hover:bg-[#f59e0b]/25 transition-colors disabled:opacity-30"
                  >
                    What am I missing?
                  </button>
                </>
              )}
            </div>
          )}

          {/* Free text input */}
          <div className="px-4 py-3 border-t border-[#1a1a1a]">
            <div className="flex gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (input.trim()) sendToCoach(input.trim());
                  }
                }}
                placeholder={sessionEnded ? "Session ended" : "Ask Alex anything..."}
                disabled={isStreaming || sessionEnded}
                rows={1}
                className="flex-1 bg-[#0a0a0a] border border-[#1a1a1a] text-[#f5f5f5] text-sm px-3 py-2.5 resize-none placeholder:text-[#333333] focus:outline-none focus:border-[#84cc16]/40"
              />
              <Button
                onClick={() => input.trim() && sendToCoach(input.trim())}
                disabled={!input.trim() || isStreaming || sessionEnded}
                className="bg-[#84cc16] text-black hover:bg-[#a3e635] font-bold self-end"
                size="sm"
              >
                Send
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ============ RIGHT: CODE PANEL ============ */}
      <div
        className={`w-full md:w-1/2 flex flex-col bg-black ${
          activeTab === "code" ? "flex" : "hidden md:flex"
        }`}
      >
        {/* Toolbar */}
        <div className="px-4 py-3 border-b-2 border-[#1a1a1a] flex items-center justify-between bg-[#080808]">
          <div className="flex items-center gap-3">
            <select
              value={language}
              onChange={(e) =>
                setLanguage(e.target.value as "python" | "javascript" | "java")
              }
              className="bg-[#0a0a0a] border border-[#1a1a1a] text-[#f5f5f5] text-xs px-2.5 py-1.5 focus:outline-none focus:border-[#84cc16]/40 font-bold"
            >
              <option value="python">Python</option>
              <option value="javascript">JavaScript</option>
              <option value="java">Java</option>
            </select>
            {timerActive && (
              <span className="text-xs font-mono font-bold text-[#84cc16] bg-[#84cc16]/10 px-2.5 py-1">
                {formatTime(timer)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {step === 4 && (
              <span className="text-[10px] font-bold text-[#525252] uppercase tracking-widest mr-2">
                Build step {buildSubStep}
              </span>
            )}
            {!sessionEnded && (
              <>
                <Button
                  size="sm"
                  onClick={() => {
                    handleDoneWithStep();
                    setActiveTab("coach");
                  }}
                  className="text-xs bg-[#22c55e] text-black hover:bg-[#22c55e]/90 font-bold"
                >
                  ✓ Done
                </Button>
                <Button
                  size="sm"
                  onClick={() => endSession(true)}
                  className="text-xs bg-[#84cc16] text-black hover:bg-[#a3e635] font-bold"
                >
                  Submit Solution
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => endSession(false)}
                  className="text-xs border-[#1a1a1a] text-[#525252] hover:text-[#f5f5f5] hover:bg-[#1a1a1a]"
                >
                  Give up
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Monaco Editor */}
        <div className="flex-1">
          <MonacoEditor
            height="100%"
            language={
              language === "python"
                ? "python"
                : language === "java"
                ? "java"
                : "javascript"
            }
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
