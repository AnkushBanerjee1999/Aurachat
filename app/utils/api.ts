export interface Message {
  id: string;
  role: "user" | "model";
  content: string;
  timestamp: Date;
  files?: { name: string; content?: string; type: string; base64?: string }[];
}

export type ToneType = "Short" | "Professional" | "Detailed";
export type WordLimitType = "15" | "30" | "unlimited";

export const DEFAULT_DUMMY_KEY = "[ENCRYPTION_KEY]";

// High-quality mock response generator when API key is a dummy key
function getMockResponse(prompt: string, tone: ToneType, wordLimit: WordLimitType): string {
  const shortResponses = [
    "Here is your short answer. Please provide a valid Gemini API key for live responses.",
    "This is a mocked short answer confirming that the chat system is fully functional.",
    "Mock response active: Tone is short, limit is set. Connect your API key to test.",
  ];

  const professionalResponses = [
    "Dear User,\n\nThis communication serves to confirm that your request has been received and processed. To enable live interaction with the AI model, please update the dummy key in your settings with a valid Google Gemini API key.\n\nSincerely,\nAura Chat System",
    "Thank you for your query. The application is currently running in demonstration mode. Please insert a valid Google Gemini API key into the configuration panel in the top-right header to request real-time generation.\n\nBest regards,\nAura Support Team",
  ];

  const detailedResponses = [
    `# Aura Chat System (Demonstration Mode)

Thank you for testing the application! You are seeing this detailed mock response because the system is currently using the **default dummy API key**.

### Current Configuration:
- **Tone:** ${tone} (Detailed layout active)
- **Word Limit:** ${wordLimit}

### How to set up your own Gemini API Key:
1. Go to the **Google AI Studio** and generate a free API key.
2. Click the **Key icon** or **Settings** in the header of this application.
3. Paste your API key into the input field and click **Save**.
4. The key will be securely saved locally in your browser's \`localStorage\`.

### Sample Markdown Formatting:
- **Feature A:** Rich glassmorphism aesthetics.
- **Feature B:** Collapsible conversation history.
- **Feature C:** Responsive mobile design.

\`\`\`javascript
// Your API key is stored locally:
localStorage.setItem("aura_gemini_api_key", "AIzaSy...");
\`\`\`

Feel free to ask another question or configure your live key to get started!`,
  ];

  // Helper to enforce word limit approximately for mock answers
  const truncateWords = (text: string, limit: number): string => {
    const words = text.split(/\s+/);
    if (words.length <= limit) return text;
    return words.slice(0, limit).join(" ") + "...";
  };

  let baseResponse = "";
  if (tone === "Short") {
    baseResponse = shortResponses[Math.floor(Math.random() * shortResponses.length)];
  } else if (tone === "Professional") {
    baseResponse = professionalResponses[Math.floor(Math.random() * professionalResponses.length)];
  } else {
    baseResponse = detailedResponses[Math.floor(Math.random() * detailedResponses.length)];
  }

  if (wordLimit === "15") {
    return truncateWords(baseResponse, 15);
  } else if (wordLimit === "30") {
    return truncateWords(baseResponse, 30);
  }
  
  return baseResponse;
}

