import { create } from "zustand";

// ─── Action IDs ─────────────────────────────────────────
export type ShortcutAction =
  // Playback
  | "play_pause"
  | "back_1s"
  | "forward_1s"
  | "back_5s"
  | "forward_5s"
  | "go_to_start"
  | "go_to_end"
  // Editing
  | "undo"
  | "redo"
  | "split_clip"
  | "delete_clip"
  | "duplicate_clip"
  | "select_all"
  | "deselect"
  // File
  | "new_project"
  | "open_project"
  | "save"
  | "save_as"
  | "export"
  // Navigation
  | "next_clip"
  | "prev_clip"
  | "next_clip_end"
  // View
  | "zoom_in"
  | "zoom_out"
  | "reset_zoom"
  // General
  | "toggle_shortcuts";

// ─── Binding Shape ──────────────────────────────────────
export interface ShortcutBinding {
  key: string; // e.g. "z", "ArrowLeft", " ", "Delete"
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
}

// ─── Metadata for display ───────────────────────────────
export interface ShortcutMeta {
  action: ShortcutAction;
  label: string;
  category: "Playback" | "Editing" | "File" | "Navigation" | "View" | "General";
}

export const SHORTCUT_META: ShortcutMeta[] = [
  // Playback
  { action: "play_pause", label: "Play / Pause", category: "Playback" },
  { action: "back_1s", label: "Back 1 second", category: "Playback" },
  { action: "forward_1s", label: "Forward 1 second", category: "Playback" },
  { action: "back_5s", label: "Back 5 seconds", category: "Playback" },
  { action: "forward_5s", label: "Forward 5 seconds", category: "Playback" },
  { action: "go_to_start", label: "Go to start", category: "Playback" },
  { action: "go_to_end", label: "Go to end", category: "Playback" },
  // Editing
  { action: "undo", label: "Undo", category: "Editing" },
  { action: "redo", label: "Redo", category: "Editing" },
  { action: "split_clip", label: "Split clip at playhead", category: "Editing" },
  { action: "delete_clip", label: "Delete selected clip", category: "Editing" },
  { action: "duplicate_clip", label: "Duplicate clip", category: "Editing" },
  { action: "select_all", label: "Select all", category: "Editing" },
  { action: "deselect", label: "Deselect", category: "Editing" },
  // File
  { action: "new_project", label: "New project", category: "File" },
  { action: "open_project", label: "Open project", category: "File" },
  { action: "save", label: "Save", category: "File" },
  { action: "save_as", label: "Save As…", category: "File" },
  { action: "export", label: "Export…", category: "File" },
  // Navigation
  { action: "next_clip", label: "Next clip", category: "Navigation" },
  { action: "prev_clip", label: "Previous clip", category: "Navigation" },
  { action: "next_clip_end", label: "Next clip end", category: "Navigation" },
  // View
  { action: "zoom_in", label: "Zoom in", category: "View" },
  { action: "zoom_out", label: "Zoom out", category: "View" },
  { action: "reset_zoom", label: "Reset zoom", category: "View" },
  // General
  { action: "toggle_shortcuts", label: "Toggle shortcuts panel", category: "General" },
];

// ─── Default Bindings ───────────────────────────────────
export const DEFAULT_SHORTCUTS: Record<ShortcutAction, ShortcutBinding> = {
  // Playback
  play_pause: { key: " " },
  back_1s: { key: "ArrowLeft" },
  forward_1s: { key: "ArrowRight" },
  back_5s: { key: "ArrowLeft", shift: true },
  forward_5s: { key: "ArrowRight", shift: true },
  go_to_start: { key: "Home" },
  go_to_end: { key: "End" },
  // Editing
  undo: { key: "z", ctrl: true },
  redo: { key: "z", ctrl: true, shift: true },
  split_clip: { key: "b", ctrl: true },
  delete_clip: { key: "Delete" },
  duplicate_clip: { key: "d", ctrl: true },
  select_all: { key: "a", ctrl: true },
  deselect: { key: "Escape" },
  // File
  new_project: { key: "n", ctrl: true },
  open_project: { key: "o", ctrl: true },
  save: { key: "s", ctrl: true },
  save_as: { key: "s", ctrl: true, shift: true },
  export: { key: "e", ctrl: true },
  // Navigation
  next_clip: { key: "ArrowRight", ctrl: true },
  prev_clip: { key: "ArrowLeft", ctrl: true },
  next_clip_end: { key: "ArrowRight", ctrl: true, shift: true },
  // View
  zoom_in: { key: "=", ctrl: true },
  zoom_out: { key: "-", ctrl: true },
  reset_zoom: { key: "0", ctrl: true },
  // General
  toggle_shortcuts: { key: "?" },
};

