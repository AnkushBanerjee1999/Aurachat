"use client";

import React, { useRef, useEffect, useState } from "react";
import { enhancePromptWithAI } from "../utils/api";

export default function MessageInput({ onSend, isLoading, isEmptySession, apiKey }) {
  const [text, setText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [recognition, setRecognition] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [particles, setParticles] = useState([]);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  // Initialize Speech Recognition on client-side mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        rec.continuous = false;
        rec.interimResults = false;
        rec.lang = "en-US";

        rec.onstart = () => setIsRecording(true);
        rec.onend = () => setIsRecording(false);
        rec.onerror = (e) => {
          console.error("Speech recognition error:", e);
          setIsRecording(false);
        };
        rec.onresult = (event) => {
          const transcript = event.results[0][0].transcript;
          setText((prev) => (prev ? prev + " " + transcript : transcript));
        };
        setRecognition(rec);
      }
    }
  }, []);

  const handleToggleRecording = (e) => {
    e.preventDefault();
    if (!recognition) {
      alert("Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.");
      return;
    }

    if (isRecording) {
      recognition.stop();
    } else {
      recognition.start();
    }
  };

  // Auto-resize textarea to fit content height
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "auto";
    const scrollHeight = textarea.scrollHeight;
    // Set max height of 180px
    textarea.style.height = `${Math.min(scrollHeight, 180)}px`;
  }, [text]);

  const handleFileChange = (e) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const isImage = file.type.startsWith("image/");
      const maxSize = isImage ? 4 * 1024 * 1024 : 1024 * 1024; // 4MB for images, 1MB for text

      if (file.size > maxSize) {
        alert(`File ${file.name} is too large. Max size allowed is ${isImage ? "4MB" : "1MB"}.`);
        return;
      }

      const reader = new FileReader();
      
      if (isImage) {
        reader.onload = (event) => {
          const dataUrl = event.target?.result;
          const base64Parts = dataUrl.split(";base64,");
          if (base64Parts.length === 2) {
            const base64 = base64Parts[1];
            setSelectedFiles((prev) => [
              ...prev,
              { name: file.name, type: file.type, base64 }
            ]);
          }
        };
        reader.readAsDataURL(file);
      } else {
        reader.onload = (event) => {
          const content = event.target?.result;
          setSelectedFiles((prev) => [
            ...prev,
            { name: file.name, type: file.type, content }
          ]);
        };
        reader.readAsText(file);
      }
    });
    // Clear selection
    e.target.value = "";
  };

  const triggerSparkles = () => {
    const colors = ["#a855f7", "#ec4899", "#6366f1", "#f43f5e", "#3b82f6"];
    const newParticles = Array.from({ length: 15 }).map((_, i) => ({
      id: Date.now() + i,
      x: (Math.random() - 0.5) * 300, // random distance left/right (-150px to 150px)
      y: -Math.random() * 80 - 40,    // random distance up (-40px to -120px)
      r: Math.random() * 360,         // random rotation
      delay: Math.random() * 0.15,    // staggered delay
      color: colors[Math.floor(Math.random() * colors.length)],
    }));
    setParticles(newParticles);
    setTimeout(() => setParticles([]), 1200);
  };

  const handleEnhance = async (e) => {
    e.preventDefault();
    if (text.trim() === "" || isEnhancing) return;

    setIsEnhancing(true);
    try {
      const enhancedText = await enhancePromptWithAI(text.trim(), apiKey);
      setText(enhancedText);
      triggerSparkles();
    } catch (err) {
      console.error("Failed to enhance prompt:", err);
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (text.trim() === "" && selectedFiles.length === 0) return;
    if (isLoading) return;

    onSend(text.trim(), selectedFiles);
    setText("");
    setSelectedFiles([]);
    
    // Focus back on textarea
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 50);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const suggestions = [
    {
      title: "15 Words Summary",
      desc: "Quantum physics basics",
      prompt: "Explain quantum physics to a five year old.",
      actionLabel: "Short + 15 Words",
    },
    {
      title: "Professional Email",
      desc: "Apology for a late deliverable",
      prompt: "Write a short apology email to my client for submitting the report late.",
      actionLabel: "Professional + 30 Words",
    },
    {
      title: "Detailed Analysis",
      desc: "Next.js 16 & React 19 features",
      prompt: "Give me an overview of the key improvements in Next.js 16 and React 19.",
      actionLabel: "Detailed + Unlimited",
    },
  ];

  return (
    <div className="border-t border-zinc-200/80 bg-white/95 px-4 py-4 dark:border-zinc-800/80 dark:bg-zinc-950/95 backdrop-blur-xs transition-colors duration-300">
      <div className="max-w-3xl mx-auto space-y-4">
        
        {/* Suggestion Chips (only when session has no messages) */}
        {isEmptySession && (
          <div className="flex flex-wrap gap-2.5 pb-1 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {suggestions.map((s, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setText(s.prompt);
                  textareaRef.current?.focus();
                }}
                className="flex flex-col items-start gap-0.5 rounded-xl border border-zinc-200 bg-zinc-50/50 p-2.5 text-left hover:bg-purple-500/5 hover:border-purple-500/30 dark:border-zinc-800/80 dark:bg-zinc-900/40 dark:hover:bg-purple-500/10 dark:hover:border-purple-400/30 transition-all duration-200 cursor-pointer"
              >
                <span className="text-[10px] font-semibold text-purple-600 dark:text-purple-400">
                  {s.title}
                </span>
                <span className="text-[11px] text-zinc-600 dark:text-zinc-400 font-medium">
                  {s.desc}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* File Attachments Preview */}
        {selectedFiles.length > 0 && (
          <div className="flex flex-wrap gap-2.5 pb-1 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {selectedFiles.map((file, idx) => (
              <div
                key={idx}
                className="flex items-center gap-1.5 rounded-xl border border-purple-250/60 bg-purple-500/5 px-3 py-1.5 text-xs text-purple-750 dark:border-purple-900/30 dark:bg-purple-950/20 dark:text-purple-300 shadow-sm"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="h-3.5 w-3.5 text-purple-500">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                </svg>
                <span className="truncate max-w-[150px] font-semibold tracking-tight">{file.name}</span>
                <button
                  type="button"
                  onClick={() => setSelectedFiles((prev) => prev.filter((_, i) => i !== idx))}
                  className="rounded-full p-0.5 hover:bg-purple-200/50 hover:text-purple-900 dark:hover:bg-purple-900/50 dark:hover:text-purple-100 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-3.5 w-3.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Input Bar */}
        <form id="tour-message-input" onSubmit={handleSubmit} className="relative flex items-end gap-2 rounded-2xl border border-zinc-200 bg-zinc-50/80 p-2.5 focus-within:border-purple-500 focus-within:ring-1 focus-within:ring-purple-500 dark:border-zinc-800 dark:bg-zinc-900/60 dark:focus-within:border-purple-400 dark:focus-within:ring-purple-400 transition-all duration-200">
          {/* Enhancing Aura Glow Background */}
          {isEnhancing && (
            <div className="absolute inset-0 -m-[1px] rounded-2xl bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-600 opacity-60 blur-xs animate-pulse pointer-events-none -z-10" />
          )}

          {/* Sparkles Particle Renderer */}
          {particles.length > 0 && (
            <div className="absolute left-1/2 top-0 pointer-events-none z-50">
              {particles.map((p) => (
                <svg
                  key={p.id}
                  xmlns="http://www.w3.org/2000/svg"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  className="animate-sparkle-particle w-4 h-4"
                  style={{
                    color: p.color,
                    animationDelay: `${p.delay}s`,
                    "--tw-part-x": `${p.x}px`,
                    "--tw-part-y": `${p.y}px`,
                    "--tw-part-r": `${p.r}deg`,
                  }}
                >
                  <path d="M9.813 15.904 9 21l-.813-5.096L3 15l5.096-.813L9 9l.813 5.187L15 15l-5.187.904Z" />
                </svg>
              ))}
            </div>
          )}

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            multiple
            accept=".txt,.js,.ts,.tsx,.py,.css,.html,.json,.md,.csv,image/*"
            className="hidden"
          />

          {/* Paperclip Button */}
          <button
            id="tour-upload"
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-500 dark:bg-zinc-800 dark:hover:bg-zinc-705 dark:text-zinc-400 cursor-pointer transition-all duration-200"
            title="Attach images, code, or text files"
            disabled={isLoading}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="h-4.5 w-4.5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="m18.375 12.739-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.81 7.81a1.5 1.5 0 0 0 2.112 2.13" />
            </svg>
          </button>

          <textarea
            id="tour-input"
            ref={textareaRef}
            rows={1}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message... (Press Enter to send, Shift+Enter for new line)"
            className="flex-1 max-h-[180px] min-h-[24px] resize-none bg-transparent px-2.5 py-1 text-sm text-zinc-800 outline-none placeholder-zinc-400 dark:text-zinc-200 dark:placeholder-zinc-500"
            disabled={isLoading}
          />
          
          {/* Magic Wand Prompt Enhancer Button */}
          {text.trim() !== "" && (
            <button
              id="tour-wand"
              type="button"
              onClick={handleEnhance}
              disabled={isEnhancing || isLoading}
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all duration-200 ${
                isEnhancing
                  ? "bg-purple-100 text-purple-600 dark:bg-purple-950/60 dark:text-purple-300"
                  : "bg-purple-50 hover:bg-purple-100 text-purple-600 hover:scale-105 active:scale-95 dark:bg-purple-950/40 dark:text-purple-400 dark:hover:bg-purple-950/80 cursor-pointer"
              }`}
              title="Enhance prompt with AI"
            >
              {isEnhancing ? (
                <svg className="animate-spin h-4.5 w-4.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2.5}
                  stroke="currentColor"
                  className="h-4.5 w-4.5"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 21l-.813-5.096L3 15l5.096-.813L9 9l.813 5.187L15 15l-5.187.904Z" />
                </svg>
              )}
            </button>
          )}

          {/* STT Microphone Button */}
          <button
            id="tour-voice"
            type="button"
            onClick={handleToggleRecording}
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all duration-200 ${
              isRecording
                ? "bg-red-500 text-white animate-pulse"
                : "bg-zinc-100 hover:bg-zinc-200 text-zinc-500 dark:bg-zinc-800 dark:hover:bg-zinc-705 dark:text-zinc-400 cursor-pointer"
            }`}
            title={isRecording ? "Stop recording" : "Record voice input"}
            disabled={isLoading}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="h-4.5 w-4.5"
            >
              {isRecording ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 7.5A2.25 2.25 0 0 1 7.5 5.25h9a2.25 2.25 0 0 1 2.25 2.25v9a2.25 2.25 0 0 1-2.25 2.25h-9a2.25 2.25 0 0 1-2.25-2.25v-9Z" />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z"
                />
              )}
            </svg>
          </button>

          <button
            type="submit"
            disabled={text.trim() === "" || isLoading}
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-bold shadow-md transition-all duration-200 ${
              text.trim() === "" || isLoading
                ? "bg-zinc-200 text-zinc-400 shadow-none dark:bg-zinc-800 dark:text-zinc-600"
                : "bg-purple-600 text-white shadow-purple-500/20 hover:bg-purple-700 active:scale-95 dark:bg-purple-500 dark:hover:bg-purple-600 cursor-pointer"
            }`}
            aria-label="Send message"
          >
            {isLoading ? (
              // Loading circle animation
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              // Send arrow icon
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="h-4.5 w-4.5"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
              </svg>
            )}
          </button>
        </form>
        
        {/* Footer legal disclaimer */}
        <p className="text-[10px] text-center text-zinc-400 dark:text-zinc-500">
          AuraChat utilizes Google Gemini Flash. Verify critical information before relying on responses.
        </p>
      </div>
    </div>
  );
}
