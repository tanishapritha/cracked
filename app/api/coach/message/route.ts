import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getProblemBySlug } from "@/lib/problems";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  try {
    const userId = "anonymous_user";

    const supabase = createClient();

    const body = await req.json();
    const { problem_slug, messages, stage, hints_used, hint_level, code } = body;

    const problem = getProblemBySlug(problem_slug);
    if (!problem) {
      return new Response("Problem not found", { status: 404 });
    }

    const systemPrompt = `You are a Socratic coding coach helping someone prepare for FAANG interviews. Your job is NOT to give answers — it is to guide the user to discover the answer themselves through questions and nudges.

Current problem: ${problem.title}
Difficulty: ${problem.difficulty}
Topics: ${problem.topics.join(", ")}
Coach context (do not reveal this directly): ${problem.coach_context}

Rules:
- Never give away the solution or optimal approach unprompted
- Always respond with a question or a partial insight that makes the user think
- Praise correct thinking specifically ("yes, O(n) lookup is exactly why a hash map helps here")
- When correcting wrong thinking, don't say "that's wrong" — say "that works, but what's the cost?" or "interesting — what happens when the input is very large?"
- Keep responses concise — 3-5 sentences max unless doing a concept walkthrough
- Stage you're in: ${stage}
- Hints used so far: ${hints_used}
- Your name is Alex. On your very first message in a session, sign off: "-- Alex"
${hint_level ? `\nThe user just requested hint level ${hint_level}. ${
  hint_level === 1
    ? "Give a conceptual direction only. Do NOT name any data structures."
    : hint_level === 2
    ? "Name the right data structure or pattern to use."
    : "Provide step-by-step pseudocode. No actual syntax."
}` : ""}
${code ? `\nUser's current code:\n\`\`\`\n${code}\n\`\`\`` : ""}
${stage === 6 ? "\nThis is the debrief stage. Review their approach, explain time/space complexity, mention edge cases and common variants." : ""}`;

    // Prepend systemPrompt as a user instruction to guarantee compatibility with Google/Llama
    const flattenedMessages = [
      {
        role: "user",
        content: `System Instructions: ${systemPrompt}\n\n[Please acknowledge these rules and start the session.]`,
      },
      ...messages.map((m: { role: string; content: string }) => ({
        role: m.role === "coach" ? "assistant" : "user",
        content: m.content,
      })),
    ];

    // use OpenRouter to access Claude / Gemini
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.error("DEBUG: API key IS NOT CONFIGURED!");
      return new Response("API key not configured", { status: 500 });
    }
    console.log(`DEBUG: Using API key starting with: ${apiKey.substring(0, 12)}...`);

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://cracked.dev",
        "X-Title": "cracked",
      },
      body: JSON.stringify({
        model: "nvidia/nemotron-3-nano-30b-a3b:free",
        messages: flattenedMessages,
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

    // stream the SSE response back
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
