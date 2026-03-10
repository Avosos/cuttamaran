"use client";

import React, { useEffect, useRef } from "react";
import { AlertTriangle } from "lucide-react";
import { useSettings } from "@/hooks/use-settings";
import { getTranslations } from "@/lib/i18n";

interface UnsavedDialogProps {
  onSave: () => void;
  onDiscard: () => void;
  onCancel: () => void;
}

export default function UnsavedDialog({ onSave, onDiscard, onCancel }: UnsavedDialogProps) {
  const [settings] = useSettings();
  const t = getTranslations(settings.language);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onCancel]);

  return (
    <div
      ref={overlayRef}
      onClick={(e) => { if (e.target === overlayRef.current) onCancel(); }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.55)",
        backdropFilter: "blur(4px)",
      }}
    >
      <div
        style={{
          width: 380,
          borderRadius: 14,
          background: "var(--bg-secondary)",
          border: "1px solid var(--border-subtle)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
          padding: "24px 24px 20px",
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(234,179,8,0.15)",
              flexShrink: 0,
            }}
          >
            <AlertTriangle size={18} style={{ color: "#eab308" }} />
          </div>
          <div>
            <h2 style={{ fontSize: 15, fontWeight: 600, margin: 0, color: "var(--text-primary)" }}>
              {t.common.unsavedChanges}
            </h2>
            <p style={{ fontSize: 12, margin: 0, marginTop: 2, color: "var(--text-muted)" }}>
              {t.common.unsavedChangesDesc}
            </p>
          </div>
        </div>

        {/* Message */}
        <p style={{ fontSize: 13, margin: 0, color: "var(--text-secondary)", lineHeight: 1.5 }}>
          {t.common.unsavedChangesMessage}
        </p>

        {/* Buttons */}
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 4 }}>
          <button
            onClick={onDiscard}
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 500,
              border: "1px solid var(--border-subtle)",
              background: "transparent",
              color: "var(--error)",
              cursor: "pointer",
            }}
          >
            {t.common.dontSave}
          </button>
          <button
            onClick={onCancel}
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 500,
              border: "1px solid var(--border-subtle)",
              background: "var(--bg-tertiary)",
              color: "var(--text-primary)",
              cursor: "pointer",
            }}
          >
            {t.common.cancel}
          </button>
          <button
            onClick={onSave}
            style={{
              padding: "8px 20px",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 500,
              border: "none",
              background: "var(--accent-gradient)",
              color: "white",
              cursor: "pointer",
              boxShadow: "0 2px 8px var(--accent-glow)",
            }}
          >
            {t.common.save}
          </button>
        </div>
      </div>
    </div>
  );
}
