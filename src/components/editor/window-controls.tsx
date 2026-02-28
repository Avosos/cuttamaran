"use client";

import React, { useState, useEffect } from "react";
import { Minus, Square, X, Copy } from "lucide-react";

export default function WindowControls() {
  const [isMaximized, setIsMaximized] = useState(false);

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

  // If not in Electron, don't render window controls
  if (typeof window === "undefined" || !window.electronAPI) {
    return null;
  }

  return (
    <div className="flex items-center gap-0 ml-2" style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}>
      <button
        onClick={handleMinimize}
        className="group flex items-center justify-center w-11 h-8 transition-colors hover:bg-white/10"
        title="Minimize"
      >
        <Minus size={14} className="text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]" />
      </button>
      <button
        onClick={handleMaximize}
        className="group flex items-center justify-center w-11 h-8 transition-colors hover:bg-white/10"
        title={isMaximized ? "Restore" : "Maximize"}
      >
        {isMaximized ? (
          <Copy size={12} className="text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] rotate-180" />
        ) : (
          <Square size={12} className="text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]" />
        )}
      </button>
      <button
        onClick={handleClose}
        className="group flex items-center justify-center w-11 h-8 transition-colors hover:bg-red-500/90 rounded-tr-2xl"
        title="Close"
      >
        <X size={14} className="text-[var(--text-secondary)] group-hover:text-white" />
      </button>
    </div>
  );
}
