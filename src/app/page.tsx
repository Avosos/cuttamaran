"use client";

import React, { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import SplashScreen from "@/components/splash-screen";
import ProjectLauncher, {
  type ProjectMeta,
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
    (name: string, resolution: string) => {
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
      // Reset to default tracks for a new project
      useEditorStore.setState({
        tracks: [
          {
            id: uuidv4(),
            name: "Video 1",
            type: "video" as const,
            clips: [],
            muted: false,
            locked: false,
            height: 64,
            visible: true,
          },
          {
            id: uuidv4(),
            name: "Audio 1",
            type: "audio" as const,
            clips: [],
            muted: false,
            locked: false,
            height: 48,
            visible: true,
          },
        ],
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
