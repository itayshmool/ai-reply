const CLAUDE_API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-4-6";

const TONE_PROMPTS = {
  professional:
    "Rephrase this LinkedIn reply to sound professional, polished, and well-articulated. Keep the core message intact.",
  casual:
    "Rephrase this LinkedIn reply to sound casual and natural, like a relaxed conversation between colleagues.",
  friendly:
    "Rephrase this LinkedIn reply to sound warm, friendly, and approachable while keeping it professional enough for LinkedIn.",
  concise:
    "Rephrase this LinkedIn reply to be as concise as possible. Remove filler words, get straight to the point, but keep it polite.",
  assertive:
    "Rephrase this LinkedIn reply to sound confident and assertive. Make the point clearly and with authority.",
};

const SPELLCHECK_PROMPT =
  "Fix all spelling, grammar, and punctuation errors in this LinkedIn reply. Do NOT change the tone, meaning, or wording beyond what is needed to correct errors. If the text is already correct, return it unchanged.";

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "rephrase") {
    handleRephrase(request.text, request.tone).then(sendResponse);
    return true;
  }
  if (request.action === "spellcheck") {
    handleRephrase(request.text, null, SPELLCHECK_PROMPT).then(sendResponse);
    return true;
  }
});

async function handleRephrase(text, tone, overridePrompt) {
  const { apiKey } = await chrome.storage.sync.get("apiKey");

  if (!apiKey) {
    return { error: "API key not set. Click the extension icon to configure." };
  }

  const systemPrompt = overridePrompt || TONE_PROMPTS[tone] || TONE_PROMPTS.professional;

  try {
    const response = await fetch(CLAUDE_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1024,
        system:
          systemPrompt +
          "\n\nRules:\n- Return ONLY the rephrased text, nothing else.\n- Do not add quotes around the text.\n- Keep the same language as the original.\n- Preserve any @mentions, links, or hashtags.\n- Match the approximate length of the original (don't make it significantly longer).",
        messages: [{ role: "user", content: text }],
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      return {
        error: err.error?.message || `API error: ${response.status}`,
      };
    }

    const data = await response.json();
    return { result: data.content[0].text };
  } catch (err) {
    return { error: `Network error: ${err.message}` };
  }
}
