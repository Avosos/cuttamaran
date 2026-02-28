"use client";

import React from "react";
import { useEditorStore } from "@/stores/editor-store";
import {
  X,
  Film,
  Music,
  Image,
  Type,
  Clock,
  Palette,
  Volume2,
  Move,
  Layers,
  Eye,
} from "lucide-react";
import { formatDuration } from "@/lib/utils";

export default function PropertiesPanel() {
  const {
    propertiesPanelOpen,
    setPropertiesPanelOpen,
    selectedClipId,
    tracks,
    updateClip,
  } = useEditorStore();

  if (!propertiesPanelOpen || !selectedClipId) return null;

  // Find the selected clip and its track
  let selectedClip = null;
  let trackId = "";
  for (const track of tracks) {
    const clip = track.clips.find((c) => c.id === selectedClipId);
    if (clip) {
      selectedClip = clip;
      trackId = track.id;
      break;
    }
  }

  if (!selectedClip) return null;

  const handleUpdate = (updates: Record<string, unknown>) => {
    updateClip(trackId, selectedClip!.id, updates);
  };

  const getTypeIcon = () => {
    switch (selectedClip.type) {
      case "video":
        return <Film size={14} />;
      case "audio":
        return <Music size={14} />;
      case "image":
        return <Image size={14} />;
      case "text":
        return <Type size={14} />;
    }
  };

  const getTypeColor = () => {
    switch (selectedClip.type) {
      case "video":
        return "var(--clip-video)";
      case "audio":
        return "var(--clip-audio)";
      case "image":
        return "var(--clip-image)";
      case "text":
        return "var(--clip-text)";
    }
  };

  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        width: 260,
        background: "var(--bg-secondary)",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 12px",
          borderBottom: "1px solid var(--border-subtle)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 24,
              height: 24,
              borderRadius: 6,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: `${getTypeColor()}20`,
              color: getTypeColor(),
            }}
          >
            {getTypeIcon()}
          </div>
          <div>
            <p
              style={{ fontSize: 12, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "var(--text-primary)", maxWidth: 150, margin: 0 }}
            >
              {selectedClip.name}
            </p>
            <p
              style={{ fontSize: 10, textTransform: "capitalize", color: "var(--text-muted)", margin: 0 }}
            >
              {selectedClip.type} clip
            </p>
          </div>
        </div>
        <button
          onClick={() => setPropertiesPanelOpen(false)}
          style={{
            padding: 4,
            borderRadius: 6,
            border: "none",
            background: "transparent",
            cursor: "pointer",
            transition: "background 0.15s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
        >
          <X size={14} style={{ color: "var(--text-muted)" }} />
        </button>
      </div>

      {/* Properties */}
      <div style={{ flex: 1, overflowY: "auto", padding: 12, display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Timing */}
        <PropertySection icon={<Clock size={13} />} title="Timing">
          <PropertyRow label="Start">
            <PropertyInput
              type="number"
              value={selectedClip.startTime.toFixed(2)}
              onChange={(v) =>
                handleUpdate({ startTime: parseFloat(v) || 0 })
              }
              suffix="s"
            />
          </PropertyRow>
          <PropertyRow label="Duration">
            <PropertyInput
              type="number"
              value={selectedClip.duration.toFixed(2)}
              onChange={(v) =>
                handleUpdate({
                  duration: Math.max(0.1, parseFloat(v) || 0.1),
                })
              }
              suffix="s"
            />
          </PropertyRow>
          {selectedClip.trimStart > 0 && (
            <PropertyRow label="Trim Start">
              <span
                style={{ fontSize: 11, color: "var(--text-secondary)" }}
              >
                {formatDuration(selectedClip.trimStart)}
              </span>
            </PropertyRow>
          )}
        </PropertySection>

        {/* Appearance */}
        <PropertySection icon={<Eye size={13} />} title="Appearance">
          <PropertyRow label="Opacity">
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={selectedClip.opacity ?? 1}
                onChange={(e) =>
                  handleUpdate({ opacity: parseFloat(e.target.value) })
                }
                style={{ width: 64 }}
              />
              <span
                style={{ fontSize: 10, fontFamily: "monospace", width: 32, textAlign: "right", color: "var(--text-secondary)" }}
              >
                {Math.round((selectedClip.opacity ?? 1) * 100)}%
              </span>
            </div>
          </PropertyRow>
        </PropertySection>

        {/* Audio */}
        {(selectedClip.type === "video" ||
          selectedClip.type === "audio") && (
          <PropertySection icon={<Volume2 size={13} />} title="Audio">
            <PropertyRow label="Volume">
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.01"
                  value={selectedClip.volume ?? 1}
                  onChange={(e) =>
                    handleUpdate({
                      volume: parseFloat(e.target.value),
                    })
                  }
                  style={{ width: 64 }}
                />
                <span
                  style={{ fontSize: 10, fontFamily: "monospace", width: 32, textAlign: "right", color: "var(--text-secondary)" }}
                >
                  {Math.round((selectedClip.volume ?? 1) * 100)}%
                </span>
              </div>
            </PropertyRow>
          </PropertySection>
        )}

        {/* Text properties */}
        {selectedClip.type === "text" && (
          <PropertySection icon={<Type size={13} />} title="Text">
            <PropertyRow label="Content">
              <input
                type="text"
                value={selectedClip.text || ""}
                onChange={(e) =>
                  handleUpdate({ text: e.target.value })
                }
                style={{
                  width: "100%",
                  padding: "4px 8px",
                  borderRadius: 4,
                  fontSize: 12,
                  background: "transparent",
                  outline: "none",
                  border: "1px solid var(--border-default)",
                  color: "var(--text-primary)",
                }}
              />
            </PropertyRow>
            <PropertyRow label="Font Size">
              <PropertyInput
                type="number"
                value={String(selectedClip.fontSize || 48)}
                onChange={(v) =>
                  handleUpdate({
                    fontSize: Math.max(8, parseInt(v) || 48),
                  })
                }
                suffix="px"
              />
            </PropertyRow>
            <PropertyRow label="Color">
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input
                  type="color"
                  value={selectedClip.color || "#ffffff"}
                  onChange={(e) =>
                    handleUpdate({ color: e.target.value })
                  }
                  style={{ width: 24, height: 24, borderRadius: 4, cursor: "pointer", border: "none", background: "transparent" }}
                />
                <span
                  style={{ fontSize: 10, fontFamily: "monospace", color: "var(--text-secondary)" }}
                >
                  {selectedClip.color || "#ffffff"}
                </span>
              </div>
            </PropertyRow>
            <PropertyRow label="Font">
              <select
                value={selectedClip.fontFamily || "Inter"}
                onChange={(e) =>
                  handleUpdate({ fontFamily: e.target.value })
                }
                style={{
                  width: "100%",
                  padding: "4px 8px",
                  borderRadius: 4,
                  fontSize: 12,
                  outline: "none",
                  cursor: "pointer",
                  background: "var(--bg-tertiary)",
                  border: "1px solid var(--border-default)",
                  color: "var(--text-primary)",
                }}
              >
                <option value="Inter">Inter</option>
                <option value="Arial">Arial</option>
                <option value="Georgia">Georgia</option>
                <option value="Courier New">Courier New</option>
                <option value="Times New Roman">Times New Roman</option>
                <option value="Verdana">Verdana</option>
              </select>
            </PropertyRow>
          </PropertySection>
        )}
      </div>
    </div>
  );
}

// ─── Property Section ───────────────────────────────────
function PropertySection({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div
        style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8, color: "var(--text-muted)" }}
      >
        {icon}
        <span style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
          {title}
        </span>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 8,
          borderRadius: 8,
          padding: 10,
          background: "var(--bg-tertiary)",
          border: "1px solid var(--border-subtle)",
        }}
      >
        {children}
      </div>
    </div>
  );
}

// ─── Property Row ───────────────────────────────────────
function PropertyRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <span
        style={{ fontSize: 11, color: "var(--text-muted)" }}
      >
        {label}
      </span>
      {children}
    </div>
  );
}

// ─── Property Input ─────────────────────────────────────
function PropertyInput({
  type,
  value,
  onChange,
  suffix,
}: {
  type: string;
  value: string;
  onChange: (value: string) => void;
  suffix?: string;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: 64,
          padding: "2px 6px",
          borderRadius: 4,
          fontSize: 11,
          textAlign: "right",
          background: "transparent",
          outline: "none",
          border: "1px solid var(--border-default)",
          color: "var(--text-primary)",
        }}
      />
      {suffix && (
        <span
          style={{ fontSize: 10, color: "var(--text-muted)" }}
        >
          {suffix}
        </span>
      )}
    </div>
  );
}
