"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Scissors,
  Plus,
  FolderOpen,
  Clock,
  Trash2,
  Settings,
  X,
  Monitor,
  Moon,
  HardDrive,
  ChevronRight,
  Film,
  Minus,
  Square,
  Copy,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────
export interface ProjectMeta {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  resolution: string;
  trackCount: number;
  clipCount: number;
  thumbnail?: string; // base64 or color
}

interface ProjectLauncherProps {
  onOpenProject: (project: ProjectMeta) => void;
  onCreateProject: (name: string, resolution: string) => void;
}

// ─── LocalStorage helpers ────────────────────────────────
const STORAGE_KEY = "cuttamaran_projects";

function loadProjects(): ProjectMeta[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveProjects(projects: ProjectMeta[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

function deleteProject(id: string) {
  const projects = loadProjects().filter((p) => p.id !== id);
  saveProjects(projects);
  return projects;
}

// ─── Resolution presets ──────────────────────────────────
const RESOLUTIONS = [
  { label: "1920 × 1080", value: "1920x1080", desc: "Full HD Landscape" },
  { label: "1080 × 1920", value: "1080x1920", desc: "Full HD Portrait" },
  { label: "1080 × 1080", value: "1080x1080", desc: "Square" },
  { label: "3840 × 2160", value: "3840x2160", desc: "4K UHD" },
  { label: "1080 × 1350", value: "1080x1350", desc: "Social (4:5)" },
];

// ─── Gradient thumbnails ─────────────────────────────────
const GRADIENTS = [
  "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
  "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
  "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
  "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
  "linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)",
  "linear-gradient(135deg, #fccb90 0%, #d57eeb 100%)",
  "linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)",
];

function seededGradient(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  return GRADIENTS[Math.abs(hash) % GRADIENTS.length];
}

function formatDate(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined });
}

// ─── Settings storage ────────────────────────────────────
const SETTINGS_KEY = "cuttamaran_settings";

interface AppSettings {
  projectsPath: string;
  defaultResolution: string;
  autoSave: boolean;
  theme: "dark" | "light";
  previewQuality: "low" | "medium" | "high";
}

const DEFAULT_SETTINGS: AppSettings = {
  projectsPath: "",
  defaultResolution: "1920x1080",
  autoSave: true,
  theme: "dark",
  previewQuality: "high",
};

function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : { ...DEFAULT_SETTINGS };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

function saveSettingsData(settings: AppSettings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

// ─── First-time Setup ────────────────────────────────────
function FirstTimeSetup({ onComplete }: { onComplete: () => void }) {
  const [folderPath, setFolderPath] = useState("");

  const handleBrowse = async () => {
    const result = await window.electronAPI?.openFolderDialog({
      title: "Choose where to store your projects",
    });
    if (result && !result.canceled && result.filePaths[0]) {
      setFolderPath(result.filePaths[0]);
    }
  };

  const handleContinue = () => {
    if (folderPath) {
      const settings = loadSettings();
      settings.projectsPath = folderPath;
      saveSettingsData(settings);
    }
    onComplete();
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center" style={{ padding: 24, background: "rgba(6,6,10,0.92)", backdropFilter: "blur(12px)" }}>
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          borderRadius: 16,
          overflow: "hidden",
          background: "var(--bg-secondary)",
          border: "1px solid var(--border-subtle)",
          boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
        }}
      >
        {/* Header with icon */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 32, paddingBottom: 8, paddingLeft: 40, paddingRight: 40 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16, background: "linear-gradient(135deg, #7c5cfc, #e879f9)" }}>
            <Scissors size={24} className="text-white" />
          </div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>Welcome to Cuttamaran</h2>
          <p style={{ fontSize: 14, marginTop: 6, textAlign: "center", color: "var(--text-muted)" }}>
            Choose where your projects will be stored.
          </p>
        </div>

        {/* Folder picker */}
        <div style={{ paddingLeft: 40, paddingRight: 40, paddingTop: 24, paddingBottom: 24 }}>
          <label style={{ fontSize: 11, fontWeight: 500, marginBottom: 8, display: "block", color: "var(--text-muted)" }}>Projects Folder</label>
          <div style={{ display: "flex", gap: 8 }}>
            <div
              style={{
                flex: 1,
                padding: "10px 12px",
                borderRadius: 8,
                fontSize: 13,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap" as const,
                background: "var(--bg-tertiary)",
                border: "1px solid var(--border-default)",
                color: folderPath ? "var(--text-primary)" : "var(--text-muted)",
              }}
            >
              {folderPath || "No folder selected..."}
            </div>
            <button
              onClick={handleBrowse}
              style={{
                padding: "10px 16px",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 500,
                flexShrink: 0,
                background: "var(--bg-tertiary)",
                color: "var(--text-secondary)",
                border: "1px solid var(--border-default)",
                cursor: "pointer",
              }}
            >
              <FolderOpen size={15} />
            </button>
          </div>
          <p style={{ fontSize: 11, marginTop: 8, color: "var(--text-muted)" }}>
            You can change this later in Settings.
          </p>
        </div>

        {/* Footer */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, paddingLeft: 40, paddingRight: 40, paddingBottom: 24 }}>
          <button
            onClick={handleContinue}
            style={{
              fontSize: 13,
              fontWeight: 500,
              borderRadius: 8,
              padding: "10px 24px",
              whiteSpace: "nowrap" as const,
              cursor: "pointer",
              border: folderPath ? "none" : "1px solid var(--border-subtle)",
              background: folderPath ? "linear-gradient(135deg, #7c5cfc, #6344e0)" : "var(--bg-tertiary)",
              color: folderPath ? "white" : "var(--text-secondary)",
              boxShadow: folderPath ? "0 2px 12px rgba(124, 92, 252, 0.3)" : "none",
            }}
          >
            {folderPath ? "Get Started" : "Skip for Now"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Settings Panel ──────────────────────────────────────
function SettingsPanel({ onClose }: { onClose: () => void }) {
  const [settings, setSettings] = useState<AppSettings>(loadSettings);

  const updateSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    saveSettingsData(updated);
  };

  const handleBrowseFolder = async () => {
    const result = await window.electronAPI?.openFolderDialog({
      title: "Choose Projects Folder",
    });
    if (result && !result.canceled && result.filePaths[0]) {
      updateSetting("projectsPath", result.filePaths[0]);
    }
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(6,6,10,0.85)", backdropFilter: "blur(8px)" }}>
      <div
        className="w-[520px] rounded-2xl overflow-hidden animate-fade-in"
        style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)", boxShadow: "0 24px 80px rgba(0,0,0,0.6)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
          <h2 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>Settings</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5 transition-colors">
            <X size={16} style={{ color: "var(--text-muted)" }} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5 max-h-[420px] overflow-y-auto">
          {/* Storage */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>Storage</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between py-2.5 px-3 rounded-lg" style={{ background: "var(--bg-tertiary)" }}>
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <FolderOpen size={15} style={{ color: "var(--text-muted)" }} className="flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <span className="text-sm block" style={{ color: "var(--text-secondary)" }}>Projects Folder</span>
                    <span className="text-[11px] block truncate" style={{ color: "var(--text-muted)" }}>
                      {settings.projectsPath || "Not set — click Browse to choose"}
                    </span>
                  </div>
                </div>
                <button
                  onClick={handleBrowseFolder}
                  className="text-xs px-3 py-1.5 rounded-md flex-shrink-0 ml-3 transition-colors"
                  style={{ background: "var(--accent-muted)", color: "var(--accent-hover)" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(124,92,252,0.2)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "var(--accent-muted)"; }}
                >
                  Browse
                </button>
              </div>
            </div>
          </div>

          {/* General */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>General</h3>
            <div className="space-y-2">
              {/* Default Resolution */}
              <div className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-white/[0.03] transition-colors">
                <div className="flex items-center gap-3">
                  <Monitor size={15} style={{ color: "var(--text-muted)" }} />
                  <span className="text-sm" style={{ color: "var(--text-secondary)" }}>Default Resolution</span>
                </div>
                <select
                  value={settings.defaultResolution}
                  onChange={(e) => updateSetting("defaultResolution", e.target.value)}
                  className="text-sm rounded-md px-2 py-1 outline-none cursor-pointer"
                  style={{ background: "var(--bg-tertiary)", color: "var(--text-primary)", border: "1px solid var(--border-subtle)" }}
                >
                  {RESOLUTIONS.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>

              {/* Auto-Save */}
              <div className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-white/[0.03] transition-colors">
                <div className="flex items-center gap-3">
                  <HardDrive size={15} style={{ color: "var(--text-muted)" }} />
                  <span className="text-sm" style={{ color: "var(--text-secondary)" }}>Auto-Save</span>
                </div>
                <button
                  onClick={() => updateSetting("autoSave", !settings.autoSave)}
                  className="relative w-9 h-5 rounded-full transition-colors"
                  style={{ background: settings.autoSave ? "var(--accent)" : "var(--bg-tertiary)", border: "1px solid var(--border-subtle)" }}
                >
                  <div
                    className="absolute top-0.5 w-3.5 h-3.5 rounded-full transition-all"
                    style={{
                      background: settings.autoSave ? "white" : "var(--text-muted)",
                      left: settings.autoSave ? "calc(100% - 18px)" : "2px",
                    }}
                  />
                </button>
              </div>

              {/* Theme */}
              <div className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-white/[0.03] transition-colors">
                <div className="flex items-center gap-3">
                  <Moon size={15} style={{ color: "var(--text-muted)" }} />
                  <span className="text-sm" style={{ color: "var(--text-secondary)" }}>Theme</span>
                </div>
                <select
                  value={settings.theme}
                  onChange={(e) => updateSetting("theme", e.target.value as "dark" | "light")}
                  className="text-sm rounded-md px-2 py-1 outline-none cursor-pointer"
                  style={{ background: "var(--bg-tertiary)", color: "var(--text-primary)", border: "1px solid var(--border-subtle)" }}
                >
                  <option value="dark">Dark</option>
                  <option value="light">Light</option>
                </select>
              </div>
            </div>
          </div>

          {/* Performance */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>Performance</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-white/[0.03] transition-colors">
                <div className="flex items-center gap-3">
                  <Film size={15} style={{ color: "var(--text-muted)" }} />
                  <span className="text-sm" style={{ color: "var(--text-secondary)" }}>Preview Quality</span>
                </div>
                <select
                  value={settings.previewQuality}
                  onChange={(e) => updateSetting("previewQuality", e.target.value as "low" | "medium" | "high")}
                  className="text-sm rounded-md px-2 py-1 outline-none cursor-pointer"
                  style={{ background: "var(--bg-tertiary)", color: "var(--text-primary)", border: "1px solid var(--border-subtle)" }}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>
          </div>

          {/* About */}
          <div className="pt-2" style={{ borderTop: "1px solid var(--border-subtle)" }}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, #7c5cfc, #e879f9)" }}>
                <Scissors size={14} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Cuttamaran v0.1.0</p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>Open-source desktop video editor</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── New Project Modal ───────────────────────────────────
function NewProjectModal({ onClose, onCreate }: { onClose: () => void; onCreate: (name: string, res: string) => void }) {
  const [name, setName] = useState("");
  const [resolution, setResolution] = useState("1920x1080");

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(6,6,10,0.85)", backdropFilter: "blur(8px)" }}>
      <div
        className="w-[440px] rounded-2xl overflow-hidden animate-fade-in"
        style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)", boxShadow: "0 24px 80px rgba(0,0,0,0.6)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
          <h2 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>New Project</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5 transition-colors">
            <X size={16} style={{ color: "var(--text-muted)" }} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {/* Project name */}
          <div>
            <label className="text-xs font-medium mb-1.5 block" style={{ color: "var(--text-muted)" }}>Project Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Awesome Video"
              autoFocus
              className="w-full px-3 py-2.5 rounded-lg text-sm outline-none transition-colors"
              style={{
                background: "var(--bg-tertiary)",
                border: "1px solid var(--border-default)",
                color: "var(--text-primary)",
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "var(--accent)"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border-default)"; }}
              onKeyDown={(e) => { if (e.key === "Enter" && name.trim()) onCreate(name.trim(), resolution); }}
            />
          </div>

          {/* Resolution */}
          <div>
            <label className="text-xs font-medium mb-1.5 block" style={{ color: "var(--text-muted)" }}>Resolution</label>
            <div className="grid grid-cols-2 gap-2">
              {RESOLUTIONS.map((r) => (
                <button
                  key={r.value}
                  onClick={() => setResolution(r.value)}
                  className="flex flex-col items-start px-3 py-2.5 rounded-lg text-left transition-all"
                  style={{
                    background: resolution === r.value ? "var(--accent-muted)" : "var(--bg-tertiary)",
                    border: `1px solid ${resolution === r.value ? "var(--accent)" : "var(--border-subtle)"}`,
                  }}
                >
                  <span className="text-xs font-medium" style={{ color: resolution === r.value ? "var(--accent-hover)" : "var(--text-secondary)" }}>{r.label}</span>
                  <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>{r.desc}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-6 py-4" style={{ borderTop: "1px solid var(--border-subtle)" }}>
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg transition-colors hover:bg-white/5" style={{ color: "var(--text-secondary)" }}>
            Cancel
          </button>
          <button
            onClick={() => name.trim() && onCreate(name.trim(), resolution)}
            disabled={!name.trim()}
            className="text-sm font-medium rounded-lg transition-all disabled:opacity-40 whitespace-nowrap"
            style={{
              padding: "8px 20px",
              background: "linear-gradient(135deg, #7c5cfc, #6344e0)",
              color: "white",
              boxShadow: "0 2px 12px rgba(124, 92, 252, 0.3)",
            }}
          >
            Create Project
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────
export default function ProjectLauncher({ onOpenProject, onCreateProject }: ProjectLauncherProps) {
  const [projects, setProjects] = useState<ProjectMeta[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [showNewProject, setShowNewProject] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  useEffect(() => {
    setProjects(loadProjects());
    // Show setup dialog if no projects folder is configured
    const settings = loadSettings();
    if (!settings.projectsPath) {
      setShowSetup(true);
    }
  }, []);

  useEffect(() => {
    const api = window.electronAPI;
    if (!api) return;
    api.isMaximized().then(setIsMaximized);
    const cleanup = api.onMaximizedChange(setIsMaximized);
    return cleanup;
  }, []);

  const handleDelete = useCallback((id: string) => {
    const updated = deleteProject(id);
    setProjects(updated);
  }, []);

  const handleCreate = useCallback((name: string, resolution: string) => {
    onCreateProject(name, resolution);
  }, [onCreateProject]);

  const recentProjects = projects.sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <div className="flex flex-col h-screen select-none" style={{ background: "#06060a" }}>
      {/* Title bar */}
      <div
        className="flex items-center justify-between h-10 flex-shrink-0"
        style={{ paddingLeft: 20, paddingRight: 0, WebkitAppRegion: "drag", background: "var(--bg-secondary)", borderBottom: "1px solid var(--border-subtle)" } as React.CSSProperties}
      >
        <div className="flex items-center gap-2" style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}>
          <div className="w-5 h-5 rounded flex items-center justify-center" style={{ background: "linear-gradient(135deg, #7c5cfc, #e879f9)" }}>
            <Scissors size={10} className="text-white" />
          </div>
          <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>Cuttamaran</span>
        </div>

        {/* Window controls */}
        {typeof window !== "undefined" && window.electronAPI && (
          <div className="flex items-center" style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}>
            <button onClick={() => window.electronAPI?.minimize()} className="flex items-center justify-center w-11 h-10 hover:bg-white/10 transition-colors">
              <Minus size={13} style={{ color: "var(--text-secondary)" }} />
            </button>
            <button onClick={() => window.electronAPI?.maximize()} className="flex items-center justify-center w-11 h-10 hover:bg-white/10 transition-colors">
              {isMaximized ? <Copy size={11} className="rotate-180" style={{ color: "var(--text-secondary)" }} /> : <Square size={11} style={{ color: "var(--text-secondary)" }} />}
            </button>
            <button onClick={() => window.electronAPI?.close()} className="flex items-center justify-center w-11 h-10 hover:bg-red-500/90 transition-colors">
              <X size={13} style={{ color: "var(--text-secondary)" }} />
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div
          className="w-48 flex-shrink-0 flex flex-col pt-4 pr-3 pb-5 pl-5 gap-1"
          style={{ background: "var(--bg-secondary)", borderRight: "1px solid var(--border-subtle)" }}
        >
          <button
            onClick={() => setShowNewProject(true)}
            className="flex items-center gap-2.5 w-full px-4 py-2.5 rounded-xl text-sm font-medium transition-all mb-3 whitespace-nowrap"
            style={{
              background: "linear-gradient(135deg, #7c5cfc, #6344e0)",
              color: "white",
              boxShadow: "0 2px 16px rgba(124, 92, 252, 0.3)",
            }}
          >
            <Plus size={15} className="flex-shrink-0" />
            New Project
          </button>

          <NavItem icon={<Clock size={16} />} label="Recent" active />
          <NavItem icon={<FolderOpen size={16} />} label="All Projects" />

          <div className="flex-1" />

          <NavItem icon={<Settings size={16} />} label="Settings" onClick={() => setShowSettings(true)} />
        </div>

        {/* Main area */}
        <div className="flex-1 flex flex-col overflow-hidden p-6">
          {/* Hero section */}
          <div className="mb-4">
            <h1 className="text-xl font-bold tracking-tight mb-1" style={{ color: "var(--text-primary)" }}>
              Welcome back
            </h1>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              {recentProjects.length > 0
                ? `You have ${recentProjects.length} project${recentProjects.length === 1 ? "" : "s"}. Pick up where you left off.`
                : "Create your first project to get started."}
            </p>
          </div>

          {/* Project list */}
          {recentProjects.length > 0 ? (
            <div className="flex-1 overflow-y-auto -mx-2">
              <div className="flex flex-col gap-0.5">
                {recentProjects.map((project) => (
                  <div
                    key={project.id}
                    onClick={() => onOpenProject(project)}
                    onMouseEnter={() => setHoveredId(project.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    className="group flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all"
                    style={{
                      background: hoveredId === project.id ? "rgba(255,255,255,0.05)" : "transparent",
                    }}
                  >
                    {/* Project icon */}
                    <div
                      className="w-9 h-9 rounded-lg flex-shrink-0 flex items-center justify-center"
                      style={{ background: seededGradient(project.id), opacity: 0.85 }}
                    >
                      <Film size={15} style={{ color: "rgba(255,255,255,0.6)" }} />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{project.name}</h3>
                      <p className="text-[11px] truncate" style={{ color: "var(--text-muted)" }}>
                        {project.resolution} · {project.trackCount} tracks · {project.clipCount} clips
                      </p>
                    </div>

                    {/* Time + actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>{formatDate(project.updatedAt)}</span>
                      {hoveredId === project.id && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(project.id); }}
                          className="p-1 rounded-md transition-colors hover:bg-white/10"
                        >
                          <Trash2 size={13} style={{ color: "var(--error)" }} />
                        </button>
                      )}
                      <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "var(--accent)" }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Empty state */
            <div className="flex-1 flex flex-col items-center justify-center">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border-subtle)" }}
              >
                <Film size={28} style={{ color: "var(--text-muted)" }} />
              </div>
              <h2 className="text-base font-semibold mb-1.5" style={{ color: "var(--text-primary)" }}>No projects yet</h2>
              <p className="text-sm mb-5 text-center max-w-xs" style={{ color: "var(--text-muted)" }}>
                Create your first project and start editing amazing videos.
              </p>
              <button
                onClick={() => setShowNewProject(true)}
                className="flex items-center gap-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap"
                style={{
                  padding: "10px 24px",
                  background: "linear-gradient(135deg, #7c5cfc, #6344e0)",
                  color: "white",
                  boxShadow: "0 2px 16px rgba(124, 92, 252, 0.3)",
                }}
              >
                <Plus size={15} className="flex-shrink-0" />
                Create Project
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showSetup && <FirstTimeSetup onComplete={() => setShowSetup(false)} />}
      {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}
      {showNewProject && (
        <NewProjectModal
          onClose={() => setShowNewProject(false)}
          onCreate={handleCreate}
        />
      )}
    </div>
  );
}

// ─── Sidebar Nav Item ────────────────────────────────────
function NavItem({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active?: boolean; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm transition-colors"
      style={{
        background: active ? "var(--accent-muted)" : "transparent",
        color: active ? "var(--accent-hover)" : "var(--text-secondary)",
      }}
      onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
      onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = active ? "var(--accent-muted)" : "transparent"; }}
    >
      <span className="flex-shrink-0">{icon}</span>
      {label}
    </button>
  );
}

export { loadProjects, saveProjects };
