const apiKey = "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";

async function test() {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "meta-llama/llama-3.3-70b-instruct:free",
      messages: [{ role: "user", content: "hi" }],
    }),
  });
  
  console.log("Status:", res.status);
  const text = await res.text();
  console.log("Body:", text);
}

test();
