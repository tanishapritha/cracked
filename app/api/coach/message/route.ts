import { NextRequest } from "next/server";
import { getProblemBySlug } from "@/lib/problems";

export const runtime = "edge";

const STEP_INSTRUCTIONS: Record<number, string> = {
  1: `STEP 1 — UNDERSTAND
You are helping the user understand the problem. Ask them: "In your own words, what is this problem really asking?" 
If they explain it well, praise them and say "Great, let's move on to thinking about an approach."
If they're off track, gently rephrase the problem for them.
Keep it conversational, 2-3 sentences max.`,

  2: `STEP 2 — APPROACH
Ask: "How would you solve this if you had to explain it to a friend? Brute force is fine to start."
If they suggest brute force, ask about time complexity and whether we can do better.
If they suggest the optimal approach, praise them specifically.
Do NOT name the optimal approach unless they ask for "Show me".
Keep it to 2-4 sentences.`,

  3: `STEP 3 — DATA STRUCTURE
Ask: "What data structure would help us here? Think about what operations we need to be fast."
Guide them toward the right choice through questions about lookup time, ordering, etc.
Do NOT reveal the answer unless they explicitly ask for "Show me".
Keep it to 2-3 sentences.`,

  4: `STEP 4 — BUILD (Step-by-Step Coding)
This is the core teaching phase. Break the solution into micro-steps.
For each micro-step, tell the user WHAT needs to happen next (e.g., "Now we need to initialize our hash map") but do NOT write the code unless they say "Show me".
If they say "I got it", wait for them to write code and then validate it.
If they say "Show me", provide ONLY the code for this one micro-step, nothing more. Format code in a code block.
After each micro-step is done, move to the next one.
Keep descriptions to 1-2 sentences per micro-step.`,

  5: `STEP 5 — EDGE CASES
Ask: "What edge cases should we handle? Think about empty inputs, single elements, duplicates, very large inputs."
For each edge case they miss, hint at it. For example: "What if the array is empty?" or "What if there are duplicate values?"
Keep it brief — list format is fine.`,

  6: `STEP 6 — REVIEW
Review their complete solution. Cover:
1. Time complexity (Big O)
2. Space complexity
3. What they did well
4. One thing they could improve
5. Common follow-up interview questions for this problem
Be encouraging but honest. This is the debrief.`,
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { problem_slug, messages, step, action, code, buildSubStep } = body;

    const problem = getProblemBySlug(problem_slug);
    if (!problem) {
      return new Response("Problem not found", { status: 404 });
    }

    const currentStep = step || 1;

    // Build the system prompt based on current step
    const systemPrompt = `You are Alex, a Socratic coding coach for FAANG interview prep. You guide users step-by-step through solving problems — you do NOT give away answers.

Problem: ${problem.title}
Difficulty: ${problem.difficulty}
Topics: ${problem.topics.join(", ")}
Coach context (NEVER reveal directly): ${problem.coach_context}

${STEP_INSTRUCTIONS[currentStep] || STEP_INSTRUCTIONS[1]}

${action === "show_me" ? `
IMPORTANT: The user clicked "Show me". For this ONE micro-step only, provide the actual code snippet. Keep it minimal — just the code for this specific part, not the full solution.
${currentStep === 4 && buildSubStep ? `Current build sub-step: ${buildSubStep}` : ""}
` : ""}

${action === "explain_more" ? `
The user wants more explanation. Go deeper on the current concept. Use an analogy if helpful. Still don't give away the answer.
` : ""}

${code ? `\nUser's current code:\n\`\`\`\n${code}\n\`\`\`` : ""}

Rules:
- Keep responses SHORT (2-4 sentences unless doing a code review in step 6)
- Never give the full solution at once
- Praise specific correct thinking
- When correcting, don't say "wrong" — ask "what happens when..."
- Your name is Alex
- On your very first message, sign off: "— Alex"`;

    // Build messages for the LLM
    const llmMessages = [
      {
        role: "user",
        content: `[Instructions for Alex the coach]: ${systemPrompt}\n\n[Begin session]`,
      },
      ...messages.map((m: { role: string; content: string }) => ({
        role: m.role === "coach" ? "assistant" : "user",
        content: m.content,
      })),
    ];

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return new Response("API key not configured", { status: 500 });
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://cracked.dev",
        "X-Title": "crackeddev",
      },
      body: JSON.stringify({
        model: "nvidia/nemotron-3-nano-30b-a3b:free",
        messages: llmMessages,
        stream: true,
        max_tokens: 1024,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenRouter error:", errorText);
      return new Response("Coach temporarily unavailable", { status: 502 });
    }

    // Stream the SSE response back
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader();
        if (!reader) {
          controller.close();
          return;
        }

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
                  if (content) {
                    controller.enqueue(encoder.encode(content));
                  }
                } catch {
                  // skip invalid JSON
                }
              }
            }
          }
        } catch (err) {
          console.error("Stream error:", err);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    });
  } catch (err) {
    console.error("Coach API error:", err);
    return new Response("Internal server error", { status: 500 });
  }
}
