"use client";

import React, { useState, useEffect } from "react";
import { Minus, Square, X, Copy } from "lucide-react";

export default function WindowControls() {
  const [isMaximized, setIsMaximized] = useState(false);
  const [hoveredBtn, setHoveredBtn] = useState<string | null>(null);

  useEffect(() => {
    const api = window.electronAPI;
    if (!api) return;

    api.isMaximized().then(setIsMaximized);
    const cleanup = api.onMaximizedChange(setIsMaximized);
    return cleanup;
  }, []);

  const handleMinimize = () => window.electronAPI?.minimize();
  const handleMaximize = () => window.electronAPI?.maximize();
  const handleClose = () => window.electronAPI?.close();

  if (typeof window === "undefined" || !window.electronAPI) {
    return null;
  }

  const btnBase: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 48,
    height: 44,
    border: "none",
    background: "transparent",
    cursor: "pointer",
    transition: "background 0.15s",
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0, marginLeft: 8, WebkitAppRegion: "no-drag" } as React.CSSProperties}>
      <button
        onClick={handleMinimize}
        onMouseEnter={() => setHoveredBtn("min")}
        onMouseLeave={() => setHoveredBtn(null)}
        style={{
          ...btnBase,
          background: hoveredBtn === "min" ? "rgba(255,255,255,0.1)" : "transparent",
        }}
        title="Minimize"
      >
        <Minus size={14} style={{ color: hoveredBtn === "min" ? "var(--text-primary)" : "var(--text-secondary)" }} />
      </button>
      <button
        onClick={handleMaximize}
        onMouseEnter={() => setHoveredBtn("max")}
        onMouseLeave={() => setHoveredBtn(null)}
        style={{
          ...btnBase,
          background: hoveredBtn === "max" ? "rgba(255,255,255,0.1)" : "transparent",
        }}
        title={isMaximized ? "Restore" : "Maximize"}
      >
        {isMaximized ? (
          <Copy size={12} style={{ color: hoveredBtn === "max" ? "var(--text-primary)" : "var(--text-secondary)", transform: "rotate(180deg)" }} />
        ) : (
          <Square size={12} style={{ color: hoveredBtn === "max" ? "var(--text-primary)" : "var(--text-secondary)" }} />
        )}
      </button>
      <button
        onClick={handleClose}
        onMouseEnter={() => setHoveredBtn("close")}
        onMouseLeave={() => setHoveredBtn(null)}
        style={{
          ...btnBase,
          background: hoveredBtn === "close" ? "rgba(239,68,68,0.9)" : "transparent",
        }}
        title="Close"
      >
        <X size={14} style={{ color: hoveredBtn === "close" ? "#ffffff" : "var(--text-secondary)" }} />
      </button>
    </div>
  );
}
