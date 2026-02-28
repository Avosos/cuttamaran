"use client";

import React, { useCallback, useEffect, useRef } from "react";
import { useEditorStore } from "@/stores/editor-store";
import {
  Undo2,
  Redo2,
  Download,
  Settings,
  Scissors,
  Save,
  ChevronDown,
} from "lucide-react";

export default function EditorHeader() {
  const {
    projectName,
    setProjectName,
    undo,
    redo,
    historyIndex,
    history,
    canvasSize,
  } = useEditorStore();

  const inputRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      }
    },
    [undo, redo]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <header
      className="flex flex-shrink-0 items-center justify-between h-14 px-6 rounded-2xl"
      style={{
        background: "var(--bg-secondary)",
        border: "1px solid var(--border-subtle)",
      }}
    >
      {/* Left section - Logo & Project name */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, #7c5cfc, #e879f9)",
            }}
          >
            <Scissors size={14} className="text-white" />
          </div>
          <span
            className="text-sm font-semibold tracking-tight gradient-text"
          >
            Cuttamaran
          </span>
        </div>

        <div
          className="w-px h-5"
          style={{ background: "var(--border-default)" }}
        />

        <input
          ref={inputRef}
          type="text"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          className="text-sm bg-transparent border-none outline-none px-2 py-1 rounded-md hover:bg-white/5 focus:bg-white/5 transition-colors"
          style={{ color: "var(--text-secondary)", width: "180px" }}
        />

        <button
          className="flex items-center gap-1 text-xs px-2 py-1 rounded-md transition-colors"
          style={{
            color: "var(--text-muted)",
            background: "var(--bg-tertiary)",
          }}
        >
          {canvasSize.width}×{canvasSize.height}
          <ChevronDown size={12} />
        </button>
      </div>

      {/* Center section - Undo/Redo & Tools */}
      <div className="flex items-center gap-1">
        <button
          onClick={undo}
          disabled={historyIndex < 0}
          className="p-2 rounded-lg transition-all hover:bg-white/5 disabled:opacity-30"
          title="Undo (Ctrl+Z)"
        >
          <Undo2 size={16} style={{ color: "var(--text-secondary)" }} />
        </button>
        <button
          onClick={redo}
          disabled={historyIndex >= history.length - 1}
          className="p-2 rounded-lg transition-all hover:bg-white/5 disabled:opacity-30"
          title="Redo (Ctrl+Shift+Z)"
        >
          <Redo2 size={16} style={{ color: "var(--text-secondary)" }} />
        </button>

        <div
          className="w-px h-5 mx-2"
          style={{ background: "var(--border-default)" }}
        />

        <button
          className="p-2 rounded-lg transition-all hover:bg-white/5"
          title="Auto Save: On"
        >
          <Save size={16} style={{ color: "var(--success)" }} />
        </button>
      </div>

      {/* Right section - Export & Settings */}
      <div className="flex items-center gap-2">
        <button
          className="p-2 rounded-lg transition-all hover:bg-white/5"
          title="Settings"
        >
          <Settings size={16} style={{ color: "var(--text-secondary)" }} />
        </button>

        <button
          className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all"
          style={{
            background: "linear-gradient(135deg, #7c5cfc, #6344e0)",
            color: "white",
            boxShadow: "0 2px 12px rgba(124, 92, 252, 0.3)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow =
              "0 4px 20px rgba(124, 92, 252, 0.5)";
            e.currentTarget.style.transform = "translateY(-1px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow =
              "0 2px 12px rgba(124, 92, 252, 0.3)";
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          <Download size={14} />
          Export
        </button>
      </div>
    </header>
  );
}
