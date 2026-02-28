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
          className="absolute top-0"
          style={{
            left: `${x}px`,
            height: isMajor ? "14px" : "6px",
            width: "1px",
            background: isMajor
              ? "rgba(255,255,255,0.25)"
              : "rgba(255,255,255,0.08)",
            bottom: 0,
            top: "auto",
          }}
        >
          {isMajor && (
            <span
              className="absolute text-[9px] select-none"
              style={{
                bottom: "16px",
                left: "3px",
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
      className="flex flex-col h-full select-none"
      style={{
        background: "var(--bg-secondary)",
      }}
    >
      {/* Timeline toolbar */}
      <div
        className="flex items-center justify-between px-3 h-9 flex-shrink-0"
        style={{
          background: "var(--bg-tertiary)",
          borderBottom: "1px solid var(--border-subtle)",
        }}
      >
        <div className="flex items-center gap-1">
          <button
            onClick={toggleSnapping}
            className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] transition-all"
            style={{
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
            className="w-px h-4 mx-1"
            style={{ background: "var(--border-default)" }}
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
            className="p-1.5 rounded-md transition-all hover:bg-white/5 disabled:opacity-30"
            title="Delete clip"
          >
            <Trash2
              size={13}
              style={{ color: "var(--text-muted)" }}
            />
          </button>

          <button
            disabled={!selectedClipId}
            className="p-1.5 rounded-md transition-all hover:bg-white/5 disabled:opacity-30"
            title="Split clip"
          >
            <Scissors
              size={13}
              style={{ color: "var(--text-muted)" }}
            />
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setZoom(zoom - 0.2)}
            className="p-1 rounded transition-all hover:bg-white/5"
          >
            <ZoomOut
              size={13}
              style={{ color: "var(--text-muted)" }}
            />
          </button>
          <div
            className="flex items-center gap-1 px-2 py-0.5 rounded"
            style={{ background: "var(--bg-surface)" }}
          >
            <ChevronsLeftRight
              size={10}
              style={{ color: "var(--text-muted)" }}
            />
            <span
              className="text-[10px] font-mono"
              style={{ color: "var(--text-secondary)" }}
            >
              {(zoom * 100).toFixed(0)}%
            </span>
          </div>
          <button
            onClick={() => setZoom(zoom + 0.2)}
            className="p-1 rounded transition-all hover:bg-white/5"
          >
            <ZoomIn
              size={13}
              style={{ color: "var(--text-muted)" }}
            />
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => addTrack("video")}
            className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] transition-all hover:bg-white/5"
            style={{ color: "var(--text-muted)" }}
          >
            <Plus size={12} />
            Video
          </button>
          <button
            onClick={() => addTrack("audio")}
            className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] transition-all hover:bg-white/5"
            style={{ color: "var(--text-muted)" }}
          >
            <Plus size={12} />
            Audio
          </button>
        </div>
      </div>

      {/* Timeline content */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Track headers */}
        <div
          className="flex-shrink-0 overflow-y-auto"
          style={{
            width: `${TRACK_HEADER_WIDTH}px`,
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
          className="flex-1 overflow-auto relative"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setSelectedClipId(null);
            }
          }}
        >
          {/* Ruler */}
          <div
            className="sticky top-0 z-20 cursor-pointer"
            style={{
              height: `${RULER_HEIGHT}px`,
              width: `${Math.max(timelineWidth, 2000)}px`,
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
            className="relative"
            style={{
              width: `${Math.max(timelineWidth, 2000)}px`,
              minHeight: "100%",
            }}
          >
            {tracks.map((track) => (
              <div
                key={track.id}
                className="relative"
                style={{
                  height: `${track.height}px`,
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
                  className="absolute inset-0"
                  style={{
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
    </div>
  );
}

// ─── Track Header ─────────────────────────────────────
function TrackHeader({ track }: { track: Track }) {
  const { toggleTrackMute, toggleTrackLock, toggleTrackVisibility } =
    useEditorStore();

  return (
    <div
      className="flex items-center gap-1.5 px-2"
      style={{
        height: `${track.height}px`,
        borderBottom: "1px solid var(--border-subtle)",
      }}
    >
      <div
        className="w-1 h-5 rounded-full flex-shrink-0"
        style={{
          background:
            track.type === "video"
              ? "var(--clip-video)"
              : "var(--clip-audio)",
        }}
      />

      <span
        className="text-[11px] font-medium flex-1 truncate"
        style={{
          color: track.visible
            ? "var(--text-secondary)"
            : "var(--text-muted)",
        }}
      >
        {track.name}
      </span>

      <div className="flex items-center gap-0.5">
        <button
          onClick={() => toggleTrackVisibility(track.id)}
          className="p-1 rounded transition-all hover:bg-white/5"
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
          className="p-1 rounded transition-all hover:bg-white/5"
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
          className="p-1 rounded transition-all hover:bg-white/5"
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
  getClipIcon,
}: {
  clip: TimelineClip;
  trackId: string;
  pxPerSecond: number;
  trackHeight: number;
  isSelected: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
  onResizeStart: (e: React.MouseEvent, edge: "left" | "right") => void;
  getClipIcon: (type: string) => React.ReactNode;
}) {
  const left = clip.startTime * pxPerSecond;
  const width = clip.duration * pxPerSecond;

  return (
    <div
      className={`timeline-clip absolute top-1 rounded-md overflow-hidden ${
        isSelected ? "selected" : ""
      }`}
      style={{
        left: `${left}px`,
        width: `${Math.max(width, 4)}px`,
        height: `${trackHeight - 8}px`,
        background: getClipGradient(clip.type),
        opacity: clip.opacity ?? 1,
      }}
      onMouseDown={onMouseDown}
    >
      {/* Waveform / thumbnail */}
      <div className="absolute inset-0 overflow-hidden">
        {clip.type === "audio" && <AudioWaveform width={width} />}
        {clip.type === "video" && clip.thumbnail && (
          <div className="absolute inset-0 flex">
            {Array.from({
              length: Math.max(1, Math.ceil(width / 80)),
            }).map((_, i) => (
              <img
                key={i}
                src={clip.thumbnail}
                alt=""
                className="h-full flex-shrink-0 object-cover"
                style={{
                  width: "80px",
                  opacity: 0.4,
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Clip label */}
      <div className="relative z-10 flex items-center gap-1 px-2 py-1 h-full">
        <span className="text-white/80 flex-shrink-0">
          {getClipIcon(clip.type)}
        </span>
        <span className="text-[10px] text-white/90 font-medium truncate">
          {clip.name}
        </span>
      </div>

      {/* Resize handles */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1.5 cursor-ew-resize hover:bg-white/30 transition-colors z-20"
        onMouseDown={(e) => onResizeStart(e, "left")}
      />
      <div
        className="absolute right-0 top-0 bottom-0 w-1.5 cursor-ew-resize hover:bg-white/30 transition-colors z-20"
        onMouseDown={(e) => onResizeStart(e, "right")}
      />

      {/* Selection border */}
      {isSelected && (
        <div
          className="absolute inset-0 rounded-md pointer-events-none"
          style={{
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

// ─── Audio Waveform Visualization ───────────────────────
function AudioWaveform({ width }: { width: number }) {
  const bars = Math.max(1, Math.floor(width / 3));

  return (
    <div className="absolute inset-0 flex items-center gap-px px-1 opacity-40">
      {Array.from({ length: bars }).map((_, i) => {
        const h = 20 + Math.sin(i * 0.7) * 30 + seededRandom(i) * 20;
        return (
          <div
            key={i}
            className="flex-shrink-0 rounded-full"
            style={{
              width: "2px",
              height: `${h}%`,
              background: "rgba(255,255,255,0.6)",
            }}
          />
        );
      })}
    </div>
  );
}
