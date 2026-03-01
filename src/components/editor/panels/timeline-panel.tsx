"use client";

import React, { useRef, useCallback, useState, useEffect } from "react";
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
} from "lucide-react";
import { formatTime, getClipGradient } from "@/lib/utils";
import type { TimelineClip, Track } from "@/types/editor";

const PIXELS_PER_SECOND_BASE = 80;
const RULER_HEIGHT = 28;
const TRACK_HEADER_WIDTH = 180;

export default function TimelinePanel() {
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
    addTrack,
    isPlaying,
    splitClip,
    duplicateClip,
    setPropertiesPanelOpen,
  } = useEditorStore();

  const timelineRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
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
              : "rgba(255,255,255,0.08)",
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

  // ─── Clip Drag ────────────────────────────────────────
  const handleClipDrag = useCallback(
    (
      e: React.MouseEvent,
      clip: TimelineClip,
      trackId: string
    ) => {
      e.stopPropagation();
      setSelectedClipId(clip.id);
      setIsDraggingClip(true);

      const startX = e.clientX;
      const startTime = clip.startTime;

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

        updateClip(trackId, clip.id, { startTime: newTime });
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
            title="Toggle Snapping"
          >
            <Magnet size={12} />
            Snap
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
            onMouseEnter={(e) => { if (selectedClipId) e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
            title="Delete clip"
          >
            <Trash2
              size={13}
              style={{ color: "var(--text-muted)" }}
            />
          </button>

          <button
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
            onMouseEnter={(e) => { if (selectedClipId) e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
            title="Split clip"
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
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
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
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
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
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
          >
            <Plus size={12} />
            Video
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
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
          >
            <Plus size={12} />
            Audio
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
          {tracks.map((track) => (
            <TrackHeader key={track.id} track={track} />
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
            style={{
              position: "relative",
              width: Math.max(timelineWidth, 2000),
              minHeight: "100%",
            }}
          >
            {tracks.map((track) => (
              <div
                key={track.id}
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
              >
                {/* Track background pattern */}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background:
                      track.type === "video"
                        ? "rgba(124, 92, 252, 0.02)"
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
function TrackHeader({ track }: { track: Track }) {
  const { toggleTrackMute, toggleTrackLock, toggleTrackVisibility } =
    useEditorStore();

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "0 8px",
        height: track.height,
        borderBottom: "1px solid var(--border-subtle)",
      }}
    >
      <div
        style={{
          width: 4,
          height: 20,
          borderRadius: 9999,
          flexShrink: 0,
          background:
            track.type === "video"
              ? "var(--clip-video)"
              : "var(--clip-audio)",
        }}
      />

      <span
        style={{
          fontSize: 11,
          fontWeight: 500,
          flex: 1,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          color: track.visible
            ? "var(--text-secondary)"
            : "var(--text-muted)",
        }}
      >
        {track.name}
      </span>

      <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
        <button
          onClick={() => toggleTrackVisibility(track.id)}
          style={{ padding: 4, borderRadius: 4, border: "none", background: "transparent", cursor: "pointer", transition: "background 0.15s" }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
          title={track.visible ? "Hide track" : "Show track"}
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
          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
          title={track.muted ? "Unmute" : "Mute"}
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
          onClick={() => toggleTrackLock(track.id)}
          style={{ padding: 4, borderRadius: 4, border: "none", background: "transparent", cursor: "pointer", transition: "background 0.15s" }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
          title={track.locked ? "Unlock" : "Lock"}
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
      </div>
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
        background: getClipGradient(clip.type),
        opacity: clip.opacity ?? 1,
      }}
      onMouseDown={onMouseDown}
      onContextMenu={onContextMenu}
    >
      {/* Waveform / thumbnail */}
      <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
        {clip.type === "audio" && <AudioWaveform width={width} />}
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
            border: "2px solid rgba(255,255,255,0.6)",
          }}
        />
      )}
    </div>
  );
}

// Deterministic pseudo-random for stable hydration
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 49297;
  return x - Math.floor(x);
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

  const menuRef = useRef<HTMLDivElement>(null);
  const [speedSubmenu, setSpeedSubmenu] = useState(false);
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
      label: "Split at Playhead",
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
      label: "Duplicate",
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
      label: isMuted ? "Unmute Clip" : "Mute Clip",
      icon: isMuted ? <Volume2 size={14} /> : <VolumeOff size={14} />,
      onClick: () => {
        updateClip(trackId, clipId, { volume: isMuted ? 1 : 0 });
        onClose();
      },
    },
    {
      id: "speed",
      label: "Speed",
      icon: <Gauge size={14} />,
      hasSubmenu: true,
      onClick: () => setSpeedSubmenu(!speedSubmenu),
    },
    { id: "sep2", label: "", icon: null, separator: true },
    {
      id: "properties",
      label: "Properties",
      icon: <PanelRightOpen size={14} />,
      onClick: () => {
        setSelectedClipId(clipId);
        setPropertiesPanelOpen(true);
        onClose();
      },
    },
    { id: "sep3", label: "", icon: null, separator: true },
    {
      id: "delete",
      label: "Delete",
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
        boxShadow: "0 12px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)",
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
                    : "rgba(255,255,255,0.06)"
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
                  boxShadow: "0 8px 30px rgba(0,0,0,0.4)",
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {SPEED_OPTIONS.map((opt) => {
                  // Compute effective speed from current duration vs original
                  const isActive = false; // could compare to stored speed
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
                      onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Audio Waveform Visualization ───────────────────────
function AudioWaveform({ width }: { width: number }) {
  const bars = Math.max(1, Math.floor(width / 3));

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        gap: 1,
        padding: "0 4px",
        opacity: 0.4,
      }}
    >
      {Array.from({ length: bars }).map((_, i) => {
        const h = 20 + Math.sin(i * 0.7) * 30 + seededRandom(i) * 20;
        return (
          <div
            key={i}
            style={{
              flexShrink: 0,
              borderRadius: 9999,
              width: 2,
              height: `${h}%`,
              background: "rgba(255,255,255,0.6)",
            }}
          />
        );
      })}
    </div>
  );
}
