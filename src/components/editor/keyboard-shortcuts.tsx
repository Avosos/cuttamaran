"use client";

import React, { useState, useEffect } from "react";
import { Keyboard, X } from "lucide-react";

const SHORTCUTS = [
  { category: "Playback", items: [
    { keys: ["Space"], desc: "Play / Pause" },
    { keys: ["←"], desc: "Back 1 second" },
    { keys: ["→"], desc: "Forward 1 second" },
    { keys: ["Shift", "←"], desc: "Back 5 seconds" },
    { keys: ["Shift", "→"], desc: "Forward 5 seconds" },
    { keys: ["Home"], desc: "Go to start" },
    { keys: ["End"], desc: "Go to end" },
  ]},
  { category: "Editing", items: [
    { keys: ["Ctrl", "Z"], desc: "Undo" },
    { keys: ["Ctrl", "Shift", "Z"], desc: "Redo" },
    { keys: ["Delete"], desc: "Delete selected clip" },
    { keys: ["Ctrl", "Scroll"], desc: "Zoom timeline" },
  ]},
  { category: "General", items: [
    { keys: ["?"], desc: "Toggle shortcuts" },
  ]},
];

export default function KeyboardShortcuts() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "?" && !(e.target instanceof HTMLInputElement)) {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-10 right-4 p-2 rounded-lg transition-all hover:bg-white/5 z-50"
        title="Keyboard shortcuts (?)"
        style={{ color: "var(--text-muted)" }}
      >
        <Keyboard size={16} />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{ background: "rgba(0, 0, 0, 0.6)", backdropFilter: "blur(4px)" }}
        onClick={() => setIsOpen(false)}
      />

      {/* Modal */}
      <div
        className="relative rounded-2xl p-6 max-w-lg w-full mx-4 animate-fade-in"
        style={{
          background: "var(--bg-elevated)",
          border: "1px solid var(--border-default)",
          boxShadow: "0 25px 80px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255,255,255,0.05)",
        }}
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Keyboard size={18} style={{ color: "var(--accent)" }} />
            <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              Keyboard Shortcuts
            </h2>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 rounded-md hover:bg-white/5 transition-colors"
          >
            <X size={16} style={{ color: "var(--text-muted)" }} />
          </button>
        </div>

        <div className="space-y-4">
          {SHORTCUTS.map((section) => (
            <div key={section.category}>
              <h3
                className="text-[10px] font-semibold uppercase tracking-wider mb-2"
                style={{ color: "var(--text-muted)" }}
              >
                {section.category}
              </h3>
              <div className="space-y-1">
                {section.items.map((item) => (
                  <div
                    key={item.desc}
                    className="flex items-center justify-between py-1.5 px-2 rounded-md"
                    style={{ background: "var(--bg-tertiary)" }}
                  >
                    <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
                      {item.desc}
                    </span>
                    <div className="flex items-center gap-1">
                      {item.keys.map((key) => (
                        <kbd
                          key={key}
                          className="px-1.5 py-0.5 rounded text-[10px] font-mono"
                          style={{
                            background: "var(--bg-surface)",
                            border: "1px solid var(--border-default)",
                            color: "var(--text-primary)",
                            boxShadow: "0 1px 2px rgba(0,0,0,0.3)",
                          }}
                        >
                          {key}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <p
          className="text-center text-[10px] mt-4"
          style={{ color: "var(--text-muted)" }}
        >
          Press <kbd className="px-1 py-0.5 rounded text-[9px] font-mono" style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)" }}>?</kbd> to toggle this dialog
        </p>
      </div>
    </div>
  );
}
