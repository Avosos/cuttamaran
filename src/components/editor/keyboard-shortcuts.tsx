"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Keyboard, X, RotateCcw } from "lucide-react";
import {
  useShortcutStore,
  SHORTCUT_META,
  formatShortcutKeys,
  eventToBinding,
  DEFAULT_SHORTCUTS,
  type ShortcutAction,
  type ShortcutBinding,
} from "@/stores/shortcut-store";

// Group metadata by category (stable order)
const CATEGORIES = ["Playback", "Editing", "File", "Navigation", "View", "General"] as const;

export default function KeyboardShortcuts() {
  const [isOpen, setIsOpen] = useState(false);
  const [btnHovered, setBtnHovered] = useState(false);
  const [closeBtnHovered, setCloseBtnHovered] = useState(false);
  const [resetAllHovered, setResetAllHovered] = useState(false);

  // Which action is currently being recorded
  const [recording, setRecording] = useState<ShortcutAction | null>(null);

  const { shortcuts, setShortcut, resetShortcut, resetAll } = useShortcutStore();

  // Listen for custom event from menu bar / global handler
  useEffect(() => {
    const handler = () => setIsOpen((prev) => !prev);
    window.addEventListener("cuttamaran:toggle-shortcuts", handler);
    return () => window.removeEventListener("cuttamaran:toggle-shortcuts", handler);
  }, []);

  // Close on Escape (only when not recording)
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !recording) {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [recording, isOpen]);

  // ── Recording handler ──────────────────────────────────
  const handleRecord = useCallback(
    (e: KeyboardEvent) => {
      if (!recording) return;
      e.preventDefault();
      e.stopPropagation();

      // Escape cancels recording
      if (e.key === "Escape") {
        setRecording(null);
        return;
      }

      const binding = eventToBinding(e);
      if (!binding) return; // bare modifier — wait for a real key

      setShortcut(recording, binding);
      setRecording(null);
    },
    [recording, setShortcut]
  );

  useEffect(() => {
    if (!recording) return;
    // Use capture phase so we intercept before any other handler
    window.addEventListener("keydown", handleRecord, true);
    return () => window.removeEventListener("keydown", handleRecord, true);
  }, [recording, handleRecord]);

  // ── Detect if a binding differs from defaults ──────────
  const isCustom = (action: ShortcutAction): boolean => {
    const def = DEFAULT_SHORTCUTS[action];
    const cur = shortcuts[action];
    return (
      cur.key !== def.key ||
      !!cur.ctrl !== !!def.ctrl ||
      !!cur.shift !== !!def.shift ||
      !!cur.alt !== !!def.alt
    );
  };

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
        onClick={() => { if (!recording) setIsOpen(false); }}
      />

      {/* Modal */}
      <div
        style={{
          position: "relative",
          borderRadius: 16,
          padding: 24,
          maxWidth: 560,
          width: "100%",
          margin: "0 16px",
          maxHeight: "80vh",
          display: "flex",
          flexDirection: "column",
          background: "var(--bg-elevated)",
          border: "1px solid var(--border-default)",
          boxShadow: "0 25px 80px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255,255,255,0.05)",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Keyboard size={18} style={{ color: "var(--accent)" }} />
            <h2 style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>
              Keyboard Shortcuts
            </h2>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <button
              onClick={() => { resetAll(); setRecording(null); }}
              onMouseEnter={() => setResetAllHovered(true)}
              onMouseLeave={() => setResetAllHovered(false)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                padding: "4px 10px",
                borderRadius: 6,
                border: "none",
                fontSize: 11,
                color: "var(--text-muted)",
                background: resetAllHovered ? "rgba(255,255,255,0.06)" : "transparent",
                cursor: "pointer",
                transition: "background 0.15s",
              }}
              title="Reset all shortcuts to defaults"
            >
              <RotateCcw size={12} />
              Reset All
            </button>
            <button
              onClick={() => { setIsOpen(false); setRecording(null); }}
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
        </div>

        {/* Hint */}
        <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "0 0 12px 0", flexShrink: 0 }}>
          Click a shortcut to reassign it. Press a new key combination, or <kbd style={{ padding: "1px 4px", borderRadius: 3, fontSize: 10, fontFamily: "monospace", background: "var(--bg-surface)", border: "1px solid var(--border-default)" }}>Esc</kbd> to cancel.
        </p>

        {/* Body — scrollable */}
        <div style={{ overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>
          {CATEGORIES.map((category) => {
            const items = SHORTCUT_META.filter((m) => m.category === category);
            if (items.length === 0) return null;

            return (
              <div key={category}>
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
                  {category}
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  {items.map((meta) => {
                    const binding = shortcuts[meta.action];
                    const isRec = recording === meta.action;
                    const custom = isCustom(meta.action);

                    return (
                      <ShortcutRow
                        key={meta.action}
                        label={meta.label}
                        binding={binding}
                        isRecording={isRec}
                        isCustom={custom}
                        onStartRecord={() => setRecording(meta.action)}
                        onReset={() => { resetShortcut(meta.action); if (isRec) setRecording(null); }}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Shortcut Row ────────────────────────────────────────
function ShortcutRow({
  label,
  binding,
  isRecording,
  isCustom,
  onStartRecord,
  onReset,
}: {
  label: string;
  binding: ShortcutBinding;
  isRecording: boolean;
  isCustom: boolean;
  onStartRecord: () => void;
  onReset: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const [resetHovered, setResetHovered] = useState(false);

  const keys = formatShortcutKeys(binding);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "5px 8px",
        borderRadius: 6,
        background: isRecording
          ? "var(--accent-muted)"
          : hovered
          ? "rgba(255,255,255,0.025)"
          : "var(--bg-tertiary)",
        transition: "background 0.1s",
      }}
    >
      <span style={{ fontSize: 12, color: "var(--text-secondary)", flex: 1, minWidth: 0 }}>
        {label}
      </span>

      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {/* Reset button — only visible when customized */}
        {isCustom && (hovered || isRecording) && (
          <button
            onClick={(e) => { e.stopPropagation(); onReset(); }}
            onMouseEnter={() => setResetHovered(true)}
            onMouseLeave={() => setResetHovered(false)}
            style={{
              padding: 2,
              borderRadius: 4,
              border: "none",
              background: resetHovered ? "rgba(255,255,255,0.08)" : "transparent",
              cursor: "pointer",
              color: "var(--text-muted)",
              display: "flex",
              alignItems: "center",
              transition: "background 0.1s",
            }}
            title="Reset to default"
          >
            <RotateCcw size={11} />
          </button>
        )}

        {/* Keybinding button */}
        <button
          onClick={onStartRecord}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 3,
            padding: "2px 4px",
            borderRadius: 4,
            border: isRecording
              ? "1px solid var(--accent)"
              : isCustom
              ? "1px solid rgba(124,92,252,0.3)"
              : "1px solid transparent",
            background: isRecording ? "var(--accent-muted)" : "transparent",
            cursor: "pointer",
            transition: "all 0.15s",
          }}
          title={isRecording ? "Press a key combo…" : "Click to reassign"}
        >
          {isRecording ? (
            <span
              style={{
                fontSize: 10,
                fontFamily: "monospace",
                color: "var(--accent-hover)",
                padding: "1px 4px",
              }}
            >
              Press keys…
            </span>
          ) : (
            keys.map((key, i) => (
              <kbd
                key={`${key}-${i}`}
                style={{
                  padding: "2px 5px",
                  borderRadius: 4,
                  fontSize: 10,
                  fontFamily: "monospace",
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border-default)",
                  color: isCustom ? "var(--accent-hover)" : "var(--text-primary)",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.3)",
                }}
              >
                {key}
              </kbd>
            ))
          )}
        </button>
      </div>
    </div>
  );
}
