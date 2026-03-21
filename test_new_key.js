const apiKey = "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";

async function test(model) {
  console.log(`Testing model: ${model}...`);
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: model,
      messages: [{ role: "user", content: "hi" }],
    }),
  });
  
  console.log(`Status: ${res.status}`);
  const text = await res.text();
  console.log(`Body: ${text.slice(0, 100)}...`);
}

async function run() {
    await test("google/gemma-3-12b-it:free");
    await test("anthropic/claude-3.5-sonnet");
}

run();
