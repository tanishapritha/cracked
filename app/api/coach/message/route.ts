import { NextRequest } from "next/server";
import { getProblemBySlug } from "@/lib/problems";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      problem_slug, 
      messages, 
      mode, 
      hint_level, 
      attempts, 
      time_spent, 
      code,
      mistakes_detected,
      user_key
    } = body;

    const problem = getProblemBySlug(problem_slug);
    if (!problem) {
      return new Response("Problem not found", { status: 404 });
    }

    // Determine API Key Priority
    let apiKey = user_key || process.env.ANTHROPIC_API_KEY;
    let apiUrl = "https://openrouter.ai/api/v1/chat/completions";
    let model = "nvidia/nemotron-3-nano-30b-a3b:free";
    let isFallback = false;

    if (!apiKey) return new Response("API key not configured", { status: 500 });

    const systemPrompt = `You are an AI coding coach integrated inside a LeetCode-style platform.
Your role is NOT to solve problems. Your role is to guide the user step-by-step like a coach sitting beside them.

Problem: ${problem.title}
Context: ${problem.coach_context}

## CORE RULES
* Never give the full solution unless explicitly told MODE: ENDGAME
* Never dump complete code
* Keep responses short (1–3 sentences ideally)
* Adapt to user’s current progress
* Only give the NEXT SMALL HINT, not all at once
* Prefer questions over statements

## MODES
Current Mode: ${mode || 'CODING'}
Hint Level: ${hint_level || 1}
Attempts: ${attempts || 0}
Time Spent: ${time_spent || 0}s
Mistakes Detected: ${mistakes_detected?.join(', ') || 'None'}

### Behavior per Mode:
1. CODING:
   - User is actively writing. If they are on track, do not interrupt (or offer subtle encouragement).
   - If going wrong, give a small directional hint ONLY. Do NOT mention full approach.
2. HINT_REQUEST:
   - Level 1: Direction | Level 2: Strategy | Level 3: Data Structure | Level 4: Pseudocode idea | Level 5: Almost solution.
   - Only give content for THAT level.
3. EXPLAIN_PROBLEM:
   - Step 1: Simplify in English | Step 2: Walk through example | Step 3: Ask guiding question | Step 4: Suggest thinking direction.
   - STOP after each step and wait for user.
4. DEBUG:
   - Explain error in simple terms, point to location, ask guiding question.
5. GIVE_UP:
   - Provide full approach, clean solution code, and step-by-step explanation.
6. ENDGAME:
   - This is the reflection phase after showing the solution. Ask a reflection question.

${code ? `\nUser's current code:\n\`\`\`\n${code}\n\`\`\`` : ""}

Tone: Short, Clear, Encouraging, Not robotic.

CRITICAL: Every response MUST start with either [STATUS: ON_TRACK] or [STATUS: OFF_TRACK] followed by your message.
- Use ON_TRACK if the user's logic is heading the right way or they've chosen the correct data structure, even if there's a small syntax typo.
- Use OFF_TRACK only for significant logic gaps, using the wrong data structure for the problem, or total nonsense characters.

${body.is_silent ? "CRITICAL: The user is currently typing. ONLY provide the [STATUS] tag and a max 5-word reason. Do NOT give long hints yet." : ""}
`;

    const llmMessages = [
      {
        role: "user",
        content: `[COACH GUIDELINES]: ${systemPrompt}\n\n[Start conversation]`,
      },
      ...messages.map((m: { role: string; content: string }) => ({
        role: m.role === "coach" ? "assistant" : "user",
        content: m.content,
      })),
    ];

    let response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://cracked.dev",
        "X-Title": "crackeddev",
      },
      body: JSON.stringify({
        model,
        messages: llmMessages,
        stream: true,
        max_tokens: 1024,
        temperature: 0.7,
      }),
    });

    // --- FALLBACK TO GROQ (Only if not using user_key) ---
    if (!response.ok && !user_key && process.env.GROQ_API_KEY) {
      isFallback = true;
      apiKey = process.env.GROQ_API_KEY;
      apiUrl = "https://api.groq.com/openai/v1/chat/completions";
      model = "llama-3.3-70b-versatile";

      response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: llmMessages,
          stream: true,
          max_tokens: 1024,
          temperature: 0.7,
        }),
      });
    }

    if (!response.ok) return new Response("Coach temporarily unavailable", { status: 502 });

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        if (isFallback) controller.enqueue(encoder.encode("[FALLBACK_INIT] "));
        const reader = response.body?.getReader();
        if (!reader) return controller.close();
        const decoder = new TextDecoder();
        let buffer = "";
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";
            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const data = line.slice(6).trim();
                if (data === "[DONE]") continue;
                try {
                  const json = JSON.parse(data);
                  const content = json.choices?.[0]?.delta?.content;
                  if (content) controller.enqueue(encoder.encode(content));
                } catch {}
              }
            }
          }
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-cache" },
    });
  } catch (err) {
    return new Response("Internal server error", { status: 500 });
  }
}
