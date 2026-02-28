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

// ─── Settings Panel ──────────────────────────────────────
function SettingsPanel({ onClose }: { onClose: () => void }) {
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
        <div className="px-6 py-5 space-y-5">
          {/* General */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>General</h3>
            <div className="space-y-3">
              <SettingRow icon={<Monitor size={15} />} label="Default Resolution" value="1920 × 1080" />
              <SettingRow icon={<HardDrive size={15} />} label="Auto-Save" value="Enabled" />
              <SettingRow icon={<Moon size={15} />} label="Theme" value="Dark" />
            </div>
          </div>

          {/* Performance */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>Performance</h3>
            <div className="space-y-3">
              <SettingRow icon={<Film size={15} />} label="Preview Quality" value="High" />
              <SettingRow icon={<HardDrive size={15} />} label="Cache Location" value="Default" />
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

function SettingRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-white/[0.03] transition-colors">
      <div className="flex items-center gap-3">
        <span style={{ color: "var(--text-muted)" }}>{icon}</span>
        <span className="text-sm" style={{ color: "var(--text-secondary)" }}>{label}</span>
      </div>
      <span className="text-sm" style={{ color: "var(--text-muted)" }}>{value}</span>
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
  const [isMaximized, setIsMaximized] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  useEffect(() => {
    setProjects(loadProjects());
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
          className="w-56 flex-shrink-0 flex flex-col pt-4 pr-4 pb-4 pl-5 gap-1"
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
        <div className="flex-1 flex flex-col overflow-hidden p-8">
          {/* Hero section */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight mb-1" style={{ color: "var(--text-primary)" }}>
              Welcome back
            </h1>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              {recentProjects.length > 0
                ? `You have ${recentProjects.length} project${recentProjects.length === 1 ? "" : "s"}. Pick up where you left off.`
                : "Create your first project to get started."}
            </p>
          </div>

          {/* Project grid */}
          {recentProjects.length > 0 ? (
            <div className="flex-1 overflow-y-auto">
              <div className="grid grid-cols-3 gap-4 pb-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))" }}>
                {/* New project card */}
                <button
                  onClick={() => setShowNewProject(true)}
                  className="group flex flex-col items-center justify-center rounded-2xl transition-all h-48"
                  style={{
                    border: "2px dashed var(--border-default)",
                    background: "transparent",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "var(--accent)";
                    e.currentTarget.style.background = "var(--accent-muted)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--border-default)";
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-3 transition-transform group-hover:scale-110"
                    style={{ background: "var(--bg-tertiary)" }}
                  >
                    <Plus size={20} style={{ color: "var(--text-muted)" }} />
                  </div>
                  <span className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>New Project</span>
                </button>

                {/* Existing projects */}
                {recentProjects.map((project) => (
                  <div
                    key={project.id}
                    onClick={() => onOpenProject(project)}
                    onMouseEnter={() => setHoveredId(project.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    className="group relative flex flex-col rounded-2xl overflow-hidden cursor-pointer transition-all h-48"
                    style={{
                      background: "var(--bg-secondary)",
                      border: hoveredId === project.id ? "1px solid var(--accent)" : "1px solid var(--border-subtle)",
                      boxShadow: hoveredId === project.id ? "0 8px 32px rgba(124, 92, 252, 0.15)" : "none",
                    }}
                  >
                    {/* Thumbnail area */}
                    <div
                      className="h-24 flex-shrink-0 relative"
                      style={{ background: seededGradient(project.id), opacity: 0.8 }}
                    >
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Film size={24} style={{ color: "rgba(255,255,255,0.4)" }} />
                      </div>

                      {/* Delete button */}
                      {hoveredId === project.id && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(project.id); }}
                          className="absolute top-2 right-2 p-1.5 rounded-lg transition-colors"
                          style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
                        >
                          <Trash2 size={13} style={{ color: "var(--error)" }} />
                        </button>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 flex flex-col justify-between p-3">
                      <div>
                        <h3 className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{project.name}</h3>
                        <p className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                          {project.resolution} · {project.trackCount} tracks · {project.clipCount} clips
                        </p>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>{formatDate(project.updatedAt)}</span>
                        <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "var(--accent)" }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Empty state */
            <div className="flex-1 flex flex-col items-center justify-center">
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center mb-5"
                style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border-subtle)" }}
              >
                <Film size={32} style={{ color: "var(--text-muted)" }} />
              </div>
              <h2 className="text-lg font-semibold mb-2" style={{ color: "var(--text-primary)" }}>No projects yet</h2>
              <p className="text-sm mb-6 text-center max-w-xs" style={{ color: "var(--text-muted)" }}>
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
      onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}
    >
      {icon}
      {label}
    </button>
  );
}

export { loadProjects, saveProjects };