// ─── Helpers ────────────────────────────────────────────

/** Check if a KeyboardEvent matches a ShortcutBinding */
export function matchesShortcut(e: KeyboardEvent, binding: ShortcutBinding): boolean {
  const ctrl = !!(binding.ctrl);
  const shift = !!(binding.shift);
  const alt = !!(binding.alt);

  if ((e.ctrlKey || e.metaKey) !== ctrl) return false;
  if (e.shiftKey !== shift) return false;
  if (e.altKey !== alt) return false;

  // Case-insensitive for letter keys
  if (binding.key.length === 1) {
    return e.key.toLowerCase() === binding.key.toLowerCase();
  }
  return e.key === binding.key;
}

/** Pretty-print key names for display */
const KEY_DISPLAY: Record<string, string> = {
  " ": "Space",
  ArrowLeft: "←",
  ArrowRight: "→",
  ArrowUp: "↑",
  ArrowDown: "↓",
  Escape: "Esc",
  Delete: "Del",
  Backspace: "⌫",
  Enter: "Enter",
  Tab: "Tab",
  Home: "Home",
  End: "End",
  PageUp: "PgUp",
  PageDown: "PgDn",
  "?": "?",
};

/** Format a binding into a human-readable string like "Ctrl+Shift+Z" */
export function formatShortcut(binding: ShortcutBinding): string {
  const parts: string[] = [];
  if (binding.ctrl) parts.push("Ctrl");
  if (binding.alt) parts.push("Alt");
  if (binding.shift) parts.push("Shift");
  const keyDisplay = KEY_DISPLAY[binding.key] ?? binding.key.toUpperCase();
  parts.push(keyDisplay);
  return parts.join("+");
}

/** Format a binding into an array of key labels (for rendering <kbd> elements) */
export function formatShortcutKeys(binding: ShortcutBinding): string[] {
  const parts: string[] = [];
  if (binding.ctrl) parts.push("Ctrl");
  if (binding.alt) parts.push("Alt");
  if (binding.shift) parts.push("Shift");
  const keyDisplay = KEY_DISPLAY[binding.key] ?? binding.key.toUpperCase();
  parts.push(keyDisplay);
  return parts;
}

/** Convert a KeyboardEvent into a ShortcutBinding (for recording) */
export function eventToBinding(e: KeyboardEvent): ShortcutBinding | null {
  // Ignore bare modifier keys
  if (["Control", "Shift", "Alt", "Meta"].includes(e.key)) return null;

  return {
    key: e.key,
    ...(e.ctrlKey || e.metaKey ? { ctrl: true } : {}),
    ...(e.shiftKey ? { shift: true } : {}),
    ...(e.altKey ? { alt: true } : {}),
  };
}

// ─── Persistence ────────────────────────────────────────
const STORAGE_KEY = "cuttamaran_shortcuts";

function loadShortcuts(): Record<ShortcutAction, ShortcutBinding> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Merge with defaults to ensure new shortcuts added in updates exist
      return { ...DEFAULT_SHORTCUTS, ...parsed };
    }
  } catch {
    // ignore
  }
  return { ...DEFAULT_SHORTCUTS };
}

function saveShortcuts(shortcuts: Record<ShortcutAction, ShortcutBinding>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(shortcuts));
  } catch {
    // ignore
  }
}

// ─── Store ──────────────────────────────────────────────
interface ShortcutStore {
  shortcuts: Record<ShortcutAction, ShortcutBinding>;
  setShortcut: (action: ShortcutAction, binding: ShortcutBinding) => void;
  resetShortcut: (action: ShortcutAction) => void;
  resetAll: () => void;
}

export const useShortcutStore = create<ShortcutStore>()((set) => ({
  shortcuts: loadShortcuts(),

  setShortcut: (action, binding) =>
    set((state) => {
      const updated = { ...state.shortcuts, [action]: binding };
      saveShortcuts(updated);
      return { shortcuts: updated };
    }),

  resetShortcut: (action) =>
    set((state) => {
      const updated = { ...state.shortcuts, [action]: DEFAULT_SHORTCUTS[action] };
      saveShortcuts(updated);
      return { shortcuts: updated };
    }),

  resetAll: () =>
    set(() => {
      const defaults = { ...DEFAULT_SHORTCUTS };
      saveShortcuts(defaults);
      return { shortcuts: defaults };
    }),
}));
