"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useEditorStore } from "@/stores/editor-store";
import { useShortcutStore, formatShortcut } from "@/stores/shortcut-store";
import { useSettings } from "@/hooks/use-settings";
import { getTranslations } from "@/lib/i18n";
import {
  addCustomTemplate,
  pickTemplateGradient,
  type CustomTemplate,
  type PresetTrack,
} from "@/components/project-launcher";

// ─── Types ───────────────────────────────────────────────
interface MenuItem {
  label: string;
  shortcut?: string;
  action?: () => void;
  disabled?: boolean;
  separator?: boolean;
  checked?: boolean;
}

interface MenuDefinition {
  label: string;
  items: MenuItem[];
}

// ─── Menu Bar ────────────────────────────────────────────
export default function MenuBar() {
  const [settings] = useSettings();
  const t = getTranslations(settings.language);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [hoveredMenu, setHoveredMenu] = useState<string | null>(null);
  const [hoveredItem, setHoveredItem] = useState<number | null>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const { shortcuts } = useShortcutStore();

  // ── Store selectors ────────────────────────────────────
  const {
    undo,
    redo,
    past,
    future,
    togglePlayback,
    isPlaying,
    setCurrentTime,
    currentTime,
    duration,
    zoom,
    setZoom,
    snapping,
    toggleSnapping,
    selectedClipId,
    tracks,
    removeClip,
    splitClip,
    duplicateClip,
    setSelectedClipId,
    saveProject,
    loadProject,
    addTrack,
    canvasSize,
    propertiesPanelOpen,
    setPropertiesPanelOpen,
    activeTab,
    setActiveTab,
  } = useEditorStore();

  // ── Helpers ────────────────────────────────────────────
  const handleSave = useCallback(async (forceDialog = false) => {
    await saveProject(forceDialog);
  }, [saveProject]);

  const handleSplit = useCallback(() => {
    if (!selectedClipId) return;
    const track = tracks.find((t) => t.clips.find((c) => c.id === selectedClipId));
    if (track) {
      const clip = track.clips.find((c) => c.id === selectedClipId);
      if (clip && currentTime > clip.startTime && currentTime < clip.startTime + clip.duration) {
        splitClip(track.id, selectedClipId, currentTime);
      }
    }
  }, [tracks, selectedClipId, currentTime, splitClip]);

  const handleDuplicate = useCallback(() => {
    if (!selectedClipId) return;
    const track = tracks.find((t) => t.clips.find((c) => c.id === selectedClipId));
    if (track) {
      duplicateClip(track.id, selectedClipId);
    }
  }, [tracks, selectedClipId, duplicateClip]);

  const handleDelete = useCallback(() => {
    if (!selectedClipId) return;
    const track = tracks.find((t) => t.clips.find((c) => c.id === selectedClipId));
    if (track) {
      removeClip(track.id, selectedClipId);
    }
  }, [tracks, selectedClipId, removeClip]);

  const handleSelectAll = useCallback(() => {
    // Select the first clip if nothing selected
    for (const track of tracks) {
      if (track.clips.length > 0) {
        setSelectedClipId(track.clips[0].id);
        break;
      }
    }
  }, [tracks, setSelectedClipId]);

  const handleSaveAsTemplate = useCallback(() => {
    const name = window.prompt(t.menu.templateNamePrompt);
    if (!name || !name.trim()) return;
    const desc = window.prompt(t.menu.templateDescPrompt) ?? "";
    const presetTracks: PresetTrack[] = tracks.map((tr) => ({
      name: tr.name,
      type: tr.type,
      height: tr.height,
    }));
    const tpl: CustomTemplate = {
      id: crypto.randomUUID(),
      name: name.trim(),
      description: desc.trim(),
      resolution: `${canvasSize.width}x${canvasSize.height}`,
      tracks: presetTracks,
      createdAt: Date.now(),
      gradient: pickTemplateGradient(),
    };
    addCustomTemplate(tpl);
    alert(t.menu.templateSaved);
  }, [tracks, canvasSize, t]);

  // ── Gather all clips sorted by startTime for navigation ─
  const allClipsSorted = tracks
    .flatMap((t) => t.clips.map((c) => ({ ...c, trackId: t.id })))
    .sort((a, b) => a.startTime - b.startTime);

  const navigateToNextClip = useCallback(() => {
    const next = allClipsSorted.find((c) => c.startTime > currentTime + 0.01);
    if (next) {
      setCurrentTime(next.startTime);
      setSelectedClipId(next.id);
    }
  }, [allClipsSorted, currentTime, setCurrentTime, setSelectedClipId]);

  const navigateToPrevClip = useCallback(() => {
    const prev = [...allClipsSorted].reverse().find((c) => c.startTime < currentTime - 0.01);
    if (prev) {
      setCurrentTime(prev.startTime);
      setSelectedClipId(prev.id);
    }
  }, [allClipsSorted, currentTime, setCurrentTime, setSelectedClipId]);

  const navigateToNextClipEnd = useCallback(() => {
    const next = allClipsSorted.find(
      (c) => c.startTime + c.duration > currentTime + 0.01
    );
    if (next) {
      setCurrentTime(next.startTime + next.duration);
    }
  }, [allClipsSorted, currentTime, setCurrentTime]);

  // ── Determine if split is possible ────────────────────
  const canSplit = (() => {
    if (!selectedClipId) return false;
    const track = tracks.find((t) => t.clips.find((c) => c.id === selectedClipId));
    if (!track) return false;
    const clip = track.clips.find((c) => c.id === selectedClipId);
    if (!clip) return false;
    return currentTime > clip.startTime && currentTime < clip.startTime + clip.duration;
  })();

  // ── Menu definitions ───────────────────────────────────
  const menus: MenuDefinition[] = [
    {
      label: t.menu.file,
      items: [
        { label: t.menu.newProject, shortcut: formatShortcut(shortcuts.new_project), action: () => {
          if (confirm(t.launcher.unsavedChangesConfirm)) {
            window.location.reload();
          }
        }},
        { label: t.menu.openFile, shortcut: formatShortcut(shortcuts.open_project), action: () => loadProject() },
        { separator: true, label: "---" },
        { label: t.menu.save, shortcut: formatShortcut(shortcuts.save), action: () => handleSave(false) },
        { label: t.menu.saveAs, shortcut: formatShortcut(shortcuts.save_as), action: () => handleSave(true) },
        { separator: true, label: "---" },
        { label: t.menu.saveAsTemplate, action: handleSaveAsTemplate },
        { separator: true, label: "---" },
        { label: t.menu.export, shortcut: formatShortcut(shortcuts.export), action: () => {
          window.dispatchEvent(new CustomEvent("cuttamaran:open-export"));
        }},
        { separator: true, label: "---" },
        { label: t.menu.settings, action: () => {
          window.dispatchEvent(new CustomEvent("cuttamaran:open-settings"));
        }},
        { separator: true, label: "---" },
        { label: t.menu.quit, shortcut: "Alt+F4", action: () => {
          window.electronAPI?.close();
        }},
      ],
    },
    {
      label: t.menu.edit,
      items: [
        { label: t.menu.undo, shortcut: formatShortcut(shortcuts.undo), action: undo, disabled: past.length === 0 },
        { label: t.menu.redo, shortcut: formatShortcut(shortcuts.redo), action: redo, disabled: future.length === 0 },
        { separator: true, label: "---" },
        { label: t.menu.splitClip, shortcut: formatShortcut(shortcuts.split_clip), action: handleSplit, disabled: !canSplit },
        { label: t.menu.duplicateClip, shortcut: formatShortcut(shortcuts.duplicate_clip), action: handleDuplicate, disabled: !selectedClipId },
        { label: t.menu.deleteClip, shortcut: formatShortcut(shortcuts.delete_clip), action: handleDelete, disabled: !selectedClipId },
        { separator: true, label: "---" },
        { label: t.menu.selectAll, shortcut: formatShortcut(shortcuts.select_all), action: handleSelectAll },
        { label: t.menu.deselectAll, shortcut: formatShortcut(shortcuts.deselect), action: () => setSelectedClipId(null) },
        { separator: true, label: "---" },
        { label: t.menu.addVideoTrack, action: () => addTrack("video") },
        { label: t.menu.addAudioTrack, action: () => addTrack("audio") },
      ],
    },
    {
      label: t.menu.playback,
      items: [
        { label: isPlaying ? t.menu.pause : t.menu.play, shortcut: formatShortcut(shortcuts.play_pause), action: togglePlayback },
        { separator: true, label: "---" },
        { label: t.menu.back1s, shortcut: formatShortcut(shortcuts.back_1s), action: () => setCurrentTime(Math.max(0, currentTime - 1)) },
        { label: t.menu.forward1s, shortcut: formatShortcut(shortcuts.forward_1s), action: () => setCurrentTime(Math.min(duration, currentTime + 1)) },
        { label: t.menu.back5s, shortcut: formatShortcut(shortcuts.back_5s), action: () => setCurrentTime(Math.max(0, currentTime - 5)) },
        { label: t.menu.forward5s, shortcut: formatShortcut(shortcuts.forward_5s), action: () => setCurrentTime(Math.min(duration, currentTime + 5)) },
        { separator: true, label: "---" },
        { label: t.menu.goToStart, shortcut: formatShortcut(shortcuts.go_to_start), action: () => setCurrentTime(0) },
        { label: t.menu.goToEnd, shortcut: formatShortcut(shortcuts.go_to_end), action: () => setCurrentTime(duration) },
        { label: t.menu.nextClip, shortcut: formatShortcut(shortcuts.next_clip), action: navigateToNextClip, disabled: allClipsSorted.length === 0 },
        { label: t.menu.prevClip, shortcut: formatShortcut(shortcuts.prev_clip), action: navigateToPrevClip, disabled: allClipsSorted.length === 0 },
        { label: t.menu.nextClipEnd, shortcut: formatShortcut(shortcuts.next_clip_end), action: navigateToNextClipEnd, disabled: allClipsSorted.length === 0 },
      ],
    },
    {
      label: t.menu.view,
      items: [
        { label: t.menu.zoomIn, shortcut: formatShortcut(shortcuts.zoom_in), action: () => setZoom(Math.min(zoom + 0.2, 5)) },
        { label: t.menu.zoomOut, shortcut: formatShortcut(shortcuts.zoom_out), action: () => setZoom(Math.max(zoom - 0.2, 0.2)) },
        { label: t.menu.resetZoom, shortcut: formatShortcut(shortcuts.reset_zoom), action: () => setZoom(1) },
        { separator: true, label: "---" },
        { label: t.menu.snapping, action: toggleSnapping, checked: snapping },
        { label: t.menu.propertiesPanel, action: () => setPropertiesPanelOpen(!propertiesPanelOpen), checked: propertiesPanelOpen },
        { separator: true, label: "---" },
        { label: t.menu.tabAssets, action: () => setActiveTab("assets"), checked: activeTab === "assets" },
        { label: t.menu.tabText, action: () => setActiveTab("text"), checked: activeTab === "text" },
        { label: t.menu.tabAudio, action: () => setActiveTab("audio"), checked: activeTab === "audio" },
        { label: t.menu.tabTransitions, action: () => setActiveTab("transitions"), checked: activeTab === "transitions" },
        { label: t.menu.tabEffects, action: () => setActiveTab("effects"), checked: activeTab === "effects" },
      ],
    },
    {
      label: t.menu.help,
      items: [
        { label: t.menu.keyboardShortcuts, shortcut: formatShortcut(shortcuts.toggle_shortcuts), action: () => {
          window.dispatchEvent(new CustomEvent("cuttamaran:toggle-shortcuts"));
        }},
        { separator: true, label: "---" },
        { label: t.menu.about, action: () => {
          window.dispatchEvent(new CustomEvent("cuttamaran:open-about"));
        }},
      ],
    },
  ];

  // ── Close on click outside ─────────────────────────────
  useEffect(() => {
    if (!openMenu) return;
    const handler = (e: MouseEvent) => {
      if (barRef.current && !barRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [openMenu]);

  // ── Close on Escape ────────────────────────────────────
  useEffect(() => {
    if (!openMenu) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenMenu(null);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [openMenu]);

  return (
    <div
      ref={barRef}
      style={{
        display: "flex",
        alignItems: "center",
        height: "100%",
        gap: 0,
        userSelect: "none",
      }}
    >
      {menus.map((menu) => (
        <div key={menu.label} style={{ position: "relative" }}>
          {/* Menu trigger */}
          <button
            onClick={() => setOpenMenu(openMenu === menu.label ? null : menu.label)}
            onMouseEnter={() => {
              setHoveredMenu(menu.label);
              // If another menu is open, switch to this one (hover-through)
              if (openMenu && openMenu !== menu.label) {
                setOpenMenu(menu.label);
              }
            }}
            onMouseLeave={() => setHoveredMenu(null)}
            style={{
              padding: "4px 10px",
              fontSize: 12,
              fontWeight: 400,
              color:
                openMenu === menu.label
                  ? "var(--text-primary)"
                  : hoveredMenu === menu.label
                  ? "var(--text-primary)"
                  : "var(--text-secondary)",
              background:
                openMenu === menu.label
                  ? "var(--hover-strong)"
                  : hoveredMenu === menu.label
                  ? "var(--hover-subtle)"
                  : "transparent",
              border: "none",
              borderRadius: 4,
              cursor: "pointer",
              transition: "all 0.1s",
              letterSpacing: "0.01em",
            }}
          >
            {menu.label}
          </button>

          {/* Dropdown */}
          {openMenu === menu.label && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 4px)",
                left: 0,
                minWidth: 220,
                borderRadius: 8,
                padding: 4,
                background: "var(--bg-elevated)",
                border: "1px solid var(--border-subtle)",
                boxShadow: "var(--shadow-dropdown)",
                zIndex: 1000,
              }}
            >
              {menu.items.map((item, i) =>
                item.separator ? (
                  <div
                    key={`sep-${i}`}
                    style={{
                      height: 1,
                      margin: "4px 8px",
                      background: "var(--border-subtle)",
                    }}
                  />
                ) : (
                  <button
                    key={item.label}
                    onClick={() => {
                      if (!item.disabled && item.action) {
                        item.action();
                        setOpenMenu(null);
                      }
                    }}
                    onMouseEnter={() => setHoveredItem(i)}
                    onMouseLeave={() => setHoveredItem(null)}
                    disabled={item.disabled}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      width: "100%",
                      padding: "6px 10px",
                      borderRadius: 5,
                      border: "none",
                      cursor: item.disabled ? "default" : "pointer",
                      fontSize: 12,
                      color: item.disabled ? "var(--text-muted)" : "var(--text-secondary)",
                      background: hoveredItem === i && !item.disabled ? "var(--hover-overlay)" : "transparent",
                      opacity: item.disabled ? 0.5 : 1,
                      transition: "background 0.1s",
                      gap: 20,
                    }}
                  >
                    <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {item.checked !== undefined && (
                        <span
                          style={{
                            width: 14,
                            height: 14,
                            borderRadius: 3,
                            border: item.checked ? "none" : "1px solid var(--border-default)",
                            background: item.checked ? "var(--accent)" : "transparent",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 10,
                            color: "#fff",
                            flexShrink: 0,
                          }}
                        >
                          {item.checked ? "✓" : ""}
                        </span>
                      )}
                      {item.label}
                    </span>
                    {item.shortcut && (
                      <span
                        style={{
                          fontSize: 11,
                          color: "var(--text-muted)",
                          fontFamily: "inherit",
                          opacity: 0.7,
                        }}
                      >
                        {item.shortcut}
                      </span>
                    )}
                  </button>
                )
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
