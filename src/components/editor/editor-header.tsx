"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useEditorStore, CANVAS_PRESETS } from "@/stores/editor-store";
import {
  Undo2,
  Redo2,
  Download,
  Settings,
  Scissors,
  Save,
  ChevronDown,
  X,
  Monitor,
  Moon,
  HardDrive,
  Film,
  FolderOpen,
  Check,
  Palette,
} from "lucide-react";
import WindowControls from "./window-controls";
import MenuBar from "./menu-bar";

export default function EditorHeader() {
  const {
    projectName,
    setProjectName,
    undo,
    redo,
    past,
    future,
    canvasSize,
    setCanvasSize,
    saveProject,
  } = useEditorStore();

  const inputRef = useRef<HTMLInputElement>(null);
  const [hoveredBtn, setHoveredBtn] = useState<string | null>(null);
  const [inputFocused, setInputFocused] = useState(false);
  const [inputHovered, setInputHovered] = useState(false);
  const [exportHovered, setExportHovered] = useState(false);

  // Dropdown / modal state
  const [resDropdownOpen, setResDropdownOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [saveFlash, setSaveFlash] = useState(false);
  const resRef = useRef<HTMLDivElement>(null);

  // Actual save-to-disk handler
  const handleSave = useCallback(async (forceDialog = false) => {
    const ok = await saveProject(forceDialog);
    if (ok) {
      setSaveFlash(true);
      setTimeout(() => setSaveFlash(false), 1500);
    }
  }, [saveProject]);



  // Listen for custom events from MenuBar to open modals
  useEffect(() => {
    const onExport = () => setShowExport(true);
    const onSettings = () => setShowSettings(true);
    window.addEventListener("cuttamaran:open-export", onExport);
    window.addEventListener("cuttamaran:open-settings", onSettings);
    return () => {
      window.removeEventListener("cuttamaran:open-export", onExport);
      window.removeEventListener("cuttamaran:open-settings", onSettings);
    };
  }, []);

  // Close resolution dropdown on click outside
  useEffect(() => {
    if (!resDropdownOpen) return;
    const handler = (e: MouseEvent) => {
      if (resRef.current && !resRef.current.contains(e.target as Node)) {
        setResDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [resDropdownOpen]);

  const iconBtnStyle = (id: string, disabled?: boolean): React.CSSProperties => ({
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 8,
    borderRadius: 8,
    border: "none",
    background: hoveredBtn === id && !disabled ? "var(--hover-overlay)" : "transparent",
    cursor: disabled ? "default" : "pointer",
    opacity: disabled ? 0.3 : 1,
    transition: "all 0.15s",
  });

  return (
    <header
      style={{
        display: "flex",
        flexShrink: 0,
        alignItems: "center",
        justifyContent: "space-between",
        height: 44,
        paddingLeft: 20,
        paddingRight: 0,
        background: "var(--bg-secondary)",
        borderBottom: "1px solid var(--border-subtle)",
        WebkitAppRegion: "drag",
      } as React.CSSProperties}
    >
      {/* Left section - Logo & Menu Bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, WebkitAppRegion: "no-drag" } as React.CSSProperties}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "var(--accent-gradient-vibrant)",
            }}
          >
            <Scissors size={14} style={{ color: "#ffffff" }} />
          </div>
          <span
            style={{
              fontSize: 14,
              fontWeight: 600,
              letterSpacing: "-0.02em",
              background: "var(--accent-gradient-vibrant)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            } as React.CSSProperties}
          >
            Cuttamaran
          </span>
        </div>

        <div style={{ width: 1, height: 20, background: "var(--border-default)" }} />

        <MenuBar />
      </div>

      {/* Center section - Project name & Resolution */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, WebkitAppRegion: "no-drag" } as React.CSSProperties}>
        <input
          ref={inputRef}
          type="text"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          onFocus={() => setInputFocused(true)}
          onBlur={() => setInputFocused(false)}
          onMouseEnter={() => setInputHovered(true)}
          onMouseLeave={() => setInputHovered(false)}
          style={{
            fontSize: 14,
            background: inputFocused || inputHovered ? "var(--hover-overlay)" : "transparent",
            border: "none",
            outline: "none",
            padding: "4px 8px",
            borderRadius: 6,
            color: "var(--text-secondary)",
            width: 180,
            textAlign: "center",
            transition: "background 0.15s",
          }}
        />

        <div ref={resRef} style={{ position: "relative" }}>
          <button
            onClick={() => setResDropdownOpen((v) => !v)}
            onMouseEnter={() => setHoveredBtn("res")}
            onMouseLeave={() => setHoveredBtn(null)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              fontSize: 11,
              padding: "2px 8px",
              borderRadius: 4,
              color: "var(--text-muted)",
              background: resDropdownOpen ? "var(--bg-hover)" : hoveredBtn === "res" ? "var(--bg-hover)" : "var(--bg-tertiary)",
              border: "1px solid var(--border-subtle)",
              cursor: "pointer",
              transition: "background 0.15s",
            }}
          >
            {canvasSize.width}×{canvasSize.height}
            <ChevronDown size={12} style={{ transform: resDropdownOpen ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.15s" }} />
          </button>

          {resDropdownOpen && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 6px)",
                right: 0,
                width: 200,
                borderRadius: 10,
                padding: 4,
                background: "var(--bg-secondary)",
                border: "1px solid var(--border-subtle)",
                boxShadow: "var(--shadow-dropdown)",
                zIndex: 100,
              }}
            >
              {CANVAS_PRESETS.map((preset) => {
                const active = canvasSize.width === preset.width && canvasSize.height === preset.height;
                return (
                  <button
                    key={preset.name}
                    onClick={() => { setCanvasSize(preset); setResDropdownOpen(false); }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      width: "100%",
                      padding: "7px 10px",
                      borderRadius: 6,
                      border: "none",
                      cursor: "pointer",
                      fontSize: 12,
                      color: active ? "var(--accent-hover)" : "var(--text-secondary)",
                      background: active ? "var(--accent-muted)" : "transparent",
                      transition: "background 0.12s",
                    }}
                    onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "var(--hover-overlay)"; }}
                    onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}
                  >
                    <span>{preset.name}</span>
                    <span style={{ fontSize: 10, color: "var(--text-muted)" }}>{preset.width}×{preset.height}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right section - Undo/Redo, Save, Export & Window Controls */}
      <div style={{ display: "flex", alignItems: "center", gap: 4, WebkitAppRegion: "no-drag" } as React.CSSProperties}>
        <button
          onClick={undo}
          disabled={past.length === 0}
          onMouseEnter={() => setHoveredBtn("undo")}
          onMouseLeave={() => setHoveredBtn(null)}
          style={iconBtnStyle("undo", past.length === 0)}
          title="Undo (Ctrl+Z)"
        >
          <Undo2 size={16} style={{ color: "var(--text-secondary)" }} />
        </button>
        <button
          onClick={redo}
          disabled={future.length === 0}
          onMouseEnter={() => setHoveredBtn("redo")}
          onMouseLeave={() => setHoveredBtn(null)}
          style={iconBtnStyle("redo", future.length === 0)}
          title="Redo (Ctrl+Shift+Z)"
        >
          <Redo2 size={16} style={{ color: "var(--text-secondary)" }} />
        </button>

        <div style={{ width: 1, height: 20, margin: "0 4px", background: "var(--border-default)" }} />

        <div style={{ position: "relative" }}>
          <button
            onClick={() => handleSave()}
            onMouseEnter={() => setHoveredBtn("save")}
            onMouseLeave={() => setHoveredBtn(null)}
            style={iconBtnStyle("save")}
            title="Save Project (Ctrl+S)"
          >
            {saveFlash ? (
              <Check size={16} style={{ color: "var(--success)" }} />
            ) : (
              <Save size={16} style={{ color: "var(--success)" }} />
            )}
          </button>
          {saveFlash && (
            <span
              style={{
                position: "absolute",
                top: "calc(100% + 4px)",
                left: "50%",
                transform: "translateX(-50%)",
                fontSize: 10,
                fontWeight: 500,
                color: "var(--success)",
                background: "var(--bg-secondary)",
                border: "1px solid var(--border-subtle)",
                borderRadius: 6,
                padding: "3px 8px",
                whiteSpace: "nowrap",
                zIndex: 100,
                pointerEvents: "none",
              }}
            >
              Saved!
            </span>
          )}
        </div>

        <div style={{ width: 1, height: 20, margin: "0 4px", background: "var(--border-default)" }} />

        <button
          onClick={() => setShowExport(true)}
          onMouseEnter={() => setExportHovered(true)}
          onMouseLeave={() => setExportHovered(false)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 500,
            padding: "6px 16px",
            background: "var(--accent-gradient)",
            color: "#ffffff",
            border: "none",
            cursor: "pointer",
            boxShadow: exportHovered
              ? "0 4px 20px var(--accent-glow)"
              : "0 2px 12px var(--accent-glow)",
            transform: exportHovered ? "translateY(-1px)" : "translateY(0)",
            transition: "all 0.15s",
          }}
        >
          <Download size={14} />
          Export
        </button>

        <div style={{ width: 1, height: 20, margin: "0 4px", background: "var(--border-default)" }} />

        <WindowControls />
      </div>

      {/* Settings Modal */}
      {showSettings && <EditorSettingsModal onClose={() => setShowSettings(false)} />}

      {/* Export Modal */}
      {showExport && <ExportModal onClose={() => setShowExport(false)} />}
    </header>
  );
}

