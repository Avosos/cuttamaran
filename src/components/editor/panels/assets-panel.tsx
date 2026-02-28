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

  const processFile = useCallback(
    (file: File) => {
      const type = getFileType(file);
      const url = URL.createObjectURL(file);

      const mediaFile: MediaFile = {
        id: uuidv4(),
        name: file.name,
        type,
        src: url,
        duration: type === "image" ? 5 : 0, // Default 5s for images
        fileSize: file.size,
      };

      // Get duration for video/audio
      if (type === "video" || type === "audio") {
        const el = document.createElement(type === "video" ? "video" : "audio");
        el.src = url;
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
                // Force re-render by updating the media file
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
          mediaFile.thumbnail = url;
          addMediaFile(mediaFile);
        };
      } else {
        addMediaFile(mediaFile);
      }
    },
    [addMediaFile]
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
      className="flex h-full overflow-hidden"
    >
      {/* Tab sidebar */}
      <div
        className="flex flex-col items-center py-2 gap-1 w-14"
        style={{
          background: "rgba(0,0,0,0.2)",
          borderRight: "1px solid var(--border-subtle)",
        }}
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="flex flex-col items-center gap-0.5 p-2 rounded-lg transition-all w-11"
            style={{
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
            <span className="text-[9px] font-medium">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Panel content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Search */}
        <div className="p-3 pb-2">
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
            style={{
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
              className="flex-1 bg-transparent border-none outline-none text-xs"
              style={{ color: "var(--text-primary)" }}
            />
          </div>
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto px-3 pb-3">
          {activeTab === "assets" && (
            <div className="space-y-3 animate-fade-in">
              {/* Upload area */}
              <div
                className="relative rounded-xl p-4 text-center transition-all cursor-pointer"
                style={{
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
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="video/*,audio/*,image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2"
                  style={{
                    background: "var(--accent-muted)",
                    color: "var(--accent)",
                  }}
                >
                  <Upload size={18} />
                </div>
                <p
                  className="text-xs font-medium"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Drop media here
                </p>
                <p
                  className="text-[10px] mt-0.5"
                  style={{ color: "var(--text-muted)" }}
                >
                  or click to browse
                </p>
              </div>

              {/* Media list */}
              {filteredMedia.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span
                      className="text-[10px] font-semibold uppercase tracking-wider"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Media ({filteredMedia.length})
                    </span>
                  </div>

                  {filteredMedia.map((media) => (
                    <div
                      key={media.id}
                      className="flex items-center gap-2.5 p-2 rounded-lg transition-all cursor-pointer group"
                      style={{ background: "var(--bg-tertiary)" }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "var(--bg-hover)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "var(--bg-tertiary)";
                      }}
                      onClick={() => addToTimeline(media)}
                    >
                      {/* Thumbnail */}
                      <div
                        className="w-12 h-8 rounded-md overflow-hidden flex items-center justify-center flex-shrink-0"
                        style={{ background: "var(--bg-surface)" }}
                      >
                        {media.thumbnail ? (
                          <img
                            src={media.thumbnail}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span style={{ color: "var(--text-muted)" }}>
                            {getTypeIcon(media.type)}
                          </span>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-xs font-medium truncate"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {media.name}
                        </p>
                        <p
                          className="text-[10px]"
                          style={{ color: "var(--text-muted)" }}
                        >
                          {formatDuration(media.duration)}
                          {media.fileSize
                            ? ` · ${formatFileSize(media.fileSize)}`
                            : ""}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          className="p-1 rounded hover:bg-white/10 transition-colors"
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
                          className="p-1 rounded hover:bg-white/10 transition-colors"
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
                <div className="text-center py-6">
                  <Film
                    size={32}
                    className="mx-auto mb-2"
                    style={{ color: "var(--text-muted)", opacity: 0.5 }}
                  />
                  <p
                    className="text-xs"
                    style={{ color: "var(--text-muted)" }}
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
    <div className="space-y-2 animate-fade-in">
      <p
        className="text-[10px] font-semibold uppercase tracking-wider mb-2"
        style={{ color: "var(--text-muted)" }}
      >
        Text Presets
      </p>
      {textPresets.map((preset) => (
        <button
          key={preset.label}
          onClick={() => addTextClip(preset)}
          className="w-full p-3 rounded-lg text-left transition-all"
          style={{
            background: "var(--bg-tertiary)",
            border: "1px solid var(--border-subtle)",
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
            className="block truncate"
            style={{
              fontSize: Math.min(preset.fontSize / 4, 18) + "px",
              fontFamily: preset.fontFamily,
              color: preset.color,
            }}
          >
            {preset.text}
          </span>
          <span
            className="text-[10px] mt-1 block"
            style={{ color: "var(--text-muted)" }}
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
    <div className="text-center py-8 animate-fade-in">
      <Music
        size={32}
        className="mx-auto mb-2"
        style={{ color: "var(--text-muted)", opacity: 0.5 }}
      />
      <p className="text-xs" style={{ color: "var(--text-muted)" }}>
        Import audio files from Assets
      </p>
      <p className="text-[10px] mt-1" style={{ color: "var(--text-muted)" }}>
        Supports MP3, WAV, AAC, OGG
      </p>
    </div>
  );
}

function EffectsPanel() {
  const effects = [
    { name: "Fade In", icon: "↗", category: "Transition" },
    { name: "Fade Out", icon: "↘", category: "Transition" },
    { name: "Cross Dissolve", icon: "⇄", category: "Transition" },
    { name: "Blur", icon: "◎", category: "Filter" },
    { name: "Brightness", icon: "☀", category: "Adjustment" },
    { name: "Contrast", icon: "◐", category: "Adjustment" },
    { name: "Saturation", icon: "🎨", category: "Adjustment" },
    { name: "Vignette", icon: "⬟", category: "Filter" },
  ];

  return (
    <div className="space-y-2 animate-fade-in">
      <p
        className="text-[10px] font-semibold uppercase tracking-wider mb-2"
        style={{ color: "var(--text-muted)" }}
      >
        Effects & Transitions
      </p>
      <div className="grid grid-cols-2 gap-1.5">
        {effects.map((effect) => (
          <button
            key={effect.name}
            className="p-3 rounded-lg text-center transition-all"
            style={{
              background: "var(--bg-tertiary)",
              border: "1px solid var(--border-subtle)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--bg-hover)";
              e.currentTarget.style.borderColor = "var(--accent)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "var(--bg-tertiary)";
              e.currentTarget.style.borderColor = "var(--border-subtle)";
            }}
          >
            <span className="text-lg block">{effect.icon}</span>
            <span
              className="text-[10px] block mt-1"
              style={{ color: "var(--text-secondary)" }}
            >
              {effect.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function StickersPanel() {
  return (
    <div className="text-center py-8 animate-fade-in">
      <Sticker
        size={32}
        className="mx-auto mb-2"
        style={{ color: "var(--text-muted)", opacity: 0.5 }}
      />
      <p className="text-xs" style={{ color: "var(--text-muted)" }}>
        Stickers coming soon
      </p>
    </div>
  );
}
