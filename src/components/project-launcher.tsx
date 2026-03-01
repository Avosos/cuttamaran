"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
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
  ChevronDown,
  Film,
  Minus,
  Square,
  Copy,
} from "lucide-react";

// ─── Custom Dropdown ─────────────────────────────────────
function CustomDropdown({ value, options, onChange }: { value: string; options: { label: string; value: string }[]; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const selected = options.find((o) => o.value === value);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "5px 10px",
          borderRadius: 6,
          fontSize: 13,
          border: "1px solid var(--border-subtle)",
          cursor: "pointer",
          background: "var(--bg-tertiary)",
          color: "var(--text-primary)",
          whiteSpace: "nowrap",
        }}
      >
        {selected?.label ?? value}
        <ChevronDown size={12} style={{ color: "var(--text-muted)", transition: "transform 0.15s", transform: open ? "rotate(180deg)" : "rotate(0)" }} />
      </button>
      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            right: 0,
            minWidth: "100%",
            borderRadius: 8,
            padding: 4,
            background: "var(--bg-tertiary)",
            border: "1px solid var(--border-subtle)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
            zIndex: 100,
          }}
        >
          {options.map((opt) => (
            <div
              key={opt.value}
              onClick={() => { onChange(opt.value); setOpen(false); }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--accent-muted)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = opt.value === value ? "rgba(255,255,255,0.06)" : "transparent"; }}
              style={{
                padding: "6px 10px",
                borderRadius: 5,
                fontSize: 13,
                cursor: "pointer",
                whiteSpace: "nowrap",
                background: opt.value === value ? "rgba(255,255,255,0.06)" : "transparent",
                color: opt.value === value ? "var(--accent-hover)" : "var(--text-secondary)",
              }}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

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
  filePath?: string;  // path to .cutta file on disk
}

