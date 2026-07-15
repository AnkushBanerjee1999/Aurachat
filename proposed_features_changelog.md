# Changelog: Post-Development Features & Onboarding Tour

Here is a summary of the features and enhancements implemented in the AuraChat application following the initial development.

##  Core Premium Features
- 1. **🎙️ Voice Assistant**: Dictate prompts using Speech-to-Text (`SpeechRecognition`), and listen to AI answers with Text-to-Speech (`speechSynthesis`).
- 2. **📄 Document & Multi-Modal Uploads**: Attach text files, code scripts, or images. Images are processed natively as Base64 Gemini payloads and previewed as visual thumbnails in chat bubbles.
- 3. **💾 Conversation Exporter & Backups**: Download conversation logs as Markdown (`.md`) or export full session snapshots as JSON backups with import/restore capabilities.
- 4. **🪄 Prompt Magic Wand (Query Enhancer)**: Click the wand to enhance brief prompts into optimized generative instructions, styled with gradient glow borders and star particle animations.
- 5. **🖥️ Aura Workspace (Split-Screen Playground)**: Slide-out code playground panel side-by-side with chat. Features AI refactoring controls and code exporting from message logs.

##  Onboarding & Tour
- **🗺️ First-Time Visitor Walkthrough**: Guided tour using `react-joyride` highlighting sidebar navigation, options, API configuration, wand, dictation, and backup tools.

##  Responsive Header Controls
- **📱 Mobile Optimization**: Select inputs resize, brand logo collapses, and API text labels hide on small screens to fit all controls on a single line.
