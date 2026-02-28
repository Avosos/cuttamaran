import { create } from "zustand";
import { v4 as uuidv4 } from "uuid";
import type {
  Track,
  TimelineClip,
  MediaFile,
  ClipType,
  CanvasSize,
  PanelTab,
} from "@/types/editor";

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
  selectedClipId: string | null;
  setSelectedClipId: (id: string | null) => void;
  getSelectedClip: () => TimelineClip | null;

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
  setProjectName: (name) => set({ projectName: name }),
  canvasSize: CANVAS_PRESETS[0],
  setCanvasSize: (size) => set({ canvasSize: size }),

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
  moveClip: (fromTrackId, toTrackId, clipId, newStartTime) =>
    set((state) => {
      get().pushHistory();
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
      return { history: newHistory, historyIndex: newHistory.length - 1 };
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
