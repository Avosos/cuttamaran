"use client";

import { useCallback, useSyncExternalStore } from "react";

// ── Types ────────────────────────────────────────────────
export interface AppSettings {
  projectsPath: string;
  defaultResolution: string;
  autoSave: boolean;
  theme: "dark" | "light";
  previewQuality: "low" | "medium" | "high";
}

export const DEFAULT_SETTINGS: AppSettings = {
  projectsPath: "",
  defaultResolution: "1920x1080",
  autoSave: true,
  theme: "dark",
  previewQuality: "high",
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

  return [settings, updateSetting];
}
