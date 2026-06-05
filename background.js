const CLAUDE_API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-4-6";

const HUMANIZER_RULES = `
CRITICAL — the output must read like a real human wrote it. Follow these anti-AI rules strictly:

Banned words/phrases (never use): delve, crucial, pivotal, landscape, testament, underscore, foster, garner, showcase, tapestry, vibrant, nestled, groundbreaking, in today's, it's important to note, at its core, serves as, stands as, not only...but also, let's dive in, here's what you need to know, the real question is.

Banned patterns:
- Rule of three ("X, Y, and Z" lists that feel formulaic)
- Em dash overuse — rewrite with commas or periods instead
- Superficial -ing phrases (highlighting, underscoring, emphasizing, showcasing, fostering)
- Copula avoidance (use "is/are/has" instead of "serves as/stands as/boasts")
- Sycophantic openers (Great question!, Absolutely!, Certainly!)
- Generic positive closers (exciting times ahead, the future looks bright)
- Excessive hedging (could potentially, it might be argued that)
- Bold-colon list items (**Label:** description)
- Emoji decorations on bullet points

Do:
- Vary sentence length naturally. Short ones. Then a longer one that takes its time.
- Have a point of view — don't just neutrally report.
- Use "is" and "are" freely, not fancy substitutes.
- Sound like a person talking, not a press release.
- Keep it direct and specific, not vague and puffy.
- Use contractions naturally (don't, it's, that's).
`;

const TONE_PROMPTS = {
  linkedin: {
    professional:
      "Rephrase this LinkedIn reply to sound professional and well-articulated. Keep the core message and the author's voice intact. It should read like a sharp colleague wrote it, not a corporate template.",
    casual:
      "Rephrase this LinkedIn reply to sound casual and natural, like a relaxed conversation between colleagues. Keep the original personality.",
    friendly:
      "Rephrase this LinkedIn reply to sound warm and approachable while staying professional enough for LinkedIn. Keep it genuine, not performative.",
    concise:
      "Rephrase this LinkedIn reply to be as short as possible. Cut filler words, get to the point, stay polite. Every word should earn its place.",
    assertive:
      "Rephrase this LinkedIn reply to sound confident and direct. Make the point clearly with authority. No hedging, no softening.",
  },
  x: {
    professional:
      "Rephrase this X/Twitter reply to sound sharp and well-articulated. Keep the core message and the author's voice intact. It should read like a smart person tweeting, not a corporate account.",
    casual:
      "Rephrase this X/Twitter reply to sound casual and natural, like how people actually talk on Twitter. Keep the original personality.",
    friendly:
      "Rephrase this X/Twitter reply to sound warm and approachable. Keep it genuine, not performative or try-hard.",
    concise:
      "Rephrase this X/Twitter reply to be as short as possible. Cut filler words, get to the point. Every word should earn its place.",
    assertive:
      "Rephrase this X/Twitter reply to sound confident and direct. Make the point clearly with authority. No hedging, no softening.",
  },
};

const SPELLCHECK_PROMPT =
  "Fix all spelling, grammar, and punctuation errors in this reply. Do NOT change the tone, meaning, or wording beyond what is needed to correct errors. If the text is already correct, return it unchanged.";

const PLATFORM_RULES = {
  linkedin: "\n- Match the approximate length of the original (don't make it significantly longer).",
  x: "\n- Stay within 280 characters if the original is within that limit.\n- This is X/Twitter — keep it punchy and conversational.",
};

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "rephrase") {
    handleRephrase(request.text, request.tone, request.platform).then(sendResponse);
    return true;
  }
  if (request.action === "spellcheck") {
    handleRephrase(request.text, null, request.platform, SPELLCHECK_PROMPT).then(sendResponse);
    return true;
  }
});

async function handleRephrase(text, tone, platform, overridePrompt) {
  const { apiKey } = await chrome.storage.sync.get("apiKey");

  if (!apiKey) {
    return { error: "API key not set. Click the extension icon to configure." };
  }

  const platformKey = platform || "linkedin";
  const tones = TONE_PROMPTS[platformKey] || TONE_PROMPTS.linkedin;
  const baseTone = overridePrompt || tones[tone] || tones.professional;
  const humanize = overridePrompt ? "" : HUMANIZER_RULES;
  const platformRule = PLATFORM_RULES[platformKey] || "";

  const systemPrompt =
    baseTone +
    humanize +
    "\n\nRules:\n- Return ONLY the rephrased text, nothing else.\n- Do not add quotes around the text.\n- Keep the same language as the original.\n- Preserve any @mentions, links, or hashtags." +
    platformRule;

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
        system: systemPrompt,
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
