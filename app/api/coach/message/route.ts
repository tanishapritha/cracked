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
      code,
      user_key,
      is_silent
    } = body;

    const problem = getProblemBySlug(problem_slug);
    if (!problem) return new Response("Problem not found", { status: 404 });

    // --- STRICT KEY LOCKING ---
    // If user provides a key, we ONLY use that. No shared pool interference.
    const isUserKey = !!(user_key && user_key.trim().length > 10);
    const apiKey = isUserKey ? user_key.trim() : process.env.GROQ_API_KEY; 
    
    if (!apiKey) {
      return new Response("GSK Key Missing. Please plug in your Groq key.", { status: 401 });
    }

    const apiUrl = "https://api.groq.com/openai/v1/chat/completions";
    const model = "llama-3.3-70b-versatile";

    // --- LITE PROMPT FOR PULSE SAVINGS ---
    const systemPrompt = `Review code for "${problem.title}". 
Mode: ${mode || 'CODING'}
Rules:
- NO ANSWERS.
- 2 sentence hints max.
- Always start with [STATUS: ON_TRACK] or [STATUS: OFF_TRACK].
${is_silent ? "SILENT MODE: ONLY status tag + 3-word reason." : ""}

${code ? `User Code:\n${code}` : ""}
`;

    const llmMessages = [
      { role: "system", content: systemPrompt },
      ...messages.map((m: any) => ({
        role: m.role === "coach" ? "assistant" : "user",
        content: m.content,
      })),
    ];

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: llmMessages,
        stream: true,
        max_tokens: is_silent ? 50 : 512, // Save tokens for pulses
        temperature: 0.5,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      // Pass through the exact error to help the user debug their key
      return new Response(errorText, { status: response.status });
    }

    const encoder = new TextEncoder();
    return new Response(new ReadableStream({
      async start(controller) {
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
              if (line.trim().startsWith("data: ")) {
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
    }), {
      headers: { 
        "Content-Type": "text/plain; charset=utf-8", 
        "Cache-Control": "no-cache",
        "X-Key-Source": isUserKey ? "user" : "system" // Let us know which was used
      },
    });
  } catch (err) {
    return new Response("Internal server error", { status: 500 });
  }
}