// ─── Settings Modal (Editor) ────────────────────────────
import { useSettings, type AppSettings, updateSetting as updateSettingGlobal } from "@/hooks/use-settings";

function EditorSettingsModal({ onClose }: { onClose: () => void }) {
  const [settings] = useSettings();
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const [closeBtnHovered, setCloseBtnHovered] = useState(false);

  const updateSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    updateSettingGlobal(key, value);
  };

  const handleBrowseFolder = async () => {
    const result = await (window as Window & { electronAPI?: { openFolderDialog?: (opts: { title: string }) => Promise<{ canceled: boolean; filePaths: string[] }> } }).electronAPI?.openFolderDialog({
      title: "Choose Projects Folder",
    });
    if (result && !result.canceled && result.filePaths[0]) {
      updateSetting("projectsPath", result.filePaths[0]);
    }
  };

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const rowStyle = (id: string): React.CSSProperties => ({
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "8px 12px",
    borderRadius: 8,
    background: hoveredRow === id ? "var(--hover-subtle)" : "transparent",
    transition: "background 0.12s",
  });

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(6,6,10,0.85)",
        backdropFilter: "blur(8px)",
        WebkitAppRegion: "no-drag",
      } as React.CSSProperties}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
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
            onMouseEnter={() => setCloseBtnHovered(true)}
            onMouseLeave={() => setCloseBtnHovered(false)}
            style={{ padding: 6, borderRadius: 8, background: closeBtnHovered ? "var(--hover-overlay)" : "transparent", border: "none", cursor: "pointer", transition: "background 0.12s" }}
          >
            <X size={16} style={{ color: "var(--text-muted)" }} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "20px 24px", maxHeight: 420, overflowY: "auto", display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Storage */}
          <div>
            <h3 style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12, color: "var(--text-muted)" }}>Storage</h3>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", borderRadius: 8, background: "var(--bg-tertiary)" }}>
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
                style={{ fontSize: 12, padding: "6px 12px", borderRadius: 6, flexShrink: 0, marginLeft: 12, border: "none", cursor: "pointer", background: "var(--accent-muted)", color: "var(--accent-hover)" }}
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
              {/* Auto-Save */}
              <div
                style={rowStyle("autosave")}
                onMouseEnter={() => setHoveredRow("autosave")}
                onMouseLeave={() => setHoveredRow(null)}
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
                  <div style={{
                    position: "absolute",
                    top: 2,
                    width: 14,
                    height: 14,
                    borderRadius: 7,
                    transition: "left 0.2s, background 0.2s",
                    background: settings.autoSave ? "white" : "var(--text-muted)",
                    left: settings.autoSave ? "calc(100% - 18px)" : 2,
                  }} />
                </button>
              </div>

              {/* Theme */}
              <div
                style={rowStyle("theme")}
                onMouseEnter={() => setHoveredRow("theme")}
                onMouseLeave={() => setHoveredRow(null)}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <Moon size={15} style={{ color: "var(--text-muted)" }} />
                  <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>Theme</span>
                </div>
                <SettingsDropdown
                  value={settings.theme}
                  options={[{ label: "Dark", value: "dark" }, { label: "Light", value: "light" }]}
                  onChange={(v) => updateSetting("theme", v as "dark" | "light")}
                />
              </div>

              {/* Accent Color */}
              <div
                style={rowStyle("accent")}
                onMouseEnter={() => setHoveredRow("accent")}
                onMouseLeave={() => setHoveredRow(null)}
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
                style={rowStyle("quality")}
                onMouseEnter={() => setHoveredRow("quality")}
                onMouseLeave={() => setHoveredRow(null)}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <Film size={15} style={{ color: "var(--text-muted)" }} />
                  <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>Preview Quality</span>
                </div>
                <SettingsDropdown
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
                <Scissors size={14} style={{ color: "#ffffff" }} />
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

