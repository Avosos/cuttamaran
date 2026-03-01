import { create } from "zustand";
import { v4 as uuidv4 } from "uuid";
import type {
  Track,
  TimelineClip,
  MediaFile,
  ClipType,
  ClipEffect,
  CanvasSize,
  PanelTab,
} from "@/types/editor";

// ─── Project File Schema ────────────────────────────────
export interface ProjectFileData {
  version: 1;
  projectName: string;
  canvasSize: CanvasSize;
  tracks: Track[];
  mediaFiles: MediaFile[];
  duration: number;
  zoom: number;
  snapping: boolean;
  savedAt: string; // ISO timestamp
}

// ─── Default Canvas Presets ─────────────────────────────
export const CANVAS_PRESETS: CanvasSize[] = [
  { name: "16:9 Landscape", width: 1920, height: 1080 },
  { name: "9:16 Portrait", width: 1080, height: 1920 },
  { name: "1:1 Square", width: 1080, height: 1080 },
  { name: "4:5 Social", width: 1080, height: 1350 },
  { name: "4K Landscape", width: 3840, height: 2160 },
];

// ─── Store Interface ────────────────────────────────────
interface EditorStore {
  // Project
  projectName: string;
  setProjectName: (name: string) => void;
  canvasSize: CanvasSize;
  setCanvasSize: (size: CanvasSize) => void;
  projectFilePath: string | null;
  setProjectFilePath: (path: string | null) => void;
  dirty: boolean;
  markDirty: () => void;

  // Persistence
  saveProject: (forceDialog?: boolean) => Promise<boolean>;
  loadProject: (filePath?: string) => Promise<boolean>;
  getSerializableState: () => ProjectFileData;

  // Panels
  activeTab: PanelTab;
  setActiveTab: (tab: PanelTab) => void;
  propertiesPanelOpen: boolean;
  setPropertiesPanelOpen: (open: boolean) => void;

  // Media
  mediaFiles: MediaFile[];
  addMediaFile: (file: MediaFile) => void;
  removeMediaFile: (id: string) => void;

  // Tracks
  tracks: Track[];
  addTrack: (type: "video" | "audio") => void;
  removeTrack: (id: string) => void;
  toggleTrackMute: (id: string) => void;
  toggleTrackLock: (id: string) => void;
  toggleTrackVisibility: (id: string) => void;

  // Clips
  addClipToTrack: (trackId: string, clip: TimelineClip) => void;
  removeClip: (trackId: string, clipId: string) => void;
  updateClip: (
    trackId: string,
    clipId: string,
    updates: Partial<TimelineClip>
  ) => void;
  moveClip: (
    fromTrackId: string,
    toTrackId: string,
    clipId: string,
    newStartTime: number
  ) => void;
  splitClip: (trackId: string, clipId: string, splitTime: number) => void;
  duplicateClip: (trackId: string, clipId: string) => void;
  selectedClipId: string | null;
  setSelectedClipId: (id: string | null) => void;
  getSelectedClip: () => TimelineClip | null;

  // Effects
  addEffect: (trackId: string, clipId: string, effect: ClipEffect) => void;
  removeEffect: (trackId: string, clipId: string, effectId: string) => void;
  updateEffect: (trackId: string, clipId: string, effectId: string, updates: Partial<ClipEffect>) => void;

  // Playback
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  setIsPlaying: (playing: boolean) => void;
  togglePlayback: () => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;

  // Timeline
  zoom: number;
  setZoom: (zoom: number) => void;
  snapping: boolean;
  toggleSnapping: () => void;

  // Undo/Redo (simplified)
  history: Track[][];
  historyIndex: number;
  pushHistory: () => void;
  undo: () => void;
  redo: () => void;
}

