export const DEFAULT_DUMMY_KEY = "";

function getMockResponse(prompt, tone, wordLimit) {
  const shortResponses = [
    "Please provide a valid Gemini API key to get live AI responses.",
    "No API key configured. Add your key via the header to start chatting.",
  ];

  const professionalResponses = [
    "Dear User,\n\nTo enable live AI responses, please configure your Google Gemini API key using the key icon in the header.\n\nBest regards,\nAuraChat",
    "Thank you for your query. Please insert a valid Google Gemini API key in the settings to enable real-time AI generation.\n\nBest regards,\nAuraChat",
  ];

  const detailedResponses = [
    `# Welcome to AuraChat

To get started with live AI responses, you'll need to configure your **Google Gemini API Key**.

### Setup Steps:
1. Visit **Google AI Studio** and generate a free API key.
2. Click the **Key icon** in the header.
3. Paste your API key and click **Save**.

Your key is stored securely in your browser's local storage and never sent to any third-party server.`,
  ];

  const truncateWords = (text, limit) => {
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

  if (wordLimit === "15") return truncateWords(baseResponse, 15);
  if (wordLimit === "30") return truncateWords(baseResponse, 30);
  return baseResponse;
}

export async function callGeminiAPI(messages, tone, wordLimit, apiKey, onChunk) {
  const currentKey = apiKey || DEFAULT_DUMMY_KEY;

  if (!currentKey || currentKey.trim() === "") {
    const lastUserMessage = messages.filter((m) => m.role === "user").pop()?.content || "";
    const mockReply = getMockResponse(lastUserMessage, tone, wordLimit);

    if (onChunk) {
      const words = mockReply.split(/(\s+)/);
      for (let i = 0; i < words.length; i++) {
        onChunk(words[i]);
        await new Promise((resolve) => setTimeout(resolve, 15 + Math.random() * 20));
      }
      return mockReply;
    }

    await new Promise((resolve) => setTimeout(resolve, 800));
    return mockReply;
  }

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

  const systemPrompt = `You are Aura, a highly intelligent, premium, and friendly AI assistant capable of answering any question on any topic.
Your responses should be well-structured, clear, and formatted neatly using Markdown when appropriate.
Respond using the following constraints:
1. Tone: ${toneInstruction}
2. Output Limits: ${limitInstruction}`;

  const filteredMessages = messages.filter(
    (m) =>
      m.content.trim() !== "" &&
      !m.id.endsWith("_error") &&
      !m.content.startsWith("⚠️")
  );

  const apiContents = [];

  for (const m of filteredMessages) {
    const parts = [];

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
      if (m.role === "user") {
        apiContents.push({ role: "user", parts });
      }
      continue;
    }

    const lastItem = apiContents[apiContents.length - 1];
    if (lastItem.role === m.role) {
      const textPart = lastItem.parts.find((p) => p.text !== undefined);
      if (textPart) {
        textPart.text += "\n\n" + textToSend;
      } else {
        lastItem.parts.push({ text: textToSend });
      }
      parts.forEach((p) => {
        if (p.inlineData) {
          lastItem.parts.push(p);
        }
      });
    } else {
      apiContents.push({ role: m.role, parts });
    }
  }

  if (apiContents.length === 0) {
    throw new Error("No user message found to send to the AI model.");
  }

  const modelsToTry = ["gemini-2.0-flash", "gemini-2.0-flash-lite"];
  let lastError = null;

  for (const model of modelsToTry) {
    try {
      const endpoint = onChunk ? "streamGenerateContent" : "generateContent";
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:${endpoint}?key=${currentKey}`;

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: apiContents,
          systemInstruction: { parts: [{ text: systemPrompt }] },
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
        throw new Error(errorData?.error?.message || `HTTP error! Status: ${response.status}`);
      }

      if (onChunk) {
        if (!response.body) throw new Error("Response body is not readable for streaming.");

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
                } catch (e) { /* skip non-matching chunks */ }
                buffer = buffer.slice(i + 1);
                i = -1;
                startIdx = -1;
              }
            }
          }
        }

        if (!fullText) throw new Error("Received empty stream content from Gemini API.");
        return fullText;
      }

      const data = await response.json();
      const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!reply) throw new Error("Invalid response format received from Gemini API.");
      return reply;
    } catch (error) {
      lastError = error;
    }
  }

  throw new Error(
    lastError?.message || "Failed to generate AI response. Please try again later."
  );
}

export async function enhancePromptWithAI(rawPrompt, apiKey) {
  const currentKey = apiKey || DEFAULT_DUMMY_KEY;

  if (!currentKey || currentKey.trim() === "") {
    await new Promise((resolve) => setTimeout(resolve, 600));
    return `Act as an expert assistant and provide a comprehensive, well-structured, and highly detailed response regarding the following topic: "${rawPrompt}". Break down key concepts into logical sections, include practical examples if relevant, and ensure all explanations are clear and actionable.`;
  }

  const systemInstruction = "You are a prompt engineering specialist. The user will provide a simple topic or request. Rewrite it to be clear, highly detailed, well-structured, and optimized for an LLM generator. Do not change the core intent. Return ONLY the final polished prompt text, without any introductory or concluding remarks, explanations, or quotes.";

  const modelsToTry = ["gemini-2.0-flash", "gemini-2.0-flash-lite"];
  let lastError = null;

  for (const model of modelsToTry) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${currentKey}`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: rawPrompt }] }],
          systemInstruction: { parts: [{ text: systemInstruction }] },
          generationConfig: { temperature: 0.6, maxOutputTokens: 500 },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.error?.message || `HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!reply) throw new Error("Invalid response format.");
      return reply.trim();
    } catch (err) {
      lastError = err;
    }
  }

  return `Act as an expert assistant and provide a comprehensive, well-structured, and highly detailed analysis regarding the following topic: "${rawPrompt}". Break down complex components into structured sections, include practical examples if relevant, and ensure explanations are precise and easy to understand.`;
}
