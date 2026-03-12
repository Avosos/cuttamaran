"use client";

import React, { useRef, useCallback, useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { useEditorStore } from "@/stores/editor-store";
import {
  Plus,
  Minus,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Volume2,
  VolumeX,
  Magnet,
  Trash2,
  Film,
  Music,
  Type,
  Image,
  Scissors,
  ZoomIn,
  ZoomOut,
  ChevronsLeftRight,
  Copy,
  ClipboardPaste,
  SplitSquareHorizontal,
  VolumeOff,
  Gauge,
  PanelRightOpen,
  GripVertical,
  Palette,
  Headphones,
} from "lucide-react";
import { formatTime, getClipGradient, getClipPrimaryColor } from "@/lib/utils";
import type { TimelineClip, Track } from "@/types/editor";
import { useWaveform } from "@/hooks/use-waveform";
import { useSettings } from "@/hooks/use-settings";
import { getTranslations } from "@/lib/i18n";

const PIXELS_PER_SECOND_BASE = 80;
const RULER_HEIGHT = 28;
const TRACK_HEADER_WIDTH = 180;

export default function TimelinePanel() {
  const [settings] = useSettings();
  const t = getTranslations(settings.language);
  const {
    tracks,
    currentTime,
    duration,
    setCurrentTime,
    zoom,
    setZoom,
    snapping,
    toggleSnapping,
    selectedClipId,
    setSelectedClipId,
    removeClip,
    updateClip,
    moveClip,
    addTrack,
    addClipToTrack,
    isPlaying,
    splitClip,
    duplicateClip,
    setPropertiesPanelOpen,
    pushHistory,
  } = useEditorStore();

  const timelineRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const trackLanesRef = useRef<HTMLDivElement>(null);
  const [isDraggingClip, setIsDraggingClip] = useState(false);
  const [isDraggingPlayhead, setIsDraggingPlayhead] = useState(false);
  const [isResizing, setIsResizing] = useState<{
    clipId: string;
    trackId: string;
    edge: "left" | "right";
  } | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    clipId: string;
    trackId: string;
  } | null>(null);

  const pxPerSecond = PIXELS_PER_SECOND_BASE * zoom;
  const timelineWidth = duration * pxPerSecond;

  // ─── Ruler ────────────────────────────────────────────
  const renderRuler = () => {
    const marks: React.ReactNode[] = [];
    const majorInterval = zoom >= 2 ? 1 : zoom >= 0.5 ? 5 : 10;
    const minorInterval = majorInterval / 5;

    for (let t = 0; t <= duration; t += minorInterval) {
      const x = t * pxPerSecond;
      const isMajor = t % majorInterval < 0.01;

      marks.push(
        <div
          key={`mark-${t}`}
          style={{
            position: "absolute",
            left: x,
            height: isMajor ? 14 : 6,
            width: 1,
            background: isMajor
              ? "rgba(255,255,255,0.25)"
              : "var(--hover-strong)",
            bottom: 0,
            top: "auto",
          }}
        >
          {isMajor && (
            <span
              style={{
                position: "absolute",
                fontSize: 9,
                userSelect: "none",
                bottom: 16,
                left: 3,
                color: "var(--text-muted)",
                whiteSpace: "nowrap",
              }}
            >
              {formatTime(t)}
            </span>
          )}
        </div>
      );
    }

    return marks;
  };

  // ─── Playhead Click ───────────────────────────────────
  const handleRulerClick = useCallback(
    (e: React.MouseEvent) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const time = Math.max(0, x / pxPerSecond);
      setCurrentTime(Math.min(time, duration));
    },
    [pxPerSecond, setCurrentTime, duration]
  );

  // ─── Playhead Drag ────────────────────────────────────
  const handlePlayheadDrag = useCallback(
    (e: MouseEvent) => {
      if (!scrollRef.current) return;
      const scrollRect = scrollRef.current.getBoundingClientRect();
      const x = e.clientX - scrollRect.left + scrollRef.current.scrollLeft;
      const time = Math.max(0, Math.min(x / pxPerSecond, duration));
      setCurrentTime(time);
    },
    [pxPerSecond, setCurrentTime, duration]
  );

  useEffect(() => {
    if (isDraggingPlayhead) {
      const handleMove = (e: MouseEvent) => handlePlayheadDrag(e);
      const handleUp = () => setIsDraggingPlayhead(false);
      window.addEventListener("mousemove", handleMove);
      window.addEventListener("mouseup", handleUp);
      return () => {
        window.removeEventListener("mousemove", handleMove);
        window.removeEventListener("mouseup", handleUp);
      };
    }
  }, [isDraggingPlayhead, handlePlayheadDrag]);

  // ─── Clip Drag (horizontal + cross-track) ─────────────
  const handleClipDrag = useCallback(
    (
      e: React.MouseEvent,
      clip: TimelineClip,
      trackId: string
    ) => {
      e.stopPropagation();
      setSelectedClipId(clip.id);
      setIsDraggingClip(true);
      pushHistory(); // snapshot once before any mutations

      const startX = e.clientX;
      const startY = e.clientY;
      const startTime = clip.startTime;
      let currentTrackId = trackId;

      // Build a map of track Y-ranges from the DOM
      const getTrackAtY = (clientY: number): string | null => {
        const lanesEl = trackLanesRef.current;
        if (!lanesEl) return null;
        const children = lanesEl.children;
        for (let i = 0; i < children.length; i++) {
          const child = children[i] as HTMLElement;
          const tid = child.getAttribute("data-track-id");
          if (!tid) continue;
          const rect = child.getBoundingClientRect();
          if (clientY >= rect.top && clientY < rect.bottom) {
            return tid;
          }
        }
        return null;
      };

      const handleMove = (ev: MouseEvent) => {
        const dx = ev.clientX - startX;
        const dt = dx / pxPerSecond;
        let newTime = Math.max(0, startTime + dt);

        // Snapping
        if (snapping) {
          const snapDistance = 5 / pxPerSecond;
          const snapPoints = [0, currentTime];
          tracks.forEach((track) => {
            track.clips.forEach((c) => {
              if (c.id !== clip.id) {
                snapPoints.push(c.startTime);
                snapPoints.push(c.startTime + c.duration);
              }
            });
          });
          for (const point of snapPoints) {
            if (Math.abs(newTime - point) < snapDistance) {
              newTime = point;
              break;
            }
            if (
              Math.abs(newTime + clip.duration - point) < snapDistance
            ) {
              newTime = point - clip.duration;
              break;
            }
          }
        }

        // Detect target track from vertical position
        const targetTrackId = getTrackAtY(ev.clientY);

        if (targetTrackId && targetTrackId !== currentTrackId) {
          // Cross-track move
          moveClip(currentTrackId, targetTrackId, clip.id, newTime);
          currentTrackId = targetTrackId;
        } else {
          // Same-track horizontal move
          updateClip(currentTrackId, clip.id, { startTime: newTime });
        }
      };

      const handleUp = () => {
        setIsDraggingClip(false);
        window.removeEventListener("mousemove", handleMove);
        window.removeEventListener("mouseup", handleUp);
      };

      window.addEventListener("mousemove", handleMove);
      window.addEventListener("mouseup", handleUp);
    },
    [
      pxPerSecond,
      snapping,
      currentTime,
      tracks,
      setSelectedClipId,
      updateClip,
      moveClip,
      pushHistory,
    ]
  );

  // ─── Clip Resize ──────────────────────────────────────
  const handleClipResize = useCallback(
    (
      e: React.MouseEvent,
      clip: TimelineClip,
      trackId: string,
      edge: "left" | "right"
    ) => {
      e.stopPropagation();
      e.preventDefault();
      setIsResizing({ clipId: clip.id, trackId, edge });

      const startX = e.clientX;
      const startTime = clip.startTime;
      const startDuration = clip.duration;
      const startTrimStart = clip.trimStart;

      const handleMove = (ev: MouseEvent) => {
        const dx = ev.clientX - startX;
        const dt = dx / pxPerSecond;

        if (edge === "left") {
          const newTrimStart = Math.max(0, startTrimStart + dt);
          const adjustment = newTrimStart - startTrimStart;
          const newStartTime = startTime + adjustment;
          const newDuration = startDuration - adjustment;
          if (newDuration > 0.1) {
            updateClip(trackId, clip.id, {
              startTime: newStartTime,
              duration: newDuration,
              trimStart: newTrimStart,
            });
          }
        } else {
          const newDuration = Math.max(0.1, startDuration + dt);
          updateClip(trackId, clip.id, { duration: newDuration });
        }
      };

      const handleUp = () => {
        setIsResizing(null);
        window.removeEventListener("mousemove", handleMove);
        window.removeEventListener("mouseup", handleUp);
      };

      window.addEventListener("mousemove", handleMove);
      window.addEventListener("mouseup", handleUp);
    },
    [pxPerSecond, updateClip]
  );

  // ─── Zoom with scroll wheel ───────────────────────────
  useEffect(() => {
    const el = timelineRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        setZoom(zoom + delta);
      }
    };

    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, [zoom, setZoom]);

  // ─── Close context menu on outside click / scroll ─────
  useEffect(() => {
    if (!contextMenu) return;
    const close = () => setContextMenu(null);
    window.addEventListener("click", close);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("click", close);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [contextMenu]);

  // ─── Context menu handler ─────────────────────────────
  const handleClipContextMenu = useCallback(
    (e: React.MouseEvent, clip: TimelineClip, trackId: string) => {
      e.preventDefault();
      e.stopPropagation();
      setSelectedClipId(clip.id);
      setContextMenu({ x: e.clientX, y: e.clientY, clipId: clip.id, trackId });
    },
    [setSelectedClipId]
  );

  // ─── Auto-scroll playhead ─────────────────────────────
  useEffect(() => {
    if (isPlaying && scrollRef.current) {
      const playheadX = currentTime * pxPerSecond;
      const scrollLeft = scrollRef.current.scrollLeft;
      const visibleWidth = scrollRef.current.clientWidth;

      if (
        playheadX > scrollLeft + visibleWidth - 100 ||
        playheadX < scrollLeft
      ) {
        scrollRef.current.scrollLeft = playheadX - 200;
      }
    }
  }, [currentTime, isPlaying, pxPerSecond]);

  const getClipIcon = (type: string) => {
    switch (type) {
      case "video":
        return <Film size={11} />;
      case "audio":
        return <Music size={11} />;
      case "image":
        return <Image size={11} />;
      case "text":
        return <Type size={11} />;
      default:
        return <Film size={11} />;
    }
  };

  return (
    <div
      ref={timelineRef}
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        userSelect: "none",
        background: "var(--bg-secondary)",
      }}
    >
      {/* Timeline toolbar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 12px",
          height: 36,
          flexShrink: 0,
          background: "var(--bg-tertiary)",
          borderBottom: "1px solid var(--border-subtle)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <button
            onClick={toggleSnapping}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "4px 8px",
              borderRadius: 6,
              fontSize: 11,
              border: "none",
              cursor: "pointer",
              transition: "all 0.15s",
              background: snapping
                ? "var(--accent-muted)"
                : "transparent",
              color: snapping
                ? "var(--accent)"
                : "var(--text-muted)",
            }}
            title={t.timeline.toggleSnapping}
          >
            <Magnet size={12} />
            {t.timeline.snap}
          </button>

          <div
            style={{ width: 1, height: 16, margin: "0 4px", background: "var(--border-default)" }}
          />

          <button
            onClick={() => {
              const track = tracks.find(
                (t) => t.clips.find((c) => c.id === selectedClipId)
              );
              if (track && selectedClipId) {
                removeClip(track.id, selectedClipId);
              }
            }}
            disabled={!selectedClipId}
            style={{
              padding: 6,
              borderRadius: 6,
              border: "none",
              background: "transparent",
              cursor: selectedClipId ? "pointer" : "default",
              opacity: selectedClipId ? 1 : 0.3,
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => { if (selectedClipId) e.currentTarget.style.background = "var(--hover-overlay)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
            title={t.timeline.deleteClip}
          >
            <Trash2
              size={13}
              style={{ color: "var(--text-muted)" }}
            />
          </button>

          <button
            onClick={() => {
              if (!selectedClipId) return;
              const track = tracks.find(
                (t) => t.clips.find((c) => c.id === selectedClipId)
              );
              if (track) {
                const clip = track.clips.find((c) => c.id === selectedClipId);
                if (clip && currentTime > clip.startTime && currentTime < clip.startTime + clip.duration) {
                  splitClip(track.id, selectedClipId, currentTime);
                }
              }
            }}
            disabled={!selectedClipId}
            style={{
              padding: 6,
              borderRadius: 6,
              border: "none",
              background: "transparent",
              cursor: selectedClipId ? "pointer" : "default",
              opacity: selectedClipId ? 1 : 0.3,
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => { if (selectedClipId) e.currentTarget.style.background = "var(--hover-overlay)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
            title={t.timeline.splitClip}
          >
            <Scissors
              size={13}
              style={{ color: "var(--text-muted)" }}
            />
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <button
            onClick={() => setZoom(zoom - 0.2)}
            style={{ padding: 4, borderRadius: 4, border: "none", background: "transparent", cursor: "pointer", transition: "all 0.15s" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--hover-overlay)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
          >
            <ZoomOut
              size={13}
              style={{ color: "var(--text-muted)" }}
            />
          </button>
          <div
            style={{ display: "flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 4, background: "var(--bg-surface)" }}
          >
            <ChevronsLeftRight
              size={10}
              style={{ color: "var(--text-muted)" }}
            />
            <span
              style={{ fontSize: 10, fontFamily: "monospace", color: "var(--text-secondary)" }}
            >
              {(zoom * 100).toFixed(0)}%
            </span>
          </div>
          <button
            onClick={() => setZoom(zoom + 0.2)}
            style={{ padding: 4, borderRadius: 4, border: "none", background: "transparent", cursor: "pointer", transition: "all 0.15s" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--hover-overlay)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
          >
            <ZoomIn
              size={13}
              style={{ color: "var(--text-muted)" }}
            />
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <button
            onClick={() => addTrack("video")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              padding: "4px 8px",
              borderRadius: 6,
              fontSize: 11,
              border: "none",
              background: "transparent",
              cursor: "pointer",
              color: "var(--text-muted)",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--hover-overlay)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
          >
            <Plus size={12} />
            {t.timeline.video}
          </button>
          <button
            onClick={() => addTrack("audio")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              padding: "4px 8px",
              borderRadius: 6,
              fontSize: 11,
              border: "none",
              background: "transparent",
              cursor: "pointer",
              color: "var(--text-muted)",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--hover-overlay)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
          >
            <Plus size={12} />
            {t.timeline.audio}
          </button>
        </div>
      </div>

      {/* Timeline content */}
      <div style={{ display: "flex", flex: 1, minHeight: 0, overflow: "hidden" }}>
        {/* Track headers */}
        <div
          style={{
            flexShrink: 0,
            overflowY: "auto",
            width: TRACK_HEADER_WIDTH,
            borderRight: "1px solid var(--border-subtle)",
            background: "var(--bg-tertiary)",
          }}
        >
          {/* Ruler spacer */}
          <div
            style={{
              height: `${RULER_HEIGHT}px`,
              borderBottom: "1px solid var(--border-subtle)",
            }}
          />

          {/* Track headers */}
          {tracks.map((track, idx) => (
            <TrackHeader key={track.id} track={track} index={idx} totalTracks={tracks.length} />
          ))}
        </div>

        {/* Scrollable timeline area */}
        <div
          ref={scrollRef}
          style={{ flex: 1, overflow: "auto", position: "relative" }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setSelectedClipId(null);
            }
          }}
        >
          {/* Ruler */}
          <div
            style={{
              position: "sticky",
              top: 0,
              zIndex: 20,
              cursor: "pointer",
              height: RULER_HEIGHT,
              width: Math.max(timelineWidth, 2000),
              background: "var(--bg-tertiary)",
              borderBottom: "1px solid var(--border-subtle)",
            }}
            onClick={handleRulerClick}
            onMouseDown={(e) => {
              handleRulerClick(e);
              setIsDraggingPlayhead(true);
            }}
          >
            {renderRuler()}
          </div>

          {/* Track lanes */}
          <div
            ref={trackLanesRef}
            style={{
              position: "relative",
              width: Math.max(timelineWidth, 2000),
              minHeight: "100%",
            }}
          >
            {tracks.map((track) => (
              <div
                key={track.id}
                data-track-id={track.id}
                style={{
                  position: "relative",
                  height: track.height,
                  borderBottom: "1px solid var(--border-subtle)",
                  opacity: track.visible ? 1 : 0.4,
                }}
                onClick={(e) => {
                  if (e.target === e.currentTarget) {
                    setSelectedClipId(null);
                  }
                }}
                onDragOver={(e) => {
                  if (e.dataTransfer.types.includes("application/timeline-media")) {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = "copy";
                  }
                }}
                onDrop={(e) => {
                  const raw = e.dataTransfer.getData("application/timeline-media");
                  if (!raw) return;
                  try {
                    const media = JSON.parse(raw);
                    // Compute time position from mouse X relative to track lane
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const dropTime = Math.max(0, x / pxPerSecond);
                    // Check track type compatibility
                    const isAudioMedia = media.type === "audio";
                    const isAudioTrack = track.type === "audio";
                    if (isAudioMedia !== isAudioTrack) return; // don't allow cross-type drop
                    addClipToTrack(track.id, {
                      id: uuidv4(),
                      mediaId: media.id,
                      type: media.type,
                      name: media.name,
                      trackId: track.id,
                      startTime: dropTime,
                      duration: media.duration,
                      trimStart: 0,
                      trimEnd: 0,
                      src: media.src,
                      thumbnail: media.thumbnail,
                      volume: 1,
                      opacity: 1,
                    });
                  } catch { /* ignore */ }
                }}
              >
                {/* Track background pattern */}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: track.color
                      ? `${track.color}08`
                      : track.type === "video"
                        ? "var(--accent-muted)"
                        : "rgba(6, 182, 212, 0.02)",
                  }}
                />

                {/* Clips */}
                {track.clips.map((clip) => (
                  <TimelineClipView
                    key={clip.id}
                    clip={clip}
                    trackId={track.id}
                    pxPerSecond={pxPerSecond}
                    trackHeight={track.height}
                    isSelected={selectedClipId === clip.id}
                    onMouseDown={(e) =>
                      handleClipDrag(e, clip, track.id)
                    }
                    onResizeStart={(e, edge) =>
                      handleClipResize(e, clip, track.id, edge)
                    }
                    onContextMenu={(e) =>
                      handleClipContextMenu(e, clip, track.id)
                    }
                    getClipIcon={getClipIcon}
                  />
                ))}
              </div>
            ))}

            {/* Playhead */}
            <div
              className="playhead-line"
              style={{
                left: `${currentTime * pxPerSecond}px`,
                top: 0,
                height: "100%",
              }}
            />
          </div>
        </div>
      </div>

      {/* Clip Context Menu */}
      {contextMenu && (
        <ClipContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          clipId={contextMenu.clipId}
          trackId={contextMenu.trackId}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
}

// ─── Track Header ─────────────────────────────────────
function TrackHeader({ track, index, totalTracks }: { track: Track; index: number; totalTracks: number }) {
  const [settings] = useSettings();
  const t = getTranslations(settings.language);
  const { toggleTrackMute, toggleTrackSolo, setTrackVolume, toggleTrackLock, toggleTrackVisibility, renameTrack, reorderTracks, removeTrack, updateTrackColor } =
    useEditorStore();
  const [colorPickerPos, setColorPickerPos] = useState<{ x: number; y: number } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(track.name);
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const commitRename = () => {
    const trimmed = editName.trim();
    if (trimmed && trimmed !== track.name) {
      renameTrack(track.id, trimmed);
    }
    setIsEditing(false);
  };

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("application/track-reorder", String(index));
        e.dataTransfer.effectAllowed = "move";
      }}
      onDragOver={(e) => {
        if (e.dataTransfer.types.includes("application/track-reorder")) {
          e.preventDefault();
          e.dataTransfer.dropEffect = "move";
          setDragOver(true);
        }
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        setDragOver(false);
        const fromIdx = parseInt(e.dataTransfer.getData("application/track-reorder"), 10);
        if (!isNaN(fromIdx) && fromIdx !== index) {
          reorderTracks(fromIdx, index);
        }
      }}
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        gap: 2,
        padding: "4px 8px",
        height: track.height,
        borderBottom: "1px solid var(--border-subtle)",
        borderTop: dragOver ? "2px solid var(--accent)" : "2px solid transparent",
        transition: "border-color 0.12s",
        position: "relative",
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        setColorPickerPos({ x: e.clientX, y: e.clientY });
      }}
    >
      {/* Track color picker (right-click menu) */}
      {colorPickerPos && (
        <>
          <div
            style={{ position: "fixed", inset: 0, zIndex: 999 }}
            onClick={() => setColorPickerPos(null)}
            onContextMenu={(e) => { e.preventDefault(); setColorPickerPos(null); }}
          />
          <div
            style={{
              position: "fixed",
              left: colorPickerPos.x,
              top: colorPickerPos.y,
              zIndex: 1000,
              padding: 8,
              borderRadius: 10,
              background: "var(--bg-secondary)",
              border: "1px solid var(--border-default)",
              boxShadow: "var(--shadow-dropdown)",
              minWidth: 170,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)", marginBottom: 6 }}>{t.timeline.trackColor}</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 4, marginBottom: 8 }}>
              {[
                "#ef4444", "#f97316", "#eab308", "#22c55e", "#06b6d4", "#3b82f6",
                "#8b5cf6", "#ec4899", "#f43f5e", "#14b8a6", "#6366f1", "#a855f7",
              ].map((c) => (
                <button
                  key={c}
                  onClick={() => { updateTrackColor(track.id, c); setColorPickerPos(null); }}
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 5,
                    border: track.color === c ? "2px solid #fff" : "1px solid var(--border-subtle)",
                    background: c,
                    cursor: "pointer",
                    transition: "transform 0.1s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.15)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
                />
              ))}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <input
                type="color"
                value={track.color || (track.type === "video" ? "#6366f1" : "#06b6d4")}
                onChange={(e) => updateTrackColor(track.id, e.target.value)}
                style={{ width: 26, height: 20, padding: 0, border: "1px solid var(--border-subtle)", borderRadius: 4, background: "transparent", cursor: "pointer" }}
              />
              <span style={{ fontSize: 10, color: "var(--text-muted)", flex: 1 }}>{t.common.custom}</span>
              {track.color && (
                <button
                  onClick={() => { updateTrackColor(track.id, undefined); setColorPickerPos(null); }}
                  style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, border: "1px solid var(--border-subtle)", background: "var(--bg-tertiary)", color: "var(--text-muted)", cursor: "pointer" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "var(--hover-overlay)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "var(--bg-tertiary)"; }}
                >{t.common.reset}</button>
              )}
            </div>
          </div>
        </>
      )}

      {/* Top row: drag handle, color bar, name, buttons */}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      {/* Drag handle */}
      <GripVertical
        size={12}
        style={{ color: "var(--text-muted)", cursor: "grab", flexShrink: 0, opacity: 0.5 }}
      />

      <div
        style={{
          width: 4,
          height: 20,
          borderRadius: 9999,
          flexShrink: 0,
          background: track.color || (track.type === "video" ? "var(--clip-video)" : "var(--clip-audio)"),
        }}
      />

      {isEditing ? (
        <input
          ref={inputRef}
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          onBlur={commitRename}
          onKeyDown={(e) => {
            if (e.key === "Enter") commitRename();
            if (e.key === "Escape") { setEditName(track.name); setIsEditing(false); }
          }}
          style={{
            fontSize: 11,
            fontWeight: 500,
            flex: 1,
            overflow: "hidden",
            color: "var(--text-primary)",
            background: "var(--bg-tertiary)",
            border: "1px solid var(--accent)",
            borderRadius: 4,
            padding: "1px 4px",
            outline: "none",
            minWidth: 0,
          }}
        />
      ) : (
        <span
          onDoubleClick={() => { setEditName(track.name); setIsEditing(true); }}
          style={{
            fontSize: 11,
            fontWeight: 500,
            flex: 1,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            cursor: "text",
            color: track.visible
              ? "var(--text-secondary)"
              : "var(--text-muted)",
          }}
          title={t.timeline.doubleClickRename}
        >
          {track.name}
        </span>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
        <button
          onClick={() => toggleTrackVisibility(track.id)}
          style={{ padding: 4, borderRadius: 4, border: "none", background: "transparent", cursor: "pointer", transition: "background 0.15s" }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "var(--hover-overlay)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
          title={track.visible ? t.timeline.hideTrack : t.timeline.showTrack}
        >
          {track.visible ? (
            <Eye size={11} style={{ color: "var(--text-muted)" }} />
          ) : (
            <EyeOff
              size={11}
              style={{ color: "var(--text-muted)", opacity: 0.5 }}
            />
          )}
        </button>
        <button
          onClick={() => toggleTrackMute(track.id)}
          style={{ padding: 4, borderRadius: 4, border: "none", background: "transparent", cursor: "pointer", transition: "background 0.15s" }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "var(--hover-overlay)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
          title={track.muted ? t.timeline.unmute : t.timeline.mute}
        >
          {track.muted ? (
            <VolumeX
              size={11}
              style={{ color: "var(--warning)" }}
            />
          ) : (
            <Volume2
              size={11}
              style={{ color: "var(--text-muted)" }}
            />
          )}
        </button>
        <button
          onClick={() => toggleTrackSolo(track.id)}
          style={{ padding: 4, borderRadius: 4, border: "none", background: track.solo ? "rgba(234, 179, 8, 0.15)" : "transparent", cursor: "pointer", transition: "background 0.15s" }}
          onMouseEnter={(e) => { if (!track.solo) e.currentTarget.style.background = "var(--hover-overlay)"; }}
          onMouseLeave={(e) => { if (!track.solo) e.currentTarget.style.background = track.solo ? "rgba(234, 179, 8, 0.15)" : "transparent"; }}
          title={track.solo ? t.timeline.unsolo : t.timeline.solo}
        >
          <Headphones
            size={11}
            style={{ color: track.solo ? "#eab308" : "var(--text-muted)" }}
          />
        </button>
        <button
          onClick={() => toggleTrackLock(track.id)}
          style={{ padding: 4, borderRadius: 4, border: "none", background: "transparent", cursor: "pointer", transition: "background 0.15s" }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "var(--hover-overlay)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
          title={track.locked ? t.timeline.unlock : t.timeline.lock}
        >
          {track.locked ? (
            <Lock size={11} style={{ color: "var(--warning)" }} />
          ) : (
            <Unlock
              size={11}
              style={{ color: "var(--text-muted)" }}
            />
          )}
        </button>
        <button
          onClick={() => {
            if (track.clips.length > 0) {
              setConfirmDelete(true);
            } else {
              removeTrack(track.id);
            }
          }}
          style={{ padding: 4, borderRadius: 4, border: "none", background: confirmDelete ? "rgba(239,68,68,0.2)" : "transparent", cursor: "pointer", transition: "background 0.15s" }}
          onMouseEnter={(e) => { if (!confirmDelete) e.currentTarget.style.background = "rgba(239,68,68,0.15)"; }}
          onMouseLeave={(e) => { if (!confirmDelete) e.currentTarget.style.background = "transparent"; }}
          title={t.timeline.removeTrack}
        >
          <Trash2 size={11} style={{ color: confirmDelete ? "#ef4444" : "var(--text-muted)" }} />
        </button>
      </div>
      </div>{/* end top row */}

      {/* Track volume slider */}
      <div style={{ display: "flex", alignItems: "center", gap: 4, paddingLeft: 18 }}>
        <Volume2 size={9} style={{ color: "var(--text-muted)", flexShrink: 0, opacity: 0.6 }} />
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={track.volume ?? 1}
          onChange={(e) => setTrackVolume(track.id, parseFloat(e.target.value))}
          style={{ flex: 1, height: 3, maxWidth: 80 }}
          title={`Track volume: ${Math.round((track.volume ?? 1) * 100)}%`}
        />
        <span style={{ fontSize: 9, fontFamily: "monospace", color: "var(--text-muted)", width: 26, textAlign: "right" }}>
          {Math.round((track.volume ?? 1) * 100)}%
        </span>
      </div>

      {/* Delete confirmation */}
      {confirmDelete && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            right: 4,
            zIndex: 100,
            padding: "8px 10px",
            borderRadius: 8,
            background: "var(--bg-secondary)",
            border: "1px solid var(--border-default)",
            boxShadow: "var(--shadow-dropdown)",
            minWidth: 180,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <p style={{ fontSize: 11, color: "var(--text-secondary)", margin: "0 0 8px", lineHeight: 1.4 }}>
            Delete <strong>{track.name}</strong> with {track.clips.length} clip{track.clips.length !== 1 ? "s" : ""}?
          </p>
          <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
            <button
              onClick={() => setConfirmDelete(false)}
              style={{
                fontSize: 11, padding: "3px 10px", borderRadius: 5,
                border: "1px solid var(--border-subtle)", background: "var(--bg-tertiary)",
                color: "var(--text-secondary)", cursor: "pointer",
              }}
            >Cancel</button>
            <button
              onClick={() => { removeTrack(track.id); setConfirmDelete(false); }}
              style={{
                fontSize: 11, padding: "3px 10px", borderRadius: 5,
                border: "none", background: "#ef4444",
                color: "#fff", cursor: "pointer", fontWeight: 500,
              }}
            >Delete</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Timeline Clip ──────────────────────────────────────
function TimelineClipView({
  clip,
  trackId,
  pxPerSecond,
  trackHeight,
  isSelected,
  onMouseDown,
  onResizeStart,
  onContextMenu,
  getClipIcon,
}: {
  clip: TimelineClip;
  trackId: string;
  pxPerSecond: number;
  trackHeight: number;
  isSelected: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
  onResizeStart: (e: React.MouseEvent, edge: "left" | "right") => void;
  onContextMenu: (e: React.MouseEvent) => void;
  getClipIcon: (type: string) => React.ReactNode;
}) {
  const left = clip.startTime * pxPerSecond;
  const width = clip.duration * pxPerSecond;

  // Build glow shadow that always matches the clip's visual color
  // null means "use the CSS .selected rule" (for accent-themed video clips)
  const glowColor = clip.clipColor || getClipPrimaryColor(clip.type);
  const clipGlow = isSelected && glowColor
    ? `0 0 0 2px ${glowColor}, 0 0 20px ${glowColor}66`
    : undefined;

  return (
    <div
      className={`timeline-clip${isSelected ? " selected" : ""}`}
      style={{
        position: "absolute",
        top: 4,
        left,
        width: Math.max(width, 4),
        height: trackHeight - 8,
        borderRadius: 6,
        overflow: "hidden",
        background: clip.clipColor || getClipGradient(clip.type),
        opacity: clip.opacity ?? 1,
        ...(clipGlow ? { boxShadow: clipGlow } : {}),
      }}
      onMouseEnter={(e) => {
        if (!isSelected && glowColor) {
          e.currentTarget.style.boxShadow = `0 0 0 1px ${glowColor}, 0 4px 12px rgba(0,0,0,0.25)`;
        }
      }}
      onMouseLeave={(e) => {
        if (!isSelected && glowColor) {
          e.currentTarget.style.boxShadow = clipGlow || "";
        }
      }}
      onMouseDown={onMouseDown}
      onContextMenu={onContextMenu}
    >
      {/* Waveform / thumbnail */}
      <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
        {clip.type === "audio" && (
          <AudioWaveform
            src={clip.src}
            width={width}
            trimStart={clip.trimStart}
            clipDuration={clip.duration}
          />
        )}
        {clip.type === "video" && clip.thumbnail && (
          <div style={{ position: "absolute", inset: 0, display: "flex" }}>
            {Array.from({
              length: Math.max(1, Math.ceil(width / 80)),
            }).map((_, i) => (
              <img
                key={i}
                src={clip.thumbnail}
                alt=""
                style={{
                  height: "100%",
                  flexShrink: 0,
                  objectFit: "cover",
                  width: 80,
                  opacity: 0.4,
                }}
              />
            ))}
          </div>
        )}
        {clip.type === "video" && clip.src && (
          <AudioWaveform
            src={clip.src}
            width={width}
            trimStart={clip.trimStart}
            clipDuration={clip.duration}
            overlay
          />
        )}
      </div>

      {/* Clip label */}
      <div
        style={{
          position: "relative",
          zIndex: 10,
          display: "flex",
          alignItems: "center",
          gap: 4,
          padding: "4px 8px",
          height: "100%",
        }}
      >
        <span style={{ color: "rgba(255,255,255,0.8)", flexShrink: 0 }}>
          {getClipIcon(clip.type)}
        </span>
        <span
          style={{
            fontSize: 10,
            color: "rgba(255,255,255,0.9)",
            fontWeight: 500,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {clip.name}
        </span>
      </div>

      {/* Resize handles */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 6,
          cursor: "ew-resize",
          zIndex: 20,
          transition: "background 0.15s",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.3)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
        onMouseDown={(e) => onResizeStart(e, "left")}
      />
      <div
        style={{
          position: "absolute",
          right: 0,
          top: 0,
          bottom: 0,
          width: 6,
          cursor: "ew-resize",
          zIndex: 20,
          transition: "background 0.15s",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.3)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
        onMouseDown={(e) => onResizeStart(e, "right")}
      />

      {/* Selection border */}
      {isSelected && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 6,
            pointerEvents: "none",
            border: `2px solid ${glowColor ? glowColor + "cc" : "rgba(255,255,255,0.6)"}`,
          }}
        />
      )}
    </div>
  );
}

// ─── Clip Context Menu ──────────────────────────────────
const SPEED_OPTIONS = [
  { label: "0.25×", value: 0.25 },
  { label: "0.5×", value: 0.5 },
  { label: "1× (Normal)", value: 1 },
  { label: "1.5×", value: 1.5 },
  { label: "2×", value: 2 },
  { label: "4×", value: 4 },
];

function ClipContextMenu({
  x,
  y,
  clipId,
  trackId,
  onClose,
}: {
  x: number;
  y: number;
  clipId: string;
  trackId: string;
  onClose: () => void;
}) {
  const {
    currentTime,
    removeClip,
    splitClip,
    duplicateClip,
    updateClip,
    setSelectedClipId,
    setPropertiesPanelOpen,
    tracks,
  } = useEditorStore();
  const settings = useSettings();
  const t = getTranslations(settings.language);

  const menuRef = useRef<HTMLDivElement>(null);
  const [speedSubmenu, setSpeedSubmenu] = useState(false);
  const [colorSubmenu, setColorSubmenu] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  // Find the actual clip
  const track = tracks.find((t) => t.id === trackId);
  const clip = track?.clips.find((c) => c.id === clipId);

  // Adjust position to keep menu on-screen
  const [pos, setPos] = useState({ x, y });
  useEffect(() => {
    const el = menuRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const nx = x + rect.width > window.innerWidth ? x - rect.width : x;
    const ny = y + rect.height > window.innerHeight ? y - rect.height : y;
    setPos({ x: Math.max(0, nx), y: Math.max(0, ny) });
  }, [x, y]);

  if (!clip) return null;

  const isMuted = (clip.volume ?? 1) === 0;
  const canSplit =
    currentTime > clip.startTime &&
    currentTime < clip.startTime + clip.duration;

  const menuItems: {
    id: string;
    label: string;
    icon: React.ReactNode;
    shortcut?: string;
    danger?: boolean;
    disabled?: boolean;
    separator?: boolean;
    hasSubmenu?: boolean;
    onClick?: () => void;
  }[] = [
    {
      id: "split",
      label: t.timeline.splitAtPlayheadCtx,
      icon: <Scissors size={14} />,
      shortcut: "Ctrl+B",
      disabled: !canSplit,
      onClick: () => {
        splitClip(trackId, clipId, currentTime);
        onClose();
      },
    },
    {
      id: "duplicate",
      label: t.timeline.duplicate,
      icon: <Copy size={14} />,
      shortcut: "Ctrl+D",
      onClick: () => {
        duplicateClip(trackId, clipId);
        onClose();
      },
    },
    { id: "sep1", label: "", icon: null, separator: true },
    {
      id: "mute",
      label: isMuted ? t.timeline.unmuteClip : t.timeline.muteClip,
      icon: isMuted ? <Volume2 size={14} /> : <VolumeOff size={14} />,
      onClick: () => {
        updateClip(trackId, clipId, { volume: isMuted ? 1 : 0 });
        onClose();
      },
    },
    {
      id: "speed",
      label: t.timeline.speed,
      icon: <Gauge size={14} />,
      hasSubmenu: true,
      onClick: () => setSpeedSubmenu(!speedSubmenu),
    },
    { id: "sep2", label: "", icon: null, separator: true },
    {
      id: "properties",
      label: t.timeline.properties,
      icon: <PanelRightOpen size={14} />,
      onClick: () => {
        setSelectedClipId(clipId);
        setPropertiesPanelOpen(true);
        onClose();
      },
    },
    {
      id: "color",
      label: t.timeline.clipColor,
      icon: <Palette size={14} />,
      hasSubmenu: true,
      onClick: () => setColorSubmenu(!colorSubmenu),
    },
    { id: "sep3", label: "", icon: null, separator: true },
    {
      id: "delete",
      label: t.timeline.delete,
      icon: <Trash2 size={14} />,
      shortcut: "Del",
      danger: true,
      onClick: () => {
        removeClip(trackId, clipId);
        onClose();
      },
    },
  ];

  return (
    <div
      ref={menuRef}
      style={{
        position: "fixed",
        left: pos.x,
        top: pos.y,
        zIndex: 1000,
        minWidth: 200,
        padding: "4px 0",
        borderRadius: 10,
        background: "var(--bg-secondary)",
        border: "1px solid var(--border-default)",
        boxShadow: "var(--shadow-dropdown)",
        backdropFilter: "blur(20px)",
      }}
      onClick={(e) => e.stopPropagation()}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Clip info header */}
      <div
        style={{
          padding: "6px 12px 4px",
          display: "flex",
          alignItems: "center",
          gap: 6,
          borderBottom: "1px solid var(--border-subtle)",
          marginBottom: 4,
        }}
      >
        <span style={{ color: "var(--text-muted)" }}>
          {clip.type === "video" ? <Film size={12} /> :
           clip.type === "audio" ? <Music size={12} /> :
           clip.type === "image" ? <Image size={12} /> :
           <Type size={12} />}
        </span>
        <span
          style={{
            fontSize: 11,
            fontWeight: 500,
            color: "var(--text-secondary)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            maxWidth: 160,
          }}
        >
          {clip.name}
        </span>
      </div>

      {menuItems.map((item) => {
        if (item.separator) {
          return (
            <div
              key={item.id}
              style={{ height: 1, margin: "4px 8px", background: "var(--border-subtle)" }}
            />
          );
        }

        const isHovered = hoveredItem === item.id;

        return (
          <div key={item.id} style={{ position: "relative" }}>
            <button
              disabled={item.disabled}
              onClick={item.onClick}
              onMouseEnter={() => {
                setHoveredItem(item.id);
                if (item.id !== "speed") setSpeedSubmenu(false);
                if (item.id !== "color") setColorSubmenu(false);
              }}
              onMouseLeave={() => setHoveredItem(null)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                width: "100%",
                padding: "6px 12px",
                border: "none",
                borderRadius: 0,
                background: isHovered
                  ? item.danger
                    ? "rgba(239, 68, 68, 0.12)"
                    : "var(--hover-overlay)"
                  : "transparent",
                color: item.disabled
                  ? "var(--text-muted)"
                  : item.danger
                    ? "#ef4444"
                    : "var(--text-secondary)",
                cursor: item.disabled ? "default" : "pointer",
                opacity: item.disabled ? 0.4 : 1,
                fontSize: 12,
                textAlign: "left",
                transition: "background 0.1s",
              }}
            >
              <span style={{ width: 16, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {item.icon}
              </span>
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.shortcut && (
                <span
                  style={{
                    fontSize: 10,
                    color: "var(--text-muted)",
                    fontFamily: "monospace",
                  }}
                >
                  {item.shortcut}
                </span>
              )}
              {item.hasSubmenu && (
                <span style={{ fontSize: 10, color: "var(--text-muted)" }}>▸</span>
              )}
            </button>

            {/* Speed submenu */}
            {item.id === "speed" && speedSubmenu && (
              <div
                style={{
                  position: "absolute",
                  left: "100%",
                  top: -4,
                  minWidth: 140,
                  padding: "4px 0",
                  borderRadius: 10,
                  background: "var(--bg-secondary)",
                  border: "1px solid var(--border-default)",
                  boxShadow: "var(--shadow-dropdown)",
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {SPEED_OPTIONS.map((opt) => {
                  const speedLabels: Record<number, string> = {
                    0.25: t.timeline.speed025,
                    0.5: t.timeline.speed05,
                    1: t.timeline.speed1,
                    1.5: t.timeline.speed15,
                    2: t.timeline.speed2,
                    4: t.timeline.speed4,
                  };
                  return (
                    <button
                      key={opt.value}
                      onClick={() => {
                        // Adjust clip duration by speed factor
                        const originalDuration = clip.duration;
                        const currentSpeed = 1; // base
                        const newDuration = (originalDuration * currentSpeed) / opt.value;
                        updateClip(trackId, clipId, { duration: newDuration });
                        onClose();
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        width: "100%",
                        padding: "6px 12px",
                        border: "none",
                        background: "transparent",
                        color: opt.value === 1 ? "var(--accent)" : "var(--text-secondary)",
                        cursor: "pointer",
                        fontSize: 12,
                        textAlign: "left",
                        fontWeight: opt.value === 1 ? 500 : 400,
                        transition: "background 0.1s",
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "var(--hover-overlay)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                    >
                      {speedLabels[opt.value] ?? opt.label}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Color submenu */}
            {item.id === "color" && colorSubmenu && (
              <div
                style={{
                  position: "absolute",
                  left: "100%",
                  top: -4,
                  minWidth: 180,
                  padding: 8,
                  borderRadius: 10,
                  background: "var(--bg-secondary)",
                  border: "1px solid var(--border-default)",
                  boxShadow: "var(--shadow-dropdown)",
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 4, marginBottom: 8 }}>
                  {[
                    "#ef4444", "#f97316", "#eab308", "#22c55e", "#06b6d4", "#3b82f6",
                    "#8b5cf6", "#ec4899", "#f43f5e", "#14b8a6", "#6366f1", "#a855f7",
                  ].map((color) => (
                    <button
                      key={color}
                      onClick={() => {
                        updateClip(trackId, clipId, { clipColor: color });
                        onClose();
                      }}
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 6,
                        border: clip.clipColor === color ? "2px solid #fff" : "1px solid var(--border-subtle)",
                        background: color,
                        cursor: "pointer",
                        transition: "transform 0.1s",
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.15)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
                    />
                  ))}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <input
                    type="color"
                    value={clip.clipColor || "#6366f1"}
                    onChange={(e) => {
                      updateClip(trackId, clipId, { clipColor: e.target.value });
                    }}
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
                  <span style={{ fontSize: 10, color: "var(--text-muted)", flex: 1 }}>{t.timeline.custom}</span>
                  {clip.clipColor && (
                    <button
                      onClick={() => {
                        updateClip(trackId, clipId, { clipColor: undefined });
                        onClose();
                      }}
                      style={{
                        fontSize: 10,
                        padding: "2px 6px",
                        borderRadius: 4,
                        border: "1px solid var(--border-subtle)",
                        background: "var(--bg-tertiary)",
                        color: "var(--text-muted)",
                        cursor: "pointer",
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "var(--hover-overlay)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "var(--bg-tertiary)"; }}
                    >
                      {t.timeline.reset}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Audio Waveform Visualization ───────────────────────
function AudioWaveform({
  src,
  width,
  trimStart,
  clipDuration,
  overlay,
}: {
  src: string;
  width: number;
  trimStart: number;
  clipDuration: number;
  overlay?: boolean;
}) {
  // ~3px per bar
  const totalBars = Math.max(1, Math.floor(width / 3));
  // Decode enough peaks to cover the full source, we'll slice for trim
  const numPeaks = Math.max(totalBars, 200);
  const waveform = useWaveform(src, numPeaks);

  // Determine which slice of peaks to show based on trim
  let bars: number[] = [];
  if (waveform && waveform.peaks.length > 0) {
    const totalSourceDur = waveform.duration;
    const startFrac = totalSourceDur > 0 ? trimStart / totalSourceDur : 0;
    const endFrac =
      totalSourceDur > 0
        ? Math.min(1, (trimStart + clipDuration) / totalSourceDur)
        : 1;
    const startIdx = Math.floor(startFrac * waveform.peaks.length);
    const endIdx = Math.ceil(endFrac * waveform.peaks.length);
    const sliced = waveform.peaks.slice(startIdx, endIdx);

    // Resample sliced peaks to match totalBars
    if (sliced.length > 0) {
      for (let i = 0; i < totalBars; i++) {
        const srcIdx = (i / totalBars) * sliced.length;
        const lo = Math.floor(srcIdx);
        const hi = Math.min(lo + 1, sliced.length - 1);
        const frac = srcIdx - lo;
        bars.push(sliced[lo] * (1 - frac) + sliced[hi] * frac);
      }
    }
  }

  // If no waveform data yet, show a subtle placeholder
  const hasPeaks = bars.length > 0;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: overlay ? "flex-end" : "center",
        gap: 1,
        padding: overlay ? "0 4px 2px" : "0 4px",
        opacity: overlay ? 0.25 : 0.4,
      }}
    >
      {hasPeaks
        ? bars.map((v, i) => (
            <div
              key={i}
              style={{
                flexShrink: 0,
                borderRadius: 9999,
                width: 2,
                height: `${Math.max(4, v * (overlay ? 40 : 80))}%`,
                background: "rgba(255,255,255,0.6)",
              }}
            />
          ))
        : /* Placeholder bars while decoding */
          Array.from({ length: totalBars }).map((_, i) => (
            <div
              key={i}
              style={{
                flexShrink: 0,
                borderRadius: 9999,
                width: 2,
                height: "8%",
                background: "rgba(255,255,255,0.2)",
              }}
            />
          ))}
    </div>
  );
}
