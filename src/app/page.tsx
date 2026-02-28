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
  const { setProjectName, setCanvasSize } = useEditorStore();

  const handleSplashFinished = useCallback(() => {
    setScreen("launcher");
  }, []);

  const handleOpenProject = useCallback(
    (project: ProjectMeta) => {
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
    [setProjectName, setCanvasSize]
  );

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
        />
      )}
      {screen === "editor" && <EditorLayout />}
    </>
  );
}
