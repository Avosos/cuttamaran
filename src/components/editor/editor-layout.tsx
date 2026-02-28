"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import EditorHeader from "@/components/editor/editor-header";
import AssetsPanel from "@/components/editor/panels/assets-panel";
import PreviewPanel from "@/components/editor/panels/preview-panel";
import TimelinePanel from "@/components/editor/panels/timeline-panel";
import PropertiesPanel from "@/components/editor/panels/properties-panel";
import KeyboardShortcuts from "@/components/editor/keyboard-shortcuts";
import { useEditorStore } from "@/stores/editor-store";

const MIN_PANEL_WIDTH = 200;
const MIN_TIMELINE_HEIGHT = 150;
const DEFAULT_LEFT_WIDTH = 280;
const DEFAULT_TIMELINE_HEIGHT = 260;

export default function EditorLayout() {
  const { propertiesPanelOpen } = useEditorStore();
  const [leftWidth, setLeftWidth] = useState(DEFAULT_LEFT_WIDTH);
  const [timelineHeight, setTimelineHeight] = useState(
    DEFAULT_TIMELINE_HEIGHT
  );
  const [isDraggingLeft, setIsDraggingLeft] = useState(false);
  const [isDraggingTimeline, setIsDraggingTimeline] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // ─── Left panel resize ────────────────────────────────
  const handleLeftResize = useCallback((e: MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const newWidth = Math.max(
      MIN_PANEL_WIDTH,
      Math.min(e.clientX - rect.left, 500)
    );
    setLeftWidth(newWidth);
  }, []);

  useEffect(() => {
    if (isDraggingLeft) {
      const handleMove = (e: MouseEvent) => handleLeftResize(e);
      const handleUp = () => setIsDraggingLeft(false);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
      window.addEventListener("mousemove", handleMove);
      window.addEventListener("mouseup", handleUp);
      return () => {
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        window.removeEventListener("mousemove", handleMove);
        window.removeEventListener("mouseup", handleUp);
      };
    }
  }, [isDraggingLeft, handleLeftResize]);

  // ─── Timeline resize ─────────────────────────────────
  const handleTimelineResize = useCallback((e: MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const newHeight = Math.max(
      MIN_TIMELINE_HEIGHT,
      Math.min(rect.bottom - e.clientY, 500)
    );
    setTimelineHeight(newHeight);
  }, []);

  useEffect(() => {
    if (isDraggingTimeline) {
      const handleMove = (e: MouseEvent) => handleTimelineResize(e);
      const handleUp = () => setIsDraggingTimeline(false);
      document.body.style.cursor = "row-resize";
      document.body.style.userSelect = "none";
      window.addEventListener("mousemove", handleMove);
      window.addEventListener("mouseup", handleUp);
      return () => {
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        window.removeEventListener("mousemove", handleMove);
        window.removeEventListener("mouseup", handleUp);
      };
    }
  }, [isDraggingTimeline, handleTimelineResize]);

  return (
    <div
      className="flex flex-col h-screen"
      style={{ background: "var(--bg-primary)" }}
    >
      <EditorHeader />

      <div ref={containerRef} className="flex-1 flex flex-col min-h-0">
        {/* Top section (panels + preview) */}
        <div className="flex-1 flex min-h-0">
          {/* Left panel - Assets */}
          <div
            className="flex-shrink-0 overflow-hidden"
            style={{ width: `${leftWidth}px` }}
          >
            <AssetsPanel />
          </div>

          {/* Left resize handle */}
          <div
            className="flex-shrink-0 w-1 cursor-col-resize relative group"
            style={{ background: "var(--border-subtle)" }}
            onMouseDown={() => setIsDraggingLeft(true)}
          >
            <div
              className="absolute inset-y-0 -left-1 -right-1 group-hover:bg-[var(--accent)] transition-colors opacity-0 group-hover:opacity-30"
            />
          </div>

          {/* Center - Preview */}
          <div className="flex-1 min-w-0">
            <PreviewPanel />
          </div>

          {/* Right panel - Properties */}
          {propertiesPanelOpen && <PropertiesPanel />}
        </div>

        {/* Timeline resize handle */}
        <div
          className="flex-shrink-0 h-1 cursor-row-resize relative group"
          style={{ background: "var(--border-subtle)" }}
          onMouseDown={() => setIsDraggingTimeline(true)}
        >
          <div
            className="absolute inset-x-0 -top-1 -bottom-1 group-hover:bg-[var(--accent)] transition-colors opacity-0 group-hover:opacity-30"
          />
        </div>

        {/* Timeline panel */}
        <div
          className="flex-shrink-0"
          style={{ height: `${timelineHeight}px` }}
        >
          <TimelinePanel />
        </div>
      </div>

      {/* Status bar */}
      <StatusBar />

      {/* Keyboard shortcuts overlay */}
      <KeyboardShortcuts />
    </div>
  );
}

function StatusBar() {
  const { tracks, zoom, currentTime, canvasSize, snapping } =
    useEditorStore();

  const totalClips = tracks.reduce(
    (sum, t) => sum + t.clips.length,
    0
  );

  return (
    <div
      className="flex items-center justify-between px-3 h-6 text-[10px] flex-shrink-0"
      style={{
        background: "var(--bg-tertiary)",
        borderTop: "1px solid var(--border-subtle)",
        color: "var(--text-muted)",
      }}
    >
      <div className="flex items-center gap-3">
        <span>
          {tracks.length} tracks · {totalClips} clips
        </span>
        <span>
          {canvasSize.width}×{canvasSize.height}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <span>Snap: {snapping ? "On" : "Off"}</span>
        <span>Zoom: {(zoom * 100).toFixed(0)}%</span>
        <span className="font-mono">{currentTime.toFixed(2)}s</span>
      </div>
    </div>
  );
}
