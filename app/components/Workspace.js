"use client";

import React, { useState, useEffect, useRef } from "react";

export default function Workspace({
  isOpen,
  onClose,
  title,
  content,
  language,
  onSave,
  onAIEdit,
  isAIEditing,
}) {
  const [editorText, setEditorText] = useState(content);
  const [aiInstruction, setAiInstruction] = useState("");
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef(null);

  // Sync state when content changes from the outside
  useEffect(() => {
    setEditorText(content);
  }, [content]);

  if (!isOpen) return null;

  const handleTextChange = (e) => {
    setEditorText(e.target.value);
    onSave(e.target.value);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(editorText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    let ext = "txt";
    const lang = language.toLowerCase();
    if (lang.includes("javascript") || lang === "js") ext = "js";
    else if (lang.includes("typescript") || lang === "ts") ext = "ts";
    else if (lang === "tsx") ext = "tsx";
    else if (lang === "jsx") ext = "jsx";
    else if (lang === "python" || lang === "py") ext = "py";
    else if (lang === "html") ext = "html";
    else if (lang === "css") ext = "css";
    else if (lang === "json") ext = "json";
    else if (lang === "markdown" || lang === "md") ext = "md";
    else if (lang === "csv") ext = "csv";

    const blob = new Blob([editorText], { type: "text/plain;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${title.toLowerCase().replace(/[^a-z0-9]/gi, "_")}.${ext}`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAISubmit = (e) => {
    e.preventDefault();
    if (aiInstruction.trim() === "" || isAIEditing) return;
    onAIEdit(aiInstruction.trim());
    setAiInstruction("");
  };

  // Generate line numbers count
  const lineCount = editorText.split("\n").length;
  const lineNumbers = Array.from({ length: lineCount }).map((_, i) => i + 1);

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex w-full flex-col border-l border-zinc-200 bg-zinc-900 text-zinc-100 shadow-2xl transition-all duration-300 md:static md:w-[45%] md:h-full dark:border-zinc-800 animate-in slide-in-from-right duration-300">
      
      {/* Workspace Header */}
      <div className="flex h-16 items-center justify-between border-b border-zinc-800 px-4">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.8}
              stroke="currentColor"
              className="h-4.5 w-4.5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5"
              />
            </svg>
          </span>
          <div className="min-w-0">
            <h3 className="truncate text-xs font-bold text-zinc-100 tracking-tight" title={title}>
              {title || "Playground Document"}
            </h3>
            <span className="text-[10px] uppercase font-semibold tracking-wider text-purple-400">
              {language || "Text"}
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1">
          {/* Copy Button */}
          <button
            onClick={handleCopy}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
            title="Copy Workspace"
          >
            {copied ? (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-4 w-4 text-emerald-450">
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H5.25m11.9-3.664A2.251 2.251 0 0 0 15 2.25h-3a2.251 2.251 0 0 0-2.15 1.586m5.8 0c.065.21.1.433.1.664v.75h-6V4.5c0-.231.035-.454.1-.664M6.75 7.5H4.875c-.621 0-1.125.504-1.125 1.125v12c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V16.5" />
              </svg>
            )}
          </button>

          {/* Download Button */}
          <button
            onClick={handleDownload}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
            title="Download File"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
          </button>

          <div className="h-6 w-px bg-zinc-800 mx-1"></div>

          {/* Close Panel Button */}
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
            title="Close Workspace"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.8}
              stroke="currentColor"
              className="h-4.5 w-4.5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Editor Content Area */}
      <div className="flex-1 overflow-hidden relative flex text-sm font-mono bg-zinc-950">
        
        {/* Line Numbers columns */}
        <div className="select-none py-4 text-right text-zinc-600 bg-zinc-900/40 w-11 pr-2.5 border-r border-zinc-900 leading-6">
          {lineNumbers.map((num) => (
            <div key={num}>{num}</div>
          ))}
        </div>

        {/* Text editor area */}
        <div className="flex-1 relative overflow-hidden h-full">
          <textarea
            ref={textareaRef}
            value={editorText}
            onChange={handleTextChange}
            disabled={isAIEditing}
            className="w-full h-full p-4 bg-transparent outline-none border-none text-zinc-200 resize-none overflow-y-auto leading-6 font-mono scrollbar-thin focus:ring-0 focus:outline-none"
            spellCheck={false}
          />

          {/* AI Editing Overlay Shimmer */}
          {isAIEditing && (
            <div className="absolute inset-0 bg-zinc-955/80 backdrop-blur-xs flex flex-col items-center justify-center animate-pulse">
              <div className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5 text-purple-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-xs font-semibold text-purple-400 tracking-wide uppercase">
                  Aura AI Refactoring...
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* AI Refactor Input Bar */}
      <div className="border-t border-zinc-800 bg-zinc-900/90 p-4">
        <form onSubmit={handleAISubmit} className="flex gap-2 items-center rounded-xl bg-zinc-950 border border-zinc-800 p-2 focus-within:border-purple-500 transition-all duration-200">
          <span className="text-purple-400 pl-1.5">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="h-4.5 w-4.5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 21l-.813-5.096L3 15l5.096-.813L9 9l.813 5.187L15 15l-5.187.904Z" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Instruct AI to edit this code/document..."
            value={aiInstruction}
            onChange={(e) => setAiInstruction(e.target.value)}
            disabled={isAIEditing}
            className="flex-1 bg-transparent px-2.5 py-1 text-xs text-zinc-200 outline-none placeholder-zinc-500"
          />
          <button
            type="submit"
            disabled={aiInstruction.trim() === "" || isAIEditing}
            className={`flex h-7 px-3 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold shadow-md transition-all duration-200 ${
              aiInstruction.trim() === "" || isAIEditing
                ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                : "bg-purple-600 hover:bg-purple-755 text-white cursor-pointer active:scale-95"
            }`}
          >
            Refactor
          </button>
        </form>
      </div>

    </div>
  );
}