interface ProjectLauncherProps {
  onOpenProject: (project: ProjectMeta) => void;
  onCreateProject: (name: string, resolution: string) => void;
  onOpenFromDisk?: () => void;
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
    <div style={{ position: "absolute", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(6,6,10,0.85)", backdropFilter: "blur(8px)" }}>
      <div
        style={{
          width: 520,
          borderRadius: 16,
          overflow: "hidden",
          background: "var(--bg-secondary)",
          border: "1px solid var(--border-subtle)",
          boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 24px", borderBottom: "1px solid var(--border-subtle)" }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0, color: "var(--text-primary)" }}>Settings</h2>
          <button
            onClick={onClose}
            style={{ padding: 6, borderRadius: 8, background: "transparent", border: "none", cursor: "pointer" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
          >
            <X size={16} style={{ color: "var(--text-muted)" }} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "20px 24px", maxHeight: 420, overflowY: "auto", display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Storage */}
          <div>
            <h3 style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12, color: "var(--text-muted)" }}>Storage</h3>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 12px",
                borderRadius: 8,
                background: "var(--bg-tertiary)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0, flex: 1 }}>
                <FolderOpen size={15} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <span style={{ fontSize: 13, display: "block", color: "var(--text-secondary)" }}>Projects Folder</span>
                  <span style={{ fontSize: 11, display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "var(--text-muted)" }}>
                    {settings.projectsPath || "Not set — click Browse to choose"}
                  </span>
                </div>
              </div>
              <button
                onClick={handleBrowseFolder}
                style={{
                  fontSize: 12,
                  padding: "6px 12px",
                  borderRadius: 6,
                  flexShrink: 0,
                  marginLeft: 12,
                  border: "none",
                  cursor: "pointer",
                  background: "var(--accent-muted)",
                  color: "var(--accent-hover)",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(124,92,252,0.2)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "var(--accent-muted)"; }}
              >
                Browse
              </button>
            </div>
          </div>

          {/* General */}
          <div>
            <h3 style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12, color: "var(--text-muted)" }}>General</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {/* Default Resolution */}
              <div
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", borderRadius: 8 }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <Monitor size={15} style={{ color: "var(--text-muted)" }} />
                  <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>Default Resolution</span>
                </div>
                <CustomDropdown
                  value={settings.defaultResolution}
                  options={RESOLUTIONS.map((r) => ({ label: r.label, value: r.value }))}
                  onChange={(v) => updateSetting("defaultResolution", v)}
                />
              </div>

              {/* Auto-Save */}
              <div
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", borderRadius: 8 }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <HardDrive size={15} style={{ color: "var(--text-muted)" }} />
                  <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>Auto-Save</span>
                </div>
                <button
                  onClick={() => updateSetting("autoSave", !settings.autoSave)}
                  style={{
                    position: "relative",
                    width: 36,
                    height: 20,
                    borderRadius: 10,
                    border: "1px solid var(--border-subtle)",
                    cursor: "pointer",
                    transition: "background 0.2s",
                    background: settings.autoSave ? "var(--accent)" : "var(--bg-tertiary)",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      top: 2,
                      width: 14,
                      height: 14,
                      borderRadius: 7,
                      transition: "left 0.2s, background 0.2s",
                      background: settings.autoSave ? "white" : "var(--text-muted)",
                      left: settings.autoSave ? "calc(100% - 18px)" : 2,
                    }}
                  />
                </button>
              </div>

              {/* Theme */}
              <div
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", borderRadius: 8 }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <Moon size={15} style={{ color: "var(--text-muted)" }} />
                  <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>Theme</span>
                </div>
                <CustomDropdown
                  value={settings.theme}
                  options={[{ label: "Dark", value: "dark" }, { label: "Light", value: "light" }]}
                  onChange={(v) => updateSetting("theme", v as "dark" | "light")}
                />
              </div>
            </div>
          </div>

          {/* Performance */}
          <div>
            <h3 style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12, color: "var(--text-muted)" }}>Performance</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", borderRadius: 8 }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <Film size={15} style={{ color: "var(--text-muted)" }} />
                  <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>Preview Quality</span>
                </div>
                <CustomDropdown
                  value={settings.previewQuality}
                  options={[{ label: "Low", value: "low" }, { label: "Medium", value: "medium" }, { label: "High", value: "high" }]}
                  onChange={(v) => updateSetting("previewQuality", v as "low" | "medium" | "high")}
                />
              </div>
            </div>
          </div>

          {/* About */}
          <div style={{ paddingTop: 8, borderTop: "1px solid var(--border-subtle)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #7c5cfc, #e879f9)" }}>
                <Scissors size={14} className="text-white" />
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 500, margin: 0, color: "var(--text-primary)" }}>Cuttamaran v0.1.0</p>
                <p style={{ fontSize: 12, margin: 0, color: "var(--text-muted)" }}>Open-source desktop video editor</p>
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
    <div style={{ position: "absolute", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(6,6,10,0.85)", backdropFilter: "blur(8px)" }}>
      <div
        style={{
          width: 440,
          borderRadius: 16,
          overflow: "hidden",
          background: "var(--bg-secondary)",
          border: "1px solid var(--border-subtle)",
          boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 24px", borderBottom: "1px solid var(--border-subtle)" }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0, color: "var(--text-primary)" }}>New Project</h2>
          <button
            onClick={onClose}
            style={{ padding: 6, borderRadius: 8, background: "transparent", border: "none", cursor: "pointer" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
          >
            <X size={16} style={{ color: "var(--text-muted)" }} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Project name */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 500, marginBottom: 6, display: "block", color: "var(--text-muted)" }}>Project Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Awesome Video"
              autoFocus
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 8,
                fontSize: 13,
                outline: "none",
                background: "var(--bg-tertiary)",
                border: "1px solid var(--border-default)",
                color: "var(--text-primary)",
                boxSizing: "border-box",
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "var(--accent)"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border-default)"; }}
              onKeyDown={(e) => { if (e.key === "Enter" && name.trim()) onCreate(name.trim(), resolution); }}
            />
          </div>

          {/* Resolution */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 500, marginBottom: 6, display: "block", color: "var(--text-muted)" }}>Resolution</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {RESOLUTIONS.map((r) => (
                <button
                  key={r.value}
                  onClick={() => setResolution(r.value)}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    padding: "10px 12px",
                    borderRadius: 8,
                    textAlign: "left",
                    cursor: "pointer",
                    transition: "border-color 0.15s, background 0.15s",
                    background: resolution === r.value ? "var(--accent-muted)" : "var(--bg-tertiary)",
                    border: `1px solid ${resolution === r.value ? "var(--accent)" : "var(--border-subtle)"}`,
                  }}
                >
                  <span style={{ fontSize: 12, fontWeight: 500, color: resolution === r.value ? "var(--accent-hover)" : "var(--text-secondary)" }}>{r.label}</span>
                  <span style={{ fontSize: 10, color: "var(--text-muted)" }}>{r.desc}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, padding: "16px 24px", borderTop: "1px solid var(--border-subtle)" }}>
          <button
            onClick={onClose}
            style={{ padding: "8px 16px", fontSize: 13, borderRadius: 8, background: "transparent", border: "none", cursor: "pointer", color: "var(--text-secondary)" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
          >
            Cancel
          </button>
          <button
            onClick={() => name.trim() && onCreate(name.trim(), resolution)}
            disabled={!name.trim()}
            style={{
              padding: "8px 20px",
              fontSize: 13,
              fontWeight: 500,
              borderRadius: 8,
              border: "none",
              cursor: name.trim() ? "pointer" : "default",
              whiteSpace: "nowrap",
              opacity: name.trim() ? 1 : 0.4,
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
export default function ProjectLauncher({ onOpenProject, onCreateProject, onOpenFromDisk }: ProjectLauncherProps) {
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
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", userSelect: "none", background: "#06060a" }}>
      {/* Title bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: 40,
          flexShrink: 0,
          paddingLeft: 20,
          paddingRight: 0,
          background: "var(--bg-secondary)",
          borderBottom: "1px solid var(--border-subtle)",
          WebkitAppRegion: "drag",
        } as React.CSSProperties}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, WebkitAppRegion: "no-drag" } as React.CSSProperties}>
          <div style={{ width: 20, height: 20, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #7c5cfc, #e879f9)" }}>
            <Scissors size={10} className="text-white" />
          </div>
          <span style={{ fontSize: 12, fontWeight: 500, color: "var(--text-muted)" }}>Cuttamaran</span>
        </div>

        {typeof window !== "undefined" && window.electronAPI && (
          <div style={{ display: "flex", alignItems: "center", WebkitAppRegion: "no-drag" } as React.CSSProperties}>
            <button onClick={() => window.electronAPI?.minimize()} style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 44, height: 40, background: "transparent", border: "none", cursor: "pointer" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
            >
              <Minus size={13} style={{ color: "var(--text-secondary)" }} />
            </button>
            <button onClick={() => window.electronAPI?.maximize()} style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 44, height: 40, background: "transparent", border: "none", cursor: "pointer" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
            >
              {isMaximized ? <Copy size={11} className="rotate-180" style={{ color: "var(--text-secondary)" }} /> : <Square size={11} style={{ color: "var(--text-secondary)" }} />}
            </button>
            <button onClick={() => window.electronAPI?.close()} style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 44, height: 40, background: "transparent", border: "none", cursor: "pointer" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(239,68,68,0.9)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
            >
              <X size={13} style={{ color: "var(--text-secondary)" }} />
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Sidebar */}
        <div
          style={{
            width: 200,
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            paddingTop: 16,
            paddingRight: 12,
            paddingBottom: 20,
            paddingLeft: 20,
            gap: 2,
            background: "var(--bg-secondary)",
            borderRight: "1px solid var(--border-subtle)",
          }}
        >
          <button
            onClick={() => setShowNewProject(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              width: "100%",
              padding: "10px 16px",
              borderRadius: 12,
              fontSize: 13,
              fontWeight: 500,
              border: "none",
              cursor: "pointer",
              marginBottom: 12,
              whiteSpace: "nowrap",
              background: "linear-gradient(135deg, #7c5cfc, #6344e0)",
              color: "white",
              boxShadow: "0 2px 16px rgba(124, 92, 252, 0.3)",
            }}
          >
            <Plus size={15} style={{ flexShrink: 0 }} />
            New Project
          </button>

          {onOpenFromDisk && (
            <button
              onClick={onOpenFromDisk}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                width: "100%",
                padding: "10px 14px",
                borderRadius: 12,
                fontSize: 13,
                fontWeight: 500,
                border: "1px solid var(--border-subtle)",
                cursor: "pointer",
                marginBottom: 12,
                whiteSpace: "nowrap",
                background: "var(--bg-tertiary)",
                color: "var(--text-secondary)",
              }}
            >
              <FolderOpen size={15} style={{ flexShrink: 0 }} />
              Open File
            </button>
          )}

          <NavItem icon={<Clock size={16} />} label="Recent" active />
          <NavItem icon={<FolderOpen size={16} />} label="All Projects" />

          <div style={{ flex: 1 }} />

          <NavItem icon={<Settings size={16} />} label="Settings" onClick={() => setShowSettings(true)} />
        </div>

        {/* Main area */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", padding: 28 }}>
          {/* Hero section */}
          <div style={{ marginBottom: 20 }}>
            <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.01em", marginBottom: 4, color: "var(--text-primary)" }}>
              Welcome back
            </h1>
            <p style={{ fontSize: 13, margin: 0, color: "var(--text-muted)" }}>
              {recentProjects.length > 0
                ? `You have ${recentProjects.length} project${recentProjects.length === 1 ? "" : "s"}. Pick up where you left off.`
                : "Create your first project to get started."}
            </p>
          </div>

          {/* Project list */}
          {recentProjects.length > 0 ? (
            <div style={{ flex: 1, overflowY: "auto", marginLeft: -8, marginRight: -8 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {recentProjects.map((project) => (
                  <div
                    key={project.id}
                    onClick={() => onOpenProject(project)}
                    onMouseEnter={() => setHoveredId(project.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                      padding: "10px 14px",
                      borderRadius: 10,
                      cursor: "pointer",
                      transition: "background 0.15s",
                      background: hoveredId === project.id ? "rgba(255,255,255,0.05)" : "transparent",
                    }}
                  >
                    {/* Project icon */}
                    <div
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 10,
                        flexShrink: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: seededGradient(project.id),
                        opacity: 0.85,
                      }}
                    >
                      <Film size={15} style={{ color: "rgba(255,255,255,0.6)" }} />
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3 style={{ fontSize: 13, fontWeight: 500, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "var(--text-primary)" }}>{project.name}</h3>
                      <p style={{ fontSize: 11, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "var(--text-muted)" }}>
                        {project.resolution} · {project.trackCount} tracks · {project.clipCount} clips
                      </p>
                    </div>

                    {/* Time + actions */}
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                      <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{formatDate(project.updatedAt)}</span>
                      {hoveredId === project.id && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(project.id); }}
                          style={{ padding: 4, borderRadius: 6, background: "transparent", border: "none", cursor: "pointer" }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                        >
                          <Trash2 size={13} style={{ color: "var(--error)" }} />
                        </button>
                      )}
                      <ChevronRight size={14} style={{ color: "var(--accent)", opacity: hoveredId === project.id ? 1 : 0, transition: "opacity 0.15s" }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Empty state */
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 16,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 16,
                  background: "var(--bg-tertiary)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                <Film size={28} style={{ color: "var(--text-muted)" }} />
              </div>
              <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 6, color: "var(--text-primary)" }}>No projects yet</h2>
              <p style={{ fontSize: 13, marginBottom: 20, textAlign: "center", maxWidth: 280, color: "var(--text-muted)" }}>
                Create your first project and start editing amazing videos.
              </p>
              <button
                onClick={() => setShowNewProject(true)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "10px 24px",
                  borderRadius: 12,
                  fontSize: 13,
                  fontWeight: 500,
                  border: "none",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  background: "linear-gradient(135deg, #7c5cfc, #6344e0)",
                  color: "white",
                  boxShadow: "0 2px 16px rgba(124, 92, 252, 0.3)",
                }}
              >
                <Plus size={15} style={{ flexShrink: 0 }} />
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
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        width: "100%",
        padding: "8px 12px",
        borderRadius: 8,
        fontSize: 13,
        border: "none",
        cursor: "pointer",
        transition: "background 0.15s",
        background: active ? "var(--accent-muted)" : "transparent",
        color: active ? "var(--accent-hover)" : "var(--text-secondary)",
      }}
      onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = active ? "var(--accent-muted)" : "transparent"; }}
    >
      <span style={{ flexShrink: 0, display: "flex" }}>{icon}</span>
      {label}
    </button>
  );
}

export { loadProjects, saveProjects };
