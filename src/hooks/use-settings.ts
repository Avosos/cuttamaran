"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";

// ── Types ────────────────────────────────────────────────
export type AccentColor = "purple" | "orange" | "green";

export interface AppSettings {
  projectsPath: string;
  defaultResolution: string;
  autoSave: boolean;
  theme: "dark" | "light";
  previewQuality: "low" | "medium" | "high";
  accentColor: AccentColor;
}

export const DEFAULT_SETTINGS: AppSettings = {
  projectsPath: "",
  defaultResolution: "1920x1080",
  autoSave: true,
  theme: "dark",
  previewQuality: "high",
  accentColor: "purple",
};

const SETTINGS_KEY = "cuttamaran_settings";

// ── In-memory cache + pub/sub so every subscriber re-renders ──
let cached: AppSettings | null = null;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((fn) => fn());
}

export function loadSettings(): AppSettings {
  if (cached) return cached;
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    cached = raw
      ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) }
      : { ...DEFAULT_SETTINGS };
  } catch {
    cached = { ...DEFAULT_SETTINGS };
  }
  return cached!;
}

export function saveSettings(settings: AppSettings) {
  cached = settings;
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  notify();
  applyTheme(settings.theme);
  applyAccentColor(settings.accentColor);
}

export function updateSetting<K extends keyof AppSettings>(
  key: K,
  value: AppSettings[K]
) {
  const current = loadSettings();
  saveSettings({ ...current, [key]: value });
}

// ── Theme side-effect ────────────────────────────────────
export function applyTheme(theme: "dark" | "light") {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-theme", theme);
}
// ── Accent color side-effect ───────────────────────────────
const ACCENT_GRADIENTS: Record<AccentColor, [string, string]> = {
  purple: ["#7c5cfc", "#e879f9"],
  orange: ["#f97316", "#facc15"],
  green:  ["#22c55e", "#a3e635"],
};

function renderAccentIcon(accent: AccentColor): string | null {
  if (typeof document === "undefined") return null;
  const SIZE = 256;
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  // Gradient background
  const [c1, c2] = ACCENT_GRADIENTS[accent];
  const grad = ctx.createLinearGradient(0, 0, SIZE, SIZE);
  grad.addColorStop(0, c1);
  grad.addColorStop(1, c2);

  // Rounded rect
  const r = 48;
  ctx.beginPath();
  ctx.moveTo(r, 0);
  ctx.lineTo(SIZE - r, 0);
  ctx.quadraticCurveTo(SIZE, 0, SIZE, r);
  ctx.lineTo(SIZE, SIZE - r);
  ctx.quadraticCurveTo(SIZE, SIZE, SIZE - r, SIZE);
  ctx.lineTo(r, SIZE);
  ctx.quadraticCurveTo(0, SIZE, 0, SIZE - r);
  ctx.lineTo(0, r);
  ctx.quadraticCurveTo(0, 0, r, 0);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();

  // Scissors icon (matches icon.svg)
  ctx.save();
  ctx.translate(SIZE / 2, SIZE / 2);
  ctx.scale(5, 5);
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 2.2;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // Circle top-left
  ctx.beginPath();
  ctx.arc(-8, -8, 3, 0, Math.PI * 2);
  ctx.stroke();
  // Circle bottom-left
  ctx.beginPath();
  ctx.arc(-8, 8, 3, 0, Math.PI * 2);
  ctx.stroke();
  // Diagonal lines
  ctx.beginPath();
  ctx.moveTo(-5.5, -5.5);
  ctx.lineTo(8, 8);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-5.5, 5.5);
  ctx.lineTo(8, -8);
  ctx.stroke();

  ctx.restore();

  return canvas.toDataURL("image/png");
}

export function applyAccentColor(accent: AccentColor) {
  if (typeof document === "undefined") return;
  if (accent === "purple") {
    document.documentElement.removeAttribute("data-accent");
  } else {
    document.documentElement.setAttribute("data-accent", accent);
  }

  // Update Electron window icon
  const dataUrl = renderAccentIcon(accent);
  if (dataUrl && typeof window !== "undefined" && window.electronAPI) {
    window.electronAPI.setAccentIcon(dataUrl);
  }
}
// ── React hook ───────────────────────────────────────────
export function useSettings(): [AppSettings, typeof updateSetting] {
  const settings = useSyncExternalStore(
    useCallback((cb: () => void) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    }, []),
    loadSettings,
    () => DEFAULT_SETTINGS
  );

  // Apply theme + accent icon on first client mount
  useEffect(() => {
    applyTheme(settings.theme);
    applyAccentColor(settings.accentColor);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return [settings, updateSetting];
}
