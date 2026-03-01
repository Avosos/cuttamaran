export type ClipType = "video" | "audio" | "image" | "text";

// ─── Clip Effects ────────────────────────────────────────
export type EffectType =
  | "fade_in"
  | "fade_out"
  | "cross_dissolve"
  | "blur"
  | "brightness"
  | "contrast"
  | "saturation"
  | "vignette";

export interface ClipEffect {
  id: string;
  type: EffectType;
  /** 0-1 normalized value (meaning depends on effect type) */
  value: number;
  /** Duration in seconds — only used by transitions (fade_in, fade_out, cross_dissolve) */
  duration?: number;
}

export interface MediaFile {
  id: string;
  name: string;
  type: ClipType;
  src: string;
  duration: number; // seconds
  thumbnail?: string;
  width?: number;
  height?: number;
  fileSize?: number;
  /** Absolute path on disk (inside project media/ folder) — persisted in .cutta */
  diskPath?: string;
}

export interface TimelineClip {
  id: string;
  mediaId: string;
  type: ClipType;
  name: string;
  trackId: string;
  startTime: number; // seconds on timeline
  duration: number;  // visible duration on timeline
  trimStart: number; // trim from beginning of source
  trimEnd: number;   // trim from end of source
  src: string;
  thumbnail?: string;
  volume?: number;
  opacity?: number;
  // Text properties
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  backgroundColor?: string;
  textAlign?: "left" | "center" | "right";
  fontWeight?: "normal" | "bold";
  fontStyle?: "normal" | "italic";
  textDecoration?: "none" | "underline";
  letterSpacing?: number;
  lineHeight?: number;
  strokeColor?: string;
  strokeWidth?: number;
  // Timeline appearance
  clipColor?: string;
  // Effects
  effects?: ClipEffect[];
}

export interface Track {
  id: string;
  name: string;
  type: "video" | "audio";
  clips: TimelineClip[];
  muted: boolean;
  locked: boolean;
  height: number;
  visible: boolean;
}

export interface CanvasSize {
  name: string;
  width: number;
  height: number;
  icon?: string;
}

export type PanelTab = "assets" | "text" | "audio" | "transitions" | "effects" | "stickers" | "library";

// ─── Library ─────────────────────────────────────────────
export type LibraryItemType = "clip" | "segment";

export interface LibraryItem {
  id: string;
  name: string;
  type: LibraryItemType;
  /** Category / tag for organisation */
  category: string;
  createdAt: number;
  /** For "clip": a single clip definition (without timeline position) */
  clip?: Omit<TimelineClip, "id" | "trackId" | "startTime">;
  /** For "segment": an array of track-snippets (multi-clip) */
  segment?: {
    tracks: {
      type: "video" | "audio";
      clips: Omit<TimelineClip, "id" | "trackId">[];
    }[];
    /** Total duration of the segment in seconds */
    duration: number;
  };
}

export interface EditorProject {
  id: string;
  name: string;
  canvasSize: CanvasSize;
  tracks: Track[];
  mediaFiles: MediaFile[];
  duration: number;
  fps: number;
  createdAt: Date;
  updatedAt: Date;
}