// ─── Create Store ───────────────────────────────────────
export const useEditorStore = create<EditorStore>()((set, get) => ({
  // Project
  projectName: "Untitled Project",
  setProjectName: (name) => set({ projectName: name, dirty: true }),
  canvasSize: CANVAS_PRESETS[0],
  setCanvasSize: (size) => set({ canvasSize: size, dirty: true }),
  projectFilePath: null,
  setProjectFilePath: (path) => set({ projectFilePath: path }),
  dirty: false,
  markDirty: () => set({ dirty: true }),

  // ── Persistence ────────────────────────────────────────
  getSerializableState: () => {
    const s = get();
    return {
      version: 1 as const,
      projectName: s.projectName,
      canvasSize: s.canvasSize,
      tracks: s.tracks,
      mediaFiles: s.mediaFiles,
      duration: s.duration,
      zoom: s.zoom,
      snapping: s.snapping,
      savedAt: new Date().toISOString(),
    };
  },

  saveProject: async (forceDialog = false) => {
    const state = get();
    const data = state.getSerializableState();
    const filePath = forceDialog ? undefined : state.projectFilePath ?? undefined;
    try {
      const result = await window.electronAPI?.saveProject({ filePath, data: data as unknown as Record<string, unknown> });
      if (result?.ok && result.filePath) {
        set({ projectFilePath: result.filePath, dirty: false });
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },

  loadProject: async (filePath?: string) => {
    try {
      const api = window.electronAPI;
      const result = await api?.loadProject(
        filePath ? { filePath } : undefined
      );
      if (result?.ok && result.data) {
        const d = result.data as unknown as ProjectFileData;

        // Restore persistent media URLs from diskPath
        const mediaFiles = d.mediaFiles ?? [];
        const tracks = d.tracks ?? [];

        if (api) {
          // Build a map of mediaId → restored src URL
          const srcMap = new Map<string, string>();

          for (const mf of mediaFiles) {
            if (mf.diskPath) {
              const exists = await api.mediaFileExists(mf.diskPath);
              if (exists) {
                mf.src = await api.pathToMediaUrl(mf.diskPath);
                srcMap.set(mf.id, mf.src);
                // Restore image thumbnails from src
                if (mf.type === "image") {
                  mf.thumbnail = mf.src;
                }
              }
            }
          }

          // Also restore clip src references
          for (const track of tracks) {
            for (const clip of track.clips) {
              const restored = srcMap.get(clip.mediaId);
              if (restored) {
                clip.src = restored;
                if (clip.type === "image") {
                  clip.thumbnail = restored;
                }
              }
            }
          }
        }

        set({
          projectName: d.projectName ?? "Untitled Project",
          canvasSize: d.canvasSize ?? CANVAS_PRESETS[0],
          tracks,
          mediaFiles,
          duration: d.duration ?? 60,
          zoom: d.zoom ?? 1,
          snapping: d.snapping ?? true,
          projectFilePath: result.filePath ?? null,
          dirty: false,
          history: [],
          historyIndex: -1,
          selectedClipId: null,
          currentTime: 0,
          isPlaying: false,
        });
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },

  // Panels
  activeTab: "assets",
  setActiveTab: (tab) => set({ activeTab: tab }),
  propertiesPanelOpen: false,
  setPropertiesPanelOpen: (open) => set({ propertiesPanelOpen: open }),

  // Media
  mediaFiles: [],
  addMediaFile: (file) =>
    set((state) => ({ mediaFiles: [...state.mediaFiles, file] })),
  removeMediaFile: (id) =>
    set((state) => ({
      mediaFiles: state.mediaFiles.filter((f) => f.id !== id),
    })),

  // Tracks
  tracks: [
    {
      id: "video-1",
      name: "Video 1",
      type: "video",
      clips: [
        {
          id: "demo-clip-1",
          mediaId: "demo-1",
          type: "video",
          name: "Intro Sequence.mp4",
          trackId: "video-1",
          startTime: 0,
          duration: 8,
          trimStart: 0,
          trimEnd: 0,
          src: "",
          volume: 1,
          opacity: 1,
        },
        {
          id: "demo-clip-2",
          mediaId: "demo-2",
          type: "video",
          name: "Main Content.mp4",
          trackId: "video-1",
          startTime: 8,
          duration: 15,
          trimStart: 0,
          trimEnd: 0,
          src: "",
          volume: 1,
          opacity: 1,
        },
        {
          id: "demo-clip-6",
          mediaId: "demo-6",
          type: "video",
          name: "B-Roll.mp4",
          trackId: "video-1",
          startTime: 25,
          duration: 10,
          trimStart: 0,
          trimEnd: 0,
          src: "",
          volume: 1,
          opacity: 1,
        },
      ],
      muted: false,
      locked: false,
      height: 64,
      visible: true,
    },
    {
      id: "video-2",
      name: "Video 2",
      type: "video",
      clips: [
        {
          id: "demo-clip-3",
          mediaId: "demo-3",
          type: "text",
          name: "Title Card",
          trackId: "video-2",
          startTime: 1,
          duration: 4,
          trimStart: 0,
          trimEnd: 0,
          src: "",
          text: "CUTTAMARAN",
          fontSize: 72,
          fontFamily: "Inter",
          color: "#7c5cfc",
          volume: 1,
          opacity: 1,
        },
        {
          id: "demo-clip-7",
          mediaId: "demo-7",
          type: "text",
          name: "Lower Third",
          trackId: "video-2",
          startTime: 10,
          duration: 6,
          trimStart: 0,
          trimEnd: 0,
          src: "",
          text: "Professional Video Editor",
          fontSize: 32,
          fontFamily: "Inter",
          color: "#ffffff",
          backgroundColor: "rgba(124, 92, 252, 0.8)",
          volume: 1,
          opacity: 1,
        },
        {
          id: "demo-clip-8",
          mediaId: "demo-8",
          type: "image",
          name: "Overlay Graphic.png",
          trackId: "video-2",
          startTime: 26,
          duration: 8,
          trimStart: 0,
          trimEnd: 0,
          src: "",
          volume: 1,
          opacity: 0.8,
        },
      ],
      muted: false,
      locked: false,
      height: 64,
      visible: true,
    },
    {
      id: "audio-1",
      name: "Audio 1",
      type: "audio",
      clips: [
        {
          id: "demo-clip-4",
          mediaId: "demo-4",
          type: "audio",
          name: "Background Music.mp3",
          trackId: "audio-1",
          startTime: 0,
          duration: 35,
          trimStart: 0,
          trimEnd: 0,
          src: "",
          volume: 0.6,
          opacity: 1,
        },
      ],
      muted: false,
      locked: false,
      height: 48,
      visible: true,
    },
    {
      id: "audio-2",
      name: "Audio 2",
      type: "audio",
      clips: [
        {
          id: "demo-clip-5",
          mediaId: "demo-5",
          type: "audio",
          name: "Voiceover.wav",
          trackId: "audio-2",
          startTime: 2,
          duration: 20,
          trimStart: 0,
          trimEnd: 0,
          src: "",
          volume: 1,
          opacity: 1,
        },
        {
          id: "demo-clip-9",
          mediaId: "demo-9",
          type: "audio",
          name: "Sound FX.wav",
          trackId: "audio-2",
          startTime: 24,
          duration: 4,
          trimStart: 0,
          trimEnd: 0,
          src: "",
          volume: 0.8,
          opacity: 1,
        },
      ],
      muted: false,
      locked: false,
      height: 48,
      visible: true,
    },
  ],
  addTrack: (type) =>
    set((state) => {
      const trackCount = state.tracks.filter((t) => t.type === type).length;
      const newTrack: Track = {
        id: uuidv4(),
        name: `${type === "video" ? "Video" : "Audio"} ${trackCount + 1}`,
        type,
        clips: [],
        muted: false,
        locked: false,
        height: type === "video" ? 64 : 48,
        visible: true,
      };
      return { tracks: [...state.tracks, newTrack] };
    }),
  removeTrack: (id) =>
    set((state) => ({
      tracks: state.tracks.filter((t) => t.id !== id),
    })),
  toggleTrackMute: (id) =>
    set((state) => ({
      tracks: state.tracks.map((t) =>
        t.id === id ? { ...t, muted: !t.muted } : t
      ),
    })),
  toggleTrackLock: (id) =>
    set((state) => ({
      tracks: state.tracks.map((t) =>
        t.id === id ? { ...t, locked: !t.locked } : t
      ),
    })),
  toggleTrackVisibility: (id) =>
    set((state) => ({
      tracks: state.tracks.map((t) =>
        t.id === id ? { ...t, visible: !t.visible } : t
      ),
    })),

  // Clips
  addClipToTrack: (trackId, clip) =>
    set((state) => {
      get().pushHistory();
      return {
        tracks: state.tracks.map((t) =>
          t.id === trackId ? { ...t, clips: [...t.clips, clip] } : t
        ),
      };
    }),
  removeClip: (trackId, clipId) =>
    set((state) => {
      get().pushHistory();
      return {
        tracks: state.tracks.map((t) =>
          t.id === trackId
            ? { ...t, clips: t.clips.filter((c) => c.id !== clipId) }
            : t
        ),
        selectedClipId:
          state.selectedClipId === clipId ? null : state.selectedClipId,
      };
    }),
  updateClip: (trackId, clipId, updates) =>
    set((state) => ({
      tracks: state.tracks.map((t) =>
        t.id === trackId
          ? {
              ...t,
              clips: t.clips.map((c) =>
                c.id === clipId ? { ...c, ...updates } : c
              ),
            }
          : t
      ),
    })),
  addEffect: (trackId, clipId, effect) =>
    set((state) => {
      get().pushHistory();
      return {
        tracks: state.tracks.map((t) =>
          t.id === trackId
            ? {
                ...t,
                clips: t.clips.map((c) =>
                  c.id === clipId
                    ? { ...c, effects: [...(c.effects || []), effect] }
                    : c
                ),
              }
            : t
        ),
        dirty: true,
      };
    }),
  removeEffect: (trackId, clipId, effectId) =>
    set((state) => {
      get().pushHistory();
      return {
        tracks: state.tracks.map((t) =>
          t.id === trackId
            ? {
                ...t,
                clips: t.clips.map((c) =>
                  c.id === clipId
                    ? { ...c, effects: (c.effects || []).filter((e) => e.id !== effectId) }
                    : c
                ),
              }
            : t
        ),
        dirty: true,
      };
    }),
  updateEffect: (trackId, clipId, effectId, updates) =>
    set((state) => ({
      tracks: state.tracks.map((t) =>
        t.id === trackId
          ? {
              ...t,
              clips: t.clips.map((c) =>
                c.id === clipId
                  ? {
                      ...c,
                      effects: (c.effects || []).map((e) =>
                        e.id === effectId ? { ...e, ...updates } : e
                      ),
                    }
                  : c
              ),
            }
          : t
      ),
      dirty: true,
    })),
  moveClip: (fromTrackId, toTrackId, clipId, newStartTime) =>
    set((state) => {
      const fromTrack = state.tracks.find((t) => t.id === fromTrackId);
      const clip = fromTrack?.clips.find((c) => c.id === clipId);
      if (!clip) return state;

      const updatedClip = { ...clip, startTime: newStartTime, trackId: toTrackId };

      return {
        tracks: state.tracks.map((t) => {
          if (t.id === fromTrackId && fromTrackId !== toTrackId) {
            return { ...t, clips: t.clips.filter((c) => c.id !== clipId) };
          }
          if (t.id === toTrackId) {
            if (fromTrackId === toTrackId) {
              return {
                ...t,
                clips: t.clips.map((c) =>
                  c.id === clipId ? updatedClip : c
                ),
              };
            }
            return { ...t, clips: [...t.clips, updatedClip] };
          }
          return t;
        }),
        dirty: true,
      };
    }),
  splitClip: (trackId, clipId, splitTime) =>
    set((state) => {
      get().pushHistory();
      return {
        tracks: state.tracks.map((t) => {
          if (t.id !== trackId) return t;
          const clip = t.clips.find((c) => c.id === clipId);
          if (!clip) return t;

          const relativeTime = splitTime - clip.startTime;
          if (relativeTime <= 0.05 || relativeTime >= clip.duration - 0.05) return t;

          const leftClip: TimelineClip = {
            ...clip,
            duration: relativeTime,
            trimEnd: clip.trimEnd + (clip.duration - relativeTime),
          };
          const rightClip: TimelineClip = {
            ...clip,
            id: uuidv4(),
            startTime: splitTime,
            duration: clip.duration - relativeTime,
            trimStart: clip.trimStart + relativeTime,
          };
          return {
            ...t,
            clips: t.clips.map((c) => (c.id === clipId ? leftClip : c)).concat(rightClip),
          };
        }),
      };
    }),
  duplicateClip: (trackId, clipId) =>
    set((state) => {
      get().pushHistory();
      return {
        tracks: state.tracks.map((t) => {
          if (t.id !== trackId) return t;
          const clip = t.clips.find((c) => c.id === clipId);
          if (!clip) return t;
          const newClip: TimelineClip = {
            ...clip,
            id: uuidv4(),
            startTime: clip.startTime + clip.duration,
          };
          return { ...t, clips: [...t.clips, newClip] };
        }),
      };
    }),
  selectedClipId: null,
  setSelectedClipId: (id) => set({ selectedClipId: id, propertiesPanelOpen: id !== null }),
  getSelectedClip: () => {
    const state = get();
    for (const track of state.tracks) {
      const clip = track.clips.find((c) => c.id === state.selectedClipId);
      if (clip) return clip;
    }
    return null;
  },

  // Playback
  isPlaying: false,
  currentTime: 0,
  duration: 60,
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  togglePlayback: () => set((state) => ({ isPlaying: !state.isPlaying })),
  setCurrentTime: (time) => set({ currentTime: Math.max(0, time) }),
  setDuration: (duration) => set({ duration }),

  // Timeline
  zoom: 1,
  setZoom: (zoom) => set({ zoom: Math.max(0.1, Math.min(10, zoom)) }),
  snapping: true,
  toggleSnapping: () => set((state) => ({ snapping: !state.snapping })),

  // Undo/Redo
  history: [],
  historyIndex: -1,
  pushHistory: () =>
    set((state) => {
      const newHistory = [
        ...state.history.slice(0, state.historyIndex + 1),
        state.tracks.map((t) => ({ ...t, clips: [...t.clips] })),
      ];
      return { history: newHistory, historyIndex: newHistory.length - 1, dirty: true };
    }),
  undo: () =>
    set((state) => {
      if (state.historyIndex < 0) return state;
      return {
        tracks: state.history[state.historyIndex],
        historyIndex: state.historyIndex - 1,
      };
    }),
  redo: () =>
    set((state) => {
      if (state.historyIndex >= state.history.length - 1) return state;
      return {
        tracks: state.history[state.historyIndex + 1],
        historyIndex: state.historyIndex + 1,
      };
    }),
}));