// ─── Settings Dropdown (mini) ───────────────────────────
function SettingsDropdown({ value, options, onChange }: { value: string; options: { label: string; value: string }[]; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState<string | null>(null);

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
        onClick={() => setOpen((v) => !v)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          fontSize: 12,
          padding: "4px 10px",
          borderRadius: 6,
          border: "1px solid var(--border-subtle)",
          background: "var(--bg-tertiary)",
          color: "var(--text-secondary)",
          cursor: "pointer",
          minWidth: 90,
          justifyContent: "space-between",
        }}
      >
        {selected?.label ?? value}
        <ChevronDown size={11} style={{ color: "var(--text-muted)", transform: open ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.15s" }} />
      </button>
      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            right: 0,
            minWidth: "100%",
            borderRadius: 8,
            padding: 3,
            background: "var(--bg-secondary)",
            border: "1px solid var(--border-subtle)",
            boxShadow: "var(--shadow-dropdown)",
            zIndex: 300,
          }}
        >
          {options.map((o) => (
            <button
              key={o.value}
              onClick={() => { onChange(o.value); setOpen(false); }}
              onMouseEnter={() => setHovered(o.value)}
              onMouseLeave={() => setHovered(null)}
              style={{
                display: "block",
                width: "100%",
                padding: "6px 10px",
                borderRadius: 5,
                border: "none",
                fontSize: 12,
                textAlign: "left",
                cursor: "pointer",
                color: o.value === value ? "var(--accent-hover)" : "var(--text-secondary)",
                background: o.value === value ? "var(--accent-muted)" : hovered === o.value ? "var(--hover-overlay)" : "transparent",
                transition: "background 0.1s",
              }}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Export Modal ────────────────────────────────────────
const EXPORT_FORMATS = [
  { value: "mp4", label: "MP4", desc: "H.264 — best compatibility" },
  { value: "webm", label: "WebM", desc: "VP9 — smaller file size" },
  { value: "mov", label: "MOV", desc: "ProRes — editing & Apple" },
  { value: "gif", label: "GIF", desc: "Animated — social media" },
];

const EXPORT_QUALITY = [
  { value: "low", label: "Draft", desc: "720p — fast render" },
  { value: "medium", label: "Standard", desc: "1080p — balanced" },
  { value: "high", label: "High", desc: "Original — best quality" },
];

/** Map quality preset → resolution scale & fps */
function resolveExportSettings(
  quality: string,
  canvasW: number,
  canvasH: number
) {
  switch (quality) {
    case "low":
      return { width: 1280, height: Math.round(1280 * (canvasH / canvasW)), fps: 24 };
    case "medium":
      return { width: 1920, height: Math.round(1920 * (canvasH / canvasW)), fps: 30 };
    default: // "high"
      return { width: canvasW, height: canvasH, fps: 30 };
  }
}

function ExportModal({ onClose }: { onClose: () => void }) {
  const { projectName, canvasSize, tracks, duration, mediaFiles } = useEditorStore();
  const [format, setFormat] = useState("mp4");
  const [quality, setQuality] = useState("high");
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("");
  const [done, setDone] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [closeBtnHovered, setCloseBtnHovered] = useState(false);
  const [exportBtnHovered, setExportBtnHovered] = useState(false);
  const cancelledRef = useRef(false);

  // Listen for IPC progress / done / error
  useEffect(() => {
    const api = window.electronAPI;
    if (!api) return;
    const unsubs = [
      api.onExportProgress((data) => {
        setProgress(data.percent);
        setStatusText(`Frame ${data.framesWritten} / ${data.totalFrames}`);
      }),
      api.onExportDone((_data) => {
        setExporting(false);
        setProgress(100);
        setDone(true);
        setStatusText("Export complete!");
      }),
      api.onExportError((msg) => {
        setExporting(false);
        setErrorMsg(msg);
        setStatusText("Export failed");
      }),
    ];
    return () => unsubs.forEach((fn) => fn());
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !exporting) onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose, exporting]);

  // ── Render every frame on an offscreen canvas and push to FFmpeg ──
  const handleExport = useCallback(async () => {
    const api = window.electronAPI;
    if (!api) {
      setErrorMsg("Export requires the Electron desktop app.");
      return;
    }

    // Ask user where to save
    const result = await api.saveFileDialog({
      defaultPath: `${projectName}.${format}`,
      filters: [
        { name: format.toUpperCase(), extensions: [format] },
      ],
    });
    if (result.canceled || !result.filePath) return;

    cancelledRef.current = false;
    setExporting(true);
    setProgress(0);
    setDone(false);
    setErrorMsg(null);
    setStatusText("Preparing…");

    const { width, height, fps } = resolveExportSettings(
      quality,
      canvasSize.width,
      canvasSize.height
    );
    // Ensure even dimensions (required by most codecs)
    const w = width % 2 === 0 ? width : width + 1;
    const h = height % 2 === 0 ? height : height + 1;
    const totalFrames = Math.ceil(duration * fps);

    // Collect audio clips with local file paths.
    // Include both standalone audio clips AND video clips that carry audio.
    // Prefer diskPath (real filesystem path) over the local-media:// URL for FFmpeg.
    const audioClips = tracks.flatMap((track) =>
      track.clips
        .filter((c) => (c.type === "audio" || c.type === "video") && c.src && !c.src.startsWith("blob:"))
        .map((c) => {
          // Look up the source media file to get diskPath
          const media = mediaFiles.find((m) => m.id === c.mediaId);
          return {
            src: media?.diskPath || c.src,
            startTime: c.startTime,
            duration: c.duration,
            trimStart: c.trimStart,
            volume: track.muted ? 0 : (c.volume ?? 1),
          };
        })
    );

    // Tell main process to spawn FFmpeg
    const startResult = await api.exportStart({
      outputPath: result.filePath,
      fps,
      width: w,
      height: h,
      format,
      quality,
      totalFrames,
      audioClips,
    });
    if (!startResult.ok) {
      setExporting(false);
      setErrorMsg(startResult.error ?? "Failed to start FFmpeg.");
      return;
    }

    // ── Frame-by-frame rendering ────────────────────────
    const offscreen = document.createElement("canvas");
    offscreen.width = w;
    offscreen.height = h;
    const ctx = offscreen.getContext("2d")!;

    // Pre-load video & image elements that are on the timeline
    const mediaElements = new Map<string, HTMLVideoElement | HTMLImageElement>();
    const loadPromises: Promise<void>[] = [];
    for (const track of tracks) {
      for (const clip of track.clips) {
        if (!clip.src || clip.src.length === 0) continue;
        if (clip.type === "video") {
          const video = document.createElement("video");
          video.src = clip.src;
          video.muted = true;
          video.preload = "auto";
          const p = new Promise<void>((res) => {
            video.addEventListener("loadeddata", () => res(), { once: true });
            video.addEventListener("error", () => res(), { once: true });
          });
          loadPromises.push(p);
          mediaElements.set(clip.id, video);
        } else if (clip.type === "image") {
          const img = new window.Image();
          img.src = clip.thumbnail || clip.src;
          const p = new Promise<void>((res) => {
            img.addEventListener("load", () => res(), { once: true });
            img.addEventListener("error", () => res(), { once: true });
          });
          loadPromises.push(p);
          mediaElements.set(clip.id, img);
        }
      }
    }
    setStatusText("Loading media…");
    await Promise.all(loadPromises);

    // Helper: seek a video and wait for it to be ready
    const seekVideo = (video: HTMLVideoElement, time: number) =>
      new Promise<void>((res) => {
        if (Math.abs(video.currentTime - time) < 0.01) { res(); return; }
        video.addEventListener("seeked", () => res(), { once: true });
        video.currentTime = time;
      });

    setStatusText("Rendering…");

    for (let frame = 0; frame < totalFrames; frame++) {
      if (cancelledRef.current) break;

      const time = frame / fps;

      // Clear to black
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, w, h);

      // Determine active clips at this time
      for (const track of tracks) {
        if (!track.visible) continue;
        for (const clip of track.clips) {
          const clipEnd = clip.startTime + clip.duration;
          if (time < clip.startTime || time >= clipEnd) continue;

          const mediaTime = time - clip.startTime + clip.trimStart;

          if (clip.type === "video") {
            const video = mediaElements.get(clip.id) as HTMLVideoElement | undefined;
            if (video && video.readyState >= 2) {
              await seekVideo(video, mediaTime);
              const vAspect = video.videoWidth / video.videoHeight;
              const cAspect = w / h;
              let dw: number, dh: number, dx: number, dy: number;
              if (vAspect > cAspect) {
                dw = w; dh = w / vAspect; dx = 0; dy = (h - dh) / 2;
              } else {
                dh = h; dw = h * vAspect; dx = (w - dw) / 2; dy = 0;
              }
              ctx.globalAlpha = clip.opacity ?? 1;
              ctx.drawImage(video, dx, dy, dw, dh);
              ctx.globalAlpha = 1;
            }
          } else if (clip.type === "image") {
            const img = mediaElements.get(clip.id) as HTMLImageElement | undefined;
            if (img && img.complete && img.naturalWidth > 0) {
              const iAspect = img.naturalWidth / img.naturalHeight;
              const cAspect = w / h;
              let dw: number, dh: number, dx: number, dy: number;
              if (iAspect > cAspect) {
                dw = w; dh = w / iAspect; dx = 0; dy = (h - dh) / 2;
              } else {
                dh = h; dw = h * iAspect; dx = (w - dw) / 2; dy = 0;
              }
              ctx.globalAlpha = clip.opacity ?? 1;
              ctx.drawImage(img, dx, dy, dw, dh);
              ctx.globalAlpha = 1;
            }
          } else if (clip.type === "text") {
            const fontSize = clip.fontSize || 48;
            ctx.font = `bold ${fontSize}px ${clip.fontFamily || "Inter"}, sans-serif`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            if (clip.backgroundColor) {
              const tm = ctx.measureText(clip.text || "");
              const pad = 16;
              ctx.fillStyle = clip.backgroundColor;
              ctx.beginPath();
              ctx.roundRect(
                w / 2 - tm.width / 2 - pad,
                h / 2 - fontSize / 2 - pad / 2,
                tm.width + pad * 2,
                fontSize + pad,
                8
              );
              ctx.fill();
            }
            ctx.fillStyle = clip.color || "#ffffff";
            ctx.fillText(clip.text || "", w / 2, h / 2);
          }
        }
      }

      // Encode the frame as PNG and push to FFmpeg
      const blob = await new Promise<Blob>((res) =>
        offscreen.toBlob((b) => res(b!), "image/png")
      );
      const arrayBuffer = await blob.arrayBuffer();
      await api.exportPushFrame(arrayBuffer);
    }

    if (!cancelledRef.current) {
      await api.exportFinish();
    }

    // Cleanup media elements
    for (const el of mediaElements.values()) {
      if (el instanceof HTMLVideoElement) {
        el.pause();
        el.removeAttribute("src");
        el.load();
      }
    }
    mediaElements.clear();
  }, [projectName, format, quality, canvasSize, tracks, duration, mediaFiles]);

  const handleCancel = useCallback(async () => {
    cancelledRef.current = true;
    await window.electronAPI?.exportCancel();
    setExporting(false);
    setStatusText("Cancelled");
  }, []);

  const qualityLabel = EXPORT_QUALITY.find((q) => q.value === quality);
  const formatLabel = EXPORT_FORMATS.find((f) => f.value === format);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(6,6,10,0.85)",
        backdropFilter: "blur(8px)",
        WebkitAppRegion: "no-drag",
      } as React.CSSProperties}
      onClick={(e) => { if (e.target === e.currentTarget && !exporting) onClose(); }}
    >
      <div
        style={{
          width: 480,
          borderRadius: 16,
          overflow: "hidden",
          background: "var(--bg-secondary)",
          border: "1px solid var(--border-subtle)",
          boxShadow: "var(--shadow-heavy)",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 24px", borderBottom: "1px solid var(--border-subtle)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Download size={18} style={{ color: "var(--accent)" }} />
            <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0, color: "var(--text-primary)" }}>Export Project</h2>
          </div>
          <button
            onClick={onClose}
            onMouseEnter={() => setCloseBtnHovered(true)}
            onMouseLeave={() => setCloseBtnHovered(false)}
            style={{ padding: 6, borderRadius: 8, background: closeBtnHovered ? "var(--hover-overlay)" : "transparent", border: "none", cursor: "pointer", transition: "background 0.12s", opacity: exporting ? 0.3 : 1, pointerEvents: exporting ? "none" : "auto" }}
          >
            <X size={16} style={{ color: "var(--text-muted)" }} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Project info */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 8, background: "var(--bg-tertiary)" }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--accent-gradient-vibrant)" }}>
              <Film size={16} style={{ color: "#ffffff" }} />
            </div>
            <div>
              <span style={{ fontSize: 13, fontWeight: 500, display: "block", color: "var(--text-primary)" }}>{projectName}</span>
              <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{canvasSize.width}×{canvasSize.height} • {canvasSize.name}</span>
            </div>
          </div>

          {!done && (
            <>
              {/* Format */}
              <div>
                <h3 style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10, color: "var(--text-muted)" }}>Format</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {EXPORT_FORMATS.map((f) => {
                    const active = format === f.value;
                    return (
                      <button
                        key={f.value}
                        onClick={() => !exporting && setFormat(f.value)}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "flex-start",
                          padding: "10px 12px",
                          borderRadius: 8,
                          textAlign: "left",
                          cursor: exporting ? "default" : "pointer",
                          border: `1px solid ${active ? "var(--accent)" : "var(--border-subtle)"}`,
                          background: active ? "var(--accent-muted)" : "var(--bg-tertiary)",
                          opacity: exporting ? 0.5 : 1,
                          transition: "border-color 0.15s, background 0.15s",
                        }}
                      >
                        <span style={{ fontSize: 12, fontWeight: 500, color: active ? "var(--accent-hover)" : "var(--text-secondary)" }}>{f.label}</span>
                        <span style={{ fontSize: 10, color: "var(--text-muted)" }}>{f.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Quality */}
              <div>
                <h3 style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10, color: "var(--text-muted)" }}>Quality</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                  {EXPORT_QUALITY.map((q) => {
                    const active = quality === q.value;
                    return (
                      <button
                        key={q.value}
                        onClick={() => !exporting && setQuality(q.value)}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "flex-start",
                          padding: "10px 12px",
                          borderRadius: 8,
                          textAlign: "left",
                          cursor: exporting ? "default" : "pointer",
                          border: `1px solid ${active ? "var(--accent)" : "var(--border-subtle)"}`,
                          background: active ? "var(--accent-muted)" : "var(--bg-tertiary)",
                          opacity: exporting ? 0.5 : 1,
                          transition: "border-color 0.15s, background 0.15s",
                        }}
                      >
                        <span style={{ fontSize: 12, fontWeight: 500, color: active ? "var(--accent-hover)" : "var(--text-secondary)" }}>{q.label}</span>
                        <span style={{ fontSize: 10, color: "var(--text-muted)" }}>{q.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* Progress bar */}
          {(exporting || done || errorMsg) && (
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: errorMsg ? "#ef4444" : "var(--text-secondary)" }}>
                  {errorMsg ? "Export failed" : done ? "Export complete!" : `Exporting ${formatLabel?.label ?? format.toUpperCase()}…`}
                </span>
                <span style={{ fontSize: 11, fontWeight: 500, color: done ? "var(--success)" : errorMsg ? "#ef4444" : "var(--text-muted)" }}>
                  {errorMsg ? "!" : `${Math.min(Math.round(progress), 100)}%`}
                </span>
              </div>
              <div style={{ height: 6, borderRadius: 3, background: "var(--bg-tertiary)", overflow: "hidden" }}>
                <div
                  style={{
                    height: "100%",
                    borderRadius: 3,
                    width: `${Math.min(progress, 100)}%`,
                    background: errorMsg ? "#ef4444" : done ? "var(--success)" : "var(--accent-gradient-bar)",
                    transition: "width 0.2s ease-out",
                  }}
                />
              </div>
              {statusText && (
                <p style={{ fontSize: 11, marginTop: 8, color: "var(--text-muted)" }}>
                  {statusText}
                </p>
              )}
              {errorMsg && (
                <p style={{ fontSize: 11, marginTop: 4, color: "#ef4444", whiteSpace: "pre-wrap", maxHeight: 80, overflow: "auto" }}>
                  {errorMsg}
                </p>
              )}
              {done && (
                <p style={{ fontSize: 11, marginTop: 8, color: "var(--text-muted)" }}>
                  {projectName}.{format} • {qualityLabel?.label} quality • {canvasSize.width}×{canvasSize.height}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, padding: "16px 24px", borderTop: "1px solid var(--border-subtle)" }}>
          {done ? (
            <button
              onClick={onClose}
              onMouseEnter={() => setExportBtnHovered(true)}
              onMouseLeave={() => setExportBtnHovered(false)}
              style={{
                padding: "8px 20px",
                fontSize: 13,
                fontWeight: 500,
                borderRadius: 8,
                border: "none",
                cursor: "pointer",
                background: "var(--success)",
                color: "#ffffff",
                boxShadow: exportBtnHovered ? "0 4px 16px rgba(34,197,94,0.4)" : "0 2px 8px rgba(34,197,94,0.2)",
                transition: "box-shadow 0.15s",
              }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Check size={14} />
                Done
              </span>
            </button>
          ) : (
            <>
              <button
                onClick={exporting ? handleCancel : onClose}
                style={{
                  padding: "8px 16px",
                  fontSize: 13,
                  borderRadius: 8,
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--text-secondary)",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "var(--hover-overlay)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
              >
                {exporting ? "Cancel" : "Close"}
              </button>
              <button
                onClick={handleExport}
                disabled={exporting}
                onMouseEnter={() => !exporting && setExportBtnHovered(true)}
                onMouseLeave={() => setExportBtnHovered(false)}
                style={{
                  padding: "8px 20px",
                  fontSize: 13,
                  fontWeight: 500,
                  borderRadius: 8,
                  border: "none",
                  cursor: exporting ? "default" : "pointer",
                  background: "var(--accent-gradient)",
                  color: "#ffffff",
                  opacity: exporting ? 0.6 : 1,
                  boxShadow: exportBtnHovered && !exporting ? "0 4px 20px var(--accent-glow)" : "0 2px 12px var(--accent-glow)",
                  transition: "all 0.15s",
                }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Download size={14} />
                  {exporting ? "Exporting…" : "Export"}
                </span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
