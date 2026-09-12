# AuraChat

A premium AI chat assistant powered by Google Gemini with real-time response streaming, voice input, file uploads, and a built-in workspace editor.

## Features

- **Multi-Model Fallback** — Automatically tries multiple Gemini models for reliability
- **Real-Time Streaming** — Responses stream word-by-word as they're generated
- **Tone & Word Limit Controals** — Switch between Short, Professional, and Detailed tones with adjustable word limits
- **Voice Input** — Dictate prompts using browser Speech Recognition
- **File Uploads** — Attach images (PNG, JPG) or text/code files for AI analysis
- **Prompt Enhancer** — Magic Wand button to auto-enhance simple prompts into detailed instructions
- **Workspace Editor** — Split-screen code/text playground with AI-powered refactoring
- **Session Management** — Multiple conversations with backup/restore and Markdown export
- **Guided Tour** — First-time onboarding walkthrough for new users

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## API Key Setup

1. Get a free API key from [Google AI Studio](https://aistudio.google.com/apikey)
2. Click the key icon in the header
3. Paste your API key and save

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Styling:** Tailwind CSS 4
- **AI:** Google Gemini API
- **Tour:** react-joyride
