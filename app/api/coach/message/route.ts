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

    // --- GEMINI NATIVE CONFIG ---
    let apiKey = user_key?.trim() || process.env.ANTHROPIC_API_KEY; 
    
    if (!apiKey) return new Response("Key Required. Plug in Gemini Key in settings.", { status: 401 });

    // Official Google REST Endpoint (v1beta)
    // Using streamGenerateContent for best stability
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:streamGenerateContent?key=${apiKey}`;

    const systemPrompt = `Analyze this code for "${problem.title}". 
Mode: ${mode || 'CODING'}
Hint Level: ${hint_level || 1}
Start response with [STATUS: ON_TRACK] or [STATUS: OFF_TRACK].
${is_silent ? "Silent pulse mode: 5-word diagnostic max. No conversation." : "Coaching mode: 2 sentences max. Focus on hints not answers."}

${code ? `Current code:\n${code}` : ""}
`;

    // Map history to Google's contents format
    const contents = [
      {
        role: "user",
        parts: [{ text: `[COACH GUIDELINES]: ${systemPrompt}\n\nExisting chat:\n${messages.map((m: any) => `${m.role === 'coach' ? 'Assistant' : 'User'}: ${m.content}`).join('\n')}` }]
      }
    ];

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents,
        generationConfig: {
          maxOutputTokens: 512,
          temperature: 0.7,
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[GEMINI ERROR]", errorText);
      return new Response(`Gemini Unavailable: ${errorText}`, { status: response.status });
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
            
            // Google's stream chunks are often JSON arrays [ ... ]
            // We need to parse them carefully
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";
            for (const line of lines) {
              if (line.trim().startsWith('"text": "')) {
                // Extremely simple extraction for speed
                const match = line.match(/"text":\s*"(.*)"/);
                if (match && match[1]) {
                  const cleaned = match[1].replace(/\\n/g, '\n').replace(/\\"/g, '"');
                  controller.enqueue(encoder.encode(cleaned));
                }
              } else {
                // Secondary fallback for raw content parts
                try {
                  const json = JSON.parse(line.replace(/,$/, '').trim());
                  const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
                  if (text) controller.enqueue(encoder.encode(text));
                } catch {}
              }
            }
          }
        } finally {
          controller.close();
        }
      },
    }), {
      headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-cache" },
    });
  } catch (err) {
    return new Response("Internal server error", { status: 500 });
  }
}
