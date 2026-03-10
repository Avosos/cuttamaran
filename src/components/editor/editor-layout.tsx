"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import EditorHeader from "@/components/editor/editor-header";
import AssetsPanel from "@/components/editor/panels/assets-panel";
import PreviewPanel from "@/components/editor/panels/preview-panel";
import TimelinePanel from "@/components/editor/panels/timeline-panel";
import PropertiesPanel from "@/components/editor/panels/properties-panel";
import KeyboardShortcuts from "@/components/editor/keyboard-shortcuts";
import UnsavedDialog from "@/components/editor/unsaved-dialog";
import { useEditorStore } from "@/stores/editor-store";
import { useGlobalShortcuts } from "@/hooks/use-global-shortcuts";
import { useSettings } from \"@/hooks/use-settings\";\nimport { getTranslations } from \"@/lib/i18n\";

const MIN_PANEL_WIDTH = 200;
const MIN_TIMELINE_HEIGHT = 150;
const DEFAULT_LEFT_WIDTH = 280;
const DEFAULT_TIMELINE_HEIGHT = 260;

export default function EditorLayout() {
  useGlobalShortcuts();
  const { propertiesPanelOpen } = useEditorStore();
  const [settings] = useSettings();
  const [leftWidth, setLeftWidth] = useState(DEFAULT_LEFT_WIDTH);
  const [timelineHeight, setTimelineHeight] = useState(
    DEFAULT_TIMELINE_HEIGHT
  );
  const [isDraggingLeft, setIsDraggingLeft] = useState(false);
  const [isDraggingTimeline, setIsDraggingTimeline] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // ─── Listen for close-confirmation from Electron main ──
  useEffect(() => {
    const api = window.electronAPI;
    if (!api?.onConfirmClose) return;
    const cleanup = api.onConfirmClose(() => {
      const { dirty } = useEditorStore.getState();
      if (dirty) {
        setShowUnsavedDialog(true);
      } else {
        api.forceClose();
      }
    });
    return cleanup;
  }, []);

  const handleSaveAndClose = useCallback(async () => {
    setShowUnsavedDialog(false);
    const saved = await useEditorStore.getState().saveProject();
    if (saved) {
      window.electronAPI?.forceClose();
    }
  }, []);

  const handleDiscardAndClose = useCallback(() => {
    setShowUnsavedDialog(false);
    window.electronAPI?.forceClose();
  }, []);

  const handleCancelClose = useCallback(() => {
    setShowUnsavedDialog(false);
  }, []);

  // ─── Auto-save (every 30 s if dirty & has a file path & setting enabled) ──
  useEffect(() => {
    if (!settings.autoSave) return;
    const timer = setInterval(() => {
      const { dirty, projectFilePath, saveProject } = useEditorStore.getState();
      if (dirty && projectFilePath) {
        saveProject();
      }
    }, 30_000);
    return () => clearInterval(timer);
  }, [settings.autoSave]);

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
      style={{ display: "flex", flexDirection: "column", height: "100vh", background: "var(--bg-primary)" }}
    >
      {/* Top title bar */}
      <EditorHeader />

      <div ref={containerRef} style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, gap: 12, padding: "0 12px 12px 12px" }}>
        {/* Top section (panels + preview) */}
        <div style={{ flex: 1, display: "flex", minHeight: 0, gap: 16 }}>
          {/* Left panel - Assets */}
          <div
            style={{
              flexShrink: 0,
              overflow: "hidden",
              borderRadius: 16,
              width: leftWidth,
              background: "var(--bg-secondary)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <AssetsPanel />
          </div>

          {/* Left resize handle */}
          <div
            style={{
              flexShrink: 0,
              width: 6,
              cursor: "col-resize",
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            onMouseDown={() => setIsDraggingLeft(true)}
            onMouseEnter={(e) => {
              const indicator = e.currentTarget.querySelector("[data-indicator]") as HTMLElement;
              if (indicator) indicator.style.background = "var(--accent)";
            }}
            onMouseLeave={(e) => {
              const indicator = e.currentTarget.querySelector("[data-indicator]") as HTMLElement;
              if (indicator) indicator.style.background = "var(--border-default)";
            }}
          >
            <div
              data-indicator=""
              style={{ width: 2, height: 32, borderRadius: 9999, background: "var(--border-default)", transition: "background 0.15s" }}
            />
          </div>

          {/* Center - Preview */}
          <div
            style={{
              flex: 1,
              minWidth: 0,
              borderRadius: 16,
              overflow: "hidden",
              background: "var(--bg-primary)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <PreviewPanel />
          </div>

          {/* Right panel - Properties */}
          {propertiesPanelOpen && (
            <div
              style={{
                borderRadius: 16,
                overflow: "hidden",
                border: "1px solid var(--border-subtle)",
              }}
            >
              <PropertiesPanel />
            </div>
          )}
        </div>

        {/* Timeline resize handle */}
        <div
          style={{
            flexShrink: 0,
            height: 6,
            cursor: "row-resize",
            position: "relative",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
          onMouseDown={() => setIsDraggingTimeline(true)}
          onMouseEnter={(e) => {
            const indicator = e.currentTarget.querySelector("[data-indicator]") as HTMLElement;
            if (indicator) indicator.style.background = "var(--accent)";
          }}
          onMouseLeave={(e) => {
            const indicator = e.currentTarget.querySelector("[data-indicator]") as HTMLElement;
            if (indicator) indicator.style.background = "var(--border-default)";
          }}
        >
          <div
            data-indicator=""
            style={{ height: 2, width: 48, borderRadius: 9999, background: "var(--border-default)", transition: "background 0.15s" }}
          />
        </div>

        {/* Timeline panel */}
        <div
          style={{
            flexShrink: 0,
            borderRadius: 16,
            overflow: "hidden",
            height: timelineHeight,
            background: "var(--bg-secondary)",
            border: "1px solid var(--border-subtle)",
          }}
        >
          <TimelinePanel />
        </div>
      </div>

      {/* Status bar */}
      <StatusBar />

      {/* Keyboard shortcuts overlay */}
      <KeyboardShortcuts />

      {/* Unsaved changes dialog */}
      {showUnsavedDialog && (
        <UnsavedDialog
          onSave={handleSaveAndClose}
          onDiscard={handleDiscardAndClose}
          onCancel={handleCancelClose}
        />
      )}
    </div>
  );
}

function StatusBar() {
  const { tracks, zoom, currentTime, canvasSize, snapping } =
    useEditorStore();
  const [settings] = useSettings();
  const t = getTranslations(settings.language);

  const totalClips = tracks.reduce(
    (sum, t) => sum + t.clips.length,
    0
  );

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 16px",
        height: 24,
        fontSize: 10,
        flexShrink: 0,
        borderRadius: 8,
        background: "var(--bg-tertiary)",
        border: "1px solid var(--border-subtle)",
        color: "var(--text-muted)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span>
          {t.common.tracksClips.replace("{tracks}", String(tracks.length)).replace("{clips}", String(totalClips))}
        </span>
        <span>
          {canvasSize.width}×{canvasSize.height}
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span>{snapping ? t.common.snapOn : t.common.snapOff}</span>
        <span>{t.common.zoom.replace("{value}", (zoom * 100).toFixed(0))}</span>
        <span style={{ fontFamily: "monospace" }}>{currentTime.toFixed(2)}s</span>
      </div>
    </div>
  );
}
