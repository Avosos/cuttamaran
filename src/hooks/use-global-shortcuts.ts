"use client";

import { useEffect } from "react";
import { useEditorStore } from "@/stores/editor-store";
import { useShortcutStore, matchesShortcut } from "@/stores/shortcut-store";

/**
 * Single global keyboard handler that routes all shortcut actions
 * through the customizable shortcut store. Install once at the
 * top level (EditorLayout).
 */
export function useGlobalShortcuts() {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't intercept when typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      const { shortcuts } = useShortcutStore.getState();
      const state = useEditorStore.getState();

      // ── File ───────────────────────────────────────────
      if (matchesShortcut(e, shortcuts.new_project)) {
        e.preventDefault();
        if (confirm("Create a new project? Unsaved changes will be lost.")) {
          window.location.reload();
        }
        return;
      }
      if (matchesShortcut(e, shortcuts.open_project)) {
        e.preventDefault();
        state.loadProject();
        return;
      }
      if (matchesShortcut(e, shortcuts.save_as)) {
        // Check save_as BEFORE save (save_as is Ctrl+Shift+S, save is Ctrl+S)
        e.preventDefault();
        state.saveProject(true);
        return;
      }
      if (matchesShortcut(e, shortcuts.save)) {
        e.preventDefault();
        state.saveProject(false);
        return;
      }
      if (matchesShortcut(e, shortcuts.export)) {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent("cuttamaran:open-export"));
        return;
      }

      // ── Editing ────────────────────────────────────────
      if (matchesShortcut(e, shortcuts.redo)) {
        // Check redo BEFORE undo (redo is Ctrl+Shift+Z, undo is Ctrl+Z)
        e.preventDefault();
        state.redo();
        return;
      }
      if (matchesShortcut(e, shortcuts.undo)) {
        e.preventDefault();
        state.undo();
        return;
      }
      if (matchesShortcut(e, shortcuts.split_clip)) {
        e.preventDefault();
        const { tracks, selectedClipId, currentTime, splitClip } = state;
        if (selectedClipId) {
          const track = tracks.find((t) => t.clips.find((c) => c.id === selectedClipId));
          if (track) {
            const clip = track.clips.find((c) => c.id === selectedClipId);
            if (clip && currentTime > clip.startTime && currentTime < clip.startTime + clip.duration) {
              splitClip(track.id, selectedClipId, currentTime);
            }
          }
        }
        return;
      }
      if (matchesShortcut(e, shortcuts.duplicate_clip)) {
        e.preventDefault();
        const { tracks, selectedClipId, duplicateClip } = state;
        if (selectedClipId) {
          const track = tracks.find((t) => t.clips.find((c) => c.id === selectedClipId));
          if (track) {
            duplicateClip(track.id, selectedClipId);
          }
        }
        return;
      }
      if (matchesShortcut(e, shortcuts.delete_clip)) {
        e.preventDefault();
        const { tracks, selectedClipId, removeClip } = state;
        if (selectedClipId) {
          const track = tracks.find((t) => t.clips.find((c) => c.id === selectedClipId));
          if (track) {
            removeClip(track.id, selectedClipId);
          }
        }
        return;
      }
      if (matchesShortcut(e, shortcuts.select_all)) {
        e.preventDefault();
        for (const track of state.tracks) {
          if (track.clips.length > 0) {
            state.setSelectedClipId(track.clips[0].id);
            break;
          }
        }
        return;
      }
      if (matchesShortcut(e, shortcuts.deselect)) {
        // Only consume Escape if something is selected
        if (state.selectedClipId) {
          state.setSelectedClipId(null);
        }
        return;
      }

      // ── Playback ───────────────────────────────────────
      // Check multi-modifier combos before single-key combos
      if (matchesShortcut(e, shortcuts.back_5s)) {
        e.preventDefault();
        state.setCurrentTime(Math.max(0, state.currentTime - 5));
        return;
      }
      if (matchesShortcut(e, shortcuts.forward_5s)) {
        e.preventDefault();
        state.setCurrentTime(Math.min(state.duration, state.currentTime + 5));
        return;
      }
      if (matchesShortcut(e, shortcuts.play_pause)) {
        e.preventDefault();
        state.togglePlayback();
        return;
      }
      if (matchesShortcut(e, shortcuts.back_1s)) {
        e.preventDefault();
        state.setCurrentTime(Math.max(0, state.currentTime - 1));
        return;
      }
      if (matchesShortcut(e, shortcuts.forward_1s)) {
        e.preventDefault();
        state.setCurrentTime(Math.min(state.duration, state.currentTime + 1));
        return;
      }
      if (matchesShortcut(e, shortcuts.go_to_start)) {
        e.preventDefault();
        state.setCurrentTime(0);
        return;
      }
      if (matchesShortcut(e, shortcuts.go_to_end)) {
        e.preventDefault();
        state.setCurrentTime(state.duration);
        return;
      }

      // ── Navigation ─────────────────────────────────────
      if (matchesShortcut(e, shortcuts.next_clip_end)) {
        e.preventDefault();
        const allClips = state.tracks
          .flatMap((t) => t.clips)
          .sort((a, b) => a.startTime - b.startTime);
        const next = allClips.find((c) => c.startTime + c.duration > state.currentTime + 0.01);
        if (next) state.setCurrentTime(next.startTime + next.duration);
        return;
      }
      if (matchesShortcut(e, shortcuts.next_clip)) {
        e.preventDefault();
        const allClips = state.tracks
          .flatMap((t) => t.clips)
          .sort((a, b) => a.startTime - b.startTime);
        const next = allClips.find((c) => c.startTime > state.currentTime + 0.01);
        if (next) {
          state.setCurrentTime(next.startTime);
          state.setSelectedClipId(next.id);
        }
        return;
      }
      if (matchesShortcut(e, shortcuts.prev_clip)) {
        e.preventDefault();
        const allClips = state.tracks
          .flatMap((t) => t.clips)
          .sort((a, b) => a.startTime - b.startTime);
        const prev = [...allClips].reverse().find((c) => c.startTime < state.currentTime - 0.01);
        if (prev) {
          state.setCurrentTime(prev.startTime);
          state.setSelectedClipId(prev.id);
        }
        return;
      }

      // ── View ───────────────────────────────────────────
      if (matchesShortcut(e, shortcuts.zoom_in)) {
        e.preventDefault();
        state.setZoom(Math.min(state.zoom + 0.2, 5));
        return;
      }
      if (matchesShortcut(e, shortcuts.zoom_out)) {
        e.preventDefault();
        state.setZoom(Math.max(state.zoom - 0.2, 0.2));
        return;
      }
      if (matchesShortcut(e, shortcuts.reset_zoom)) {
        e.preventDefault();
        state.setZoom(1);
        return;
      }

      // ── General ────────────────────────────────────────
      if (matchesShortcut(e, shortcuts.toggle_shortcuts)) {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent("cuttamaran:toggle-shortcuts"));
        return;
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);
}