export async function callGeminiAPI(
  messages: Message[],
  tone: ToneType,
  wordLimit: WordLimitType,
  apiKey: string,
  onChunk?: (text: string) => void
): Promise<string> {
  const currentKey = apiKey || DEFAULT_DUMMY_KEY;

  // Check if it's a dummy key
  if (
    !currentKey ||
    currentKey.trim() === "" ||
    currentKey === "dummy_gemini_api_key_aura_chat_2026" ||
    currentKey.toLowerCase().startsWith("dummy")
  ) {
    const lastUserMessage = messages.filter((m) => m.role === "user").pop()?.content || "";
    const mockReply = getMockResponse(lastUserMessage, tone, wordLimit);

    if (onChunk) {
      // Stagger words for simulated realistic streaming in demo mode
      const words = mockReply.split(/(\s+)/);
      for (let i = 0; i < words.length; i++) {
        onChunk(words[i]);
        await new Promise((resolve) => setTimeout(resolve, 15 + Math.random() * 20));
      }
      return mockReply;
    }

    // Normal simulated delay (800ms) for static responses
    await new Promise((resolve) => setTimeout(resolve, 800));
    return mockReply;
  }

  // Build the system instructions based on user dropdown selections
  let toneInstruction = "";
  switch (tone) {
    case "Short":
      toneInstruction = "Respond in an extremely brief, concise, direct, and straight-to-the-point tone. Avoid introductory or concluding filler words.";
      break;
    case "Professional":
      toneInstruction = "Respond in a formal, polite, objective, helpful, and highly professional business-standard tone.";
      break;
    case "Detailed":
      toneInstruction = "Provide a comprehensive, thoroughly detailed, deep-dive response. Organize with structured Markdown headings, bullet points, and code blocks if appropriate.";
      break;
  }

  let limitInstruction = "";
  switch (wordLimit) {
    case "15":
      limitInstruction = "STRICT REQUIREMENT: Your entire response MUST NOT exceed 15 words in total. Keep it ultra-short and impactful.";
      break;
    case "30":
      limitInstruction = "STRICT REQUIREMENT: Your entire response MUST NOT exceed 30 words in total. Keep it concise.";
      break;
    case "unlimited":
      limitInstruction = "You have an unlimited word count. Elaborate details and provide thorough explanations.";
      break;
  }

  const systemPrompt = `You are Aura, a highly intelligent, premium, and friendly AI coding and writing assistant.
Your styling and layouts should be exceptionally neat and structured.
Respond using the following constraints:
1. Tone: ${toneInstruction}
2. Output Limits: ${limitInstruction}`;

  // Map messages to Gemini API format, ensuring it alternates strictly between 'user' and 'model' starting with 'user'.
  // Filter out any messages containing errors or starting with system emojis.
  const filteredMessages = messages.filter(
    (m) =>
      m.content.trim() !== "" &&
      !m.id.endsWith("_error") &&
      !m.content.startsWith("⚠️")
  );

  const apiContents: { role: "user" | "model"; parts: { text?: string; inlineData?: { mimeType: string; data: string } }[] }[] = [];

  for (const m of filteredMessages) {
    const parts: { text?: string; inlineData?: { mimeType: string; data: string } }[] = [];

    // First, process any image files as inlineData parts
    if (m.role === "user" && m.files && m.files.length > 0) {
      m.files.forEach((f) => {
        if (f.base64 && f.type.startsWith("image/")) {
          parts.push({
            inlineData: {
              mimeType: f.type,
              data: f.base64,
            },
          });
        }
      });
    }

    // Next, process text attachments and embed them into the text query
    let textToSend = m.content;
    if (m.role === "user" && m.files && m.files.length > 0) {
      const textFiles = m.files.filter((f) => f.content);
      if (textFiles.length > 0) {
        const attachments = textFiles
          .map((f) => `[Attached File: ${f.name}]\n\`\`\`\n${f.content}\n\`\`\``)
          .join("\n\n");
        textToSend = `${attachments}\n\n${m.content}`;
      }
    }

    parts.push({ text: textToSend });

    if (apiContents.length === 0) {
      // First message must be 'user'
      if (m.role === "user") {
        apiContents.push({ role: "user", parts });
      }
      continue;
    }

    const lastItem = apiContents[apiContents.length - 1];
    if (lastItem.role === m.role) {
      // Merge consecutive messages: append to the existing text part
      const textPart = lastItem.parts.find((p) => p.text !== undefined);
      if (textPart) {
        textPart.text += "\n\n" + textToSend;
      } else {
        lastItem.parts.push({ text: textToSend });
      }

      // Add any inlineData image parts
      parts.forEach((p) => {
        if (p.inlineData) {
          lastItem.parts.push(p);
        }
      });
    } else {
      apiContents.push({ role: m.role, parts });
    }
  }

  // If after cleaning up we have no messages, do not call the API
  if (apiContents.length === 0) {
    throw new Error("No user message found to send to the AI model.");
  }

  const modelsToTry = ["gemini-3.5-flash", "gemini-2.0-flash", "gemini-3.1-flash-lite"];
  let lastError: Error | null = null;

  for (const model of modelsToTry) {
    try {
      const endpoint = onChunk ? "streamGenerateContent" : "generateContent";
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:${endpoint}?key=${currentKey}`;
      
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: apiContents,
          systemInstruction: {
            parts: [{ text: systemPrompt }],
          },
          generationConfig: {
            temperature: tone === "Professional" ? 0.2 : 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: wordLimit === "15" ? 60 : wordLimit === "30" ? 120 : 2048,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData?.error?.message || `HTTP error! Status: ${response.status}`;
        throw new Error(errorMessage);
      }

      // Handle streaming response chunks
      if (onChunk) {
        if (!response.body) {
          throw new Error("Response body is not readable for streaming.");
        }

        let fullText = "";
        let buffer = "";
        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          let braceCount = 0;
          let startIdx = -1;

          for (let i = 0; i < buffer.length; i++) {
            const char = buffer[i];
            if (char === "{") {
              if (braceCount === 0) startIdx = i;
              braceCount++;
            } else if (char === "}") {
              braceCount--;
              if (braceCount === 0 && startIdx !== -1) {
                const jsonStr = buffer.slice(startIdx, i + 1);
                try {
                  const parsed = JSON.parse(jsonStr);
                  const textChunk = parsed?.candidates?.[0]?.content?.parts?.[0]?.text || "";
                  if (textChunk) {
                    fullText += textChunk;
                    onChunk(textChunk);
                  }
                } catch (e) {
                  // Silent catch for non-matching chunks (e.g., streaming framing metadata)
                }
                buffer = buffer.slice(i + 1);
                i = -1;
                startIdx = -1;
              }
            }
          }
        }

        if (!fullText) {
          throw new Error("Received empty stream content from Gemini API.");
        }
        return fullText;
      }

      // Handle standard full JSON response
      const data = await response.json();
      const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!reply) {
        throw new Error("Invalid response format received from Gemini API.");
      }

      return reply;
    } catch (error: any) {
      console.warn(`Gemini model ${model} failed:`, error.message);
      lastError = error;
    }
  }

  // If we reach here, all models failed
  console.error("All Gemini API fallback models failed. Last error:", lastError);
  throw new Error(
    lastError?.message || "Failed to generate AI response. Models are currently experiencing high demand. Please try again later."
  );
}

// Enhance a raw prompt using the Gemini API
export async function enhancePromptWithAI(rawPrompt: string, apiKey: string): Promise<string> {
  const currentKey = apiKey || DEFAULT_DUMMY_KEY;

  // Mock prompt enhancement if dummy key is used
  if (
    !currentKey ||
    currentKey.trim() === "" ||
    currentKey === "dummy_gemini_api_key_aura_chat_2026" ||
    currentKey.toLowerCase().startsWith("dummy")
  ) {
    // Artificial small delay (600ms) for visual realism
    await new Promise((resolve) => setTimeout(resolve, 600));
    return `Act as an expert assistant and provide a comprehensive, well-structured, and highly detailed response regarding the following topic: "${rawPrompt}". Break down key concepts into logical bullet points, include practical examples or code snippets if relevant, and ensure all explanations are clear and actionable.`;
  }

  const systemInstruction = "You are a prompt engineering specialist. The user will provide a simple topic or request. Rewrite it to be clear, highly detailed, well-structured, and optimized for an LLM generator. Do not change the core intent. Return ONLY the final polished prompt text, without any introductory or concluding remarks, explanations, or quotes.";

  const modelsToTry = ["gemini-3.5-flash", "gemini-2.0-flash", "gemini-3.1-flash-lite"];
  let lastError: Error | null = null;

  for (const model of modelsToTry) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${currentKey}`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: rawPrompt }] }],
          systemInstruction: { parts: [{ text: systemInstruction }] },
          generationConfig: {
            temperature: 0.6,
            maxOutputTokens: 500,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData?.error?.message || `HTTP error! Status: ${response.status}`;
        throw new Error(errorMessage);
      }

      const data = await response.json();
      const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!reply) throw new Error("Invalid response format.");
      return reply.trim();
    } catch (err: any) {
      console.warn(`AI prompt enhancement failed on model ${model}:`, err.message);
      lastError = err;
    }
  }

  // If all models fail, return the high-quality local template fallback
  console.error("All AI prompt enhancement fallback models failed. Last error:", lastError);
  return `Act as an expert assistant and provide a comprehensive, well-structured, and highly detailed analysis regarding the following topic: "${rawPrompt}". Break down complex components into structured bullet points, include code examples or practical workflows if relevant, and ensure explanations are technically precise.`;
}
