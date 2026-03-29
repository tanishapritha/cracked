"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import { getProblemBySlug } from "@/lib/problems";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ChatMessage } from "@/lib/types";
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

  const [mode, setMode] = useState<"CODING" | "HINT_REQUEST" | "EXPLAIN_PROBLEM" | "DEBUG" | "GIVE_UP" | "ENDGAME">("CODING");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [language, setLanguage] = useState<"python" | "javascript" | "java" | "cpp">("cpp");
  const [code, setCode] = useState("");
  const [timer, setTimer] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [sessionStartTime] = useState(Date.now());
  const [sessionEnded, setSessionEnded] = useState(false);
  const [showProblem, setShowProblem] = useState(true);
  const [hintLevel, setHintLevel] = useState(1);
  const [attempts, setAttempts] = useState(0);
  const [trackStatus, setTrackStatus] = useState<"ON_TRACK" | "OFF_TRACK" | null>(null);
  const [isCheckingTrack, setIsCheckingTrack] = useState(false);
  const [apiError, setApiError] = useState(false);
  const [lastSilentHint, setLastSilentHint] = useState("");

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

  // Time auto check
  const lastCheckedCodeRef = useRef("");
  useEffect(() => {
    if (sessionEnded || mode !== "CODING" || isStreaming || !code) return;
    if (code === lastCheckedCodeRef.current) return;

    const pulseTimer = setTimeout(() => {
      lastCheckedCodeRef.current = code;
      sendToCoach("[BACKGROUND_CHECK]", "CODING");
    }, 8000); // 8 second chill period

    return () => clearTimeout(pulseTimer);
  }, [code, isStreaming, sessionEnded, mode]);

  // Timer
  useEffect(() => {
    if (!timerActive) return;
    const interval = setInterval(() => setTimer((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, [timerActive]);

  // Kick off intro
  useEffect(() => {
    if (problem && messages.length === 0) {
      const intro: ChatMessage = {
        role: "coach",
        type: "problem-intro",
        content: "",
      };
      setMessages([intro]);
      sendToCoach("I'm ready to learn. Explain the problem to me first.", "EXPLAIN_PROBLEM");
    }
  }, [problem]);

  const sendToCoach = useCallback(
    async (content: string, overrideMode?: typeof mode) => {
      if (isStreaming || !problem) return;

      const userMsg: ChatMessage = { role: "user", content };
      const updatedMessages = [...messages, userMsg];
      setMessages(updatedMessages);
      setInput("");
      setIsStreaming(true);

      const currentMode = overrideMode || mode;
      const isSilent = overrideMode === "CODING" && content === "[BACKGROUND_CHECK]";

      try {
        const response = await fetch("/api/coach/message", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            problem_slug: slug,
            messages: updatedMessages.filter((m) => m.type !== "problem-intro"),
            mode: currentMode,
            hint_level: hintLevel,
            attempts,
            time_spent: timer,
            code: code,
            is_silent: isSilent
          }),
        });

        if (!response.ok) throw new Error("Coach request failed");

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No stream");

        const decoder = new TextDecoder();
        let coachContent = "";

        if (!isSilent) setMessages((prev) => [...prev, { role: "coach", content: "" }]);

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          coachContent += chunk;

          // Extract Status Tag and Strip it (even in silent mode)
          let strippedContent = coachContent;
          if (coachContent.includes("[STATUS: ON_TRACK]")) {
            setTrackStatus("ON_TRACK");
            strippedContent = coachContent.replace("[STATUS: ON_TRACK]", "").trim();
          } else if (coachContent.includes("[STATUS: OFF_TRACK]")) {
            setTrackStatus("OFF_TRACK");
            strippedContent = coachContent.replace("[STATUS: OFF_TRACK]", "").trim();
          }

          if (isSilent) {
            setLastSilentHint(strippedContent);
          } else {
            setMessages((prev) => {
              const updated = [...prev];
              updated[updated.length - 1] = { role: "coach", content: strippedContent };
              return updated;
            });
          }
        }
      } catch (err) {
        if (!isSilent) {
          setApiError(true);
          setMessages((prev) => [
            ...prev.filter((m) => m.content !== ""),
            {
              role: "coach",
              content: "⚠️ **Our AI key is currently exhausted or rate-limited.**\n\nTo continue your session without interruption, you can add your own free API key in your settings (coming soon) or directly in your environment. \n\n**Get a free key here:**\n- [Gemini (Google) Key](https://aistudio.google.com/app/apikey)\n- [Groq AI Key](https://console.groq.com/keys)\n- [OpenRouter Key](https://openrouter.ai/keys)\n\nWe apologize for the interruption! — Alex",
            },
          ]);
        }
      } finally {
        setIsStreaming(false);
      }
    },
    [isStreaming, problem, messages, slug, mode, hintLevel, attempts, timer, code]
  );

  const handleHint = () => {
    setMode("HINT_REQUEST");
    sendToCoach("I'd like a hint, please.", "HINT_REQUEST");
    setHintLevel(Math.min(5, hintLevel + 1));
  };

  const handleExplain = () => {
    setMode("EXPLAIN_PROBLEM");
    sendToCoach("Can you explain the problem to me?", "EXPLAIN_PROBLEM");
  };

  const handleDebug = () => {
    setMode("DEBUG");
    setAttempts(a => a + 1);
    sendToCoach("My code isn't working. Can you help me debug it?", "DEBUG");
  };

  const handleGiveUp = () => {
    setMode("GIVE_UP");
    sendToCoach("I give up. Show me the full solution.", "GIVE_UP");
  };

  const endSession = async (solved: boolean) => {
    setTimerActive(false);
    setSessionEnded(true);

    const durationSeconds = Math.floor((Date.now() - sessionStartTime) / 1000);

    setMode("ENDGAME");
    await sendToCoach(
      solved
        ? "I think I've got it!"
        : "I'm wrapping up this session.",
      "ENDGAME"
    );

    try {
      await fetch("/api/session/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problem_slug: slug,
          stage_reached: mode === "GIVE_UP" ? 6 : 4,
          hints_used: hintLevel - 1,
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
    <div className="h-[calc(100vh-3.5rem)] bg-black p-4 lg:p-6">
      <div className="h-full flex flex-col md:flex-row gap-4 lg:gap-6 overflow-hidden">
        {/* Mobile tabs */}
        <div className="md:hidden flex rounded-xl border border-[#1a1a1a] bg-[#050505] overflow-hidden shrink-0">
          <button
            onClick={() => setActiveTab("coach")}
            className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest transition-colors ${
              activeTab === "coach"
                ? "text-[#84cc16] bg-[#84cc16]/5 border-b-2 border-[#84cc16]"
                : "text-[#525252]"
            }`}
          >
            Coach
          </button>
          <button
            onClick={() => setActiveTab("code")}
            className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest transition-colors ${
              activeTab === "code"
                ? "text-[#84cc16] bg-[#84cc16]/5 border-b-2 border-[#84cc16]"
                : "text-[#525252]"
            }`}
          >
            Code
          </button>
        </div>

        {/* ============ LEFT: COACH PANEL ============ */}
        <div
          className={`w-full md:w-1/2 border border-[#1a1a1a] flex flex-col bg-[#050505] rounded-2xl overflow-hidden shadow-2xl relative ${
            activeTab === "coach" ? "flex" : "hidden md:flex"
          }`}
        >
          {/* Hint Tracker */}
          <div className="px-6 py-4 border-b border-[#1a1a1a] bg-[#080808]">
            <div className="flex items-center justify-between gap-4">
              <div className="flex gap-1.5 flex-1">
                {[1, 2, 3, 4, 5].map((l) => (
                  <div 
                    key={l} 
                    className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${l < hintLevel ? 'bg-[#84cc16]' : l === hintLevel ? 'bg-[#84cc16]/30' : 'bg-[#1a1a1a]'}`} 
                  />
                ))}
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#525252]">
                Hint level {hintLevel}
              </span>
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
          {!sessionEnded && (
            <div className="px-5 py-4 border-t border-[#1a1a1a] bg-[#080808] flex flex-wrap gap-2.5">
              <button
                onClick={handleExplain}
                disabled={isStreaming}
                className="px-4 py-2 text-[10px] font-black uppercase tracking-widest bg-[#1a1a1a] text-[#737373] hover:text-[#f5f5f5] rounded-lg transition-all border border-transparent hover:border-[#1f1f1f]"
              >
                Explain
              </button>
              <button
                onClick={handleHint}
                disabled={isStreaming || hintLevel > 5}
                className="px-4 py-2 text-[10px] font-black uppercase tracking-widest bg-[#f59e0b]/10 text-[#f59e0b] border border-[#f59e0b]/20 hover:bg-[#f59e0b]/20 rounded-lg transition-all"
              >
                Hint
              </button>
              <button
                onClick={handleDebug}
                disabled={isStreaming || !code}
                className="px-4 py-2 text-[10px] font-black uppercase tracking-widest bg-[#3b82f6]/10 text-[#3b82f6] border border-[#3b82f6]/20 hover:bg-[#3b82f6]/20 rounded-lg transition-all"
              >
                Debug
              </button>
              <button
                onClick={handleGiveUp}
                disabled={isStreaming}
                className="px-4 py-2 text-[10px] font-black uppercase tracking-widest bg-[#ef4444]/10 text-[#ef4444] border border-[#ef4444]/20 hover:bg-[#ef4444]/20 rounded-lg transition-all ml-auto"
              >
                Give Up
              </button>
            </div>
          )}

          {/* Free text input */}
          <div className="px-4 py-3 border-t border-[#1a1a1a] bg-[#050505]">
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
                className="flex-1 bg-[#0a0a0a] border border-[#1a1a1a] text-[#f5f5f5] text-sm px-4 py-3 rounded-lg resize-none placeholder:text-[#333333] focus:outline-none focus:border-[#84cc16]/40 transition-all font-medium"
              />
              <Button
                onClick={() => input.trim() && sendToCoach(input.trim())}
                disabled={!input.trim() || isStreaming || sessionEnded}
                className="bg-[#84cc16] text-black hover:bg-[#a3e635] font-black h-auto px-6 rounded-lg self-stretch"
                size="sm"
              >
                Send
              </Button>
            </div>
          </div>
        </div>

        {/* ============ RIGHT: CODE PANEL ============ */}
        <div
          className={`w-full md:w-1/2 flex flex-col bg-[#050505] border border-[#1a1a1a] rounded-2xl overflow-hidden shadow-2xl ${
            activeTab === "code" ? "flex" : "hidden md:flex"
          }`}
        >
          {/* Toolbar */}
          <div className="px-5 py-3.5 border-b border-[#1a1a1a] flex items-center justify-between bg-[#080808]">
            <div className="flex items-center gap-3">
              <select
                value={language}
                onChange={(e) =>
                  setLanguage(e.target.value as any)
                }
                className="bg-[#0a0a0a] border border-[#1a1a1a] text-[#f5f5f5] text-xs px-2.5 py-1.5 focus:outline-none focus:border-[#84cc16]/40 font-bold rounded-md"
              >
                <option value="cpp">C++</option>
                <option value="python">Python</option>
                <option value="javascript">JavaScript</option>
                <option value="java">Java</option>
              </select>
              {timerActive && (
                <span className="text-xs font-mono font-bold text-[#84cc16] bg-[#84cc16]/10 px-2.5 py-1 rounded-full">
                  {formatTime(timer)}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {!sessionEnded && (
                <>
                  <Button
                    size="sm"
                    onClick={() => endSession(true)}
                    className="text-[10px] bg-[#84cc16] text-black hover:bg-[#a3e635] font-black uppercase tracking-wider px-4 shadow-[0_0_15px_rgba(132,204,22,0.2)]"
                  >
                    Submit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => endSession(false)}
                    className="text-[10px] border-[#1a1a1a] text-[#525252] hover:text-[#f5f5f5] hover:bg-[#1a1a1a] uppercase font-black tracking-wider px-4"
                  >
                    Quit
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Monaco Editor */}
          <div className="flex-1 relative group">
            <MonacoEditor
              height="100%"
              language={
                language === "cpp"
                  ? "cpp"
                  : language === "python"
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
                padding: { top: 24, bottom: 24 },
                lineNumbers: "on",
                renderLineHighlight: "line",
                automaticLayout: true,
                tabSize: 4,
                wordWrap: "on",
              }}
            />

            {/* LIVE PULSE BUBBLE */}
            <div className="absolute bottom-6 right-6 flex flex-col items-end gap-3 pointer-events-none">
              {trackStatus && (
                <div 
                  className={`pointer-events-auto flex items-center gap-2 px-3 py-2 rounded-full border shadow-2xl transition-all duration-300 transform animate-in fade-in slide-in-from-bottom-2 ${
                    trackStatus === "ON_TRACK" 
                      ? "bg-[#84cc16]/10 border-[#84cc16]/30 text-[#84cc16]" 
                      : "bg-[#ef4444]/10 border-[#ef4444]/30 text-[#ef4444] cursor-help hover:scale-105 active:scale-95"
                  }`}
                  onClick={() => {
                    if (trackStatus === "OFF_TRACK") {
                      setActiveTab("coach");
                      if (lastSilentHint) {
                        setMessages(prev => [...prev, { role: "coach", content: `Alex noticed: ${lastSilentHint}` }]);
                        setLastSilentHint(""); // Clear it so it doesn't duplicate
                      }
                    }
                  }}
                >
                  <div className={`w-2 h-2 rounded-full animate-pulse ${
                    trackStatus === "ON_TRACK" ? "bg-[#84cc16]" : "bg-[#ef4444]"
                  }`} />
                  <span className="text-[10px] font-black uppercase tracking-widest">
                    {trackStatus === "ON_TRACK" ? "On Track" : "Wrong Direction"}
                  </span>
                  {trackStatus === "OFF_TRACK" && (
                    <span className="text-[9px] bg-[#ef4444]/20 px-1.5 py-0.5 rounded ml-1 animate-bounce">
                      Ask Alex
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
