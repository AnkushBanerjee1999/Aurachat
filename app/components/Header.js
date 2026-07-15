"use client";

import React, { useState } from "react";
import { DEFAULT_DUMMY_KEY } from "../utils/api";

export default function Header({
  tone,
  setTone,
  wordLimit,
  setWordLimit,
  apiKey,
  setApiKey,
  sidebarOpen,
  setSidebarOpen,
}) {
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [inputKey, setInputKey] = useState(apiKey);
  const [isSaved, setIsSaved] = useState(false);

  const handleSaveKey = () => {
    setApiKey(inputKey);
    localStorage.setItem("aura_gemini_api_key", inputKey);
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      setShowKeyModal(false);
    }, 1500);
  };

  const activeKey = apiKey || DEFAULT_DUMMY_KEY;
  const isDemo = !activeKey || activeKey.toLowerCase().startsWith("dummy") || activeKey.trim() === "";

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-200/80 bg-white/80 backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-950/80 transition-colors duration-300">
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        
        {/* Left section: Logo & Sidebar Toggle */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          <button
            id="tour-sidebar-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100 transition-colors duration-200"
            aria-label="Toggle sidebar"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="h-5 w-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12"
              />
            </svg>
          </button>
          
          <div className="flex items-center gap-1.5">
            <span className="flex h-7.5 w-7.5 sm:h-8 sm:w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 text-white shadow-md shadow-purple-500/20">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="h-4 w-4 sm:h-4.5 sm:w-4.5 animate-pulse"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9.813 15.904 9 21l-.813-5.096L3 15l5.096-.813L9 9l.813 5.187L15 15l-5.187.904Z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.071 4.929a10 10 0 0 0-14.142 0M12 3v1m0 16v1m-9-9h1m16 0h1"
                />
              </svg>
            </span>
            <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-sm sm:text-lg font-bold tracking-tight text-transparent dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400 hidden min-[380px]:inline">
              AuraChat
            </span>
          </div>
        </div>

        {/* Center/Right Section: Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 md:gap-4">
          
          {/* Tone Selector */}
          <div id="tour-tone" className="flex flex-col">
            <label className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-0.5 hidden sm:block">
              Tone
            </label>
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              className="h-8 sm:h-9 rounded-lg border border-zinc-200 bg-zinc-50 px-1.5 sm:px-2.5 py-0.5 sm:py-1 text-[11px] sm:text-xs font-medium text-zinc-700 outline-none hover:border-zinc-300 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-700 dark:focus:border-purple-400 dark:focus:ring-purple-400 transition-all duration-200 cursor-pointer"
            >
              <option value="Short">Short</option>
              <option value="Professional">Professional</option>
              <option value="Detailed">Detailed</option>
            </select>
          </div>

          {/* Word Limit Selector */}
          <div id="tour-limit" className="flex flex-col">
            <label className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-0.5 hidden sm:block">
              Word Limit
            </label>
            <select
              value={wordLimit}
              onChange={(e) => setWordLimit(e.target.value)}
              className="h-8 sm:h-9 rounded-lg border border-zinc-200 bg-zinc-50 px-1.5 sm:px-2.5 py-0.5 sm:py-1 text-[11px] sm:text-xs font-medium text-zinc-700 outline-none hover:border-zinc-300 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-700 dark:focus:border-purple-400 dark:focus:ring-purple-400 transition-all duration-200 cursor-pointer"
            >
              <option value="15">15 Words</option>
              <option value="30">30 Words</option>
              <option value="unlimited">Unlimited</option>
            </select>
          </div>

          <div className="h-8 w-px bg-zinc-200 dark:bg-zinc-800 mx-0.5 sm:mx-1 hidden xs:block"></div>

          {/* API Status Badge & Key config button */}
          <div id="tour-api-status" className="flex items-center gap-2">
            <button
              onClick={() => {
                setInputKey(apiKey);
                setShowKeyModal(!showKeyModal);
              }}
              className={`flex items-center gap-1.5 rounded-lg px-2 sm:px-3 py-1 sm:py-1.5 text-[11px] sm:text-xs font-semibold transition-all duration-300 shadow-sm ${
                isDemo
                  ? "bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30"
                  : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30"
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="h-3.5 w-3.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z"
                />
              </svg>
              <span className="hidden min-[480px]:inline">{isDemo ? "Demo" : "Live API"}</span>
            </button>
          </div>

        </div>
      </div>

      {/* Floating Key Configuration Modal */}
      {showKeyModal && (
        <div className="absolute right-4 top-18 w-80 rounded-2xl border border-zinc-200 bg-white p-4 shadow-xl dark:border-zinc-800 dark:bg-zinc-900 z-50 animate-in fade-in slide-in-from-top-3 duration-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Configure Gemini API Key
            </h3>
            <button
              onClick={() => setShowKeyModal(false)}
              className="rounded-full p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="h-4 w-4"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4 leading-relaxed">
            Please enter your Google Gemini API key. If left blank or using a dummy key, the app will simulate realistic responses locally.
          </p>
          <div className="space-y-3">
            <div className="relative">
              <input
                type="password"
                placeholder="AIzaSy..."
                value={inputKey}
                onChange={(e) => setInputKey(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2 text-xs font-mono outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200 dark:focus:border-purple-400"
              />
            </div>
            <button
              onClick={handleSaveKey}
              disabled={isSaved}
              className={`w-full rounded-xl py-2 text-xs font-semibold text-white shadow-md shadow-purple-500/10 transition-all duration-300 ${
                isSaved
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : "bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600"
              }`}
            >
              {isSaved ? "Saved Successfully!" : "Save Changes"}
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
