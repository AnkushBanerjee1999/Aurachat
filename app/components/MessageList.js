"use client";

import React, { useRef, useEffect, useState } from "react";

// A robust client-side markdown formatter that handles titles, bold text, code blocks, lists, and line breaks
function parseMarkdown(text, onOpenWorkspace) {
  if (!text) return [];

  const lines = text.split("\n");
  const parsedElements = [];
  let codeBlockContent = [];
  let inCodeBlock = false;
  let codeBlockLang = "";

  const renderTextFormatting = (rawText) => {
    // Basic bold **text** parsing
    const parts = rawText.split(/\*\*([^*]+)\*\*/g);
    return parts.map((part, index) => {
      if (index % 2 === 1) {
        return <strong key={index} className="font-bold text-zinc-900 dark:text-zinc-50">{part}</strong>;
      }
      // Inline code `code` parsing
      const subParts = part.split(/`([^`]+)`/g);
      return subParts.map((subPart, subIndex) => {
        if (subIndex % 2 === 1) {
          return (
            <code
              key={subIndex}
              className="rounded bg-zinc-200/60 px-1.5 py-0.5 font-mono text-xs text-purple-600 dark:bg-zinc-800 dark:text-purple-400"
            >
              {subPart}
            </code>
          );
        }
        return subPart;
      });
    });
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Toggle Code block
    if (line.trim().startsWith("```")) {
      if (inCodeBlock) {
        inCodeBlock = false;
        const codeText = codeBlockContent.join("\n");
        parsedElements.push(
          <div key={`code-${i}`} className="relative my-3 overflow-hidden rounded-xl bg-zinc-950 text-zinc-100 font-mono text-xs">
            <div className="flex items-center justify-between bg-zinc-905 px-4 py-2.5 text-[10px] text-zinc-400 font-sans border-b border-zinc-900">
              <span className="uppercase font-semibold tracking-wider text-purple-400">{codeBlockLang || "code"}</span>
              <div className="flex items-center gap-3">
                {onOpenWorkspace && (
                  <button
                    onClick={() => onOpenWorkspace(`${codeBlockLang || "playground"}_snippet`, codeText, codeBlockLang || "text")}
                    className="flex items-center gap-1.5 hover:text-zinc-100 cursor-pointer transition-colors"
                    title="Open snippet in playground workspace"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-3.5 w-3.5 text-purple-400">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                    </svg>
                    <span>Open in Workspace</span>
                  </button>
                )}
                <CopyCodeButton text={codeText} />
              </div>
            </div>
            <pre className="overflow-x-auto p-4 leading-relaxed scrollbar-thin">
              <code>{codeText}</code>
            </pre>
          </div>
        );
        codeBlockContent = [];
        codeBlockLang = "";
      } else {
        inCodeBlock = true;
        codeBlockLang = line.trim().slice(3);
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockContent.push(line);
      continue;
    }

    // Headers
    if (line.startsWith("# ")) {
      parsedElements.push(
        <h1 key={`h1-${i}`} className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mt-4 mb-2">
          {renderTextFormatting(line.slice(2))}
        </h1>
      );
      continue;
    }
    if (line.startsWith("## ")) {
      parsedElements.push(
        <h2 key={`h2-${i}`} className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-150 mt-3.5 mb-2">
          {renderTextFormatting(line.slice(3))}
        </h2>
      );
      continue;
    }
    if (line.startsWith("### ")) {
      parsedElements.push(
        <h3 key={`h3-${i}`} className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-200 mt-3 mb-1.5">
          {renderTextFormatting(line.slice(4))}
        </h3>
      );
      continue;
    }

    // Bullet list items
    if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
      parsedElements.push(
        <li key={`li-${i}`} className="list-disc ml-5 my-1 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          {renderTextFormatting(line.trim().slice(2))}
        </li>
      );
      continue;
    }

    // Numbered list items
    const numMatch = line.match(/^(\d+)\.\s(.*)/);
    if (numMatch) {
      parsedElements.push(
        <li key={`ol-${i}`} className="list-decimal ml-5 my-1 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          {renderTextFormatting(numMatch[2])}
        </li>
      );
      continue;
    }

    // Blockquote
    if (line.startsWith("> ")) {
      parsedElements.push(
        <blockquote key={`bq-${i}`} className="border-l-4 border-purple-500 pl-4 my-2.5 italic text-zinc-600 dark:text-zinc-400">
          {renderTextFormatting(line.slice(2))}
        </blockquote>
      );
      continue;
    }

    // Regular line
    if (line.trim() === "") {
      parsedElements.push(<div key={`space-${i}`} className="h-2" />);
    } else {
      parsedElements.push(
        <p key={`p-${i}`} className="text-sm leading-relaxed text-zinc-750 dark:text-zinc-300 my-1">
          {renderTextFormatting(line)}
        </p>
      );
    }
  }

  return parsedElements;
}

