"use client";

import React, { useState, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import SplashScreen from "@/components/splash-screen";
import ProjectLauncher, {
  type ProjectMeta,
  type ProjectPreset,
  loadProjects,
  saveProjects,
} from "@/components/project-launcher";
import { useEditorStore } from "@/stores/editor-store";
import { v4 as uuidv4 } from "uuid";

const EditorLayout = dynamic(
  () => import("@/components/editor/editor-layout"),
  { ssr: false }
);

type AppScreen = "splash" | "launcher" | "editor";

export default function Home() {
  const [screen, setScreen] = useState<AppScreen>("splash");
  const [activeProject, setActiveProject] = useState<ProjectMeta | null>(null);
  const { setProjectName, setCanvasSize, loadProject } = useEditorStore();

  // ─── Handle window close on non-editor screens ──
  // EditorLayout registers its own onConfirmClose (with dirty-check).
  // For splash / launcher there's nothing to save, so just force-close.
  useEffect(() => {
    if (screen === "editor") return; // EditorLayout handles it
    const api = window.electronAPI;
    if (!api?.onConfirmClose) return;
    return api.onConfirmClose(() => {
      api.forceClose();
    });
  }, [screen]);

  const handleSplashFinished = useCallback(() => {
    setScreen("launcher");
  }, []);

  const handleOpenProject = useCallback(
    async (project: ProjectMeta) => {
      // If the project has a filePath stored, load from disk
      if (project.filePath) {
        const ok = await loadProject(project.filePath);
        if (ok) {
          setActiveProject(project);
          const projects = loadProjects();
          const updated = projects.map((p) =>
            p.id === project.id ? { ...p, updatedAt: Date.now() } : p
          );
          saveProjects(updated);
          window.electronAPI?.enterEditor();
          setScreen("editor");
          return;
        }
        // If file load failed (e.g. deleted), fall through to in-memory open
      }
      setActiveProject(project);
      setProjectName(project.name);
      // Parse resolution
      const [w, h] = project.resolution.split("x").map(Number);
      if (w && h) {
        setCanvasSize({ name: `${w}×${h}`, width: w, height: h });
      }
      // Update last-opened time
      const projects = loadProjects();
      const updated = projects.map((p) =>
        p.id === project.id ? { ...p, updatedAt: Date.now() } : p
      );
      saveProjects(updated);
      // Expand window to editor size
      window.electronAPI?.enterEditor();
      setScreen("editor");
    },
    [setProjectName, setCanvasSize, loadProject]
  );

  const handleOpenFromDisk = useCallback(async () => {
    const ok = await loadProject();
    if (ok) {
      window.electronAPI?.enterEditor();
      setScreen("editor");
    }
  }, [loadProject]);

  const handleCreateProject = useCallback(
    (name: string, resolution: string, preset?: ProjectPreset) => {
      const newProject: ProjectMeta = {
        id: uuidv4(),
        name,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        resolution: resolution.replace("x", "×"),
        trackCount: 0,
        clipCount: 0,
      };
      const projects = loadProjects();
      projects.push(newProject);
      saveProjects(projects);

      setActiveProject(newProject);
      setProjectName(name);
      const [w, h] = resolution.split("x").map(Number);
      if (w && h) {
        setCanvasSize({ name: `${w}×${h}`, width: w, height: h });
      }

      // Build tracks from preset or fall back to defaults
      const presetTracks = preset?.tracks ?? [
        { name: "Video 1", type: "video" as const, height: 64 },
        { name: "Audio 1", type: "audio" as const, height: 48 },
      ];

      const builtTracks = presetTracks.map((t) => {
        const trackId = uuidv4();
        return {
          id: trackId,
          name: t.name,
          type: t.type as "video" | "audio",
          clips: [] as import("@/types/editor").TimelineClip[],
          muted: false,
          solo: false,
          locked: false,
          height: t.height ?? (t.type === "video" ? 64 : 48),
          visible: true,
          volume: 1,
        };
      });

      // Create starter clips from preset
      if (preset?.clips) {
        for (const pc of preset.clips) {
          const track = builtTracks[pc.trackIndex];
          if (!track) continue;
          track.clips.push({
            id: uuidv4(),
            mediaId: "",
            type: pc.type,
            name: pc.name,
            trackId: track.id,
            startTime: 0,
            duration: pc.duration,
            trimStart: 0,
            trimEnd: 0,
            src: "",
            volume: 1,
            opacity: 1,
            text: pc.text,
            fontSize: pc.fontSize,
            fontFamily: pc.fontFamily,
            color: pc.color,
            backgroundColor: pc.backgroundColor,
            fontWeight: pc.fontWeight,
          });
        }
      }

      // Reset to preset tracks for the new project
      useEditorStore.setState({
        tracks: builtTracks,
        mediaFiles: [],
        projectFilePath: null,
        dirty: false,
        past: [],
        future: [],
      });
      // Expand window to editor size
      window.electronAPI?.enterEditor();
      setScreen("editor");
    },
    [setProjectName, setCanvasSize]
  );

  return (
    <>
      {screen === "splash" && <SplashScreen onFinished={handleSplashFinished} />}
      {screen === "launcher" && (
        <ProjectLauncher
          onOpenProject={handleOpenProject}
          onCreateProject={handleCreateProject}
          onOpenFromDisk={handleOpenFromDisk}
        />
      )}
      {screen === "editor" && <EditorLayout />}
    </>
  );
}
