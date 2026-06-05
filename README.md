# AI Reply for LinkedIn

Chrome extension that rephrases your LinkedIn replies using Claude AI. Write a reply, pick a tone, and get a polished version instantly.

## Features

- **Inline button** — appears next to LinkedIn reply/comment boxes
- **Multiple tones** — Professional, Casual, Friendly, Concise, Assertive
- **Powered by Claude** — uses Anthropic's Claude API for high-quality rephrasing
- **Preserves context** — keeps @mentions, links, hashtags, and original language

## Install

1. Clone this repo
2. Open `chrome://extensions` in Chrome
3. Enable **Developer mode** (top right)
4. Click **Load unpacked** and select the repo folder
5. Click the extension icon and enter your [Claude API key](https://console.anthropic.com/settings/keys)

## Usage

1. Go to any LinkedIn post and click to write a reply
2. Type your reply
3. Click the **Rephrase** button that appears next to the submit button
4. Pick a tone from the dropdown
5. Your text is replaced with the rephrased version

## Tech

- Chrome Manifest V3
- Claude API (Sonnet 4.6)
- Vanilla JS — no build step, no dependencies
