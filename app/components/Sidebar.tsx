"use client";

import React, { useRef } from "react";
import { ToneType, WordLimitType, Message } from "../utils/api";

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  tone: ToneType;
  wordLimit: WordLimitType;
  createdAt: string;
}

interface SidebarProps {
  sessions: ChatSession[];
  activeSessionId: string;
  onSelectSession: (id: string) => void;
  onCreateSession: () => void;
  onDeleteSession: (id: string) => void;
  onClearAll: () => void;
  onRestoreSessions: (restored: ChatSession[]) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export default function Sidebar({
  sessions,
  activeSessionId,
  onSelectSession,
  onCreateSession,
  onDeleteSession,
  onClearAll,
  onRestoreSessions,
  isOpen,
  setIsOpen,
}: SidebarProps) {
  const restoreInputRef = useRef<HTMLInputElement>(null);

  // Export current chat conversation as clean Markdown
  const handleExportMarkdown = () => {
    const activeSession = sessions.find((s) => s.id === activeSessionId);
    if (!activeSession || activeSession.messages.length === 0) {
      alert("Please select a conversation with messages to export.");
      return;
    }

    let markdown = `# Conversation: ${activeSession.title}\n`;
    markdown += `Created: ${new Date(activeSession.createdAt).toLocaleString()}\n`;
    markdown += `Tone: ${activeSession.tone} | Word Limit: ${activeSession.wordLimit}\n\n`;
    markdown += `---\n\n`;

    activeSession.messages.forEach((msg) => {
      const roleName = msg.role === "user" ? "You" : "Assistant";
      markdown += `### **[${roleName}]** - ${new Date(msg.timestamp).toLocaleString()}\n\n`;
      markdown += `${msg.content}\n\n`;
      
      if (msg.files && msg.files.length > 0) {
        markdown += `*Attached Files:*\n`;
        msg.files.forEach((f) => {
          markdown += `- ${f.name} (${f.type}${f.base64 ? ", image" : ""})\n`;
        });
        markdown += `\n`;
      }
      markdown += `---\n\n`;
    });

    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${activeSession.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_chat.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export all conversations as JSON backup
  const handleBackupJSON = () => {
    if (sessions.length === 0) {
      alert("No conversation history found to backup.");
      return;
    }

    const dataStr = JSON.stringify(sessions, null, 2);
    const blob = new Blob([dataStr], { type: "application/json;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `aurachat_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Restore sessions from backup JSON
  const handleRestoreJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (
          Array.isArray(parsed) &&
          parsed.every((s) => s.id && s.title && Array.isArray(s.messages))
        ) {
          onRestoreSessions(parsed);
          alert(`Successfully restored ${parsed.length} conversation(s)!`);
        } else {
          alert("Invalid backup file format. The JSON file must be an array of chat sessions.");
        }
      } catch (err) {
        alert("Failed to parse JSON file. Please ensure it is a valid backup JSON.");
      }
    };
    reader.readAsText(file);
    e.target.value = ""; // Clear file choice
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-zinc-950/20 backdrop-blur-xs md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex flex-col border-r border-zinc-200/80 bg-zinc-50 dark:border-zinc-800/80 dark:bg-zinc-950 transition-all duration-300 md:static ${
          isOpen
            ? "translate-x-0 w-72 opacity-100 visible"
            : "-translate-x-full md:translate-x-0 w-0 border-none overflow-hidden opacity-0 pointer-events-none"
        }`}
      >
        <div className="w-72 h-full flex flex-col justify-between shrink-0">
        {/* Top Header / Branding on Mobile */}
        <div className="flex h-16 items-center justify-between px-4 md:hidden border-b border-zinc-200/80 dark:border-zinc-800/80">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 text-white shadow-md">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="h-4.5 w-4.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9.813 15.904 9 21l-.813-5.096L3 15l5.096-.813L9 9l.813 5.187L15 15l-5.187.904Z"
                />
              </svg>
            </span>
            <span className="text-base font-bold text-zinc-900 dark:text-zinc-50">
              AuraChat
            </span>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="h-5 w-5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
          </button>
        </div>

        {/* Action Button: Create New Chat */}
        <div id="tour-new-chat" className="p-4">
          <button
            onClick={() => {
              onCreateSession();
              // Close on mobile
              if (window.innerWidth < 768) {
                setIsOpen(false);
              }
            }}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-purple-600 px-4 py-3 text-sm font-semibold text-white shadow-md shadow-purple-500/15 hover:bg-purple-700 active:scale-98 dark:bg-purple-500 dark:hover:bg-purple-600 transition-all duration-200"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="h-4.5 w-4.5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            New Conversation
          </button>
        </div>

        {/* Chat History List */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1 scrollbar-thin">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 px-3 mb-2">
            Recent Conversations
          </div>

          {sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.2}
                stroke="currentColor"
                className="h-8 w-8 text-zinc-300 dark:text-zinc-700 mb-2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a.598.598 0 0 1-.774-.689 6.003 6.003 0 0 0 1.24-2.97C4.067 16.07 3 14.178 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z"
                />
              </svg>
              <p className="text-xs text-zinc-400 dark:text-zinc-500">No chats yet</p>
            </div>
          ) : (
            sessions.map((session) => {
              const isActive = session.id === activeSessionId;
              return (
                <div
                  key={session.id}
                  className={`group relative flex items-center justify-between rounded-xl px-3 py-3 transition-all duration-200 cursor-pointer ${
                    isActive
                      ? "bg-purple-500/10 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300 font-medium"
                      : "text-zinc-600 hover:bg-zinc-200/50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900/60 dark:hover:text-zinc-100"
                  }`}
                  onClick={() => onSelectSession(session.id)}
                >
                  <div className="flex items-center gap-2.5 min-w-0 pr-6">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className={`h-4.5 w-4.5 flex-shrink-0 ${
                        isActive ? "text-purple-600 dark:text-purple-400" : "text-zinc-400"
                      }`}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v5.77Z"
                      />
                    </svg>
                    <span className="truncate text-xs tracking-tight">
                      {session.title || "Untitled Conversation"}
                    </span>
                  </div>

                  {/* Settings badge on hover */}
                  <span className="absolute right-10 top-3 text-[9px] scale-90 px-1 rounded-sm border border-zinc-200 bg-white text-zinc-400 group-hover:hidden dark:border-zinc-800 dark:bg-zinc-900">
                    {session.tone[0]}{session.wordLimit === "unlimited" ? "∞" : session.wordLimit}
                  </span>

                  {/* Delete Button (visible on hover) */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteSession(session.id);
                    }}
                    className="absolute right-2 top-2 rounded-lg p-1.5 opacity-0 hover:bg-zinc-200 hover:text-red-600 group-hover:opacity-100 dark:hover:bg-zinc-800 transition-all duration-200"
                    aria-label="Delete conversation"
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
                        d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                      />
                    </svg>
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Bottom Actions & User Profile */}
        <div className="border-t border-zinc-200/80 p-4 space-y-3 dark:border-zinc-800/80 bg-zinc-100/50 dark:bg-zinc-950">
          {sessions.length > 0 && (
            <button
              onClick={onClearAll}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-zinc-200 py-2 text-xs font-semibold text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 dark:border-zinc-850 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100 transition-all duration-200"
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
                  d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
                />
              </svg>
              Reset Chat History
            </button>
          )}

          {/* Exporter actions */}
          <div id="tour-backup-restore" className="space-y-1.5 pt-1">
            <input
              type="file"
              ref={restoreInputRef}
              onChange={handleRestoreJSON}
              accept=".json"
              className="hidden"
            />
            
            <div className="flex gap-1.5">
              <button
                onClick={handleBackupJSON}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-zinc-200 bg-white dark:bg-zinc-900 px-2 py-1.5 text-[10px] font-semibold text-zinc-600 hover:bg-zinc-100 hover:text-zinc-800 dark:border-zinc-850 dark:text-zinc-400 dark:hover:bg-zinc-800/80 dark:hover:text-zinc-200 transition-all cursor-pointer"
                title="Backup all chats as JSON"
              >
                Backup JSON
              </button>

              <button
                onClick={() => restoreInputRef.current?.click()}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-zinc-200 bg-white dark:bg-zinc-900 px-2 py-1.5 text-[10px] font-semibold text-zinc-600 hover:bg-zinc-100 hover:text-zinc-800 dark:border-zinc-850 dark:text-zinc-400 dark:hover:bg-zinc-800/80 dark:hover:text-zinc-200 transition-all cursor-pointer"
                title="Restore chats from JSON file"
              >
                Restore JSON
              </button>
            </div>

            {activeSessionId && sessions.find(s => s.id === activeSessionId)?.messages.length > 0 && (
              <button
                onClick={handleExportMarkdown}
                className="w-full flex items-center justify-center gap-1.5 rounded-lg border border-zinc-200 bg-white dark:bg-zinc-900 px-3 py-1.5 text-[10px] font-semibold text-zinc-650 hover:bg-zinc-100 hover:text-zinc-800 dark:border-zinc-850 dark:text-zinc-400 dark:hover:bg-zinc-800/80 dark:hover:text-zinc-200 transition-all cursor-pointer"
                title="Export active conversation as Markdown"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="h-3 w-3 text-purple-500">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                Export Active Chat (.md)
              </button>
            )}
          </div>

          {/* User Profile display */}
          <div className="flex items-center gap-3 px-1 py-0.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 text-sm font-semibold text-white uppercase shadow-sm">
              U
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                Anonymous User
              </p>
              <p className="truncate text-[10px] text-zinc-400 dark:text-zinc-500">
                AuraChat Companion
              </p>
            </div>
          </div>
        </div>
        </div>
      </aside>
    </>
  );
}
