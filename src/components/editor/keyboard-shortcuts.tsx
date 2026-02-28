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
  const [btnHovered, setBtnHovered] = useState(false);
  const [closeBtnHovered, setCloseBtnHovered] = useState(false);

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
        onMouseEnter={() => setBtnHovered(true)}
        onMouseLeave={() => setBtnHovered(false)}
        style={{
          position: "fixed",
          bottom: 40,
          right: 16,
          padding: 8,
          borderRadius: 8,
          border: "none",
          background: btnHovered ? "rgba(255,255,255,0.05)" : "transparent",
          cursor: "pointer",
          zIndex: 50,
          color: "var(--text-muted)",
          transition: "background 0.15s",
        }}
        title="Keyboard shortcuts (?)"
      >
        <Keyboard size={16} />
      </button>
    );
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center" }}>
      {/* Backdrop */}
      <div
        style={{ position: "absolute", inset: 0, background: "rgba(0, 0, 0, 0.6)", backdropFilter: "blur(4px)" }}
        onClick={() => setIsOpen(false)}
      />

      {/* Modal */}
      <div
        style={{
          position: "relative",
          borderRadius: 16,
          padding: 24,
          maxWidth: 512,
          width: "100%",
          margin: "0 16px",
          background: "var(--bg-elevated)",
          border: "1px solid var(--border-default)",
          boxShadow: "0 25px 80px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255,255,255,0.05)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Keyboard size={18} style={{ color: "var(--accent)" }} />
            <h2 style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>
              Keyboard Shortcuts
            </h2>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            onMouseEnter={() => setCloseBtnHovered(true)}
            onMouseLeave={() => setCloseBtnHovered(false)}
            style={{
              padding: 4,
              borderRadius: 6,
              border: "none",
              background: closeBtnHovered ? "rgba(255,255,255,0.05)" : "transparent",
              cursor: "pointer",
              transition: "background 0.15s",
            }}
          >
            <X size={16} style={{ color: "var(--text-muted)" }} />
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {SHORTCUTS.map((section) => (
            <div key={section.category}>
              <h3
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  marginBottom: 8,
                  color: "var(--text-muted)",
                }}
              >
                {section.category}
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {section.items.map((item) => (
                  <div
                    key={item.desc}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "6px 8px",
                      borderRadius: 6,
                      background: "var(--bg-tertiary)",
                    }}
                  >
                    <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                      {item.desc}
                    </span>
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      {item.keys.map((key) => (
                        <kbd
                          key={key}
                          style={{
                            padding: "2px 6px",
                            borderRadius: 4,
                            fontSize: 10,
                            fontFamily: "monospace",
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
          style={{ textAlign: "center", fontSize: 10, marginTop: 16, color: "var(--text-muted)" }}
        >
          Press <kbd style={{ padding: "2px 4px", borderRadius: 4, fontSize: 9, fontFamily: "monospace", background: "var(--bg-surface)", border: "1px solid var(--border-default)" }}>?</kbd> to toggle this dialog
        </p>
      </div>
    </div>
  );
}
