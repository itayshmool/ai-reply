# AI Reply

Chrome extension that rephrases your replies on LinkedIn and X (Twitter) using Claude AI. Write a reply, pick a tone, and get a polished version instantly.

## Features

- **Multi-platform** — works on LinkedIn and X/Twitter with platform-aware prompts
- **Rephrase** — inline button with multiple tones: Professional, Casual, Friendly, Concise, Assertive
- **Spell Check** — dedicated button to fix spelling, grammar, and punctuation without changing your tone
- **Humanized output** — anti-AI writing rules baked in so replies sound like a real person
- **Powered by Claude** — uses Anthropic's Claude API for high-quality results

## Install

1. Clone this repo
2. Open `chrome://extensions` in Chrome
3. Enable **Developer mode** (top right)
4. Click **Load unpacked** and select the repo folder
5. Click the extension icon and enter your [Claude API key](https://console.anthropic.com/settings/keys)

## Usage

1. Go to any post on LinkedIn or X and click to write a reply
2. Type your reply
3. Use **Spell** to fix typos or **Rephrase** to pick a tone
4. Your text is replaced in-place

## Tech

- Chrome Manifest V3
- Claude API (Sonnet 4.6)
- Vanilla JS — no build step, no dependencies
- Platform detection adapts selectors, prompts, and dropdown theme
