"use client";

import React, { useCallback, useRef, useState, useEffect } from "react";
import { useEditorStore } from "@/stores/editor-store";
import { v4 as uuidv4 } from "uuid";
import {
  Upload,
  Film,
  Music,
  Image,
  Type,
  Sparkles,
  Search,
  FolderOpen,
  Plus,
  FileVideo,
  FileAudio,
  FileImage,
  X,
  Sticker,
} from "lucide-react";
import type { ClipType, MediaFile, PanelTab } from "@/types/editor";
import { formatFileSize, formatDuration } from "@/lib/utils";

const TABS: { id: PanelTab; label: string; icon: React.ReactNode }[] = [
  { id: "assets", label: "Assets", icon: <FolderOpen size={18} /> },
  { id: "text", label: "Text", icon: <Type size={18} /> },
  { id: "audio", label: "Audio", icon: <Music size={18} /> },
  { id: "effects", label: "Effects", icon: <Sparkles size={18} /> },
  { id: "stickers", label: "Stickers", icon: <Sticker size={18} /> },
];

export default function AssetsPanel() {
  const {
    activeTab,
    setActiveTab,
    mediaFiles,
    addMediaFile,
    removeMediaFile,
    tracks,
    addClipToTrack,
    projectFilePath,
  } = useEditorStore();

  const [isDragging, setIsDragging] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getFileType = (file: File): ClipType => {
    if (file.type.startsWith("video/")) return "video";
    if (file.type.startsWith("audio/")) return "audio";
    if (file.type.startsWith("image/")) return "image";
    return "video";
  };

  /** Infer ClipType from file extension */
  const getFileTypeFromName = (name: string): ClipType => {
    const ext = name.split(".").pop()?.toLowerCase() ?? "";
    if (["mp4", "webm", "mov", "avi", "mkv"].includes(ext)) return "video";
    if (["mp3", "wav", "ogg", "aac", "flac"].includes(ext)) return "audio";
    if (["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext)) return "image";
    return "video";
  };

  /**
   * Probe a media URL to extract duration, dimensions, and thumbnail.
   * Mutates `mediaFile` in place, then calls addMediaFile when ready.
   */
  const probeAndAdd = useCallback(
    (mediaFile: MediaFile, url: string) => {
      const type = mediaFile.type;
      if (type === "video" || type === "audio") {
        const el = document.createElement(type === "video" ? "video" : "audio");
        el.src = url;
        el.preload = "metadata";
        el.addEventListener("loadedmetadata", () => {
          mediaFile.duration = el.duration;
          if (type === "video") {
            const video = el as HTMLVideoElement;
            mediaFile.width = video.videoWidth;
            mediaFile.height = video.videoHeight;

            // Generate thumbnail
            video.currentTime = 0.5;
            video.addEventListener(
              "seeked",
              () => {
                const canvas = document.createElement("canvas");
                canvas.width = 160;
                canvas.height = 90;
                canvas.getContext("2d")?.drawImage(video, 0, 0, 160, 90);
                mediaFile.thumbnail = canvas.toDataURL("image/jpeg", 0.7);
                addMediaFile(mediaFile);
              },
              { once: true }
            );
            return;
          }
          addMediaFile(mediaFile);
        });
      } else if (type === "image") {
        const img = new window.Image();
        img.src = url;
        img.onload = () => {
          mediaFile.width = img.naturalWidth;
          mediaFile.height = img.naturalHeight;
          // For images loaded from disk, thumbnail = the src URL itself
          mediaFile.thumbnail = url;
          addMediaFile(mediaFile);
        };
      } else {
        addMediaFile(mediaFile);
      }
    },
    [addMediaFile]
  );

  /**
   * Import a File object (from drag-drop or <input>).
   * In Electron: writes the raw bytes to the project media/ folder,
   * then uses a persistent local-media:// URL.
   * In browser: falls back to transient blob URLs.
   */
  const processFile = useCallback(
    async (file: File) => {
      const type = getFileType(file);
      const api = window.electronAPI;

      let src: string;
      let diskPath: string | undefined;
      let fileSize = file.size;

      if (api?.writeMediaFile) {
        // Electron path: write raw bytes to project media/ folder
        const buf = await file.arrayBuffer();
        const result = await api.writeMediaFile({
          buffer: buf,
          fileName: file.name,
          projectFilePath: projectFilePath,
        });
        if (result.ok && result.destPath) {
          diskPath = result.destPath;
          fileSize = result.fileSize ?? file.size;
          src = await api.pathToMediaUrl(diskPath);
        } else {
          // Fallback to blob URL if write fails
          src = URL.createObjectURL(file);
        }
      } else {
        // Browser-only fallback (dev mode without Electron)
        src = URL.createObjectURL(file);
      }

      const mediaFile: MediaFile = {
        id: uuidv4(),
        name: file.name,
        type,
        src,
        diskPath,
        duration: type === "image" ? 5 : 0,
        fileSize,
      };

      probeAndAdd(mediaFile, src);
    },
    [probeAndAdd, projectFilePath]
  );

  /**
   * Import media by absolute file path (from Electron native file dialog).
   * Copies the file into the project media/ folder for persistence.
   */
  const processFilePath = useCallback(
    async (absolutePath: string) => {
      const api = window.electronAPI;
      if (!api?.importMediaFile) {
        console.warn(
          "[Cuttamaran] electronAPI.importMediaFile is not available. " +
          "Please restart the Electron process so the latest preload script is loaded."
        );
        return;
      }

      const fileName = absolutePath.split(/[\\/]/).pop() ?? "file";
      const type = getFileTypeFromName(fileName);

      const result = await api.importMediaFile({
        sourcePath: absolutePath,
        projectFilePath: projectFilePath,
      });

      if (!result.ok || !result.destPath) return;

      const src = await api.pathToMediaUrl(result.destPath);
      const mediaFile: MediaFile = {
        id: uuidv4(),
        name: result.fileName ?? fileName,
        type,
        src,
        diskPath: result.destPath,
        duration: type === "image" ? 5 : 0,
        fileSize: result.fileSize,
      };

      probeAndAdd(mediaFile, src);
    },
    [probeAndAdd, projectFilePath]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const files = Array.from(e.dataTransfer.files);
      files.forEach(processFile);
    },
    [processFile]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      files.forEach(processFile);
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    [processFile]
  );

  /** Import via Electron's native file dialog (uses file paths, not File objects) */
  const handleNativeImport = useCallback(async () => {
    const api = window.electronAPI;
    if (!api?.openFileDialog) return;
    const result = await api.openFileDialog();
    if (result.canceled || !result.filePaths.length) return;
    for (const filePath of result.filePaths) {
      await processFilePath(filePath);
    }
  }, [processFilePath]);

  const addToTimeline = useCallback(
    (media: MediaFile) => {
      const targetTrack = tracks.find(
        (t) =>
          t.type ===
          (media.type === "audio" ? "audio" : "video")
      );
      if (!targetTrack) return;

      // Find the end of the last clip
      const lastClipEnd = targetTrack.clips.reduce(
        (max, clip) => Math.max(max, clip.startTime + clip.duration),
        0
      );

      addClipToTrack(targetTrack.id, {
        id: uuidv4(),
        mediaId: media.id,
        type: media.type,
        name: media.name,
        trackId: targetTrack.id,
        startTime: lastClipEnd,
        duration: media.duration,
        trimStart: 0,
        trimEnd: 0,
        src: media.src,
        thumbnail: media.thumbnail,
        volume: 1,
        opacity: 1,
      });
    },
    [tracks, addClipToTrack]
  );

  const filteredMedia = mediaFiles.filter((m) =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getTypeIcon = (type: ClipType) => {
    switch (type) {
      case "video":
        return <FileVideo size={14} />;
      case "audio":
        return <FileAudio size={14} />;
      case "image":
        return <FileImage size={14} />;
      default:
        return <Film size={14} />;
    }
  };

  return (
    <div
      style={{ display: "flex", height: "100%", overflow: "hidden" }}
    >
      {/* Tab sidebar */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "8px 0",
          gap: 4,
          width: 56,
          background: "rgba(0,0,0,0.2)",
          borderRight: "1px solid var(--border-subtle)",
        }}
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className=""
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
              padding: 8,
              borderRadius: 8,
              width: 44,
              border: "none",
              cursor: "pointer",
              transition: "all 0.15s",
              color:
                activeTab === tab.id
                  ? "var(--accent)"
                  : "var(--text-muted)",
              background:
                activeTab === tab.id ? "var(--accent-muted)" : "transparent",
            }}
            onMouseEnter={(e) => {
              if (activeTab !== tab.id) {
                e.currentTarget.style.background = "var(--bg-hover)";
                e.currentTarget.style.color = "var(--text-secondary)";
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== tab.id) {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "var(--text-muted)";
              }
            }}
          >
            {tab.icon}
            <span style={{ fontSize: 9, fontWeight: 500 }}>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Panel content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* Search */}
        <div style={{ padding: "12px 12px 8px 12px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 12px",
              borderRadius: 8,
              background: "var(--bg-tertiary)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <Search size={14} style={{ color: "var(--text-muted)" }} />
            <input
              type="text"
              placeholder="Search assets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                flex: 1,
                background: "transparent",
                border: "none",
                outline: "none",
                fontSize: 12,
                color: "var(--text-primary)",
              }}
            />
          </div>
        </div>

        {/* Content area */}
        <div style={{ flex: 1, overflowY: "auto", padding: "0 12px 12px 12px" }}>
          {activeTab === "assets" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {/* Upload area */}
              <div
                style={{
                  position: "relative",
                  borderRadius: 12,
                  padding: 16,
                  textAlign: "center",
                  cursor: "pointer",
                  transition: "all 0.15s",
                  border: isDragging
                    ? "2px dashed var(--accent)"
                    : "2px dashed var(--border-default)",
                  background: isDragging
                    ? "var(--accent-muted)"
                    : "var(--bg-tertiary)",
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => {
                  if (window.electronAPI) {
                    handleNativeImport();
                  } else {
                    fileInputRef.current?.click();
                  }
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="video/*,audio/*,image/*"
                  onChange={handleFileSelect}
                  style={{ display: "none" }}
                />
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 8px auto",
                    background: "var(--accent-muted)",
                    color: "var(--accent)",
                  }}
                >
                  <Upload size={18} />
                </div>
                <p
                  style={{ fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", margin: 0 }}
                >
                  Drop media here
                </p>
                <p
                  style={{ fontSize: 10, marginTop: 2, color: "var(--text-muted)", margin: "2px 0 0 0" }}
                >
                  or click to browse
                </p>
              </div>

              {/* Media list */}
              {filteredMedia.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span
                      style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)" }}
                    >
                      Media ({filteredMedia.length})
                    </span>
                  </div>

                  {filteredMedia.map((media) => (
                    <div
                      key={media.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: 8,
                        borderRadius: 8,
                        cursor: "pointer",
                        background: "var(--bg-tertiary)",
                        transition: "background 0.15s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "var(--bg-hover)";
                        const actions = e.currentTarget.querySelector("[data-actions]") as HTMLElement;
                        if (actions) actions.style.opacity = "1";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "var(--bg-tertiary)";
                        const actions = e.currentTarget.querySelector("[data-actions]") as HTMLElement;
                        if (actions) actions.style.opacity = "0";
                      }}
                      onClick={() => addToTimeline(media)}
                    >
                      {/* Thumbnail */}
                      <div
                        style={{
                          width: 48,
                          height: 32,
                          borderRadius: 6,
                          overflow: "hidden",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          background: "var(--bg-surface)",
                        }}
                      >
                        {media.thumbnail ? (
                          <img
                            src={media.thumbnail}
                            alt=""
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          />
                        ) : (
                          <span style={{ color: "var(--text-muted)" }}>
                            {getTypeIcon(media.type)}
                          </span>
                        )}
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p
                          style={{ fontSize: 12, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "var(--text-primary)", margin: 0 }}
                        >
                          {media.name}
                        </p>
                        <p
                          style={{ fontSize: 10, color: "var(--text-muted)", margin: 0 }}
                        >
                          {formatDuration(media.duration)}
                          {media.fileSize
                            ? ` · ${formatFileSize(media.fileSize)}`
                            : ""}
                        </p>
                      </div>

                      {/* Actions */}
                      <div data-actions="" style={{ display: "flex", alignItems: "center", gap: 4, opacity: 0, transition: "opacity 0.15s" }}>
                        <button
                          style={{ padding: 4, borderRadius: 4, border: "none", background: "transparent", cursor: "pointer" }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                          onClick={(e) => {
                            e.stopPropagation();
                            addToTimeline(media);
                          }}
                          title="Add to timeline"
                        >
                          <Plus
                            size={12}
                            style={{ color: "var(--accent)" }}
                          />
                        </button>
                        <button
                          style={{ padding: 4, borderRadius: 4, border: "none", background: "transparent", cursor: "pointer" }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                          onClick={(e) => {
                            e.stopPropagation();
                            removeMediaFile(media.id);
                          }}
                          title="Remove"
                        >
                          <X
                            size={12}
                            style={{ color: "var(--text-muted)" }}
                          />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {filteredMedia.length === 0 && mediaFiles.length === 0 && (
                <div style={{ textAlign: "center", padding: "24px 0" }}>
                  <Film
                    size={32}
                    style={{ color: "var(--text-muted)", opacity: 0.5, margin: "0 auto 8px auto", display: "block" }}
                  />
                  <p
                    style={{ fontSize: 12, color: "var(--text-muted)", margin: 0 }}
                  >
                    No media files yet
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === "text" && <TextPanel />}
          {activeTab === "audio" && <AudioPanel />}
          {activeTab === "effects" && <EffectsPanel />}
          {activeTab === "stickers" && <StickersPanel />}
        </div>
      </div>
    </div>
  );
}

function TextPanel() {
  const { tracks, addClipToTrack, currentTime } = useEditorStore();

  const textPresets = [
    {
      label: "Title",
      text: "Title Text",
      fontSize: 64,
      fontFamily: "Inter",
      color: "#ffffff",
    },
    {
      label: "Subtitle",
      text: "Subtitle",
      fontSize: 32,
      fontFamily: "Inter",
      color: "#cccccc",
    },
    {
      label: "Caption",
      text: "Caption text here",
      fontSize: 24,
      fontFamily: "Inter",
      color: "#ffffff",
      backgroundColor: "rgba(0,0,0,0.7)",
    },
    {
      label: "Lower Third",
      text: "Name Here",
      fontSize: 28,
      fontFamily: "Inter",
      color: "#ffffff",
      backgroundColor: "rgba(124, 92, 252, 0.8)",
    },
    {
      label: "Quote",
      text: '"Inspirational quote"',
      fontSize: 36,
      fontFamily: "Georgia",
      color: "#e2e2e2",
    },
    {
      label: "Bold Heading",
      text: "BOLD TEXT",
      fontSize: 72,
      fontFamily: "Inter",
      color: "#7c5cfc",
    },
  ];

  const addTextClip = (preset: (typeof textPresets)[0]) => {
    const videoTrack = tracks.find((t) => t.type === "video");
    if (!videoTrack) return;

    addClipToTrack(videoTrack.id, {
      id: uuidv4(),
      mediaId: "",
      type: "text",
      name: preset.label,
      trackId: videoTrack.id,
      startTime: currentTime,
      duration: 5,
      trimStart: 0,
      trimEnd: 0,
      src: "",
      text: preset.text,
      fontSize: preset.fontSize,
      fontFamily: preset.fontFamily,
      color: preset.color,
      backgroundColor: preset.backgroundColor,
      volume: 1,
      opacity: 1,
    });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <p
        style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8, color: "var(--text-muted)" }}
      >
        Text Presets
      </p>
      {textPresets.map((preset) => (
        <button
          key={preset.label}
          onClick={() => addTextClip(preset)}
          style={{
            width: "100%",
            padding: 12,
            borderRadius: 8,
            textAlign: "left",
            background: "var(--bg-tertiary)",
            border: "1px solid var(--border-subtle)",
            cursor: "pointer",
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--bg-hover)";
            e.currentTarget.style.borderColor = "var(--border-default)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "var(--bg-tertiary)";
            e.currentTarget.style.borderColor = "var(--border-subtle)";
          }}
        >
          <span
            style={{
              display: "block",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              fontSize: Math.min(preset.fontSize / 4, 18) + "px",
              fontFamily: preset.fontFamily,
              color: preset.color,
            }}
          >
            {preset.text}
          </span>
          <span
            style={{ fontSize: 10, marginTop: 4, display: "block", color: "var(--text-muted)" }}
          >
            {preset.label} · {preset.fontSize}px
          </span>
        </button>
      ))}
    </div>
  );
}

function AudioPanel() {
  return (
    <div style={{ textAlign: "center", padding: "32px 0" }}>
      <Music
        size={32}
        style={{ color: "var(--text-muted)", opacity: 0.5, margin: "0 auto 8px auto", display: "block" }}
      />
      <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0 }}>
        Import audio files from Assets
      </p>
      <p style={{ fontSize: 10, marginTop: 4, color: "var(--text-muted)" }}>
        Supports MP3, WAV, AAC, OGG
      </p>
    </div>
  );
}

function EffectsPanel() {
  const { selectedClipId, tracks, addEffect } = useEditorStore();

  const selectedClip = selectedClipId
    ? tracks.flatMap((t) => t.clips).find((c) => c.id === selectedClipId)
    : null;
  const trackId = selectedClipId
    ? tracks.find((t) => t.clips.some((c) => c.id === selectedClipId))?.id
    : null;

  const effects = [
    { name: "Fade In", icon: "↗", type: "fade_in" as const, category: "Transition", defaultValue: 1, defaultDuration: 1 },
    { name: "Fade Out", icon: "↘", type: "fade_out" as const, category: "Transition", defaultValue: 1, defaultDuration: 1 },
    { name: "Cross Dissolve", icon: "⇄", type: "cross_dissolve" as const, category: "Transition", defaultValue: 1, defaultDuration: 1 },
    { name: "Blur", icon: "◎", type: "blur" as const, category: "Filter", defaultValue: 0.5 },
    { name: "Brightness", icon: "☀", type: "brightness" as const, category: "Adjustment", defaultValue: 0.5 },
    { name: "Contrast", icon: "◐", type: "contrast" as const, category: "Adjustment", defaultValue: 0.5 },
    { name: "Saturation", icon: "🎨", type: "saturation" as const, category: "Adjustment", defaultValue: 0.5 },
    { name: "Vignette", icon: "⬟", type: "vignette" as const, category: "Filter", defaultValue: 0.5 },
  ];

  const handleApply = (effect: typeof effects[number]) => {
    if (!selectedClip || !trackId) return;
    // Don't add duplicate effect types
    if (selectedClip.effects?.some((e) => e.type === effect.type)) return;
    addEffect(trackId, selectedClip.id, {
      id: crypto.randomUUID(),
      type: effect.type,
      value: effect.defaultValue,
      duration: effect.defaultDuration,
    });
  };

  const hasEffect = (type: string) =>
    selectedClip?.effects?.some((e) => e.type === type) ?? false;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <p
        style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8, color: "var(--text-muted)" }}
      >
        Effects & Transitions
      </p>
      {!selectedClip && (
        <p style={{ fontSize: 11, color: "var(--text-muted)", textAlign: "center", padding: "12px 0" }}>
          Select a clip on the timeline to apply effects
        </p>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
        {effects.map((effect) => {
          const applied = hasEffect(effect.type);
          const disabled = !selectedClip || applied;
          return (
            <button
              key={effect.name}
              onClick={() => handleApply(effect)}
              disabled={disabled}
              style={{
                padding: 12,
                borderRadius: 8,
                textAlign: "center",
                background: applied ? "var(--accent-muted)" : "var(--bg-tertiary)",
                border: applied ? "1px solid var(--accent)" : "1px solid var(--border-subtle)",
                cursor: disabled ? "default" : "pointer",
                opacity: !selectedClip ? 0.4 : 1,
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                if (!disabled) {
                  e.currentTarget.style.background = "var(--bg-hover)";
                  e.currentTarget.style.borderColor = "var(--accent)";
                }
              }}
              onMouseLeave={(e) => {
                if (!disabled) {
                  e.currentTarget.style.background = applied ? "var(--accent-muted)" : "var(--bg-tertiary)";
                  e.currentTarget.style.borderColor = applied ? "var(--accent)" : "var(--border-subtle)";
                }
              }}
            >
              <span style={{ fontSize: 18, display: "block" }}>{effect.icon}</span>
              <span
                style={{ fontSize: 10, display: "block", marginTop: 4, color: applied ? "var(--accent-hover)" : "var(--text-secondary)" }}
              >
                {applied ? `✓ ${effect.name}` : effect.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StickersPanel() {
  return (
    <div style={{ textAlign: "center", padding: "32px 0" }}>
      <Sticker
        size={32}
        style={{ color: "var(--text-muted)", opacity: 0.5, margin: "0 auto 8px auto", display: "block" }}
      />
      <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0 }}>
        Stickers coming soon
      </p>
    </div>
  );
}
