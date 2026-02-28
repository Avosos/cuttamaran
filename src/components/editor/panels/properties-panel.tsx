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
      className="h-full flex flex-col animate-slide-in"
      style={{
        width: "260px",
        background: "var(--bg-secondary)",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 py-2.5"
        style={{
          borderBottom: "1px solid var(--border-subtle)",
        }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded-md flex items-center justify-center"
            style={{
              background: `${getTypeColor()}20`,
              color: getTypeColor(),
            }}
          >
            {getTypeIcon()}
          </div>
          <div>
            <p
              className="text-xs font-medium truncate"
              style={{ color: "var(--text-primary)", maxWidth: "150px" }}
            >
              {selectedClip.name}
            </p>
            <p
              className="text-[10px] capitalize"
              style={{ color: "var(--text-muted)" }}
            >
              {selectedClip.type} clip
            </p>
          </div>
        </div>
        <button
          onClick={() => setPropertiesPanelOpen(false)}
          className="p-1 rounded-md transition-all hover:bg-white/5"
        >
          <X size={14} style={{ color: "var(--text-muted)" }} />
        </button>
      </div>

      {/* Properties */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
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
                className="text-[11px]"
                style={{ color: "var(--text-secondary)" }}
              >
                {formatDuration(selectedClip.trimStart)}
              </span>
            </PropertyRow>
          )}
        </PropertySection>

        {/* Appearance */}
        <PropertySection icon={<Eye size={13} />} title="Appearance">
          <PropertyRow label="Opacity">
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={selectedClip.opacity ?? 1}
                onChange={(e) =>
                  handleUpdate({ opacity: parseFloat(e.target.value) })
                }
                className="w-16"
              />
              <span
                className="text-[10px] font-mono w-8 text-right"
                style={{ color: "var(--text-secondary)" }}
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
              <div className="flex items-center gap-2">
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
                  className="w-16"
                />
                <span
                  className="text-[10px] font-mono w-8 text-right"
                  style={{ color: "var(--text-secondary)" }}
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
                className="w-full px-2 py-1 rounded text-xs bg-transparent outline-none"
                style={{
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
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={selectedClip.color || "#ffffff"}
                  onChange={(e) =>
                    handleUpdate({ color: e.target.value })
                  }
                  className="w-6 h-6 rounded cursor-pointer border-0"
                  style={{ background: "transparent" }}
                />
                <span
                  className="text-[10px] font-mono"
                  style={{ color: "var(--text-secondary)" }}
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
                className="w-full px-2 py-1 rounded text-xs outline-none cursor-pointer"
                style={{
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
        className="flex items-center gap-1.5 mb-2"
        style={{ color: "var(--text-muted)" }}
      >
        {icon}
        <span className="text-[10px] font-semibold uppercase tracking-wider">
          {title}
        </span>
      </div>
      <div
        className="space-y-2 rounded-lg p-2.5"
        style={{
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
    <div className="flex items-center justify-between">
      <span
        className="text-[11px]"
        style={{ color: "var(--text-muted)" }}
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
    <div className="flex items-center gap-1">
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-16 px-1.5 py-0.5 rounded text-[11px] text-right bg-transparent outline-none"
        style={{
          border: "1px solid var(--border-default)",
          color: "var(--text-primary)",
        }}
      />
      {suffix && (
        <span
          className="text-[10px]"
          style={{ color: "var(--text-muted)" }}
        >
          {suffix}
        </span>
      )}
    </div>
  );
}
