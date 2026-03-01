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
  Sparkles,
  Trash2,
  Scissors,
} from "lucide-react";
import { formatDuration } from "@/lib/utils";

export default function PropertiesPanel() {
  const {
    propertiesPanelOpen,
    setPropertiesPanelOpen,
    selectedClipId,
    tracks,
    updateClip,
    removeEffect,
    updateEffect,
    mediaFiles,
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

  // Source media duration (for enforcing trim constraints)
  const sourceMedia = mediaFiles.find((m) => m.id === selectedClip.mediaId);
  const sourceDuration = sourceMedia?.duration ?? selectedClip.duration;
  const hasTrim = selectedClip.type === "video" || selectedClip.type === "audio";

  // Trim-aware update helpers
  const handleTrimStartChange = (newTrimStart: number) => {
    const ts = Math.max(0, Math.min(newTrimStart, sourceDuration - selectedClip.trimEnd - 0.1));
    const maxDur = sourceDuration - ts - selectedClip.trimEnd;
    handleUpdate({
      trimStart: ts,
      duration: Math.min(selectedClip.duration, Math.max(0.1, maxDur)),
    });
  };

  const handleTrimEndChange = (newTrimEnd: number) => {
    const te = Math.max(0, Math.min(newTrimEnd, sourceDuration - selectedClip.trimStart - 0.1));
    const maxDur = sourceDuration - selectedClip.trimStart - te;
    handleUpdate({
      trimEnd: te,
      duration: Math.min(selectedClip.duration, Math.max(0.1, maxDur)),
    });
  };

  const handleDurationChange = (newDuration: number) => {
    const maxDur = hasTrim ? sourceDuration - selectedClip.trimStart - selectedClip.trimEnd : Infinity;
    handleUpdate({
      duration: Math.max(0.1, Math.min(newDuration, maxDur)),
    });
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
          onMouseEnter={(e) => { e.currentTarget.style.background = "var(--hover-overlay)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
        >
          <X size={14} style={{ color: "var(--text-muted)" }} />
        </button>
      </div>

      {/* Properties */}
      <div style={{ flex: 1, overflowY: "auto", padding: 12, display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Clip Color */}
        <PropertySection icon={<Palette size={13} />} title="Clip Color">
          <PropertyRow label="Timeline Color">
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <input
                type="color"
                value={selectedClip.clipColor || "#6366f1"}
                onChange={(e) => handleUpdate({ clipColor: e.target.value })}
                style={{
                  width: 28,
                  height: 22,
                  padding: 0,
                  border: "1px solid var(--border-subtle)",
                  borderRadius: 4,
                  background: "transparent",
                  cursor: "pointer",
                }}
              />
              {selectedClip.clipColor && (
                <button
                  onClick={() => handleUpdate({ clipColor: undefined })}
                  style={{
                    fontSize: 10,
                    padding: "2px 6px",
                    borderRadius: 4,
                    border: "1px solid var(--border-subtle)",
                    background: "var(--bg-tertiary)",
                    color: "var(--text-muted)",
                    cursor: "pointer",
                    transition: "background 0.12s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "var(--hover-overlay)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "var(--bg-tertiary)"; }}
                  title="Reset to default clip color"
                >
                  Reset
                </button>
              )}
            </div>
          </PropertyRow>
        </PropertySection>

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
                handleDurationChange(parseFloat(v) || 0.1)
              }
              suffix="s"
            />
          </PropertyRow>
          {hasTrim && (
            <PropertyRow label="Source">
              <span style={{ fontSize: 10, color: "var(--text-muted)" }}>
                {sourceDuration.toFixed(2)}s
              </span>
            </PropertyRow>
          )}
        </PropertySection>

        {/* Trim (video/audio only) */}
        {hasTrim && (
          <PropertySection icon={<Scissors size={13} />} title="Trim">
            <PropertyRow label="Trim Start">
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <input
                  type="range"
                  min={0}
                  max={Math.max(0, sourceDuration - selectedClip.trimEnd - 0.1)}
                  step={0.01}
                  value={selectedClip.trimStart}
                  onChange={(e) => handleTrimStartChange(parseFloat(e.target.value))}
                  style={{ width: 72, accentColor: "var(--accent)" }}
                />
                <span style={{ fontSize: 10, fontFamily: "monospace", color: "var(--text-secondary)", width: 36, textAlign: "right" }}>
                  {selectedClip.trimStart.toFixed(2)}s
                </span>
              </div>
            </PropertyRow>
            <PropertyRow label="Trim End">
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <input
                  type="range"
                  min={0}
                  max={Math.max(0, sourceDuration - selectedClip.trimStart - 0.1)}
                  step={0.01}
                  value={selectedClip.trimEnd}
                  onChange={(e) => handleTrimEndChange(parseFloat(e.target.value))}
                  style={{ width: 72, accentColor: "var(--accent)" }}
                />
                <span style={{ fontSize: 10, fontFamily: "monospace", color: "var(--text-secondary)", width: 36, textAlign: "right" }}>
                  {selectedClip.trimEnd.toFixed(2)}s
                </span>
              </div>
            </PropertyRow>
            {/* Visual range bar */}
            <div style={{ marginTop: 2 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                <span style={{ fontSize: 9, color: "var(--text-muted)" }}>Source range</span>
                <span style={{ fontSize: 9, color: "var(--text-muted)" }}>
                  {selectedClip.trimStart.toFixed(1)}s – {(sourceDuration - selectedClip.trimEnd).toFixed(1)}s
                </span>
              </div>
              <div style={{
                height: 6,
                borderRadius: 3,
                background: "var(--bg-primary)",
                position: "relative",
                overflow: "hidden",
              }}>
                <div style={{
                  position: "absolute",
                  left: `${(selectedClip.trimStart / sourceDuration) * 100}%`,
                  right: `${(selectedClip.trimEnd / sourceDuration) * 100}%`,
                  top: 0,
                  bottom: 0,
                  borderRadius: 3,
                  background: "var(--accent)",
                  opacity: 0.6,
                }} />
              </div>
            </div>
          </PropertySection>
        )}

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

        {/* Transform (visual clips only) */}
        {(selectedClip.type === "video" || selectedClip.type === "image" || selectedClip.type === "text") && (
          <PropertySection icon={<Move size={13} />} title="Transform">
            <PropertyRow label="Position X">
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <input
                  type="range"
                  min={-1920}
                  max={1920}
                  step={1}
                  value={selectedClip.positionX ?? 0}
                  onChange={(e) => handleUpdate({ positionX: parseFloat(e.target.value) })}
                  style={{ width: 64, accentColor: "var(--accent)" }}
                />
                <PropertyInput
                  type="number"
                  value={String(selectedClip.positionX ?? 0)}
                  onChange={(v) => handleUpdate({ positionX: parseFloat(v) || 0 })}
                  suffix="px"
                />
              </div>
            </PropertyRow>
            <PropertyRow label="Position Y">
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <input
                  type="range"
                  min={-1080}
                  max={1080}
                  step={1}
                  value={selectedClip.positionY ?? 0}
                  onChange={(e) => handleUpdate({ positionY: parseFloat(e.target.value) })}
                  style={{ width: 64, accentColor: "var(--accent)" }}
                />
                <PropertyInput
                  type="number"
                  value={String(selectedClip.positionY ?? 0)}
                  onChange={(v) => handleUpdate({ positionY: parseFloat(v) || 0 })}
                  suffix="px"
                />
              </div>
            </PropertyRow>
            <PropertyRow label="Scale X">
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <input
                  type="range"
                  min={0.1}
                  max={5}
                  step={0.01}
                  value={selectedClip.scaleX ?? 1}
                  onChange={(e) => handleUpdate({ scaleX: parseFloat(e.target.value) })}
                  style={{ width: 64, accentColor: "var(--accent)" }}
                />
                <span style={{ fontSize: 10, fontFamily: "monospace", color: "var(--text-secondary)", width: 32, textAlign: "right" }}>
                  {Math.round((selectedClip.scaleX ?? 1) * 100)}%
                </span>
              </div>
            </PropertyRow>
            <PropertyRow label="Scale Y">
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <input
                  type="range"
                  min={0.1}
                  max={5}
                  step={0.01}
                  value={selectedClip.scaleY ?? 1}
                  onChange={(e) => handleUpdate({ scaleY: parseFloat(e.target.value) })}
                  style={{ width: 64, accentColor: "var(--accent)" }}
                />
                <span style={{ fontSize: 10, fontFamily: "monospace", color: "var(--text-secondary)", width: 32, textAlign: "right" }}>
                  {Math.round((selectedClip.scaleY ?? 1) * 100)}%
                </span>
              </div>
            </PropertyRow>
            <PropertyRow label="Rotation">
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <input
                  type="range"
                  min={-180}
                  max={180}
                  step={1}
                  value={selectedClip.rotation ?? 0}
                  onChange={(e) => handleUpdate({ rotation: parseFloat(e.target.value) })}
                  style={{ width: 64, accentColor: "var(--accent)" }}
                />
                <PropertyInput
                  type="number"
                  value={String(selectedClip.rotation ?? 0)}
                  onChange={(v) => handleUpdate({ rotation: parseFloat(v) || 0 })}
                  suffix="°"
                />
              </div>
            </PropertyRow>
            {/* Reset all transforms */}
            {((selectedClip.positionX ?? 0) !== 0 || (selectedClip.positionY ?? 0) !== 0 ||
              (selectedClip.scaleX ?? 1) !== 1 || (selectedClip.scaleY ?? 1) !== 1 ||
              (selectedClip.rotation ?? 0) !== 0) && (
              <button
                onClick={() => handleUpdate({ positionX: 0, positionY: 0, scaleX: 1, scaleY: 1, rotation: 0 })}
                style={{
                  width: "100%",
                  padding: "4px 8px",
                  borderRadius: 4,
                  border: "1px solid var(--border-subtle)",
                  background: "var(--bg-primary)",
                  color: "var(--text-muted)",
                  fontSize: 10,
                  cursor: "pointer",
                  transition: "background 0.12s",
                  marginTop: 2,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "var(--hover-overlay)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "var(--bg-primary)"; }}
              >
                Reset Transform
              </button>
            )}
          </PropertySection>
        )}

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
                <option value="Impact">Impact</option>
                <option value="Comic Sans MS">Comic Sans MS</option>
                <option value="Trebuchet MS">Trebuchet MS</option>
                <option value="Tahoma">Tahoma</option>
              </select>
            </PropertyRow>

            {/* Style row: Bold / Italic / Underline / Align */}
            <PropertyRow label="Style">
              <div style={{ display: "flex", gap: 2 }}>
                {([
                  { key: "fontWeight", active: (selectedClip.fontWeight || "bold") === "bold", toggle: { fontWeight: (selectedClip.fontWeight || "bold") === "bold" ? "normal" : "bold" }, label: "B", style: { fontWeight: 700 } },
                  { key: "fontStyle", active: selectedClip.fontStyle === "italic", toggle: { fontStyle: selectedClip.fontStyle === "italic" ? "normal" : "italic" }, label: "I", style: { fontStyle: "italic" } },
                  { key: "textDecoration", active: selectedClip.textDecoration === "underline", toggle: { textDecoration: selectedClip.textDecoration === "underline" ? "none" : "underline" }, label: "U", style: { textDecoration: "underline" } },
                ] as const).map((btn) => (
                  <button
                    key={btn.key}
                    onClick={() => handleUpdate(btn.toggle as Record<string, unknown>)}
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 4,
                      border: "1px solid var(--border-default)",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 12,
                      fontFamily: "serif",
                      background: btn.active ? "var(--accent-muted)" : "transparent",
                      color: btn.active ? "var(--accent-hover)" : "var(--text-secondary)",
                      ...btn.style,
                    }}
                  >
                    {btn.label}
                  </button>
                ))}
              </div>
            </PropertyRow>

            {/* Alignment */}
            <PropertyRow label="Align">
              <div style={{ display: "flex", gap: 2 }}>
                {(["left", "center", "right"] as const).map((a) => (
                  <button
                    key={a}
                    onClick={() => handleUpdate({ textAlign: a })}
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 4,
                      border: "1px solid var(--border-default)",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: (selectedClip.textAlign || "center") === a ? "var(--accent-muted)" : "transparent",
                      color: (selectedClip.textAlign || "center") === a ? "var(--accent-hover)" : "var(--text-secondary)",
                    }}
                  >
                    {/* Simple alignment icons using lines */}
                    <svg width="12" height="10" viewBox="0 0 12 10" fill="currentColor">
                      {a === "left" && <><rect x="0" y="0" width="10" height="2" rx="1"/><rect x="0" y="4" width="7" height="2" rx="1"/><rect x="0" y="8" width="10" height="2" rx="1"/></>}
                      {a === "center" && <><rect x="1" y="0" width="10" height="2" rx="1"/><rect x="2.5" y="4" width="7" height="2" rx="1"/><rect x="1" y="8" width="10" height="2" rx="1"/></>}
                      {a === "right" && <><rect x="2" y="0" width="10" height="2" rx="1"/><rect x="5" y="4" width="7" height="2" rx="1"/><rect x="2" y="8" width="10" height="2" rx="1"/></>}
                    </svg>
                  </button>
                ))}
              </div>
            </PropertyRow>

            {/* Letter Spacing */}
            <PropertyRow label="Spacing">
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <input
                  type="range"
                  min={-5}
                  max={20}
                  step={0.5}
                  value={selectedClip.letterSpacing ?? 0}
                  onChange={(e) => handleUpdate({ letterSpacing: parseFloat(e.target.value) })}
                  style={{ width: 64, accentColor: "var(--accent)" }}
                />
                <span style={{ fontSize: 10, fontFamily: "monospace", color: "var(--text-secondary)", width: 28, textAlign: "right" }}>
                  {(selectedClip.letterSpacing ?? 0).toFixed(1)}
                </span>
              </div>
            </PropertyRow>

            {/* Line Height */}
            <PropertyRow label="Line H.">
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <input
                  type="range"
                  min={0.8}
                  max={3}
                  step={0.1}
                  value={selectedClip.lineHeight ?? 1.2}
                  onChange={(e) => handleUpdate({ lineHeight: parseFloat(e.target.value) })}
                  style={{ width: 64, accentColor: "var(--accent)" }}
                />
                <span style={{ fontSize: 10, fontFamily: "monospace", color: "var(--text-secondary)", width: 28, textAlign: "right" }}>
                  {(selectedClip.lineHeight ?? 1.2).toFixed(1)}
                </span>
              </div>
            </PropertyRow>

            {/* Background Color */}
            <PropertyRow label="BG Color">
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <input
                  type="color"
                  value={selectedClip.backgroundColor || "#7c5cfc"}
                  onChange={(e) => handleUpdate({ backgroundColor: e.target.value })}
                  style={{ width: 24, height: 24, borderRadius: 4, cursor: "pointer", border: "none", background: "transparent" }}
                />
                <button
                  onClick={() => handleUpdate({ backgroundColor: selectedClip.backgroundColor ? undefined : "rgba(124, 92, 252, 0.8)" })}
                  style={{
                    fontSize: 10,
                    padding: "2px 6px",
                    borderRadius: 4,
                    cursor: "pointer",
                    border: "1px solid var(--border-default)",
                    background: selectedClip.backgroundColor ? "var(--accent-muted)" : "transparent",
                    color: selectedClip.backgroundColor ? "var(--accent-hover)" : "var(--text-muted)",
                  }}
                >
                  {selectedClip.backgroundColor ? "On" : "Off"}
                </button>
              </div>
            </PropertyRow>

            {/* Stroke */}
            <PropertyRow label="Stroke">
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <input
                  type="color"
                  value={selectedClip.strokeColor || "#000000"}
                  onChange={(e) => handleUpdate({ strokeColor: e.target.value })}
                  style={{ width: 20, height: 20, borderRadius: 4, cursor: "pointer", border: "none", background: "transparent" }}
                />
                <input
                  type="range"
                  min={0}
                  max={20}
                  step={1}
                  value={selectedClip.strokeWidth ?? 0}
                  onChange={(e) => handleUpdate({ strokeWidth: parseFloat(e.target.value) })}
                  style={{ width: 48, accentColor: "var(--accent)" }}
                />
                <span style={{ fontSize: 10, fontFamily: "monospace", color: "var(--text-secondary)", width: 20, textAlign: "right" }}>
                  {selectedClip.strokeWidth ?? 0}
                </span>
              </div>
            </PropertyRow>
          </PropertySection>
        )}

        {/* ─── Effects ─────────────────────────────── */}
        {selectedClip.effects && selectedClip.effects.length > 0 && (
          <PropertySection
            icon={<Sparkles size={12} />}
            title="Effects"
          >
            {selectedClip.effects.map((effect) => {
              const label = effectLabel(effect.type);
              const isTransition = ["fade_in", "fade_out", "cross_dissolve"].includes(effect.type);
              return (
                <div key={effect.id} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 11, color: "var(--text-primary)", fontWeight: 500 }}>{label}</span>
                    <button
                      onClick={() => removeEffect(trackId, selectedClip!.id, effect.id)}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "var(--text-muted)",
                        cursor: "pointer",
                        padding: 2,
                        borderRadius: 4,
                        display: "flex",
                        alignItems: "center",
                      }}
                      title="Remove effect"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                  {/* Value slider */}
                  <PropertyRow label="Intensity">
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.01}
                        value={effect.value}
                        onChange={(e) =>
                          updateEffect(trackId, selectedClip!.id, effect.id, {
                            value: parseFloat(e.target.value),
                          })
                        }
                        style={{ width: 80, accentColor: "var(--accent)" }}
                      />
                      <span style={{ fontSize: 10, color: "var(--text-muted)", width: 28, textAlign: "right" }}>
                        {Math.round(effect.value * 100)}%
                      </span>
                    </div>
                  </PropertyRow>
                  {/* Duration slider for transitions */}
                  {isTransition && (
                    <PropertyRow label="Duration">
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <input
                          type="range"
                          min={0.1}
                          max={5}
                          step={0.1}
                          value={effect.duration ?? 1}
                          onChange={(e) =>
                            updateEffect(trackId, selectedClip!.id, effect.id, {
                              duration: parseFloat(e.target.value),
                            })
                          }
                          style={{ width: 80, accentColor: "var(--accent)" }}
                        />
                        <span style={{ fontSize: 10, color: "var(--text-muted)", width: 28, textAlign: "right" }}>
                          {(effect.duration ?? 1).toFixed(1)}s
                        </span>
                      </div>
                    </PropertyRow>
                  )}
                  {/* Divider between effects */}
                  <div style={{ borderBottom: "1px solid var(--border-subtle)", marginTop: 2 }} />
                </div>
              );
            })}
          </PropertySection>
        )}
      </div>
    </div>
  );
}

// ─── Effect label helper ────────────────────────────────
function effectLabel(type: string): string {
  const labels: Record<string, string> = {
    fade_in: "Fade In",
    fade_out: "Fade Out",
    cross_dissolve: "Cross Dissolve",
    blur: "Blur",
    brightness: "Brightness",
    contrast: "Contrast",
    saturation: "Saturation",
    vignette: "Vignette",
  };
  return labels[type] || type;
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