// Copy Code Helper Button
function CopyCodeButton({ text }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1 hover:text-zinc-200 transition-colors"
    >
      {copied ? (
        <>
          <svg className="h-3 w-3 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-emerald-400">Copied!</span>
        </>
      ) : (
        <>
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
          </svg>
          <span>Copy</span>
        </>
      )}
    </button>
  );
}

// Copy Message Bubble Helper Button
function CopyMessageButton({ text }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className="rounded-lg p-1.5 opacity-0 group-hover:opacity-100 bg-white/90 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 shadow-sm border border-zinc-200/50 dark:bg-zinc-900/90 dark:border-zinc-800 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition-all duration-200 cursor-pointer"
      title="Copy message"
    >
      {copied ? (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-3.5 w-3.5 text-emerald-500">
          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-3.5 w-3.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H5.25m11.9-3.664A2.251 2.251 0 0 0 15 2.25h-3a2.251 2.251 0 0 0-2.15 1.586m5.8 0c.065.21.1.433.1.664v.75h-6V4.5c0-.231.035-.454.1-.664M6.75 7.5H4.875c-.621 0-1.125.504-1.125 1.125v12c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V16.5" />
        </svg>
      )}
    </button>
  );
}

// Speak Message Bubble Helper Button using Text-to-Speech Web Speech API
function SpeakMessageButton({ text, isSpeaking, onSpeak }) {
  return (
    <button
      onClick={onSpeak}
      className={`rounded-lg p-1.5 opacity-0 group-hover:opacity-100 shadow-sm border transition-all duration-200 cursor-pointer ${
        isSpeaking
          ? "bg-purple-600 border-purple-600 text-white opacity-100!"
          : "bg-white/90 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 border-zinc-200/50 dark:bg-zinc-900/90 dark:border-zinc-800 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
      }`}
      title={isSpeaking ? "Stop speaking" : "Speak response"}
    >
      {isSpeaking ? (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-3.5 w-3.5 animate-pulse">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25v13.5m-7.5-13.5v13.5" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-3.5 w-3.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" />
        </svg>
      )}
    </button>
  );
}

