"use client";

import React, { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import MessageList from "./components/MessageList";
import MessageInput from "./components/MessageInput";
import Workspace from "./components/Workspace";
import { callGeminiAPI, DEFAULT_DUMMY_KEY } from "./utils/api";
import { Joyride } from "react-joyride";

export default function Home() {
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState("");
  const [tone, setTone] = useState("Short");
  const [wordLimit, setWordLimit] = useState("30");
  const [apiKey, setApiKey] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Workspace States
  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const [workspaceTitle, setWorkspaceTitle] = useState("");
  const [workspaceContent, setWorkspaceContent] = useState("");
  const [workspaceLang, setWorkspaceLang] = useState("");
  const [isWorkspaceLoading, setIsWorkspaceLoading] = useState(false);

  // Tour States & Steps
  const [runTour, setRunTour] = useState(false);

  const tourSteps = [
    {
      target: "body",
      content: "Welcome to AuraChat! Let's take a quick 1-minute tour of your new AI assistant playground.",
      placement: "center",
      skipBeacon: true,
      closeButtonAction: "skip",
    },
    {
      target: "#tour-sidebar-toggle",
      content: "Click here to collapse or expand the sidebar to maximize your workspace real estate.",
      placement: "bottom",
      skipBeacon: true,
      closeButtonAction: "skip",
    },
    {
      target: "#tour-new-chat",
      content: "Create a new conversation session to start a fresh topic.",
      placement: "right",
      skipBeacon: true,
      closeButtonAction: "skip",
    },
    {
      target: "#tour-tone",
      content: "Select your desired response tone: Short (concise), Professional (formal), or Detailed (in-depth analysis).",
      placement: "bottom",
      skipBeacon: true,
      closeButtonAction: "skip",
    },
    {
      target: "#tour-limit",
      content: "Control response length boundaries (15 Words, 30 Words, or Unlimited) to suit your reading preference.",
      placement: "bottom",
      skipBeacon: true,
      closeButtonAction: "skip",
    },
    {
      target: "#tour-api-status",
      content: "Check your API connection status or configure your custom Google Gemini API Key here.",
      placement: "bottom",
      skipBeacon: true,
      closeButtonAction: "skip",
    },
    {
      target: "#tour-message-input",
      content: "This is your prompt input bar, packed with premium utilities.",
      placement: "top",
      skipBeacon: true,
      closeButtonAction: "skip",
    },
    {
      target: "#tour-upload",
      content: "Attach images (png, jpg) or text/code files (js, py, md, csv) directly to parse their contents with AI.",
      placement: "top",
      skipBeacon: true,
      closeButtonAction: "skip",
    },
    {
      target: "#tour-wand",
      content: "Magic Wand: Type a short instruction and click this button to enhance it into a detailed prompt engineered instruction.",
      placement: "top",
      skipBeacon: true,
      closeButtonAction: "skip",
    },
    {
      target: "#tour-voice",
      content: "Speech-to-Text: Dictate your prompt using browser Speech Recognition.",
      placement: "top",
      skipBeacon: true,
      closeButtonAction: "skip",
    },
    {
      target: "#tour-backup-restore",
      content: "Backup all your conversations as JSON, restore them, or export the active chat to Markdown.",
      placement: "top",
      skipBeacon: true,
      closeButtonAction: "skip",
    },
  ];

  const handleTourCallback = (data) => {
    const { status, type, action } = data;
    if (
      ["finished", "skipped"].includes(status) ||
      type === "tour:end" ||
      action === "close"
    ) {
      setRunTour(false);
      try {
        localStorage.setItem("aura_chat_tour_completed", "true");
      } catch (err) {
        console.warn("Storage write failed, using fallback:", err);
        try {
          sessionStorage.setItem("aura_chat_tour_completed", "true");
        } catch (e) {}
      }
    }
  };

  // Load configuration and sessions from localStorage on mount
  useEffect(() => {
    setMounted(true);

    // Check Tour Status
    try {
      const hasCompletedTour = localStorage.getItem("aura_chat_tour_completed");
      if (!hasCompletedTour) {
        setRunTour(true);
      }
    } catch (err) {
      console.warn("Storage read failed, checking session storage fallback:", err);
      try {
        const hasCompletedTourSession = sessionStorage.getItem("aura_chat_tour_completed");
        if (!hasCompletedTourSession) {
          setRunTour(true);
        }
      } catch (e) {
        // Safe fallback in case storage is entirely blocked
        setRunTour(false);
      }
    }
    
    // Load API Key
    const savedKey = localStorage.getItem("aura_gemini_api_key") || "";
    setApiKey(savedKey);

    // Load Settings
    const savedTone = localStorage.getItem("aura_chat_default_tone");
    if (savedTone) setTone(savedTone);

    const savedLimit = localStorage.getItem("aura_chat_default_limit");
    if (savedLimit) setWordLimit(savedLimit);

    // Load Chat Sessions
    const savedSessions = localStorage.getItem("aura_chat_sessions");
    if (savedSessions) {
      try {
        const parsed = JSON.parse(savedSessions);
        setSessions(parsed);
        if (parsed.length > 0) {
          setActiveSessionId(parsed[0].id);
          // Sync dropdowns to the loaded session's configuration
          setTone(parsed[0].tone);
          setWordLimit(parsed[0].wordLimit);
        }
      } catch (e) {
        console.error("Error loading chat history:", e);
      }
    }
  }, []);

  // Save sessions to localStorage whenever they change
  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem("aura_chat_sessions", JSON.stringify(sessions));
  }, [sessions, mounted]);

  // Handle active session changes (sync header controls to the session's options)
  const handleSelectSession = (sessionId) => {
    setActiveSessionId(sessionId);
    const session = sessions.find((s) => s.id === sessionId);
    if (session) {
      setTone(session.tone);
      setWordLimit(session.wordLimit);
    }
  };

  // Sync settings modifications directly into active session settings
  const handleToneChange = (newTone) => {
    setTone(newTone);
    localStorage.setItem("aura_chat_default_tone", newTone);
    if (activeSessionId) {
      setSessions((prev) =>
        prev.map((s) => (s.id === activeSessionId ? { ...s, tone: newTone } : s))
      );
    }
  };

  const handleWordLimitChange = (newLimit) => {
    setWordLimit(newLimit);
    localStorage.setItem("aura_chat_default_limit", newLimit);
    if (activeSessionId) {
      setSessions((prev) =>
        prev.map((s) => (s.id === activeSessionId ? { ...s, wordLimit: newLimit } : s))
      );
    }
  };

  // Create a brand new chat session
  const createNewSession = () => {
    const newSessionId = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newSession = {
      id: newSessionId,
      title: "New Conversation",
      messages: [],
      tone: tone,
      wordLimit: wordLimit,
      createdAt: new Date().toISOString(),
    };

    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newSessionId);
    return newSessionId;
  };

  // Delete a specific chat session
  const deleteSession = (sessionId) => {
    setSessions((prev) => {
      const filtered = prev.filter((s) => s.id !== sessionId);
      if (activeSessionId === sessionId) {
        if (filtered.length > 0) {
          setActiveSessionId(filtered[0].id);
          setTone(filtered[0].tone);
          setWordLimit(filtered[0].wordLimit);
        } else {
          setActiveSessionId("");
        }
      }
      return filtered;
    });
  };

  // Clear all chats
  const clearAllHistory = () => {
    if (window.confirm("Are you sure you want to delete all chat history? This action is irreversible.")) {
      setSessions([]);
      setActiveSessionId("");
      localStorage.removeItem("aura_chat_sessions");
    }
  };

  // Restore sessions from backup JSON
  const handleRestoreSessions = (restored) => {
    setSessions((prev) => {
      const prevIds = new Set(prev.map((s) => s.id));
      const filteredRestored = restored.filter((s) => !prevIds.has(s.id));
      return [...filteredRestored, ...prev];
    });

    if (restored.length > 0) {
      setActiveSessionId(restored[0].id);
      setTone(restored[0].tone);
      setWordLimit(restored[0].wordLimit);
    }
  };

  const handleOpenWorkspace = (title, content, language) => {
    setWorkspaceTitle(title);
    setWorkspaceContent(content);
    setWorkspaceLang(language);
    setWorkspaceOpen(true);
  };

  const handleWorkspaceAIEdit = async (instruction) => {
    setIsWorkspaceLoading(true);
    try {
      const systemInstruction = "You are a professional code refactoring tool. The user will provide their current code or document content, and a refactoring request. Modify the code or document exactly as requested. Return ONLY the complete updated code or text content. Do NOT include markdown code blocks wrappers (such as ```javascript), introductory messages, concluding remarks, or explanations. Output the raw text of the document directly.";
      
      const payloadText = `[CURRENT DOCUMENT CONTENT]\n${workspaceContent}\n\n[REFACTOR REQUEST]\n${instruction}`;
      
      const modelsToTry = ["gemini-3.5-flash", "gemini-2.0-flash", "gemini-3.1-flash-lite"];
      let lastError = null;
      let replyText = "";

      for (const model of modelsToTry) {
        try {
          const keyToUse = apiKey || DEFAULT_DUMMY_KEY;
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${keyToUse}`;
          const response = await fetch(url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              contents: [{ role: "user", parts: [{ text: payloadText }] }],
              systemInstruction: { parts: [{ text: systemInstruction }] },
              generationConfig: {
                temperature: 0.2,
                maxOutputTokens: 2048,
              },
            }),
          });

          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }

          const data = await response.json();
          const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (!reply) throw new Error("Invalid response format.");
          
          // Strip any markdown code fence wrappers if the AI accidentally added them
          let sanitized = reply.trim();
          if (sanitized.startsWith("```")) {
            const lines = sanitized.split("\n");
            if (lines.length > 2) {
              lines.shift();
              if (lines[lines.length - 1].startsWith("```")) {
                lines.pop();
              }
              sanitized = lines.join("\n");
            }
          }

          replyText = sanitized;
          break;
        } catch (err) {
          console.warn(`Refactor request failed on model ${model}:`, err.message);
          lastError = err;
        }
      }

      if (!replyText) {
        throw lastError || new Error("Failed to refactor content.");
      }

      setWorkspaceContent(replyText);
    } catch (err) {
      alert(`Aura Workspace AI Refactoring failed: ${err.message}`);
    } finally {
      setIsWorkspaceLoading(false);
    }
  };

  // Send a message
  const handleSend = async (messageText, files) => {
    let currentSessionId = activeSessionId;
    let currentSessions = [...sessions];

    const displayTitle = messageText || (files && files.length > 0 ? `File: ${files[0].name}` : "Document Analysis");

    // 1. Create a session if none is active
    if (!currentSessionId) {
      currentSessionId = createNewSession();
      // Instantly structure a new local state for processing
      const newSession = {
        id: currentSessionId,
        title: displayTitle.length > 30 ? `${displayTitle.slice(0, 27)}...` : displayTitle,
        messages: [],
        tone: tone,
        wordLimit: wordLimit,
        createdAt: new Date().toISOString(),
      };
      currentSessions = [newSession];
    }

    const activeSession = currentSessions.find((s) => s.id === currentSessionId);
    if (!activeSession) return;

    // 2. Format User Message
    const userMessage = {
      id: `msg_${Date.now()}_user`,
      role: "user",
      content: messageText || (files && files.length > 0 ? `Attached: ${files.map(f => f.name).join(', ')}` : ""),
      timestamp: new Date(),
      files: files,
    };

    // Update session list with user message & update title if it's the first message
    const updatedMessages = [...activeSession.messages, userMessage];
    const isFirstMessage = activeSession.messages.length === 0;
    const sessionTitle = isFirstMessage
      ? messageText.length > 25
        ? `${messageText.slice(0, 22)}...`
        : messageText
      : activeSession.title;

    const botMessageId = `msg_${Date.now()}_bot`;
    const initialBotMessage = {
      id: botMessageId,
      role: "model",
      content: "",
      timestamp: new Date(),
    };

    setSessions((prev) => {
      return prev.map((s) =>
        s.id === currentSessionId
          ? { ...s, title: sessionTitle, messages: [...updatedMessages, initialBotMessage] }
          : s
      );
    });

    setIsLoading(true);

    try {
      let streamedContent = "";
      const reply = await callGeminiAPI(
        updatedMessages,
        tone,
        wordLimit,
        apiKey,
        (chunk) => {
          streamedContent += chunk;
          setSessions((prev) =>
            prev.map((s) =>
              s.id === currentSessionId
                ? {
                    ...s,
                    messages: s.messages.map((msg) =>
                      msg.id === botMessageId
                        ? { ...msg, content: streamedContent }
                        : msg
                    ),
                  }
                : s
            )
          );
        }
      );

      // Make sure the final session state has the exact resolved response
      setSessions((prev) =>
        prev.map((s) =>
          s.id === currentSessionId
            ? {
                ...s,
                messages: s.messages.map((msg) =>
                  msg.id === botMessageId
                    ? { ...msg, content: reply }
                    : msg
                ),
              }
            : s
        )
      );
    } catch (error) {
      // Remove empty placeholder and render connection error bubble
      const errorMessage = {
        id: `msg_${Date.now()}_error`,
        role: "model",
        content: `⚠️ **Connection Error**\n\n${error.message || "Failed to reach Google Gemini API. Please verify your internet connection or API Key."}`,
        timestamp: new Date(),
      };

      setSessions((prev) =>
        prev.map((s) =>
          s.id === currentSessionId
            ? {
                ...s,
                messages: [
                  ...s.messages.filter((msg) => msg.id !== botMessageId),
                  errorMessage,
                ],
              }
            : s
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditMessage = async (msgId, newText) => {
    const activeSession = sessions.find((s) => s.id === activeSessionId);
    if (!activeSession) return;

    const messageIndex = activeSession.messages.findIndex((m) => m.id === msgId);
    if (messageIndex === -1) return;

    const originalMessage = activeSession.messages[messageIndex];
    const editedUserMessage = {
      ...originalMessage,
      content: newText,
    };

    const truncatedMessages = [
      ...activeSession.messages.slice(0, messageIndex),
      editedUserMessage,
    ];

    let currentSessionId = activeSessionId;
    const isFirstMessage = messageIndex === 0;
    const sessionTitle = isFirstMessage
      ? newText.length > 25
        ? `${newText.slice(0, 22)}...`
        : newText
      : activeSession.title;

    const botMessageId = `msg_${Date.now()}_bot`;
    const initialBotMessage = {
      id: botMessageId,
      role: "model",
      content: "",
      timestamp: new Date(),
    };

    setSessions((prev) =>
      prev.map((s) =>
        s.id === currentSessionId
          ? {
              ...s,
              title: sessionTitle,
              messages: [...truncatedMessages, initialBotMessage],
            }
          : s
      )
    );

    setIsLoading(true);

    try {
      let streamedContent = "";
      const reply = await callGeminiAPI(
        truncatedMessages,
        tone,
        wordLimit,
        apiKey,
        (chunk) => {
          streamedContent += chunk;
          setSessions((prev) =>
            prev.map((s) =>
              s.id === currentSessionId
                ? {
                    ...s,
                    messages: s.messages.map((msg) =>
                      msg.id === botMessageId
                        ? { ...msg, content: streamedContent }
                        : msg
                    ),
                  }
                : s
            )
          );
        }
      );

      setSessions((prev) =>
        prev.map((s) =>
          s.id === currentSessionId
            ? {
                ...s,
                messages: s.messages.map((msg) =>
                  msg.id === botMessageId
                    ? { ...msg, content: reply }
                    : msg
                ),
              }
            : s
        )
      );
    } catch (error) {
      const errorMessage = {
        id: `msg_${Date.now()}_error`,
        role: "model",
        content: `⚠️ **Connection Error**\n\n${error.message || "Failed to reach Google Gemini API. Please verify your internet connection or API Key."}`,
        timestamp: new Date(),
      };

      setSessions((prev) =>
        prev.map((s) =>
          s.id === currentSessionId
            ? {
                ...s,
                messages: [
                  ...s.messages.filter((msg) => msg.id !== botMessageId),
                  errorMessage,
                ],
              }
            : s
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Obtain details of the active session
  const activeSession = sessions.find((s) => s.id === activeSessionId);
  const activeMessages = activeSession ? activeSession.messages : [];

  // Return loading fallback if server rendering mismatch
  if (!mounted) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 animate-ping rounded-full bg-purple-500"></div>
          <span className="text-sm font-medium text-zinc-400">Loading AuraChat...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-zinc-50 dark:bg-zinc-950 transition-colors duration-300">
      {/* Onboarding App Tour */}
      {mounted && runTour && (
        <Joyride
          steps={tourSteps}
          run={runTour}
          continuous
          showSkipButton
          showProgress
          disableBeacon={true}
          onEvent={handleTourCallback}
          styles={{
            options: {
              primaryColor: "#a855f7", // purple-500
              backgroundColor: "#ffffff",
              textColor: "#1f2937",
              arrowColor: "#ffffff",
            },
          }}
        />
      )}
      
      {/* Sidebar navigation */}
      <Sidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={handleSelectSession}
        onCreateSession={createNewSession}
        onDeleteSession={deleteSession}
        onClearAll={clearAllHistory}
        onRestoreSessions={handleRestoreSessions}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
      />

      {/* Main split-screen container */}
      <div className="flex flex-1 h-full overflow-hidden relative">
        {/* Main chat window container */}
        <div className="flex flex-1 flex-col h-full overflow-hidden relative border-r border-zinc-200 dark:border-zinc-800">
          
          {/* Sticky top options bar */}
          <Header
            tone={tone}
            setTone={handleToneChange}
            wordLimit={wordLimit}
            setWordLimit={handleWordLimitChange}
            apiKey={apiKey}
            setApiKey={setApiKey}
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
          />

          {/* Scrollable messages container */}
          <MessageList
            messages={activeMessages}
            isLoading={isLoading}
            activeTone={tone}
            activeLimit={wordLimit}
            onOpenWorkspace={handleOpenWorkspace}
            onEditMessage={handleEditMessage}
          />

          {/* Expanding bottom input panel */}
          <MessageInput
            onSend={handleSend}
            isLoading={isLoading}
            isEmptySession={activeMessages.length === 0}
            apiKey={apiKey}
          />
          
        </div>

        {/* Dynamic split-screen Workspace Panel */}
        <Workspace
          isOpen={workspaceOpen}
          onClose={() => setWorkspaceOpen(false)}
          title={workspaceTitle}
          content={workspaceContent}
          language={workspaceLang}
          onSave={setWorkspaceContent}
          onAIEdit={handleWorkspaceAIEdit}
          isAIEditing={isWorkspaceLoading}
        />
      </div>
    </div>
  );
}
