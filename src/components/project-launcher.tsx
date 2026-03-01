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
  Palette,
  Gamepad2,
  Music,
  Youtube,
  Smartphone,
  Clapperboard,
  Mic,
  FileText,
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
            boxShadow: "var(--shadow-dropdown)",
            zIndex: 100,
          }}
        >
          {options.map((opt) => (
            <div
              key={opt.value}
              onClick={() => { onChange(opt.value); setOpen(false); }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--accent-muted)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = opt.value === value ? "var(--hover-overlay)" : "transparent"; }}
              style={{
                padding: "6px 10px",
                borderRadius: 5,
                fontSize: 13,
                cursor: "pointer",
                whiteSpace: "nowrap",
                background: opt.value === value ? "var(--hover-overlay)" : "transparent",
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
  filePath?: string;  // path to .cmp file on disk
}

// ─── Project Presets ─────────────────────────────────────
export interface PresetTrack {
  name: string;
  type: "video" | "audio";
  height?: number;
}

export interface PresetClip {
  trackIndex: number;
  type: "text";
  name: string;
  duration: number;
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  backgroundColor?: string;
  fontWeight?: "normal" | "bold";
}

export interface ProjectPreset {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  gradient: string;
  resolution: string;
  tracks: PresetTrack[];
  clips?: PresetClip[];
}

const PROJECT_PRESETS: ProjectPreset[] = [
  {
    id: "blank",
    name: "Blank Project",
    description: "Start from scratch with a clean timeline",
    icon: <FileText size={20} />,
    gradient: "linear-gradient(135deg, #64748b 0%, #475569 100%)",
    resolution: "1920x1080",
    tracks: [
      { name: "Video 1", type: "video", height: 64 },
      { name: "Audio 1", type: "audio", height: 48 },
    ],
  },
  {
    id: "valorant-montage",
    name: "Valorant Montage",
    description: "Fast-paced gaming edits with overlay tracks",
    icon: <Gamepad2 size={20} />,
    gradient: "linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)",
    resolution: "1920x1080",
    tracks: [
      { name: "Overlay", type: "video", height: 48 },
      { name: "Gameplay", type: "video", height: 64 },
      { name: "SFX", type: "audio", height: 40 },
      { name: "Music", type: "audio", height: 48 },
    ],
    clips: [
      {
        trackIndex: 0,
        type: "text",
        name: "Title Card",
        duration: 3,
        text: "MONTAGE TITLE",
        fontSize: 72,
        fontFamily: "Impact",
        color: "#ffffff",
        fontWeight: "bold",
      },
    ],
  },
  {
    id: "music-video",
    name: "Music Video",
    description: "Multi-layer visuals with dedicated music track",
    icon: <Music size={20} />,
    gradient: "linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)",
    resolution: "1920x1080",
    tracks: [
      { name: "Text / Titles", type: "video", height: 48 },
      { name: "B-Roll", type: "video", height: 56 },
      { name: "Main Video", type: "video", height: 64 },
      { name: "Vocals", type: "audio", height: 40 },
      { name: "Instrumental", type: "audio", height: 48 },
    ],
    clips: [
      {
        trackIndex: 0,
        type: "text",
        name: "Song Title",
        duration: 4,
        text: "Song Title — Artist",
        fontSize: 56,
        fontFamily: "Inter",
        color: "#ffffff",
        fontWeight: "bold",
      },
    ],
  },
  {
    id: "youtube-video",
    name: "YouTube Video",
    description: "Main footage, facecam overlay & voiceover",
    icon: <Youtube size={20} />,
    gradient: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
    resolution: "1920x1080",
    tracks: [
      { name: "Facecam", type: "video", height: 48 },
      { name: "Main Footage", type: "video", height: 64 },
      { name: "Voiceover", type: "audio", height: 48 },
      { name: "Background Music", type: "audio", height: 40 },
    ],
    clips: [
      {
        trackIndex: 0,
        type: "text",
        name: "Intro Title",
        duration: 4,
        text: "Video Title Goes Here",
        fontSize: 52,
        fontFamily: "Inter",
        color: "#ffffff",
        fontWeight: "bold",
      },
    ],
  },
  {
    id: "tiktok-reels",
    name: "TikTok / Reels",
    description: "Vertical 9:16 format for short-form content",
    icon: <Smartphone size={20} />,
    gradient: "linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)",
    resolution: "1080x1920",
    tracks: [
      { name: "Text", type: "video", height: 48 },
      { name: "Video", type: "video", height: 64 },
      { name: "Sound", type: "audio", height: 48 },
    ],
    clips: [
      {
        trackIndex: 0,
        type: "text",
        name: "Caption",
        duration: 3,
        text: "Your caption here",
        fontSize: 44,
        fontFamily: "Inter",
        color: "#ffffff",
        backgroundColor: "rgba(0,0,0,0.6)",
        fontWeight: "bold",
      },
    ],
  },
  {
    id: "cinematic",
    name: "Cinematic",
    description: "4K multi-track layout for film projects",
    icon: <Clapperboard size={20} />,
    gradient: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
    resolution: "3840x2160",
    tracks: [
      { name: "Titles", type: "video", height: 48 },
      { name: "B-Roll", type: "video", height: 56 },
      { name: "Main", type: "video", height: 64 },
      { name: "Dialogue", type: "audio", height: 44 },
      { name: "Foley / SFX", type: "audio", height: 40 },
      { name: "Score", type: "audio", height: 48 },
    ],
  },
  {
    id: "podcast",
    name: "Podcast",
    description: "Camera feed with separate host & guest audio",
    icon: <Mic size={20} />,
    gradient: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
    resolution: "1920x1080",
    tracks: [
      { name: "Graphics", type: "video", height: 48 },
      { name: "Camera", type: "video", height: 64 },
      { name: "Host", type: "audio", height: 48 },
      { name: "Guest", type: "audio", height: 48 },
      { name: "Intro/Outro", type: "audio", height: 40 },
    ],
  },
];

interface ProjectLauncherProps {
  onOpenProject: (project: ProjectMeta) => void;
  onCreateProject: (name: string, resolution: string, preset?: ProjectPreset) => void;
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
import {
  useSettings,
  loadSettings,
  saveSettings,
  updateSetting as updateSettingGlobal,
  type AppSettings,
} from "@/hooks/use-settings";

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
      updateSettingGlobal("projectsPath", folderPath);
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
          boxShadow: "var(--shadow-heavy)",
        }}
      >
        {/* Header with icon */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 32, paddingBottom: 8, paddingLeft: 40, paddingRight: 40 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16, background: "var(--accent-gradient-vibrant)" }}>
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
              background: folderPath ? "var(--accent-gradient)" : "var(--bg-tertiary)",
              color: folderPath ? "white" : "var(--text-secondary)",
              boxShadow: folderPath ? "0 2px 12px var(--accent-glow)" : "none",
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
  const [settings] = useSettings();

  const updateSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    updateSettingGlobal(key, value);
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
          boxShadow: "var(--shadow-heavy)",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 24px", borderBottom: "1px solid var(--border-subtle)" }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0, color: "var(--text-primary)" }}>Settings</h2>
          <button
            onClick={onClose}
            style={{ padding: 6, borderRadius: 8, background: "transparent", border: "none", cursor: "pointer" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--hover-overlay)"; }}
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
                onMouseEnter={(e) => { e.currentTarget.style.background = "var(--hover-subtle)"; }}
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
                onMouseEnter={(e) => { e.currentTarget.style.background = "var(--hover-subtle)"; }}
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
                onMouseEnter={(e) => { e.currentTarget.style.background = "var(--hover-subtle)"; }}
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

              {/* Accent Color */}
              <div
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", borderRadius: 8 }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "var(--hover-subtle)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <Palette size={15} style={{ color: "var(--text-muted)" }} />
                  <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>Accent Color</span>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  {([
                    { value: "purple" as const, colors: ["#7c5cfc", "#e879f9"] },
                    { value: "orange" as const, colors: ["#f97316", "#facc15"] },
                    { value: "green" as const, colors: ["#22c55e", "#a3e635"] },
                  ]).map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => updateSetting("accentColor", opt.value)}
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 8,
                        border: settings.accentColor === opt.value ? "2px solid var(--text-primary)" : "2px solid transparent",
                        background: `linear-gradient(135deg, ${opt.colors[0]}, ${opt.colors[1]})`,
                        cursor: "pointer",
                        boxShadow: settings.accentColor === opt.value ? `0 0 10px ${opt.colors[0]}80` : "none",
                        transition: "all 0.15s",
                        padding: 0,
                      }}
                      title={opt.value.charAt(0).toUpperCase() + opt.value.slice(1)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Performance */}
          <div>
            <h3 style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12, color: "var(--text-muted)" }}>Performance</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", borderRadius: 8 }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "var(--hover-subtle)"; }}
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
              <div style={{ width: 32, height: 32, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--accent-gradient-vibrant)" }}>
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
function NewProjectModal({ onClose, onCreate }: { onClose: () => void; onCreate: (name: string, res: string, preset?: ProjectPreset) => void }) {
  const [name, setName] = useState("");
  const [resolution, setResolution] = useState("1920x1080");
  const [selectedPreset, setSelectedPreset] = useState<ProjectPreset>(PROJECT_PRESETS[0]);
  const [hoveredPresetId, setHoveredPresetId] = useState<string | null>(null);

  // Sync resolution when preset changes
  const handlePresetSelect = (preset: ProjectPreset) => {
    setSelectedPreset(preset);
    setResolution(preset.resolution);
  };

  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(6,6,10,0.85)", backdropFilter: "blur(8px)" }}>
      <div
        style={{
          width: 620,
          maxHeight: "85vh",
          borderRadius: 16,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          background: "var(--bg-secondary)",
          border: "1px solid var(--border-subtle)",
          boxShadow: "var(--shadow-heavy)",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 24px", borderBottom: "1px solid var(--border-subtle)", flexShrink: 0 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0, color: "var(--text-primary)" }}>New Project</h2>
          <button
            onClick={onClose}
            style={{ padding: 6, borderRadius: 8, background: "transparent", border: "none", cursor: "pointer" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--hover-overlay)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
          >
            <X size={16} style={{ color: "var(--text-muted)" }} />
          </button>
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Project name */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 500, marginBottom: 6, display: "block", color: "var(--text-muted)" }}>Project Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={selectedPreset.id === "blank" ? "My Awesome Video" : selectedPreset.name}
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
              onKeyDown={(e) => { if (e.key === "Enter" && name.trim()) onCreate(name.trim(), resolution, selectedPreset.id === "blank" ? undefined : selectedPreset); }}
            />
          </div>

          {/* Presets */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 500, marginBottom: 8, display: "block", color: "var(--text-muted)" }}>Template</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {PROJECT_PRESETS.map((preset) => {
                const isSelected = selectedPreset.id === preset.id;
                const isHovered = hoveredPresetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    onClick={() => handlePresetSelect(preset)}
                    onMouseEnter={() => setHoveredPresetId(preset.id)}
                    onMouseLeave={() => setHoveredPresetId(null)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "10px 12px",
                      borderRadius: 10,
                      textAlign: "left",
                      cursor: "pointer",
                      transition: "border-color 0.15s, background 0.15s, box-shadow 0.15s",
                      background: isSelected ? "var(--accent-muted)" : isHovered ? "var(--hover-subtle)" : "var(--bg-tertiary)",
                      border: `1.5px solid ${isSelected ? "var(--accent)" : "var(--border-subtle)"}`,
                      boxShadow: isSelected ? "0 0 12px var(--accent-glow)" : "none",
                    }}
                  >
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 9,
                        flexShrink: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: preset.gradient,
                        color: "rgba(255,255,255,0.9)",
                      }}
                    >
                      {preset.icon}
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, display: "block", color: isSelected ? "var(--accent-hover)" : "var(--text-primary)" }}>
                        {preset.name}
                      </span>
                      <span style={{ fontSize: 10, display: "block", color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {preset.description}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Preset details */}
          <div style={{ padding: 12, borderRadius: 10, background: "var(--bg-tertiary)", border: "1px solid var(--border-subtle)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <span style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--text-muted)" }}>
                Track Layout
              </span>
              <span style={{ fontSize: 10, color: "var(--text-muted)" }}>
                {RESOLUTIONS.find((r) => r.value === selectedPreset.resolution)?.label ?? selectedPreset.resolution} · {selectedPreset.tracks.length} tracks
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {selectedPreset.tracks.map((t, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "5px 8px",
                    borderRadius: 6,
                    background: "var(--bg-primary)",
                  }}
                >
                  <div
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: 3,
                      flexShrink: 0,
                      background: t.type === "video" ? "var(--clip-video)" : "var(--clip-audio)",
                    }}
                  />
                  <span style={{ fontSize: 11, color: "var(--text-secondary)", flex: 1 }}>{t.name}</span>
                  <span style={{ fontSize: 9, textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.05em", color: "var(--text-muted)" }}>
                    {t.type}
                  </span>
                </div>
              ))}
            </div>
            {selectedPreset.clips && selectedPreset.clips.length > 0 && (
              <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid var(--border-subtle)" }}>
                <span style={{ fontSize: 10, color: "var(--text-muted)" }}>
                  Includes {selectedPreset.clips.length} starter clip{selectedPreset.clips.length > 1 ? "s" : ""} (title card{selectedPreset.clips.length > 1 ? "s" : ""})
                </span>
              </div>
            )}
          </div>

          {/* Resolution override */}
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
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, padding: "16px 24px", borderTop: "1px solid var(--border-subtle)", flexShrink: 0 }}>
          <button
            onClick={onClose}
            style={{ padding: "8px 16px", fontSize: 13, borderRadius: 8, background: "transparent", border: "none", cursor: "pointer", color: "var(--text-secondary)" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--hover-overlay)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
          >
            Cancel
          </button>
          <button
            onClick={() => name.trim() && onCreate(name.trim(), resolution, selectedPreset.id === "blank" ? undefined : selectedPreset)}
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
              background: "var(--accent-gradient)",
              color: "white",
              boxShadow: "0 2px 12px var(--accent-glow)",
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
type LauncherView = "recent" | "all";

interface DiskProject {
  filePath: string;
  projectName: string;
  resolution: string;
  trackCount: number;
  clipCount: number;
  savedAt: string;
  updatedAt: number;
}

export default function ProjectLauncher({ onOpenProject, onCreateProject, onOpenFromDisk }: ProjectLauncherProps) {
  const [projects, setProjects] = useState<ProjectMeta[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [showNewProject, setShowNewProject] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [view, setView] = useState<LauncherView>("recent");
  const [diskProjects, setDiskProjects] = useState<DiskProject[]>([]);
  const [loadingDisk, setLoadingDisk] = useState(false);

  useEffect(() => {
    setProjects(loadProjects());
    // Show setup dialog if no projects folder is configured
    const settings = loadSettings();
    if (!settings.projectsPath) {
      setShowSetup(true);
    }
  }, []);

  // Scan disk for .cmp files when switching to "All Projects"
  useEffect(() => {
    if (view !== "all") return;
    const settings = loadSettings();
    if (!settings.projectsPath) { setDiskProjects([]); return; }
    setLoadingDisk(true);
    window.electronAPI?.listProjects({ folderPath: settings.projectsPath }).then((res) => {
      if (res?.ok) {
        setDiskProjects(res.projects.sort((a, b) => b.updatedAt - a.updatedAt));
      }
    }).finally(() => setLoadingDisk(false));
  }, [view]);

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

  const handleCreate = useCallback((name: string, resolution: string, preset?: ProjectPreset) => {
    onCreateProject(name, resolution, preset);
  }, [onCreateProject]);

  const recentProjects = projects.sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", userSelect: "none", background: "var(--bg-primary)" }}>
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
          <div style={{ width: 20, height: 20, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--accent-gradient-vibrant)" }}>
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
              background: "var(--accent-gradient)",
              color: "white",
              boxShadow: "0 2px 16px var(--accent-glow)",
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

          <NavItem icon={<Clock size={16} />} label="Recent" active={view === "recent"} onClick={() => setView("recent")} />
          <NavItem icon={<FolderOpen size={16} />} label="All Projects" active={view === "all"} onClick={() => setView("all")} />

          <div style={{ flex: 1 }} />

          <NavItem icon={<Settings size={16} />} label="Settings" onClick={() => setShowSettings(true)} />
        </div>

        {/* Main area */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", padding: 28 }}>
          {view === "recent" ? (
            <>
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
                          background: hoveredId === project.id ? "var(--hover-overlay)" : "transparent",
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
                      background: "var(--accent-gradient)",
                      color: "white",
                      boxShadow: "0 2px 16px var(--accent-glow)",
                    }}
                  >
                    <Plus size={15} style={{ flexShrink: 0 }} />
                    Create Project
                  </button>
                </div>
              )}
            </>
          ) : (
            /* ─── All Projects (disk scan) ─── */
            <>
              <div style={{ marginBottom: 20 }}>
                <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.01em", marginBottom: 4, color: "var(--text-primary)" }}>
                  All Projects
                </h1>
                <p style={{ fontSize: 13, margin: 0, color: "var(--text-muted)" }}>
                  {loadingDisk
                    ? "Scanning for projects…"
                    : diskProjects.length > 0
                      ? `Found ${diskProjects.length} project${diskProjects.length === 1 ? "" : "s"} on disk.`
                      : "No .cmp files found in your projects folder."}
                </p>
              </div>

              {loadingDisk ? (
                <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                    <div style={{
                      width: 28, height: 28, border: "3px solid var(--border-subtle)",
                      borderTopColor: "var(--accent)", borderRadius: "50%",
                      animation: "spin 0.8s linear infinite",
                    }} />
                    <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Scanning…</span>
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                  </div>
                </div>
              ) : diskProjects.length > 0 ? (
                <div style={{ flex: 1, overflowY: "auto", marginLeft: -8, marginRight: -8 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    {diskProjects.map((dp) => (
                      <div
                        key={dp.filePath}
                        onClick={() => {
                          const meta: ProjectMeta = {
                            id: dp.filePath,
                            name: dp.projectName,
                            createdAt: Date.now(),
                            updatedAt: dp.updatedAt,
                            resolution: dp.resolution,
                            trackCount: dp.trackCount,
                            clipCount: dp.clipCount,
                            filePath: dp.filePath,
                          };
                          onOpenProject(meta);
                        }}
                        onMouseEnter={() => setHoveredId(dp.filePath)}
                        onMouseLeave={() => setHoveredId(null)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 14,
                          padding: "10px 14px",
                          borderRadius: 10,
                          cursor: "pointer",
                          transition: "background 0.15s",
                          background: hoveredId === dp.filePath ? "var(--hover-overlay)" : "transparent",
                        }}
                      >
                        <div
                          style={{
                            width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            background: seededGradient(dp.filePath), opacity: 0.85,
                          }}
                        >
                          <HardDrive size={15} style={{ color: "rgba(255,255,255,0.6)" }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <h3 style={{ fontSize: 13, fontWeight: 500, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "var(--text-primary)" }}>
                            {dp.projectName}
                          </h3>
                          <p style={{ fontSize: 11, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "var(--text-muted)" }}>
                            {dp.resolution} · {dp.trackCount} tracks · {dp.clipCount} clips
                          </p>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                          <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{formatDate(dp.updatedAt)}</span>
                          <ChevronRight size={14} style={{ color: "var(--accent)", opacity: hoveredId === dp.filePath ? 1 : 0, transition: "opacity 0.15s" }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                  <div
                    style={{
                      width: 64, height: 64, borderRadius: 16,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      marginBottom: 16, background: "var(--bg-tertiary)",
                      border: "1px solid var(--border-subtle)",
                    }}
                  >
                    <FolderOpen size={28} style={{ color: "var(--text-muted)" }} />
                  </div>
                  <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 6, color: "var(--text-primary)" }}>No projects found</h2>
                  <p style={{ fontSize: 13, marginBottom: 20, textAlign: "center", maxWidth: 280, color: "var(--text-muted)" }}>
                    Make sure your projects folder is set correctly in Settings.
                  </p>
                  <button
                    onClick={() => setShowSettings(true)}
                    style={{
                      display: "flex", alignItems: "center", gap: 8,
                      padding: "10px 24px", borderRadius: 12, fontSize: 13,
                      fontWeight: 500, border: "1px solid var(--border-subtle)",
                      cursor: "pointer", whiteSpace: "nowrap",
                      background: "var(--bg-tertiary)", color: "var(--text-secondary)",
                    }}
                  >
                    <Settings size={15} style={{ flexShrink: 0 }} />
                    Open Settings
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modals */}
      {showSetup && <FirstTimeSetup onComplete={() => setShowSetup(false)} />}
      {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}
      {showNewProject && (
        <NewProjectModal
          onClose={() => setShowNewProject(false)}
          onCreate={(name, res, preset) => handleCreate(name, res, preset)}
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
      onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "var(--hover-subtle)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = active ? "var(--accent-muted)" : "transparent"; }}
    >
      <span style={{ flexShrink: 0, display: "flex" }}>{icon}</span>
      {label}
    </button>
  );
}

export { loadProjects, saveProjects };