export default function MessageList({ messages, isLoading, activeTone, activeLimit, onOpenWorkspace, onEditMessage }) {
  const [speakingMsgId, setSpeakingMsgId] = useState("");
  const [editingMsgId, setEditingMsgId] = useState("");
  const [editingText, setEditingText] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => {
    // Cleanup speak synthesis on unmount
    return () => {
      if (typeof window !== "undefined") {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleSpeak = (msgId, text) => {
    if (speakingMsgId === msgId) {
      window.speechSynthesis.cancel();
      setSpeakingMsgId("");
      return;
    }

    window.speechSynthesis.cancel();

    // Strip markdown tags from AI responses before reading aloud
    const cleanedText = text
      .replace(/[#*`>]/g, "")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanedText);
    utterance.onend = () => setSpeakingMsgId("");
    utterance.onerror = () => setSpeakingMsgId("");
    window.speechSynthesis.speak(utterance);
    setSpeakingMsgId(msgId);
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-2xl mx-auto">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-tr from-purple-500 to-pink-500 text-white shadow-xl shadow-purple-500/20 animate-bounce duration-1000">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-8 w-8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-3.924a1.5 1.5 0 0 1 1.06-.44h4.902c1.584 0 2.707-1.34 2.707-2.94V6.74c0-1.6-1.123-2.994-2.707-3.227A48.393 48.393 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.74v5.77a.07.07 0 0 0 .07.07Z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-2">
          Say Hello to AuraChat
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-8 max-w-md">
          Your all-in-one AI assistant powered by Google Gemini — ask anything, explore any topic, and get beautifully styled responses.
        </p>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full text-left">
          <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50/50 p-4 dark:border-zinc-800/85 dark:bg-zinc-900/30">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 mb-2.5">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-4 w-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
              </svg>
            </span>
            <h4 className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-1">Custom Tones</h4>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-normal">
              Switch tones seamlessly between **Short** (concise), **Professional** (formal), and **Detailed** (deep-dive analyses).
            </p>
          </div>
          <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50/50 p-4 dark:border-zinc-800/85 dark:bg-zinc-900/30">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-pink-50 text-pink-600 dark:bg-pink-950/40 dark:text-pink-400 mb-2.5">
              <svg xmlns="http://www.w3.org/2050/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-4 w-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
            </span>
            <h4 className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-1">Strict Word Limits</h4>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-normal">
              Toggle response length boundaries of **15 words**, **30 words**, or **Unlimited** to control parsing density.
            </p>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-center gap-2 text-xs text-zinc-450 dark:text-zinc-500 bg-zinc-100/50 dark:bg-zinc-900/50 px-4 py-2 rounded-xl">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4 text-purple-500">
            <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 1 1 .513 1.293l-.041.02-.041-.02a.75.75 0 0 1-.513-1.293ZM7.5 12h9m.086-4.218A48.174 48.174 0 0 0 12 7.5c-2.392 0-4.744.175-7.043.513C3.373 8.253 2.25 9.647 2.25 11.248v5.772c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125v-5.772c0-1.602-1.123-2.995-2.707-3.228Z" />
          </svg>
          <span>Active settings: <span className="font-semibold text-zinc-700 dark:text-zinc-300">{activeTone}</span> Tone • <span className="font-semibold text-zinc-700 dark:text-zinc-300">{activeLimit === "unlimited" ? "Unlimited" : activeLimit + " Words"}</span> limit</span>
        </div>
      </div>
    );
  }

  const lastMessage = messages[messages.length - 1];
  const isStreamingStarted = lastMessage && lastMessage.role === "model" && lastMessage.content !== "";
  const showThinkingIndicator = isLoading && !isStreamingStarted;

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 md:px-8 space-y-6 scrollbar-thin">
      <div className="max-w-3xl mx-auto space-y-6">
        {messages.map((message) => {
          const isUser = message.role === "user";
          if (!isUser && message.content === "") return null;

          return (
            <div
              key={message.id}
              className={`flex items-start gap-3 md:gap-4 group animate-in fade-in slide-in-from-bottom-2 duration-300 ${
                isUser ? "flex-row-reverse" : "flex-row"
              }`}
            >
              {/* Avatar Indicator */}
              <div
                className={`flex h-8 w-8 md:h-9 md:w-9 shrink-0 select-none items-center justify-center rounded-xl font-bold shadow-xs ${
                  isUser
                    ? "bg-gradient-to-tr from-purple-500 to-indigo-600 text-white"
                    : "bg-gradient-to-tr from-zinc-150 to-zinc-250 dark:from-zinc-800 dark:to-zinc-900 border border-zinc-200/50 dark:border-zinc-800/80 text-zinc-700 dark:text-zinc-300"
                }`}
              >
                {isUser ? (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-4.5 w-4.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2050/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-4.5 w-4.5 text-purple-600 dark:text-purple-400">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 21l-.813-5.096L3 15l5.096-.813L9 9l.813 5.187L15 15l-5.187.904Z" />
                  </svg>
                )}
              </div>

              {/* Message Bubble Column */}
              <div className="flex flex-col max-w-[80%] md:max-w-[70%] space-y-1">
                <div className={`flex items-center gap-2 ${isUser ? "justify-end" : "justify-start"}`}>
                  <span className="text-[10px] font-semibold text-zinc-450 dark:text-zinc-500">
                    {isUser ? "You" : "Assistant"}
                  </span>
                  <span className="text-[10px] text-zinc-300 dark:text-zinc-600">•</span>
                  <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
                    {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div className="flex items-start gap-2">
                  <div
                    className={`rounded-2xl px-4 py-2.5 text-sm shadow-xs border transition-all ${
                      isUser
                        ? editingMsgId === message.id
                          ? "bg-white border-zinc-300 text-zinc-800 rounded-tr-none dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-100 min-w-[280px] sm:min-w-[400px]"
                          : "bg-purple-600 border-purple-600 text-white rounded-tr-none"
                        : "bg-white border-zinc-150 text-zinc-800 rounded-tl-none dark:bg-zinc-900 dark:border-zinc-850 dark:text-zinc-100"
                    }`}
                  >
                    {isUser ? (
                      editingMsgId === message.id ? (
                        <div className="w-full space-y-2.5 py-1">
                          <textarea
                            value={editingText}
                            onChange={(e) => setEditingText(e.target.value)}
                            className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-955 px-3 py-2 text-sm text-zinc-800 dark:text-zinc-205 focus:outline-none focus:ring-1 focus:ring-purple-500 font-sans resize-y min-h-[70px]"
                            placeholder="Edit your message..."
                          />
                          <div className="flex gap-2 justify-end">
                            <button
                              type="button"
                              onClick={() => setEditingMsgId("")}
                              className="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-650 dark:text-zinc-400 text-[11px] font-bold hover:bg-zinc-50 dark:hover:bg-zinc-800/60 cursor-pointer transition-all active:scale-95 shadow-xs"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (editingText.trim() !== "") {
                                  onEditMessage?.(message.id, editingText.trim());
                                  setEditingMsgId("");
                                }
                              }}
                              className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-750 text-white text-[11px] font-bold shadow-sm active:scale-95 cursor-pointer transition-all"
                            >
                              Save & Submit
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                          {message.files && message.files.length > 0 && (
                            <div className="flex flex-col gap-1.5 pt-2 mt-1.5 border-t border-white/15">
                              {message.files.map((file, idx) => {
                                const isImage = file.type && file.type.startsWith("image/");
                                const sizeInKB = file.content
                                  ? file.content.length / 1024
                                  : file.base64
                                  ? (file.base64.length * 0.75) / 1024
                                  : 0;

                                return (
                                  <div key={idx} className="flex flex-col gap-1.5">
                                    {isImage && file.base64 ? (
                                      <div className="relative overflow-hidden rounded-lg max-w-[200px] border border-white/20 shadow-sm">
                                        <img
                                          src={`data:${file.type};base64,${file.base64}`}
                                          alt={file.name}
                                          className="h-auto max-h-36 w-full object-cover"
                                        />
                                      </div>
                                    ) : (
                                      <div
                                        className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-xs text-white/90 shadow-sm"
                                      >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="h-4 w-4 shrink-0 opacity-80">
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                                        </svg>
                                        <span className="truncate max-w-[180px] font-semibold">{file.name}</span>
                                        <span className="text-[10px] text-white/60">({sizeInKB.toFixed(1)} KB)</span>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )
                    ) : (
                      <div className="space-y-1">{parseMarkdown(message.content, onOpenWorkspace)}</div>
                    )}
                  </div>

                  {/* User Edit Action Button */}
                  {isUser && editingMsgId !== message.id && (
                    <div className="self-center flex flex-col shrink-0">
                      <button
                        onClick={() => {
                          setEditingMsgId(message.id);
                          setEditingText(message.content);
                        }}
                        className="rounded-lg p-1.5 opacity-0 group-hover:opacity-100 bg-white/90 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 shadow-sm border border-zinc-200/50 dark:bg-zinc-900/90 dark:border-zinc-800 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition-all duration-200 cursor-pointer"
                        title="Edit message"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="h-3.5 w-3.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.83 20.089a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                        </svg>
                      </button>
                    </div>
                  )}

                  {/* Assistant Action Buttons */}
                  {!isUser && (
                    <div className="self-center flex flex-col gap-1 sm:flex-row shrink-0">
                      {onOpenWorkspace && message.content.length > 100 && (
                        <button
                          onClick={() => onOpenWorkspace(`document_${message.id.slice(-6)}`, message.content, "markdown")}
                          className="flex h-7 w-7 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800 dark:border-zinc-850 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 transition-all cursor-pointer shadow-sm"
                          title="Open full text in Workspace"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="h-4 w-4 text-purple-500">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                          </svg>
                        </button>
                      )}
                      <CopyMessageButton text={message.content} />
                      <SpeakMessageButton
                        text={message.content}
                        isSpeaking={speakingMsgId === message.id}
                        onSpeak={() => handleSpeak(message.id, message.content)}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Thinking Indicator */}
        {showThinkingIndicator && (
          <div className="flex items-start gap-3 md:gap-4 animate-pulse">
            <div className="flex h-8 w-8 md:h-9 md:w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-zinc-150 to-zinc-250 dark:from-zinc-800 dark:to-zinc-900 border border-zinc-200/50 dark:border-zinc-800/80 text-zinc-700 dark:text-zinc-300">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-4.5 w-4.5 text-purple-500">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 21l-.813-5.096L3 15l5.096-.813L9 9l.813 5.187L15 15l-5.187.904Z" />
              </svg>
            </div>
            <div className="flex flex-col space-y-1">
              <span className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500">
                Assistant is thinking...
              </span>
              <div className="rounded-2xl rounded-tl-none px-4 py-3.5 bg-white border border-zinc-150 dark:bg-zinc-900 dark:border-zinc-850">
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 animate-bounce rounded-full bg-zinc-400 dark:bg-zinc-600 [animation-delay:-0.3s]"></div>
                  <div className="h-2 w-2 animate-bounce rounded-full bg-zinc-400 dark:bg-zinc-600 [animation-delay:-0.15s]"></div>
                  <div className="h-2 w-2 animate-bounce rounded-full bg-zinc-400 dark:bg-zinc-600"></div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}
