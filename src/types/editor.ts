export type ClipType = "video" | "audio" | "image" | "text";

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

export type PanelTab = "assets" | "text" | "audio" | "transitions" | "effects" | "stickers";

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
